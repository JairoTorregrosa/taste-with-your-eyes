# 01 - Architecture Draft

**Subagent**: Architecture Designer  
**Input**: Initial specification, AGENTS.md, Current codebase analysis  
**Output**: This document (`01-architecture-draft.md`)

---

## 1. Executive Summary

This document proposes a KISS-compliant architecture redesign for **Taste With Your Eyes**, a web application that transforms restaurant menu photos into visual menus with AI-generated dish images. The architecture addresses critical bugs, aligns with AGENTS.md best practices, and prepares the application for multi-user scalability.

---

## 2. Problem Statement

### Current Issues Requiring Architectural Intervention

1. **Critical Bug**: `saveMenu` deletes ALL menus in database (not user-scoped)
2. **Missing UI Framework**: No shadcn/ui despite AGENTS.md requirement
3. **All Client Components**: No Server Components for static content
4. **Duplicate Validators**: Zod and Convex validators maintained separately
5. **No Authorization**: `clearAllMenus` mutation is publicly accessible
6. **Missing Error Boundaries**: No graceful error handling
7. **No Rate Limiting**: AI service calls are unbounded

---

## 3. Proposed Architecture

### 3.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │  Server         │  │  Client         │  │  shadcn/ui      │         │
│  │  Components     │  │  Components     │  │  Primitives     │         │
│  │  (app/, static) │  │  (features/*)   │  │  (components/ui)│         │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘         │
│           │                    │                    │                   │
│           └────────────────────┼────────────────────┘                   │
│                                │                                        │
│  ┌─────────────────────────────┴─────────────────────────────┐         │
│  │              Shared Components (components/shared)         │         │
│  │         ErrorBoundary, LoadingFallback, PageShell          │         │
│  └─────────────────────────────┬─────────────────────────────┘         │
└────────────────────────────────┼────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────────────┐
│                          DATA ACCESS LAYER                              │
├────────────────────────────────┼────────────────────────────────────────┤
│                                │                                        │
│  ┌─────────────────────────────┴─────────────────────────────┐         │
│  │                    Convex React Client                     │         │
│  │              useQuery / useMutation / useAction            │         │
│  └─────────────────────────────┬─────────────────────────────┘         │
│                                │                                        │
└────────────────────────────────┼────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────────────┐
│                          BACKEND LAYER (Convex)                         │
├────────────────────────────────┼────────────────────────────────────────┤
│                                │                                        │
│  ┌──────────────────┐  ┌───────┴───────┐  ┌──────────────────┐         │
│  │  Public API      │  │  Internal     │  │  Scheduled       │         │
│  │  queries         │  │  Functions    │  │  Jobs            │         │
│  │  mutations       │  │  (admin ops)  │  │  (cleanup, etc)  │         │
│  │  actions         │  │               │  │                  │         │
│  └────────┬─────────┘  └───────────────┘  └──────────────────┘         │
│           │                                                             │
│  ┌────────┴─────────────────────────────────────────────────┐          │
│  │                    Convex Schema                          │          │
│  │              menus, sessions (future), jobs               │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────────────┐
│                       EXTERNAL SERVICES                                 │
├────────────────────────────────┼────────────────────────────────────────┤
│                                │                                        │
│  ┌──────────────────┐  ┌───────┴───────┐                               │
│  │   OpenRouter     │  │    fal.ai     │                               │
│  │   (Gemini 2.5)   │  │  (Image Gen)  │                               │
│  │   - Menu OCR     │  │               │                               │
│  │   - Theme        │  │               │                               │
│  └──────────────────┘  └───────────────┘                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Folder Structure

```
taste-with-your-eyes/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (Server Component)
│   ├── page.tsx                      # Home page (Server Component shell)
│   ├── error.tsx                     # Root error boundary
│   ├── loading.tsx                   # Root loading state
│   ├── globals.css                   # Tailwind v4 styles
│   └── how-it-works/
│       └── page.tsx                  # Static page (Server Component)
│
├── convex/                           # Convex Backend
│   ├── _generated/                   # Auto-generated
│   ├── schema.ts                     # Database schema
│   ├── validators.ts                 # NEW: Shared Convex validators
│   ├── menus/                        # NEW: Feature-based organization
│   │   ├── queries.ts                # getMenuById, getMenusBySession
│   │   ├── mutations.ts              # saveMenu, deleteMenu
│   │   └── actions.ts                # extractMenuFromImage
│   ├── _internal/                    # NEW: Internal-only functions
│   │   └── admin.ts                  # clearAllMenus (internalMutation)
│   └── __tests__/                    # Convex tests
│       └── menus.test.ts
│
├── src/
│   ├── components/
│   │   ├── ui/                       # NEW: shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── alert.tsx
│   │   │   └── ...
│   │   └── shared/                   # NEW: Reusable wrappers
│   │       ├── error-boundary.tsx
│   │       ├── page-shell.tsx
│   │       └── convex-provider.tsx
│   │
│   ├── features/
│   │   ├── menu/                     # Menu feature module
│   │   │   ├── components/           # Feature-specific UI
│   │   │   │   ├── menu-uploader.tsx
│   │   │   │   ├── menu-view.tsx
│   │   │   │   ├── menu-card.tsx
│   │   │   │   └── menu-item.tsx
│   │   │   ├── hooks/                # Feature-specific hooks
│   │   │   │   ├── use-menu-extraction.ts
│   │   │   │   └── use-session.ts
│   │   │   ├── menu-page.tsx         # Main client component
│   │   │   └── index.ts              # Public exports
│   │   └── how-it-works/
│   │       └── content.tsx
│   │
│   ├── lib/
│   │   ├── validation.ts             # Zod schemas (external boundaries)
│   │   ├── constants.ts              # App constants
│   │   ├── utils.ts                  # Utility functions
│   │   └── services/                 # NEW: External service clients
│   │       ├── openrouter.ts
│   │       └── fal.ts
│   │
│   └── types/                        # Shared TypeScript types
│       └── index.ts
│
├── public/
│   └── images/                       # Static images
│
├── biome.json
├── next.config.ts
├── package.json
├── tsconfig.json
└── AGENTS.md
```

---

## 4. Component Responsibilities

### 4.1 Presentation Layer

| Component | Type | Responsibility |
|-----------|------|----------------|
| `app/page.tsx` | Server | Shell that renders ConvexProvider + MenuPage |
| `app/layout.tsx` | Server | Root layout with fonts, metadata |
| `app/error.tsx` | Client | Root error boundary |
| `MenuPage` | Client | State orchestration, Convex hooks |
| `MenuUploader` | Client | File/camera input handling |
| `MenuView` | Client | Renders extracted menu with images |
| `MenuCard` | Client | Individual menu item display |
| `components/ui/*` | Client | shadcn/ui primitives |
| `ErrorBoundary` | Client | Reusable error boundary wrapper |

### 4.2 Data Layer (Convex)

| Function | Type | Responsibility |
|----------|------|----------------|
| `getMenuById` | Query | Fetch single menu by ID + session validation |
| `getMenusBySession` | Query | Fetch all menus for a session (NEW) |
| `saveMenu` | Mutation | Save menu (session-scoped, no global delete) |
| `deleteMenu` | Mutation | Delete specific menu by ID + session (NEW) |
| `extractMenuFromImage` | Action | Orchestrate AI extraction + image gen |
| `clearAllMenus` | Internal | Admin-only cleanup (internalMutation) |

### 4.3 Service Layer

| Service | Responsibility |
|---------|----------------|
| `openrouter.ts` | OpenRouter SDK wrapper for AI calls |
| `fal.ts` | fal.ai SDK wrapper for image generation |

---

## 5. Data Flow

### 5.1 Menu Extraction Flow

```
1. User uploads image via MenuUploader
   └─► Uploader.onChange(file)
       └─► Convert to base64

2. Client calls extractMenuFromImage action
   └─► useAction(api.menus.extractMenuFromImage)
       └─► { sessionId, imageBase64 }

3. Convex Action orchestrates AI services
   ├─► extractMenuWithVision(imageBase64) → OpenRouter
   │   └─► Returns { restaurantName, categories, branding }
   ├─► extractMenuTheme(menu) → OpenRouter
   │   └─► Returns { cuisineType, style, keywords }
   └─► enrichWithImages(categories, theme) → fal.ai
       └─► Returns categories with imageUrl per item

4. Client receives menu payload
   └─► setMenu(result.menu)
       └─► Display MenuView

5. User clicks "Save"
   └─► useMutation(api.menus.saveMenu)
       └─► { sessionId, menu }

6. Convex Mutation saves (session-scoped)
   └─► ctx.db.insert("menus", { sessionId, ...menu })
       └─► Returns { id, createdAt }

7. Client stores menu ID
   └─► localStorage.setItem("twye_menu_id", id)
```

### 5.2 Menu Retrieval Flow

```
1. Page loads
   └─► useEffect checks localStorage
       └─► twye_session, twye_menu_id

2. If menu ID exists
   └─► useQuery(api.menus.getMenuById, { menuId, sessionId })
       └─► Skip if no sessionId yet

3. Query validates ownership
   └─► if (doc.sessionId !== args.sessionId) return null

4. Menu displayed
   └─► setMenu(savedMenuFromDb)
```

---

## 6. Technology Choices

| Concern | Technology | Rationale |
|---------|------------|-----------|
| Framework | Next.js 15 App Router | Per AGENTS.md, RSC support |
| Backend | Convex | Per AGENTS.md, real-time, typesafe |
| Styling | Tailwind v4 | Per AGENTS.md, utility-first |
| UI Kit | shadcn/ui | Per AGENTS.md, Radix-based |
| Validation | Zod (external), Convex validators (internal) | Per AGENTS.md |
| Language | TypeScript strict | Per AGENTS.md |
| Tooling | Bun, Biome | Per AGENTS.md |
| AI OCR | OpenRouter (Gemini 2.5 Flash) | Cost-effective, multimodal |
| Image Gen | fal.ai (nano-banana-pro) | Fast, good quality |

---

## 7. Key Architectural Decisions

### Decision 1: Session-Based Authorization (Keep, Improve)

**Context**: Current app uses client-generated UUIDs for session management.

**Decision**: Keep session-based auth for MVP simplicity, but:
- Always scope queries/mutations to sessionId
- Add server-side session validation
- Document path to Convex Auth for future

**Consequences**: 
- (+) Simple, no auth provider needed
- (-) Less secure than proper auth
- (-) Data tied to device/browser

### Decision 2: Convex Validators as Source of Truth

**Context**: Currently both Zod and Convex validators define same shapes.

**Decision**: 
- Use **Convex validators** for all Convex function args/returns
- Use **Zod** only at external API boundaries (webhooks, etc.)
- Remove duplicate Zod schemas for Convex types

**Consequences**:
- (+) Single source of truth
- (+) Less maintenance burden
- (-) Zod's `.transform()` unavailable in Convex

### Decision 3: Feature-Based Convex Organization

**Context**: All functions in single `menus.ts` file.

**Decision**: Split into feature folders:
```
convex/menus/
├── queries.ts
├── mutations.ts
└── actions.ts
```

**Consequences**:
- (+) Better organization as app grows
- (+) Clearer separation of concerns
- (-) More files to navigate

### Decision 4: shadcn/ui Adoption

**Context**: AGENTS.md requires shadcn/ui but it's not installed.

**Decision**: Install shadcn/ui with these components:
- `button`, `card`, `skeleton`, `alert`, `dialog`, `dropdown-menu`

**Consequences**:
- (+) Consistent, accessible UI
- (+) Aligns with AGENTS.md
- (-) Migration effort from current custom components

### Decision 5: Internal Functions for Admin Operations

**Context**: `clearAllMenus` is publicly accessible.

**Decision**: Convert to `internalMutation`, callable only from:
- Convex dashboard
- Other internal functions
- Scheduled jobs

**Consequences**:
- (+) Secure by default
- (+) Clear separation of public vs admin APIs
- (-) Can't call from client (but shouldn't anyway)

---

## 8. Security Considerations

| Concern | Mitigation |
|---------|------------|
| Session spoofing | Document limitation, recommend Convex Auth for production |
| Data isolation | All queries/mutations scoped to sessionId |
| Admin operations | Use `internalMutation` |
| API keys | Environment variables only, never logged |
| Input validation | Convex validators on all functions |
| Error information leakage | Generic error messages to client |

---

## 9. Performance Considerations

| Concern | Approach |
|---------|----------|
| Bundle size | Server Components for static content |
| Image loading | Next.js Image with remotePatterns for fal.ai |
| AI latency | Streaming UI feedback, progress indicators |
| Large menus | Data truncation (existing), pagination (future) |
| Re-renders | React Compiler enabled |

---

## 10. Migration Path

### Phase 1: Critical Fixes (Immediate)
1. Fix `saveMenu` to scope deletions to sessionId
2. Convert `clearAllMenus` to internalMutation
3. Add remotePatterns for fal.ai images

### Phase 2: UI Framework (1-2 days)
1. Install shadcn/ui
2. Add core components: button, card, skeleton, alert
3. Migrate existing components to use shadcn/ui primitives

### Phase 3: Architecture Refinement (2-3 days)
1. Reorganize Convex into feature folders
2. Remove duplicate Zod validators
3. Add shared components (ErrorBoundary, PageShell)
4. Convert static pages to Server Components

### Phase 4: Testing & Polish (1-2 days)
1. Add integration tests for Convex functions
2. Add component tests for critical UI
3. Add error boundaries at route level

---

## 11. Out of Scope (Future Considerations)

- **Convex Auth**: Proper authentication (tracked for v2)
- **Menu History**: Multiple menus per user (requires UI)
- **Sharing**: Public menu links (requires auth decisions)
- **Rate Limiting**: AI service call limits (requires queue)
- **Analytics**: Usage tracking (requires privacy decisions)

---

## 12. Open Questions

1. Should we support multiple menus per session, or keep single-menu model?
2. What's the maximum acceptable menu size for image generation?
3. Should image generation be synchronous or background job?
4. Do we need offline support / PWA capabilities?

---

*Document generated by Architecture Designer subagent*
*Next step: Architecture Critic review*
