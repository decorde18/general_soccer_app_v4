"use client";
import { useState, useEffect } from "react";
import { useSubManagement } from "@/hooks/useSubManagement";
import useGameStore from "@/stores/gameStore";
import SubSelectionModal from "./SubSelectionModal";
import OnFieldPlayers from "./gameMain/OnFieldPlayers";
import OnBenchPlayers from "./gameMain/OnBenchPlayers";
import TeamStats from "./gameMain/TeamStats";
import PendingSubs from "./gameMain/PendingSubs";
import LiveGameHeader from "./gameHeader/LiveGameHeader";
import LiveGameModal from "./LiveGameModal";

function LayoutLiveGame() {
  const game = useGameStore((s) => s.game);
  const gameStage = useGameStore((s) => s.getGameStage());
  const startStoppage = useGameStore((s) => s.startStoppage);

  const {
    subModalOpen,
    triggerPlayer,
    subMode,
    handleSubClick,
    closeSubModal,
  } = useSubManagement();

  // LiveGameModal state
  const [liveGameModalOpen, setLiveGameModalOpen] = useState(false);
  const [recordingEvent, setRecordingEvent] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState(null);
  const [shouldStopClock, setShouldStopClock] = useState(true);

  // Auto-open modal if there's an active stoppage/event
  useEffect(() => {
    if (!game) return;
    if (recordingEvent) return;
    if (gameStage === "in_stoppage") {
      // Check if game stage is in_stoppage
      // Open LiveGameModal automatically
      setLiveGameModalOpen(true);
    } else {
      // Close modal if not in stoppage
      setLiveGameModalOpen(false);
    }
  }, [gameStage, game]);

  // Handle opening LiveGameModal from TeamStats
  const handleOpenLiveGameModal = async (eventType, stopClock) => {
    setSelectedEventType(eventType);
    setShouldStopClock(stopClock);

    // Start stoppage if clock should stop
    if (stopClock) {
      try {
        await startStoppage(eventType.replace(/_/g, " "));
      } catch (error) {
        console.error("Error starting stoppage:", error);
      }
    }
    setRecordingEvent(true);
    // Open modal (will auto-open if stoppage created)
    setLiveGameModalOpen(true);
  };

  const handleCloseLiveGameModal = () => {
    setLiveGameModalOpen(false);
    setSelectedEventType(null);
  };

  return (
    <div className='h-screen grid grid-cols-[61%_1fr] grid-rows-[10%_1.22fr_1fr] gap-4 p-1 overflow-hidden'>
      <LiveGameHeader />

      <OnFieldPlayers handleSubClick={handleSubClick} />
      <OnBenchPlayers handleSubClick={handleSubClick} />

      <div className='row-start-2 row-span-2 grid grid-rows-2 gap-4 h-full space-y-4'>
        <div className='pb-4 border-b-2 border-border'>
          <TeamStats onOpenLiveGameModal={handleOpenLiveGameModal} />
        </div>
        <PendingSubs />
      </div>

      {/* Sub Selection Modal */}
      <SubSelectionModal
        isOpen={subModalOpen}
        onClose={closeSubModal}
        triggerPlayer={triggerPlayer}
        mode={subMode}
      />

      {/* Live Game Control Modal */}
      <LiveGameModal
        onClose={handleCloseLiveGameModal}
        initialEventType={selectedEventType}
        shouldStopClock={shouldStopClock}
      />
    </div>
  );
}

export default LayoutLiveGame;
