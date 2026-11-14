"use client";

import { useEffect, useRef } from "react";
import { useSocket } from "./useSocket";

/**
 * Custom hook to listen to a socket event with automatic cleanup on unmount
 * @param {string} eventName The name of the socket event
 * @param {(data: any) => void} handler The callback to invoke when event is received
 */
export const useSocketEvent = (eventName, handler) => {
  const { socket } = useSocket();
  const handlerRef = useRef(handler);

  // Keep latest handler reference without causing unnecessary re-subscribing
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!socket || !eventName) return;

    const eventListener = (...args) => {
      if (typeof handlerRef.current === "function") {
        handlerRef.current(...args);
      }
    };

    socket.on(eventName, eventListener);

    return () => {
      socket.off(eventName, eventListener);
    };
  }, [socket, eventName]);
};

export default useSocketEvent;
