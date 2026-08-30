// app/(gamesLayout)/gamestats/[teamSeasonId]/[id]/GameProvider.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import useGameStore from "@/stores/gameStore";
import useGamePlayersStore from "@/stores/gamePlayersStore";
import { useSession } from "next-auth/react";
import { FullScreenLoader, FullScreenError } from "@/components/shared/FullScreenState";

import { saveGameCache, loadGameCache } from "@/lib/offline/offlineSync";
import { toast } from "sonner";

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
  const game = useGameStore((s) => s.game);
  const players = useGamePlayersStore((s) => s.players);

  const [initError, setInitError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // STEP 1: Wait for hydration, then check auth & permissions (with offline fallback)
  useEffect(() => {
    if (status === "loading") return;

    // Check if we have offline cached game data available
    const cached = loadGameCache(id);

    // Not authenticated online - check if offline cache exists
    if (status === "unauthenticated" || !session?.user) {
      if (cached) {
        console.warn("Offline/unauthenticated session: Bypassing auth check using local cache.");
        setAuthChecked(true);
        return;
      }
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
      if (cached) {
        setAuthChecked(true);
        return;
      }
      console.warn("Access denied: User lacks can_enter_stats permission");
      router.push(`/teams/${teamSeasonId}?error=insufficient_permissions`);
      return;
    }

    // Auth check passed
    setAuthChecked(true);
  }, [status, session, teamSeasonId, id, router]);

  // STEP 2: Load Game Data (online fetch with offline cache fallback)
  useEffect(() => {
    if (!authChecked) return;

    const initializeGameData = async () => {
      try {
        // Initialize game first online
        const result = await initializeGame(id, teamSeasonId);

        // Redirect if game not found
        if (result?.notFound) {
          router.push(teamSeasonId ? `/teams/${teamSeasonId}` : "/dashboard");
          return;
        }

        // Check if game's teams have changed (e.g. bracket placeholder resolved to real team)
        const latestGame = useGameStore.getState().game;
        const numTeamSeasonId = Number(teamSeasonId);

        if (
          latestGame &&
          latestGame.homeTeamSeasonId &&
          latestGame.awayTeamSeasonId &&
          numTeamSeasonId !== latestGame.homeTeamSeasonId &&
          numTeamSeasonId !== latestGame.awayTeamSeasonId
        ) {
          console.log(`Bracket team resolved. Redirecting to active team season #${latestGame.homeTeamSeasonId}...`);
          router.replace(`/gamestats/${latestGame.homeTeamSeasonId}/${id}`);
          await loadPlayers(id, String(latestGame.homeTeamSeasonId));
        } else {
          // Load players for this game and team
          await loadPlayers(id, teamSeasonId);
        }

        // Cache successful load for offline resilience
        const currentPlayers = useGamePlayersStore.getState().players;
        if (latestGame && currentPlayers.length > 0) {
          saveGameCache(id, latestGame, currentPlayers);
        }
      } catch (error) {
        console.error("Error initializing game online, checking offline cache:", error);
        
        // Check offline cache fallback
        const cached = loadGameCache(id);
        if (cached?.game && cached?.players) {
          useGameStore.setState({ game: cached.game, isLoading: false });
          useGamePlayersStore.setState({ players: cached.players, isLoading: false });
          toast.info("Offline Mode: Rehydrated match data from device cache.");
          setInitError(null);
          return;
        }

        setInitError(error instanceof Error ? error.message : "Something went wrong loading this game.");
      }
    };

    initializeGameData();
  }, [authChecked, id, teamSeasonId, initializeGame, loadPlayers, router]);

  // STEP 3: Final cache fallback rehydration in useEffect (Hook declared at top level)
  useEffect(() => {
    if ((!game || players.length === 0) && id) {
      const cached = loadGameCache(id);
      if (cached?.game && cached?.players) {
        useGameStore.setState({ game: cached.game, isLoading: false });
        useGamePlayersStore.setState({ players: cached.players, isLoading: false });
      }
    }
  }, [game, players?.length, id]);

  // Waiting for hydration or auth check
  if (status === "loading" || !authChecked) {
    return <FullScreenLoader message="Verifying access..." />;
  }

  // Error state (only if no cache exists)
  if (initError && !game) {
    return (
      <FullScreenError
        title="Unable to Load Game"
        message={initError}
        actionLabel="Back to Team Schedule"
        onAction={() => router.push(teamSeasonId ? `/teams/${teamSeasonId}` : "/dashboard")}
      />
    );
  }

  // Loading game data
  if (!game || players.length === 0) {
    return <FullScreenLoader message="Loading game data..." />;
  }

  // All checks passed - render children
  return <>{children}</>;
}
