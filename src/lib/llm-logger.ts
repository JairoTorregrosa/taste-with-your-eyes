/**
 * LLM Call Logging Service
 *
 * Provides types and helper functions for logging all LLM/AI API calls
 * with full observability: prompts, outputs, tokens, timing, and costs.
 */

import type { Id } from "@/convex/_generated/dataModel";

// ============================================================================
// Types
// ============================================================================

export type LLMOperation =
  | "menu_extraction"
  | "theme_extraction"
  | "image_generation";

export type LLMProvider = "openrouter" | "fal.ai";

export interface LLMCallInput {
  sessionId: string;
  menuId?: Id<"menus">;
  operation: LLMOperation;
  provider: LLMProvider;
  model: string;
  inputPrompt: string;
  inputSystemPrompt?: string;
  inputMetadata?: {
    imageBase64Length?: number;
    temperature?: number;
    imageSize?: string;
    quality?: string;
  };
}

export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface LLMCallResult {
  outputRaw?: string;
  outputParsed?: string;
  outputImageUrl?: string;
  tokenUsage?: TokenUsage;
  success: boolean;
  error?: string;
}

/**
 * Complete log entry ready to be saved to the database.
 */
export interface LLMCallLogData {
  // Identity
  sessionId: string;
  menuId?: Id<"menus">;
  operation: LLMOperation;

  // Provider
  provider: LLMProvider;
  model: string;

  // Input
  inputPrompt: string;
  inputSystemPrompt?: string;
  inputMetadata?: {
    imageBase64Length?: number;
    temperature?: number;
    imageSize?: string;
    quality?: string;
  };

  // Output
  outputRaw?: string;
  outputParsed?: string;
  outputImageUrl?: string;

  // Tokens
  tokenUsage?: TokenUsage;

  // Timing
  startedAt: number;
  completedAt: number;
  durationMs: number;

  // Status
  success: boolean;
  error?: string;
  estimatedCostUsd?: number;
}

// ============================================================================
// Cost Estimation
// ============================================================================

/**
 * Approximate pricing per 1M tokens (as of 2024).
 * These are estimates and should be updated periodically.
 */
const PRICING: Record<string, { input: number; output: number }> = {
  // OpenRouter models
  "google/gemini-2.5-flash": { input: 0.15, output: 0.6 },
  "google/gemini-2.5-flash-preview": { input: 0.15, output: 0.6 },
  // fal.ai - flat rate per image, not per token
  "fal-ai/gpt-image-1.5": { input: 0, output: 0 },
};

/**
 * Estimate cost per image for fal.ai models.
 * GPT-Image 1.5 charges per image generated.
 */
const IMAGE_GENERATION_COST: Record<string, number> = {
  "fal-ai/gpt-image-1.5": 0.04, // ~$0.04 per image at low quality
};

function estimateCost(
  provider: LLMProvider,
  model: string,
  tokenUsage?: TokenUsage,
): number | undefined {
  if (provider === "fal.ai") {
    // Image generation - flat rate per image
    return IMAGE_GENERATION_COST[model];
  }

  if (!tokenUsage) return undefined;

  const pricing = PRICING[model];
  if (!pricing) return undefined;

  const inputCost =
    ((tokenUsage.promptTokens ?? 0) / 1_000_000) * pricing.input;
  const outputCost =
    ((tokenUsage.completionTokens ?? 0) / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

// ============================================================================
// Logging Context
// ============================================================================

/**
 * Represents an in-progress LLM call.
 * Call `complete()` when the API call finishes to get the full log data.
 */
export interface LLMCallContext {
  /** Input data for the call */
  input: LLMCallInput;
  /** Timestamp when the call started */
  startedAt: number;
  /** Complete the call and generate log data */
  complete: (result: LLMCallResult) => LLMCallLogData;
}

/**
 * Start tracking an LLM call. Returns a context object that can be used
 * to complete the call and generate the full log data.
 *
 * @example
 * ```typescript
 * const callCtx = startLLMCall({
 *   sessionId: "session-123",
 *   operation: "menu_extraction",
 *   provider: "openrouter",
 *   model: "google/gemini-2.5-flash",
 *   inputPrompt: userPrompt,
 *   inputSystemPrompt: systemPrompt,
 * })
 *
 * try {
 *   const response = await openrouter.chat.send(...)
 *   const logData = callCtx.complete({
 *     success: true,
 *     outputRaw: response.choices[0].message.content,
 *     outputParsed: JSON.stringify(parsedResult),
 *     tokenUsage: response.usage,
 *   })
 *   return { result: parsedResult, logData }
 * } catch (error) {
 *   const logData = callCtx.complete({
 *     success: false,
 *     error: error.message,
 *   })
 *   throw error
 * }
 * ```
 */
export function startLLMCall(input: LLMCallInput): LLMCallContext {
  const startedAt = Date.now();

  return {
    input,
    startedAt,
    complete: (result: LLMCallResult): LLMCallLogData => {
      const completedAt = Date.now();
      const durationMs = completedAt - startedAt;

      return {
        // Identity
        sessionId: input.sessionId,
        menuId: input.menuId,
        operation: input.operation,

        // Provider
        provider: input.provider,
        model: input.model,

        // Input
        inputPrompt: input.inputPrompt,
        inputSystemPrompt: input.inputSystemPrompt,
        inputMetadata: input.inputMetadata,

        // Output
        outputRaw: result.outputRaw,
        outputParsed: result.outputParsed,
        outputImageUrl: result.outputImageUrl,

        // Tokens
        tokenUsage: result.tokenUsage,

        // Timing
        startedAt,
        completedAt,
        durationMs,

        // Status
        success: result.success,
        error: result.error,
        estimatedCostUsd: estimateCost(
          input.provider,
          input.model,
          result.tokenUsage,
        ),
      };
    },
  };
}

/**
 * Helper to safely stringify objects for logging.
 * Handles circular references and large objects.
 */
export function safeStringify(obj: unknown, maxLength = 50000): string {
  try {
    const str = JSON.stringify(obj, null, 2);
    if (str.length > maxLength) {
      return `${str.slice(0, maxLength)}\n... [truncated]`;
    }
    return str;
  } catch {
    return "[Unable to stringify]";
  }
}
