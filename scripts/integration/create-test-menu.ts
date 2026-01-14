#!/usr/bin/env bun
/**
 * Create a test menu image using sharp or fallback to SVG
 *
 * Run: bun scripts/integration/create-test-menu.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";

const FIXTURES_DIR = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../fixtures",
);

// Spanish tapas menu SVG
const menuSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="500" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="500" fill="#FFC107"/>
  <text x="200" y="60" font-family="Arial, sans-serif" font-size="42" font-weight="bold" text-anchor="middle" fill="#000">TAPAS</text>
  <g font-family="Arial, sans-serif" font-size="18" fill="#000">
    <text x="30" y="120">Salmorejo</text><text x="370" y="120" text-anchor="end">8,50 €</text>
    <text x="30" y="160">Gazpacho</text><text x="370" y="160" text-anchor="end">8,50 €</text>
    <text x="30" y="200">Berenjenas</text><text x="370" y="200" text-anchor="end">1,50 €</text>
    <text x="30" y="240">Patatas bravas</text><text x="370" y="240" text-anchor="end">3,50 €</text>
    <text x="30" y="280">Tortilla de patatas</text><text x="370" y="280" text-anchor="end">4,00 €</text>
    <text x="30" y="320">Tortilla con chorizo</text><text x="370" y="320" text-anchor="end">5,00 €</text>
    <text x="30" y="360">Champiñones al ajillo</text><text x="370" y="360" text-anchor="end">3,50 €</text>
    <text x="30" y="400">Calamares a la romana</text><text x="370" y="400" text-anchor="end">4,00 €</text>
    <text x="30" y="440">Gambas al ajillo</text><text x="370" y="440" text-anchor="end">8,50 €</text>
  </g>
</svg>`;

async function main() {
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }

  // Save SVG
  const svgPath = path.join(FIXTURES_DIR, "tapas-menu.svg");
  fs.writeFileSync(svgPath, menuSvg);
  console.log(`✅ Created SVG: ${svgPath}`);

  // Try to convert to PNG using resvg-js if available
  try {
    const { Resvg } = await import("@resvg/resvg-js");
    const resvg = new Resvg(menuSvg, {
      fitTo: { mode: "width", value: 800 },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    const pngPath = path.join(FIXTURES_DIR, "tapas-menu.png");
    fs.writeFileSync(pngPath, pngBuffer);
    console.log(`✅ Created PNG: ${pngPath}`);
    console.log(`\n📝 Run full e2e test with:`);
    console.log(`   bun scripts/integration/test-convex-menu.ts ${pngPath}`);
  } catch {
    console.log("\n⚠️  Could not create PNG (resvg-js not installed)");
    console.log("   Install with: bun add -d @resvg/resvg-js");
    console.log(
      `\n📝 You can still use the SVG (may not work with all vision APIs):`,
    );
    console.log(`   bun scripts/integration/test-convex-menu.ts ${svgPath}`);
    console.log("\n   Or provide your own menu image:");
    console.log(
      "   bun scripts/integration/test-convex-menu.ts /path/to/menu.jpg",
    );
  }
}

main();
