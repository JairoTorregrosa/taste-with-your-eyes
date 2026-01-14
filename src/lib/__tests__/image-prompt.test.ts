import { describe, expect, test } from "bun:test";
import {
  CAMERA_CONFIG,
  DISH_TYPE_RULES,
  LIGHTING_CONFIG,
  SURFACE_CONFIG,
} from "@/src/lib/image-prompt-config";
import {
  buildEnhancedPrompt,
  classifyDishType,
  type DishType,
  type MenuTheme,
} from "@/src/lib/openrouter";

// -----------------------------------------------------------------------------
// classifyDishType tests
// -----------------------------------------------------------------------------

describe("classifyDishType", () => {
  describe("pasta dishes", () => {
    const cases: Array<[string, DishType]> = [
      ["Spaghetti Carbonara", "pasta"],
      ["Fettuccine Alfredo", "pasta"],
      ["Penne with vodka sauce", "pasta"],
      ["Lasagna", "pasta"],
    ];

    for (const [name, expected] of cases) {
      test(`"${name}" → "${expected}"`, () => {
        expect(classifyDishType(name)).toBe(expected);
      });
    }
  });

  describe("meat dishes", () => {
    const cases: Array<[string, DishType]> = [
      ["Ribeye Steak", "meat"],
      ["Grilled Pork Chop", "meat"],
      ["Carne Asada", "meat"],
      ["Lamb Chops", "meat"],
    ];

    for (const [name, expected] of cases) {
      test(`"${name}" → "${expected}"`, () => {
        expect(classifyDishType(name)).toBe(expected);
      });
    }
  });

  describe("tacos and Mexican items", () => {
    const cases: Array<[string, DishType]> = [
      ["Tacos al Pastor", "taco"],
      ["Fish Tacos", "taco"],
      ["Quesadilla", "taco"],
      ["Burrito", "taco"],
    ];

    for (const [name, expected] of cases) {
      test(`"${name}" → "${expected}"`, () => {
        expect(classifyDishType(name)).toBe(expected);
      });
    }
  });

  describe("soup dishes", () => {
    const cases: Array<[string, DishType]> = [
      ["Ramen Tonkotsu", "soup"],
      ["French Onion Soup", "soup"],
      ["Pozole Rojo", "soup"],
      ["Pho", "soup"],
    ];

    for (const [name, expected] of cases) {
      test(`"${name}" → "${expected}"`, () => {
        expect(classifyDishType(name)).toBe(expected);
      });
    }
  });

  describe("desserts", () => {
    const cases: Array<[string, string | undefined, DishType]> = [
      ["Tiramisu", undefined, "dessert"],
      ["Chocolate Cake", undefined, "dessert"],
      ["Churros with chocolate", undefined, "dessert"],
      ["Creme Brulee", undefined, "dessert"],
    ];

    for (const [name, description, expected] of cases) {
      test(`"${name}" → "${expected}"`, () => {
        expect(classifyDishType(name, description)).toBe(expected);
      });
    }
  });

  describe("seafood dishes", () => {
    const cases: Array<[string, DishType]> = [
      ["Grilled Salmon", "seafood"],
      ["Lobster Tail", "seafood"],
      ["Shrimp Scampi", "seafood"],
    ];

    for (const [name, expected] of cases) {
      test(`"${name}" → "${expected}"`, () => {
        expect(classifyDishType(name)).toBe(expected);
      });
    }
  });

  describe("burgers", () => {
    const cases: Array<[string, DishType]> = [
      ["Cheeseburger", "burger"],
      ["Classic Hamburger", "burger"],
    ];

    for (const [name, expected] of cases) {
      test(`"${name}" → "${expected}"`, () => {
        expect(classifyDishType(name)).toBe(expected);
      });
    }
  });

  describe("salads", () => {
    const cases: Array<[string, DishType]> = [
      ["Caesar Salad", "salad"],
      ["Garden Salad", "salad"],
    ];

    for (const [name, expected] of cases) {
      test(`"${name}" → "${expected}"`, () => {
        expect(classifyDishType(name)).toBe(expected);
      });
    }
  });

  describe("fried foods", () => {
    const cases: Array<[string, DishType]> = [
      ["Fried Chicken", "fried"],
      ["French Fries", "fried"],
      ["Tempura", "fried"],
    ];

    for (const [name, expected] of cases) {
      test(`"${name}" → "${expected}"`, () => {
        expect(classifyDishType(name)).toBe(expected);
      });
    }
  });

  describe("rice dishes", () => {
    const cases: Array<[string, DishType]> = [
      ["Risotto", "rice"],
      ["Paella", "rice"],
      ["Arroz con Pollo", "rice"],
    ];

    for (const [name, expected] of cases) {
      test(`"${name}" → "${expected}"`, () => {
        expect(classifyDishType(name)).toBe(expected);
      });
    }
  });

  describe("beverages", () => {
    const cases: Array<[string, DishType]> = [
      ["Margarita", "beverage"],
      ["Iced Coffee", "beverage"],
    ];

    for (const [name, expected] of cases) {
      test(`"${name}" → "${expected}"`, () => {
        expect(classifyDishType(name)).toBe(expected);
      });
    }
  });

  describe("fallback to other", () => {
    const cases: Array<[string, DishType]> = [
      ["Chef's Special", "other"],
      ["Daily Special", "other"],
    ];

    for (const [name, expected] of cases) {
      test(`"${name}" → "${expected}"`, () => {
        expect(classifyDishType(name)).toBe(expected);
      });
    }
  });

  describe("uses description when name is generic", () => {
    test("classifies based on description when name is vague", () => {
      expect(
        classifyDishType("House Special", "beef steak with mushrooms"),
      ).toBe("meat");
    });
  });
});

// -----------------------------------------------------------------------------
// DISH_TYPE_RULES config tests
// -----------------------------------------------------------------------------

describe("DISH_TYPE_RULES", () => {
  const expectedDishTypes: DishType[] = [
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
  ];

  test("has all required dish types", () => {
    for (const type of expectedDishTypes) {
      expect(DISH_TYPE_RULES[type]).toBeDefined();
    }
  });

  for (const type of expectedDishTypes) {
    describe(`${type} rules`, () => {
      test("has texture field", () => {
        expect(typeof DISH_TYPE_RULES[type]?.texture).toBe("string");
      });

      test("has styling field", () => {
        expect(typeof DISH_TYPE_RULES[type]?.styling).toBe("string");
      });

      test("has imperfections field", () => {
        expect(typeof DISH_TYPE_RULES[type]?.imperfections).toBe("string");
      });

      test("texture has reasonable length (> 20 chars)", () => {
        expect(DISH_TYPE_RULES[type]?.texture.length).toBeGreaterThan(20);
      });

      test("all fields are non-empty strings", () => {
        expect(DISH_TYPE_RULES[type]?.texture.length).toBeGreaterThan(0);
        expect(DISH_TYPE_RULES[type]?.styling.length).toBeGreaterThan(0);
        expect(DISH_TYPE_RULES[type]?.imperfections.length).toBeGreaterThan(0);
      });
    });
  }
});

// -----------------------------------------------------------------------------
// buildEnhancedPrompt tests
// -----------------------------------------------------------------------------

describe("buildEnhancedPrompt", () => {
  test("returns a string containing camera setup keywords", () => {
    const result = buildEnhancedPrompt({
      name: "Spaghetti Carbonara",
      dishType: "pasta",
    });

    expect(typeof result).toBe("string");
    // Should contain camera-related terms
    expect(
      result.toLowerCase().includes("camera") ||
        result.toLowerCase().includes("lens") ||
        result.toLowerCase().includes("shot") ||
        result.toLowerCase().includes("angle") ||
        result.toLowerCase().includes("aperture"),
    ).toBe(true);
  });

  test("returns a string containing the dish name", () => {
    const result = buildEnhancedPrompt({
      name: "Ribeye Steak",
      dishType: "meat",
    });

    expect(result.toLowerCase()).toContain("ribeye steak".toLowerCase());
  });

  test("returns a string containing negative constraints", () => {
    const result = buildEnhancedPrompt({
      name: "Caesar Salad",
      dishType: "salad",
    });

    expect(result.toLowerCase()).toContain("no text");
    expect(result.toLowerCase()).toContain("no watermark");
  });

  test("varies output based on price range - budget vs upscale", () => {
    const budgetTheme: MenuTheme = {
      cuisineType: "Mexican",
      presentationStyle: "street food",
      plateDescription: "simple plate",
      priceRange: "budget",
    };

    const upscaleTheme: MenuTheme = {
      cuisineType: "Mexican",
      presentationStyle: "fine dining",
      plateDescription: "elegant plate",
      priceRange: "upscale",
    };

    const budgetResult = buildEnhancedPrompt({
      name: "Tacos",
      dishType: "taco",
      theme: budgetTheme,
    });

    const upscaleResult = buildEnhancedPrompt({
      name: "Tacos",
      dishType: "taco",
      theme: upscaleTheme,
    });

    // The prompts should be different for different price ranges
    expect(budgetResult).not.toBe(upscaleResult);
  });

  test("includes dish-type specific texture descriptions", () => {
    const pastaResult = buildEnhancedPrompt({
      name: "Fettuccine Alfredo",
      dishType: "pasta",
    });

    const steakResult = buildEnhancedPrompt({
      name: "Ribeye Steak",
      dishType: "meat",
    });

    // Pasta and meat should have different textures in prompts
    // We can't know exact content, but they should differ
    expect(pastaResult).not.toBe(steakResult);
  });

  test("includes description when provided", () => {
    const result = buildEnhancedPrompt({
      name: "Chef's Special",
      description: "grilled chicken with rosemary",
      dishType: "meat",
    });

    expect(result.toLowerCase()).toContain("grilled chicken");
  });
});

// -----------------------------------------------------------------------------
// Config exports tests
// -----------------------------------------------------------------------------

describe("CAMERA_CONFIG", () => {
  test("exists and is an object", () => {
    expect(typeof CAMERA_CONFIG).toBe("object");
    expect(CAMERA_CONFIG).not.toBeNull();
  });

  test("has expected structure with keys", () => {
    // Should have at least some camera-related configuration
    const keys = Object.keys(CAMERA_CONFIG);
    expect(keys.length).toBeGreaterThan(0);
  });
});

describe("LIGHTING_CONFIG", () => {
  test("exists and is an object", () => {
    expect(typeof LIGHTING_CONFIG).toBe("object");
    expect(LIGHTING_CONFIG).not.toBeNull();
  });

  test("has expected structure with keys", () => {
    const keys = Object.keys(LIGHTING_CONFIG);
    expect(keys.length).toBeGreaterThan(0);
  });
});

describe("SURFACE_CONFIG", () => {
  test("exists and is an object", () => {
    expect(typeof SURFACE_CONFIG).toBe("object");
    expect(SURFACE_CONFIG).not.toBeNull();
  });

  test("has expected structure with keys", () => {
    const keys = Object.keys(SURFACE_CONFIG);
    expect(keys.length).toBeGreaterThan(0);
  });
});
