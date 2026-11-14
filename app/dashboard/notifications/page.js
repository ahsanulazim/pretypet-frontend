"use client";

import { useState } from "react";
import Link from "next/link";
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
  LuFilter,
  LuSearch,
  LuSend,
  LuCheck,
} from "react-icons/lu";
import { useNotifications } from "@/hooks/useNotifications";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "react-toastify";

export default function NotificationsPage() {
  const [filter, setFilter] = useState("all"); // "all" | "unread" | "order" | "system"
  const [search, setSearch] = useState("");
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    message: "",
    type: "system",
    recipient: "all",
    link: "",
  });

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
  } = useNotifications("admin");

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "unread" && item.isRead) return false;
    if (filter === "order" && item.type !== "order") return false;
    if (filter === "system" && item.type !== "system") return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchMsg = item.message?.toLowerCase().includes(q);
      return matchTitle || matchMsg;
    }
    return true;
  });

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.message) {
      toast.error("Please fill in both title and message");
      return;
    }

    try {
      await sendTestNotification({
        title: broadcastForm.title,
        message: broadcastForm.message,
        type: broadcastForm.type,
        recipient: broadcastForm.recipient,
        link: broadcastForm.link || null,
      });
      toast.success("Broadcast dispatched in real-time!");
      setShowBroadcastModal(false);
      setBroadcastForm({
        title: "",
        message: "",
        type: "system",
        recipient: "all",
        link: "",
      });
    } catch {
      toast.error("Failed to send broadcast");
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "order":
        return <LuPackage className="size-5 text-blue-500" />;
      case "payment":
        return <LuDollarSign className="size-5 text-emerald-500" />;
      case "inventory":
        return <LuClock className="size-5 text-amber-500" />;
      default:
        return <LuSparkles className="size-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-base-100 rounded-3xl p-6 sm:p-8 shadow-xs border border-base-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <LuBell className="size-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
                  Notifications Center
                  {unreadCount > 0 && (
                    <span className="badge badge-primary badge-sm">
                      {unreadCount} unread
                    </span>
                  )}
                </h1>
                <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
                  Real-time activity feed, order alerts, and system broadcasts
                </p>
              </div>
            </div>
          </div>

          {/* Right Status & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-base-200 text-xs">
              <span
                className={`size-2.5 rounded-full ${
                  isConnected ? "bg-emerald-500 animate-ping" : "bg-neutral-400"
                }`}
              />
              <span className="font-semibold text-base-content/70">
                {isConnected ? "Socket Connected" : "Connecting..."}
              </span>
            </div>

            <button
              onClick={() => setShowBroadcastModal(true)}
              className="btn btn-primary btn-sm rounded-xl gap-1.5"
            >
              <LuSend className="size-3.5" /> Broadcast Alert
            </button>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="btn btn-outline btn-sm rounded-xl gap-1.5"
              >
                <LuCheckCheck className="size-3.5" /> Mark All Read
              </button>
            )}

            {notifications.some(
              (n) =>
                n.metadata?.isTest ||
                n.title?.toLowerCase().includes("test") ||
                n.message?.toLowerCase().includes("test")
            ) && (
              <button
                type="button"
                onClick={() => clearTests()}
                className="btn btn-outline btn-warning btn-sm rounded-xl gap-1.5"
                title="Remove all sample and test alerts"
              >
                <LuTrash2 className="size-3.5" /> Clear Test Alerts
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={() => clearAll()}
                className="btn btn-ghost btn-sm text-error rounded-xl hover:bg-error/10"
              >
                <LuTrash2 className="size-3.5" /> Clear All
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-base-200">
          <div className="bg-base-200/50 rounded-2xl p-4">
            <span className="text-xs text-base-content/60 block font-medium">Total</span>
            <span className="text-2xl font-bold text-base-content mt-1 block">
              {notifications.length}
            </span>
          </div>
          <div className="bg-primary/10 rounded-2xl p-4">
            <span className="text-xs text-primary font-medium block">Unread</span>
            <span className="text-2xl font-bold text-primary mt-1 block">
              {unreadCount}
            </span>
          </div>
          <div className="bg-blue-500/10 rounded-2xl p-4">
            <span className="text-xs text-blue-600 font-medium block">Order Events</span>
            <span className="text-2xl font-bold text-blue-600 mt-1 block">
              {notifications.filter((n) => n.type === "order").length}
            </span>
          </div>
          <div className="bg-emerald-500/10 rounded-2xl p-4">
            <span className="text-xs text-emerald-600 font-medium block">System Alerts</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">
              {notifications.filter((n) => n.type === "system").length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-base-100 rounded-2xl p-4 shadow-xs border border-base-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: "all", label: "All" },
            { id: "unread", label: "Unread" },
            { id: "order", label: "Orders" },
            { id: "system", label: "System" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`btn btn-sm rounded-xl transition-all ${
                filter === tab.id
                  ? "btn-primary font-bold shadow-xs"
                  : "btn-ghost text-base-content/70 hover:bg-base-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-sm input-bordered w-full pl-9 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-base-100 rounded-3xl p-12 text-center border border-base-200">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="mt-3 text-sm text-base-content/60">Loading activity...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-base-100 rounded-3xl p-12 text-center border border-base-200 flex flex-col items-center">
            <div className="size-16 rounded-full bg-base-200 flex items-center justify-center text-primary/70 mb-3">
              <LuCheckCheck className="size-8" />
            </div>
            <h3 className="font-bold text-lg text-base-content">No notifications found</h3>
            <p className="text-xs sm:text-sm text-base-content/60 max-w-sm mt-1">
              {search
                ? `No notifications matching "${search}".`
                : "Your notifications inbox is completely clear."}
            </p>
            <button
              onClick={() => sendTestNotification()}
              className="btn btn-outline btn-sm rounded-xl mt-4 gap-2"
            >
              <LuRadio className="size-3.5" /> Trigger Test Alert
            </button>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif._id}
              className={`bg-base-100 rounded-2xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                notif.isRead
                  ? "border-base-200 shadow-2xs hover:border-base-300"
                  : "border-primary/30 bg-primary/2 shadow-xs hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="size-10 rounded-2xl bg-base-200/80 flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-sm ${notif.isRead ? "font-semibold" : "font-bold text-base-content"}`}>
                      {notif.title}
                    </h3>
                    {!notif.isRead && (
                      <span className="badge badge-primary badge-xs">New</span>
                    )}
                    <span className="badge badge-ghost badge-xs text-[10px] capitalize">
                      {notif.type}
                    </span>
                    <span className="text-[11px] text-base-content/50">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-base-content/80 leading-relaxed max-w-3xl">
                    {notif.message}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {notif.link && (
                  <Link
                    href={notif.link}
                    onClick={() => !notif.isRead && markAsRead(notif._id)}
                    className="btn btn-sm btn-ghost text-primary hover:bg-primary/10 rounded-xl gap-1 text-xs"
                  >
                    View <LuExternalLink className="size-3" />
                  </Link>
                )}

                {!notif.isRead ? (
                  <button
                    onClick={() => markAsRead(notif._id)}
                    className="btn btn-sm btn-outline rounded-xl text-xs gap-1"
                    title="Mark as read"
                  >
                    <LuCheck className="size-3.5" /> Read
                  </button>
                ) : null}

                <button
                  onClick={() => deleteNotification(notif._id)}
                  className="btn btn-sm btn-ghost btn-circle text-error hover:bg-error/10"
                  title="Delete"
                >
                  <LuTrash2 className="size-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-base-100 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-base-200 shadow-2xl relative">
            <h3 className="text-lg font-bold text-base-content">
              Dispatch Broadcast Notification
            </h3>
            <p className="text-xs text-base-content/60 mt-1">
              Send a real-time notification push to admins or customers instantly.
            </p>

            <form onSubmit={handleSendBroadcast} className="space-y-4 mt-5">
              <div>
                <label className="label text-xs font-semibold">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flash Sale Alert! or System Maintenance"
                  value={broadcastForm.title}
                  onChange={(e) =>
                    setBroadcastForm({ ...broadcastForm, title: e.target.value })
                  }
                  className="input input-bordered w-full rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="label text-xs font-semibold">Message</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Notification content displayed to user..."
                  value={broadcastForm.message}
                  onChange={(e) =>
                    setBroadcastForm({ ...broadcastForm, message: e.target.value })
                  }
                  className="textarea textarea-bordered w-full rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs font-semibold">Recipient</label>
                  <select
                    value={broadcastForm.recipient}
                    onChange={(e) =>
                      setBroadcastForm({
                        ...broadcastForm,
                        recipient: e.target.value,
                      })
                    }
                    className="select select-bordered w-full rounded-xl text-xs"
                  >
                    <option value="all">Everyone (All users)</option>
                    <option value="admin">Admins only</option>
                  </select>
                </div>

                <div>
                  <label className="label text-xs font-semibold">Category Type</label>
                  <select
                    value={broadcastForm.type}
                    onChange={(e) =>
                      setBroadcastForm({ ...broadcastForm, type: e.target.value })
                    }
                    className="select select-bordered w-full rounded-xl text-xs"
                  >
                    <option value="system">System Announcement</option>
                    <option value="order">Order Event</option>
                    <option value="payment">Payment Alert</option>
                    <option value="inventory">Inventory Alert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label text-xs font-semibold">Action Link (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. /dashboard/orders or /account/orders"
                  value={broadcastForm.link}
                  onChange={(e) =>
                    setBroadcastForm({ ...broadcastForm, link: e.target.value })
                  }
                  className="input input-bordered w-full rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-base-200">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="btn btn-ghost btn-sm rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm rounded-xl gap-1.5"
                >
                  <LuSend className="size-3.5" /> Send Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
