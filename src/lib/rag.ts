import embeddings from "@/data/embeddings.json";
import { byId, cosine, poolFor, type Diet, type Recipe, type Slot } from "./meal";

const EMB = embeddings as Record<string, number[]>;

/** Retrieval: recipes in the same slot + diet, ranked by meaning similarity. */
export function similarRecipes(recipeId: string, slot: Slot, diet: Diet, k = 5): (Recipe & { score: number })[] {
  const q = EMB[recipeId];
  if (!q) return [];
  return poolFor(slot, diet)
    .filter((r) => r.id !== recipeId && EMB[r.id])
    .map((r) => ({ ...r, score: cosine(q, EMB[r.id] ?? []) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export { byId };
