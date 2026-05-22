"use client";

import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function useRequireAuth(options?: {
  redirectTo?: string;
  requireRole?: (roles: any) => boolean;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const redirectTo = options?.redirectTo ?? "/login";

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      // Initiate sign-in flow (client)
      signIn(undefined, { callbackUrl: redirectTo });
      return;
    }

    if (
      options?.requireRole &&
      !options.requireRole((session as any).user?.roles)
    ) {
      router.push(redirectTo);
    }
  }, [session, status, router]);

  return { session, status } as const;
}
