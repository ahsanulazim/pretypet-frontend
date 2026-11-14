import api from "@/axios/axiosInstance";

/**
 * Fetch notifications for a recipient
 * @param {object} params
 * @param {string} [params.recipient="admin"] "admin" or customer email
 * @param {boolean} [params.unreadOnly]
 * @param {number} [params.limit=30]
 */
export const getNotifications = async (params = {}) => {
  const res = await api.get("/notifications", { params });
  return res.data;
};

/**
 * Get unread notification count
 * @param {string} recipient "admin" or customer email
 */
export const getUnreadCount = async (recipient = "admin") => {
  const res = await api.get("/notifications/unread-count", {
    params: { recipient },
  });
  return res.data;
};

/**
 * Mark a single notification as read
 * @param {string} id Notification ObjectId
 */
export const markNotificationAsRead = async (id) => {
  try {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  } catch {
    const res = await api.post(`/notifications/${id}/read`);
    return res.data;
  }
};

/**
 * Mark all notifications as read for a recipient
 * @param {string} recipient "admin" or customer email
 */
export const markAllNotificationsAsRead = async (recipient = "admin") => {
  try {
    const res = await api.patch(
      "/notifications/mark-all-read",
      { recipient },
      { params: { recipient } }
    );
    return res.data;
  } catch {
    const res = await api.post(
      "/notifications/mark-all-read",
      { recipient },
      { params: { recipient } }
    );
    return res.data;
  }
};

/**
 * Delete a single notification
 * @param {string} id Notification ObjectId
 */
export const deleteNotification = async (id) => {
  try {
    const res = await api.delete(`/notifications/${id}`);
    return res.data;
  } catch {
    const res = await api.post(`/notifications/${id}/delete`);
    return res.data;
  }
};

/**
 * Clear all notifications for a recipient
 * @param {string} recipient "admin" or customer email
 */
export const clearAllNotifications = async (recipient = "admin") => {
  try {
    const res = await api.delete("/notifications/clear-all", {
      data: { recipient },
      params: { recipient },
    });
    return res.data;
  } catch {
    const res = await api.post(
      "/notifications/clear-all",
      { recipient },
      { params: { recipient } }
    );
    return res.data;
  }
};

/**
 * Clear specifically test notifications
 */
export const clearTestNotifications = async () => {
  try {
    const res = await api.delete("/notifications/clear-tests");
    return res.data;
  } catch {
    const res = await api.post("/notifications/clear-tests");
    return res.data;
  }
};

/**
 * Dispatch a test notification (useful for verifying real-time socket delivery)
 * @param {object} payload
 */
export const sendTestNotification = async (payload = {}) => {
  const res = await api.post("/notifications/test", payload);
  return res.data;
};
