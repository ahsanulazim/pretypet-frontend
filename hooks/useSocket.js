"use client";

import { useContext } from "react";
import { SocketContext } from "@/context/SocketContext";

/**
 * Custom hook to access socket state and helper methods
 * @returns {{
 *   socket: import("socket.io-client").Socket | null,
 *   isConnected: boolean,
 *   socketId: string | null,
 *   connectionError: string | null,
 *   emit: (event: string, data?: any, callback?: Function) => void,
 *   joinRoom: (room: string, callback?: Function) => void,
 *   leaveRoom: (room: string, callback?: Function) => void,
 *   trackOrder: (orderId: string, callback?: Function) => void,
 *   untrackOrder: (orderId: string, callback?: Function) => void
 * }}
 */
export const useSocket = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }

  return context;
};

export default useSocket;
