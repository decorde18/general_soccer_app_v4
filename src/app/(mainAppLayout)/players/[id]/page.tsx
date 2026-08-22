import React from "react";
import { getPlayerProfile } from "@/lib/data/queries";
import PlayerProfileClient from "@/components/player/PlayerProfileClient";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerProfilePage({ params }: PageProps) {
  const { id } = await params;
  const personId = Number(id);

  if (isNaN(personId)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card variant="outlined" padding="lg" className="text-center bg-slate-900/40">
          <ShieldAlert size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Invalid Player ID</h2>
          <p className="text-sm text-slate-400 mb-6">
            The player identifier provided is invalid. Please return home or check the URL.
          </p>
          <Link href="/">
            <Button variant="primary" className="inline-flex items-center gap-2 text-sm">
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const playerData = await getPlayerProfile(personId);

  if (!playerData) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card variant="outlined" padding="lg" className="text-center bg-slate-900/40">
          <ShieldAlert size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Player Not Found</h2>
          <p className="text-sm text-slate-400 mb-6">
            We couldn't find a player record matching ID #{personId}.
          </p>
          <Link href="/">
            <Button variant="primary" className="inline-flex items-center gap-2 text-sm">
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <PlayerProfileClient playerData={playerData} />
    </main>
  );
}
