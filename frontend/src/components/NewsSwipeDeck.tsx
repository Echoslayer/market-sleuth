import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { createSwipeDeck, decide, isComplete, undo, type SwipeDeckState, type SwipeDirection } from "../game/swipeDeck";
import { cn } from "../lib/cn";
import type { NewsItem } from "../types/scenario";
import { NewsDetailDialog } from "./NewsDetailDialog";

type NewsSwipeDeckProps = {
  newsItems: NewsItem[];
  onChange: (selectedNewsIds: string[], complete: boolean) => void;
};

const SWIPE_THRESHOLD = 110;

export function NewsSwipeDeck({ newsItems, onChange }: NewsSwipeDeckProps) {
  const [deck, setDeck] = useState<SwipeDeckState<NewsItem>>(() => createSwipeDeck(newsItems));
  const [drag, setDrag] = useState({ x: 0, dragging: false });
  const [openItem, setOpenItem] = useState<NewsItem | null>(null);
  const startX = useRef(0);
  const moved = useRef(false);
  const topCard = deck.remaining[0];
  const nextCards = deck.remaining.slice(1, 3);

  useEffect(() => {
    const nextDeck = createSwipeDeck(newsItems);
    setDeck(nextDeck);
    onChange(nextDeck.selectedNewsIds, isComplete(nextDeck));
  }, [newsItems, onChange]);

  useEffect(() => {
    onChange(deck.selectedNewsIds, isComplete(deck));
  }, [deck, onChange]);

  const progress = useMemo(() => newsItems.length - deck.remaining.length, [deck.remaining.length, newsItems.length]);

  const makeDecision = (direction: SwipeDirection) => {
    setDrag({ x: direction === "right" ? 420 : -420, dragging: false });
    window.setTimeout(() => {
      setDeck((current) => decide(current, direction));
      setDrag({ x: 0, dragging: false });
    }, 160);
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    startX.current = event.clientX;
    moved.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ x: 0, dragging: true });
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!drag.dragging) return;
    const x = event.clientX - startX.current;
    if (Math.abs(x) > 6) moved.current = true;
    setDrag({ x, dragging: true });
  };

  const onPointerUp = () => {
    if (!drag.dragging) return;
    if (Math.abs(drag.x) >= SWIPE_THRESHOLD) {
      makeDecision(drag.x > 0 ? "right" : "left");
      return;
    }
    setDrag({ x: 0, dragging: false });
  };

  const openDialog = () => {
    if (!topCard || moved.current) return;
    setOpenItem(topCard);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          {progress} / {newsItems.length} decided
        </span>
        <button
          type="button"
          onClick={() => setDeck((current) => undo(current))}
          disabled={deck.history.length === 0}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Undo
        </button>
      </div>

      <div className="relative h-[22rem] overflow-hidden rounded border border-slate-200 bg-slate-200/60 p-3 shadow-sm">
        {isComplete(deck) ? (
          <div className="grid h-full place-items-center rounded bg-white p-6 text-center shadow-sm">
            <div>
              <p className="text-lg font-semibold text-slate-950">All news decided</p>
              <p className="mt-2 text-sm text-slate-600">Submit the round when your direction call is ready.</p>
            </div>
          </div>
        ) : null}

        {nextCards.map((item, index) => (
          <div
            key={item.id}
            className="absolute inset-3 rounded border border-slate-200 bg-white shadow-sm"
            style={{ transform: `translateY(${(index + 1) * 8}px) scale(${1 - (index + 1) * 0.03})` }}
          />
        ))}

        {topCard ? (
          <article
            className={cn(
              "absolute inset-3 touch-none select-none rounded border border-slate-200 bg-white p-5 shadow-sm",
              drag.dragging ? "cursor-grabbing" : "cursor-grab transition-transform duration-200",
            )}
            style={{ transform: `translateX(${drag.x}px) rotate(${drag.x / 22}deg)` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => setDrag({ x: 0, dragging: false })}
            onClick={openDialog}
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-950">{topCard.headline}</h3>
              <span className="text-xs text-slate-500">{topCard.date}</span>
            </div>
            <p className="mt-4 max-h-48 overflow-hidden text-sm leading-6 text-slate-700">
              {topCard.content || "請點連結閱讀原文"}
            </p>
          </article>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          aria-label="Mark news as not key"
          onClick={() => makeDecision("left")}
          disabled={!topCard}
          className="h-11 rounded border border-red-200 bg-white text-xl font-semibold text-red-700 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ✗
        </button>
        <button
          type="button"
          aria-label="Mark news as key"
          onClick={() => makeDecision("right")}
          disabled={!topCard}
          className="h-11 rounded border border-teal-200 bg-white text-xl font-semibold text-teal-700 shadow-sm hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ✓
        </button>
      </div>

      <NewsDetailDialog item={openItem} onClose={() => setOpenItem(null)} />
    </div>
  );
}
