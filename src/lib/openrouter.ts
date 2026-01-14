import { fal } from "@fal-ai/client";
import { OpenRouter } from "@openrouter/sdk";
import { type MenuPayload, menuPayloadSchema } from "@/src/lib/validation";

const OCR_MODEL_ID = "google/gemini-2.5-flash";

const MENU_EXTRACTION_SYSTEM_PROMPT = `You are a professional menu OCR specialist. Your extracted item names will generate food photography—each name must be a complete, self-describing dish name that works standalone.

## OUTPUT FORMAT
Return JSON only:
{
  "restaurantName": string | null,
  "branding": { "primaryColor"?: string, "accentColor"?: string } | null,
  "categories": [{
    "name": string,
    "items": [{
      "name": string,
      "description"?: string,
      "price"?: string,
      "confidence": number
    }]
  }]
}

## CRITICAL RULES

### 1. EXPAND VARIANT LISTS (Most Important)
When a category/header is followed by variants, PREPEND the category to each item:
- "Cookies: Nutella, Chocolate" → "Nutella Cookie", "Chocolate Cookie"
- "Crepes - Strawberry, Banana" → "Strawberry Crepe", "Banana Crepe"
- "Ice Cream (Vanilla, Mint)" → "Vanilla Ice Cream", "Mint Ice Cream"
- "Wings: Buffalo $10 / BBQ $12" → "Buffalo Wings $10", "BBQ Wings $12"
- "Coffee: S $3 / M $4 / L $5" → "Small Coffee $3", "Medium Coffee $4", "Large Coffee $5"

### 2. KEEP COMPOUND DISHES INTACT
Multi-word dish names are ONE item:
- "Chicken Caesar Salad" → ONE item
- "Bacon Cheeseburger" → ONE item

### 3. EXCLUDE NON-DISHES
NEVER extract as items:
- Section headers: "BREAKFAST", "Our Specialties"
- Add-ons/modifiers: "Add bacon $2", "Extra cheese $1"
- Placeholders: "etc.", "and more...", "..."

### 4. HANDLE COMBOS
"Combo #1: Burger + Fries + Drink $12" →
  name: "Combo #1", description: "Burger + Fries + Drink", price: "$12"

### 5. PRESERVE PORTIONS
Keep size/portion info: "Wings (6pc)", "Pasta (serves 2)"

### 6. MULTILINGUAL
Expand in menu's language:
- "Galletas: Chocolate, Vainilla" → "Galleta de Chocolate", "Galleta de Vainilla"

## VALIDATION
Before finalizing: "Can I picture the exact dish from just this name?" If no, prepend the category.

## CONFIDENCE: 1.0=clear, 0.7-0.9=partial, 0.5-0.7=inferred, <0.5=guessed`;

const MENU_EXTRACTION_USER_PROMPT =
  'Extract all menu items from this photo. Expand ALL variant lists by prepending the category (e.g., "Tacos: Chicken, Beef" → "Chicken Tacos", "Beef Tacos"). Each name must work standalone for food photography.';

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
  style: string;
  ambiance: string;
  colorPalette?: string;
  culturalContext?: string;
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
): Promise<MenuPayload> {
  const openrouter = new OpenRouter({ apiKey: getApiKey() });
  const imageUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/png;base64,${imageBase64}`;

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
    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Menu extraction failed:", error.message);
      throw new Error(`Failed to extract menu: ${error.message}`);
    }
    throw error;
  }
}

export async function extractMenuTheme(menu: MenuPayload): Promise<MenuTheme> {
  const openrouter = new OpenRouter({ apiKey: getApiKey() });

  const menuContext = {
    restaurantName: menu.restaurantName || "Unknown",
    categories: menu.categories.map((cat) => ({
      name: cat.name,
      items: cat.items.map((item) => ({
        name: item.name,
        description: item.description || "",
      })),
    })),
    branding: menu.branding,
  };

  try {
    const response = await openrouter.chat.send({
      model: OCR_MODEL_ID,
      temperature: 0.3,
      responseFormat: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Analyze the menu and extract theme information. Return JSON: { cuisineType: string (e.g., 'Italian', 'Japanese', 'Mexican', 'American', 'Fusion'), style: string (e.g., 'casual', 'fine dining', 'street food', 'family-style', 'fast-casual'), ambiance: string (e.g., 'rustic', 'modern', 'traditional', 'elegant', 'cozy', 'minimalist'), colorPalette?: string (describe the color scheme if branding colors are present), culturalContext?: string (specific cultural or regional context) }",
        },
        {
          role: "user",
          content: `Analyze this menu and extract its theme:\n\n${JSON.stringify(menuContext, null, 2)}`,
        },
      ],
    });

    const content =
      typeof response.choices?.[0]?.message?.content === "string"
        ? response.choices[0].message.content
        : "{}";

    const cleanedContent = cleanJsonResponse(content);
    const parsed = JSON.parse(cleanedContent);

    return {
      cuisineType: parsed.cuisineType || "International",
      style: parsed.style || "casual",
      ambiance: parsed.ambiance || "modern",
      colorPalette: parsed.colorPalette,
      culturalContext: parsed.culturalContext || parsed.cuisineType,
    };
  } catch (error) {
    console.error("Theme extraction failed:", error);
    return {
      cuisineType: "International",
      style: "casual",
      ambiance: "modern",
      culturalContext: "International",
    };
  }
}

export async function generateDishImage(params: {
  name: string;
  description?: string;
  theme?: MenuTheme;
}): Promise<string> {
  const { name, description, theme } = params;

  const buildPrompt = (): string => {
    const sections: string[] = [];

    sections.push(`Professional food photography of "${name}"`);
    if (description) {
      sections.push(`featuring: ${description}`);
    }

    if (theme) {
      const cuisineStyle = `${theme.cuisineType} ${theme.style}`;
      sections.push(`Styled for ${cuisineStyle} restaurant`);

      if (
        theme.culturalContext &&
        theme.culturalContext !== theme.cuisineType
      ) {
        sections.push(`authentic ${theme.culturalContext} culinary tradition`);
      }

      const ambianceMap: Record<string, string> = {
        rustic:
          "warm natural lighting, wooden surfaces, earthy tones, organic textures",
        modern:
          "clean minimalist composition, contemporary plating, geometric lines, sophisticated lighting",
        traditional:
          "classic presentation, heritage styling, timeless elegance, cultural authenticity",
        elegant:
          "refined aesthetics, premium ingredients visible, sophisticated arrangement, luxury feel",
        cozy: "comforting atmosphere, home-style presentation, inviting warmth, familiar appeal",
        minimalist:
          "clean lines, negative space, simple elegance, focus on essential elements",
      };

      const ambianceDetails =
        ambianceMap[theme.ambiance.toLowerCase()] ||
        `${theme.ambiance} ambiance`;
      sections.push(ambianceDetails);

      if (theme.colorPalette) {
        sections.push(`color harmony: ${theme.colorPalette}`);
      }
    } else {
      sections.push("clean modern presentation");
    }

    sections.push(
      "studio-quality professional lighting with soft shadows",
      "shallow depth of field (f/2.8-f/4), background beautifully blurred",
      "sharp focus on the main dish, every detail crisp and appetizing",
      "top-down or 45-degree angle composition",
      "rule of thirds applied, visually balanced",
      "natural food styling, ingredients arranged artfully",
      "appetizing colors, vibrant but realistic",
      "high-end restaurant menu photography style",
      "1:1 square aspect ratio, centered composition",
    );

    sections.push(
      "8K resolution quality",
      "commercial food photography standard",
      "magazine-worthy presentation",
      "mouth-watering appeal",
    );

    const negativeAspects = [
      "overly stylized or artificial",
      "unrealistic colors or saturation",
      "cluttered background",
      "poor lighting or shadows",
      "unappetizing presentation",
      "text or watermarks",
      "blurry or out of focus main subject",
    ];

    const fullPrompt = sections.join(", ");
    return `${fullPrompt}. Avoid: ${negativeAspects.join(", ")}.`;
  };

  const prompt = buildPrompt();

  try {
    // Configure fal.ai client
    fal.config({
      credentials: getFalKey(),
    });

    // Call fal.ai GPT-Image 1.5 model (text-to-image)
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

    // Extract the image URL from the response
    // fal.subscribe returns { data, requestId } - images are in data.images
    const images =
      result.data?.images ??
      (result as { images?: Array<{ url: string }> }).images;
    const imageUrl = images?.[0]?.url;

    if (!imageUrl) {
      throw new Error("No image URL returned from fal.ai");
    }

    // Return the fal.ai hosted URL directly to avoid memory overhead
    // These URLs are valid for ~24 hours
    return imageUrl;
  } catch (err) {
    console.error(`[fal.ai] Image generation failed for "${name}":`, err);
    throw err;
  }
}
