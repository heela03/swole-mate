import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  bmi, bmiLabel, byId, groceryList, groupGrocery, mealProtein, portionsFor, proteinGoal, SLOTS,
  type Diet, type PlanMeal, type Sex,
} from "@/lib/meal";
import { similarRecipes } from "@/lib/rag";
import { draftPlan } from "@/lib/plan.functions";
import { FactBreak } from "@/components/fact-break";
import { downloadGroceryPdf } from "@/lib/grocery-pdf";
import { Download, ChefHat, Play } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Swole Mate — Big on protein. Bigger on flavour." },
      { name: "description", content: "Swole Mate makes protein tasty: personalised 1 or 3-day meal plans, grocery PDFs, fresh facts and recipes with videos." },
      { property: "og:title", content: "Swole Mate — Big on protein. Bigger on flavour." },
      { property: "og:description", content: "Tasty protein meal prep for 1 or 3 days, grocery PDFs and a little kitchen humour." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

const STEPS = ["Details", "Diet", "Plan", "Grocery", "Cook"];
const DIETS: { v: Diet; label: string; hint: string }[] = [
  { v: "veg", label: "Veg", hint: "Paneer, soya, dal, curd" },
  { v: "veg-egg", label: "Veg + Egg", hint: "Everything veg, plus eggs" },
  { v: "non-veg", label: "Non-veg", hint: "Chicken, fish, mutton too" },
];

function App() {
  const [step, setStep] = useState(0);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [sex, setSex] = useState<Sex>("male");
  const [diet, setDiet] = useState<Diet>("veg");
  const [note, setNote] = useState("");
  const [days, setDays] = useState<1 | 3>(3);
  const [groceryScope, setGroceryScope] = useState<string>("all");
  const [plan, setPlan] = useState<PlanMeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [owned, setOwned] = useState<Record<string, boolean>>({});
  const [openRecipe, setOpenRecipe] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const draft = useServerFn(draftPlan);

  const w = Number(weight), h = Number(height);
  const valid = w > 25 && w < 300 && h > 100 && h < 250;
  const goal = valid ? proteinGoal(w, h, sex) : 0;
  const b = valid ? bmi(w, h) : 0;

  async function makePlan() {
    setLoading(true);
    try {
      const res = await draft({ data: { goal, diet, days, note: note || undefined } });
      setPlan(res.plan);
      setGroceryScope("all");
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  const grocery = useMemo(
    () => groceryList(groceryScope === "all" ? plan : plan.filter((m) => `${m.day}-${m.slot}` === groceryScope)),
    [plan, groceryScope],
  );
  const groups = groupGrocery(grocery);
  const isOwned = (name: string, pantry: boolean) => owned[name] ?? pantry;
  const toBuy = grocery.filter((g) => !isOwned(g.name, g.pantry));

  async function download() {
    setExporting(true);
    setDownloadError("");
    const selected = groceryScope === "all" ? plan : plan.filter((m) => `${m.day}-${m.slot}` === groceryScope);
    try {
      await downloadGroceryPdf(toBuy, groceryScope === "all" ? `${days}-day plan` : "Selected dish",
        selected.map((m) => `Day ${m.day} - ${m.slot}: ${byId(m.recipeId)?.name ?? ""}`));
    } catch {
      setDownloadError("Your PDF couldn't be saved. Please try again.");
    } finally { setExporting(false); }
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-10">
      <header className="no-print mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold md:text-5xl">Swole <span className="text-primary">Mate</span></h1>
          <p className="mt-1 text-muted-foreground">Big on protein. Bigger on flavour.</p>
        </div>
        <nav aria-label="Meal prep steps" className="flex flex-wrap gap-1">
          {STEPS.map((s, i) => (
            <Button
              key={s}
              disabled={i > 1 && plan.length === 0}
              onClick={() => setStep(i)}
              className={`rounded-full px-3 py-1 text-sm transition disabled:opacity-40 ${i === step ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
            >
              {i + 1}. {s}
            </Button>
          ))}
        </nav>
      </header>

      {step === 2 && <FactBreak key="facts" />}

      {step === 0 && (
        <section className="grid gap-6 rounded-3xl bg-card p-8 shadow-soft md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Your details</h2>
            <label className="block text-sm font-medium">Weight (kg)
              <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" className="mt-1" />
            </label>
            <label className="block text-sm font-medium">Height (cm)
              <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" className="mt-1" />
            </label>
            <div className="flex gap-2">
              {(["male", "female"] as Sex[]).map((s) => (
                <Button key={s} variant={sex === s ? "default" : "outline"} onClick={() => setSex(s)} className="flex-1">
                  {s === "male" ? "Guy" : "Girl"}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-2xl bg-secondary p-6">
            {valid ? (
              <div className="space-y-4">
                <div><p className="text-sm text-muted-foreground">BMI</p><p className="font-display text-4xl font-bold">{b} <span className="text-lg font-medium text-muted-foreground">{bmiLabel(b)}</span></p></div>
                <div><p className="text-sm text-muted-foreground">Daily protein goal</p><p className="font-display text-5xl font-bold text-primary">{goal} g</p>
                  <p className="text-sm text-muted-foreground">≈ {Math.round(goal / 3)} g per meal</p></div>
              </div>
            ) : <p className="text-muted-foreground">Enter your weight and height to see your protein goal.</p>}
            <Button disabled={!valid} onClick={() => setStep(1)} className="mt-6">Next: choose diet</Button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-6 rounded-3xl bg-card p-8 shadow-soft">
          <h2 className="text-2xl font-bold">What do you eat?</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {DIETS.map((d) => (
              <button key={d.v} onClick={() => setDiet(d.v)}
                className={`rounded-2xl border-2 p-5 text-left transition ${diet === d.v ? "border-primary bg-secondary" : "border-border"}`}>
                <p className="font-display text-xl font-bold">{d.label}</p>
                <p className="text-sm text-muted-foreground">{d.hint}</p>
              </button>
            ))}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">How long do you want to prep for?</p>
            <div className="flex gap-2">
              {([1, 3] as const).map((d) => (
                <Button key={d} variant={days === d ? "default" : "outline"} onClick={() => setDays(d)}>
                  {d === 1 ? "Just 1 day (3 meals)" : "3 days (9 meals)"}
                </Button>
              ))}
            </div>
          </div>
          <label className="block text-sm font-medium">Anything else? (optional)
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. quick breakfasts, more South Indian" className="mt-1" />
          </label>
          <Button onClick={makePlan} disabled={loading || !valid} size="lg">{loading ? "Building your plan…" : `Make my ${days}-day plan`}</Button>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-6">
          <p className="text-sm text-muted-foreground">Click "Swap" to see similar recipes.</p>
          {[...new Set(plan.map((m) => m.day))].map((day) => {
            const meals = plan.filter((m) => m.day === day);
            const total = Math.round(meals.reduce((s, m) => s + mealProtein(m), 0));
            return (
              <div key={day} className="rounded-3xl bg-card p-6 shadow-soft">
                <div className="mb-4 flex items-baseline justify-between">
                  <h2 className="text-2xl font-bold">Day {day}</h2>
                  <span className={`text-sm font-semibold ${total >= goal * 0.9 ? "text-primary" : "text-accent-foreground"}`}>{total} / {goal} g protein</span>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {SLOTS.map((slot) => {
                    const m = meals.find((x) => x.slot === slot);
                    return m ? <MealCard key={slot} meal={m} diet={diet} goal={goal}
                      onSwap={(id) => { const recipe = byId(id); if (!recipe) return; setPlan((p) => p.map((x) => x === m ? { ...x, recipeId: id, portions: portionsFor(recipe, goal / 3) } : x)); }} /> : null;
                  })}
                </div>
              </div>
            );
          })}
          <Button size="lg" onClick={() => setStep(3)}>Looks good — show grocery list</Button>
        </section>
      )}

      {step === 3 && (
        <section className="rounded-3xl bg-card p-8 shadow-soft">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-2xl font-bold">Grocery list</h2>
            <p className="text-sm text-muted-foreground">Switch on what you already have at home. {toBuy.length} items to buy.</p>
          </div>
          <div className="mb-6 flex flex-wrap gap-2">
            <button onClick={() => setGroceryScope("all")}
              className={`rounded-full px-3 py-1 text-sm transition ${groceryScope === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
              All meals ({plan.length})
            </button>
            {plan.map((m) => {
              const k = `${m.day}-${m.slot}`;
              return (
                <button key={k} onClick={() => setGroceryScope(k)}
                  className={`rounded-full px-3 py-1 text-sm transition ${groceryScope === k ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                  {plan.length > 3 ? `Day ${m.day} · ` : ""}{byId(m.recipeId)?.name}
                </button>
              );
            })}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {groups.map((grp) => (
            <div key={grp.key} className="rounded-2xl border border-border p-4">
            <h3 className="mb-2 font-display text-lg font-bold text-primary">{grp.label} <span className="text-xs font-normal text-muted-foreground">({grp.items.length})</span></h3>
            <div className="divide-y divide-border">
            {grp.items.map((g) => {
              const have = isOwned(g.name, g.pantry);
              return (
                <div key={g.name} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div className={have ? "text-muted-foreground line-through" : ""}>
                    <span className="font-medium">{g.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="w-28 text-right text-sm tabular-nums">{g.count ? `${g.count} pc · ` : ""}{g.grams} g</span>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      Have it <Switch checked={have} onCheckedChange={(v) => setOwned((o) => ({ ...o, [g.name]: v }))} />
                    </label>
                  </div>
                </div>
              );
            })}
            </div>
            </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={download} disabled={!toBuy.length || exporting}><Download />{exporting ? "Saving PDF…" : "Download grocery PDF"}</Button>
            <Button variant="outline" onClick={() => setStep(4)}>Start cooking</Button>
          </div>
          {downloadError && <p role="alert" className="mt-3 text-sm text-destructive">{downloadError}</p>}
        </section>
      )}

      {step === 4 && (
        <section>
          <div className="mb-6 border-b border-border pb-5">
            <p className="mb-2 text-primary"><ChefHat aria-label="Apron on" /></p>
            <h2 className="font-display text-3xl font-bold">Let’s turn those gains into dinner.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            {plan.map((m) => {
              const r = byId(m.recipeId);
              if (!r) return null;
              return (
                <Button variant="ghost" key={`${m.day}${m.slot}`} onClick={() => setOpenRecipe(r.id)}
                  className={`h-auto w-full flex-col items-start whitespace-normal rounded-lg p-3 text-left text-sm transition ${openRecipe === r.id ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                  <span className="text-xs uppercase opacity-70">Day {m.day} · {m.slot}</span>{r.name}
                </Button>
              );
            })}
          </div>
          <RecipeView id={openRecipe ?? plan[0]?.recipeId} portions={plan.find((m) => m.recipeId === (openRecipe ?? plan[0]?.recipeId))?.portions ?? 1} />
          </div>
        </section>
      )}
    </main>
  );
}

function MealCard({ meal, diet, goal, onSwap }: { meal: PlanMeal; diet: Diet; goal: number; onSwap: (id: string) => void }) {
  const r = byId(meal.recipeId);
  const [open, setOpen] = useState(false);
  if (!r) return null;
  const alts = open ? similarRecipes(r.id, meal.slot, diet, 4) : [];
  return (
    <div className="flex flex-col rounded-2xl border border-border p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">{meal.slot}</p>
      <p className="mt-1 font-semibold leading-snug">{r.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">{meal.portions}× serving · {Math.round(r.protein * meal.portions)} g protein · {r.time} min</p>
      <Button variant="ghost" size="sm" className="mt-auto self-start px-0" onClick={() => setOpen(!open)}>{open ? "Close" : "Swap"}</Button>
      {open && (
        <div className="mt-2 space-y-1">
          {alts.map((a) => (
            <button key={a.id} onClick={() => { onSwap(a.id); setOpen(false); }} className="block w-full rounded-lg bg-secondary px-2 py-1.5 text-left text-xs hover:bg-muted">
              {a.name} <span className="text-muted-foreground">· {Math.round(a.protein * portionsFor(a, goal / 3))} g · {Math.round(a.score * 100)}% match</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function youtubeId(url: string) {
  const m = url.match(/(?:shorts\/|v=|youtu\.be\/)([\w-]{11})/);
  return m?.[1];
}

function RecipeView({ id, portions }: { id?: string | undefined; portions: number }) {
  const r = id ? byId(id) : undefined;
  if (!r) return null;
  const yt = youtubeId(r.url);
  const scale = portions / r.servings;
  return (
    <article className="min-w-0 bg-card p-5 md:p-8">
      <h2 className="text-3xl font-bold">{r.name}</h2>
      <p className="mt-2 text-muted-foreground">{r.description}</p>
      <p className="mt-2 text-sm">{r.time} min · {r.skill} · {r.equipment} · {Math.round(r.protein * portions)} g protein for your portion</p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-lg font-bold">Meet the tasty little suspects</h3>
          <p className="mb-3 text-xs text-muted-foreground">Scaled to your portion. No ingredient left behind.</p>
          <ul className="space-y-1 text-sm">
            {r.ingredients.map((i) => <li key={i.name}>{i.name} — {Math.ceil(i.grams * scale)} g <span className="text-muted-foreground">({i.amount} in original)</span></li>)}
          </ul>
        </div>
        {yt && (
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><Play className="size-4 text-primary" /> Your chef cameo starts here</p>
            <div className="mx-auto aspect-[9/16] w-full max-w-[270px] overflow-hidden rounded-lg">
            <iframe loading="lazy" className="h-full w-full" src={`https://www.youtube.com/embed/${yt}`} title={r.name} allowFullScreen />
            </div>
          </div>
        )}
      </div>
      <h3 className="mb-2 mt-6 text-lg font-bold">Okay chef, here’s the game plan</h3>
      <p className="mb-4 text-sm text-muted-foreground">One step at a time. This is dinner, not a cooking-show elimination round.</p>
      <ol className="list-decimal space-y-2 pl-5">{r.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
      <a href={r.url} target="_blank" rel="noreferrer" className="mt-6 inline-block font-semibold text-primary underline">Watch the chef work their magic ↗</a>
    </article>
  );
}
