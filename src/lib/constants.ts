// Application metadata
export const APP_TITLE = "Taste with Your Eyes";
export const TAGLINE =
  "Upload a menu photo and get an interactive, visual menu in seconds.";
export const CONTACT_EMAIL = "support@tastewithyoureyes.app";

// Routes
export const ROUTES = {
  HOME: "/",
  HOW_IT_WORKS: "/how-it-works",
} as const;

/**
 * LocalStorage keys used by the application.
 */
export const STORAGE_KEYS = {
  SESSION: "twye_session",
  MENU_ID: "twye_menu_id",
} as const;

/**
 * Data size and count limits for menu processing.
 */
export const LIMITS = {
  /** Maximum Convex document size in bytes */
  MAX_DOCUMENT_SIZE_BYTES: 700 * 1024,
  /** Maximum images to generate per menu */
  MAX_IMAGES_PER_MENU: 4,
  /** Maximum items to keep per category after truncation */
  MAX_ITEMS_PER_CATEGORY: 15,
  /** Maximum total items across all categories */
  MAX_TOTAL_ITEMS: 50,
  /** Maximum categories to process */
  MAX_CATEGORIES: 10,
} as const;

/**
 * AI service model configurations.
 */
export const AI_CONFIG = {
  /** OpenRouter model for menu extraction */
  VISION_MODEL: "google/gemini-2.5-flash-preview",
  /** fal.ai model for image generation */
  IMAGE_MODEL: "fal-ai/flux/schnell",
  /** Maximum dimension for generated images */
  MAX_IMAGE_DIMENSION: 1024,
} as const;

/**
 * UI timing configurations.
 */
export const UI_CONFIG = {
  /** Default animation duration in milliseconds */
  ANIMATION_DURATION_MS: 300,
  /** Toast notification display duration */
  TOAST_DURATION_MS: 5000,
  /** Input debounce delay */
  DEBOUNCE_MS: 300,
} as const;
