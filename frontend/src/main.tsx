import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <main className="grid min-h-screen place-items-center bg-zinc-950 px-6 text-zinc-50">
      <h1 className="text-3xl font-semibold">market-sleuth</h1>
    </main>
  </StrictMode>,
);
