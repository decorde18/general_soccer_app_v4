import { EntityShell } from "@/components/entities/EntityShell";
import { addressConfig } from "@/lib/entities/configs/addresses.config";
import { createAddress, updateAddress, deleteAddress } from "@/lib/actions/address-actions";
import { getAddresses } from "@/lib/data/queries";

export default async function AddresssPage() {
  const addresses = await getAddresses();


  const stats: { label: string; value: number | string }[] = [];


  let config = { ...addressConfig };


  return (
    <div className='p-6 max-w-6xl mx-auto'>
      <EntityShell
        config={config}
        data={addresses as any}
        stats={stats}
        onCreate={createAddress as any}
        onUpdate={updateAddress as any}
        onDelete={deleteAddress as any}
      />
    </div>
  );
}
