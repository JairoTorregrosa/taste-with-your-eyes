import { actionGeneric } from "convex/server";
import { v } from "convex/values";
import { LIMITS } from "@/src/lib/constants";
import {
  extractMenuTheme,
  extractMenuWithVision,
  generateDishImage,
  type MenuTheme,
} from "@/src/lib/openrouter";
import {
  extractMenuArgsSchema,
  type MenuCategory,
  menuPayloadSchema,
  saveMenuArgsSchema,
} from "@/src/lib/validation";
import { mutation, query } from "./_generated/server";

const menuItemValidator = v.object({
  name: v.string(),
  description: v.optional(v.string()),
  price: v.optional(v.string()),
  confidence: v.optional(v.float64()),
  imageUrl: v.optional(v.string()),
  imageAlt: v.optional(v.string()),
});

const menuCategoryValidator = v.object({
  name: v.string(),
  items: v.array(menuItemValidator),
});

const menuBrandingValidator = v.object({
  primaryColor: v.optional(v.string()),
  accentColor: v.optional(v.string()),
});

const menuPayloadValidator = v.object({
  restaurantName: v.optional(v.string()),
  branding: v.optional(menuBrandingValidator),
  categories: v.array(menuCategoryValidator),
  imageBase64: v.optional(v.string()),
});

function truncateMenuData(
  menu: {
    restaurantName?: string;
    branding?: { primaryColor?: string; accentColor?: string };
    categories: Array<{
      name: string;
      items: Array<{
        name: string;
        description?: string;
        price?: string;
        confidence?: number;
      }>;
    }>;
  },
  maxItemsPerCategory = 15,
  maxTotalItems = 50,
): typeof menu {
  let truncated = {
    ...menu,
    restaurantName: menu.restaurantName
      ? menu.restaurantName.slice(0, 80)
      : undefined,
    categories: menu.categories.map((cat) => ({
      ...cat,
      name: cat.name.slice(0, 40),
      items: cat.items.slice(0, maxItemsPerCategory).map((item) => ({
        ...item,
        name: item.name.slice(0, 60),
        description: item.description
          ? item.description.slice(0, 120)
          : undefined,
        price: item.price ? item.price.slice(0, 30) : undefined,
      })),
    })),
  };

  const totalItems = truncated.categories.reduce(
    (sum, cat) => sum + cat.items.length,
    0,
  );

  if (totalItems > maxTotalItems) {
    const allItems: Array<{
      categoryIndex: number;
      item: {
        name: string;
        description?: string;
        price?: string;
        confidence?: number;
      };
    }> = [];
    for (let i = 0; i < truncated.categories.length; i++) {
      for (const item of truncated.categories[i].items) {
        allItems.push({ categoryIndex: i, item });
      }
    }

    const limitedItems = allItems.slice(0, maxTotalItems);
    const categoryItems: Array<{
      name: string;
      items: Array<{
        name: string;
        description?: string;
        price?: string;
        confidence?: number;
      }>;
    }> = truncated.categories.map((cat) => ({ name: cat.name, items: [] }));
    for (const { categoryIndex, item } of limitedItems) {
      categoryItems[categoryIndex].items.push(item);
    }

    truncated = {
      ...truncated,
      categories: categoryItems as typeof truncated.categories,
    };
  }

  return truncated;
}

export const extractMenuFromImage = actionGeneric({
  args: { sessionId: v.string(), imageBase64: v.string() },
  handler: async (_ctx, args) => {
    const { imageBase64 } = extractMenuArgsSchema.parse(args);
    const menu = await extractMenuWithVision(imageBase64);
    const theme = await extractMenuTheme(menu);
    const categories = await enrichWithImages(menu.categories, theme);
    return { menu: { ...menu, categories } };
  },
});

export const saveMenu = mutation({
  args: { sessionId: v.string(), menu: menuPayloadValidator },
  handler: async (ctx, args) => {
    // Delete only this session's existing menus (not all menus!)
    const existingMenus = await ctx.db
      .query("menus")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    for (const menu of existingMenus) {
      await ctx.db.delete(menu._id);
    }

    const { menu, sessionId } = saveMenuArgsSchema.parse(args);
    const now = Date.now();
    const { imageBase64: _, ...menuWithoutImage } = menu;

    const menuWithoutImages = {
      ...menuWithoutImage,
      categories: menuWithoutImage.categories.map((cat) => ({
        ...cat,
        items: cat.items.map(({ imageUrl: _, ...item }) => item),
      })),
    };

    const maxSizeBytes = LIMITS.MAX_DOCUMENT_SIZE_BYTES;
    let truncatedMenu = truncateMenuData(menuWithoutImages);
    let reductionFactor = 1.0;
    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      const totalItems = truncatedMenu.categories.reduce(
        (sum, cat) => sum + cat.items.length,
        0,
      );
      const totalCategories = truncatedMenu.categories.length;
      const hasRestaurantName = !!truncatedMenu.restaurantName;
      const hasBranding = !!truncatedMenu.branding;

      const documentToInsert = {
        sessionId,
        ...truncatedMenu,
        totalItems,
        totalCategories,
        hasRestaurantName,
        hasBranding,
        createdAt: now,
        updatedAt: now,
      };

      const estimatedSize = JSON.stringify(documentToInsert).length;

      if (estimatedSize <= maxSizeBytes) {
        break;
      }

      reductionFactor *= 0.8;
      const newMaxItemsPerCategory = Math.max(
        5,
        Math.floor(30 * reductionFactor),
      );
      const newMaxTotalItems = Math.max(20, Math.floor(100 * reductionFactor));

      truncatedMenu = truncateMenuData(
        menuWithoutImages,
        newMaxItemsPerCategory,
        newMaxTotalItems,
      );
      iterations++;
    }

    const totalItems = truncatedMenu.categories.reduce(
      (sum, cat) => sum + cat.items.length,
      0,
    );
    const totalCategories = truncatedMenu.categories.length;
    const hasRestaurantName = !!truncatedMenu.restaurantName;
    const hasBranding = !!truncatedMenu.branding;

    const documentToInsert = {
      sessionId,
      ...truncatedMenu,
      totalItems,
      totalCategories,
      hasRestaurantName,
      hasBranding,
      createdAt: now,
      updatedAt: now,
    };

    const finalEstimatedSize = JSON.stringify(documentToInsert).length;
    const finalSizeInMiB = finalEstimatedSize / (1024 * 1024);

    if (finalEstimatedSize > maxSizeBytes) {
      throw new Error(
        `Menu data is too large (estimated ${finalSizeInMiB.toFixed(2)} MiB > ${(maxSizeBytes / (1024 * 1024)).toFixed(2)} MiB safe limit) even after ${iterations} reduction iterations. Please reduce the number of items or descriptions.`,
      );
    }

    const id = await ctx.db.insert("menus", documentToInsert);
    return { id, createdAt: now };
  },
});

export const getMenuById = query({
  args: { menuId: v.id("menus"), sessionId: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.menuId);
    if (!doc || doc.sessionId !== args.sessionId) return null;

    const result = menuPayloadSchema.safeParse({
      restaurantName: doc.restaurantName,
      branding: doc.branding,
      categories: doc.categories,
    });
    return result.success
      ? {
          id: doc._id,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          ...result.data,
        }
      : null;
  },
});

const enrichWithImages = async (
  categories: MenuCategory[],
  theme?: MenuTheme,
) => {
  const result = categories.map((cat) => ({
    ...cat,
    items: cat.items.map((item) => ({ ...item })),
  }));

  let count = 0;

  for (const cat of result) {
    for (const item of cat.items) {
      if (item.imageUrl || count >= LIMITS.MAX_IMAGES_PER_CATEGORY) continue;
      count++;

      try {
        const url = await generateDishImage({
          name: item.name,
          description: item.description,
          theme,
        });
        item.imageUrl = url;
      } catch (error) {
        console.error(`Failed to generate image for "${item.name}":`, error);
      }
    }
  }

  return result;
};
