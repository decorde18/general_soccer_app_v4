import OnFieldPlayers from "./gameMain/OnFieldPlayers";

import OnBenchPlayers from "./gameMain/OnBenchPlayers";

import LiveGameHeader from "./gameHeader/LiveGameHeader";

function LayoutLiveBeforeGame() {
  return (
    <div className='h-screen grid grid-cols-[61%_1fr] grid-rows-[10%_1.75fr_1fr] gap-4 p-1 overflow-hidden'>
      <LiveGameHeader />

      <OnFieldPlayers />
      <OnBenchPlayers />
    </div>
  );
}

export default LayoutLiveBeforeGame;
