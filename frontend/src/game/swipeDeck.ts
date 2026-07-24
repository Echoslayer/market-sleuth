export type SwipeDirection = "left" | "right";

export type SwipeCard = {
  id: string;
};

export type SwipeDecision<TCard extends SwipeCard = SwipeCard> = {
  card: TCard;
  newsId: string;
  kept: boolean;
};

export type SwipeDeckState<TCard extends SwipeCard = SwipeCard> = {
  remaining: TCard[];
  history: SwipeDecision<TCard>[];
  selectedNewsIds: string[];
};

export function createSwipeDeck<TCard extends SwipeCard>(cards: TCard[]): SwipeDeckState<TCard> {
  return {
    remaining: [...cards],
    history: [],
    selectedNewsIds: [],
  };
}

export function decide<TCard extends SwipeCard>(
  state: SwipeDeckState<TCard>,
  direction: SwipeDirection,
): SwipeDeckState<TCard> {
  const [card, ...remaining] = state.remaining;
  if (!card) return state;

  const kept = direction === "right";
  return {
    remaining,
    history: [...state.history, { card, newsId: card.id, kept }],
    selectedNewsIds: kept ? [...state.selectedNewsIds, card.id] : state.selectedNewsIds,
  };
}

export function undo<TCard extends SwipeCard>(state: SwipeDeckState<TCard>): SwipeDeckState<TCard> {
  const last = state.history.at(-1);
  if (!last) return state;

  return {
    remaining: [last.card, ...state.remaining],
    history: state.history.slice(0, -1),
    selectedNewsIds: last.kept
      ? state.selectedNewsIds.filter((newsId) => newsId !== last.newsId)
      : state.selectedNewsIds,
  };
}

export function isComplete(state: SwipeDeckState) {
  return state.remaining.length === 0;
}
