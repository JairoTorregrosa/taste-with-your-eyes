/**
 * Shared utilities for integration tests
 */

import { ConvexHttpClient } from "convex/browser";

export const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  process.env.CONVEX_URL ||
  "https://patient-panda-554.convex.cloud";

export function createConvexClient(): ConvexHttpClient {
  return new ConvexHttpClient(CONVEX_URL);
}

export function generateSessionId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

export interface TestResult {
  success: boolean;
  name: string;
  duration: number;
  error?: string;
  details?: Record<string, unknown>;
}

export class TestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  async run(
    name: string,
    fn: () => Promise<Record<string, unknown> | undefined>,
  ): Promise<TestResult> {
    const start = Date.now();
    console.log(`\n🧪 ${name}...`);

    try {
      const details = await fn();
      const duration = Date.now() - start;
      const result: TestResult = {
        success: true,
        name,
        duration,
        details: details ?? undefined,
      };
      this.results.push(result);
      console.log(`   ✅ Passed (${(duration / 1000).toFixed(1)}s)`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      const result: TestResult = {
        success: false,
        name,
        duration,
        error: error instanceof Error ? error.message : String(error),
      };
      this.results.push(result);
      console.log(`   ❌ Failed (${(duration / 1000).toFixed(1)}s)`);
      console.log(`      Error: ${result.error}`);
      return result;
    }
  }

  start(): void {
    this.startTime = Date.now();
    this.results = [];
  }

  summary(): {
    passed: number;
    failed: number;
    total: number;
    duration: number;
  } {
    const passed = this.results.filter((r) => r.success).length;
    const failed = this.results.filter((r) => !r.success).length;
    const duration = Date.now() - this.startTime;

    console.log(`\n${"=".repeat(50)}`);
    console.log("📊 Test Summary");
    console.log("=".repeat(50));
    console.log(`   Total:  ${this.results.length}`);
    console.log(`   Passed: ${passed} ✅`);
    console.log(`   Failed: ${failed} ${failed > 0 ? "❌" : ""}`);
    console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log("=".repeat(50));

    return { passed, failed, total: this.results.length, duration };
  }

  getResults(): TestResult[] {
    return this.results;
  }
}

export async function pollForCompletion<T>(
  fn: () => Promise<T>,
  options: {
    condition: (result: T) => boolean;
    maxAttempts?: number;
    intervalMs?: number;
    onProgress?: (result: T, attempt: number) => void;
  },
): Promise<T> {
  const {
    condition,
    maxAttempts = 30,
    intervalMs = 2000,
    onProgress,
  } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await fn();

    if (onProgress) {
      onProgress(result, attempt);
    }

    if (condition(result)) {
      return result;
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error(`Polling timed out after ${maxAttempts} attempts`);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
