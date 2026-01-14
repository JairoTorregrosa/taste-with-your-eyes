/**
 * Centralized configuration for food photography prompt building.
 * Contains camera, lighting, surface, and dish-specific styling rules.
 */

/**
 * Supported dish types for classification and styling
 */
export const DISH_TYPES = [
  "pasta",
  "meat",
  "seafood",
  "soup",
  "salad",
  "dessert",
  "bread",
  "fried",
  "rice",
  "taco",
  "burger",
  "beverage",
  "other",
] as const;

export type DishType = (typeof DISH_TYPES)[number];

/**
 * Camera setup configurations by restaurant price tier.
 * Styled as iPhone photography for authentic, casual feel.
 */
export const CAMERA_CONFIG = {
  budget: {
    setup: "iPhone photo, casual snapshot style",
    dof: "natural smartphone depth",
    angle: "straight-on casual angle, as if taken by a customer",
  },
  "mid-range": {
    setup: "iPhone photo, well-composed food shot",
    dof: "portrait mode with natural background blur",
    angle: "slightly elevated angle, typical restaurant photo",
  },
  upscale: {
    setup: "iPhone Pro photo, carefully composed",
    dof: "portrait mode with creamy bokeh",
    angle: "artful angle showcasing presentation",
  },
} as const;

/**
 * Lighting setup configurations by mood/style
 */
export const LIGHTING_CONFIG = {
  natural:
    "soft natural window light from the left, subtle fill light from right, neutral daylight balance",
  restaurant:
    "warm ambient restaurant lighting, soft rim light on edges, intimate atmosphere",
  bright: "bright even lighting, minimal shadows, clean commercial look",
  dramatic:
    "low-key dramatic lighting, single key light, deep shadows highlighting the dish",
} as const;

/**
 * Surface/background configurations by presentation style
 */
export const SURFACE_CONFIG: Record<string, string> = {
  "street food authentic":
    "rustic weathered wooden table, natural imperfections",
  "casual modern": "clean light wood surface or simple white background",
  "traditional Japanese":
    "dark wood or black lacquered surface, minimal styling",
  "classic diner": "formica countertop or clean white ceramic surface",
  "modern elevated": "dark slate or polished concrete surface",
  "refined minimalist": "pure white surface or light marble background",
  "generous family-style":
    "warm wooden farmhouse table with natural linen napkin",
};

/**
 * Dish-specific styling rules based on food photography best practices.
 * Each rule includes texture, styling, and imperfection guidance.
 */
export const DISH_TYPE_RULES: Record<
  DishType,
  { texture: string; styling: string; imperfections: string }
> = {
  pasta: {
    texture:
      "glossy sauce emulsion coating each strand, visible steam rising, freshly grated parmesan cheese",
    styling:
      "elegantly twirled portion showing sauce integration, nest presentation",
    imperfections: "sauce droplets on plate rim, slight sauce pooling at base",
  },
  meat: {
    texture:
      "visible sear marks with Maillard browning, glistening meat juices, caramelized golden crust",
    styling:
      "resting with natural juices, fresh herb sprig garnish, flaky finishing salt",
    imperfections:
      "natural juice pooling on plate, slight char variation on edges",
  },
  seafood: {
    texture:
      "moist flaky flesh with delicate layers, crispy golden skin, light oil sheen",
    styling:
      "fresh lemon wedge alongside, micro herb garnish, clean presentation",
    imperfections:
      "natural flaking at edges where fork would touch, slight skin bubbling",
  },
  soup: {
    texture:
      "smooth velvety surface with soft reflection, delicate steam wisps rising, floating toppings",
    styling:
      "artistic garnish floating on surface, clean bowl rim with one or two drops",
    imperfections:
      "slight surface ripple from recent ladling, herb oil not perfectly distributed",
  },
  salad: {
    texture:
      "fresh crisp leaves with natural sheen, glistening dressing droplets, vibrant vegetable colors",
    styling:
      "height and volume in presentation, visible ingredient layers throughout",
    imperfections:
      "slightly wilted edge on outer leaves, uneven dressing distribution",
  },
  dessert: {
    texture:
      "smooth glossy ganache or cream, visible distinct layers, dusted powdered sugar, elegant chocolate drizzle",
    styling:
      "precise architectural plating with artistic sauce work, mint leaf accent",
    imperfections:
      "natural crumb scatter near slice, slight sauce drip on plate edge",
  },
  bread: {
    texture:
      "crusty golden exterior with natural cracks, soft open interior crumb structure, warm golden brown color",
    styling:
      "rustic torn presentation, softened butter pat nearby, wooden board",
    imperfections:
      "natural crust cracks and splits, artisan flour dusting on surface",
  },
  fried: {
    texture:
      "crispy golden batter with visible bubbles, craggy irregular texture, slight appetizing oil sheen",
    styling:
      "stacked presentation showing crispy edges, dipping sauce in small bowl",
    imperfections:
      "few crumbs scattered naturally, slight color variation in coating",
  },
  rice: {
    texture:
      "individual distinct grains with light sheen, gentle steam rising, colorful toppings on surface",
    styling:
      "mounded dome presentation with garnish on peak, proper bowl filling",
    imperfections:
      "few grains scattered near bowl edge, slightly uneven mound shape",
  },
  taco: {
    texture:
      "warm soft tortilla with visible char marks, juicy filling visible, fresh vibrant toppings",
    styling:
      "tilted angle to showcase filling layers, lime wedge, salsa cups nearby",
    imperfections:
      "filling slightly spilling over edge, tortilla fold not perfectly even",
  },
  burger: {
    texture:
      "toasted bun with sesame seeds, melting cheese draping over patty, caramelized meat crust",
    styling:
      "cross-section view or slightly compressed showing all layers clearly",
    imperfections:
      "sauce drip running down side, natural cheese melt irregularity",
  },
  beverage: {
    texture:
      "condensation droplets on glass, crystal clear ice cubes, perfect foam texture on top",
    styling:
      "proper fill level in appropriate glassware, garnish on rim or floating",
    imperfections:
      "condensation ring forming on surface beneath, slight foam dissipation",
  },
  other: {
    texture:
      "appetizing fresh appearance, natural true colors, appropriate moisture level for dish type",
    styling:
      "clean thoughtful plating with appropriate garnish, balanced composition",
    imperfections:
      "subtle natural variations in color and texture, realistic presentation",
  },
};

/**
 * Keywords for automatic dish type classification from menu item names
 */
export const DISH_TYPE_KEYWORDS: Record<DishType, string[]> = {
  pasta: [
    "pasta",
    "spaghetti",
    "fettuccine",
    "linguine",
    "penne",
    "rigatoni",
    "lasagna",
    "ravioli",
    "carbonara",
    "bolognese",
    "alfredo",
    "mac and cheese",
    "noodle",
  ],
  meat: [
    "steak",
    "beef",
    "ribeye",
    "filet",
    "sirloin",
    "pork",
    "lamb",
    "chop",
    "roast",
    "brisket",
    "ribs",
    "meatball",
    "carne",
  ],
  seafood: [
    "fish",
    "salmon",
    "tuna",
    "shrimp",
    "lobster",
    "crab",
    "scallop",
    "oyster",
    "mussel",
    "calamari",
    "seafood",
    "pescado",
    "mariscos",
  ],
  soup: [
    "soup",
    "stew",
    "broth",
    "chowder",
    "bisque",
    "ramen",
    "pho",
    "pozole",
    "caldo",
    "consomme",
  ],
  salad: ["salad", "ensalada", "greens", "caesar", "garden", "arugula"],
  dessert: [
    "cake",
    "pie",
    "tart",
    "ice cream",
    "gelato",
    "tiramisu",
    "flan",
    "churro",
    "brownie",
    "cookie",
    "cheesecake",
    "mousse",
    "pudding",
    "creme brulee",
    "postre",
    "dulce",
    "chocolate",
  ],
  bread: [
    "bread",
    "roll",
    "baguette",
    "focaccia",
    "ciabatta",
    "croissant",
    "toast",
    "pan",
  ],
  fried: [
    "fried",
    "fries",
    "crispy",
    "tempura",
    "nugget",
    "wing",
    "fritter",
    "croquette",
  ],
  rice: [
    "rice",
    "risotto",
    "paella",
    "arroz",
    "pilaf",
    "biryani",
    "fried rice",
  ],
  taco: [
    "taco",
    "tostada",
    "gordita",
    "sope",
    "huarache",
    "quesadilla",
    "burrito",
    "enchilada",
  ],
  burger: ["burger", "hamburger", "cheeseburger", "slider", "patty melt"],
  beverage: [
    "drink",
    "cocktail",
    "beer",
    "wine",
    "coffee",
    "tea",
    "juice",
    "smoothie",
    "soda",
    "lemonade",
    "margarita",
    "agua",
  ],
  other: [],
};

/**
 * Markers to ensure photorealistic output quality.
 * Styled as iPhone photography for authentic, casual restaurant feel.
 */
export const REALISM_MARKERS = [
  "shot on iPhone",
  "casual restaurant photo",
  "natural smartphone photography",
  "authentic moment captured",
  "realistic lighting and colors",
  "natural texture",
  "slight motion or imperfection acceptable",
  "not overly styled or artificial",
] as const;

/**
 * Negative constraints to avoid unwanted elements in generated images
 */
export const NEGATIVE_CONSTRAINTS = [
  "no text",
  "no watermark",
  "no logo",
  "no hands",
  "no people",
  "no extra plates",
  "no shared platters",
  "only one dish visible",
  "one plate or bowl",
] as const;
