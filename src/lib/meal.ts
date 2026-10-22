import recipesData from "@/data/recipes.json";

export type Ingredient = { name: string; grams: number; amount: string; pantry: boolean; category: string };
export type Recipe = {
  id: string; name: string; diet: "veg" | "egg" | "non-veg"; protein_source: string; cuisine: string;
  meal: string; servings: number; time: number; equipment: string; skill: string; url: string;
  creator: string; description: string; protein: number; calories: number; carbs: number; fat: number;
  ingredients: Ingredient[]; steps: string[];
};
export type Sex = "male" | "female";
export type Diet = "veg" | "veg-egg" | "non-veg";
export type Slot = "breakfast" | "lunch" | "dinner";
export const SLOTS: Slot[] = ["breakfast", "lunch", "dinner"];
export type PlanMeal = { day: number; slot: Slot; recipeId: string; portions: number };

export const RECIPES = recipesData as Recipe[];
export const byId = (id: string) => RECIPES.find((r) => r.id === id);

export function bmi(weightKg: number, heightCm: number) {
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function bmiLabel(b: number) {
  if (b < 18.5) return "Underweight";
  if (b < 25) return "Healthy";
  if (b < 30) return "Overweight";
  return "Obese";
}

/** Daily protein goal (g). Uses 1.4 g/kg for guys, 1.2 g/kg for girls.
 * When BMI is 25+, uses the weight at BMI 25 instead so the goal isn't inflated. */
export function proteinGoal(weightKg: number, heightCm: number, sex: Sex) {
  const m = heightCm / 100;
  const w = bmi(weightKg, heightCm) >= 25 ? 25 * m * m : weightKg;
  return Math.round(w * (sex === "male" ? 1.4 : 1.2));
}

export function allowedDiets(diet: Diet): Recipe["diet"][] {
  if (diet === "veg") return ["veg"];
  if (diet === "veg-egg") return ["veg", "egg"];
  return ["veg", "egg", "non-veg"];
}

export function poolFor(slot: Slot, diet: Diet) {
  const ok = allowedDiets(diet);
  const meals = slot === "breakfast" ? ["breakfast", "snack"] : ["lunch", "dinner"];
  return RECIPES.filter((r) => ok.includes(r.diet) && meals.includes(r.meal));
}

/** Portions (0.5 steps, 0.5–2) so one meal lands near a third of the daily goal. */
export function portionsFor(recipe: Recipe, mealTarget: number) {
  const p = Math.round((mealTarget / Math.max(recipe.protein, 1)) * 2) / 2;
  return Math.min(2, Math.max(0.5, p));
}

export function mealProtein(m: PlanMeal) {
  const r = byId(m.recipeId);
  return r ? r.protein * m.portions : 0;
}

/** Grocery sections in shopping order, with friendly labels. */
export const CATEGORY_ORDER: { key: string; label: string }[] = [
  { key: "vegetable", label: "Veggies" },
  { key: "fruit", label: "Fruits" },
  { key: "dairy", label: "Dairy" },
  { key: "meat and egg", label: "Meat & eggs" },
  { key: "legume and soy", label: "Dals, legumes & soy" },
  { key: "grain", label: "Grains & flours" },
  { key: "nut and seed", label: "Nuts & seeds" },
  { key: "oil", label: "Oils" },
  { key: "spice or seasoning", label: "Spices & seasoning" },
  { key: "other", label: "Other" },
];

/** Piece count for countable ingredients (onion, garlic, eggs…), parsed from the
 * original amount text so no data rebuild is needed. Returns null when not countable. */
const COUNT_CATEGORIES = new Set(["vegetable", "fruit", "meat and egg"]);

export function ingredientCount(amount: string): number | null {
  const s = amount.trim().toLowerCase();
  if (/^a handful/.test(s)) return 1;
  const word = s.match(/^(\d+)\s+([a-z-]+)/);
  if (word) {
    const unit = word[2] ?? "";
    // Weight/volume units and ranges ("1 lb", "1 to coat") are not piece counts.
    if (/^(lbs?|kg|cups?|tbsp|tsp|ml|oz|g)$/.test(unit) || unit === "to") return null;
    return Number(word[1]);
  }
  const bare = s.match(/^(\d+)(?:\s*[,(]|\s*\(|$)/);
  return bare ? Number(bare[1]) : null;
}

export function groupGrocery(items: GroceryItem[]) {
  const known = new Set(CATEGORY_ORDER.map((c) => c.key));
  return CATEGORY_ORDER.map((c) => ({
    ...c,
    items: items.filter((g) => (known.has(g.category) ? g.category : "other") === c.key),
  })).filter((g) => g.items.length > 0);
}

/** Deterministic plan: closest-protein recipes, avoiding repeats where possible. */
export function basicPlan(goal: number, diet: Diet, days = 3): PlanMeal[] {
  const target = goal / 3;
  const used = new Set<string>();
  const plan: PlanMeal[] = [];
  for (let day = 1; day <= days; day++) {
    for (const slot of SLOTS) {
      const pool = poolFor(slot, diet).sort(
        (a, b) => Math.abs(a.protein - target) - Math.abs(b.protein - target),
      );
      const pick = pool.find((r) => !used.has(r.id)) ?? pool[(day - 1) % pool.length];
      if (!pick) continue;
      used.add(pick.id);
      plan.push({ day, slot, recipeId: pick.id, portions: portionsFor(pick, target) });
    }
  }
  return plan;
}

export type GroceryItem = { name: string; grams: number; count: number | null; category: string; pantry: boolean; uses: number };

export function groceryList(plan: PlanMeal[]): GroceryItem[] {
  const map = new Map<string, GroceryItem>();
  for (const m of plan) {
    const r = byId(m.recipeId);
    if (!r) continue;
    const scale = m.portions / r.servings;
    for (const ing of r.ingredients) {
      const key = ing.name.trim().toLowerCase();
      const cur = map.get(key) ?? { name: ing.name.trim(), grams: 0, count: null, category: ing.category, pantry: ing.pantry, uses: 0 };
      cur.grams += ing.grams * scale;
      if (COUNT_CATEGORIES.has(ing.category)) {
        const cnt = ingredientCount(ing.amount);
        if (cnt !== null) cur.count = (cur.count ?? 0) + cnt * scale;
      }
      cur.uses += 1;
      map.set(key, cur);
    }
  }
  return [...map.values()]
    .map((g) => ({ ...g, grams: Math.ceil(g.grams), count: g.count === null ? null : Math.ceil(g.count) }))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

export function cosine(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] ?? 0) * (b[i] ?? 0);
  return s;
}
