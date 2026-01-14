#!/usr/bin/env bun
/**
 * Full E2E Integration Test Suite
 *
 * Runs all integration tests in sequence:
 * 1. fal.ai image generation
 * 2. Convex menu extraction (with optional image)
 *
 * Run: bun scripts/integration/run-all.ts [menu-image-path]
 */

import { spawn } from "node:child_process";
import * as path from "node:path";

const SCRIPTS_DIR = path.dirname(new URL(import.meta.url).pathname);

interface TestSuite {
  name: string;
  script: string;
  args?: string[];
  required?: boolean;
}

async function runScript(
  suite: TestSuite,
): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const args = ["run", suite.script, ...(suite.args || [])];
    const proc = spawn("bun", args, {
      cwd: path.resolve(SCRIPTS_DIR, "../.."),
      stdio: ["inherit", "pipe", "pipe"],
      env: { ...process.env },
    });

    let output = "";

    proc.stdout?.on("data", (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    proc.stderr?.on("data", (data) => {
      const text = data.toString();
      output += text;
      process.stderr.write(text);
    });

    proc.on("close", (code) => {
      resolve({ success: code === 0, output });
    });

    proc.on("error", (error) => {
      output += `Error: ${error.message}`;
      resolve({ success: false, output });
    });
  });
}

async function main() {
  const imagePath = process.argv[2];

  console.log("╔════════════════════════════════════════════════════╗");
  console.log("║     E2E Integration Test Suite                     ║");
  console.log("╚════════════════════════════════════════════════════╝");
  console.log();

  const suites: TestSuite[] = [
    {
      name: "fal.ai Image Generation",
      script: "scripts/integration/test-fal-image.ts",
      required: true,
    },
    {
      name: "Convex Menu Extraction",
      script: "scripts/integration/test-convex-menu.ts",
      args: imagePath ? [imagePath] : [],
      required: !!imagePath,
    },
  ];

  const results: { name: string; success: boolean }[] = [];
  let allPassed = true;

  for (const suite of suites) {
    console.log(`\n${"─".repeat(52)}`);
    console.log(`Running: ${suite.name}`);
    console.log(`${"─".repeat(52)}\n`);

    const { success } = await runScript(suite);
    results.push({ name: suite.name, success });

    if (!success && suite.required) {
      allPassed = false;
    }
  }

  // Final summary
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════╗");
  console.log("║     Final Results                                  ║");
  console.log("╚════════════════════════════════════════════════════╝");
  console.log();

  for (const result of results) {
    const icon = result.success ? "✅" : "❌";
    console.log(`  ${icon} ${result.name}`);
  }

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log();
  console.log(
    `  Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`,
  );
  console.log();

  if (!allPassed) {
    console.log("❌ Some required tests failed!");
    process.exit(1);
  }

  console.log("✅ All required tests passed!");
  process.exit(0);
}

main();
