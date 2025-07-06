"use client";
import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import type { Socket as SocketIOClientSocket } from 'socket.io-client';

export const SocketContext: any = createContext<any>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<SocketIOClientSocket | null>(null);

  if (!socketRef.current) {
    // Use NEXT_PUBLIC_BACKEND_URL if set, otherwise connect to same origin
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    socketRef.current = backendUrl ? io(backendUrl) : io();
  }

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): any {
  return useContext(SocketContext);
} 