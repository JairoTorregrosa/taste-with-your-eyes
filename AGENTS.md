# AGENTS.md

## Governing Principles for the Autonomous Full-Stack Coding Agent

---

### 0. Purpose and Scope

1. This constitution defines how the Agent must design, implement, and maintain full-stack applications using:
   - Next.js (App Router, React Server Components)
   - TypeScript
   - Convex
   - Zod
   - Tailwind CSS
   - shadcn/ui
   - Bun
   - Biome

2. The Agent must treat this document as higher-order instructions for all coding tasks, unless explicitly overridden by user requirements that are compatible with security and correctness.

3. When user instructions conflict with this constitution, the Agent must:
   - Prefer security, correctness, and maintainability over convenience.
   - Explain the conflict and propose a constitutional alternative.

---

### 1. Core Principles

4. The Agent must optimize for:
   - Correctness first
   - Security by default
   - Maintainability and readability
   - Performance where it matters
   - Automation and repeatability of workflows

5. The Agent must write code that a competent human engineer can understand and extend without the Agent's help.

6. The Agent must favor explicitness over magic and composition over inheritance.

---

### 2. Tech Stack Contract

7. The default stack for any new web application is:
   - Runtime & tooling: Bun as JS runtime, package manager, and test runner.
   - Framework: Next.js App Router with React Server Components.
   - Backend: Convex for data, business logic, and persistence.
   - Language & types: TypeScript in strict mode.
   - Validation: Zod for runtime validation at all external boundaries.
   - Styling: Tailwind CSS with design tokens.
   - UI kit: shadcn/ui built on Tailwind and Radix, themed via CSS variables.
   - Static analysis: Biome as the unified formatter and linter.

8. The Agent must not introduce alternative frameworks, linters, or runtimes unless:
   - Explicitly requested, and
   - It can demonstrate why they are necessary and maintain compatibility where possible.

---

### 3. Architecture and Project Layout

9. The Agent must adopt a modular, feature-oriented structure, for example:
   - `/app` – Next.js App Router routes, layouts, and server components.
   - `/convex` – schema and functions (queries, mutations, actions).
   - `/src/lib` – shared utilities, types, validation schemas, and constants.
     - `/src/lib/validation.ts` – Zod schemas for runtime validation.
     - `/src/lib/constants.ts` – application constants and configuration.
   - `/src/components/ui` – shadcn/ui primitives (generated).
   - `/src/components/shared` – reusable UI wrappers, layout primitives.
   - `/src/features/*` – feature modules (UI + hooks calling Convex).
   - `/src/styles` – Tailwind and global styles.

10. The Agent must keep business logic close to the data layer, primarily inside Convex functions, not in React components.

11. The Agent must avoid "god" components and "god" functions; each module must have a single clear responsibility.

---

### 4. TypeScript and Typing Rules

12. The Agent must always enable and honor TypeScript strict mode and related options for new projects.

13. The Agent must:
    - Prefer inferred types over redundant annotations.
    - Prohibit `any` unless there is no alternative; even then, prefer `unknown` + validation.
    - Use discriminated unions for state machines and status handling.

14. Public APIs, Convex function signatures, and complex objects must be typed through Zod schemas or Convex validators, not ad-hoc TypeScript interfaces.

15. When types and schemas diverge, the Agent must align the types to the schemas, not the other way around.

16. The Agent must configure TypeScript path aliases for clean imports:
    - Use `@/*` to map to the project root (`./*`).
    - Examples: `@/src/lib/validation`, `@/src/components/Button`, `@/app/page`.
    - Configure in `tsconfig.json` under `compilerOptions.paths`.

---

### 5. Validation and Data Boundaries

17. The Agent must treat all external input as untrusted:
    - HTTP requests, query params, headers.
    - Form data from the browser.
    - Messages from queues, webhooks, or third-party APIs.
    - **LLM/AI API responses** (often return `null` instead of `undefined`).

18. The Agent must:
    - Define Zod schemas for all such inputs in `/src/lib/validation.ts`.
    - Export TypeScript types derived from schemas using `z.infer<>`.
    - Use `.parse` / `.safeParse` before using the data.
    - Validate Convex arguments using Convex's own validators in Convex functions.
    - **Handle `null` from LLM responses**: Use `z.preprocess` to convert `null` to `undefined`:
      ```typescript
      const nullToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
        z.preprocess((val) => (val === null ? undefined : val), schema);
      
      // Usage:
      restaurantName: nullToUndefined(z.string().optional()),
      ```

19. The Agent must never trust client-side validation alone; server-side validation is mandatory.

20. Validation failures must produce clear, structured error objects that the UI can render gracefully.

---

### 6. Next.js and React Server Components

21. The Agent must build with Next.js App Router exclusively for new apps.

22. The Agent must use Server Components by default:
    - For data fetching.
    - For composition and heavy dependencies.
    - For anything that does not require browser-only APIs or local reactive state.

23. Components must be marked `"use client"` only when:
    - They rely on browser APIs or event handlers.
    - They manage local state with hooks.
    - They use client-only libraries.

24. The Agent must follow official data-fetching and caching patterns:
    - Use server data fetching in page and layout components.
    - Configure caching and revalidation explicitly using Next's caching APIs.

25. The Agent must avoid duplicate fetching between server and client; server-fetched data should be passed via props where possible.

26. The Agent must enable React Compiler when using Next.js 16+:
    - Configure `reactCompiler: true` in `next.config.ts`.
    - Install `babel-plugin-react-compiler` as a dev dependency.
    - React Compiler automatically optimizes React components without manual memoization.

---

### 7. Convex: Backend and Data Layer

27. The Agent must use Convex as the primary data and business logic layer.

28. The Agent must:
    - Define tables, indexes, and relationships in the Convex schema.
    - Put domain rules in Convex functions (queries, mutations, actions).
    - Validate arguments and return values with Convex validators.

29. Convex functions must:
    - `await` all promises; no fire-and-forget operations.
    - Use indices and pagination for large result sets.
    - Enforce authorization checks based on the current identity.

30. The Agent must not bypass Convex to write directly to the underlying storage layer.

#### 7.1 Convex Runtime Rules (CRITICAL)

31. **Convex has two runtimes**: V8 (default) and Node.js. The Agent must understand the constraints:

    | Runtime | Directive | Can contain | Use case |
    |---------|-----------|-------------|----------|
    | V8 (default) | None | `query`, `mutation`, `internalQuery`, `internalMutation` | Most functions |
    | Node.js | `"use node"` at top of file | `action`, `internalAction` ONLY | External npm packages |

32. **CRITICAL**: A file with `"use node"` can ONLY export actions. Queries and mutations are NOT allowed in Node.js runtime files. This will cause deployment errors:
    ```
    Error: `myFunction` defined in `file.js` is a Mutation function. 
    Only actions can be defined in Node.js.
    ```

33. When splitting Convex files for Node.js runtime:
    - Keep queries/mutations in the default runtime file (e.g., `menus.ts`)
    - Move actions to a separate file with `"use node"` (e.g., `menuActions.ts`)
    - Update all imports in frontend code to use the new module path
    - Run `bunx convex dev --once` to regenerate types before updating imports

34. After splitting Convex files, remember to update:
    - Frontend: `api.oldModule.action` → `api.newModule.action`
    - Tests: Same import path changes
    - Internal references: `internal.oldModule.action` → `internal.newModule.action`

---

### 8. Styling, Tailwind, and shadcn/ui

35. The Agent must use Tailwind's utility-first approach and keep design tokens in Tailwind config or Tailwind v4 `@theme` definitions.

36. The Agent must:
    - Configure semantic tokens (e.g. `primary`, `accent`, `destructive`).
    - Leverage Purge/tree-shaking to keep bundles small.
    - Use Tailwind v4 `@theme inline` syntax in CSS files for theme customization:
      ```css
      @theme inline {
        --color-background: var(--background);
        --color-foreground: var(--foreground);
      }
      ```

37. shadcn/ui usage rules:
    - Generated primitives live in `/src/components/ui` and must not be modified directly.
    - App-specific variants and behavior belong in wrapper components (`/src/components/shared` or feature folders).
    - Theming must use CSS variables as recommended by shadcn/ui docs.

38. The Agent must keep UI components pure:
    - No data fetching in `/src/components/ui`.
    - Minimal side effects; side effects live in higher-level container components.

39. The Agent must prevent Tailwind "class soup" in large components by:
    - Extracting repeated patterns into smaller components.
    - Using clear grouping and ordering conventions for class names.

---

### 9. Bun and Biome Tooling Rules

40. The Agent must use Bun as:
    - Package manager (`bun install`).
    - Script runner (`bun run`).
    - Test runner (`bun test`), where applicable.

41. Project scripts must, by default, be defined in terms of Bun, while remaining usable on Node-based CI when reasonable.

42. The Agent must adopt Biome as the single source of truth for:
    - Formatting.
    - Linting.
    - Basic static analysis.

43. ESLint and Prettier should not be introduced unless user constraints require them; in that case, the Agent must avoid overlapping responsibilities with Biome.

44. The Agent must enforce:
    - Lint and format on CI.
    - Local commands such as `bun run lint`, `bun run format`, `bun run check`.
    - The `check` script must run: `biome check && tsc --noEmit && bun test` to verify both linting/formatting and type checking.

---

### 10. Security and Reliability

45. The Agent must keep abreast of security advisories for:
    - React and React Server Components.
    - Next.js CVEs and patch releases.

46. When a known critical vulnerability exists in the stack, the Agent must:
    - Prefer patched versions.
    - Include migration or mitigation steps in its output.

47. The Agent must:
    - Never log secrets or long-lived tokens.
    - Avoid hard-coding secrets; use environment variables and secret managers.
    - Apply principle of least privilege in Convex functions and any external API integrations.

48. The Agent must design for graceful failure:
    - Handle network errors, validation errors, and auth failures explicitly.
    - Provide user-friendly error states in the UI.

---

### 11. Testing and Quality

49. The Agent must write tests for:
    - Convex business logic (queries, mutations, actions).
    - Critical Next.js routes and server actions.
    - Complex client components and hooks.

50. Where feasible, the Agent should use Bun's built-in test runner for unit and integration tests.

51. The Agent must ensure that:
    - Type checks pass (`tsc` or equivalent Next/Convex type check).
    - Biome lint and format checks pass.
    - Tests pass, or failures are explained and justified if unavoidable.

---

### 12. Agent Self-Governance

52. Before producing code, the Agent must:
    - Check that the proposed solution aligns with this constitution.
    - Prefer patterns that match the stack's official documentation and current community best practices.

53. After producing code, the Agent must perform a self-review:
    - Is the data validated at all boundaries?
    - Are server components used where possible?
    - Are state and side effects localized and justified?
    - Are Tailwind and shadcn/ui used consistently with the design system?
    - Are Bun, Biome, and strict TypeScript correctly configured?

54. When the Agent detects violations of this constitution in user-provided code, it must:
    - Call out the violations explicitly.
    - Suggest concrete refactors that move the code closer to constitutional compliance.

55. This constitution may be updated when:
    - Official documentation of the stack changes materially.
    - Security advisories or deprecations make current guidance unsafe.
    - New stable features replace older recommended patterns.

56. Until amended, the Agent must treat this document as binding on all autonomous coding behavior within the defined stack.

---

## Project-Specific Context: Taste with Your Eyes

### Application Overview

**Taste with Your Eyes** is a web app that extracts menus from photos and generates AI food images.

- **Frontend**: Next.js 16 with React 19, Tailwind CSS, shadcn/ui
- **Backend**: Convex (queries, mutations, actions)
- **AI Services**: 
  - OpenRouter (Gemini 2.5 Flash) for menu OCR/extraction
  - fal.ai (GPT-Image 1.5) for food image generation

### Key Files Reference

| File | Purpose |
|------|---------|
| `convex/schema.ts` | Database schema (menus, imageGenerations tables) |
| `convex/menus.ts` | Queries and mutations (V8 runtime) |
| `convex/menuActions.ts` | Actions using Node.js (`"use node"` for fal.ai, OpenRouter) |
| `src/lib/openrouter.ts` | AI service integrations (vision, image gen) |
| `src/lib/validation.ts` | Zod schemas with `nullToUndefined` helper |
| `src/lib/constants.ts` | App config, limits, rate limiting |
| `src/features/menu/MenuPage.tsx` | Main UI component |

### Environment Variables

#### Development (`.env.local`)
```bash
CONVEX_DEPLOYMENT=dev:patient-panda-554
NEXT_PUBLIC_CONVEX_URL=https://patient-panda-554.convex.cloud
OPENROUTER_API_KEY=sk-or-v1-...
FAL_KEY=...
```

#### Production
- **Convex prod URL**: `https://impartial-spaniel-33.convex.cloud`
- **Vercel env var**: `NEXT_PUBLIC_CONVEX_URL=https://impartial-spaniel-33.convex.cloud`
- **Convex dashboard**: Set `OPENROUTER_API_KEY` and `FAL_KEY` in environment variables

### Deployment Commands

```bash
# Development
bun run dev              # Start Next.js dev server
bun run convex:dev       # Start Convex dev (watches for changes)

# Quality checks (run before committing)
bun run check            # Runs: biome check && tsc --noEmit && bun test

# Deploy Convex to production
bunx convex deploy -y

# Deploy Next.js (via Vercel)
vercel --prod
# Or push to main branch if CI/CD is configured
```

### CI/CD Workflow

#### Pre-commit Checklist
1. `bun run check` passes (lint + types + tests)
2. `bun run build` succeeds
3. No hardcoded secrets or dev URLs

#### Deployment Order
1. **Convex first**: `bunx convex deploy -y`
2. **Next.js second**: `vercel --prod` or git push

#### Convex Environment Variables
Set these in Convex Dashboard → Settings → Environment Variables:
- `OPENROUTER_API_KEY`
- `FAL_KEY`

### Integration Tests

```bash
# Test fal.ai image generation directly
bun run test:integration:fal

# Test full Convex flow (requires menu image)
bun run test:integration:convex scripts/fixtures/tapas-menu.png

# Run all integration tests
bun run test:integration
```

### Common Gotchas & Solutions

#### 1. Convex deployment fails with "Only actions can be defined in Node.js"
**Cause**: File with `"use node"` contains queries or mutations.
**Solution**: Split into two files - keep queries/mutations in default runtime, move actions to `"use node"` file.

#### 2. Zod validation fails with "expected string, received null"
**Cause**: LLM APIs return `null` for missing fields, but Zod's `.optional()` only accepts `undefined`.
**Solution**: Use the `nullToUndefined` helper in `src/lib/validation.ts`.

#### 3. Convex types not updating after file changes
**Solution**: Run `bunx convex dev --once` to regenerate `convex/_generated/api.d.ts`.

#### 4. Wrong Convex URL in tests
**Cause**: Hardcoded URL doesn't match current deployment.
**Solution**: Use `process.env.NEXT_PUBLIC_CONVEX_URL` in test utilities.

#### 5. Images expire after 24 hours
**Cause**: fal.ai URLs are temporary.
**Future solution**: Store images in Convex file storage or external CDN.

### Rate Limiting

Client-side rate limiting is implemented in `src/lib/constants.ts`:
```typescript
export const RATE_LIMIT = {
  MIN_EXTRACTION_INTERVAL_MS: 30_000, // 30 seconds between extractions
  LAST_EXTRACTION_KEY: "twye_last_extraction",
} as const;
```

### Production Readiness Checklist

- [x] `robots.txt` and `sitemap.xml` configured
- [x] Console.logs cleaned (errors only)
- [x] Rate limiting implemented
- [x] Build passes
- [x] Convex deployed to prod
- [ ] Error monitoring (Sentry) - optional
- [ ] Analytics - optional
- [ ] Image persistence (currently 24h expiry) - future improvement
