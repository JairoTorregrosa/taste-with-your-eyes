/**
 * Convex mutations and queries for LLM call logging.
 * V8 runtime - no external npm dependencies.
 */

import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// ============================================================================
// Validators (matching schema)
// ============================================================================

const operationValidator = v.union(
  v.literal("menu_extraction"),
  v.literal("theme_extraction"),
  v.literal("image_generation"),
);

const providerValidator = v.union(v.literal("openrouter"), v.literal("fal.ai"));

const tokenUsageValidator = v.object({
  promptTokens: v.optional(v.float64()),
  completionTokens: v.optional(v.float64()),
  totalTokens: v.optional(v.float64()),
});

const inputMetadataValidator = v.object({
  imageBase64Length: v.optional(v.float64()),
  temperature: v.optional(v.float64()),
  imageSize: v.optional(v.string()),
  quality: v.optional(v.string()),
});

// ============================================================================
// Mutations
// ============================================================================

/**
 * Save an LLM call log entry.
 * Called from actions after each AI API call.
 */
export const saveLLMCall = internalMutation({
  args: {
    // Identity
    sessionId: v.string(),
    menuId: v.optional(v.id("menus")),
    operation: operationValidator,

    // Provider
    provider: providerValidator,
    model: v.string(),

    // Input
    inputPrompt: v.string(),
    inputSystemPrompt: v.optional(v.string()),
    inputMetadata: v.optional(inputMetadataValidator),

    // Output
    outputRaw: v.optional(v.string()),
    outputParsed: v.optional(v.string()),
    outputImageUrl: v.optional(v.string()),

    // Tokens
    tokenUsage: v.optional(tokenUsageValidator),

    // Timing
    startedAt: v.float64(),
    completedAt: v.optional(v.float64()),
    durationMs: v.optional(v.float64()),

    // Status
    success: v.boolean(),
    error: v.optional(v.string()),
    estimatedCostUsd: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("llmCalls", args);
  },
});

/**
 * Update an existing LLM call log with menuId.
 * Used when menuId is not known at the start of the call.
 */
export const updateLLMCallMenuId = internalMutation({
  args: {
    logId: v.id("llmCalls"),
    menuId: v.id("menus"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.logId, { menuId: args.menuId });
  },
});

// ============================================================================
// Queries
// ============================================================================

/**
 * Get all LLM calls for a specific menu.
 */
export const getCallsByMenu = internalQuery({
  args: { menuId: v.id("menus") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("llmCalls")
      .withIndex("by_menu", (q) => q.eq("menuId", args.menuId))
      .collect();
  },
});

/**
 * Get all LLM calls for a session.
 */
export const getCallsBySession = internalQuery({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("llmCalls")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
  },
});

/**
 * Get recent LLM calls across all sessions.
 * Useful for debugging and monitoring.
 */
export const getRecentCalls = internalQuery({
  args: { limit: v.optional(v.float64()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("llmCalls")
      .withIndex("by_created")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

/**
 * Get LLM calls by operation type.
 */
export const getCallsByOperation = internalQuery({
  args: {
    operation: operationValidator,
    limit: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("llmCalls")
      .withIndex("by_operation", (q) => q.eq("operation", args.operation))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

/**
 * Get aggregated stats for a time period.
 * Returns total calls, success rate, average duration, total cost.
 */
export const getStats = internalQuery({
  args: {
    since: v.optional(v.float64()), // timestamp
  },
  handler: async (ctx, args) => {
    const since = args.since ?? Date.now() - 24 * 60 * 60 * 1000; // default: last 24h

    const calls = await ctx.db
      .query("llmCalls")
      .withIndex("by_created")
      .filter((q) => q.gte(q.field("startedAt"), since))
      .collect();

    const totalCalls = calls.length;
    const successfulCalls = calls.filter((c) => c.success).length;
    const failedCalls = totalCalls - successfulCalls;

    const totalDuration = calls.reduce(
      (sum, c) => sum + (c.durationMs ?? 0),
      0,
    );
    const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;

    const totalCost = calls.reduce(
      (sum, c) => sum + (c.estimatedCostUsd ?? 0),
      0,
    );

    const totalTokens = calls.reduce(
      (sum, c) => sum + (c.tokenUsage?.totalTokens ?? 0),
      0,
    );

    const byOperation = {
      menu_extraction: calls.filter((c) => c.operation === "menu_extraction")
        .length,
      theme_extraction: calls.filter((c) => c.operation === "theme_extraction")
        .length,
      image_generation: calls.filter((c) => c.operation === "image_generation")
        .length,
    };

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      successRate: totalCalls > 0 ? successfulCalls / totalCalls : 0,
      avgDurationMs: avgDuration,
      totalCostUsd: totalCost,
      totalTokens,
      byOperation,
      since,
    };
  },
});
