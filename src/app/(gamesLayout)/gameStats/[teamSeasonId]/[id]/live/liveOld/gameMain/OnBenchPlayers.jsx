// OnBenchPlayers.jsx
"use client";
import PlayersTable from "./PlayersTable";
import Button from "@/components/ui/Button";

function OnBenchPlayers({ handleSubClick }) {
  const filterBenchPlayers = (player) => {
    return (
      player.fieldStatus === "onBench" || player.fieldStatus === "subbingIn"
    );
  };

  const getBenchActionButton = (row) => {
    const buttonText = row.subStatus === "pendingIn" ? "Cancel" : "Sub In";
    const variant = row.subStatus === "pendingIn" ? "danger" : "primary";

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
    <div className='shadow-lg overflow-hidden'>
      <PlayersTable
        filterPlayers={filterBenchPlayers}
        caption={<span className='text-2xl font-bold'>Game Changers</span>}
        onActionClick={(row) => handleSubClick(row.id)}
        getActionButton={getBenchActionButton}
        timeMode='onBench'
        size='xs'
      />
    </div>
  );
}

export default OnBenchPlayers;
