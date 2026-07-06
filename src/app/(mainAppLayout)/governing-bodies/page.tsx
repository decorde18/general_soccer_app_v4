// app/(main)/governingBodies/page.tsx
import { EntityShell } from "@/components/entities/EntityShell";
import { governingBodyConfig } from "@/lib/entities/configs/governingBody.config";
import {
  createGoverningBody,
  updateGoverningBody,
  deleteGoverningBody,
} from "@/lib/actions/governingBody-actions";
import { getGoverningBodies } from "@/lib/data/queries";

export default async function GoverningBodiesPage() {
  const governingBodies = await getGoverningBodies();

  return (
    <div className='p-6 max-w-6xl mx-auto'>
      <EntityShell
        config={governingBodyConfig}
        data={governingBodies as any}
        onCreate={createGoverningBody as any}
        onUpdate={updateGoverningBody as any}
        onDelete={deleteGoverningBody as any}
      />
    </div>
  );
}
