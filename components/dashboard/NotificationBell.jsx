"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LuBell,
  LuCheckCheck,
  LuTrash2,
  LuPackage,
  LuSparkles,
  LuDollarSign,
  LuClock,
  LuExternalLink,
  LuRadio,
} from "react-icons/lu";
import { useNotifications } from "@/hooks/useNotifications";
import { useSocket } from "@/hooks/useSocket";

/**
 * Format relative timestamp
 */
const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "Just now";
  const date = new Date(dateStr);
  const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

/**
 * Icon resolver based on notification type
 */
const getNotificationIcon = (type) => {
  switch (type) {
    case "order":
      return <LuPackage className="size-4 text-blue-500" />;
    case "payment":
      return <LuDollarSign className="size-4 text-emerald-500" />;
    case "inventory":
      return <LuClock className="size-4 text-amber-500" />;
    default:
      return <LuSparkles className="size-4 text-primary" />;
  }
};

export const NotificationBell = ({ recipient = "admin" }) => {
  const router = useRouter();
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "unread"

  const { isConnected } = useSocket();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    clearTests,
    sendTestNotification,
  } = useNotifications(recipient);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") return !notif.isRead;
    return true;
  });

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markAsRead(notif._id);
    }
    if (notif.link) {
      setIsOpen(false);
      router.push(notif.link);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="btn btn-ghost btn-circle relative"
        aria-label="Open notifications"
      >
        <LuBell
          className={`size-5 transition-transform ${unreadCount > 0 ? "animate-wiggle" : ""}`}
        />
        {unreadCount > 0 && (
          <span className="badge badge-error badge-xs absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-base-100 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-base-100 border border-base-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col text-base-content animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-base-200 flex items-center justify-between bg-base-200/40">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base">Notifications</h3>
              {unreadCount > 0 && (
                <span className="badge badge-primary badge-sm text-xs font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              {/* Real-time status indicator */}
              <div
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-base-200/80 text-[11px]"
                title={
                  isConnected ? "Real-time updates active" : "Disconnected"
                }
              >
                <span
                  className={`size-2 rounded-full ${
                    isConnected
                      ? "bg-emerald-500 animate-ping"
                      : "bg-neutral-400"
                  }`}
                />
                <span className="font-medium text-base-content/70">
                  {isConnected ? "Live" : "Offline"}
                </span>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="btn btn-ghost btn-xs text-primary hover:bg-primary/10 flex items-center gap-1 p-1 rounded-lg"
                  title="Mark all as read"
                >
                  <LuCheckCheck className="size-3.5" />
                  <span className="hidden sm:inline">Mark all</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-base-200 px-3 bg-base-100 text-xs font-medium">
            <button
              onClick={() => setFilter("all")}
              className={`py-2 px-3 border-b-2 transition-colors ${
                filter === "all"
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-base-content/60 hover:text-base-content"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`py-2 px-3 border-b-2 transition-colors ${
                filter === "unread"
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-base-content/60 hover:text-base-content"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications Scroll List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-base-200">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-base-content/60">
                <span className="loading loading-spinner loading-md text-primary"></span>
                <p className="mt-2 text-xs">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="size-12 rounded-full bg-base-200/80 flex items-center justify-center mb-2 text-base-content/40">
                  <LuCheckCheck className="size-6 text-primary/70" />
                </div>
                <p className="font-semibold text-sm">All caught up!</p>
                <p className="text-xs text-base-content/60 mt-1">
                  {filter === "unread"
                    ? "No unread notifications right now."
                    : "You have no notifications yet."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group ${
                    notif.isRead
                      ? "bg-base-100 hover:bg-base-200/50"
                      : "bg-primary/5 hover:bg-primary/10"
                  }`}
                >
                  {/* Type Icon Badge */}
                  <div className="size-8 rounded-xl bg-base-200/90 shrink-0 flex items-center justify-center shadow-xs mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs truncate ${
                          notif.isRead
                            ? "font-medium text-base-content/90"
                            : "font-bold text-base-content"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-base-content/50 shrink-0">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-base-content/70 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.link && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1 font-medium">
                        View details <LuExternalLink className="size-2.5" />
                      </span>
                    )}
                  </div>

                  {/* Actions on hover or touch */}
                  <div className="flex flex-col items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif._id);
                      }}
                      className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"
                      title="Delete notification"
                    >
                      <LuTrash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-base-200 bg-base-200/40 flex items-center justify-between text-xs gap-2">
            <button
              onClick={() => sendTestNotification()}
              className="btn btn-ghost btn-xs text-primary font-normal hover:bg-primary/10 flex items-center gap-1"
              title="Send a sample notification to test real-time alerts"
            >
              <LuRadio className="size-3" /> Test Alert
            </button>

            <div className="flex items-center gap-1">
              {notifications.some(
                (n) =>
                  n.metadata?.isTest ||
                  n.title?.toLowerCase().includes("test") ||
                  n.message?.toLowerCase().includes("test"),
              ) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearTests();
                  }}
                  className="btn btn-ghost btn-xs text-amber-600 hover:bg-amber-500/10 font-normal"
                  title="Clear only test notifications"
                >
                  Clear tests
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearAll();
                  }}
                  className="btn btn-ghost btn-xs text-base-content/60 hover:text-error hover:bg-error/10 font-normal"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
