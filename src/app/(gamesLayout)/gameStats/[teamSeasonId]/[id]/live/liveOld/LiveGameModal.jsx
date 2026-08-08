'use client';
import { useState, useEffect, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameSubsStore from "@/stores/gameSubsStore";
import useGameEventsStore from "@/stores/gameEventsStore";
import PendingSubs from "./gameMain/PendingSubs";
import SubManagementPanel from "./gameMain/SubManagementPanel";
import LiveGameHeader from "./components/LiveGameHeader";
import PeriodControls from "./components/PeriodControls";
import GameInfoFooter from "./components/GameInfoFooter";
import EventRecordingPanel from "./components/EventRecordingPanel";
import PenaltyKickWorkflow from "./components/PenaltyKickWorkflow";
import Dialog from "@/components/ui/Dialog";

function LiveGameModal({
  onClose,
  initialEventType = null,
  shouldStopClock = true,
}) {
  const game = useGameStore((s) => s.game);
  const gameStage = useGameStore((s) => s.getGameStage());
  const getGameTime = useGameStore((s) => s.getGameTime);
  const getPeriodTime = useGameStore((s) => s.getPeriodTime);
  const getCurrentPeriodLabel = useGameStore((s) => s.getCurrentPeriodLabel);
  const startStoppage = useGameStore((s) => s.startStoppage);
  const endStoppage = useGameStore((s) => s.endStoppage);
  const startNextPeriod = useGameStore((s) => s.startNextPeriod);
  const endPeriod = useGameStore((s) => s.endPeriod);
  const deleteEvent = useGameEventsStore((s) => s.deleteEvent);

  const players = useGamePlayersStore((s) => s.players);

  const getPendingSubs = useGameSubsStore((s) => s.getPendingSubs);
  const confirmAllPendingSubs = useGameSubsStore(
    (s) => s.confirmAllPendingSubs
  );

  const recordGoal = useGameEventsStore((s) => s.recordGoal);
  const recordDiscipline = useGameEventsStore((s) => s.recordDiscipline);
  const recordPenaltyKick = useGameEventsStore((s) => s.recordPenaltyKick);
  const recordPlayerAction = useGameEventsStore((s) => s.recordPlayerAction);

  const isOpen = gameStage === "in_stoppage";

  const [, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState("events");
  const [eventType, setEventType] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [selectedAssist, setSelectedAssist] = useState("");
  const [eventDetails, setEventDetails] = useState("");
  const [cardReason, setCardReason] = useState("");
  const [cardType, setCardType] = useState("");
  const [stoppageReason, setStoppageReason] = useState("");
  const [pendingSubs, setPendingSubs] = useState([]);
  const [isRecordingEvent, setIsRecordingEvent] = useState(false);

  const [selectedTeam, setSelectedTeam] = useState("us");
  const [isOwnGoal, setIsOwnGoal] = useState(false);
  const [goalTypes, setGoalTypes] = useState([]);
  const [opponentJerseyNumber, setOpponentJerseyNumber] = useState("");

  const [penaltyKickState, setPenaltyKickState] = useState(null);
  const [penaltyKicker, setPenaltyKicker] = useState("");
  const [penaltyKickerJersey, setPenaltyKickerJersey] = useState("");
  const [penaltyOutcome, setPenaltyOutcome] = useState("");
  const [penaltyTeam, setPenaltyTeam] = useState("us");
 const [showDialog, setShowDialog] = useState(false);
 const [dialogConfig, setDialogConfig] = useState({});

 useEffect(() => {
    if (initialEventType) {
      if (initialEventType === "goal") {
        setEventType("goal");
        setActiveTab("events");
      } else if (initialEventType === "discipline") {
        setEventType("yellow_card");
        setActiveTab("events");
      } else if (initialEventType === "penalty") {
        setActiveTab("penalties");
        setPenaltyKickState("awarded");
      } else {
        setActiveTab("events");
      }
    }
  }, [initialEventType]);

  useEffect(() => {
    const fetchSubs = async () => {
      if (!game?.game_id) return;
      const subs = await getPendingSubs();
      setPendingSubs(subs || []);
    };
    fetchSubs();
  }, [game?.game_id, getPendingSubs, players]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTick((tick) => tick + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const gameTime = getGameTime();
  const periodTime = getPeriodTime();
  const periodLabel = getCurrentPeriodLabel();
  const activeStoppage = game?.gameEventsMajor?.find(
    (e) => e.end_time === null && e.clock_should_run === 0
  );
  const isInStoppage = gameStage === "in_stoppage";

  const onFieldPlayers = useMemo(
    () =>
      players
        .filter(
          (p) => 
            p.fieldStatus === "onField" || 
            p.fieldStatus === "onFieldGk" || 
            p.fieldStatus === "subbingOut" || 
            p.fieldStatus === "subbingOutGk"
        )
        .map((p) => ({
          value: p.playerGameId,
          label: `#${p.jerseyNumber} ${p.fullName}`,
        })),
    [players]
  );

  const eventTypes = [
    { value: "goal", label: "Goal" },
    { value: "yellow_card", label: "Yellow Card" },
    { value: "red_card", label: "Red Card" },
    { value: "yellow_red_card", label: "Second Yellow (Red)" },
  ];

  const cardTypes = [
    { value: "yellow_card", label: "Yellow Card" },
    { value: "red_card", label: "Straight Red Card" },
    { value: "yellow_red_card", label: "Second Yellow → Red" },
  ];

  const cardReasons = [
    { value: "unsporting_behavior", label: "Unsporting Behavior" },
    { value: "dissent", label: "Dissent" },
    { value: "persistent_infringement", label: "Persistent Infringement" },
    { value: "delaying_restart", label: "Delaying Restart of Play" },
    { value: "failing_respect_distance", label: "Failing to Respect Distance" },
    {
      value: "entering_leaving_without_permission",
      label: "Entering/Leaving Without Permission",
    },
    { value: "serious_foul_play", label: "Serious Foul Play" },
    { value: "violent_conduct", label: "Violent Conduct" },
    { value: "spitting", label: "Spitting" },
    { value: "denying_goal_handball", label: "Denying Goal with Handball" },
    { value: "denying_goal_foul", label: "Denying Goal with Foul" },
    { value: "offensive_language", label: "Offensive/Abusive Language" },
    { value: "receiving_second_yellow", label: "Receiving Second Yellow Card" },
  ];

  const goalTypeOptions = [
    { value: "corner_kick", label: "Corner Kick" },
    { value: "free_kick_direct", label: "Free Kick - Direct" },
    { value: "free_kick_indirect", label: "Free Kick - Indirect" },
    { value: "throw_in", label: "Throw-In" },
    { value: "header", label: "Header" },
    { value: "volley", label: "Volley" },
  ];

  const handleStartStoppage = async () => {
    await startStoppage(stoppageReason);
    setStoppageReason("");
  };

  const handleEndStoppage = async () => {
    if (activeStoppage) {
      await endStoppage(activeStoppage.id);
    }
  };

  const handleCancelStoppage = async () => {
    if (!activeStoppage) return;
    setShowDialog(true);


  };
  const handleConfirm =async () => {
    setShowDialog(false);
    try {
      await deleteEvent(activeStoppage.id, "major", true);
      onClose();
    } catch (error) {
      console.error("Error canceling stoppage:", error);
      alert("Failed to cancel stoppage. Please try again.");
    }
  }

  const handleConfirmAllSubs = async () => {
    const result = await confirmAllPendingSubs();
    if (game?.game_id) {
      const subs = await getPendingSubs();
      setPendingSubs(subs || []);
    }
    return result;
  };

  const autoCloseAndResume = async () => {
    if (pendingSubs.length > 0) {
      const confirmEnterSubs = window.confirm(
        `You have ${pendingSubs.length} pending sub(s). Confirm all substitutions now?`
      );
      if (confirmEnterSubs) {
        await handleConfirmAllSubs();
      }
    }

    if (activeStoppage) {
      setIsRecordingEvent(false);
      await handleEndStoppage();
    }
    onClose();
  };

  const handleRecordGoal = async () => {
    if (isOwnGoal) {
      // OK
    } else if (selectedTeam === "them") {
      // Opponent goals require no additional info
    } else if (selectedTeam === "us" && !selectedPlayer) {
      alert("Please select a player");
      return;
    }

    setIsRecordingEvent(true);

    try {
      const goalData = {
        isOwnGoal: isOwnGoal ? 1 : 0,
        details: eventDetails || null,
        goalTypes: goalTypes.length > 0 ? goalTypes : null,
      };

      if (isOwnGoal) {
        goalData.teamSeasonId = game.isHome
          ? game.away_team_season_id
          : game.home_team_season_id;
        if (selectedPlayer) {
          goalData.scorerPlayerGameId = parseInt(selectedPlayer);
        }
      } else if (selectedTeam === "them") {
        goalData.teamSeasonId = game.isHome
          ? game.away_team_season_id
          : game.home_team_season_id;
        if (opponentJerseyNumber) {
           goalData.opponentJerseyNumber = parseInt(opponentJerseyNumber);
        }
      } else {
        goalData.scorerPlayerGameId = parseInt(selectedPlayer);
        if (selectedAssist) {
          goalData.assistPlayerGameId = parseInt(selectedAssist);
        }
      }

      await recordGoal(goalData);

      if (!isOwnGoal && selectedPlayer && selectedTeam === "us") {
        await recordPlayerAction({
          playerGameId: parseInt(selectedPlayer),
          eventType: "shot_on_target",
        });
      }

      resetFormState();
      await autoCloseAndResume();
    } catch (error) {
      console.error("Error recording goal:", error);
      alert("Failed to record goal. Please try again.");
      setIsRecordingEvent(false);
    }
  };

  const handleRecordCard = async () => {
    if (!cardType) {
      alert("Please select card type");
      return;
    }

    if (selectedTeam === "them" && !opponentJerseyNumber) {
      alert("Please enter opponent jersey number");
      return;
    } else if (selectedTeam === "us" && !selectedPlayer) {
      alert("Please select a player");
      return;
    }

    setIsRecordingEvent(true);

    try {
      const disciplineData = {
        cardType: cardType,
        cardReason: cardReason || null,
        details: eventDetails || null,
      };

      if (selectedTeam === "them") {
        disciplineData.teamSeasonId = game.isHome
          ? game.away_team_season_id
          : game.home_team_season_id;
        disciplineData.opponentJerseyNumber = parseInt(opponentJerseyNumber);
      } else {
        disciplineData.playerGameId = parseInt(selectedPlayer);
      }

      await recordDiscipline(disciplineData);
      resetFormState();
      await autoCloseAndResume();
    } catch (error) {
      console.error("Error recording card:", error);
      alert("Failed to record card. Please try again.");
      setIsRecordingEvent(false);
    }
  };

  const handleAwardPenalty = () => {
    setPenaltyKickState("awarded");
  };

  const handleRecordPenaltyKick = async () => {
    if (!penaltyOutcome) {
      alert("Please select penalty outcome");
      return;
    }

    if (penaltyTeam === "them" && !penaltyKickerJersey) {
      alert("Please enter opponent jersey number");
      return;
    } else if (penaltyTeam === "us" && !penaltyKicker) {
      alert("Please select penalty kicker");
      return;
    }

    setIsRecordingEvent(true);

    try {
      const penaltyData = {
        outcome: penaltyOutcome,
        details: eventDetails || null,
      };

      if (penaltyTeam === "them") {
        penaltyData.teamSeasonId = game.isHome
          ? game.away_team_season_id
          : game.home_team_season_id;
        penaltyData.shooterJerseyNumber = parseInt(penaltyKickerJersey);
      } else {
        penaltyData.shooterPlayerGameId = parseInt(penaltyKicker);
      }

      await recordPenaltyKick(penaltyData);

      if (penaltyOutcome === "score") {
        setPenaltyKickState("scored");
        if (penaltyTeam === "us") {
          setSelectedPlayer(penaltyKicker);
          setSelectedTeam("us");
        } else {
          setOpponentJerseyNumber(penaltyKickerJersey);
          setSelectedTeam("them");
        }
        setGoalTypes(["penalty_kick"]);
        setIsRecordingEvent(false);
      } else {
        resetPenaltyKickState();
        await autoCloseAndResume();
      }
    } catch (error) {
      console.error("Error recording penalty kick:", error);
      alert("Failed to record penalty kick. Please try again.");
      setIsRecordingEvent(false);
    }
  };

  const handleConfirmPenaltyGoal = async () => {
    await handleRecordGoal();
    resetPenaltyKickState();
  };

  const resetFormState = () => {
    setEventType("");
    setSelectedPlayer("");
    setSelectedAssist("");
    setEventDetails("");
    setCardReason("");
    setCardType("");
    setSelectedTeam("us");
    setIsOwnGoal(false);
    setGoalTypes([]);
    setOpponentJerseyNumber("");
  };

  const resetPenaltyKickState = () => {
    setPenaltyKickState(null);
    setPenaltyKicker("");
    setPenaltyKickerJersey("");
    setPenaltyOutcome("");
    setPenaltyTeam("us");
  };

  const handleResumeGame = async () => {
    if (penaltyKickState === "awarded" || penaltyKickState === "scored") {
      alert(
        "Please complete the penalty kick workflow before resuming the game."
      );
      return;
    }

    // Only allow resuming if explicitly called (either via button or after an event)
    await autoCloseAndResume();
  };

  const toggleGoalType = (type) => {
    setGoalTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  if (!game) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Game Control'
      size='xl'
      closeOnOverlayClick={true}
      showCloseButton={false}
    >
      <div className='space-y-6'>
        <LiveGameHeader
          gameTime={gameTime}
          periodTime={periodTime}
          periodLabel={periodLabel}
          isInStoppage={isInStoppage}
          stoppageReason={stoppageReason}
          setStoppageReason={setStoppageReason}
          onStartStoppage={handleStartStoppage}
          onResumeGame={handleResumeGame}
          onCancelStoppage={handleCancelStoppage}
        />

        <PeriodControls
          gameStage={gameStage}
          periodLabel={periodLabel}
          onStartNextPeriod={startNextPeriod}
          onEndPeriod={endPeriod}
        />

        <div className='flex gap-2 border-b border-border'>
          <button
            onClick={() => setActiveTab("events")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "events"
                ? "text-primary border-b-2 border-primary"
                : "text-muted hover:text-text"
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab("penalties")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "penalties"
                ? "text-primary border-b-2 border-primary"
                : "text-muted hover:text-text"
            }`}
          >
            Penalty Kicks
          </button>
          <button
            onClick={() => setActiveTab("subs")}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === "subs"
                ? "text-primary border-b-2 border-primary"
                : "text-muted hover:text-text"
            }`}
          >
            Substitutions
            {pendingSubs.length > 0 && (
              <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                {pendingSubs.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "events" && (
          <EventRecordingPanel
            activeTab={activeTab}
            eventType={eventType}
            setEventType={setEventType}
            setCardType={setCardType}
            setIsOwnGoal={setIsOwnGoal}
            setGoalTypes={setGoalTypes}
            setSelectedTeam={setSelectedTeam}
            setOpponentJerseyNumber={setOpponentJerseyNumber}
            setSelectedPlayer={setSelectedPlayer}
            setSelectedAssist={setSelectedAssist}
            eventTypes={eventTypes}
            selectedTeam={selectedTeam}
            isOwnGoal={isOwnGoal}
            opponentJerseyNumber={opponentJerseyNumber}
            selectedPlayer={selectedPlayer}
            onFieldPlayers={onFieldPlayers}
            selectedAssist={selectedAssist}
            goalTypes={goalTypes}
            goalTypeOptions={goalTypeOptions}
            toggleGoalType={toggleGoalType}
            eventDetails={eventDetails}
            setEventDetails={setEventDetails}
            onRecordGoal={handleRecordGoal}
            isRecordingEvent={isRecordingEvent}
            cardType={cardType}
            cardTypes={cardTypes}
            cardReason={cardReason}
            setCardReason={setCardReason}
            cardReasons={cardReasons}
            onRecordCard={handleRecordCard}
          />
        )}

        {activeTab === "penalties" && (
          <PenaltyKickWorkflow
            penaltyKickState={penaltyKickState}
            onAwardPenalty={handleAwardPenalty}
            penaltyTeam={penaltyTeam}
            setPenaltyTeam={setPenaltyTeam}
            penaltyKicker={penaltyKicker}
            setPenaltyKicker={setPenaltyKicker}
            penaltyKickerJersey={penaltyKickerJersey}
            setPenaltyKickerJersey={setPenaltyKickerJersey}
            penaltyOutcome={penaltyOutcome}
            setPenaltyOutcome={setPenaltyOutcome}
            eventDetails={eventDetails}
            setEventDetails={setEventDetails}
            onRecordPenaltyKick={handleRecordPenaltyKick}
            isRecordingEvent={isRecordingEvent}
            onResetPenaltyKickState={resetPenaltyKickState}
            onConfirmPenaltyGoal={handleConfirmPenaltyGoal}
            onFieldPlayers={onFieldPlayers}
          />
        )}

        {activeTab === "subs" && (
          <div className='space-y-4'>
            {pendingSubs.length > 0 && (
              <div className='bg-background p-4 rounded-lg border border-border'>
                <div className='flex items-center justify-between mb-3'>
                  <h3 className='text-lg font-semibold text-text'>
                    Pending Substitutions ({pendingSubs.length})
                  </h3>
                  <Button
                    onClick={handleConfirmAllSubs}
                    variant='primary'
                    size='sm'
                  >
                    Confirm All
                  </Button>
                </div>
                <PendingSubs />
              </div>
            )}

            <SubManagementPanel />
          </div>
        )}

        <GameInfoFooter game={game} gameStage={gameStage} />
      </div>
    <Dialog
  isOpen={showDialog}
  onClose={() => setShowDialog(false)}
  title="Confirm Action"
  message="This will delete the stoppage event and resume the game."
  type="confirm" // 'alert', 'confirm', 'warning'
  confirmText="Delete this stoppage"
  cancelText="Cancel"
  onConfirm={handleConfirm}
/>
    </Modal>
  );
}

export default LiveGameModal;
