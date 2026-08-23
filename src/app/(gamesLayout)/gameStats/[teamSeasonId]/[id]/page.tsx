import GameMenuPage from "@/components/game/GameMenuPage";
import GameProvider from "@/components/game/GameProvider";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    teamSeasonId: string;
    id: string;
  }>;
}

export default async function page({ params }: PageProps) {
  const { teamSeasonId, id } = await params;
  const gameIdNum = Number(id);
  const teamSeasonIdNum = Number(teamSeasonId);

  if (isNaN(gameIdNum) || isNaN(teamSeasonIdNum)) {
    return notFound();
  }

  return (
    <GameProvider>
      <GameMenuPage />
    </GameProvider>
  );
}
