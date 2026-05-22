import { requireServerSession } from "@/lib/authHelpers";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardPage() {
  const session = await requireServerSession();

  return (
    <div className='min-h-screen flex items-start justify-center bg-slate-50 dark:bg-slate-900 p-8'>
      <div className='w-full max-w-3xl bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 p-8'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h1 className='text-2xl font-bold text-slate-900 dark:text-white'>
              Dashboard
            </h1>
            <p className='text-slate-500 dark:text-slate-400'>
              Welcome back
              {(session as any).user?.name
                ? `, ${(session as any).user.name}`
                : ""}
              .
            </p>
          </div>
          <div>
            <SignOutButton />
          </div>
        </div>

        <div className='space-y-4'>
          <div className='p-4 rounded-lg bg-surface border border-border'>
            Your roles:{" "}
            <pre className='mt-2 text-sm'>
              {JSON.stringify((session as any).user?.roles, null, 2)}
            </pre>
          </div>
          <div className='p-4 rounded-lg bg-surface border border-border'>
            This is a protected server-side page using{" "}
            <strong>requireServerSession()</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}
