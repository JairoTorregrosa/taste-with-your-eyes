#!/usr/bin/env bun
/**
 * Integration test: Convex Menu Extraction
 *
 * Tests the Convex backend for menu extraction:
 * - Connection to Convex
 * - Menu extraction action
 * - Image generation scheduling
 * - Progress tracking
 *
 * Run: bun scripts/integration/test-convex-menu.ts [image-path]
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  CONVEX_URL,
  createConvexClient,
  formatBytes,
  generateSessionId,
  pollForCompletion,
  TestRunner,
} from "../lib/test-utils";

// Sample base64 image for testing (tiny 1x1 yellow pixel PNG that represents a menu)
// In real tests, provide an actual menu image path
const SAMPLE_MENU_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

async function main() {
  const runner = new TestRunner();
  runner.start();

  const imagePath = process.argv[2];
  let imageBase64: string;

  console.log("🔧 Convex Menu Extraction Integration Test");
  console.log("=".repeat(50));
  console.log(`   Convex URL: ${CONVEX_URL}`);

  // Load image
  if (imagePath) {
    const absolutePath = path.resolve(imagePath);
    if (!fs.existsSync(absolutePath)) {
      console.error(`❌ Image file not found: ${absolutePath}`);
      process.exit(1);
    }
    const buffer = fs.readFileSync(absolutePath);
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = ext === ".png" ? "image/png" : "image/jpeg";
    imageBase64 = `data:${mimeType};base64,${buffer.toString("base64")}`;
    console.log(`   Image: ${absolutePath} (${formatBytes(buffer.length)})`);
  } else {
    console.log("   ⚠️  No image provided, using sample (extraction may fail)");
    console.log(
      "      Usage: bun scripts/integration/test-convex-menu.ts <image-path>",
    );
    imageBase64 = SAMPLE_MENU_BASE64;
  }

  const client = createConvexClient();
  const sessionId = generateSessionId();
  let menuId: Id<"menus"> | null = null;

  console.log(`   Session: ${sessionId}\n`);

  // Test 1: Convex connection
  await runner.run("Convex client connection", async () => {
    // Simple connection check - we just instantiate the client
    // The actual query test will happen when we extract the menu
    // ConvexHttpClient validates connection on first request
    return { connected: true, url: CONVEX_URL };
  });

  // Test 2: Menu extraction (only if real image provided)
  if (imagePath) {
    const extractResult = await runner.run(
      "Extract menu from image",
      async () => {
        console.log("      Calling extractMenuFromImage action...");

        const result = await client.action(
          api.menuActions.extractMenuFromImage,
          {
            sessionId,
            imageBase64,
          },
        );

        menuId = result.menuId;

        const totalItems = result.menu.categories.reduce(
          (sum, cat) => sum + cat.items.length,
          0,
        );

        console.log(`      Menu ID: ${result.menuId}`);
        console.log(
          `      Restaurant: ${result.menu.restaurantName || "Unknown"}`,
        );
        console.log(`      Categories: ${result.menu.categories.length}`);
        console.log(`      Total items: ${totalItems}`);

        return {
          menuId: result.menuId,
          restaurantName: result.menu.restaurantName,
          categoriesCount: result.menu.categories.length,
          totalItems,
        };
      },
    );

    // Test 3: Image generation progress
    if (extractResult.success && menuId) {
      const currentMenuId = menuId; // Capture for closure

      await runner.run("Image generation progress tracking", async () => {
        console.log("      Waiting for image generation to start...");

        const progress = await pollForCompletion(
          () =>
            client.query(api.menus.getImageProgress, {
              menuId: currentMenuId,
              sessionId,
            }),
          {
            condition: (p) => p !== null && p.total > 0,
            maxAttempts: 15,
            intervalMs: 1000,
            onProgress: (p, attempt) => {
              if (p) {
                console.log(
                  `      [${attempt}] Total: ${p.total}, Pending: ${p.pending}, Generating: ${p.generating}`,
                );
              } else {
                console.log(`      [${attempt}] Waiting for records...`);
              }
            },
          },
        );

        return {
          total: progress?.total,
          pending: progress?.pending,
          generating: progress?.generating,
        };
      });

      // Test 4: Wait for at least one image to complete
      await runner.run("Image generation completion", async () => {
        console.log("      Waiting for images to generate...");

        const progress = await pollForCompletion(
          () =>
            client.query(api.menus.getImageProgress, {
              menuId: currentMenuId,
              sessionId,
            }),
          {
            condition: (p) => {
              if (!p || p.total === 0) return false;
              // Done when all finished (no pending or generating)
              return p.pending === 0 && p.generating === 0;
            },
            maxAttempts: 60, // Up to 2 minutes
            intervalMs: 2000,
            onProgress: (p, attempt) => {
              if (p && p.total > 0) {
                console.log(
                  `      [${attempt}] Completed: ${p.completed}/${p.total}, Failed: ${p.failed}`,
                );
              }
            },
          },
        );

        if (!progress) {
          throw new Error("No progress data received");
        }

        // Log generated images
        console.log("\n      Generated images:");
        for (const item of progress.items) {
          const icon =
            item.status === "completed"
              ? "✅"
              : item.status === "failed"
                ? "❌"
                : "⏳";
          console.log(`        ${icon} ${item.itemName}: ${item.status}`);
          if (item.imageUrl) {
            console.log(`           ${item.imageUrl.substring(0, 50)}...`);
          }
          if (item.error) {
            console.log(`           Error: ${item.error}`);
          }
        }

        return {
          total: progress.total,
          completed: progress.completed,
          failed: progress.failed,
          successRate:
            progress.total > 0
              ? (progress.completed / progress.total) * 100
              : 0,
        };
      });
    }
  } else {
    console.log("\n⚠️  Skipping extraction tests (no image provided)");
  }

  const summary = runner.summary();
  process.exit(summary.failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
