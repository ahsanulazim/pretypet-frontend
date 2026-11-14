"use client";

import { createContext, useEffect, useState, useCallback, useMemo } from "react";
import { getSocket, setSocketAuthToken } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import { auth } from "@/firebase/firebase.config";
import { onAuthStateChanged } from "firebase/auth";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket] = useState(() => (typeof window !== "undefined" ? getSocket() : null));
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      setIsConnected(true);
      setSocketId(socket.id);
      setConnectionError(null);
      console.log(`[Socket] Connected: ${socket.id}`);
    };

    const onDisconnect = (reason) => {
      setIsConnected(false);
      setSocketId(null);
      console.log(`[Socket] Disconnected: ${reason}`);
    };

    const onConnectError = (err) => {
      setConnectionError(err.message);
      console.warn(`[Socket] Connection error:`, err.message);
    };

    socket.on(SOCKET_EVENTS.CONNECT, onConnect);
    socket.on(SOCKET_EVENTS.DISCONNECT, onDisconnect);
    socket.on(SOCKET_EVENTS.CONNECT_ERROR, onConnectError);

    // Sync authentication token from Firebase
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          setSocketAuthToken(token);
        } catch (error) {
          console.error("[Socket] Failed to retrieve user ID token:", error);
          setSocketAuthToken(null);
        }
      } else {
        setSocketAuthToken(null);
      }

      // If not yet connected, connect now
      if (!socket.connected) {
        socket.connect();
      }
    });

    return () => {
      unsubscribeAuth();
      socket.off(SOCKET_EVENTS.CONNECT, onConnect);
      socket.off(SOCKET_EVENTS.DISCONNECT, onDisconnect);
      socket.off(SOCKET_EVENTS.CONNECT_ERROR, onConnectError);
    };
  }, [socket]);

  // Modular helper methods
  const emit = useCallback((event, data, callback) => {
    const instance = getSocket();
    if (instance && instance.connected) {
      instance.emit(event, data, callback);
    } else {
      console.warn(`[Socket] Cannot emit '${event}': socket is not connected.`);
    }
  }, []);

  const joinRoom = useCallback((room, callback) => {
    emit(SOCKET_EVENTS.JOIN_ROOM, room, callback);
  }, [emit]);

  const leaveRoom = useCallback((room, callback) => {
    emit(SOCKET_EVENTS.LEAVE_ROOM, room, callback);
  }, [emit]);

  const trackOrder = useCallback((orderId, callback) => {
    emit(SOCKET_EVENTS.ORDER_TRACK, orderId, callback);
  }, [emit]);

  const untrackOrder = useCallback((orderId, callback) => {
    emit(SOCKET_EVENTS.ORDER_UNTRACK, orderId, callback);
  }, [emit]);

  const value = useMemo(
    () => ({
      socket,
      isConnected,
      socketId,
      connectionError,
      emit,
      joinRoom,
      leaveRoom,
      trackOrder,
      untrackOrder,
    }),
    [socket, isConnected, socketId, connectionError, emit, joinRoom, leaveRoom, trackOrder, untrackOrder]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
