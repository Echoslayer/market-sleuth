import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GameRound } from "./components/GameRound";
import "./style.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GameRound />
  </StrictMode>,
);
