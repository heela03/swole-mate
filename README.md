# Swole Mate

Big on protein. Bigger on flavour.

Swole Mate turns your weight, height and diet into a 1-day or 3-day meal plan with
protein targets, a grocery list you can download as a PDF, and recipes with steps
plus an embedded cooking video.

## Run it yourself

You need [Bun](https://bun.sh) (recommended, `bun.lock` is included) or Node.js 20+.

```sh
bun install     # or: npm install
bun run dev     # or: npm run dev
```

Then open the URL it prints (usually http://localhost:5173).

Other commands:

```sh
bun run build     # production build (Nitro picks the target: Vercel, Netlify, Cloudflare, Node)
bun run preview   # serve the production build locally
bun test          # 16 unit tests
bun run lint      # ESLint
```

## Optional: the AI planner

Everything works with no keys at all — the plan is then built by the deterministic
planner in `src/lib/meal.ts`. To switch plan drafting over to an AI model, set a key
for any OpenAI-compatible provider (several have free tiers):

```sh
export AI_API_KEY=your_provider_key
export AI_BASE_URL=https://api.groq.com/openai/v1   # omit for OpenAI
export AI_MODEL=llama-3.3-70b-versatile             # optional — smart default per provider
bun run dev
```

Or copy `.env.example` to `.env` and fill it in — the dev server reads it.

Keys are only read server-side (`src/lib/plan.functions.ts`) and never ship to the
browser. If the key is missing or the provider errors, the app silently uses the
fallback plan, so nothing breaks. Whichever model you use, the app still validates
every recipe it picks against the filtered pool — the AI only chooses ids, the rules
stay in code.

## Deploying (Vercel)

1. Push the repo to GitHub and import it in Vercel. Framework preset: auto-detected.
   Build command `bun run build` (or `npm run build`); no output directory needed.
2. Add `AI_API_KEY`, `AI_BASE_URL` and `AI_MODEL` under Project → Settings →
   Environment Variables (optional — skip them to run on the rules-based planner).
3. Deploy. Nitro detects Vercel and produces the right output on its own.

## What's where

| Path | What it does |
| --- | --- |
| `src/routes/index.tsx` | The 5-step flow: details, diet, plan, grocery, cook |
| `src/lib/meal.ts` | BMI, protein goal, diet filter, portions, grocery merge — exact rules |
| `src/lib/rag.ts` | Semantic "swap this meal" suggestions (cosine similarity) |
| `src/lib/plan.functions.ts` | Server function that asks the model for recipe ids |
| `src/lib/grocery-pdf.ts` | Grocery list PDF, generated in the browser |
| `src/lib/facts.ts` | Rotating protein / fitness / cooking facts on the plan page |
| `src/data/recipes.json` | The 65-recipe library (exported from the source spreadsheet) |
| `src/data/embeddings.json` | Precomputed recipe vectors, so swaps need no API key |

Recipes come from a spreadsheet: if that changes, regenerate `src/data/recipes.json`
and `src/data/embeddings.json` rather than hand-editing them.

## Built with

TanStack Start v1 (React 19, SSR), TanStack Router + Query, Tailwind CSS v4,
shadcn/ui on Radix, zod, jsPDF, Vite, TypeScript, Vitest. AI calls use the Vercel AI
SDK against any OpenAI-compatible provider; embeddings are gemini-embedding-2
(256 dims, precomputed offline).
