"use node";

/**
 * Convex actions that require Node.js runtime.
 * These actions use external npm packages like @fal-ai/client and @openrouter/sdk.
 */

import { v } from "convex/values";
import { LIMITS } from "@/src/lib/constants";
import type { LLMCallLogData } from "@/src/lib/llm-logger";
import {
  classifyDishType,
  extractMenuTheme,
  extractMenuWithVision,
  generateDishImage,
} from "@/src/lib/openrouter";
import {
  extractMenuArgsSchema,
  type MenuCategory,
  type MenuPayload,
} from "@/src/lib/validation";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalAction } from "./_generated/server";

/**
 * Validator for theme object passed to generateImagesParallel.
 * Note: LLMs sometimes return null for optional fields, so we use
 * v.optional(v.string()) which allows undefined. The theme extraction
 * code in openrouter.ts already converts null to undefined.
 */
const menuThemeValidator = v.object({
  cuisineType: v.string(),
  cuisineSubtype: v.optional(v.string()),
  presentationStyle: v.string(),
  plateDescription: v.string(),
  priceRange: v.union(
    v.literal("budget"),
    v.literal("mid-range"),
    v.literal("upscale"),
  ),
  // Optional fields for enhanced prompt generation
  surfaceMaterial: v.optional(v.string()),
  lightingStyle: v.optional(
    v.union(
      v.literal("natural"),
      v.literal("restaurant"),
      v.literal("bright"),
      v.literal("dramatic"),
    ),
  ),
  colorPalette: v.optional(v.array(v.string())),
});

/**
 * Selects the first N items across all categories for image generation.
 */
function selectItemsForImageGeneration(
  categories: MenuCategory[],
  maxImages: number,
): Array<{ key: string; name: string; description?: string; price?: string }> {
  const items: Array<{
    key: string;
    name: string;
    description?: string;
    price?: string;
  }> = [];

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
        price: item.price,
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
    menu: MenuPayload;
  }> => {
    const { imageBase64 } = extractMenuArgsSchema.parse(args);

    // Phase 1: Fast extraction with logging
    const { result: menu, logData: menuLogData } = await extractMenuWithVision(
      imageBase64,
      { sessionId: args.sessionId },
    );

    const { result: theme, logData: themeLogData } = await extractMenuTheme(
      menu,
      { sessionId: args.sessionId },
    );

    // Save menu immediately (without images)
    const { menuId } = await ctx.runMutation(internal.menus.saveMenuInternal, {
      sessionId: args.sessionId,
      menu,
    });

    // Save LLM call logs
    if (menuLogData) {
      await ctx.runMutation(internal.llmCalls.saveLLMCall, {
        ...menuLogData,
        menuId,
      });
    }
    if (themeLogData) {
      await ctx.runMutation(internal.llmCalls.saveLLMCall, {
        ...themeLogData,
        menuId,
      });
    }

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

          // Classify dish type for better prompt generation
          const dishType = classifyDishType(item.name, item.description);

          // Generate image with dish type
          const { result: imageUrl, logData } = await generateDishImage(
            {
              name: item.name,
              description: item.description,
              price: item.price,
              theme: args.theme,
              dishType,
            },
            { sessionId: args.sessionId, menuId: args.menuId },
          );

          // Save log
          if (logData) {
            await ctx.runMutation(internal.llmCalls.saveLLMCall, logData);
          }

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

          // Save the failure log if available
          const errWithLog = error as { logData?: LLMCallLogData };
          if (errWithLog.logData) {
            await ctx.runMutation(
              internal.llmCalls.saveLLMCall,
              errWithLog.logData,
            );
          }

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
