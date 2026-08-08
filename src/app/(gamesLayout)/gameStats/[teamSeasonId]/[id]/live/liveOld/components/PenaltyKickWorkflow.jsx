import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

function PenaltyKickWorkflow({
  penaltyKickState,
  onAwardPenalty,
  penaltyTeam,
  setPenaltyTeam,
  penaltyKicker,
  setPenaltyKicker,
  penaltyKickerJersey,
  setPenaltyKickerJersey,
  penaltyOutcome,
  setPenaltyOutcome,
  eventDetails,
  setEventDetails,
  onRecordPenaltyKick,
  isRecordingEvent,
  onResetPenaltyKickState,
  onConfirmPenaltyGoal,
  onFieldPlayers,
}) {
  return (
    <div className='bg-background p-4 rounded-lg border border-border'>
      <h3 className='text-lg font-semibold text-text mb-4'>
        Penalty Kick Workflow
      </h3>

      {!penaltyKickState && (
        <Button
          onClick={onAwardPenalty}
          variant='primary'
          className='w-full'
        >
          Award Penalty Kick
        </Button>
      )}

      {penaltyKickState === "awarded" && (
        <div className='space-y-4'>
          <div className='bg-yellow-50 border border-yellow-200 p-3 rounded'>
            <p className='text-sm font-medium text-yellow-800'>
              Penalty Kick Awarded
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>
              Which Team?
            </label>
            <div className='grid grid-cols-2 gap-2'>
              <button
                type='button'
                onClick={() => {
                  setPenaltyTeam("us");
                  setPenaltyKickerJersey("");
                }}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                  penaltyTeam === "us"
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-text border-border hover:border-primary"
                }`}
              >
                Our Team
              </button>
              <button
                type='button'
                onClick={() => {
                  setPenaltyTeam("them");
                  setPenaltyKicker("");
                }}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                  penaltyTeam === "them"
                    ? "bg-accent text-white border-accent"
                    : "bg-white text-text border-border hover:border-accent"
                }`}
              >
                Opponent
              </button>
            </div>
          </div>

          {penaltyTeam === "them" ? (
            <Input
              label='Kicker Jersey Number'
              type='number'
              value={penaltyKickerJersey}
              onChange={(e) => setPenaltyKickerJersey(e.target.value)}
              placeholder='Enter jersey number...'
            />
          ) : (
            <Select
              label='Penalty Kicker'
              value={penaltyKicker}
              onChange={(e) => setPenaltyKicker(e.target.value)}
              options={[
                { value: "", label: "Select kicker..." },
                ...onFieldPlayers,
              ]}
            />
          )}

          <Select
            label='Outcome'
            value={penaltyOutcome}
            onChange={(e) => setPenaltyOutcome(e.target.value)}
            options={[
              { value: "", label: "Select outcome..." },
              { value: "score", label: "Score (Goal)" },
              { value: "save", label: "Save (GK)" },
              { value: "miss", label: "Miss (Wide/Post)" },
            ]}
          />

          <Input
            label='Details (Optional)'
            value={eventDetails}
            onChange={(e) => setEventDetails(e.target.value)}
            placeholder='Additional details...'
          />

          <div className='flex gap-2'>
            <Button
              onClick={onRecordPenaltyKick}
              variant='primary'
              className='flex-1'
              disabled={
                isRecordingEvent ||
                !penaltyOutcome ||
                (penaltyTeam === "us" && !penaltyKicker) ||
                (penaltyTeam === "them" && !penaltyKickerJersey)
              }
            >
              {isRecordingEvent ? "Recording..." : "Record Penalty"}
            </Button>
            <Button
              onClick={onResetPenaltyKickState}
              variant='outline'
              className='flex-1'
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {penaltyKickState === "scored" && (
        <div className='space-y-4'>
          <div className='bg-green-50 border border-green-200 p-3 rounded'>
            <p className='text-sm font-medium text-green-800'>
              Penalty Scored! Confirm the goal to resume the game.
            </p>
          </div>

          <Button
            onClick={onConfirmPenaltyGoal}
            variant='success'
            className='w-full'
            disabled={isRecordingEvent}
          >
            {isRecordingEvent ? "Recording..." : "Confirm Goal & Resume"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default PenaltyKickWorkflow;
