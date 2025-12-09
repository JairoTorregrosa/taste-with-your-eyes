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
import { actionGeneric, mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const menuItemValidator = v.object({
    name: v.string(),
    description: v.optional(v.string()),
    price: v.optional(v.string()),
    confidence: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
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

function truncateMenuData(menu: {
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
}): typeof menu {
    return {
        ...menu,
        restaurantName: menu.restaurantName
            ? menu.restaurantName.slice(0, 200)
            : undefined,
        categories: menu.categories.map((cat) => ({
            ...cat,
            name: cat.name.slice(0, 100),
            items: cat.items.map((item) => ({
                ...item,
                name: item.name.slice(0, 150),
                description: item.description
                    ? item.description.slice(0, 500)
                    : undefined,
            })),
        })),
    };
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

export const saveMenu = mutationGeneric({
    args: { sessionId: v.string(), menu: menuPayloadValidator },
    handler: async (ctx, args) => {
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

        const truncatedMenu = truncateMenuData(menuWithoutImages);

        const totalItems = truncatedMenu.categories.reduce(
            (sum, cat) => sum + cat.items.length,
            0,
        );
        const totalCategories = truncatedMenu.categories.length;
        const hasRestaurantName = !!truncatedMenu.restaurantName;
        const hasBranding = !!truncatedMenu.branding;

        const id = await ctx.db.insert("menus", {
            sessionId,
            ...truncatedMenu,
            totalItems,
            totalCategories,
            hasRestaurantName,
            hasBranding,
            createdAt: now,
            updatedAt: now,
        });
        return { id, createdAt: now };
    },
});

export const getMenuById = queryGeneric({
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

export const getMenuStats = queryGeneric({
    args: {},
    handler: async (ctx) => {
        const menus = await ctx.db.query("menus").collect();
        const totalMenus = menus.length;
        const totalItems = menus.reduce((sum, m) => sum + m.totalItems, 0);
        const totalCategories = menus.reduce(
            (sum, m) => sum + m.totalCategories,
            0,
        );
        const menusWithRestaurant = menus.filter((m) => m.hasRestaurantName)
            .length;
        const menusWithBranding = menus.filter((m) => m.hasBranding).length;

        return {
            totalMenus,
            totalItems,
            totalCategories,
            menusWithRestaurant,
            menusWithBranding,
            avgItemsPerMenu:
                totalMenus > 0 ? Math.round(totalItems / totalMenus) : 0,
            avgCategoriesPerMenu:
                totalMenus > 0
                    ? Math.round(totalCategories / totalMenus)
                    : 0,
        };
    },
});

export const getMenusByTimeRange = queryGeneric({
    args: {
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { startTime, endTime } = args;
        const allMenus = await ctx.db
            .query("menus")
            .withIndex("by_created_at")
            .order("desc")
            .collect();

        const filtered = allMenus.filter((m) => {
            if (startTime !== undefined && m.createdAt < startTime) return false;
            if (endTime !== undefined && m.createdAt > endTime) return false;
            return true;
        });

        return filtered.map((m) => ({
            id: m._id,
            restaurantName: m.restaurantName,
            totalItems: m.totalItems,
            totalCategories: m.totalCategories,
            createdAt: m.createdAt,
        }));
    },
});

export const getMenusByRestaurant = queryGeneric({
    args: {
        restaurantName: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { restaurantName, limit = 10 } = args;
        const menus = await ctx.db
            .query("menus")
            .withIndex("by_restaurant", (q) =>
                q.eq("restaurantName", restaurantName),
            )
            .order("desc")
            .take(limit);

        return menus.map((m) => ({
            id: m._id,
            restaurantName: m.restaurantName,
            totalItems: m.totalItems,
            totalCategories: m.totalCategories,
            createdAt: m.createdAt,
        }));
    },
});

export const getTopRestaurants = queryGeneric({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { limit = 10 } = args;
        const menus = await ctx.db
            .query("menus")
            .withIndex("by_has_restaurant", (q) =>
                q.eq("hasRestaurantName", true),
            )
            .collect();

        const restaurantCounts = new Map<string, number>();
        for (const menu of menus) {
            if (menu.restaurantName) {
                const count = restaurantCounts.get(menu.restaurantName) || 0;
                restaurantCounts.set(menu.restaurantName, count + 1);
            }
        }

        const sorted = Array.from(restaurantCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([name, count]) => ({ name, count }));

        return sorted;
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
    const tasks: Promise<void>[] = [];

    for (const cat of result) {
        for (const item of cat.items) {
            if (item.imageUrl || count >= 1) continue;
            count++;
            tasks.push(
                generateDishImage({
                    name: item.name,
                    description: item.description,
                    theme,
                }).then((url) => {
                    item.imageUrl = url;
                }),
            );
        }
    }

    await Promise.all(tasks);
    return result;
};
