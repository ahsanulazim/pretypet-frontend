import api from "@/axios/axiosInstance";

/**
 * Fetch comprehensive dashboard metrics, charts, and recent activity
 * @param {Object} params - e.g. { days: 14 }
 */
export const getDashboardStats = async (params = {}) => {
  const res = await api.get("/dashboard/stats", { params });
  return res.data;
};
