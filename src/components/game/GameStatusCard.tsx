"use client";

import type { ReactNode } from "react";
import GameHeader from "@/components/layout/gameLayout/GameHeader";


interface GameStatusCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  accentColor: string;

}

export default function GameStatusCard({
  icon,
  title,
  subtitle,
  accentColor
}: GameStatusCardProps) {

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-lg ${accentColor}`}
    >
      <div className='absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl' />
      <div className='absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-black/10 blur-2xl' />

      <div className='relative z-10 flex flex-col items-center text-center'>
        <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/20 shadow-inner backdrop-blur-md'>
          {icon}
        </div>

        <h2 className='mb-1 text-2xl font-bold'>{title}</h2>
        <p className='mb-6 font-medium text-white/80'>{subtitle}</p>

        <div className='w-full'>
          <GameHeader className="!border-white/20 !bg-white/10 !p-3 !shadow-none !backdrop-blur-md"/>
        </div>
      </div>
    </div>
  );
}
