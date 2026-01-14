#!/usr/bin/env bun
/**
 * Download a sample menu image for testing
 * Uses a public domain menu image
 *
 * Run: bun scripts/integration/download-test-image.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";

const FIXTURES_DIR = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../fixtures",
);

// Create a simple SVG menu that looks like the Spanish tapas menu
const menuSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="500" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="500" fill="#FFC107"/>
  <text x="200" y="50" font-family="Arial Black, sans-serif" font-size="36" font-weight="bold" text-anchor="middle" fill="#000">TAPAS</text>
  <g font-family="Arial, sans-serif" font-size="16" fill="#000">
    <text x="30" y="100">Salmorejo</text><text x="350" y="100" text-anchor="end">8,50 €</text>
    <text x="30" y="135">Gazpacho</text><text x="350" y="135" text-anchor="end">8,50 €</text>
    <text x="30" y="170">Berenjenas</text><text x="350" y="170" text-anchor="end">1,50 €</text>
    <text x="30" y="205">Patatas bravas</text><text x="350" y="205" text-anchor="end">3,50 €</text>
    <text x="30" y="240">Tortilla de patatas</text><text x="350" y="240" text-anchor="end">4,00 €</text>
    <text x="30" y="275">Tortilla de patatas con chorizo</text><text x="350" y="275" text-anchor="end">5,00 €</text>
    <text x="30" y="310">Champiñones al ajillo</text><text x="350" y="310" text-anchor="end">3,50 €</text>
    <text x="30" y="345">Calamares a la romana</text><text x="350" y="345" text-anchor="end">4,00 €</text>
    <text x="30" y="380">Gambas al ajillo</text><text x="350" y="380" text-anchor="end">8,50 €</text>
  </g>
</svg>`;

async function main() {
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }

  const svgPath = path.join(FIXTURES_DIR, "tapas-menu.svg");
  fs.writeFileSync(svgPath, menuSvg);
  console.log(`✅ Created: ${svgPath}`);

  // For a real test, we need a PNG/JPG. Let's fetch a sample menu image.
  // Using a simple approach - create a data URL that can be used directly

  console.log("\n📝 To run the full e2e test with this menu:");
  console.log(`   bun scripts/integration/test-convex-menu.ts ${svgPath}`);
  console.log("\n   Note: SVG may not work well with vision APIs.");
  console.log("   For best results, use a real menu photo (JPG/PNG).");
}

main();
