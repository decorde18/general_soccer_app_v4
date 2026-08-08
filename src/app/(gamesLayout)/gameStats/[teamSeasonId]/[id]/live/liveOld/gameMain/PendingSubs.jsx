"use client";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useGameSubsStore from "@/stores/gameSubsStore";
import useGameStore from "@/stores/gameStore";
import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Dialog from "@/components/ui/Dialog";

function PendingSubs({ hideIndividualEnter = false, hideEnterAll = false }) {
  const allPlayers = useGamePlayersStore((s) => s.players);
  const game = useGameStore((s) => s.game);

  const confirmSub = useGameSubsStore((s) => s.confirmSub);
  const cancelSub = useGameSubsStore((s) => s.cancelSub);
  const updatePendingSub = useGameSubsStore((s) => s.updatePendingSub);

  const [editingSubId, setEditingSubId] = useState(null);
  const [editingInPlayer, setEditingInPlayer] = useState("");
  const [editingOutPlayer, setEditingOutPlayer] = useState("");
  const [confirmError, setConfirmError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Dialog state
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: "confirm",
    title: "",
    message: "",
    onConfirm: null,
  });

  // Get pending subs directly from player data (synchronous)
  const pendingSubs = useMemo(() => {
    const subs = [];
    const seenSubIds = new Set();

    allPlayers.forEach((player) => {
      (player.ins || []).forEach((sub) => {
        if (sub.gameTime === null) {
          const existing = subs.find((s) => s.subId === sub.subId);
          if (existing) {
            existing.inPlayerId = player.playerGameId;
          } else if (!seenSubIds.has(sub.subId)) {
            seenSubIds.add(sub.subId);
            subs.push({
              subId: sub.subId,
              inPlayerId: player.playerGameId,
              outPlayerId: null,
              gkSub: sub.gkSub,
            });
          }
        }
      });

      (player.outs || []).forEach((sub) => {
        if (sub.gameTime === null) {
          const existing = subs.find((s) => s.subId === sub.subId);
          if (existing) {
            existing.outPlayerId = player.playerGameId;
          } else if (!seenSubIds.has(sub.subId)) {
            seenSubIds.add(sub.subId);
            subs.push({
              subId: sub.subId,
              inPlayerId: null,
              outPlayerId: player.playerGameId,
              gkSub: sub.gkSub,
            });
          }
        }
      });
    });

    return subs.map((sub) => ({
      ...sub,
      isComplete: sub.inPlayerId !== null && sub.outPlayerId !== null,
    }));
  }, [allPlayers]);

  const players = allPlayers.filter((p) =>
    ["dressed", "starter", "goalkeeper"].includes(p.gameStatus),
  );

  const subsWithPlayerInfo = useMemo(() => {
    return pendingSubs.map((sub) => {
      const inPlayer = sub.inPlayerId
        ? players.find((p) => p.playerGameId === sub.inPlayerId)
        : null;
      const outPlayer = sub.outPlayerId
        ? players.find((p) => p.playerGameId === sub.outPlayerId)
        : null;

      return {
        ...sub,
        inPlayer,
        outPlayer,
        inPlayerName: inPlayer
          ? `#${inPlayer.jerseyNumber} ${inPlayer.fullName}`
          : null,
        outPlayerName: outPlayer
          ? `#${outPlayer.jerseyNumber} ${outPlayer.fullName}`
          : null,
        isGkSub:
          sub.gkSub ||
          inPlayer?.gameStatus === "goalkeeper" ||
          outPlayer?.gameStatus === "goalkeeper",
      };
    });
  }, [pendingSubs, players]);

  // Get available players for dropdowns
  const getAvailableBenchPlayers = (currentSubId) => {
    const currentSub = pendingSubs.find((s) => s.subId === currentSubId);
    const pendingInPlayerIds = new Set(
      pendingSubs
        .filter((s) => s.inPlayerId && s.subId !== currentSubId)
        .map((s) => s.inPlayerId),
    );

    return players
      .filter((p) => {
        if (
          currentSub?.inPlayerId &&
          p.playerGameId === currentSub.inPlayerId
        ) {
          return true;
        }
        if (p.fieldStatus !== "onBench") return false;
        if (pendingInPlayerIds.has(p.playerGameId)) return false;
        return true;
      })
      .map((p) => ({
        value: p.playerGameId,
        label: `#${p.jerseyNumber} ${p.fullName}`,
      }));
  };
  const getAvailableFieldPlayers = (currentSubId) => {
    const currentSub = pendingSubs.find((s) => s.subId === currentSubId);
    const pendingOutPlayerIds = new Set(
      pendingSubs
        .filter((s) => s.outPlayerId && s.subId !== currentSubId)
        .map((s) => s.outPlayerId),
    );

    return players
      .filter((p) => {
        if (
          currentSub?.outPlayerId &&
          p.playerGameId === currentSub.outPlayerId
        ) {
          return true;
        }
        if (p.fieldStatus !== "onField" && p.fieldStatus !== "onFieldGk")
          return false;
        if (pendingOutPlayerIds.has(p.playerGameId)) return false;
        return true;
      })
      .map((p) => ({
        value: p.playerGameId,
        label: `#${p.jerseyNumber} ${p.fullName}`,
      }));
  };
  const handleStartEdit = (sub) => {
    setEditingSubId(sub.subId);
    setEditingInPlayer(sub.inPlayerId?.toString() || "");
    setEditingOutPlayer(sub.outPlayerId?.toString() || "");
  };
  const handleSaveEdit = async () => {
    if (!game?.game_id) return;

    setIsProcessing(true);
    try {
      const updates = {};
      if (editingInPlayer) updates.in_player_id = parseInt(editingInPlayer);
      if (editingOutPlayer) updates.out_player_id = parseInt(editingOutPlayer);

      await updatePendingSub(editingSubId, updates);

      setEditingSubId(null);
      setEditingInPlayer("");
      setEditingOutPlayer("");
    } catch (error) {
      console.error("Error updating sub:", error);
      setConfirmError("Failed to update substitution");
    } finally {
      setIsProcessing(false);
    }
  };
  const handleCancelEdit = () => {
    setEditingSubId(null);
    setEditingInPlayer("");
    setEditingOutPlayer("");
  };
  const validateAndConfirmSub = async (sub) => {
    // Validation logic
    if (sub.outPlayerId && !sub.inPlayerId) {
      const player = players.find((p) => p.playerGameId === sub.outPlayerId);
      const playerName = player
        ? `#${player.jerseyNumber} ${player.fullName}`
        : "Unknown";

      return new Promise((resolve) => {
        setDialog({
          isOpen: true,
          type: "warning",
          title: "Incomplete Substitution",
          message: `Player coming out without replacement:\n${playerName}\n\nConfirm this substitution?`,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
    }

    if (sub.inPlayerId && !sub.outPlayerId) {
      const currentFieldCount = players.filter(
        (p) =>
          p.fieldStatus === "onField" ||
          p.fieldStatus === "subbingIn" ||
          p.fieldStatus === "onFieldGk",
      ).length;

      if (currentFieldCount >= +game.settings.playersOnField) {
        setDialog({
          isOpen: true,
          type: "error",
          title: "Maximum Players Reached",
          message:
            "You already have the maximum number of players on the field.",
          showCancel: false,
          onConfirm: () => {},
        });
        return false;
      }

      const player = players.find((p) => p.playerGameId === sub.inPlayerId);
      const playerName = player
        ? `#${player.jerseyNumber} ${player.fullName}`
        : "Unknown";

      return new Promise((resolve) => {
        setDialog({
          isOpen: true,
          type: "warning",
          title: "Incomplete Substitution",
          message: `Player coming in without replacement:\n${playerName}\n\nConfirm this substitution?`,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
    }

    return true;
  };
  const handleConfirmSingle = async (subId) => {
    if (!game?.game_id) return;

    const sub = pendingSubs.find((s) => s.subId === subId);
    if (!sub) return;

    setIsProcessing(true);
    setConfirmError(null);

    try {
      if (!sub.isComplete) {
        const shouldProceed = await validateAndConfirmSub(sub);
        if (!shouldProceed) {
          setIsProcessing(false);
          return;
        }
      }

      await confirmSub(subId);
    } catch (error) {
      console.error("Error confirming sub:", error);
      setConfirmError("Failed to confirm substitution");
    } finally {
      setIsProcessing(false);
    }
  };
  const handleConfirmAll = async () => {
    if (!game?.game_id) return;

    setConfirmError(null);
    setIsProcessing(true);

    try {
      // Process ALL subs immediately, one at a time
      for (const sub of pendingSubs) {
        if (!sub.isComplete) {
          const shouldProceed = await validateAndConfirmSub(sub);
          if (shouldProceed) {
            await confirmSub(sub.subId);
          }
        } else {
          await confirmSub(sub.subId);
        }
      }
    } catch (error) {
      console.error("Error confirming subs:", error);
      setConfirmError("Failed to confirm all substitutions");
    } finally {
      setIsProcessing(false);
    }
  };
  const handleCancelSub = async (subId) => {
    if (!game?.game_id) return;

    setIsProcessing(true);
    try {
      await cancelSub(subId);
    } catch (error) {
      console.error("Error canceling sub:", error);
      setConfirmError("Failed to cancel substitution");
    } finally {
      setIsProcessing(false);
    }
  };
  const closeDialog = () => {
    setDialog({ ...dialog, isOpen: false });
  };

  if (!game?.game_id) {
    return <div className='text-center text-muted py-4'>No active game</div>;
  }

  if (subsWithPlayerInfo.length === 0) {
    return <div className='text-center text-muted py-4'>No pending subs</div>;
  }

  const completeSubs = subsWithPlayerInfo.filter((s) => s.isComplete);
  const incompleteSubs = subsWithPlayerInfo.filter((s) => !s.isComplete);

  return (
    <div className='w-full max-w-full overflow-hidden'>
      {/* Dialog Component */}
      <Dialog
        isOpen={dialog.isOpen}
        onClose={closeDialog}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        confirmText={dialog.type === "error" ? "OK" : "Confirm"}
        showCancel={dialog.type !== "alert" && dialog.type !== "error"}
        onConfirm={() => {
          if (dialog.onConfirm) {
            dialog.onConfirm();
          }
          closeDialog();
        }}
      />

      {/* Header with Enter All Button */}
      {!hideEnterAll &&
        (completeSubs.length > 0 || incompleteSubs.length > 0) && (
          <div className='mb-3 pb-3 border-b border-border'>
            <div className='flex items-center justify-between gap-2 mb-2'>
              <div className='text-xs text-muted'>
                {completeSubs.length} ready
                {incompleteSubs.length > 0 &&
                  `, ${incompleteSubs.length} incomplete`}
              </div>
              <Button
                onClick={handleConfirmAll}
                variant='success'
                size='sm'
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Enter All"}
              </Button>
            </div>
          </div>
        )}

      {/* Show sub count when Enter All is hidden */}
      {hideEnterAll &&
        (completeSubs.length > 0 || incompleteSubs.length > 0) && (
          <div className='mb-3 pb-3 border-b border-border'>
            <div className='text-xs text-muted text-center'>
              {completeSubs.length} ready
              {incompleteSubs.length > 0 &&
                `, ${incompleteSubs.length} incomplete`}
            </div>
          </div>
        )}

      {/* Error Display */}
      {confirmError && (
        <div className='mb-3 p-2 bg-warningbg border border-warningborder text-warningtext rounded text-xs'>
          {confirmError}
        </div>
      )}

      {/* Substitutions List */}
      <div className='space-y-2 max-h-[400px] overflow-y-auto pr-1'>
        {subsWithPlayerInfo.map((sub) => {
          const isEditing = editingSubId === sub.subId;
          const availableBenchPlayers = isEditing
            ? getAvailableBenchPlayers(sub.subId)
            : [];
          const availableFieldPlayers = isEditing
            ? getAvailableFieldPlayers(sub.subId)
            : [];

          return (
            <div
              key={sub.subId}
              className={`p-2 rounded-lg border ${
                sub.isComplete
                  ? "bg-surface border-border"
                  : "bg-warningbg border-warningborder"
              }`}
            >
              {/* Player Info */}
              <div className='space-y-1 mb-2'>
                {/* IN Player */}
                <div className='flex items-center gap-1.5'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-3 w-3 text-success flex-shrink-0'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                  >
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <span className='text-xs text-text-label font-medium uppercase flex-shrink-0'>
                    In:
                  </span>
                  {isEditing ? (
                    <Select
                      value={editingInPlayer}
                      onChange={(e) => setEditingInPlayer(e.target.value)}
                      options={availableBenchPlayers}
                      placeholder='Select Player In'
                      className='text-xs flex-1 min-w-0'
                    />
                  ) : (
                    <div className='text-xs font-medium text-text truncate flex-1 min-w-0'>
                      {sub.inPlayerName || (
                        <span className='text-muted italic'>Not selected</span>
                      )}
                    </div>
                  )}
                  {sub.isGkSub && (
                    <span className='px-1 py-0.5 bg-primary text-white text-xs rounded flex-shrink-0'>
                      GK
                    </span>
                  )}
                </div>

                {/* OUT Player */}
                <div className='flex items-center gap-1.5'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-3 w-3 text-danger flex-shrink-0'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                  >
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <span className='text-xs text-text-label font-medium uppercase flex-shrink-0'>
                    Out:
                  </span>
                  {isEditing ? (
                    <Select
                      value={editingOutPlayer}
                      onChange={(e) => setEditingOutPlayer(e.target.value)}
                      options={availableFieldPlayers}
                      placeholder='Select Player Out'
                      className='text-xs flex-1 min-w-0'
                    />
                  ) : (
                    <div className='text-xs font-medium text-text truncate flex-1 min-w-0'>
                      {sub.outPlayerName || (
                        <span className='text-muted italic'>Not selected</span>
                      )}
                    </div>
                  )}
                  {!sub.isComplete && (
                    <span className='px-1 py-0.5 bg-accent text-white text-xs rounded flex-shrink-0'>
                      !
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex gap-2 flex-wrap'>
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSaveEdit}
                      variant='success'
                      size='sm'
                      className='flex-1'
                      disabled={isProcessing}
                    >
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant='outline'
                      size='sm'
                      className='flex-1'
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => handleStartEdit(sub)}
                      variant='outline'
                      size='sm'
                      className='flex-1'
                      disabled={isProcessing}
                    >
                      Edit
                    </Button>
                    {!hideIndividualEnter && (
                      <Button
                        onClick={() => handleConfirmSingle(sub.subId)}
                        variant='success'
                        size='sm'
                        className='flex-1'
                        disabled={isProcessing}
                      >
                        Enter
                      </Button>
                    )}
                    <Button
                      onClick={() => handleCancelSub(sub.subId)}
                      variant='danger'
                      size='sm'
                      className='flex-1'
                      disabled={isProcessing}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PendingSubs;
