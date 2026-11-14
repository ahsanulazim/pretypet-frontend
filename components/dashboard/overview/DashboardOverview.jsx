"use client";

import { useState, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import moment from "moment";
import {
  LuDollarSign,
  LuShoppingBag,
  LuUsers,
  LuPackage,
  LuTrendingUp,
  LuTrendingDown,
  LuClock,
  LuTruck,
  LuCheckCircle2,
  LuArrowRight,
  LuRefreshCw,
  LuPlus,
  LuTag,
  LuLayers,
  LuExternalLink,
  LuSparkles,
  LuTriangleAlert,
} from "react-icons/lu";
import { getDashboardStats } from "@/api/dashboardApi";
import { useSocket } from "@/hooks/useSocket";
import { useEffect } from "react";

export default function DashboardOverview() {
  const [days, setDays] = useState(14);
  const [activeMetric, setActiveMetric] = useState("revenue"); // "revenue" | "orders"
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  // Listen for socket events to live-refresh stats
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
    };

    socket.on("order:status:updated", handleUpdate);
    socket.on("notification:new", handleUpdate);

    return () => {
      socket.off("order:status:updated", handleUpdate);
      socket.off("notification:new", handleUpdate);
    };
  }, [socket, queryClient]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["adminDashboardStats", days],
    queryFn: () => getDashboardStats({ days }),
    refetchInterval: 60000, // Refresh every 60s
  });

  const stats = data?.stats;
  const kpis = stats?.kpis || {};
  const salesChart = stats?.salesChart || [];
  const statusDistribution = stats?.orderStatusDistribution || [];
  const recentOrders = stats?.recentOrders || [];
  const topProducts = stats?.topSellingProducts || [];

  // SVG Chart math calculation
  const chartHeight = 240;
  const chartWidth = 700;
  const paddingX = 40;
  const paddingY = 30;

  const maxVal = Math.max(
    ...salesChart.map((d) =>
      activeMetric === "revenue" ? d.revenue : d.orders,
    ),
    activeMetric === "revenue" ? 100 : 5,
  );

  const points = salesChart.map((item, index) => {
    const x =
      salesChart.length > 1
        ? paddingX +
          (index / (salesChart.length - 1)) * (chartWidth - paddingX * 2)
        : chartWidth / 2;
    const val = activeMetric === "revenue" ? item.revenue : item.orders;
    const y =
      chartHeight -
      paddingY -
      (maxVal > 0 ? (val / maxVal) * (chartHeight - paddingY * 2) : 0);
    return { ...item, x, y, val };
  });

  const pathD = points.length
    ? points.reduce(
        (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
        "",
      )
    : "";

  const areaD = points.length
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${
        points[0].x
      } ${chartHeight - paddingY} Z`
    : "";

  const gradientId = useId();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-100 p-5 rounded-2xl shadow-sm border border-base-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-base-content">
              Admin Overview
            </h1>
            <span className="badge badge-primary badge-sm font-semibold">
              Live
            </span>
          </div>
          <p className="text-sm text-base-content/70 mt-1">
            Real-time sales, order fulfillment, and store performance summary.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Days Filter */}
          <div className="join">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`join-item btn btn-sm ${
                  days === d ? "btn-primary" : "btn-ghost border-base-300"
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn btn-sm btn-outline btn-square"
            title="Refresh statistics"
          >
            <LuRefreshCw
              className={`size-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Loading state skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="card bg-base-100 shadow-sm border border-base-200 p-5 animate-pulse"
            >
              <div className="h-4 bg-base-300 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-base-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-base-300 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="alert alert-error shadow-sm rounded-xl">
          <LuTriangleAlert className="size-5" />
          <span>Failed to load dashboard statistics: {error.message}</span>
          <button onClick={() => refetch()} className="btn btn-sm btn-ghost">
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* 2. Top Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Total Revenue */}
            <div className="card bg-base-100 p-5 rounded-2xl border border-base-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                  Total Revenue
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <LuDollarSign className="size-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold tracking-tight">
                  $
                  {(kpis.totalRevenue || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-base-content/70">
                  {kpis.revenueGrowth >= 0 ? (
                    <span className="flex items-center font-medium text-emerald-600">
                      <LuTrendingUp className="mr-0.5 size-3.5" />+
                      {kpis.revenueGrowth}%
                    </span>
                  ) : (
                    <span className="flex items-center font-medium text-rose-500">
                      <LuTrendingDown className="mr-0.5 size-3.5" />
                      {kpis.revenueGrowth}%
                    </span>
                  )}
                  <span>today (${(kpis.todayRevenue || 0).toFixed(2)})</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Total Orders */}
            <div className="card bg-base-100 p-5 rounded-2xl border border-base-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                  Total Orders
                </span>
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <LuShoppingBag className="size-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold tracking-tight">
                  {kpis.totalOrders || 0}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-base-content/70">
                    <strong className="text-base-content">
                      {kpis.todayOrders || 0}
                    </strong>{" "}
                    today
                  </span>
                  {kpis.pendingOrders > 0 && (
                    <span className="badge badge-warning badge-xs font-semibold">
                      {kpis.pendingOrders} Pending
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* KPI 3: Total Customers */}
            <div className="card bg-base-100 p-5 rounded-2xl border border-base-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                  Customers
                </span>
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600">
                  <LuUsers className="size-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold tracking-tight">
                  {kpis.totalUsers || 0}
                </div>
                <div className="mt-2 text-xs text-base-content/70">
                  <strong className="text-base-content">
                    +{kpis.todayUsers || 0}
                  </strong>{" "}
                  registered today
                </div>
              </div>
            </div>

            {/* KPI 4: Total Products / Low Stock */}
            <div className="card bg-base-100 p-5 rounded-2xl border border-base-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                  Store Products
                </span>
                <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600">
                  <LuPackage className="size-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold tracking-tight">
                  {kpis.totalProducts || 0}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-base-content/70">Active Catalog</span>
                  {kpis.lowStockProducts > 0 ? (
                    <span className="badge badge-error badge-xs font-semibold">
                      {kpis.lowStockProducts} Low Stock
                    </span>
                  ) : (
                    <span className="badge badge-success badge-xs text-white font-semibold">
                      Stock OK
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Analytics Chart & Order Status Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Trend Chart (Span 2) */}
            <div className="lg:col-span-2 card bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="font-bold text-lg text-base-content">
                    Sales & Activity Performance
                  </h3>
                  <p className="text-xs text-base-content/60">
                    Daily trend over the past {days} days
                  </p>
                </div>

                <div className="join bg-base-200 p-0.5 rounded-xl self-start sm:self-auto">
                  <button
                    onClick={() => setActiveMetric("revenue")}
                    className={`join-item btn btn-xs rounded-lg ${
                      activeMetric === "revenue"
                        ? "btn-primary text-primary-content"
                        : "btn-ghost"
                    }`}
                  >
                    Revenue ($)
                  </button>
                  <button
                    onClick={() => setActiveMetric("orders")}
                    className={`join-item btn btn-xs rounded-lg ${
                      activeMetric === "orders"
                        ? "btn-primary text-primary-content"
                        : "btn-ghost"
                    }`}
                  >
                    Orders Count
                  </button>
                </div>
              </div>

              {/* Responsive SVG Chart with interactive hover */}
              <div className="relative w-full overflow-hidden">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-56 select-none overflow-visible"
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#4f46e5"
                        stopOpacity="0.35"
                      />
                      <stop
                        offset="100%"
                        stopColor="#4f46e5"
                        stopOpacity="0.0"
                      />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guideline lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y =
                      chartHeight -
                      paddingY -
                      ratio * (chartHeight - paddingY * 2);
                    const val = (ratio * maxVal).toFixed(
                      activeMetric === "revenue" ? 0 : 0,
                    );
                    return (
                      <g key={ratio}>
                        <line
                          x1={paddingX}
                          y1={y}
                          x2={chartWidth - paddingX}
                          y2={y}
                          stroke="currentColor"
                          className="text-base-300"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <text
                          x={paddingX - 8}
                          y={y + 3}
                          textAnchor="end"
                          className="text-[10px] fill-base-content/40"
                        >
                          {activeMetric === "revenue" ? `$${val}` : val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill */}
                  {areaD && <path d={areaD} fill={`url(#${gradientId})`} />}

                  {/* Line path */}
                  {pathD && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data Point Dots & interactive targets */}
                  {points.map((p, idx) => (
                    <g key={idx}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={hoveredPoint?.date === p.date ? "5" : "3.5"}
                        className="fill-indigo-600 stroke-base-100 transition-all duration-150"
                        strokeWidth="2"
                      />
                      {/* Invisible hover trigger zone */}
                      <rect
                        x={p.x - 14}
                        y={0}
                        width="28"
                        height={chartHeight}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(p)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    </g>
                  ))}

                  {/* X-Axis Labels (sample every few days) */}
                  {points
                    .filter((_, idx) =>
                      days === 7
                        ? true
                        : days === 14
                          ? idx % 2 === 0
                          : idx % 4 === 0,
                    )
                    .map((p, idx) => (
                      <text
                        key={idx}
                        x={p.x}
                        y={chartHeight - 8}
                        textAnchor="middle"
                        className="text-[10px] fill-base-content/50"
                      >
                        {p.label}
                      </text>
                    ))}
                </svg>

                {/* Floating tooltip */}
                {hoveredPoint && (
                  <div
                    className="absolute pointer-events-none bg-neutral text-neutral-content text-xs rounded-lg py-1 px-2.5 shadow-lg transform -translate-x-1/2 -translate-y-full transition-all"
                    style={{
                      left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                      top: `${Math.max(10, (hoveredPoint.y / chartHeight) * 100 - 10)}%`,
                    }}
                  >
                    <div className="font-semibold">{hoveredPoint.label}</div>
                    <div className="text-[11px] opacity-90">
                      Revenue: ${hoveredPoint.revenue.toFixed(2)}
                    </div>
                    <div className="text-[11px] opacity-90">
                      Orders: {hoveredPoint.orders}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Status Distribution (Span 1) */}
            <div className="card bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg text-base-content">
                  Order Status Breakdown
                </h3>
                <p className="text-xs text-base-content/60 mb-5">
                  Fulfillment health of all recorded orders
                </p>

                <div className="space-y-4">
                  {statusDistribution.map((item) => (
                    <div key={item.status} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold flex items-center gap-1.5">
                          <span
                            className="size-2 rounded-full inline-block"
                            style={{ backgroundColor: item.color }}
                          ></span>
                          {item.status}
                        </span>
                        <span className="text-base-content/70">
                          <strong>{item.count}</strong> ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(item.percentage, item.count > 0 ? 3 : 0)}%`,
                            backgroundColor: item.color,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-base-200 mt-6">
                <Link
                  href="/dashboard/orders"
                  className="btn btn-outline btn-sm w-full gap-2 text-xs"
                >
                  Manage All Orders
                  <LuArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* 4. Actionable Bottom Grid: Recent Orders & Top Selling Products */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Orders Table (Span 2) */}
            <div className="lg:col-span-2 card bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
              <div className="p-5 flex items-center justify-between border-b border-base-200">
                <div>
                  <h3 className="font-bold text-base text-base-content">
                    Recent Orders
                  </h3>
                  <p className="text-xs text-base-content/60">
                    Latest incoming customer purchases
                  </p>
                </div>
                <Link
                  href="/dashboard/orders"
                  className="btn btn-ghost btn-xs text-primary gap-1"
                >
                  View All
                  <LuArrowRight className="size-3" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr className="text-xs text-base-content/60 bg-base-200/50">
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center py-8 text-sm text-base-content/60"
                        >
                          No orders placed yet.
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((order) => {
                        const isPaid = order.paymentStatus === "paid";
                        const statusBadge =
                          order.orderStatus === "delivered"
                            ? "badge-success"
                            : order.orderStatus === "shipped"
                              ? "badge-info"
                              : order.orderStatus === "processing"
                                ? "badge-primary"
                                : order.orderStatus === "cancelled"
                                  ? "badge-error"
                                  : "badge-warning";

                        return (
                          <tr
                            key={order._id}
                            className="hover:bg-base-200/40 transition-colors"
                          >
                            <td className="font-mono font-semibold text-xs text-primary">
                              <Link
                                href={`/dashboard/orders`}
                                className="hover:underline"
                              >
                                {order.orderNumber}
                              </Link>
                            </td>
                            <td>
                              <div className="text-xs font-medium text-base-content">
                                {order.customerName}
                              </div>
                              <div className="text-[10px] text-base-content/50 truncate max-w-[140px]">
                                {order.customerEmail}
                              </div>
                            </td>
                            <td className="text-xs">
                              {order.itemCount}{" "}
                              {order.itemCount === 1 ? "item" : "items"}
                            </td>
                            <td className="text-xs font-semibold">
                              ${order.total.toFixed(2)}
                              <div className="text-[10px]">
                                {isPaid ? (
                                  <span className="text-emerald-600 font-medium">
                                    Paid
                                  </span>
                                ) : (
                                  <span className="text-amber-500 font-medium">
                                    Unpaid
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span
                                className={`badge badge-xs ${statusBadge} font-medium capitalize`}
                              >
                                {order.orderStatus}
                              </span>
                            </td>
                            <td className="text-[11px] text-base-content/60 whitespace-nowrap">
                              {moment(order.createdAt).format("MMM DD, YYYY")}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Products & Quick Shortcuts (Span 1) */}
            <div className="space-y-6">
              {/* Top Selling Products */}
              <div className="card bg-base-100 p-5 rounded-2xl border border-base-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base text-base-content flex items-center gap-2">
                    <LuSparkles className="size-4 text-amber-500" />
                    Top Products
                  </h3>
                  <Link
                    href="/dashboard/products"
                    className="text-xs text-primary hover:underline"
                  >
                    Catalog
                  </Link>
                </div>

                <div className="space-y-3">
                  {topProducts.length === 0 ? (
                    <div className="text-center py-6 text-xs text-base-content/60">
                      No sales data recorded yet.
                    </div>
                  ) : (
                    topProducts.map((prod, index) => (
                      <div
                        key={prod.id || index}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-base-200/50 transition-colors"
                      >
                        <div className="relative size-11 rounded-lg bg-base-200 overflow-hidden shrink-0 border border-base-300">
                          {prod.thumbnail ? (
                            <Image
                              src={prod.thumbnail}
                              alt={prod.title}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-base-content/40">
                              <LuPackage className="size-5" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4
                            className="text-xs font-semibold text-base-content truncate"
                            title={prod.title}
                          >
                            {prod.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-base-content/60 mt-0.5">
                            <span>{prod.totalSold} sold</span>
                            <span>•</span>
                            <span className="font-medium text-emerald-600">
                              ${prod.totalRevenue.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="card bg-base-100 p-5 rounded-2xl border border-base-200 shadow-sm">
                <h3 className="font-bold text-sm text-base-content mb-3">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Link
                    href="/dashboard/products"
                    className="btn btn-sm btn-outline btn-primary justify-start gap-1.5"
                  >
                    <LuPlus className="size-3.5" />
                    Add Product
                  </Link>

                  <Link
                    href="/dashboard/orders"
                    className="btn btn-sm btn-outline justify-start gap-1.5"
                  >
                    <LuShoppingBag className="size-3.5" />
                    Orders
                  </Link>

                  <Link
                    href="/dashboard/carousel"
                    className="btn btn-sm btn-outline justify-start gap-1.5"
                  >
                    <LuLayers className="size-3.5" />
                    Carousel
                  </Link>

                  <Link
                    href="/dashboard/cj-dropshipping"
                    className="btn btn-sm btn-outline justify-start gap-1.5"
                  >
                    <LuTruck className="size-3.5" />
                    Dropship
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
