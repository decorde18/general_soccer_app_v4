"use client";
import { useState, useMemo } from "react";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameSubsStore from "@/stores/gameSubsStore";
import Button from "@/components/ui/Button";
import OnBenchPlayers from "./OnBenchPlayers";
import OnFieldPlayers from "./OnFieldPlayers";

/**
 * SubManagementPanel - allows creating subs during stoppage
 * Shows on-field and bench players with sub buttons
 */
function SubManagementPanel() {
  const players = useGamePlayersStore((s) => s.players);
  const createPendingSub = useGameSubsStore((s) => s.createPendingSub);
  const cancelSub = useGameSubsStore((s) => s.cancelSub);

  const [isProcessing, setIsProcessing] = useState(false);

  // Handle sub click - either creates pending sub or cancels it
  const handleSubClick = async (playerId) => {
    setIsProcessing(true);
    try {
      const player = players.find((p) => p.id === playerId);
      if (!player) return;

      // Check if player has pending sub
      const hasPendingIn = player.ins?.some((sub) => sub.gameTime === null);
      const hasPendingOut = player.outs?.some((sub) => sub.gameTime === null);

      if (hasPendingIn || hasPendingOut) {
        // Cancel the pending sub
        const pendingSub = hasPendingIn
          ? player.ins.find((sub) => sub.gameTime === null)
          : player.outs.find((sub) => sub.gameTime === null);

        if (pendingSub) {
          await cancelSub(pendingSub.subId);
        }
      } else {
        // Create new pending sub
        if (
          player.fieldStatus === "onBench" ||
          player.fieldStatus === "subbingIn"
        ) {
          // Player coming in
          await createPendingSub(player.playerGameId, null);
        } else if (
          player.fieldStatus === "onField" ||
          player.fieldStatus === "onFieldGk" ||
          player.fieldStatus === "subbingOut" ||
          player.fieldStatus === "subbingOutGk"
        ) {
          // Player going out
          await createPendingSub(null, player.playerGameId);
        }
      }
    } catch (error) {
      console.error("Error handling sub:", error);
      alert("Failed to process substitution. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className='bg-background rounded-lg border border-border'>
      <div className='p-4 border-b border-border'>
        <h3 className='text-lg font-semibold text-text'>
          Manage Substitutions
        </h3>
        <p className='text-sm text-muted mt-1'>
          Click players to create pending substitutions
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-4'>
        {/* On Field Players */}
        <div>
          <OnFieldPlayers handleSubClick={handleSubClick} />
        </div>

        {/* Bench Players */}
        <div>
          <OnBenchPlayers handleSubClick={handleSubClick} />
        </div>
      </div>
    </div>
  );
}

export default SubManagementPanel;
