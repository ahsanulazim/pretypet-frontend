import api from "@/axios/axiosInstance";

/**
 * Fetch scraped (auto-researched) products with filters
 */
export const getScrapedProducts = async ({ queryKey }) => {
  const [, params] = queryKey;
  const res = await api.get("/scraped-products", { params });
  return res.data;
};

/**
 * Scraper health, schedule and summary counts
 */
export const getScraperStatus = async () => {
  const res = await api.get("/scraped-products/status");
  return res.data;
};

/**
 * Trigger a scan immediately instead of waiting for the schedule
 */
export const runScraperNow = async () => {
  const res = await api.post("/scraped-products/run");
  return res.data;
};

/**
 * Change review status: "new" | "shortlisted" | "dismissed"
 */
export const setScrapedProductStatus = async ({ ids, status }) => {
  const res = await api.patch("/scraped-products/status", { ids, status });
  return res.data;
};

/**
 * Save runner settings (start/stop, interval, per-scan limit, categories...)
 */
export const saveScraperSettings = async (settings) => {
  const res = await api.put("/scraped-products/settings", settings);
  return res.data;
};
