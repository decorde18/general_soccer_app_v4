import React from "react";
import { requireSession } from "@/lib/auth/auth-utils";
import {
  getParentChildren,
  getDashboardTeamSeasons,
  getPlayerTeamSeasons,
  getPlayerStatsByPerson,
} from "@/lib/data/queries";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  // 1. Authenticate & load the session
  const session = await requireSession();
  const user = session.user as any;
  const personId = Number(user.personId ?? user.id);

  // 2. Fetch data in parallel based on active role flags
  let playerTeams: any[] = [];
  let playerStats: any[] = [];
  let childrenList: any[] = [];
  let coachTeams: any[] = [];

  const promises: Promise<any>[] = [];

  // Player role data
  if (user.roles.player) {
    promises.push(
      getPlayerTeamSeasons(personId).then((res) => {
        playerTeams = res;
      })
    );
    promises.push(
      getPlayerStatsByPerson(personId).then((res) => {
        playerStats = res;
      })
    );
  }

  // Parent role data
  if (user.roles.parent) {
    promises.push(
      getParentChildren(personId).then(async (children) => {
        childrenList = await Promise.all(
          children.map(async (child) => {
            const stats = await getPlayerStatsByPerson(child.personId);
            return { ...child, stats };
          })
        );
      })
    );
  }

  // Coach or Team Admin role data
  if (user.roles.coach || user.roles.teamAdmin) {
    // Merge access lists
    const teamIds = Array.from(
      new Set([...(user.roles.coachTeamIds || []), ...(user.roles.teamAdminTeamIds || [])])
    );
    if (teamIds.length > 0) {
      promises.push(
        getDashboardTeamSeasons(teamIds).then((res) => {
          coachTeams = res;
        })
      );
    }
  }

  // Execute all relevant queries in parallel
  await Promise.all(promises);

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <DashboardClient
        user={{
          name: user.name ?? "User",
          email: user.email ?? "",
          roles: user.roles,
        }}
        playerTeams={playerTeams}
        playerStats={playerStats}
        childrenList={childrenList}
        coachTeams={coachTeams}
      />
    </main>
  );
}
