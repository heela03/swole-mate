import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { FACTS, nextFactIndex } from "@/lib/facts";

export function FactBreak() {
  const [index, setIndex] = useState<number | null>(null);
  useEffect(() => {
    let previous = -1;
    try {
      const saved = sessionStorage.getItem("swole-mate-last-fact");
      previous = saved === null ? -1 : Number(saved);
    } catch { /* Facts still work when browser storage is unavailable. */ }
    const next = nextFactIndex(previous);
    setIndex(next);
    try { sessionStorage.setItem("swole-mate-last-fact", String(next)); } catch { /* Optional refresh memory. */ }
  }, []);
  const fact = index === null ? undefined : FACTS[index];
  return (
    <aside className="my-6 flex min-h-32 items-start gap-3 border-l-4 border-primary bg-secondary px-5 py-4" aria-label="Swole little fact">
      <Lightbulb className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-primary">Swole little fact {fact ? `· ${fact.category}` : ""}</p>
        <p className="mt-1 text-sm leading-relaxed">{fact?.text ?? "A little food for thought…"}</p>
        {fact && <a href={fact.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-muted-foreground underline">Source: {fact.source} ↗</a>}
      </div>
    </aside>
  );
}