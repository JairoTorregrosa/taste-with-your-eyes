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

    let deleted = 0;
    for (const menu of oldMenus) {
      await ctx.db.delete(menu._id);
      deleted++;
    }

    return { deleted, cutoffDate: new Date(cutoff).toISOString() };
  },
});
