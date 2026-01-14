# 03 - Architecture Final

**Subagent**: Architecture Refiner  
**Input**: `01-architecture-draft.md`, `02-architecture-critique.md`  
**Output**: This document (`03-architecture-final.md`)

---

## 1. Executive Summary

This document presents the refined, final architecture for **Taste With Your Eyes**, synthesizing the original design with critic feedback. The architecture prioritizes KISS compliance while addressing all critical issues and aligning with AGENTS.md requirements.

**Key Changes from Draft**:
- Simplified Convex structure (single file retained)
- Reduced shadcn/ui scope to essential components
- Added concrete error handling taxonomy
- Added constants consolidation
- Added accessibility requirements
- Removed premature abstractions (hooks folder, feature folders in Convex)

---

## 2. Final Folder Structure

```
taste-with-your-eyes/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (Server Component)
│   ├── page.tsx                      # Home (Server Component shell)
│   ├── error.tsx                     # Root error boundary
│   ├── globals.css                   # Tailwind v4 styles
│   └── how-it-works/
│       └── page.tsx                  # Static (Server Component)
│
├── convex/                           # Convex Backend (SIMPLIFIED)
│   ├── _generated/                   # Auto-generated
│   ├── schema.ts                     # Database schema
│   ├── menus.ts                      # All menu functions (queries, mutations, actions)
│   ├── _internal.ts                  # Internal-only functions
│   └── __tests__/
│       └── menus.test.ts
│
├── src/
│   ├── components/
│   │   ├── ui/                       # shadcn/ui primitives (minimal set)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   └── progress.tsx
│   │   └── shared/                   # Reusable wrappers
│   │       ├── error-boundary.tsx
│   │       ├── page-shell.tsx
│   │       └── convex-provider.tsx
│   │
│   ├── features/
│   │   ├── menu/                     # Menu feature (SIMPLIFIED)
│   │   │   ├── menu-page.tsx         # Main client component + hooks inline
│   │   │   ├── hero-section.tsx
│   │   │   ├── uploader.tsx
│   │   │   ├── menu-view.tsx
│   │   │   ├── loading-state.tsx
│   │   │   ├── progress-stepper.tsx
│   │   │   ├── error-banner.tsx
│   │   │   └── index.ts
│   │   └── how-it-works/
│   │       └── content.tsx
│   │
│   ├── lib/
│   │   ├── validation.ts             # Zod schemas (external boundaries only)
│   │   ├── constants.ts              # App constants (EXPANDED)
│   │   ├── utils.ts                  # Utility functions
│   │   └── services/
│   │       ├── openrouter.ts
│   │       └── fal.ts
│   │
│   └── types/
│       └── index.ts
│
├── public/
│   └── images/
│
├── biome.json
├── next.config.ts                    # With remotePatterns
├── package.json
├── tsconfig.json
└── AGENTS.md
```

### Key Simplifications from Draft

| Original Proposal | Final Decision | Rationale |
|-------------------|----------------|-----------|
| `convex/menus/{queries,mutations,actions}.ts` | `convex/menus.ts` (single file) | Only 4 functions, KISS |
| `features/menu/hooks/` folder | Hooks inline in `menu-page.tsx` | <30 lines each, not reused |
| `features/menu/components/` folder | Flat structure in `menu/` | Current 7 files manageable |
| 6 shadcn/ui components | 7 focused components | Removed dialog/dropdown, added toast/progress |

---

## 3. Component Architecture

### 3.1 Server vs Client Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     SERVER COMPONENTS                           │
├─────────────────────────────────────────────────────────────────┤
│  app/layout.tsx          - Fonts, metadata, global structure    │
│  app/page.tsx            - Static shell, imports client         │
│  app/how-it-works/page.tsx - Fully static content               │
│  app/error.tsx           - Error boundary (client by necessity) │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT COMPONENTS                           │
├─────────────────────────────────────────────────────────────────┤
│  features/menu/menu-page.tsx      - State, Convex hooks         │
│  features/menu/uploader.tsx       - File input, camera          │
│  features/menu/menu-view.tsx      - Interactive menu display    │
│  features/menu/hero-section.tsx   - Animations, interactions    │
│  features/menu/loading-state.tsx  - Animated progress           │
│  components/shared/error-boundary.tsx - React error boundary    │
│  components/shared/convex-provider.tsx - Convex context         │
│  components/ui/*                  - shadcn/ui (all client)      │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Responsibilities

| Component | Type | Responsibility |
|-----------|------|----------------|
| `app/page.tsx` | Server | Render static content + import MenuPage |
| `app/error.tsx` | Client | Root error boundary |
| `MenuPage` | Client | Convex provider, state orchestration |
| `HeroSection` | Client | Landing UI with uploader integration |
| `Uploader` | Client | File/camera input, base64 conversion |
| `MenuView` | Client | Render menu categories and items |
| `LoadingState` | Client | Processing animation |
| `ErrorBanner` | Client | Error display with retry action |
| `ErrorBoundary` | Client | Reusable React error boundary |
| `ConvexProvider` | Client | Convex client setup |

---

## 4. Data Layer (Convex)

### 4.1 Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  menus: defineTable({
    // Identity
    sessionId: v.string(),
    userId: v.optional(v.string()),      // Future: Convex Auth
    
    // Content
    restaurantName: v.optional(v.string()),
    branding: v.optional(v.object({
      primaryColor: v.optional(v.string()),
      accentColor: v.optional(v.string()),
    })),
    categories: v.array(v.object({
      name: v.string(),
      items: v.array(v.object({
        name: v.string(),
        description: v.optional(v.string()),
        price: v.optional(v.string()),
        confidence: v.optional(v.float64()),
        imageUrl: v.optional(v.string()),
        imageAlt: v.optional(v.string()),  // NEW: Accessibility
      })),
    })),
    
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
    // REMOVED: by_restaurant, by_has_restaurant (unused)
});
```

### 4.2 Functions

```typescript
// convex/menus.ts - All public menu functions

// QUERY: Get menu by ID with session validation
export const getMenuById = query({
  args: { 
    menuId: v.id("menus"), 
    sessionId: v.string() 
  },
  handler: async (ctx, args) => {
    // Use index for session-scoped lookup
    const doc = await ctx.db
      .query("menus")
      .withIndex("by_session", q => q.eq("sessionId", args.sessionId))
      .filter(q => q.eq(q.field("_id"), args.menuId))
      .first();
    
    if (!doc) return null;
    return formatMenuResponse(doc);
  },
});

// MUTATION: Save menu (session-scoped)
export const saveMenu = mutation({
  args: { 
    sessionId: v.string(), 
    menu: menuPayloadValidator 
  },
  handler: async (ctx, args) => {
    // Delete ONLY this session's existing menus
    const existingMenus = await ctx.db
      .query("menus")
      .withIndex("by_session", q => q.eq("sessionId", args.sessionId))
      .collect();
    
    for (const menu of existingMenus) {
      await ctx.db.delete(menu._id);
    }
    
    // Insert new menu
    const id = await ctx.db.insert("menus", {
      sessionId: args.sessionId,
      ...processMenuData(args.menu),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return { id, createdAt: Date.now() };
  },
});

// ACTION: Extract menu from image (orchestrates AI services)
export const extractMenuFromImage = action({
  args: { 
    sessionId: v.string(), 
    imageBase64: v.string() 
  },
  handler: async (_ctx, args) => {
    const menu = await extractMenuWithVision(args.imageBase64);
    const theme = await extractMenuTheme(menu);
    const categories = await enrichWithImages(menu.categories, theme);
    return { menu: { ...menu, categories } };
  },
});
```

```typescript
// convex/_internal.ts - Admin-only functions

import { internalMutation } from "./_generated/server";

// Only callable from dashboard, scheduled jobs, or other internal functions
export const clearAllMenus = internalMutation({
  args: {},
  handler: async (ctx) => {
    const menus = await ctx.db.query("menus").collect();
    for (const menu of menus) {
      await ctx.db.delete(menu._id);
    }
    return { deleted: menus.length };
  },
});

// Future: Scheduled cleanup
export const cleanupOldMenus = internalMutation({
  args: { maxAgeDays: v.number() },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.maxAgeDays * 24 * 60 * 60 * 1000;
    const oldMenus = await ctx.db
      .query("menus")
      .withIndex("by_created_at")
      .filter(q => q.lt(q.field("createdAt"), cutoff))
      .collect();
    
    for (const menu of oldMenus) {
      await ctx.db.delete(menu._id);
    }
    return { deleted: oldMenus.length };
  },
});
```

---

## 5. Constants Consolidation

```typescript
// src/lib/constants.ts

// Storage keys for localStorage
export const STORAGE_KEYS = {
  SESSION: 'twye_session',
  MENU_ID: 'twye_menu_id',
} as const;

// Data limits
export const LIMITS = {
  MAX_DOCUMENT_SIZE_BYTES: 700 * 1024,  // 700KB Convex limit
  MAX_IMAGES_PER_CATEGORY: 4,
  MAX_ITEMS_PER_CATEGORY: 15,
  MAX_TOTAL_ITEMS: 50,
  MAX_CATEGORIES: 10,
} as const;

// AI service configuration
export const AI_CONFIG = {
  VISION_MODEL: 'google/gemini-2.5-flash-preview',
  IMAGE_MODEL: 'fal-ai/flux/schnell',
  MAX_IMAGE_DIMENSION: 1024,
} as const;

// UI configuration
export const UI_CONFIG = {
  ANIMATION_DURATION_MS: 300,
  TOAST_DURATION_MS: 5000,
  DEBOUNCE_MS: 300,
} as const;
```

---

## 6. Error Handling Architecture

### 6.1 Error Taxonomy

| Category | Code | Example | Recovery |
|----------|------|---------|----------|
| `VALIDATION` | 400 | Invalid image format | Show inline error, user retries |
| `AUTH` | 401 | Invalid session | Regenerate session, retry |
| `NOT_FOUND` | 404 | Menu doesn't exist | Clear local storage, reset |
| `RATE_LIMIT` | 429 | Too many requests | Show cooldown, auto-retry |
| `AI_SERVICE` | 502 | OpenRouter/fal.ai down | Show retry button |
| `UNKNOWN` | 500 | Unexpected error | Show error boundary |

### 6.2 Error Handling Implementation

```typescript
// src/lib/errors.ts

export type ErrorCode = 
  | 'VALIDATION'
  | 'AUTH' 
  | 'NOT_FOUND'
  | 'RATE_LIMIT'
  | 'AI_SERVICE'
  | 'UNKNOWN';

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    // Don't expose internal errors to users
    console.error('Unexpected error:', error);
    return 'Something went wrong. Please try again.';
  }
  return 'An unexpected error occurred.';
}
```

### 6.3 Error Boundary Component

```typescript
// src/components/shared/error-boundary.tsx
"use client";

import { Component, ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <Alert variant="destructive" className="m-4">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">We encountered an unexpected error.</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}
```

---

## 7. Configuration Changes

### 7.1 Next.js Config

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fal.media',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.fal.ai',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'v3.fal.media',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
```

### 7.2 shadcn/ui Installation

```bash
# Initialize shadcn/ui
bunx shadcn@latest init

# Install required components only
bunx shadcn@latest add button card skeleton alert toast progress
```

---

## 8. Accessibility Requirements

### 8.1 Image Alt Text

All generated dish images must have descriptive alt text:

```typescript
// In enrichWithImages function
const imageAlt = `Photo of ${item.name}${item.description ? `: ${item.description}` : ''}`;
```

### 8.2 Component Requirements

| Component | Requirement |
|-----------|-------------|
| `Button` | Use shadcn/ui (built-in a11y) |
| `MenuView` | Keyboard navigable list |
| `Uploader` | Label for file input |
| `Toast` | Screen reader announcements |
| `LoadingState` | aria-live region |

### 8.3 Color Contrast

When applying restaurant branding colors:
```typescript
// Ensure minimum 4.5:1 contrast ratio
function ensureContrast(fg: string, bg: string): string {
  const ratio = getContrastRatio(fg, bg);
  if (ratio < 4.5) {
    return adjustForContrast(fg, bg);
  }
  return fg;
}
```

---

## 9. Implementation Phases

### Phase 1: Critical Fixes (Day 1)

| Task | Priority | Effort |
|------|----------|--------|
| Fix `saveMenu` session-scoping | Critical | 30 min |
| Move `clearAllMenus` to `_internal.ts` | Critical | 15 min |
| Add `remotePatterns` to next.config.ts | High | 10 min |
| Consolidate constants to `constants.ts` | High | 30 min |

**Deliverables**: 
- Bug-free data persistence
- Secure admin functions
- Working image optimization

### Phase 2: UI Framework (Day 2-3)

| Task | Priority | Effort |
|------|----------|--------|
| Install shadcn/ui | High | 30 min |
| Add button, card, skeleton, alert, toast, progress | High | 1 hour |
| Create ErrorBoundary component | High | 30 min |
| Create ConvexProvider wrapper | Medium | 20 min |
| Add error.tsx to app/ | Medium | 20 min |

**Deliverables**:
- shadcn/ui integrated
- Error boundaries in place
- Consistent UI primitives

### Phase 3: Refinement (Day 4-5)

| Task | Priority | Effort |
|------|----------|--------|
| Convert app/page.tsx to Server Component | Medium | 1 hour |
| Convert how-it-works to Server Component | Medium | 30 min |
| Migrate existing components to shadcn/ui | Medium | 2 hours |
| Add accessibility improvements | Medium | 1 hour |
| Remove unused schema indexes | Low | 15 min |

**Deliverables**:
- Optimized bundle size
- Accessible components
- Clean schema

### Phase 4: Testing (Day 6)

| Task | Priority | Effort |
|------|----------|--------|
| Add Convex function integration tests | High | 2 hours |
| Add ErrorBoundary tests | Medium | 30 min |
| Manual accessibility audit | Medium | 1 hour |

**Deliverables**:
- Test coverage for critical paths
- Verified accessibility

---

## 10. Decisions Log

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| Keep single `menus.ts` | KISS - only 4 functions | Less organization if grows |
| Keep hooks inline | KISS - <30 lines, not reused | May need extraction later |
| Session-based auth | MVP simplicity | Less secure than Convex Auth |
| Minimal shadcn/ui | Install only needed | May need more later |
| Remove unused indexes | Reduce schema complexity | May need to re-add |
| Add userId field (optional) | Future auth migration | Unused field for now |

---

## 11. Success Criteria

### Functional
- [ ] Users can upload menus without data loss
- [ ] Users can only access their own menus
- [ ] Admin functions are not publicly accessible
- [ ] Images load with Next.js optimization

### Technical
- [ ] `bun run check` passes (biome + tsc)
- [ ] All Convex functions have validators
- [ ] Error boundaries catch React errors
- [ ] Constants are centralized

### Quality
- [ ] No TypeScript `any` types
- [ ] All images have alt text
- [ ] Components use shadcn/ui primitives
- [ ] Server Components for static content

---

## 12. Open Items (Deferred)

| Item | Reason for Deferral | Revisit When |
|------|---------------------|--------------|
| Convex Auth | MVP scope | User requests login |
| Multiple menus per user | UI not designed | Feature request |
| Rate limiting (server) | Low traffic currently | Scale concerns |
| PWA/offline | Not MVP requirement | Mobile app demand |
| Analytics | Privacy decisions needed | Product decision |

---

*Document generated by Architecture Refiner subagent*  
*Input consumed: `01-architecture-draft.md`, `02-architecture-critique.md`*  
*Next step: Implementer*
