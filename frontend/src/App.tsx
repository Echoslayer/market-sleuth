import { useState } from "react";
import { GameRound } from "./components/GameRound";
import { MarketWorkspace } from "./components/MarketWorkspace";

type View = "market" | "game";

export function App() {
  const [view, setView] = useState<View>("market");

  return (
    <>
      <nav aria-label="主要導覽" className="border-b border-zinc-300 bg-white px-4 sm:px-6">
        <div className="mx-auto flex h-12 max-w-7xl items-center gap-6">
          <strong className="mr-auto text-sm">market-sleuth</strong>
          <NavButton active={view === "market"} onClick={() => setView("market")}>
            市場
          </NavButton>
          <NavButton active={view === "game"} onClick={() => setView("game")}>
            遊戲
          </NavButton>
        </div>
      </nav>
      {view === "market" ? <MarketWorkspace /> : <GameRound />}
    </>
  );
}

function NavButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={`h-full border-b-2 px-1 text-sm font-medium ${
        active ? "border-emerald-700 text-emerald-800" : "border-transparent text-zinc-600 hover:text-zinc-950"
      }`}
    >
      {children}
    </button>
  );
}
