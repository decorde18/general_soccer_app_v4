// OnFieldGk.jsx
"use client";
import { useState, useEffect } from "react";
import PlayersTable from "./PlayersTable";
import Button from "@/components/ui/Button";
import useGameSubsStore from "@/stores/gameSubsStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";

function OnFieldGk({ handleSubClick, gameStage }) {
  const getCurrentGoalkeeper = useGameSubsStore((s) => s.getCurrentGoalkeeper);
  const players = useGamePlayersStore((s) => s.players);
  const [currentGkId, setCurrentGkId] = useState(null);

  // Update current GK whenever players change
  useEffect(() => {
    const updateCurrentGk = async () => {
      const gk = await getCurrentGoalkeeper();
      setCurrentGkId(gk?.id || null);
    };
    updateCurrentGk();
  }, [players, getCurrentGoalkeeper]);

  const filterGoalkeeper = (player) => {
    // Show player if they are the current GK and on field
    if (currentGkId && player.id === currentGkId) {
      return (
        player.fieldStatus === "onFieldGk" ||
        player.fieldStatus === "subbingOutGk" ||
        player.fieldStatus === "onField" // In case GK is temporarily showing as field player
      );
    }

    // Fallback to gameStatus check for starting GK
    return (
      player.gameStatus === "goalkeeper" &&
      (player.fieldStatus === "onFieldGk" ||
        player.fieldStatus === "subbingOutGk")
    );
  };

  const getRowClassName = (row) => {
    if (row.fieldStatus === "subbingOutGk") return "bg-red-100";
    return;
  };

  const getGkActionButton = (row) => {
    const buttonText = row.subStatus === "pendingOut" ? "Cancel" : "Sub GK";
    const variant = row.subStatus === "pendingOut" ? "danger" : "primary";

    return (
      <Button
        onClick={(e) => {
          e.stopPropagation();
          handleSubClick(row.id);
        }}
        size='sm'
        variant={variant}
      >
        {buttonText}
      </Button>
    );
  };

  return (
    <div className='bg-primary-dark p-2'>
      <PlayersTable
        filterPlayers={filterGoalkeeper}
        caption={<span className='text-xl font-bold '>Goalkeeper</span>}
        onActionClick={(row) => handleSubClick(row.id)}
        getActionButton={getGkActionButton}
        timeMode='onField'
        size='xs'
        getRowClassName={getRowClassName}
      />
    </div>
  );
}

export default OnFieldGk;
