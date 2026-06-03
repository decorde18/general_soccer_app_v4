import { EntityShell } from "@/components/entities/EntityShell";
import { addressConfig } from "@/lib/entities/configs/addresses.config";
import { createAddress, updateAddress, deleteAddress } from "@/lib/actions/address-actions";
import { getAddresses } from "@/lib/data/queries";

export default async function AddresssPage() {
  const addresses = await getAddresses();


  let stats = []


  let config = { ...addressConfig };


  return (
    <div className='p-6 max-w-6xl mx-auto'>
      <EntityShell
        config={config}
        data={addresses}
        stats={stats}
        onCreate={createAddress}
        onUpdate={updateAddress}
        onDelete={deleteAddress}
      />
    </div>
  );
}
