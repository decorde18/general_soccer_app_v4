import React from "react";
import GameProvider from "@/components/game/GameProvider";
import GameSettingsEditor from "@/components/game/GameSettingsEditor";
import GameHeader from "@/components/layout/gameLayout/GameHeader";

interface PageProps {
  params: Promise<{ teamSeasonId: string; id: string }>;
}

export default async function GameSettingsPage({ params }: PageProps) {
  const { teamSeasonId, id } = await params;

  return (
    <GameProvider>
      <div className="flex flex-col min-h-screen bg-background">
        <GameHeader backUrl={`/gamestats/${teamSeasonId}/${id}`} />
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
          <GameSettingsEditor
            gameId={Number(id)}
            teamSeasonId={Number(teamSeasonId)}
          />
        </main>
      </div>
    </GameProvider>
  );
}
