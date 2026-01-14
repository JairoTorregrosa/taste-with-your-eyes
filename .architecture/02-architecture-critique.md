# 02 - Architecture Critique

**Subagent**: Architecture Critic  
**Input**: `01-architecture-draft.md`  
**Output**: This document (`02-architecture-critique.md`)

---

## 1. Executive Assessment

The architecture draft presents a solid, pragmatic approach that addresses the critical bugs and aligns with AGENTS.md requirements. However, several areas require refinement to ensure true KISS compliance, avoid over-engineering, and address gaps in the proposal.

**Overall Grade**: B+

| Criterion | Score | Notes |
|-----------|-------|-------|
| Correctness | A | Addresses all critical bugs correctly |
| Security | B | Session-based auth is weak but documented |
| Maintainability | B+ | Good structure, some unnecessary complexity |
| Performance | B | Missing key optimizations |
| KISS Compliance | B- | Some over-engineering detected |
| AGENTS.md Alignment | A- | Good alignment, minor gaps |

---

## 2. Strengths

### 2.1 Critical Bug Fixes (Excellent)

The draft correctly identifies and proposes fixes for:
- ✅ `saveMenu` global deletion bug → session-scoped deletion
- ✅ `clearAllMenus` public access → `internalMutation`
- ✅ Missing image remotePatterns → proper Next.js config

### 2.2 AGENTS.md Compliance (Good)

- ✅ shadcn/ui adoption planned
- ✅ Feature-based folder structure
- ✅ Server Components for static content
- ✅ Convex validators as source of truth
- ✅ Proper separation of concerns

### 2.3 Pragmatic Decisions

- ✅ Keeping session-based auth for MVP (with documented limitations)
- ✅ Phased migration approach
- ✅ Clear out-of-scope items

---

## 3. Issues and Concerns

### 3.1 CRITICAL: Over-Engineering the Convex Structure

**Issue**: The proposed Convex folder restructure adds unnecessary complexity.

**Current Proposal**:
```
convex/menus/
├── queries.ts
├── mutations.ts
└── actions.ts
```

**Problem**: 
- The app has only **4 functions total** (1 action, 2 mutations, 1 query)
- Splitting into 3 files creates navigation overhead with no benefit
- KISS violation: adding structure before it's needed

**Recommendation**: Keep single `menus.ts` file until there are 8+ functions. The current scale doesn't warrant folder-based organization.

```
convex/
├── schema.ts
├── menus.ts        # Keep all menu functions here
├── _internal.ts    # Admin functions (NEW, single file)
└── validators.ts   # Shared validators (if needed)
```

### 3.2 HIGH: Missing Convex Auth Migration Path Details

**Issue**: The draft acknowledges session-based auth is weak but provides no concrete upgrade path.

**Gap**: 
- How will existing sessionId-based data migrate to user accounts?
- What happens to anonymous users' data when they sign up?
- No schema design for authenticated users

**Recommendation**: Add explicit schema future-proofing:

```typescript
// Schema should support future auth with optional userId
menus: defineTable({
  sessionId: v.string(),        // Keep for anonymous
  userId: v.optional(v.string()), // Future: Convex Auth user ID
  // ... rest of fields
})
```

### 3.3 HIGH: No Image Domain Configuration Shown

**Issue**: The draft mentions fixing `remotePatterns` but doesn't show the configuration.

**Gap**: Missing the actual `next.config.ts` change needed:

```typescript
// next.config.ts
const nextConfig = {
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
    ],
  },
};
```

### 3.4 MEDIUM: Incomplete Error Handling Strategy

**Issue**: The draft mentions ErrorBoundary but doesn't define the error handling architecture.

**Gaps**:
- No error type taxonomy
- No distinction between recoverable vs fatal errors
- No retry strategy for transient failures
- No error reporting/logging plan

**Recommendation**: Define error categories:

| Error Type | Example | UI Response | Recovery |
|------------|---------|-------------|----------|
| Validation | Invalid image format | Inline error message | User retry |
| Network | Convex connection lost | Toast + auto-retry | Automatic |
| AI Service | OpenRouter timeout | Banner + retry button | User retry |
| System | Unexpected exception | Error boundary | Refresh page |

### 3.5 MEDIUM: shadcn/ui Component Selection Incomplete

**Issue**: The draft lists minimal shadcn/ui components without justification.

**Proposed**: `button`, `card`, `skeleton`, `alert`, `dialog`, `dropdown-menu`

**Missing**:
- `input` - for potential search/filter
- `toast` - for success/error notifications
- `progress` - for upload/processing progress (replaces custom)
- `aspect-ratio` - for image containers

**Over-specified**:
- `dialog` - not used in current features
- `dropdown-menu` - not used in current features

**Recommendation**: Install only what's immediately needed:
```
button, card, skeleton, alert, toast, progress, input
```

### 3.6 MEDIUM: Hooks Organization May Be Premature

**Issue**: Proposing `features/menu/hooks/` folder for 2 hooks.

```
hooks/
├── use-menu-extraction.ts
└── use-session.ts
```

**Problem**: 
- `useSession` is ~10 lines of code
- `useMenuExtraction` might make sense, but current inline state is clear
- Adding indirection without complexity justification

**Recommendation**: Keep hooks inline in `MenuPage.tsx` until:
- Hook is reused in multiple components, OR
- Hook exceeds 30 lines, OR
- Hook has independent test requirements

### 3.7 MEDIUM: Missing Constants Migration

**Issue**: The draft mentions magic numbers but doesn't propose consolidating them.

**Current scattered constants**:
```typescript
// menus.ts
const maxSizeBytes = 700 * 1024;
if (count >= 4) continue; // max images per category

// MenuPage.tsx  
localStorage.getItem("twye_session")
localStorage.getItem("twye_menu_id")
```

**Recommendation**: Add to `src/lib/constants.ts`:

```typescript
export const STORAGE_KEYS = {
  SESSION: 'twye_session',
  MENU_ID: 'twye_menu_id',
} as const;

export const LIMITS = {
  MAX_DOCUMENT_SIZE_BYTES: 700 * 1024,
  MAX_IMAGES_PER_CATEGORY: 4,
  MAX_ITEMS_PER_CATEGORY: 15,
  MAX_TOTAL_ITEMS: 50,
} as const;
```

### 3.8 LOW: Server Component Scope Too Limited

**Issue**: Only `how-it-works/page.tsx` mentioned for Server Component conversion.

**Additional candidates**:
- `app/page.tsx` - can be Server Component that renders client MenuPage
- Hero section text content - could be extracted to Server Component

**Recommendation**: Apply Server Component principle more broadly:
```tsx
// app/page.tsx (Server Component)
export default function Home() {
  return (
    <main>
      {/* Static content renders on server */}
      <h1>Taste With Your Eyes</h1>
      <p>Transform your menu...</p>
      
      {/* Only the interactive part is client */}
      <MenuPageClient />
    </main>
  );
}
```

### 3.9 LOW: No CI/CD Considerations

**Issue**: Architecture draft doesn't address deployment and CI pipeline.

**Gaps**:
- No mention of existing Vercel deployment
- No type-check/lint requirements for CI
- No Convex deployment synchronization

**Recommendation**: Document CI requirements:
```yaml
# Required checks before merge
- bun run check   # biome check && tsc --noEmit
- bun run test    # bun test
- Convex type check
```

### 3.10 LOW: Open Questions Not Prioritized

**Issue**: The draft lists open questions without indicating which block progress.

**Questions requiring immediate answers**:
1. "Should we support multiple menus per session?" → **Blocks schema design**
2. "Should image generation be synchronous or background job?" → **Blocks architecture**

**Questions deferrable to v2**:
3. "Maximum acceptable menu size?" → Current limits work
4. "Offline/PWA support?" → Not MVP requirement

---

## 4. KISS Violations Summary

| Proposed Change | KISS Assessment | Recommendation |
|-----------------|-----------------|----------------|
| Convex feature folders | Over-engineering | Keep single menus.ts |
| hooks/ subfolder | Premature | Keep inline |
| services/ subfolder | Acceptable | Keep (isolates external APIs) |
| validators.ts separate file | Acceptable | Keep if >3 validators |
| dialog/dropdown-menu components | YAGNI | Remove from initial install |

---

## 5. Security Gaps

### 5.1 Rate Limiting Still Unaddressed

The draft marks rate limiting as "out of scope" but the current implementation allows:
- Unlimited `extractMenuFromImage` calls
- Each call hits 3 external APIs (OpenRouter x2, fal.ai x1)
- Potential for cost explosion

**Recommendation**: Add basic client-side throttling as immediate mitigation:
```typescript
// Simple debounce, not security - but reduces accidental spam
const [isExtracting, setIsExtracting] = useState(false);
const handleExtract = async () => {
  if (isExtracting) return; // Prevent double-clicks
  setIsExtracting(true);
  try { ... } finally { setIsExtracting(false); }
};
```

Server-side rate limiting can remain out of scope for MVP.

### 5.2 Session Validation Timing

**Issue**: Session ID is validated after database fetch in `getMenuById`:

```typescript
const doc = await ctx.db.get(args.menuId);
if (!doc || doc.sessionId !== args.sessionId) return null;
```

**Risk**: Timing attack could potentially enumerate valid menu IDs.

**Recommendation**: Use index-based query instead:
```typescript
const doc = await ctx.db
  .query("menus")
  .withIndex("by_session", q => q.eq("sessionId", args.sessionId))
  .filter(q => q.eq(q.field("_id"), args.menuId))
  .first();
```

*(Low priority - current risk is minimal)*

---

## 6. Missing Considerations

### 6.1 Accessibility

No mention of accessibility requirements:
- Color contrast for branding colors
- Screen reader support for generated images
- Keyboard navigation for menu items

**Recommendation**: Add to Phase 2:
- Use shadcn/ui for built-in a11y
- Add `alt` text generation for dish images
- Test with keyboard navigation

### 6.2 Image Loading Strategy

No mention of image loading optimization:
- Generated images are external URLs
- No lazy loading strategy
- No placeholder/blur handling

**Recommendation**: Use Next.js Image with:
```tsx
<Image
  src={item.imageUrl}
  alt={item.name}
  placeholder="blur"
  blurDataURL={shimmerPlaceholder}
  loading="lazy"
/>
```

### 6.3 Data Retention Policy

No mention of data lifecycle:
- How long are menus kept?
- What triggers cleanup?
- Storage cost implications

**Recommendation**: Add scheduled job consideration:
```typescript
// Future: Clean up menus older than 30 days
export const cleanupOldMenus = internalMutation({
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    // ... delete old menus
  },
});
```

---

## 7. Revised Priority Assessment

### Must Fix (Phase 1)
1. ✅ saveMenu session-scoping (Critical bug)
2. ✅ clearAllMenus to internalMutation (Security)
3. ✅ Add remotePatterns config (Functionality)
4. **ADD**: Consolidate magic numbers to constants

### Should Fix (Phase 2)
1. ✅ Install shadcn/ui (AGENTS.md compliance)
2. ✅ Add ErrorBoundary (Reliability)
3. **MODIFY**: Install minimal component set
4. **ADD**: Basic client-side rate limiting

### Nice to Have (Phase 3+)
1. ❌ Convex folder restructure (Remove - YAGNI)
2. ❌ hooks/ subfolder (Remove - YAGNI)
3. ✅ Server Components for static content
4. **ADD**: Accessibility improvements

---

## 8. Conclusion

The architecture draft is fundamentally sound and addresses the critical issues. However, it over-engineers in several areas (Convex folder structure, hooks organization) while under-specifying in others (error handling, constants, accessibility).

**Key Recommendations**:
1. Simplify Convex organization - keep single `menus.ts`
2. Add concrete error handling taxonomy
3. Consolidate magic numbers to constants
4. Reduce shadcn/ui initial scope to actually-needed components
5. Add basic accessibility considerations
6. Document concrete `next.config.ts` changes

The phased approach is appropriate, but Phase 1 should include constants consolidation, and Phase 2 should be more selective about component additions.

---

*Document generated by Architecture Critic subagent*  
*Next step: Architecture Refiner synthesis*
