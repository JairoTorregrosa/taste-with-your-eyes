import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  menus: defineTable({
    sessionId: v.string(),
    restaurantName: v.optional(v.string()),
    branding: v.optional(
      v.object({
        primaryColor: v.optional(v.string()),
        accentColor: v.optional(v.string()),
      }),
    ),
    categories: v.array(
      v.object({
        name: v.string(),
        items: v.array(
          v.object({
            name: v.string(),
            description: v.optional(v.string()),
            price: v.optional(v.string()),
            confidence: v.optional(v.number()),
          }),
        ),
      }),
    ),
    imageBase64: v.optional(v.string()),
    totalItems: v.number(),
    totalCategories: v.number(),
    hasRestaurantName: v.boolean(),
    hasBranding: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_created_at", ["createdAt"])
    .index("by_restaurant", ["restaurantName"])
    .index("by_has_restaurant", ["hasRestaurantName"]),
});
