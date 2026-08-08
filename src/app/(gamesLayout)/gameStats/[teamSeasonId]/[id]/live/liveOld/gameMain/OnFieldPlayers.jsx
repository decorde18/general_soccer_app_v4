// OnFieldPlayers.jsx
"use client";
import OnFieldGk from "./OnFieldGk";
import PlayersTable from "./PlayersTable";

function OnFieldPlayers({ handleSubClick }) {
  const filterOnFieldPlayers = (player) => {
    if (player.gameStatus === "goalkeeper") return false;
    return (
      player.fieldStatus === "onField" || player.fieldStatus === "subbingOut"
    );
  };

  return (
    <div className='row-start-2 flex flex-col justify-between shadow-lg overflow-hidden'>
      <PlayersTable
        filterPlayers={filterOnFieldPlayers}
        caption={<span className='text-2xl font-bold'>On Field Players</span>}
        onActionClick={(row) => handleSubClick(row.id)}
        timeMode='onField'
        size='xs'
      />
      <OnFieldGk handleSubClick={handleSubClick} />
    </div>
  );
}

export default OnFieldPlayers;
