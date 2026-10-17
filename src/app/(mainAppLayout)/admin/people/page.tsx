import { EntityShell } from "@/components/entities/EntityShell";
import { peopleConfig } from "@/lib/entities/configs/people.config";
import {
  getAdminPeople,
  createPerson,
  updatePerson,
  deletePerson,
} from "@/lib/actions/people-actions";

export default async function AdminPeoplePage() {
  const people = await getAdminPeople();

  const activeCount = people.filter((p) => p.isActive).length;
  const playersCount = people.filter((p) => p.teamCount > 0).length;
  const staffCount = people.filter(
    (p) => p.rolesList.includes("Coach") || p.rolesList.includes("admin") || p.rolesList.includes("director")
  ).length;

  const stats = [
    { label: "Total People", value: people.length },
    { label: "Active Profiles", value: activeCount },
    { label: "Rostered Players", value: playersCount },
    { label: "Coaches & Staff", value: staffCount },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <EntityShell
        config={peopleConfig}
        data={people as any}
        stats={stats}
        onCreate={createPerson as any}
        onUpdate={updatePerson as any}
        onDelete={deletePerson as any}
      />
    </div>
  );
}
