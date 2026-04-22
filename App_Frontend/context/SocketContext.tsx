import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "../lib/config";
import * as storage from "../lib/auth-storage";
import { useAuth } from "./AuthContext";

const SocketContext = createContext<Socket | null>(null);
const SocketStatusContext = createContext<boolean>(false);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      socketRef.current?.close();
      socketRef.current = null;
      setSocket(null);
      return undefined;
    }

    let active: Socket | null = null;
    let cancelled = false;
    (async () => {
      const token = await storage.getAccessToken();
      if (!token) return;
      active = io(SOCKET_URL, {
        auth: { token: `Bearer ${token}` },
        transports: ["websocket"],
      });
      if (cancelled) {
        active.close();
        return;
      }
      active.on("connect_error", () => setIsConnected(false));
      active.on("connect", () => setIsConnected(true));
      active.on("disconnect", () => setIsConnected(false));
      socketRef.current = active;
      setSocket(active);
    })();

    return () => {
      cancelled = true;
      active?.close();
      if (socketRef.current === active) {
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      <SocketStatusContext.Provider value={isConnected}>
        {children}
      </SocketStatusContext.Provider>
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

export function useSocketStatus() {
  return useContext(SocketStatusContext);
}
