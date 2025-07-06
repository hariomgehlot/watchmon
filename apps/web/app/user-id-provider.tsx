"use client";
import { createContext, useEffect, useState } from 'react';

export const UserIdContext = createContext<string | null>(null);

function generateUserId() {
  return 'u-' + Math.random().toString(36).slice(2, 10);
}

export function UserIdProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem('userId');
    if (!id) {
      id = generateUserId();
      localStorage.setItem('userId', id);
    }
    setUserId(id);
  }, []);

  return (
    <UserIdContext.Provider value={userId}>{children}</UserIdContext.Provider>
  );
} 