import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '../config/api';
import { getAccessToken } from '../lib/auth-storage';

const SocketContext = createContext(null);
const SocketStatusContext = createContext(false);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  const connect = useCallback(async () => {
    if (!user || socketRef.current?.connected) {
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      return;
    }

    const activeSocket = io(SOCKET_URL, {
      auth: { token: `Bearer ${token}` },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    activeSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setIsConnected(false);
    });

    activeSocket.on('connect', () => setIsConnected(true));
    activeSocket.on('disconnect', () => setIsConnected(false));

    socketRef.current = activeSocket;
    setSocket(activeSocket);
  }, [user]);

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
      const token = await getAccessToken();
      if (!token || cancelled) {
        return;
      }

      const activeSocket = io(SOCKET_URL, {
        auth: { token: `Bearer ${token}` },
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000,
      });

      if (cancelled) {
        activeSocket.close();
        return;
      }

      activeSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        setIsConnected(false);
      });

      activeSocket.on('connect', () => setIsConnected(true));
      activeSocket.on('disconnect', () => setIsConnected(false));

      socketRef.current = activeSocket;
      setSocket(activeSocket);
    })();

    return () => {
      cancelled = true;
      socketRef.current?.close();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const reconnectIfNeeded = () => {
      if (!socketRef.current?.connected) {
        void connect();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        reconnectIfNeeded();
      }
    };

    window.addEventListener('focus', reconnectIfNeeded);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', reconnectIfNeeded);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connect, user]);

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
