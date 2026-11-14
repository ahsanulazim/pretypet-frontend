import { io } from "socket.io-client";

/**
 * Resolves the Socket.IO server URL based on environment variables.
 * Falls back to stripping /api/v1 from NEXT_PUBLIC_SERVER_URL, or http://localhost:5000.
 */
export const getSocketServerUrl = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }

  if (process.env.NEXT_PUBLIC_SERVER_URL) {
    return process.env.NEXT_PUBLIC_SERVER_URL.replace(/\/api\/v1\/?$/, "");
  }

  return "http://localhost:5000";
};

let socketInstance = null;

/**
 * Creates or retrieves the singleton Socket.IO client instance.
 * @param {object} options Additional Socket.IO options
 * @returns {import("socket.io-client").Socket | null}
 */
export const getSocket = (options = {}) => {
  if (typeof window === "undefined") {
    return null; // Return null on server-side rendering
  }

  if (!socketInstance) {
    const socketUrl = getSocketServerUrl();

    socketInstance = io(socketUrl, {
      autoConnect: false, // Controlled by SocketContext or manual connect
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      ...options,
    });
  }

  return socketInstance;
};

/**
 * Helper to update socket authentication token and reconnect if needed.
 * @param {string | null} token Firebase JWT ID Token
 */
export const setSocketAuthToken = (token) => {
  const socket = getSocket();
  if (!socket) return;

  socket.auth = token ? { token } : {};

  // If already connected, disconnect and reconnect to re-run handshake with new auth
  if (socket.connected) {
    socket.disconnect().connect();
  }
};
