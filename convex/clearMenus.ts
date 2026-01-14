import { mutation } from "./_generated/server";

export const clearAllMenus = mutation({
  args: {},
  handler: async (ctx) => {
    const menus = await ctx.db.query("menus").collect();
    for (const menu of menus) {
      await ctx.db.delete(menu._id);
    }
    return { deleted: menus.length };
  },
});