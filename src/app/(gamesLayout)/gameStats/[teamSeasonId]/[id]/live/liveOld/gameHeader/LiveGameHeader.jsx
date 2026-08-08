"use client";
import React, { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";

import useGameStore from "@/stores/gameStore";
import useGameSubsStore from "@/stores/gameSubsStore";
import LiveGameHeaderClock from "./LiveGameHeaderClock";

function LiveGameHeader() {
  const game = useGameStore((s) => s.game);
  const gameStage = useGameStore((s) => s.getGameStage());
  const endPeriod = useGameStore((s) => s.endPeriod);
  const startPeriod = useGameStore((s) => s.startNextPeriod);

  const periodNumber = useGameStore((s) => s.getCurrentPeriodNumber());

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSubsPrompt, setShowSubsPrompt] = useState(false);

  const isGameLive = gameStage === "during_period";
  const isGameEnded = gameStage === "end_game";
  const isBetweenPeriods = gameStage === "between_periods";
  const isBeforeStart = gameStage === "before_start";

  if (!game) return null;

  const executeStartPeriod = async () => {
    if (!game?.game_id || isProcessing) return;
    setIsProcessing(true);
    try {
      await startPeriod();
    } catch (error) {
      console.error("Error starting period:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartPeriod = async () => {
    if (!game?.game_id || isProcessing) return;

    // Check for pending subs
    const pendingSubs = useGameSubsStore.getState().getPendingSubsSync();
    if (pendingSubs.length > 0) {
      setShowSubsPrompt(true);
      return;
    }

    await executeStartPeriod();
  };

  const handleEnterSubsAndStart = async () => {
    setShowSubsPrompt(false);
    setIsProcessing(true);
    try {
      // From gameStore.js startNextPeriod:
      // "Auto-confirm any pending subs at time 0 of new period"
      await startPeriod();
    } catch (error) {
      console.error("Error entering subs and starting period:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEndPeriod = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      await endPeriod();
    } catch (error) {
      console.error("Error ending period:", error);
    } finally {
      setIsProcessing(false);
    }
  };
  // Determine button display based on game state
  const getButtonProps = () => {
    if (isGameLive) {
      return {
        variant: "danger",
        onClick: handleEndPeriod,
        disabled: isProcessing,
        children: isProcessing ? "Ending..." : "END PERIOD",
      };
    }

    if (isGameEnded) {
      return {
        variant: "outline",
        onClick: null,
        disabled: true,
        children: "Game Complete",
      };
    }

    // Before start or between periods
    return {
      variant: "success",
      onClick: handleStartPeriod,
      disabled: isProcessing,
      children: isProcessing
        ? "Starting..."
        : isBeforeStart
          ? "START GAME"
          : "START",
    };
  };

  if (!game) return null;

  return (
    <>
      <Dialog
        isOpen={showSubsPrompt}
        onClose={() => setShowSubsPrompt(false)}
        title='Pending Substitutions'
        message='You have pending substitutions. Would you like to enter them now before starting the next period?'
        type='confirm'
        confirmText='Enter & Start'
        onConfirm={handleEnterSubsAndStart}
      />
      <header className='relative col-span-2 row-start-1 flex items-center justify-between px-4 py-4 shadow-lg bg-secondary text-background m-0 rounded z-10'>
        {/* Left Section – Equalizer Spacer */}
        <div className='flex-shrink-0 w-[120px]'></div>

        {/* Center Section – Score + Clock */}
        <div className='absolute left-1/2 transform -translate-x-1/2 flex items-center gap-4 sm:gap-10 w-full max-w-4xl justify-center pointer-events-none'>
          {/* Our Team Section */}
          <div className='text-center w-[100px] sm:w-[140px] flex flex-col items-center justify-center min-h-[60px]'>
            <div className='text-[10px] sm:text-xs font-bold tracking-wider opacity-90 uppercase leading-tight whitespace-normal line-clamp-2 w-full'>
              {game.ourName}
            </div>
            <div className='text-4xl sm:text-5xl font-black tabular-nums leading-none mt-1'>
              {game.goalsFor}
            </div>
          </div>

          {/* Clock / Status Section */}
          <div className='flex flex-col items-center min-w-[130px] sm:min-w-[180px] px-2'>
            {isGameLive ? (
              <>
                <div className='text-3xl sm:text-4xl font-black tracking-tighter tabular-nums leading-none'>
                  <LiveGameHeaderClock />
                </div>
                <div className='text-[10px] font-bold tracking-[0.2em] opacity-70 mt-2 uppercase bg-background/10 px-2 py-0.5 rounded'>
                  PERIOD {periodNumber}
                </div>
              </>
            ) : (
              <div className='text-center'>
                <div className='text-xs sm:text-sm font-black leading-tight uppercase tracking-widest'>
                  {isBeforeStart ? "Ready to Start" : "Game Paused"}
                </div>
              </div>
            )}
          </div>

          {/* Opposing Team Section */}
          <div className='text-center w-[100px] sm:w-[140px] flex flex-col items-center justify-center min-h-[60px]'>
            <div className='text-[10px] sm:text-xs font-bold tracking-wider opacity-90 uppercase leading-tight whitespace-normal line-clamp-2 w-full'>
              {game.opponentName}
            </div>
            <div className='text-4xl sm:text-5xl font-black tabular-nums leading-none mt-1'>
              {game.goalsAgainst}
            </div>
          </div>
        </div>

        {/* Right Section – Action Button (Taller) */}
        <div className='flex-shrink-0 w-[100px] flex justify-end relative z-20'>
          <Button
            {...getButtonProps()}
            className='!rounded-xl shadow-lg py-3 px-4 min-h-[48px] font-black uppercase tracking-tighter text-[11px]'
          />
        </div>
      </header>
    </>
  );
}

export default LiveGameHeader;
