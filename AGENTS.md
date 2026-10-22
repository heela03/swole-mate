# Project rules

- Recipe data lives in `src/data/recipes.json` (exported from the user's spreadsheet); rebuild it from the xlsx instead of hand-editing, so it stays in sync with the source.
- Recipe embeddings are precomputed in `src/data/embeddings.json` (gemini-embedding-2, 256 dims, normalized); regenerate when recipes change — swaps rely on them client-side with no runtime key.
- Exact rules (BMI, protein goal, diet filter, portions, grocery merge) live in `src/lib/meal.ts` with tests in `src/test/meal.test.ts`; the AI only picks recipe ids, and code validates them against the filtered pool.
- Grocery PDF generation is client-only and dynamically loaded; export the current filtered, needed items so downloads match the shopping view.
- Select sourced facts after hydration and exclude the previous session selection; browser refresh memory must not affect SSR rendering.
