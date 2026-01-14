#!/usr/bin/env bun
/**
 * Integration test: fal.ai Image Generation
 *
 * Tests the fal.ai GPT-Image 1.5 API directly to verify:
 * - API key is valid
 * - Image generation works
 * - Response structure is correct
 *
 * Run: bun scripts/integration/test-fal-image.ts
 */

import { fal } from "@fal-ai/client";
import { TestRunner } from "../lib/test-utils";

const FAL_KEY = process.env.FAL_KEY;

async function main() {
  const runner = new TestRunner();
  runner.start();

  console.log("🔧 fal.ai Image Generation Integration Test");
  console.log("=".repeat(50));

  // Test 1: API Key validation
  await runner.run("FAL_KEY environment variable is set", async () => {
    if (!FAL_KEY) {
      throw new Error("FAL_KEY is not set. Export it or add to .env.local");
    }
    console.log(`      Key prefix: ${FAL_KEY.substring(0, 15)}...`);
    return { keyPrefix: FAL_KEY.substring(0, 15) };
  });

  // Test 2: Configure fal client
  await runner.run("fal.ai client configuration", async () => {
    if (!FAL_KEY) throw new Error("FAL_KEY not available");
    fal.config({ credentials: FAL_KEY });
    return { configured: true };
  });

  // Test 3: Generate a simple image
  await runner.run("Generate image with GPT-Image 1.5", async () => {
    const prompt =
      "A delicious plate of Spanish patatas bravas with spicy red sauce, professional food photography";

    console.log(`      Prompt: "${prompt.substring(0, 50)}..."`);
    console.log("      Calling fal.ai API...");

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

    if (!result.data?.images?.[0]?.url) {
      throw new Error(`Invalid response structure: ${JSON.stringify(result)}`);
    }

    const imageUrl = result.data.images[0].url;
    console.log(`      Image URL: ${imageUrl.substring(0, 60)}...`);

    return {
      requestId: result.requestId,
      imageUrl,
      imagesCount: result.data.images.length,
    };
  });

  // Test 4: Verify response structure matches expected schema
  await runner.run("Response structure validation", async () => {
    const prompt = "A bowl of gazpacho, Spanish cold soup";

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

    // Validate structure
    const checks = {
      hasData: !!result.data,
      hasImages: !!result.data?.images,
      imagesIsArray: Array.isArray(result.data?.images),
      hasAtLeastOneImage: (result.data?.images?.length ?? 0) >= 1,
      firstImageHasUrl: !!result.data?.images?.[0]?.url,
      hasRequestId: !!result.requestId,
    };

    const allPassed = Object.values(checks).every(Boolean);
    if (!allPassed) {
      throw new Error(`Structure validation failed: ${JSON.stringify(checks)}`);
    }

    return checks;
  });

  const summary = runner.summary();
  process.exit(summary.failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
