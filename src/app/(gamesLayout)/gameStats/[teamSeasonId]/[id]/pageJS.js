import LineupFooter from "./LineupFooter";
import PlayerStatusSections from "./PlayerStatusSections";

import GameHeader from "@/components/layout/gameLayout/GameHeader";

function page() {
  return (
    <div className='flex flex-col h-screen max-w-7xl mx-auto bg-gray-50'>
      {/* Header */}
      <GameHeader />

      {/* Scrollable Main Content */}
      <div className='flex-1 overflow-y-auto p-4'>
        <PlayerStatusSections />
      </div>

      {/* Footer pinned to bottom */}
      <div className='shrink-0 px-4 pb-4'>
        <LineupFooter />
      </div>
    </div>
  );
}

export default page;
