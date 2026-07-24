import type { RoundScore } from "../game/scoreRound";
import type { NewsItem } from "../types/scenario";

type NewsListProps = {
  newsItems: NewsItem[];
  selectedNewsIds: string[];
  onToggle: (id: string) => void;
  score?: RoundScore;
};

export function NewsList({ newsItems, selectedNewsIds, onToggle, score }: NewsListProps) {
  const selected = new Set(selectedNewsIds);

  return (
    <div className="space-y-3">
      {newsItems.map((item) => (
        <label
          key={item.id}
          className="block rounded border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-slate-900"
              checked={selected.has(item.id)}
              disabled={Boolean(score)}
              onChange={() => onToggle(item.id)}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-slate-950">{item.headline}</p>
                <span className="text-xs text-slate-500">{item.date}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.content}</p>
              {score ? <NewsResult item={item} selected={selected.has(item.id)} /> : null}
            </div>
          </div>
        </label>
      ))}
    </div>
  );
}

function NewsResult({ item, selected }: { item: NewsItem; selected: boolean }) {
  const verdict = item.isKeyEvent
    ? selected
      ? "Identified key event"
      : "Missed key event"
    : selected
      ? "False positive"
      : "Noise";

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
      <span className="font-medium text-amber-600">{"★".repeat(item.importance)}</span>
      <span className={item.isKeyEvent === selected ? "text-teal-700" : "text-red-700"}>{verdict}</span>
    </div>
  );
}
