import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "../lib/config";
import * as storage from "../lib/auth-storage";
import { useAuth } from "./AuthContext";

const SocketContext = createContext<Socket | null>(null);
const SocketStatusContext = createContext<boolean>(false);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || null;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const intentionalCloseRef = useRef(false);

  const closeSocket = useCallback(() => {
    intentionalCloseRef.current = true;
    socketRef.current?.removeAllListeners();
    socketRef.current?.disconnect();
    socketRef.current = null;
    setSocket(null);
    setIsConnected(false);
  }, []);

  const connect = useCallback(async () => {
    if (!userId) return;

    const existing = socketRef.current;
    if (existing) {
      if (!existing.connected) {
        existing.connect();
      }
      return;
    }

    const token = await storage.getAccessToken();
    if (!token || !userId) return;

    intentionalCloseRef.current = false;
    const active = io(SOCKET_URL, {
      auth: { token: `Bearer ${token}` },
      autoConnect: false,
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      timeout: 20000,
    });

    active.on("connect", () => {
      console.log("[Socket] Connected");
      setIsConnected(true);
    });

    active.on("disconnect", (reason) => {
      setIsConnected(false);
      if (intentionalCloseRef.current || reason === "io client disconnect") return;

      console.log("[Socket] Disconnected:", reason);
      if (reason === "io server disconnect") {
        active.connect();
      }
    });

    active.on("connect_error", (error) => {
      console.log("[Socket] Connection Error:", error.message);
      setIsConnected(false);
    });

    socketRef.current = active;
    setSocket(active);
    active.connect();
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      closeSocket();
      return undefined;
    }

    connect();
    return closeSocket;
  }, [userId, connect, closeSocket]);

  useEffect(() => {
    if (!userId) return undefined;

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active" && !socketRef.current?.connected) {
        connect();
      }
    };

    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, [userId, connect]);

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
