import React from "react";
import GameProvider from "@/components/game/GameProvider";
import GameManageClient from "@/components/game/GameManageClient";

export default function GameManagePage() {
  return (
    <GameProvider>
      <GameManageClient />
    </GameProvider>
  );
}
