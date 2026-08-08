"use client";

import PendingSubs from "./gameMain/PendingSubs";
import LiveGameHeader from "./gameHeader/LiveGameHeader";
import OnFieldPlayers from "./gameMain/OnFieldPlayers";
import OnBenchPlayers from "./gameMain/OnBenchPlayers";
import TeamStatsBetweenPeriods from "./gameMain/TeamStatsBetweenPeriods";
import { useSubManagement } from "@/hooks/useSubManagement";
import SubSelectionModal from "./SubSelectionModal";

/**
 * Layout for the between periods page
 * Shows pending subs without individual "Enter" buttons
 * Only "Enter All" button at the top to confirm all subs before starting next period
 */
function BetweenPeriodsLayout() {
  const {
    subModalOpen,
    triggerPlayer,
    subMode,
    handleSubClick,
    closeSubModal,
  } = useSubManagement();

  return (
    <div className='h-screen grid grid-cols-[1fr_61%] grid-rows-[10%_1.22fr_1fr] gap-4 p-1 overflow-hidden'>
      <LiveGameHeader />

      {/* Right side - Field views */}
      <div className='col-start-2 row-start-2'>
        <OnFieldPlayers handleSubClick={handleSubClick} />
      </div>

      <div className='col-start-2 row-start-3'>
        <OnBenchPlayers handleSubClick={handleSubClick} />
      </div>

      {/* Left side - Pending Subs (top) and Stats (bottom) */}
      <div className='row-start-2 row-span-2 grid grid-rows-[1fr_1.5fr] gap-4 h-full'>
        {/* Team Stats - Smaller section */}
        <div className='overflow-y-auto'>
          <TeamStatsBetweenPeriods />
        </div>
        {/* Pending Subs - Larger section */}
        <div className='overflow-y-auto border-b-2 border-border pb-4'>
          <div className='bg-surface rounded-lg border-2 border-primary p-6 shadow-lg mb-4'>
            <h2 className='text-xl font-bold text-text mb-4'>
              Pending Substitutions
            </h2>
            <p className='text-sm text-muted mb-4'>
              Review and confirm substitutions before starting the next period
            </p>
            <PendingSubs hideIndividualEnter={true} hideEnterAll={true} />
            <div className='mt-6 p-4 bg-background rounded border border-border'>
              <p className='text-sm text-muted text-center'>
                Click "START" in the header when ready to begin the next period
              </p>
            </div>
          </div>
        </div>
      </div>

      <SubSelectionModal
        isOpen={subModalOpen}
        onClose={closeSubModal}
        triggerPlayer={triggerPlayer}
        mode={subMode}
      />
    </div>
  );
}

export default BetweenPeriodsLayout;
