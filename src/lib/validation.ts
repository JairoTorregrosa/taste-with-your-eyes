import { z } from "zod";

/**
 * Helper to handle null values from LLM responses.
 * LLMs often return null instead of omitting the field.
 */
const nullToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => (val === null ? undefined : val), schema);

export const menuItemSchema = z
  .object({
    name: z.string(),
    description: nullToUndefined(z.string().optional()),
    price: nullToUndefined(z.string().optional()),
    imageUrl: nullToUndefined(z.string().optional()),
  })
  .strip(); // Explicitly strip unknown fields from LLM response

export const menuCategorySchema = z
  .object({
    name: z.preprocess(
      (val) => (val === null || val === undefined ? "Other" : val),
      z.string(),
    ),
    items: z.array(menuItemSchema),
  })
  .strip();

export const menuBrandingSchema = z
  .object({
    primaryColor: nullToUndefined(z.string().optional()),
    accentColor: nullToUndefined(z.string().optional()),
  })
  .strip();

export const menuPayloadSchema = z
  .object({
    restaurantName: nullToUndefined(z.string().optional()),
    branding: nullToUndefined(menuBrandingSchema.optional()),
    categories: z.array(menuCategorySchema),
    imageBase64: nullToUndefined(z.string().optional()),
  })
  .strip();

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
