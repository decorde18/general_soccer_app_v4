"use client";

import { EntityPage } from "@/components/entities/EntityPage";
import { leagueConfig } from "@/config/league.config";

export function LeagueClient({
  data,
  userRole,
  stats,
  onCreate,
  onUpdate,
  onDelete,
}: any) {
  return (
    <EntityPage
      config={leagueConfig}
      data={data}
      userRole={userRole}
      onCreate={onCreate}
      onUpdate={onUpdate}
      onDelete={onDelete}
      stats={stats}
    />
  );
}
