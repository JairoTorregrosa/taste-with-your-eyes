import { z } from "zod";
export const menuItemSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.string().optional(),
  confidence: z.number().optional(),
  imageUrl: z.string().optional(),
});

export const menuCategorySchema = z.object({
  name: z.string(),
  items: z.array(menuItemSchema),
});

export const menuBrandingSchema = z.object({
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
});

export const menuPayloadSchema = z.object({
  restaurantName: z.string().optional(),
  branding: menuBrandingSchema.optional(),
  categories: z.array(menuCategorySchema),
  imageBase64: z.string().optional(),
});

export const extractMenuArgsSchema = z.object({
  sessionId: z.string(),
  imageBase64: z.string(),
});

export const saveMenuArgsSchema = z.object({
  sessionId: z.string(),
  menu: menuPayloadSchema,
});

export type MenuItem = z.infer<typeof menuItemSchema>;
export type MenuCategory = z.infer<typeof menuCategorySchema>;
export type MenuPayload = z.infer<typeof menuPayloadSchema>;
export type ExtractMenuArgs = z.infer<typeof extractMenuArgsSchema>;
export type SaveMenuArgs = z.infer<typeof saveMenuArgsSchema>;
