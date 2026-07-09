"use client";

import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameStore from "@/stores/gameStore";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

function LineupFooter() {
  const { id, teamSeasonId } = useParams();
  const players = useGamePlayersStore((s) => s.players);
  const game = useGameStore((s) => s.game);
  const router = useRouter();

  // Logic to calculate status
  const startersCount = players.filter(
    (p) => p.gameStatus === "starter"
  ).length;
  const hasGoalkeeper = !!players.find((p) => p.gameStatus === "goalkeeper");
  const totalStartersRequired = game.settings.playersOnField - 1; // Field players
  const isComplete = startersCount === totalStartersRequired && hasGoalkeeper;

  const handleStartPeriod = () => {
    router.push(`/gamestats/${teamSeasonId}/${id}/live`);
  };

  return (
    <div className='mt-8 flex flex-col items-center w-full'>
      {/* Requirement Checklist: Only shows when not ready */}

      <div className='mb-4 flex gap-4 text-[0.7rem] font-bold uppercase tracking-wider'>
        <div
          className={
            startersCount === totalStartersRequired
              ? "text-success"
              : "text-muted"
          }
        >
          {startersCount}/{totalStartersRequired} Field Players{" "}
          {startersCount === totalStartersRequired ? "✓" : ""}
        </div>
        <div className={hasGoalkeeper ? "text-success" : "text-danger"}>
          Goalkeeper {hasGoalkeeper ? "✓" : "required"}
        </div>
      </div>

      {/* Equal Sized Buttons Container */}
      <div className='grid grid-cols-2 gap-3 w-full max-w-md px-4'>
        <Button
          variant='outline'
          onClick={() => window.history.back()}
          className='py-4 !rounded-2xl shadow-sm border-2'
        >
          Back
        </Button>

        <Button
          variant={isComplete ? "success" : "muted"}
          onClick={handleStartPeriod}
          disabled={!isComplete}
          className='py-4 !rounded-2xl shadow-sm flex flex-col leading-tight'
        >
          <span>{isComplete ? "Confirm Lineup" : "Set Lineup"}</span>

          <span className='text-[10px] opacity-80 font-medium'>
            {startersCount + (hasGoalkeeper ? 1 : 0)} /{" "}
            {game.settings.playersOnField} Selected
          </span>
        </Button>
      </div>
    </div>
  );
}

export default LineupFooter;
