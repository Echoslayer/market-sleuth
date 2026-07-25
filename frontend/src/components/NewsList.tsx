import { useState } from "react";
import type { RoundScore } from "../game/scoreRound";
import { cn } from "../lib/cn";
import type { NewsItem } from "../types/scenario";
import { NewsDetailDialog } from "./NewsDetailDialog";

type NewsListProps = {
  newsItems: NewsItem[];
  selectedNewsIds: string[];
  onToggle: (id: string) => void;
  score?: RoundScore;
  debugKeyEvents?: boolean;
};

export function NewsList({ newsItems, selectedNewsIds, onToggle, score, debugKeyEvents = false }: NewsListProps) {
  const selected = new Set(selectedNewsIds);
  const [openItem, setOpenItem] = useState<NewsItem | null>(null);

  return (
    <div className="space-y-3">
      {newsItems.map((item) => (
        <div key={item.id} className="flex items-center gap-3 rounded border border-slate-200 bg-white p-4 shadow-sm">
          <button type="button" onClick={() => setOpenItem(item)} className="min-w-0 flex-1 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
                {item.headline}
              </p>
              <span className="text-xs text-slate-500">{item.date}</span>
            </div>
            {score ? <NewsResult item={item} verdict={verdictFor(item, score)} /> : null}
            {!score && debugKeyEvents && item.isKeyEvent ? <p className="mt-2 text-sm font-medium text-teal-700">Key event</p> : null}
          </button>
          <input
            type="checkbox"
            aria-label={`Mark "${item.headline}" as key event`}
            className="h-5 w-5 shrink-0 accent-slate-900"
            checked={selected.has(item.id)}
            disabled={Boolean(score)}
            onChange={() => onToggle(item.id)}
          />
        </div>
      ))}

      <NewsDetailDialog item={openItem} onClose={() => setOpenItem(null)} />
    </div>
  );
}

// Verdict classification is scoreRound's rule, read from score.breakdown —
// never re-derived here. Noise (correct rejection) is the complement of the
// three breakdown sets, which by construction don't list it.
function verdictFor(item: NewsItem, score: RoundScore): { label: string; correct: boolean } {
  const { breakdown } = score;
  if (breakdown.selectedKeyEvents.some((i) => i.id === item.id))
    return { label: "Identified key event", correct: true };
  if (breakdown.missedKeyEvents.some((i) => i.id === item.id))
    return { label: "Missed key event", correct: false };
  if (breakdown.falsePositives.some((i) => i.id === item.id))
    return { label: "False positive", correct: false };
  return { label: "Noise", correct: true };
}

function NewsResult({ item, verdict }: { item: NewsItem; verdict: { label: string; correct: boolean } }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
      <span className="font-medium text-amber-600">{"★".repeat(item.importance)}</span>
      <span className={cn(verdict.correct ? "text-teal-700" : "text-red-700")}>{verdict.label}</span>
    </div>
  );
}
