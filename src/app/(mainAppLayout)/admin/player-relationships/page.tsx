import React from "react";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import { EntityShell } from "@/components/entities/EntityShell";
import { playerRelationshipConfig } from "@/lib/entities/configs/playerRelationship.config";
import {
  createPlayerRelationship,
  updatePlayerRelationship,
  deletePlayerRelationship,
} from "@/lib/actions/playerRelationship-actions";
import { getPlayerRelationships, getAllPeople } from "@/lib/data/queries";
import { injectOptions } from "@/lib/utils/formHelpers";

export default async function PlayerRelationshipsPage() {
  await verifyAdmin();

  const [relationships, people] = await Promise.all([
    getPlayerRelationships(),
    getAllPeople(),
  ]);

  const peopleOptions = people.map((p) => ({
    label: `${p.name} ${p.email ? `(${p.email})` : ""}`,
    value: String(p.id),
  }));

  const stats = [
    { label: "Total Mappings", value: relationships.length },
    {
      label: "Parents",
      value: relationships.filter((r) => r.relationship === "Parent").length,
    },
    {
      label: "Guardians",
      value: relationships.filter((r) => r.relationship === "Guardian").length,
    },
  ];

  let config = { ...playerRelationshipConfig };
  config = injectOptions(config, "player_id", peopleOptions);
  config = injectOptions(config, "related_person_id", peopleOptions);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <EntityShell
        config={config}
        data={relationships as any}
        stats={stats}
        onCreate={createPlayerRelationship as any}
        onUpdate={updatePlayerRelationship as any}
        onDelete={deletePlayerRelationship as any}
      />
    </main>
  );
}
