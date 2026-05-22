// src/components/SessionProvider.tsx
"use client";

import { createContext, useContext, ReactNode } from "react";

type SessionProviderProps = {
  session: unknown;
  children: ReactNode;
};

const SessionContext = createContext<unknown | null>(null);

export function SessionProvider({ session, children }: SessionProviderProps) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  return useContext(SessionContext);
}
