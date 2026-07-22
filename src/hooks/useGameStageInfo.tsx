"use client";

import { useMemo } from "react";
import {
  Play,
  Settings,
  BarChart2,
  Users,
  Calendar,
  Zap,
  ClipboardList,
  PauseCircle,
  StopCircle,
  RotateCcw,
  Activity,
  Shield,
} from "lucide-react";
import type { StageInfo } from "@/types/game";

interface UseGameStageInfoParams {
  /** Current stage value returned by gameStore.getGameStage() */
  gameStage: string;
  /** The GAME_STAGES map/enum from gameStore, e.g. { BEFORE_START: "...", ... } */
  gameStages: Record<string, string>;
  currentPeriodLabel: string;
  baseGamePath: string;
}

/**
 * Mirrors the getStageInfo()/getGamePath() logic from the original
 * GameMenuPage.jsx, just pulled out of the component so GameMenuPage
 * only has to deal with layout.
 */
export function useGameStageInfo({
  gameStage,
  gameStages,
  currentPeriodLabel,
  baseGamePath,
}: UseGameStageInfoParams): StageInfo {
  return useMemo(() => {
    const getGamePath = () => {
      switch (gameStage) {
        case gameStages.BEFORE_START:
          return baseGamePath;
        case gameStages.DURING_PERIOD:
        case gameStages.IN_STOPPAGE:
          return `${baseGamePath}/live`;
        case gameStages.BETWEEN_PERIODS:
          return `${baseGamePath}/period-break`;
        case gameStages.END_GAME:
          return `${baseGamePath}/summary`;
        default:
          return baseGamePath;
      }
    };

    switch (gameStage) {
      case gameStages.BEFORE_START:
        return {
          title: "Pre-Game",
          subtitle: "Get ready for the match",
          statusColor: "bg-amber-500",
          accentColor: "from-amber-500 to-orange-600",
          icon: <Calendar className="h-8 w-8 text-white" />,
          actions: [
            {
              label: "Start Game",
              subLabel: "Begin the match clock",
              path: `${baseGamePath}/live`,
              icon: <Play className="h-6 w-6" />,
              variant: "primary",
              span: "col-span-2",
            },
            {
              label: "Edit Lineup",
              subLabel: "Set starting players",
              path: `${baseGamePath}/lineup`,
              icon: <Users className="h-6 w-6" />,
              variant: "secondary",
            },
            {
              label: "Settings",
              subLabel: "Configure rules",
              path: `${baseGamePath}/settings`,
              icon: <Settings className="h-6 w-6" />,
              variant: "secondary",
            },
          ],
        };

      case gameStages.DURING_PERIOD:
        return {
          title: currentPeriodLabel,
          subtitle: "Match in progress",
          statusColor: "bg-emerald-500",
          accentColor: "from-emerald-500 to-teal-600",
          icon: <Zap className="h-8 w-8 text-white" />,
          actions: [
            {
              label: "Go to Live Game",
              subLabel: "Track stats & events",
              path: getGamePath(),
              icon: <Activity className="h-6 w-6" />,
              variant: "primary",
              span: "col-span-2",
            },
            {
              label: "Live Stats",
              subLabel: "View real-time data",
              path: `${baseGamePath}/stats`,
              icon: <BarChart2 className="h-6 w-6" />,
              variant: "secondary",
            },
            {
              label: "Management",
              subLabel: "Refs, clock & more",
              path: `${baseGamePath}/manage`,
              icon: <ClipboardList className="h-6 w-6" />,
              variant: "secondary",
            },
          ],
        };

      case gameStages.BETWEEN_PERIODS:
        return {
          title: "Period Break",
          subtitle: "Halftime / Intermission",
          statusColor: "bg-blue-500",
          accentColor: "from-blue-500 to-indigo-600",
          icon: <PauseCircle className="h-8 w-8 text-white" />,
          actions: [
            {
              label: "Start Next Period",
              subLabel: "Resume the action",
              path: `${baseGamePath}/live`,
              icon: <Play className="h-6 w-6" />,
              variant: "primary",
              span: "col-span-2",
            },
            {
              label: "Period Stats",
              subLabel: "Review performance",
              path: `${baseGamePath}/stats`,
              icon: <BarChart2 className="h-6 w-6" />,
              variant: "secondary",
            },
            {
              label: "Adjust Lineup",
              subLabel: "Make substitutions",
              path: `${baseGamePath}/lineup`,
              icon: <Users className="h-6 w-6" />,
              variant: "secondary",
            },
          ],
        };

      case gameStages.IN_STOPPAGE:
        return {
          title: "Stoppage",
          subtitle: "Game paused",
          statusColor: "bg-rose-500",
          accentColor: "from-rose-500 to-red-600",
          icon: <StopCircle className="h-8 w-8 text-white" />,
          actions: [
            {
              label: "Resume Game",
              subLabel: "Back to action",
              path: getGamePath(),
              icon: <Play className="h-6 w-6" />,
              variant: "primary",
              span: "col-span-2",
            },
            {
              label: "Management",
              subLabel: "Fix clock/score",
              path: `${baseGamePath}/manage`,
              icon: <ClipboardList className="h-6 w-6" />,
              variant: "secondary",
            },
            {
              label: "Settings",
              subLabel: "Game options",
              path: `${baseGamePath}/settings`,
              icon: <Settings className="h-6 w-6" />,
              variant: "secondary",
            },
          ],
        };

      case gameStages.END_GAME:
        return {
          title: "Game Over",
          subtitle: "Final Score",
          statusColor: "bg-slate-700",
          accentColor: "from-slate-700 to-slate-900",
          icon: <Shield className="h-8 w-8 text-white" />,
          actions: [
            {
              label: "Game Summary",
              subLabel: "View full report",
              path: `${baseGamePath}/summary`,
              icon: <BarChart2 className="h-6 w-6" />,
              variant: "primary",
              span: "col-span-2",
            },
            {
              label: "Management",
              subLabel: "Edit final details",
              path: `${baseGamePath}/manage`,
              icon: <ClipboardList className="h-6 w-6" />,
              variant: "secondary",
            },
            {
              label: "Restart/Reset",
              subLabel: "Re-open game",
              // Same path as "Management" in the original — kept as-is,
              // flagging in case this was meant to go somewhere else.
              path: `${baseGamePath}/manage`,
              icon: <RotateCcw className="h-6 w-6" />,
              variant: "outline",
            },
          ],
        };

      default:
        return {
          title: "Game Menu",
          subtitle: "Select an option",
          statusColor: "bg-gray-500",
          accentColor: "from-gray-500 to-gray-700",
          icon: <Activity className="h-8 w-8 text-white" />,
          actions: [],
        };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStage, gameStages, currentPeriodLabel, baseGamePath]);
}
