import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  menus: defineTable({
    // Identity
    sessionId: v.string(),
    userId: v.optional(v.string()), // Future: Convex Auth user ID

    // Content
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
            confidence: v.optional(v.float64()),
            imageUrl: v.optional(v.string()),
            imageAlt: v.optional(v.string()), // Accessibility
          }),
        ),
      }),
    ),

    // Metadata
    totalItems: v.float64(),
    totalCategories: v.float64(),
    hasRestaurantName: v.boolean(),
    hasBranding: v.boolean(),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index("by_session", ["sessionId"])
    .index("by_created_at", ["createdAt"]),
  // Removed unused indexes: by_restaurant, by_has_restaurant
});
