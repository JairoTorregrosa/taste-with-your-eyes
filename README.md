## Taste with Your Eyes

A single-page experience that turns a photo of a restaurant menu into an interactive, branded web menu with extracted text and generated dish visuals. Built with Next.js (App Router), TypeScript, Convex, Tailwind, Zod, and the OpenRouter SDK (Gemini 2.5 Flash + Gemini 2.5 Flash Image).

## Prerequisites
- Bun >= 1.1
- Node >= 20 (for Next.js tooling)
- Convex project + `NEXT_PUBLIC_CONVEX_URL`
- OpenRouter API key with access to `google/gemini-2.5-flash` and `google/gemini-2.5-flash-image`

## Environment
Create a `.env` file (or use your secret manager):

```
OPENROUTER_API_KEY=sk-or-...
NEXT_PUBLIC_CONVEX_URL=https://<your-convex-deployment>.convex.cloud
```

Do not commit real secrets. The client will surface a friendly error if `NEXT_PUBLIC_CONVEX_URL` is missing.

### Local Convex (dev)
1. Put secrets in `.env.local` (same keys as above).  
2. Start Convex dev with your local env so actions see `OPENROUTER_API_KEY`:
   - `bunx convex dev --env .env.local`
   - This syncs the vars to the dev deployment used by the local server.
3. Set `NEXT_PUBLIC_CONVEX_URL` in `.env.local` to the dev URL printed by `convex dev`.  
4. Run the Next.js app: `bun run dev`.

## Scripts
- `bun run dev` — start Next.js
- `bun run lint` — Biome lint/format check
- `bun run check` — Biome check + `tsc --noEmit`
- `bun run build` — Next.js production build

## Flow
1) Upload or capture a menu photo.  
2) Convex action calls OpenRouter (Gemini 2.5 Flash) to OCR/parse categories, items, and pricing.  
3) Dish thumbnails are generated via Gemini 2.5 Flash Image (with graceful fallbacks).  
4) Parsed menus can be saved to Convex by anonymous session ID for later retrieval.
