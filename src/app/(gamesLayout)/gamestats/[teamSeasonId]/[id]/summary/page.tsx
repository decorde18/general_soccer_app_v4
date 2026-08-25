import React from "react";
import GameProvider from "@/components/game/GameProvider";
import GameSummaryClient from "@/components/game/GameSummaryClient";

export const dynamic = "force-dynamic";

export default function GameSummaryPage() {
  return (
    <GameProvider>
      <GameSummaryClient />
    </GameProvider>
  );
}
