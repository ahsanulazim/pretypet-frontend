"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getScrapedProducts,
  getScraperStatus,
  runScraperNow,
  saveScraperSettings,
  setScrapedProductStatus,
} from "@/api/scrapedProductApi";
import ScraperSettingsModal from "./ScraperSettingsModal";
import { addProductToImportList } from "@/api/productApi";
import {
  LuExternalLink,
  LuFlame,
  LuPackagePlus,
  LuPlay,
  LuRefreshCw,
  LuRotateCcw,
  LuSearch,
  LuSettings,
  LuSquare,
  LuStar,
  LuStore,
  LuTrendingUp,
  LuTruck,
  LuVideo,
  LuWarehouse,
  LuX,
} from "react-icons/lu";
import moment from "moment";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const STATUS_TABS = [
  { value: "active", label: "To review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "dismissed", label: "Dismissed" },
];

const FLAG_OPTIONS = [
  { value: "", label: "All signals" },
  { value: "trending", label: "CJ trending" },
  { value: "usStock", label: "US warehouse stock" },
  { value: "new", label: "New on CJ" },
  { value: "freeShipping", label: "Free shipping" },
  { value: "video", label: "Has video" },
];

const SORT_OPTIONS = [
  { value: "score", label: "Highest score" },
  { value: "growth", label: "Fastest growing" },
  { value: "listed", label: "Most listed" },
  { value: "newest", label: "Recently found" },
  { value: "price_asc", label: "Cost: low to high" },
  { value: "price_desc", label: "Cost: high to low" },
];

const PAGE_SIZE = 20;

const formatCost = (product) => {
  if (product.priceMin === null || product.priceMin === undefined) return "-";
  const min = `$${product.priceMin.toFixed(2)}`;
  return product.priceMax > product.priceMin
    ? `${min} - $${product.priceMax.toFixed(2)}`
    : min;
};

const ScrapedProducts = () => {
  const queryClient = useQueryClient();

  const [status, setStatus] = useState("active");
  const [category, setCategory] = useState("");
  const [flag, setFlag] = useState("");
  const [minScore, setMinScore] = useState("");
  const [sort, setSort] = useState("score");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Any filter change goes back to page 1 and clears the selection
  const applyFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
    setSelected([]);
  };

  // Debounce the search box
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
      setSelected([]);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams = {
    status,
    category,
    flag,
    minScore,
    sort,
    search,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["scrapedProducts", queryParams],
    queryFn: getScrapedProducts,
    placeholderData: keepPreviousData,
  });

  const { data: statusData } = useQuery({
    queryKey: ["scraperStatus"],
    queryFn: getScraperStatus,
    refetchInterval: 30000,
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["scrapedProducts"] });
    queryClient.invalidateQueries({ queryKey: ["scraperStatus"] });
  };

  const runMutation = useMutation({
    mutationFn: runScraperNow,
    onSuccess: (res) => {
      const r = res?.result;
      toast.success(
        r
          ? `Scanned ${r.category}: ${r.fetched} found, ${r.inserted} added`
          : "Scan finished",
      );
      refreshAll();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Scan failed");
      refreshAll();
    },
  });

  // Quick start / stop from the status bar
  const toggleMutation = useMutation({
    mutationFn: (enabled) => saveScraperSettings({ enabled }),
    onSuccess: (_res, enabled) => {
      toast.success(
        enabled ? "Automatic scanning started" : "Automatic scanning stopped",
      );
      queryClient.invalidateQueries({ queryKey: ["scraperStatus"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to update");
    },
  });

  const statusMutation = useMutation({
    mutationFn: setScrapedProductStatus,
    onSuccess: (_res, variables) => {
      const count = variables.ids.length;
      const label =
        variables.status === "new" ? "moved back to review" : variables.status;
      toast.success(`${count} product${count > 1 ? "s" : ""} ${label}`);
      setSelected([]);
      refreshAll();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to update");
    },
  });

  // Adds the product to the CJ import list, then marks it shortlisted
  const importMutation = useMutation({
    mutationFn: async (product) => {
      await addProductToImportList(product.cjProductId);
      await setScrapedProductStatus({
        ids: [product._id],
        status: "shortlisted",
      });
    },
    onSuccess: () => {
      toast.success("Added to your CJ import list");
      queryClient.invalidateQueries({ queryKey: ["cjImportList"] });
      refreshAll();
    },
    onError: (err) => {
      toast.error(err?.message || "Could not add to the CJ import list");
    },
  });

  const products = data?.products || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const scraper = statusData?.status;
  const counts = statusData?.counts;
  const strongAt = statusData?.thresholds?.strong ?? 50;
  const watchAt = statusData?.thresholds?.watch ?? 35;

  const pageIds = products.map((p) => p._id);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.includes(id));

  const toggleAll = () => setSelected(allSelected ? [] : pageIds);
  const toggleOne = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const scoreBadge = (score) =>
    score >= strongAt
      ? "badge-success"
      : score >= watchAt
        ? "badge-warning"
        : "badge-ghost";

  const busy = statusMutation.isPending || importMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Scanner status bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-base-100 p-3.5 rounded-xl border border-base-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-base-content/70">
          <span
            className={`size-2 rounded-full ${
              scraper?.enabled ? "bg-success animate-pulse" : "bg-error"
            }`}
          ></span>
          {scraper?.enabled ? (
            <span>
              <strong>Auto-scan active:</strong> every{" "}
              {scraper.intervalMinutes} minutes
            </span>
          ) : (
            <span>
              <strong>Auto-scan off</strong>
              {scraper?.disabledReason ? `: ${scraper.disabledReason}` : ""}
            </span>
          )}
          {scraper?.lastRunAt && (
            <span className="text-base-content/50">
              • Last scan {moment(scraper.lastRunAt).fromNow()}
              {scraper.lastResult
                ? ` (${scraper.lastResult.category}: ${scraper.lastResult.fetched} found, ${scraper.lastResult.inserted} added)`
                : ""}
            </span>
          )}
          {scraper?.nextCategory && (
            <span className="text-base-content/50">
              • Next: {scraper.nextCategory}
            </span>
          )}
          {scraper?.lastError && (
            <span className="text-error">
              • Last scan failed: {scraper.lastError.message}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {scraper?.settings && (
            <button
              type="button"
              onClick={() => toggleMutation.mutate(!scraper.settings.enabled)}
              disabled={toggleMutation.isPending}
              className={`btn btn-xs rounded-lg gap-1.5 font-medium shadow-2xs ${
                scraper.settings.enabled ? "btn-outline btn-error" : "btn-success"
              }`}
              title={
                scraper.settings.enabled
                  ? "Stop automatic scanning"
                  : "Start automatic scanning"
              }
            >
              {scraper.settings.enabled ? (
                <>
                  <LuSquare className="size-3" /> Stop
                </>
              ) : (
                <>
                  <LuPlay className="size-3" /> Start
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending || scraper?.isRunning}
            className="btn btn-xs btn-outline rounded-lg gap-1.5 font-medium shadow-2xs"
            title="Scan the next category now instead of waiting"
          >
            <LuRefreshCw
              className={`size-3.5 ${
                runMutation.isPending || scraper?.isRunning
                  ? "animate-spin text-primary"
                  : ""
              }`}
            />
            {runMutation.isPending || scraper?.isRunning
              ? "Scanning..."
              : "Scan Now"}
          </button>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            disabled={!scraper?.settings}
            className="btn btn-xs btn-outline rounded-lg gap-1.5 font-medium shadow-2xs"
            title="Scanner settings"
          >
            <LuSettings className="size-3.5" /> Settings
          </button>
        </div>
      </div>

      {settingsOpen && scraper?.settings && (
        <ScraperSettingsModal
          scraper={scraper}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: `Strong candidates (score ${strongAt}+)`,
            value: counts?.strong,
            tone: "text-success",
          },
          {
            label: `Worth watching (score ${watchAt}-${strongAt - 1})`,
            value: counts?.watch,
            tone: "text-warning",
          },
          {
            label: "Shortlisted",
            value: counts?.shortlisted,
            tone: "text-primary",
          },
          {
            label: "Products tracked",
            value: counts?.total,
            tone: "text-base-content",
          },
        ].map((tile) => (
          <div
            key={tile.label}
            className="bg-base-100 border border-base-200 p-3.5 rounded-xl shadow-xs"
          >
            <div className={`text-2xl font-bold ${tile.tone}`}>
              {tile.value ?? "-"}
            </div>
            <div className="text-[11px] text-base-content/60 mt-0.5">
              {tile.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-base-100 p-3.5 rounded-xl border border-base-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div role="tablist" className="tabs tabs-box tabs-sm w-fit">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                role="tab"
                type="button"
                onClick={() => applyFilter(setStatus)(tab.value)}
                className={`tab ${status === tab.value ? "tab-active" : ""}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <label className="input input-sm w-full lg:max-w-xs">
            <LuSearch className="size-4 opacity-50" />
            <input
              type="search"
              placeholder="Search name, SKU or PID"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <select
            className="select select-sm w-full"
            value={category}
            onChange={(e) => applyFilter(setCategory)(e.target.value)}
            aria-label="Category"
          >
            <option value="">All pet categories</option>
            {(scraper?.categories || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="select select-sm w-full"
            value={flag}
            onChange={(e) => applyFilter(setFlag)(e.target.value)}
            aria-label="Signal"
          >
            {FLAG_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            className="select select-sm w-full"
            value={minScore}
            onChange={(e) => applyFilter(setMinScore)(e.target.value)}
            aria-label="Minimum score"
          >
            <option value="">Any score</option>
            <option value={strongAt}>Strong only ({strongAt}+)</option>
            <option value={watchAt}>Watch and above ({watchAt}+)</option>
          </select>

          <select
            className="select select-sm w-full"
            value={sort}
            onChange={(e) => applyFilter(setSort)(e.target.value)}
            aria-label="Sort"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 bg-primary/5 border border-primary/20 p-2.5 rounded-xl text-xs">
          <span className="font-semibold">{selected.length} selected</span>
          {status !== "shortlisted" && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                statusMutation.mutate({ ids: selected, status: "shortlisted" })
              }
              className="btn btn-xs btn-primary gap-1"
            >
              <LuStar className="size-3" /> Shortlist
            </button>
          )}
          {status !== "dismissed" && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                statusMutation.mutate({ ids: selected, status: "dismissed" })
              }
              className="btn btn-xs btn-outline gap-1"
            >
              <LuX className="size-3" /> Dismiss
            </button>
          )}
          {status !== "active" && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                statusMutation.mutate({ ids: selected, status: "new" })
              }
              className="btn btn-xs btn-outline gap-1"
            >
              <LuRotateCcw className="size-3" /> Move back to review
            </button>
          )}
          <button
            type="button"
            onClick={() => setSelected([])}
            className="btn btn-xs btn-ghost"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div
        className={`overflow-x-auto bg-base-100 rounded-xl border border-base-200 shadow-sm transition-opacity ${
          isFetching && !isLoading ? "opacity-60" : ""
        }`}
      >
        <table className="table table-zebra w-full">
          <thead className="bg-base-200/80 text-xs uppercase tracking-wider text-base-content/70">
            <tr>
              <th className="w-10">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all on this page"
                />
              </th>
              <th>Product</th>
              <th>Score</th>
              <th>CJ Cost</th>
              <th>Listed By</th>
              <th>US Stock</th>
              <th>Signals</th>
              <th>Found</th>
              <th className="text-right pr-6">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan="9">
                    <div className="flex items-center gap-3">
                      <div className="skeleton size-12 rounded-lg shrink-0"></div>
                      <div className="skeleton h-4 w-full"></div>
                    </div>
                  </td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan="9" className="text-center py-10">
                  <div className="text-error font-medium">
                    Failed to load scraped products.
                  </div>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="btn btn-sm btn-outline mt-3"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-14">
                  <div className="size-12 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-3 text-base-content/40">
                    <LuSearch className="size-6" />
                  </div>
                  <div className="text-base-content font-semibold text-sm">
                    No products here yet
                  </div>
                  <p className="text-xs text-base-content/60 max-w-sm mx-auto mt-1">
                    {counts?.total
                      ? "Nothing matches these filters."
                      : "The first automatic scan fills this list. You can also press Scan Now."}
                  </p>
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr
                  key={product._id}
                  className="hover:bg-base-200/50 transition-colors"
                >
                  <td>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={selected.includes(product._id)}
                      onChange={() => toggleOne(product._id)}
                      aria-label={`Select ${product.name}`}
                    />
                  </td>

                  {/* Product */}
                  <td className="max-w-sm">
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="mask mask-squircle h-12 w-12 bg-base-200">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="object-cover"
                            loading="lazy"
                          />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3
                          className="font-medium text-sm text-base-content line-clamp-2"
                          title={product.name}
                        >
                          {product.name}
                        </h3>
                        <div className="text-[11px] text-base-content/50 mt-0.5 truncate">
                          {product.categoryName}
                          {product.subCategoryName
                            ? ` › ${product.subCategoryName}`
                            : ""}
                          {product.sku ? ` • ${product.sku}` : ""}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Score with the reasons behind it */}
                  <td>
                    <div className="dropdown dropdown-hover dropdown-right">
                      <div
                        tabIndex={0}
                        role="button"
                        className={`badge ${scoreBadge(product.score)} font-bold cursor-help`}
                      >
                        {product.score}
                      </div>
                      <div
                        tabIndex={0}
                        className="dropdown-content z-20 w-64 rounded-xl bg-base-100 border border-base-200 shadow-lg p-3 text-xs"
                      >
                        <div className="font-semibold mb-1.5">
                          Why {product.score} / 100
                        </div>
                        <ul className="space-y-1 text-base-content/70">
                          {(product.reasons || []).map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                          {!product.reasons?.length && (
                            <li>No positive signals yet</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </td>

                  {/* Cost */}
                  <td>
                    <div className="font-semibold text-sm whitespace-nowrap">
                      {formatCost(product)}
                    </div>
                  </td>

                  {/* Listings and momentum */}
                  <td>
                    <div className="text-sm font-medium">
                      {product.listedNum.toLocaleString()}
                      <span className="text-[11px] font-normal text-base-content/50">
                        {" "}
                        sellers
                      </span>
                    </div>
                    {product.listedPerDay >= 0.1 && (
                      <div className="flex items-center gap-1 text-[11px] text-success font-medium whitespace-nowrap">
                        <LuTrendingUp className="size-3" />+
                        {product.listedPerDay.toFixed(1)}/day
                      </div>
                    )}
                  </td>

                  {/* US stock */}
                  <td>
                    {product.flags?.usStock ? (
                      <div className="flex items-center gap-1 text-xs whitespace-nowrap">
                        <LuWarehouse className="size-3.5 opacity-60" />
                        {product.usInventory.toLocaleString()} units
                      </div>
                    ) : (
                      <span className="text-xs text-base-content/40">
                        None
                      </span>
                    )}
                  </td>

                  {/* Signals */}
                  <td>
                    <div className="flex flex-wrap gap-1 max-w-40">
                      {product.flags?.trending && (
                        <span className="badge badge-xs badge-error badge-soft gap-1 whitespace-nowrap">
                          <LuFlame className="size-3" /> Trending
                        </span>
                      )}
                      {product.flags?.isNew && (
                        <span className="badge badge-xs badge-info badge-soft whitespace-nowrap">
                          New
                        </span>
                      )}
                      {product.freeShipping && (
                        <span className="badge badge-xs badge-success badge-soft gap-1 whitespace-nowrap">
                          <LuTruck className="size-3" /> Free ship
                        </span>
                      )}
                      {product.hasVideo && (
                        <span className="badge badge-xs badge-ghost gap-1 whitespace-nowrap">
                          <LuVideo className="size-3" /> Video
                        </span>
                      )}
                      {product.inStore && (
                        <span
                          className="badge badge-xs badge-primary badge-soft gap-1 whitespace-nowrap"
                          title={product.storeTitle || ""}
                        >
                          <LuStore className="size-3" /> In store
                        </span>
                      )}
                    </div>
                  </td>

                  {/* First seen */}
                  <td>
                    <span className="text-xs text-base-content/70 whitespace-nowrap">
                      {moment(product.firstSeenAt).fromNow()}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={`https://cjdropshipping.com/product/-p-${product.cjProductId}.html`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-base-content"
                        title="View on CJ Dropshipping"
                      >
                        <LuExternalLink className="size-3.5" />
                      </a>

                      {product.status === "dismissed" ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            statusMutation.mutate({
                              ids: [product._id],
                              status: "new",
                            })
                          }
                          className="btn btn-xs btn-outline gap-1"
                          title="Move back to review"
                        >
                          <LuRotateCcw className="size-3" /> Restore
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              statusMutation.mutate({
                                ids: [product._id],
                                status:
                                  product.status === "shortlisted"
                                    ? "new"
                                    : "shortlisted",
                              })
                            }
                            className={`btn btn-xs btn-circle ${
                              product.status === "shortlisted"
                                ? "btn-warning"
                                : "btn-ghost"
                            }`}
                            title={
                              product.status === "shortlisted"
                                ? "Remove from shortlist"
                                : "Shortlist"
                            }
                          >
                            <LuStar
                              className={`size-3.5 ${
                                product.status === "shortlisted"
                                  ? "fill-current"
                                  : ""
                              }`}
                            />
                          </button>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              statusMutation.mutate({
                                ids: [product._id],
                                status: "dismissed",
                              })
                            }
                            className="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-error"
                            title="Dismiss (hide from review)"
                          >
                            <LuX className="size-3.5" />
                          </button>

                          {!product.inStore && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => importMutation.mutate(product)}
                              className="btn btn-xs btn-primary gap-1 font-medium whitespace-nowrap"
                              title="Add to the CJ import list so it can be customized and published"
                            >
                              <LuPackagePlus className="size-3" />
                              Add to CJ List
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-xs text-base-content/60">
          {total.toLocaleString()} product{total === 1 ? "" : "s"} • Page{" "}
          <span className="font-semibold">{page}</span> of{" "}
          <span className="font-semibold">{totalPages}</span>
        </div>

        {totalPages > 1 && (
          <div className="join shadow-sm border border-base-200">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => {
                setPage(page - 1);
                setSelected([]);
              }}
              className="join-item btn btn-sm bg-base-100"
            >
              «
            </button>
            <button
              type="button"
              className="join-item btn btn-sm btn-primary font-bold"
            >
              {page}
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => {
                setPage(page + 1);
                setSelected([]);
              }}
              className="join-item btn btn-sm bg-base-100"
            >
              »
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScrapedProducts;
