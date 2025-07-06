"use client";
import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import type { Socket as SocketIOClientSocket } from 'socket.io-client';

export const SocketContext: any = createContext<any>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<SocketIOClientSocket | null>(null);

  if (!socketRef.current) {
    socketRef.current = io('http://localhost:3001');
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