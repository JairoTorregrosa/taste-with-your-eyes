# AGENTS.md

## Quick Reference

| Command | Purpose |
|---------|---------|
| `bun run dev` | Start Next.js dev server |
| `bun run convex:dev` | Start Convex dev (watches for changes) |
| `bun run check` | **Run before committing**: lint + types + tests |
| `bun run build` | Production build |
| `bun test` | Run all tests |
| `bun test src/lib/__tests__/base64.test.ts` | Run a single test file |
| `bun test --watch` | Run tests in watch mode |
| `bunx convex deploy -y` | Deploy Convex to **Production** (impartial-spaniel-33) |
| `bun run convex:push` | Push to **Development** (patient-panda-554) |

---

## Tech Stack

- **Runtime**: Bun (package manager, test runner, script runner)
- **Framework**: Next.js 16 (App Router, React 19, React Compiler enabled)
- **Backend**: Convex (queries, mutations, actions)
- **Validation**: Zod (runtime validation) + Convex validators
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Linting/Formatting**: Biome (no ESLint/Prettier)

---

## Code Style

### Imports

Order: external libs, `@/` aliased imports, relative imports. No blank lines between groups.

```typescript
"use client";

import { useAction, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/src/components/ui/button";
import { LIMITS } from "@/src/lib/constants";
import type { MenuPayload } from "@/src/lib/validation";
```

- Use `import type { X }` for type-only imports
- Use inline `type` for mixed imports: `import { type Foo, Bar }`
- Path alias `@/*` maps to project root

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| React components | PascalCase | `MenuPage.tsx`, `ErrorBanner` |
| Feature folders | kebab-case | `src/features/menu/` |
| Utility files | camelCase | `validation.ts`, `constants.ts` |
| shadcn/ui components | kebab-case | `button.tsx`, `error-boundary.tsx` |
| Convex files | camelCase | `menus.ts`, `menuActions.ts` |
| Constants | SCREAMING_SNAKE_CASE | `LIMITS`, `RATE_LIMIT` |
| Boolean state | `is`/`has`/`show` prefix | `isProcessing`, `hasError` |
| Event handlers | `handle` prefix | `handleClick`, `handleSubmit` |
| Zod schemas | camelCase + `Schema` | `menuItemSchema` |
| Types from Zod | PascalCase | `type MenuItem = z.infer<typeof menuItemSchema>` |

### Formatting (Biome)

- 2-space indentation
- No trailing semicolons (Biome default)
- Run `bun run format` to auto-fix

### TypeScript

- **Strict mode enabled** - no `any`, prefer `unknown` + validation
- Prefer inferred types over redundant annotations
- Use discriminated unions for state: `type Status = "idle" | "loading" | "done"`
- Use `as const` for constant objects

```typescript
export const LIMITS = {
  MAX_DOCUMENT_SIZE_BYTES: 700 * 1024,
  MAX_IMAGES_PER_MENU: 10,
} as const;
```

---

## Error Handling

### Pattern: Type-check errors before using

```typescript
try {
  const result = await someAction();
} catch (err) {
  setError(err instanceof Error ? err.message : "Unknown error");
}
```

### Logging: Use console.error only, with context prefix

```typescript
console.error("[extractMenu] Failed:", error.message);
console.error(`[fal.ai] Image generation failed for "${name}":`, err);
```

### Validation: Use Zod's safeParse

```typescript
const result = schema.safeParse(data);
if (!result.success) {
  throw new Error(`Invalid data: ${result.error.message}`);
}
return result.data;
```

---

## Convex Rules (CRITICAL)

### Two Runtimes

| Runtime | Directive | Can contain |
|---------|-----------|-------------|
| V8 (default) | None | `query`, `mutation`, `internalQuery`, `internalMutation` |
| Node.js | `"use node"` | `action`, `internalAction` ONLY |

**CRITICAL**: Files with `"use node"` can ONLY export actions. Queries/mutations will cause deployment errors.

### File Organization

- `convex/menus.ts` - queries and mutations (V8 runtime)
- `convex/menuActions.ts` - actions with `"use node"` (for external APIs)
- `convex/schema.ts` - database schema

After splitting Convex files, update all imports:
- Frontend: `api.oldModule.action` -> `api.newModule.action`
- Run `bunx convex dev --once` to regenerate types

---

## Testing

```bash
# Run all tests
bun test

# Run single test file
bun test src/lib/__tests__/base64.test.ts

# Run tests matching pattern
bun test --grep "saveMenu"

# Watch mode
bun test --watch
```

### Test File Conventions

- Location: `__tests__/` folder or `.test.ts` suffix
- Use `bun:test` imports: `import { describe, expect, test } from "bun:test"`

```typescript
import { describe, expect, test } from "bun:test";
import { stringToBase64 } from "@/src/lib/base64";

test("encodes string to base64", () => {
  expect(stringToBase64("hello")).toBe("aGVsbG8=");
});
```

---

## Component Structure

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";

type Props = {
  message: string;
  onRetry?: () => void;
};

export function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div className="p-4 bg-red-100 rounded">
      <p>{message}</p>
      {onRetry && <Button onClick={onRetry}>Retry</Button>}
    </div>
  );
}
```

- `"use client"` at top when using hooks/browser APIs
- Props type defined before component
- Named exports preferred

---

## Common Gotchas

1. **"Only actions can be defined in Node.js"** - File with `"use node"` contains queries/mutations. Split the file.

2. **Zod fails with "expected string, received null"** - LLM APIs return `null`. Use the helper:
   ```typescript
   const nullToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
     z.preprocess((val) => (val === null ? undefined : val), schema);
   ```

3. **Convex types not updating** - Run `bunx convex dev --once` to regenerate.

4. **fal.ai image URLs expire** - URLs are temporary (24h). Store in Convex file storage for persistence.

---

## Project Structure

```
/app                    # Next.js App Router pages
/convex                 # Convex backend (schema, queries, mutations, actions)
/src/components/ui      # shadcn/ui primitives (don't modify)
/src/components/shared  # Reusable wrappers
/src/features/*         # Feature modules (UI + hooks)
/src/lib                # Utilities, validation, constants
```

---

## Pre-commit Checklist

1. `bun run check` passes (lint + types + tests)
2. `bun run build` succeeds
3. No hardcoded secrets or dev URLs
