import React from "react";
import GameProvider from "@/components/game/GameProvider";
import LiveGameTrackerClient from "@/components/game/LiveGameTrackerClient";

export const dynamic = "force-dynamic";

export default function LiveGamePage() {
  return (
    <GameProvider>
      <LiveGameTrackerClient />
    </GameProvider>
  );
}
