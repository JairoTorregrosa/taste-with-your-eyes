import { fal } from "@fal-ai/client";
import { OpenRouter } from "@openrouter/sdk";
import type { Id } from "@/convex/_generated/dataModel";
import {
  CAMERA_CONFIG,
  DISH_TYPE_KEYWORDS,
  DISH_TYPE_RULES,
  type DishType,
  LIGHTING_CONFIG,
  NEGATIVE_CONSTRAINTS,
  REALISM_MARKERS,
  SURFACE_CONFIG,
} from "@/src/lib/image-prompt-config";
import {
  type LLMCallLogData,
  safeStringify,
  startLLMCall,
} from "@/src/lib/llm-logger";
import { type MenuPayload, menuPayloadSchema } from "@/src/lib/validation";

export type { DishType } from "@/src/lib/image-prompt-config";

export interface LogContext {
  sessionId: string;
  menuId?: Id<"menus">;
}

const OCR_MODEL_ID = "google/gemini-2.5-flash";

const MENU_EXTRACTION_SYSTEM_PROMPT = `You help people at restaurants visualize dishes from text-only menus. Extract each dish so we can generate a realistic image of how it will look when served.

<output_format>
Return valid JSON only:
{
  "restaurantName": "string or null if not visible",
  "branding": {
    "primaryColor": "#hex or null",
    "accentColor": "#hex or null"
  },
  "categories": [
    {
      "name": "section name",
      "items": [
        {
          "name": "complete dish name",
          "description": "ingredients, preparation method, accompaniments",
          "price": "as shown (e.g., $12.99)"
        }
      ]
    }
  ]
}
</output_format>

<main_rule>
Each dish name must be complete enough to visualize. When you see variants under a category, create full names:
- "Tacos: Pastor, Carnitas, Bistec" becomes: "Tacos al Pastor", "Tacos de Carnitas", "Tacos de Bistec"
- "Pizza - Pepperoni, Margherita" becomes: "Pizza de Pepperoni", "Pizza Margherita"
- "Ice Cream (Vanilla, Chocolate)" becomes: "Vanilla Ice Cream", "Chocolate Ice Cream"
</main_rule>

<preserve_details>
Keep details that affect how the dish looks:
- Cooking method: "grilled", "fried", "baked", "steamed"
- Presentation: "in a molcajete", "on a sizzling skillet", "in a clay pot"
- Accompaniments: "with rice and beans", "served with fries"
- Size/portions: "6pc", "12oz", "serves 2"
</preserve_details>

<do_not_extract>
- Section headers alone ("APPETIZERS", "DRINKS")
- Add-on modifiers ("Add bacon +$2")
- Placeholder text ("...", "and more")
</do_not_extract>

<error_handling>
If the image is blurry, not a menu, or unreadable, return:
{ "restaurantName": null, "branding": null, "categories": [] }
Do not invent dishes.
</error_handling>`;

const MENU_EXTRACTION_USER_PROMPT =
  "Extract all menu items from this image. Create complete dish names for variant lists (e.g., 'Tacos: Chicken, Beef' becomes 'Chicken Tacos', 'Beef Tacos').";

function cleanJsonResponse(content: string): string {
  let cleaned = content.trim();

  const codeBlockRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/;
  const match = cleaned.match(codeBlockRegex);
  if (match) {
    cleaned = match[1].trim();
  }

  return cleaned;
}

export interface MenuTheme {
  cuisineType: string;
  cuisineSubtype?: string;
  presentationStyle: string;
  plateDescription: string;
  priceRange: "budget" | "mid-range" | "upscale";
  // NEW optional fields for enhanced prompts
  surfaceMaterial?: string;
  lightingStyle?: "natural" | "restaurant" | "bright" | "dramatic";
  colorPalette?: string[];
}

const getApiKey = () => {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set");
  return key;
};

const getFalKey = () => {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("FAL_KEY not set");
  return key;
};

export async function extractMenuWithVision(
  imageBase64: string,
  logContext?: LogContext,
): Promise<{ result: MenuPayload; logData?: LLMCallLogData }> {
  const openrouter = new OpenRouter({ apiKey: getApiKey() });
  const imageUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/png;base64,${imageBase64}`;

  const callCtx = logContext
    ? startLLMCall({
        sessionId: logContext.sessionId,
        menuId: logContext.menuId,
        operation: "menu_extraction",
        provider: "openrouter",
        model: OCR_MODEL_ID,
        inputPrompt: MENU_EXTRACTION_USER_PROMPT,
        inputSystemPrompt: MENU_EXTRACTION_SYSTEM_PROMPT,
        inputMetadata: {
          imageBase64Length: imageBase64.length,
          temperature: 0.1,
        },
      })
    : null;

  try {
    const response = await openrouter.chat.send({
      model: OCR_MODEL_ID,
      temperature: 0.1,
      responseFormat: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: MENU_EXTRACTION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            { type: "text", text: MENU_EXTRACTION_USER_PROMPT },
            { type: "image_url", imageUrl: { url: imageUrl } },
          ],
        },
      ],
    });

    const content =
      typeof response.choices?.[0]?.message?.content === "string"
        ? response.choices[0].message.content
        : "";

    if (!content) {
      throw new Error("Empty response from OpenRouter API");
    }

    const cleanedContent = cleanJsonResponse(content);
    const parsed = JSON.parse(cleanedContent);
    const result = menuPayloadSchema.safeParse(parsed);

    if (!result.success) {
      throw new Error(`Invalid menu data: ${result.error.message}`);
    }

    const logData = callCtx?.complete({
      success: true,
      outputRaw: content,
      outputParsed: safeStringify(result.data),
      tokenUsage: response.usage
        ? {
            promptTokens: response.usage.promptTokens,
            completionTokens: response.usage.completionTokens,
            totalTokens: response.usage.totalTokens,
          }
        : undefined,
    });
    return { result: result.data, logData };
  } catch (error) {
    const logData = callCtx?.complete({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    if (error instanceof Error) {
      console.error("Menu extraction failed:", error.message);
      throw Object.assign(
        new Error(`Failed to extract menu: ${error.message}`),
        { logData },
      );
    }
    throw error;
  }
}

export async function extractMenuTheme(
  menu: MenuPayload,
  logContext?: LogContext,
): Promise<{ result: MenuTheme; logData?: LLMCallLogData }> {
  const openrouter = new OpenRouter({ apiKey: getApiKey() });

  const menuContext = {
    restaurantName: menu.restaurantName || "Unknown",
    categories: menu.categories.map((cat) => ({
      name: cat.name,
      items: cat.items.map((item) => ({
        name: item.name,
        description: item.description || "",
        price: item.price || "",
      })),
    })),
    branding: menu.branding,
  };

  const userPrompt = `Analyze this menu and determine how the food should look when served:\n\n${JSON.stringify(menuContext, null, 2)}`;

  const systemPrompt = `Analyze this menu to determine how the food will look when served. Your output helps generate realistic images of dishes.

<output_format>
Return valid JSON:
{
  "cuisineType": "primary cuisine (Mexican, Italian, Japanese, American, Thai, etc.)",
  "cuisineSubtype": "regional style if specific (Oaxacan, Neapolitan, Sichuan, etc.) or null",
  "presentationStyle": "how food is typically plated (see examples below)",
  "plateDescription": "GENERIC plating style for this cuisine (plate type, garnish style, sauce presentation) - DO NOT mention any specific dish name or ingredients, keep it applicable to any dish from this menu",
  "priceRange": "budget | mid-range | upscale (infer from prices)"
}
</output_format>

<presentation_examples>
Infer presentation style from cuisine + price:

Taquería ($3-8 tacos):
- presentationStyle: "street food authentic"
- plateDescription: "one taco on a small plate, onion, cilantro, lime wedge on the side, salsa in a small cup"

Upscale Mexican ($18-30 entrees):
- presentationStyle: "modern elevated"
- plateDescription: "single plated entree on dark slate or ceramic, microgreens, sauce swooshes"

Italian Trattoria ($15-25 pastas):
- presentationStyle: "generous family-style"
- plateDescription: "large white bowl with a single pasta portion, fresh basil, parmesan shavings"

Fine Dining Italian ($30+ plates):
- presentationStyle: "refined minimalist"
- plateDescription: "wide white plate with a precise single portion, delicate garnish, olive oil drizzle"

Japanese Ramen ($12-18):
- presentationStyle: "traditional Japanese"
- plateDescription: "deep ceramic bowl with noodles in broth, toppings arranged on the surface"

American Diner ($10-15):
- presentationStyle: "classic diner"
- plateDescription: "oval white plate with a single serving, sides touching, pickle spear"

Fast Casual ($8-14):
- presentationStyle: "casual modern"
- plateDescription: "single bowl or branded container with colorful ingredients, clean assembly"
</presentation_examples>

<inference_rules>
- Price is the strongest signal for presentation style
- Same cuisine at different price points looks very different
- A $5 taco and a $18 taco should generate different images
</inference_rules>

<additional_fields>
Also infer these fields to help with image styling:
- surfaceMaterial: what surface the plate sits on (rustic wood table, white marble counter, dark slate, wooden board, clean restaurant table, etc.) - infer from cuisine type and price range
- lightingStyle: "natural" (daylight/window light), "restaurant" (warm ambient), "bright" (even lighting), or "dramatic" (moody/shadows) - infer from ambiance
</additional_fields>

Return this expanded format:
{
  "cuisineType": "...",
  "cuisineSubtype": "...",
  "presentationStyle": "...",
  "plateDescription": "...",
  "priceRange": "...",
  "surfaceMaterial": "inferred surface material based on cuisine/price (rustic wood, white marble, dark slate, etc.)",
  "lightingStyle": "natural | restaurant | bright | dramatic - infer from ambiance"
}`;

  const callCtx = logContext
    ? startLLMCall({
        sessionId: logContext.sessionId,
        menuId: logContext.menuId,
        operation: "theme_extraction",
        provider: "openrouter",
        model: OCR_MODEL_ID,
        inputPrompt: userPrompt,
        inputSystemPrompt: systemPrompt,
        inputMetadata: {
          temperature: 0.3,
        },
      })
    : null;

  try {
    const response = await openrouter.chat.send({
      model: OCR_MODEL_ID,
      temperature: 0.3,
      responseFormat: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const content =
      typeof response.choices?.[0]?.message?.content === "string"
        ? response.choices[0].message.content
        : "{}";

    const cleanedContent = cleanJsonResponse(content);
    const parsed = JSON.parse(cleanedContent);

    const theme: MenuTheme = {
      cuisineType: parsed.cuisineType || "International",
      cuisineSubtype: parsed.cuisineSubtype ?? undefined, // Convert null to undefined for Convex
      presentationStyle: parsed.presentationStyle || "casual modern",
      plateDescription:
        parsed.plateDescription || "served on a restaurant plate",
      priceRange: parsed.priceRange || "mid-range",
      // NEW fields
      surfaceMaterial: parsed.surfaceMaterial ?? undefined,
      lightingStyle: parsed.lightingStyle ?? undefined,
    };

    const logData = callCtx?.complete({
      success: true,
      outputRaw: content,
      outputParsed: safeStringify(theme),
      tokenUsage: response.usage
        ? {
            promptTokens: response.usage.promptTokens,
            completionTokens: response.usage.completionTokens,
            totalTokens: response.usage.totalTokens,
          }
        : undefined,
    });
    return { result: theme, logData };
  } catch (error) {
    console.error("Theme extraction failed:", error);
    const logData = callCtx?.complete({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    const fallbackTheme: MenuTheme = {
      cuisineType: "International",
      presentationStyle: "casual modern",
      plateDescription: "served on a restaurant plate",
      priceRange: "mid-range",
    };
    return { result: fallbackTheme, logData };
  }
}

/**
 * Classify dish type based on name and description keywords.
 * Uses two-pass matching: structural dish types first, then ingredient-based.
 */
export function classifyDishType(name: string, description?: string): DishType {
  const searchText = `${name} ${description ?? ""}`.toLowerCase();

  // High-priority dish types (structural - what the dish IS)
  const structuralTypes: DishType[] = [
    "taco",
    "burger",
    "pasta",
    "soup",
    "salad",
    "rice",
    "bread",
  ];

  // First pass: check structural dish types
  for (const type of structuralTypes) {
    const keywords = DISH_TYPE_KEYWORDS[type];
    if (keywords.some((kw) => searchText.includes(kw))) {
      return type;
    }
  }

  // Second pass: check remaining types (ingredient-based)
  for (const [type, keywords] of Object.entries(DISH_TYPE_KEYWORDS)) {
    if (type === "other") continue;
    if (structuralTypes.includes(type as DishType)) continue; // Skip already checked
    if (keywords.some((kw) => searchText.includes(kw))) {
      return type as DishType;
    }
  }

  return "other";
}

/**
 * Build enhanced prompt following food photography best practices.
 * Structure: camera → subject → texture → plating → surface → lighting → styling → realism → constraints
 */
export function buildEnhancedPrompt(params: {
  name: string;
  description?: string;
  theme?: MenuTheme;
  dishType: DishType;
}): string {
  const { name, description, theme, dishType } = params;
  const priceRange = theme?.priceRange ?? "mid-range";
  const rules = DISH_TYPE_RULES[dishType];
  const camera = CAMERA_CONFIG[priceRange];

  // Build subject line with ingredients
  let subject = name;
  if (description) {
    subject += `, ${description}`;
  }

  // Get surface from theme or infer from presentation style
  const surface =
    theme?.surfaceMaterial ??
    SURFACE_CONFIG[theme?.presentationStyle ?? "casual modern"] ??
    "clean restaurant table";

  // Get lighting from theme or default
  const lighting = LIGHTING_CONFIG[theme?.lightingStyle ?? "natural"];

  // Build structured prompt
  const promptParts = [
    // Camera & technical
    `${camera.setup}, ${camera.dof}, ${camera.angle}`,

    // Subject (the dish)
    `Subject: ${subject}`,

    // Texture descriptors for this dish type
    `Texture: ${rules.texture}`,

    // Plating from theme
    `Plating: ${theme?.plateDescription ?? "on a white ceramic plate"}${theme?.cuisineSubtype ? `, ${theme.cuisineSubtype} presentation` : ""}`,

    // Surface/background
    `Surface: ${surface}`,

    // Lighting
    `Lighting: ${lighting}`,

    // Dish-specific styling with controlled imperfections
    `Styling: ${rules.styling}. ${rules.imperfections}`,

    // Realism markers
    `Quality: ${REALISM_MARKERS.slice(0, 4).join(", ")}`,

    // Constraints
    `Constraints: ${NEGATIVE_CONSTRAINTS.join(", ")}`,
  ];

  return promptParts.join(". ");
}

export async function generateDishImage(
  params: {
    name: string;
    description?: string;
    price?: string;
    theme?: MenuTheme;
    dishType?: DishType; // NEW optional parameter
  },
  logContext?: LogContext,
): Promise<{ result: string; logData?: LLMCallLogData }> {
  const { name, description, theme } = params;

  // Classify dish if not provided
  const dishType = params.dishType ?? classifyDishType(name, description);

  // Build enhanced prompt using new function
  const prompt = buildEnhancedPrompt({ name, description, theme, dishType });

  const callCtx = logContext
    ? startLLMCall({
        sessionId: logContext.sessionId,
        menuId: logContext.menuId,
        operation: "image_generation",
        provider: "fal.ai",
        model: "fal-ai/gpt-image-1.5",
        inputPrompt: prompt,
        inputMetadata: {
          imageSize: "1024x1024",
          quality: "low",
        },
      })
    : null;

  try {
    fal.config({
      credentials: getFalKey(),
    });

    const result = await fal.subscribe("fal-ai/gpt-image-1.5", {
      input: {
        prompt,
        image_size: "1024x1024",
        quality: "low",
        num_images: 1,
        output_format: "png",
      },
      logs: false,
    });

    const images =
      result.data?.images ??
      (result as { images?: Array<{ url: string }> }).images;
    const imageUrl = images?.[0]?.url;

    if (!imageUrl) {
      throw new Error("No image URL returned from fal.ai");
    }

    const logData = callCtx?.complete({
      success: true,
      outputImageUrl: imageUrl,
    });
    return { result: imageUrl, logData };
  } catch (err) {
    console.error(`[fal.ai] Image generation failed for "${name}":`, err);
    const logData = callCtx?.complete({
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    });
    throw Object.assign(
      new Error(err instanceof Error ? err.message : "Image generation failed"),
      { logData },
    );
  }
}
