# 04 - Implementation Plan

**Subagent**: Implementer  
**Input**: `03-architecture-final.md`  
**Output**: This document (`04-implementation-plan.md`)

---

## 1. Implementation Overview

This document provides concrete implementation steps to realize the architecture defined in `03-architecture-final.md`. Each phase includes specific file changes, code snippets, and verification steps.

---

## 2. Phase 1: Critical Fixes

### 2.1 Fix `saveMenu` Session-Scoping

**File**: `convex/menus.ts`  
**Change**: Replace global menu deletion with session-scoped deletion

```typescript
// BEFORE (lines 136-139)
const menus = await ctx.db.query("menus").collect();
for (const menu of menus) {
  await ctx.db.delete(menu._id);
}

// AFTER
const existingMenus = await ctx.db
  .query("menus")
  .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
  .collect();

for (const menu of existingMenus) {
  await ctx.db.delete(menu._id);
}
```

**Verification**:
```bash
bun run test  # Ensure existing tests pass
# Manual: Create menu as user A, then as user B - A's menu should persist
```

---

### 2.2 Move `clearAllMenus` to Internal

**Create**: `convex/_internal.ts`

```typescript
// convex/_internal.ts
import { internalMutation } from "./_generated/server";

/**
 * Admin-only: Clear all menus from the database.
 * Only callable from Convex dashboard, scheduled jobs, or other internal functions.
 */
export const clearAllMenus = internalMutation({
  args: {},
  handler: async (ctx) => {
    const menus = await ctx.db.query("menus").collect();
    let deleted = 0;
    
    for (const menu of menus) {
      await ctx.db.delete(menu._id);
      deleted++;
    }
    
    return { deleted };
  },
});

/**
 * Admin-only: Clean up menus older than specified days.
 * Intended for scheduled cleanup jobs.
 */
export const cleanupOldMenus = internalMutation({
  args: {},
  handler: async (ctx) => {
    const RETENTION_DAYS = 30;
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    
    const oldMenus = await ctx.db
      .query("menus")
      .withIndex("by_created_at")
      .filter((q) => q.lt(q.field("createdAt"), cutoff))
      .collect();
    
    let deleted = 0;
    for (const menu of oldMenus) {
      await ctx.db.delete(menu._id);
      deleted++;
    }
    
    return { deleted, cutoffDate: new Date(cutoff).toISOString() };
  },
});
```

**Delete**: `convex/clearMenus.ts`

```bash
rm convex/clearMenus.ts
```

**Verification**:
```bash
bunx convex dev  # Should regenerate API without clearAllMenus
# Verify: api.clearMenus should no longer exist in _generated/api.d.ts
```

---

### 2.3 Add Image Remote Patterns

**File**: `next.config.ts`

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fal.media",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "v3.fal.media",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.fal.ai",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
```

**Update MenuView**: Remove `unoptimized` prop from Image components

```typescript
// src/features/menu/MenuView.tsx
// BEFORE
<Image
  src={item.imageUrl}
  alt={item.name}
  fill
  className="object-cover"
  unoptimized  // REMOVE THIS
/>

// AFTER
<Image
  src={item.imageUrl}
  alt={item.name}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

**Verification**:
```bash
bun run dev
# Navigate to a saved menu with images - should load without errors
# Check Network tab: images should be served through Next.js image optimization
```

---

### 2.4 Consolidate Constants

**File**: `src/lib/constants.ts`

```typescript
// src/lib/constants.ts

/**
 * LocalStorage keys used by the application.
 */
export const STORAGE_KEYS = {
  SESSION: "twye_session",
  MENU_ID: "twye_menu_id",
} as const;

/**
 * Data size and count limits for menu processing.
 */
export const LIMITS = {
  /** Maximum Convex document size in bytes */
  MAX_DOCUMENT_SIZE_BYTES: 700 * 1024,
  /** Maximum images to generate per category */
  MAX_IMAGES_PER_CATEGORY: 4,
  /** Maximum items to keep per category after truncation */
  MAX_ITEMS_PER_CATEGORY: 15,
  /** Maximum total items across all categories */
  MAX_TOTAL_ITEMS: 50,
  /** Maximum categories to process */
  MAX_CATEGORIES: 10,
} as const;

/**
 * AI service model configurations.
 */
export const AI_CONFIG = {
  /** OpenRouter model for menu extraction */
  VISION_MODEL: "google/gemini-2.5-flash-preview",
  /** fal.ai model for image generation */
  IMAGE_MODEL: "fal-ai/flux/schnell",
  /** Maximum dimension for generated images */
  MAX_IMAGE_DIMENSION: 1024,
} as const;

/**
 * UI timing configurations.
 */
export const UI_CONFIG = {
  /** Default animation duration in milliseconds */
  ANIMATION_DURATION_MS: 300,
  /** Toast notification display duration */
  TOAST_DURATION_MS: 5000,
  /** Input debounce delay */
  DEBOUNCE_MS: 300,
} as const;
```

**Update References**:

```typescript
// src/features/menu/MenuPage.tsx
import { STORAGE_KEYS } from "@/src/lib/constants";

// BEFORE
const stored = window.localStorage.getItem("twye_session");
// AFTER
const stored = window.localStorage.getItem(STORAGE_KEYS.SESSION);

// BEFORE
window.localStorage.setItem("twye_session", sid);
// AFTER
window.localStorage.setItem(STORAGE_KEYS.SESSION, sid);

// BEFORE
const menuId = window.localStorage.getItem("twye_menu_id");
// AFTER
const menuId = window.localStorage.getItem(STORAGE_KEYS.MENU_ID);
```

```typescript
// convex/menus.ts
import { LIMITS } from "../src/lib/constants";

// BEFORE
const maxSizeBytes = 700 * 1024;
// AFTER
const maxSizeBytes = LIMITS.MAX_DOCUMENT_SIZE_BYTES;

// BEFORE
if (count >= 4) continue;
// AFTER
if (count >= LIMITS.MAX_IMAGES_PER_CATEGORY) continue;
```

**Verification**:
```bash
bun run check  # TypeScript should compile
bun run test   # Tests should pass
```

---

## 3. Phase 2: UI Framework

### 3.1 Install shadcn/ui

```bash
# Initialize shadcn/ui (select defaults, use src/components/ui)
bunx shadcn@latest init

# When prompted:
# - Style: Default
# - Base color: Neutral
# - CSS variables: Yes
# - Components directory: src/components/ui
# - Utils location: src/lib/utils.ts (will merge with existing)
```

### 3.2 Add Required Components

```bash
bunx shadcn@latest add button
bunx shadcn@latest add card
bunx shadcn@latest add skeleton
bunx shadcn@latest add alert
bunx shadcn@latest add toast
bunx shadcn@latest add progress
```

### 3.3 Create Error Boundary

**Create**: `src/components/shared/error-boundary.tsx`

```typescript
// src/components/shared/error-boundary.tsx
"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { Button } from "@/src/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging (consider sending to error tracking service)
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-4 text-sm">
                We encountered an unexpected error. Please try again.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleRetry}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 3.4 Create Convex Provider Wrapper

**Create**: `src/components/shared/convex-provider.tsx`

```typescript
// src/components/shared/convex-provider.tsx
"use client";

import { type ReactNode, useMemo } from "react";
import { ConvexProvider as ConvexProviderBase, ConvexReactClient } from "convex/react";

interface ConvexProviderProps {
  children: ReactNode;
  convexUrl: string;
}

export function ConvexClientProvider({ children, convexUrl }: ConvexProviderProps) {
  const client = useMemo(() => new ConvexReactClient(convexUrl), [convexUrl]);

  return (
    <ConvexProviderBase client={client}>
      {children}
    </ConvexProviderBase>
  );
}
```

### 3.5 Create App Error Boundary

**Create**: `app/error.tsx`

```typescript
// app/error.tsx
"use client";

import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { Button } from "@/src/components/ui/button";
import { AlertCircle, Home, RefreshCw } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to error reporting service
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-lg">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="text-lg">Something went wrong</AlertTitle>
        <AlertDescription className="mt-4">
          <p className="mb-4 text-sm text-muted-foreground">
            We're sorry, but something unexpected happened. Our team has been notified.
          </p>
          {error.digest && (
            <p className="mb-4 font-mono text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex gap-2">
            <Button onClick={reset} variant="default" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = "/")}
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
```

### 3.6 Create Shared Exports

**Create**: `src/components/shared/index.ts`

```typescript
// src/components/shared/index.ts
export { ErrorBoundary } from "./error-boundary";
export { ConvexClientProvider } from "./convex-provider";
```

**Verification**:
```bash
bun run check
bun run dev
# Navigate to app - should load without errors
# Test error boundary by temporarily throwing in a component
```

---

## 4. Phase 3: Refinement

### 4.1 Convert app/page.tsx to Server Component

**File**: `app/page.tsx`

```typescript
// app/page.tsx (Server Component)
import { MenuPage } from "@/src/features/menu";

export default function Home() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
  }

  return (
    <main className="min-h-screen">
      <MenuPage convexUrl={convexUrl} />
    </main>
  );
}
```

### 4.2 Update MenuPage to Accept Props

**File**: `src/features/menu/MenuPage.tsx`

```typescript
// src/features/menu/MenuPage.tsx
"use client";

import { ConvexClientProvider } from "@/src/components/shared";
import { ErrorBoundary } from "@/src/components/shared";
// ... rest of imports

export interface MenuPageProps {
  convexUrl: string;
}

export function MenuPage({ convexUrl }: MenuPageProps) {
  return (
    <ErrorBoundary>
      <ConvexClientProvider convexUrl={convexUrl}>
        <PageContent />
      </ConvexClientProvider>
    </ErrorBoundary>
  );
}

// PageContent remains the same (internal component with state)
```

### 4.3 Update Schema for Future Auth

**File**: `convex/schema.ts`

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  menus: defineTable({
    // Identity
    sessionId: v.string(),
    userId: v.optional(v.string()), // Future: Convex Auth user ID
    
    // Content
    restaurantName: v.optional(v.string()),
    branding: v.optional(
      v.object({
        primaryColor: v.optional(v.string()),
        accentColor: v.optional(v.string()),
      })
    ),
    categories: v.array(
      v.object({
        name: v.string(),
        items: v.array(
          v.object({
            name: v.string(),
            description: v.optional(v.string()),
            price: v.optional(v.string()),
            confidence: v.optional(v.float64()),
            imageUrl: v.optional(v.string()),
            imageAlt: v.optional(v.string()), // NEW: Accessibility
          })
        ),
      })
    ),
    
    // Metadata
    totalItems: v.float64(),
    totalCategories: v.float64(),
    hasRestaurantName: v.boolean(),
    hasBranding: v.boolean(),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index("by_session", ["sessionId"])
    .index("by_created_at", ["createdAt"]),
    // Removed unused: by_restaurant, by_has_restaurant
});
```

### 4.4 Add Image Alt Text Generation

**File**: `src/lib/services/openrouter.ts` (or wherever enrichWithImages is)

```typescript
// In the enrichWithImages function, add alt text
const enrichedItem = {
  ...item,
  imageUrl: generatedImageUrl,
  imageAlt: `Photo of ${item.name}${item.description ? ` - ${item.description}` : ""}`,
};
```

### 4.5 Update Feature Index Export

**Create/Update**: `src/features/menu/index.ts`

```typescript
// src/features/menu/index.ts
export { MenuPage, type MenuPageProps } from "./MenuPage";
```

**Verification**:
```bash
bun run check
bun run dev
# Full app should work as before
```

---

## 5. Phase 4: Testing

### 5.1 Update Convex Tests

**File**: `convex/__tests__/menus.test.ts`

```typescript
// convex/__tests__/menus.test.ts
import { describe, expect, it, beforeEach } from "bun:test";
import { convexTest } from "convex-test";
import schema from "../schema";
import { api } from "../_generated/api";

describe("menus", () => {
  describe("saveMenu", () => {
    it("should only delete menus for the same session", async () => {
      const t = convexTest(schema);
      
      // Create menu for session A
      const sessionA = "session-a-uuid";
      await t.mutation(api.menus.saveMenu, {
        sessionId: sessionA,
        menu: {
          restaurantName: "Restaurant A",
          categories: [{ name: "Mains", items: [] }],
        },
      });
      
      // Create menu for session B
      const sessionB = "session-b-uuid";
      await t.mutation(api.menus.saveMenu, {
        sessionId: sessionB,
        menu: {
          restaurantName: "Restaurant B",
          categories: [{ name: "Mains", items: [] }],
        },
      });
      
      // Session A's menu should still exist
      const menusA = await t.query(api.menus.getMenusBySession, { sessionId: sessionA });
      expect(menusA).toHaveLength(1);
      expect(menusA[0].restaurantName).toBe("Restaurant A");
      
      // Session B's menu should exist
      const menusB = await t.query(api.menus.getMenusBySession, { sessionId: sessionB });
      expect(menusB).toHaveLength(1);
      expect(menusB[0].restaurantName).toBe("Restaurant B");
    });

    it("should replace existing menu for same session", async () => {
      const t = convexTest(schema);
      const sessionId = "test-session";
      
      // Create first menu
      await t.mutation(api.menus.saveMenu, {
        sessionId,
        menu: {
          restaurantName: "First Restaurant",
          categories: [],
        },
      });
      
      // Create second menu (should replace)
      await t.mutation(api.menus.saveMenu, {
        sessionId,
        menu: {
          restaurantName: "Second Restaurant",
          categories: [],
        },
      });
      
      // Only one menu should exist
      const menus = await t.query(api.menus.getMenusBySession, { sessionId });
      expect(menus).toHaveLength(1);
      expect(menus[0].restaurantName).toBe("Second Restaurant");
    });
  });

  describe("getMenuById", () => {
    it("should return null for wrong session", async () => {
      const t = convexTest(schema);
      
      // Create menu for session A
      const result = await t.mutation(api.menus.saveMenu, {
        sessionId: "session-a",
        menu: {
          restaurantName: "Test",
          categories: [],
        },
      });
      
      // Try to access with session B
      const menu = await t.query(api.menus.getMenuById, {
        menuId: result.id,
        sessionId: "session-b",
      });
      
      expect(menu).toBeNull();
    });

    it("should return menu for correct session", async () => {
      const t = convexTest(schema);
      const sessionId = "correct-session";
      
      const result = await t.mutation(api.menus.saveMenu, {
        sessionId,
        menu: {
          restaurantName: "My Restaurant",
          categories: [],
        },
      });
      
      const menu = await t.query(api.menus.getMenuById, {
        menuId: result.id,
        sessionId,
      });
      
      expect(menu).not.toBeNull();
      expect(menu?.restaurantName).toBe("My Restaurant");
    });
  });
});
```

### 5.2 Add ErrorBoundary Test

**Create**: `src/components/shared/__tests__/error-boundary.test.tsx`

```typescript
// src/components/shared/__tests__/error-boundary.test.tsx
import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "../error-boundary";

// Component that throws
function ThrowingComponent() {
  throw new Error("Test error");
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText("Child content")).toBeDefined();
  });

  it("renders error UI when child throws", () => {
    // Suppress console.error for this test
    const consoleSpy = mock(() => {});
    console.error = consoleSpy;
    
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText("Something went wrong")).toBeDefined();
    expect(screen.getByText("Try Again")).toBeDefined();
  });

  it("renders custom fallback when provided", () => {
    const consoleSpy = mock(() => {});
    console.error = consoleSpy;
    
    render(
      <ErrorBoundary fallback={<div>Custom error</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText("Custom error")).toBeDefined();
  });
});
```

**Verification**:
```bash
bun test
```

---

## 6. File Changes Summary

### Created Files
| File | Phase |
|------|-------|
| `convex/_internal.ts` | 1 |
| `src/components/shared/error-boundary.tsx` | 2 |
| `src/components/shared/convex-provider.tsx` | 2 |
| `src/components/shared/index.ts` | 2 |
| `app/error.tsx` | 2 |
| `src/components/shared/__tests__/error-boundary.test.tsx` | 4 |

### Modified Files
| File | Phase | Changes |
|------|-------|---------|
| `convex/menus.ts` | 1 | Session-scoped deletion |
| `next.config.ts` | 1 | Add remotePatterns |
| `src/lib/constants.ts` | 1 | Add all constants |
| `src/features/menu/MenuPage.tsx` | 1, 3 | Use constants, add error boundary |
| `src/features/menu/MenuView.tsx` | 1 | Remove unoptimized prop |
| `convex/schema.ts` | 3 | Add userId, imageAlt fields |
| `app/page.tsx` | 3 | Convert to Server Component |
| `src/features/menu/index.ts` | 3 | Export MenuPage |
| `convex/__tests__/menus.test.ts` | 4 | Add integration tests |

### Deleted Files
| File | Phase |
|------|-------|
| `convex/clearMenus.ts` | 1 |

---

## 7. Commands Reference

```bash
# Phase 1
bun run check        # Verify no type errors
bun run dev          # Test locally

# Phase 2
bunx shadcn@latest init
bunx shadcn@latest add button card skeleton alert toast progress
bun run check

# Phase 3
bunx convex dev      # Regenerate types after schema change
bun run check

# Phase 4
bun test             # Run all tests

# Final verification
bun run check && bun test && bun run build
```

---

## 8. Rollback Plan

If issues are discovered after each phase:

### Phase 1 Rollback
```bash
git checkout HEAD~1 -- convex/menus.ts convex/clearMenus.ts next.config.ts src/lib/constants.ts
```

### Phase 2 Rollback
```bash
rm -rf src/components/ui src/components/shared app/error.tsx
git checkout HEAD~1 -- src/lib/utils.ts
```

### Full Rollback
```bash
git reset --hard HEAD~4  # Assuming 4 commits for 4 phases
```

---

*Document generated by Implementer subagent*  
*Input consumed: `03-architecture-final.md`*  
*Next step: Reviewer validation*
