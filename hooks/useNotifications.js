"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as apiDeleteNotification,
  clearAllNotifications as apiClearAll,
  clearTestNotifications as apiClearTests,
  sendTestNotification as apiSendTest,
} from "@/api/notificationApi";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { SOCKET_EVENTS } from "@/lib/socketEvents";

/**
 * Plays a subtle, non-intrusive sound notification using Web Audio API
 */
const playNotificationSound = () => {
  try {
    if (typeof window === "undefined") return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio might be restricted until user interacts with document
  }
};

/**
 * Custom hook for dashboard notifications with real-time socket updates
 * @param {string} [recipient="admin"] Recipient target ("admin" or customer email)
 */
export const useNotifications = (recipient = "admin") => {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["notifications", recipient], [recipient]);

  // 1. Fetch notifications
  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => getNotifications({ recipient, limit: 30 }),
    staleTime: 1000 * 60, // 1 min cache
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // 2. Real-time Socket Listener
  const handleIncomingNotification = useCallback(
    (newNotif) => {
      // Check if notification applies to this recipient
      if (
        newNotif.recipient !== "all" &&
        newNotif.recipient !== recipient
      ) {
        return;
      }

      // Optimistically update query cache
      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;
        const exists = old.notifications?.some((n) => n._id === newNotif._id);
        if (exists) return old;

        return {
          ...old,
          notifications: [newNotif, ...(old.notifications || [])],
          unreadCount: (old.unreadCount || 0) + 1,
          total: (old.total || 0) + 1,
        };
      });

      // Subtle audio feedback
      playNotificationSound();

      // Desktop/In-app toast alert
      toast.info(
        <div>
          <div className="font-semibold text-sm">{newNotif.title}</div>
          <div className="text-xs text-base-content/80 mt-0.5 line-clamp-2">
            {newNotif.message}
          </div>
        </div>,
        {
          autoClose: 5000,
          position: "top-right",
        }
      );
    },
    [queryClient, queryKey, recipient]
  );

  useSocketEvent(SOCKET_EVENTS.NOTIFICATION_NEW, handleIncomingNotification);

  // Sync deletions across open tabs
  useSocketEvent("notification:deleted", useCallback(({ id }) => {
    queryClient.setQueryData(queryKey, (old) => {
      if (!old) return old;
      const target = (old.notifications || []).find((n) => n._id === id);
      const wasUnread = target && !target.isRead;
      return {
        ...old,
        notifications: (old.notifications || []).filter((n) => n._id !== id),
        unreadCount: wasUnread ? Math.max(0, (old.unreadCount || 0) - 1) : old.unreadCount,
        total: Math.max(0, (old.total || 0) - 1),
      };
    });
  }, [queryClient, queryKey]));

  // Sync clear-all across open tabs
  useSocketEvent("notification:cleared", useCallback(() => {
    queryClient.setQueryData(queryKey, {
      notifications: [],
      unreadCount: 0,
      total: 0,
    });
  }, [queryClient, queryKey]));

  // 3. Mark single as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id) => markNotificationAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          notifications: (old.notifications || []).map((n) =>
            n._id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, (old.unreadCount || 0) - 1),
        };
      });

      return { previousData };
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
  });

  // 4. Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(recipient),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          notifications: (old.notifications || []).map((n) => ({
            ...n,
            isRead: true,
          })),
          unreadCount: 0,
        };
      });

      return { previousData };
    },
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err, vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error("Failed to mark all as read");
    },
  });

  // 5. Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => apiDeleteNotification(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;
        const target = (old.notifications || []).find((n) => n._id === id);
        const wasUnread = target && !target.isRead;

        return {
          ...old,
          notifications: (old.notifications || []).filter((n) => n._id !== id),
          unreadCount: wasUnread
            ? Math.max(0, (old.unreadCount || 0) - 1)
            : old.unreadCount,
          total: Math.max(0, (old.total || 0) - 1),
        };
      });

      return { previousData };
    },
    onSuccess: () => {
      toast.success("Notification deleted");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error("Failed to delete notification");
    },
  });

  // 6. Clear all notifications mutation
  const clearAllMutation = useMutation({
    mutationFn: () => apiClearAll(recipient),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          notifications: [],
          unreadCount: 0,
          total: 0,
        };
      });

      return { previousData };
    },
    onSuccess: () => {
      toast.success("All notifications cleared");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err, vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error("Failed to clear notifications");
    },
  });

  // 7. Clear test notifications mutation
  const clearTestsMutation = useMutation({
    mutationFn: () => apiClearTests(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;
        const nonTests = (old.notifications || []).filter(
          (n) => !n.metadata?.isTest && !n.title?.toLowerCase().includes("test")
        );
        const unreadNonTests = nonTests.filter((n) => !n.isRead).length;

        return {
          ...old,
          notifications: nonTests,
          unreadCount: unreadNonTests,
          total: nonTests.length,
        };
      });

      return { previousData };
    },
    onSuccess: () => {
      toast.success("Test notifications cleared");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err, vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error("Failed to clear test notifications");
    },
  });

  // 8. Send test notification
  const sendTest = useCallback(
    async (customPayload = {}) => {
      try {
        const payload = {
          recipient,
          title: "Order Update Test",
          message: `Live test notification triggered at ${new Date().toLocaleTimeString()}`,
          type: "order",
          link: recipient === "admin" ? "/dashboard/orders" : "/account/orders",
          ...customPayload,
        };
        await apiSendTest(payload);
      } catch (err) {
        toast.error("Failed to trigger test notification");
        console.error(err);
      }
    },
    [recipient]
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteMutation.mutate,
    clearAll: clearAllMutation.mutate,
    clearTests: clearTestsMutation.mutate,
    sendTestNotification: sendTest,
  };
};

export default useNotifications;
