"use server";

import {
  getComprehensivePlayerStats,
  getComprehensiveTeamStats,
  type StatsFilterOptions,
} from "@/lib/data/queries";

export async function fetchPlayerStatsAction(options: StatsFilterOptions) {
  try {
    return await getComprehensivePlayerStats(options);
  } catch (err: any) {
    console.error("Failed to fetch player stats:", err);
    return [];
  }
}

export async function fetchTeamStatsAction(options: StatsFilterOptions) {
  try {
    return await getComprehensiveTeamStats(options);
  } catch (err: any) {
    console.error("Failed to fetch team stats:", err);
    return [];
  }
}
