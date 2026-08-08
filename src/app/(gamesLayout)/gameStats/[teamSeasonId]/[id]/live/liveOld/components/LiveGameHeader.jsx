import { secondsToTime, formatSecondsToMmss } from "@/lib/dateTimeUtils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
// import { useState } from "react";

function LiveGameHeader({
  gameTime,
  periodTime,
  periodLabel,
  isInStoppage,
  stoppageReason,
  setStoppageReason,
  onStartStoppage,
  onResumeGame,
  onCancelStoppage,
}) {
  return (
    <div className='bg-background p-6 rounded-lg border border-border'>
      <div className='grid grid-cols-2 gap-4'>
        <div className='text-center'>
          <div className='text-sm text-muted mb-1'>Game Time</div>
          <div className='text-4xl font-bold text-text font-mono'>
            {secondsToTime(gameTime, {
              includeSeconds: true,
              use12Hour: false,
            })}
          </div>
        </div>
        <div className='text-center'>
          <div className='text-sm text-muted mb-1'>{periodLabel} Time</div>
          <div className='text-4xl font-bold text-text font-mono'>
            {formatSecondsToMmss(periodTime)}
          </div>
        </div>
      </div>

      <div className='mt-4 flex items-center justify-center gap-3'>
        <div
          className={`w-3 h-3 rounded-full ${
            isInStoppage ? "bg-red-500" : "bg-green-500"
          }`}
        />
        <span className='text-center text-sm font-medium text-text'>
          {isInStoppage ? "Clock Stopped" : "Clock Running"}
        </span>
      </div>

      <div className='mt-4 flex gap-2'>
        {!isInStoppage ? (
          <div className='flex gap-2 w-full'>
            <Input
              placeholder='Stoppage reason (optional)'
              value={stoppageReason}
              onChange={(e) => setStoppageReason(e.target.value)}
              className='flex-1'
            />
            <Button
              onClick={onStartStoppage}
              variant='danger'
              className='whitespace-nowrap'
            >
              Stop Clock
            </Button>
          </div>
        ) : (
          <div className='flex gap-2 w-full'>
            <Button
              onClick={onCancelStoppage}
              variant='danger'
              className='flex-1 py-4 text-lg font-bold shadow-lg shadow-danger/20'
            >
              Cancel Stoppage
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveGameHeader;
