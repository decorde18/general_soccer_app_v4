import ClubsStaffClient from "@/components/admin/ClubsStaffClient";
import {
  getClubs,
  getPeople,
  getTeamSeasons,
  getClubStaffRecords,
  getTeamStaffRecords,
} from "@/lib/data/queries";

export default async function AdminClubStaffPage() {
  const [clubs, people, teamSeasons, clubStaffRecords, teamStaffRecords] =
    await Promise.all([
      getClubs(),
      getPeople(),
      getTeamSeasons(),
      getClubStaffRecords(),
      getTeamStaffRecords(),
    ]);

  // Format selections to { label, value } for dropdown options
  const clubsData = clubs.map((c) => ({
    label: c.name,
    value: String(c.id),
  }));

  const peopleData = people.map((p) => ({
    label: p.displayName,
    value: String(p.id),
  }));

  const teamSeasonsData = teamSeasons.map((ts) => ({
    label: `${ts.teamName} (${ts.seasonName})`,
    value: String(ts.id),
  }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ClubsStaffClient
        clubsData={clubsData}
        peopleData={peopleData}
        teamSeasonsData={teamSeasonsData}
        clubStaffRecords={clubStaffRecords}
        teamStaffRecords={teamStaffRecords}
      />
    </div>
  );
}
