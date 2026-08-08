import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

function EventRecordingPanel({
  activeTab,
  eventType,
  setEventType,
  setCardType,
  setIsOwnGoal,
  setGoalTypes,
  setSelectedTeam,
  setOpponentJerseyNumber,
  setSelectedPlayer,
  setSelectedAssist,
  eventTypes,
  selectedTeam,
  isOwnGoal,
  opponentJerseyNumber,
  selectedPlayer,
  onFieldPlayers,
  selectedAssist,
  goalTypes,
  goalTypeOptions,
  toggleGoalType,
  eventDetails,
  setEventDetails,
  onRecordGoal,
  isRecordingEvent,
  cardType,
  cardTypes,
  cardReason,
  setCardReason,
  cardReasons,
  onRecordCard,
}) {
  return (
    <div className='bg-background p-4 rounded-lg border border-border'>
      <h3 className='text-lg font-semibold text-text mb-4'>Record Event</h3>

      <div className='grid grid-cols-1 gap-4'>
        <Select
          label='Event Type'
          value={eventType}
          onChange={(e) => {
            setEventType(e.target.value);
            setIsOwnGoal(false);
            setGoalTypes([]);
            setSelectedTeam("us");
            setOpponentJerseyNumber("");
            setSelectedPlayer("");
            setSelectedAssist("");
            setCardType(
              e.target.value.includes("card") ? e.target.value : ""
            );
          }}
          options={[
            { value: "", label: "Select event type..." },
            ...eventTypes,
          ]}
        />

        {eventType === "goal" && (
          <>
            <div>
              <label className='block text-sm font-medium mb-2'>
                Which Team Scored?
              </label>
              <div className='grid grid-cols-2 gap-2'>
                <button
                  type='button'
                  onClick={() => {
                    setSelectedTeam("us");
                    setOpponentJerseyNumber("");
                  }}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                    selectedTeam === "us"
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-text border-border hover:border-primary"
                  }`}
                >
                  Our Team
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setSelectedTeam("them");
                    setSelectedPlayer("");
                    setSelectedAssist("");
                  }}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                    selectedTeam === "them"
                      ? "bg-accent text-white border-accent"
                      : "bg-white text-text border-border hover:border-accent"
                  }`}
                >
                  Opponent
                </button>
              </div>
            </div>

            <div className='flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
              <input
                type='checkbox'
                id='ownGoal'
                checked={isOwnGoal}
                onChange={(e) => setIsOwnGoal(e.target.checked)}
                className='w-5 h-5'
              />
              <label htmlFor='ownGoal' className='text-sm font-medium'>
                Own Goal (scored by{" "}
                {selectedTeam === "us" ? "our player" : "opponent"} into their
                own net)
              </label>
            </div>

            {selectedTeam === "them" ? (
              <Input
                label='Opponent Jersey Number (Optional)'
                type='number'
                value={opponentJerseyNumber}
                onChange={(e) => setOpponentJerseyNumber(e.target.value)}
                placeholder='Enter jersey number...'
              />
            ) : (
              !isOwnGoal && (
                <Select
                  label='Goal Scorer'
                  value={selectedPlayer}
                  placeholder='Select Scorer...'
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                  options={onFieldPlayers.filter(
                    (p) => p.value != selectedAssist
                  )}
                />
              )
            )}

            {selectedTeam === "us" && !isOwnGoal && selectedPlayer && (
              <Select
                label='Assist (Optional)'
                value={selectedAssist}
                placeholder='Select Assister...'
                onChange={(e) => setSelectedAssist(e.target.value)}
                options={onFieldPlayers.filter(
                  (p) => p.value != selectedPlayer
                )}
              />
            )}

            <div>
              <label className='block text-sm font-medium mb-2'>
                Goal Type (Optional - Select Multiple)
              </label>
              <div className='grid grid-cols-2 gap-2'>
                {goalTypeOptions.map((type) => (
                  <button
                    key={type.value}
                    type='button'
                    onClick={() => toggleGoalType(type.value)}
                    className={`px-3 py-2 text-sm rounded border transition-colors ${
                      goalTypes.includes(type.value)
                        ? "bg-primary text-white border-primary"
                        : "bg-surface text-text border-border hover:border-primary"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label='Details (Optional)'
              value={eventDetails}
              onChange={(e) => setEventDetails(e.target.value)}
              placeholder='Additional details...'
            />

            <Button
              onClick={onRecordGoal}
              variant='primary'
              disabled={
                isRecordingEvent ||
                (!isOwnGoal && selectedTeam === "us" && !selectedPlayer)
              }
              className='w-full'
            >
              {isRecordingEvent ? "Recording..." : "Record Goal"}
            </Button>
          </>
        )}

        {(eventType === "yellow_card" ||
          eventType === "red_card" ||
          eventType === "yellow_red_card") && (
          <>
            <div>
              <label className='block text-sm font-medium mb-2'>
                Which Team?
              </label>
              <div className='grid grid-cols-2 gap-2'>
                <button
                  type='button'
                  onClick={() => {
                    setSelectedTeam("us");
                    setOpponentJerseyNumber("");
                  }}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                    selectedTeam === "us"
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-text border-border hover:border-primary"
                  }`}
                >
                  Our Team
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setSelectedTeam("them");
                    setSelectedPlayer("");
                  }}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                    selectedTeam === "them"
                      ? "bg-accent text-white border-accent"
                      : "bg-white text-text border-border hover:border-accent"
                  }`}
                >
                  Opponent
                </button>
              </div>
            </div>

            <Select
              label='Card Type'
              value={cardType}
              onChange={(e) => setCardType(e.target.value)}
              options={[
                { value: "", label: "Select card type..." },
                ...cardTypes,
              ]}
            />

            {selectedTeam === "them" ? (
              <Input
                label='Opponent Jersey Number'
                type='number'
                value={opponentJerseyNumber}
                onChange={(e) => setOpponentJerseyNumber(e.target.value)}
                placeholder='Enter jersey number...'
              />
            ) : (
              <Select
                label='Player'
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                options={[
                  { value: "", label: "Select player..." },
                  ...onFieldPlayers,
                ]}
              />
            )}

            <Select
              label='Card Reason'
              value={cardReason}
              onChange={(e) => setCardReason(e.target.value)}
              options={[
                { value: "", label: "Select reason..." },
                ...cardReasons,
              ]}
            />

            <Input
              label='Details (Optional)'
              value={eventDetails}
              onChange={(e) => setEventDetails(e.target.value)}
              placeholder='Additional details...'
            />

            <Button
              onClick={onRecordCard}
              variant='primary'
              disabled={
                isRecordingEvent ||
                !cardType ||
                (selectedTeam === "us" && !selectedPlayer) ||
                (selectedTeam === "them" && !opponentJerseyNumber)
              }
              className='w-full'
            >
              {isRecordingEvent ? "Recording..." : "Record Card"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default EventRecordingPanel;
