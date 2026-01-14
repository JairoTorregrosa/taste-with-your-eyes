"use node";

/**
 * Convex actions that require Node.js runtime.
 * These actions use external npm packages like @fal-ai/client and @openrouter/sdk.
 */

import { v } from "convex/values";
import { LIMITS } from "@/src/lib/constants";
import {
  extractMenuTheme,
  extractMenuWithVision,
  generateDishImage,
} from "@/src/lib/openrouter";
import { extractMenuArgsSchema, type MenuCategory } from "@/src/lib/validation";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalAction } from "./_generated/server";

const menuThemeValidator = v.object({
  cuisineType: v.string(),
  style: v.string(),
  ambiance: v.string(),
  colorPalette: v.optional(v.string()),
  culturalContext: v.optional(v.string()),
});

/**
 * Selects the first N items across all categories for image generation.
 */
function selectItemsForImageGeneration(
  categories: MenuCategory[],
  maxImages: number,
): Array<{ key: string; name: string; description?: string }> {
  const items: Array<{ key: string; name: string; description?: string }> = [];

  for (
    let catIndex = 0;
    catIndex < categories.length && items.length < maxImages;
    catIndex++
  ) {
    const cat = categories[catIndex];
    for (
      let itemIndex = 0;
      itemIndex < cat.items.length && items.length < maxImages;
      itemIndex++
    ) {
      const item = cat.items[itemIndex];
      items.push({
        key: `cat:${catIndex}:item:${itemIndex}`,
        name: item.name,
        description: item.description,
      });
    }
  }

  return items;
}

/**
 * Main action to extract menu from image.
 * Runs in Node.js runtime to use vision API.
 */
export const extractMenuFromImage = action({
  args: { sessionId: v.string(), imageBase64: v.string() },
  handler: async (
    ctx,
    args,
  ): Promise<{
    menuId: Id<"menus">;
    menu: ReturnType<typeof extractMenuWithVision> extends Promise<infer T>
      ? T
      : never;
  }> => {
    const { imageBase64 } = extractMenuArgsSchema.parse(args);

    // Phase 1: Fast extraction
    const menu = await extractMenuWithVision(imageBase64);
    const theme = await extractMenuTheme(menu);

    // Save menu immediately (without images)
    const { menuId } = await ctx.runMutation(internal.menus.saveMenuInternal, {
      sessionId: args.sessionId,
      menu,
    });

    // Schedule parallel image generation (runs in background)
    await ctx.scheduler.runAfter(
      0,
      internal.menuActions.generateImagesParallel,
      {
        menuId,
        sessionId: args.sessionId,
        theme,
      },
    );

    return { menuId, menu };
  },
});

/**
 * Internal action to generate images in parallel.
 * Runs in Node.js runtime to use fal.ai API.
 */
export const generateImagesParallel = internalAction({
  args: {
    menuId: v.id("menus"),
    sessionId: v.string(),
    theme: v.optional(menuThemeValidator),
  },
  handler: async (ctx, args) => {
    // Get menu from database
    const menu = await ctx.runQuery(internal.menus.getMenuByIdInternal, {
      menuId: args.menuId,
    });
    if (!menu) {
      console.error(`[generateImagesParallel] Menu not found: ${args.menuId}`);
      return;
    }

    // Select first N items for image generation
    const itemsToGenerate = selectItemsForImageGeneration(
      menu.categories,
      LIMITS.MAX_IMAGES_PER_MENU,
    );

    if (itemsToGenerate.length === 0) {
      return;
    }

    // Create pending records for all items
    await ctx.runMutation(internal.menus.createPendingImageRecords, {
      menuId: args.menuId,
      sessionId: args.sessionId,
      items: itemsToGenerate.map(({ key, name }) => ({ key, name })),
    });

    // Generate all images in parallel
    await Promise.allSettled(
      itemsToGenerate.map(async (item) => {
        try {
          // Update status to "generating"
          await ctx.runMutation(internal.menus.updateImageStatus, {
            menuId: args.menuId,
            itemKey: item.key,
            status: "generating",
          });

          // Generate image
          const imageUrl = await generateDishImage({
            name: item.name,
            description: item.description,
            theme: args.theme,
          });

          // Update status to "completed" with URL
          await ctx.runMutation(internal.menus.updateImageStatus, {
            menuId: args.menuId,
            itemKey: item.key,
            status: "completed",
            imageUrl,
          });
        } catch (error) {
          console.error(
            `[generateImagesParallel] Error generating image for ${item.name}:`,
            error instanceof Error ? error.message : error,
          );
          // Update status to "failed"
          await ctx.runMutation(internal.menus.updateImageStatus, {
            menuId: args.menuId,
            itemKey: item.key,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }),
    );
  },
});
