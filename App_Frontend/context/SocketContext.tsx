import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
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

  // ── Core connect function (reused by initial mount + AppState resume) ────────
  const connect = async () => {
    if (!user) return;
    // Don't create a duplicate if already connected
    if (socketRef.current?.connected) return;

    // Close any stale/disconnected socket before creating a new one
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    const token = await storage.getAccessToken();
    if (!token) return;

    const active = io(SOCKET_URL, {
      auth: { token: `Bearer ${token}` },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    active.on("connect_error", () => setIsConnected(false));
    active.on("connect", () => setIsConnected(true));
    active.on("disconnect", () => setIsConnected(false));

    socketRef.current = active;
    setSocket(active);
  };

  // ── Build/teardown socket when user changes ──────────────────────────────────
  useEffect(() => {
    if (!user) {
      socketRef.current?.close();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      const token = await storage.getAccessToken();
      if (!token || cancelled) return;

      const active = io(SOCKET_URL, {
        auth: { token: `Bearer ${token}` },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
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
      socketRef.current?.close();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [user]);

  // ── Fix B5: Reconnect when app returns to foreground ────────────────────────
  useEffect(() => {
    if (!user) return undefined;

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        // Re-attach if the socket dropped while in background
        if (!socketRef.current?.connected) {
          connect();
        }
      } else if (nextState === "background" || nextState === "inactive") {
        // Optionally disconnect to save battery; socket will reconnect on resume
        // We leave it connected so real-time messages still come through briefly,
        // but reconnect logic above handles the case where it silently dies.
      }
    };

    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
