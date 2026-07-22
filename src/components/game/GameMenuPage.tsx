"use client";

import { ChevronRight, Zap, Shield } from "lucide-react";
import Button from "../ui/Button";

import { useRouter, useParams } from "next/navigation";
import { useGameStageInfo } from "@/hooks/useGameStageInfo";
import useGameStore from "@/stores/gameStore";

import { FullScreenLoader } from "@/components/shared/FullScreenState";

import GameStatusCard from "@/components/game/GameStatusCard";
import MatchConfigCard from "@/components/game/MatchConfigCard";
import GameActionCard from "@/components/game/GameActionCard";


export default function GameMenuPage() {
  const router = useRouter();
  const { id, teamSeasonId } = useParams<{
    id: string;
    teamSeasonId: string;
  }>();
 
  const game = useGameStore((s) => s.game);
    const gameStage = useGameStore((s) => s.getGameStage());
    const GAME_STAGES = useGameStore((s) => s.GAME_STAGES);
    const currentPeriodLabel = useGameStore((s) => s.getCurrentPeriodLabel());

    const baseGamePath = `/gamestats/${teamSeasonId}/${id}`;

    const stageInfo = useGameStageInfo({
      gameStage,
      gameStages: GAME_STAGES,
      currentPeriodLabel,
      baseGamePath,
    });

  if (!game) {
    return <FullScreenLoader message='Loading game data...' />;
  }
  return (
    <div className='min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8'>
      <div className='mx-auto max-w-4xl'>
        {/* Top Header Section */}
        <div className='mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center'>
          <div>
            <Button variant='outline' onClick={() => router.push("/games")}>
              <ChevronRight className='h-4 w-4 rotate-180' />
              Back to Games
            </Button>
            <h1 className='text-3xl font-bold text-slate-900'>
              Match Dashboard
            </h1>
            <p className='text-slate-500'>Manage your game from here</p>
          </div>
          <div className='hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm md:flex'>
            <div
              className={`h-3 w-3 animate-pulse rounded-full ${stageInfo.statusColor}`}
            />
            <span className='font-semibold text-slate-700'>
              {stageInfo.title}
            </span>
          </div>
        </div>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* Left Column: Game Status + Config */}
          <div className='space-y-6 lg:col-span-1'>
            <GameStatusCard
              icon={stageInfo.icon}
              title={stageInfo.title}
              subtitle={stageInfo.subtitle}
              accentColor={stageInfo.accentColor}
                />
               <MatchConfigCard settings={game.settings} />

          </div>
          {/* Right Column: Actions Grid */}
          <div className='lg:col-span-2'>
            <h3 className='mb-4 flex items-center gap-2 text-lg font-bold text-slate-800'>
              <Zap className='h-5 w-5 text-amber-500' />
              Quick Actions
            </h3>
            <div className='grid grid-cols-2 gap-4'>

              {stageInfo.actions.map((action) => (
                 <GameActionCard
                  key={action.label}
                   action={action}
                   onSelect={(path) => router.push(path)}
                 />
              ))} 
            </div>
             {/* Additional Help / Context */}
            <div className='mt-8 flex gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4'>
           
              <div className='h-fit rounded-lg bg-blue-100 p-2 text-blue-600'>
                <Shield className='h-5 w-5' />
              </div>
              <div>
                <h4 className='text-sm font-bold text-blue-900'>Need Help?</h4>
                <p className='mt-1 text-xs leading-relaxed text-blue-700'>
                  Make sure your lineup is set before starting the game. You can
                  always adjust settings or fix clock issues in the &quot;Game
                  Management&quot; section.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
