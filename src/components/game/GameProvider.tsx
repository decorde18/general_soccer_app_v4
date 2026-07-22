// app/(gamesLayout)/gamestats/[teamSeasonId]/[id]/GameProvider.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import useAuthStore from "@/stores/authStore";
import { useUserContextStore } from "@/stores/userContextStore";
import { getTeamAccess, Permissions } from "@/lib/clientPermissions";
import { FullScreenLoader, FullScreenError } from "@/components/shared/FullScreenState";

interface GameProviderProps {
  children: ReactNode;
}

export default function GameProvider({ children }: GameProviderProps) {
  const { id, teamSeasonId } = useParams<{ id: string; teamSeasonId: string }>();
  const router = useRouter();

  // Auth & Context
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const { myTeams } = useUserContextStore();

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
    // Wait for Zustand to hydrate from localStorage
    if (!_hasHydrated) {
      return;
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated || !user) {
      router.push(`/auth/login?redirect=/gamestats/${teamSeasonId}/${id}`);
      return;
    }

    // Check team access
    const access = getTeamAccess(user, myTeams, teamSeasonId);

    // Must have can_enter_stats permission
    if (!Permissions.canEnterStats(access)) {
      console.warn("Access denied: User lacks can_enter_stats permission");
      router.push(`/teams/${teamSeasonId}?error=insufficient_permissions`);
      return;
    }

    // Auth check passed
    setAuthChecked(true);
  }, [_hasHydrated, isAuthenticated, user, myTeams, teamSeasonId, id, router]);

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
  if (!_hasHydrated || !authChecked) {
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
