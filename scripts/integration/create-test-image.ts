#!/usr/bin/env bun
/**
 * Generate a test menu image for integration testing
 * Creates a simple SVG menu that can be used for testing
 *
 * Run: bun scripts/integration/create-test-image.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";

const FIXTURES_DIR = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../fixtures",
);

// Create a simple menu SVG for testing
const menuSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="400" height="500" fill="#FFC107"/>
  
  <!-- Title -->
  <text x="200" y="50" font-family="Arial, sans-serif" font-size="36" font-weight="bold" text-anchor="middle" fill="#000">TAPAS</text>
  
  <!-- Menu Items -->
  <g font-family="Arial, sans-serif" font-size="18" fill="#000">
    <text x="30" y="100">Salmorejo</text>
    <text x="350" y="100" text-anchor="end">8,50 €</text>
    
    <text x="30" y="140">Gazpacho</text>
    <text x="350" y="140" text-anchor="end">8,50 €</text>
    
    <text x="30" y="180">Berenjenas</text>
    <text x="350" y="180" text-anchor="end">1,50 €</text>
    
    <text x="30" y="220">Patatas bravas</text>
    <text x="350" y="220" text-anchor="end">3,50 €</text>
    
    <text x="30" y="260">Tortilla de patatas</text>
    <text x="350" y="260" text-anchor="end">4,00 €</text>
    
    <text x="30" y="300">Tortilla con chorizo</text>
    <text x="350" y="300" text-anchor="end">5,00 €</text>
    
    <text x="30" y="340">Champiñones al ajillo</text>
    <text x="350" y="340" text-anchor="end">3,50 €</text>
    
    <text x="30" y="380">Calamares a la romana</text>
    <text x="350" y="380" text-anchor="end">4,00 €</text>
    
    <text x="30" y="420">Gambas al ajillo</text>
    <text x="350" y="420" text-anchor="end">8,50 €</text>
  </g>
  
  <!-- Decorative fan -->
  <g transform="translate(340, 350) scale(0.5)">
    <path d="M0,0 L-30,-60 L30,-60 Z" fill="#C62828"/>
    <path d="M0,0 L-50,-50 L-10,-70 Z" fill="#D32F2F"/>
    <path d="M0,0 L10,-70 L50,-50 Z" fill="#D32F2F"/>
  </g>
</svg>`;

async function main() {
  // Ensure fixtures directory exists
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }

  const svgPath = path.join(FIXTURES_DIR, "test-menu.svg");
  fs.writeFileSync(svgPath, menuSvg);
  console.log(`✅ Created test menu SVG: ${svgPath}`);

  // Convert SVG to PNG using canvas (if available) or just use SVG
  // For now, we'll create a simple JPEG placeholder
  const _pngPath = path.join(FIXTURES_DIR, "test-menu.png");

  // Create a simple PNG by writing the SVG as a data URI in an HTML file
  // and noting that for real testing, a real menu image should be used
  console.log(`\n📝 For full e2e testing, use a real menu photo:`);
  console.log(
    `   bun scripts/integration/test-convex-menu.ts /path/to/menu.jpg`,
  );
  console.log(`\n   Or use the SVG directly (may not work with vision API):`);
  console.log(`   ${svgPath}`);
}

main();
