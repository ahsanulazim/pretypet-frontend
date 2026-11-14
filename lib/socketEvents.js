/**
 * Centralized Socket Event Constants for Frontend
 * Keeps client event names 100% in sync with backend.
 */
export const SOCKET_EVENTS = {
  // Connection lifecycle
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  CONNECT_ERROR: "connect_error",

  // Room management
  JOIN_ROOM: "room:join",
  LEAVE_ROOM: "room:leave",
  ROOM_JOINED: "room:joined",
  ROOM_LEFT: "room:left",

  // Notifications
  NOTIFICATION_NEW: "notification:new",
  NOTIFICATION_BROADCAST: "notification:broadcast",

  // Orders
  ORDER_CREATED: "order:created",
  ORDER_STATUS_UPDATED: "order:status_updated",
  ORDER_TRACK: "order:track",
  ORDER_UNTRACK: "order:untrack",

  // General Ping / Pong
  PING: "app:ping",
  PONG: "app:pong",
};
