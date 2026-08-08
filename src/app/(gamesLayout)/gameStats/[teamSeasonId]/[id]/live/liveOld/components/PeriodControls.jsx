import Button from "@/components/ui/Button";

function PeriodControls({ gameStage, periodLabel, onStartNextPeriod, onEndPeriod }) {
  return (
    <div className='bg-background p-4 rounded-lg border border-border'>
      <h3 className='text-lg font-semibold text-text mb-4'>Period Controls</h3>
      <div className='flex gap-2'>
        {gameStage === "before_start" && (
          <Button
            onClick={onStartNextPeriod}
            variant='success'
            className='flex-1'
          >
            Start Period 1
          </Button>
        )}

        {gameStage === "during_period" && (
          <Button onClick={onEndPeriod} variant='danger' className='flex-1'>
            End {periodLabel}
          </Button>
        )}

        {gameStage === "between_periods" && (
          <Button
            onClick={onStartNextPeriod}
            variant='success'
            className='flex-1'
          >
            Start Next Period
          </Button>
        )}

        {gameStage === "end_game" && (
          <div className='text-center text-text font-semibold py-2 w-full'>
            Game Complete
          </div>
        )}
      </div>
    </div>
  );
}

export default PeriodControls;
