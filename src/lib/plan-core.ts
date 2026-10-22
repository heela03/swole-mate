import { basicPlan, poolFor, portionsFor, SLOTS, type Diet, type PlanMeal } from "./meal";

export type PlanInput = { goal: number; diet: Diet; note?: string | undefined; days: 1 | 3 };
export type PlanResult = { plan: PlanMeal[]; source: "ai" | "basic"; reason?: string };

// Smart default model when AI_MODEL is not set.
// (Google retired the Gemini 2.5 family in Oct 2026, so we use the "-latest" alias.)
function guessModel(baseURL?: string): string {
  const url = baseURL ?? "";
  if (url.includes("generativelanguage")) return "gemini-flash-lite-latest";
  if (url.includes("groq")) return "llama-3.3-70b-versatile";
  if (url.includes("openrouter")) return "openai/gpt-4o-mini";
  if (url.includes("deepseek")) return "deepseek-chat";
  return "gpt-4o-mini";
}

/**
 * Retrieval + generation: the model may only pick recipe ids from the diet-filtered
 * pool, and every id it returns is re-checked against that pool in code.
 * Falls back to the rules-based plan if there is no key or anything goes wrong.
 */
export async function generatePlan(data: PlanInput): Promise<PlanResult> {
  const fallback = basicPlan(data.goal, data.diet, data.days);

  // Any OpenAI-compatible provider works.
  // AI_API_KEY (required to activate), AI_BASE_URL and AI_MODEL (optional).
  const apiKey = process.env["AI_API_KEY"];
  const baseURL = process.env["AI_BASE_URL"];
  const modelName = process.env["AI_MODEL"];
  if (!apiKey) return { plan: fallback, source: "basic", reason: "AI not configured" };

  const target = data.goal / 3;

  // Retrieval step: the only recipes the model may use (already diet-filtered).
  const context = SLOTS.map((slot) => {
    const rows = poolFor(slot, data.diet)
      .map(
        (r) =>
          `${r.id} | ${r.name} | ${r.protein}g protein/serving | ${r.calories} kcal | ${r.cuisine} | ${r.time} min`,
      )
      .join("\n");
    return `## ${slot} options\n${rows}`;
  }).join("\n\n");

  try {
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { generateText } = await import("ai");
    const provider = createOpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
    // .chat() = the classic /chat/completions endpoint that Groq, Gemini,
    // OpenRouter etc. all support. (The default provider(...) call uses
    // OpenAI's newer /responses endpoint, which most of them do not.)
    const model = provider.chat(modelName || guessModel(baseURL));
    const result = await generateText({
      model,
      system:
        "You are a meal-prep planner. Pick recipes ONLY from the provided options by id. Prefer variety, mix cuisines, and aim each meal near the per-meal protein target. Reply with JSON only.",
      prompt: `Daily protein goal: ${data.goal} g (about ${Math.round(target)} g per meal).
${data.note ? `User preference: ${data.note}\n` : ""}
${context}

Return JSON: {"days":[{"breakfast":"ID","lunch":"ID","dinner":"ID"}, x${data.days} day(s)]}`,
      maxRetries: 0,
    });

    const text = result.text;
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    const plan: PlanMeal[] = [];
    for (let d = 0; d < data.days; d++) {
      for (const slot of SLOTS) {
        const id = json.days?.[d]?.[slot];
        // Code check: id must come from the retrieved pool for that slot.
        const r = poolFor(slot, data.diet).find((x) => x.id === id);
        const fb = fallback.find((m) => m.day === d + 1 && m.slot === slot)!;
        plan.push(r ? { day: d + 1, slot, recipeId: r.id, portions: portionsFor(r, target) } : fb);
      }
    }
    return { plan, source: "ai" };
  } catch (e) {
    console.error("generatePlan failed", e);
    return { plan: fallback, source: "basic", reason: "AI planner unavailable" };
  }
}
