import { internalMutation } from "./_generated/server";

/**
 * Admin-only: Clear all menus from the database.
 * Only callable from Convex dashboard, scheduled jobs, or other internal functions.
 * NOT accessible from the client API.
 */
export const clearAllMenus = internalMutation({
  args: {},
  handler: async (ctx) => {
    const menus = await ctx.db.query("menus").collect();
    let deleted = 0;

    for (const menu of menus) {
      await ctx.db.delete(menu._id);
      deleted++;
    }

    return { deleted };
  },
});

/**
 * Admin-only: Clean up menus older than 30 days.
 * Also cleans up associated imageGenerations records.
 * Intended for scheduled cleanup jobs.
 */
export const cleanupOldMenus = internalMutation({
  args: {},
  handler: async (ctx) => {
    const RETENTION_DAYS = 30;
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;

    const oldMenus = await ctx.db
      .query("menus")
      .withIndex("by_created_at")
      .filter((q) => q.lt(q.field("createdAt"), cutoff))
      .collect();

    let deletedMenus = 0;
    let deletedImages = 0;

    for (const menu of oldMenus) {
      // Delete associated image generation records first
      const imageRecords = await ctx.db
        .query("imageGenerations")
        .withIndex("by_menu", (q) => q.eq("menuId", menu._id))
        .collect();

      for (const record of imageRecords) {
        await ctx.db.delete(record._id);
        deletedImages++;
      }

      // Then delete the menu
      await ctx.db.delete(menu._id);
      deletedMenus++;
    }

    return {
      deletedMenus,
      deletedImages,
      cutoffDate: new Date(cutoff).toISOString(),
    };
  },
});

/**
 * Admin-only: Clean up image generation records older than 1 day.
 * Images expire in 24h anyway (fal.ai URLs).
 */
export const cleanupOldImageRecords = internalMutation({
  args: {},
  handler: async (ctx) => {
    const RETENTION_DAYS = 1;
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;

    const oldRecords = await ctx.db
      .query("imageGenerations")
      .filter((q) => q.lt(q.field("createdAt"), cutoff))
      .collect();

    let deleted = 0;
    for (const record of oldRecords) {
      await ctx.db.delete(record._id);
      deleted++;
    }

    return { deleted };
  },
});
