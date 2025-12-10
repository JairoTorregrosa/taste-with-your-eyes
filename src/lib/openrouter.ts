import { stringToBase64 } from "@/src/lib/base64";
import { type MenuPayload, menuPayloadSchema } from "@/src/lib/validation";
import { fal } from "@fal-ai/client";
import { OpenRouter } from "@openrouter/sdk";

const OCR_MODEL_ID = "google/gemini-2.5-flash";

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
          content:
            "Extract menu data as JSON: { restaurantName?: string, branding?: { primaryColor?: string, accentColor?: string }, categories: [{ name: string, items: [{ name: string, description?: string, price?: string, confidence?: number }] }] }",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the menu from this photo." },
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

    // Call fal.ai Z-Image Turbo model
    const result = await fal.subscribe("fal-ai/nano-banana-pro", {
      input: {
        prompt,
        image_size: "square_hd",
        num_inference_steps: 8,
        num_images: 1,
        enable_safety_checker: true,
        output_format: "png",
      },
      logs: false,
    });

    // Extract the image URL from the response
    const imageUrl = result.data?.images?.[0]?.url;

    if (!imageUrl) {
      console.error(`No image URL in fal.ai response for "${name}"`);
      throw new Error("No image URL returned from fal.ai");
    }

    // Return the fal.ai hosted URL directly to avoid memory overhead
    // These URLs are valid for ~24 hours
    return imageUrl;
  } catch (err) {
    console.error(`Image generation error for "${name}":`, err);
    const safe = params.name.replaceAll('"', "");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640"><rect width="640" height="640" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#374151" font-family="Arial" font-size="32" font-weight="700">${safe}</text></svg>`;
    return `data:image/svg+xml;base64,${stringToBase64(svg)}`;
  }
}
