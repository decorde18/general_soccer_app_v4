// app/(gamesLayout)/gamestats/[teamSeasonId]/[id]/GameProvider.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import { useSession } from "next-auth/react";
import { FullScreenLoader, FullScreenError } from "@/components/shared/FullScreenState";

interface GameProviderProps {
  children: ReactNode;
}

export default function GameProvider({ children }: GameProviderProps) {
  const { id, teamSeasonId } = useParams<{ id: string; teamSeasonId: string }>();
  const router = useRouter();

  // Auth & Context
  const { data: session, status } = useSession();

  // Game Stores
  const initializeGame = useGameStore((s) => s.initializeGame);
  const loadPlayers = useGamePlayersStore((s) => s.loadPlayers);
  const gameIsLoading = useGameStore((s) => s.isLoading);
  const playersIsLoading = useGamePlayersStore((s) => s.isLoading);
  const game = useGameStore((s) => s.game);
  const players = useGamePlayersStore((s) => s.players);

  const [initError, setInitError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // STEP 1: Wait for hydration, then check auth & permissions
  useEffect(() => {
    if (status === "loading") return;

    // Not authenticated - redirect to login
    if (status === "unauthenticated" || !session?.user) {
      router.push(`/login?redirect=/gamestats/${teamSeasonId}/${id}`);
      return;
    }

    const userObj = session.user as any;
    const targetId = parseInt(String(teamSeasonId));
    
    // Check team access using NextAuth roles
    const isCoachOrAdmin = 
      userObj?.roles?.coachTeamIds?.includes(targetId) || 
      userObj?.roles?.isAdmin || 
      userObj?.roles?.clubAdmin;
      
    const isTeamAdminOrStatsKeeper = 
      userObj?.roles?.teamAdminTeamIds?.includes(targetId);

    // Must have can_enter_stats permission
    if (!isCoachOrAdmin && !isTeamAdminOrStatsKeeper) {
      console.warn("Access denied: User lacks can_enter_stats permission");
      router.push(`/teams/${teamSeasonId}?error=insufficient_permissions`);
      return;
    }

    // Auth check passed
    setAuthChecked(true);
  }, [status, session, teamSeasonId, id, router]);

  // STEP 2: Load Game Data (only after auth check passes)
  useEffect(() => {
    if (!authChecked) return;

    const initializeGameData = async () => {
      try {
        // Initialize game first
        const result = await initializeGame(id, teamSeasonId);

        // Redirect if game not found
        if (result?.notFound) {
          router.push("/games");
          return;
        }

        // Then load players for this game
        await loadPlayers(id, teamSeasonId);
      } catch (error) {
        console.error("Error initializing game:", error);
        setInitError(error instanceof Error ? error.message : "Something went wrong loading this game.");
      }
    };

    initializeGameData();
  }, [authChecked, id, teamSeasonId, initializeGame, loadPlayers, router]);

  // Waiting for hydration or auth check
  if (status === "loading" || !authChecked) {
    return <FullScreenLoader message="Verifying access..." />;
  }

  // Error state
  if (initError) {
    return (
      <FullScreenError
        title="Unable to Load Game"
        message={initError}
        actionLabel="Back to Games"
        onAction={() => router.push("/games")}
      />
    );
  }

  // Loading game data
  if (gameIsLoading || playersIsLoading || !game || players.length === 0) {
    return <FullScreenLoader message="Loading game data..." />;
  }

  // All checks passed - render children
  return <>{children}</>;
}
