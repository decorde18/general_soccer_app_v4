import GameMenuPage from "@/components/game/GameMenuPage";
import GameProvider from "@/components/game/GameProvider";
import GameMenuPage from "@/components/game/GameMenuPage";
import GameProvider from "@/components/game/GameProvider";

export default async function page() {
  return (
    <GameProvider>
    <GameMenuPage />
    </GameProvider>
  );
}
