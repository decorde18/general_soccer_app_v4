import { EntityShell } from "@/components/entities/EntityShell";
import { userConfig } from "@/lib/entities/configs/user.config";
import { createUser, updateUser, deleteUser } from "@/lib/actions/user-actions";
import { getUsers } from "@/lib/data/queries";

export default async function UsersPage() {
  const users = await getUsers();

  const stats = [
    { label: "Total Users", value: users.length },
    {
      label: "System Admins",
      value: users.filter((u) => u.systemAdmin).length,
    },
    {
      label: "Standard Users",
      value: users.filter((u) => !u.systemAdmin).length,
    },
  ];

  return (
    <div className='p-6 max-w-6xl mx-auto'>
      <EntityShell
        config={userConfig}
        data={users as any}
        stats={stats}
        onCreate={createUser as any}
        onUpdate={updateUser as any}
        onDelete={deleteUser as any}
      />
    </div>
  );
}
