"use client";

import React from "react";
import { bulkDeleteOrders } from "@/api/orderApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { LuTrash2, LuTriangleAlert, LuX, LuPackage } from "react-icons/lu";

const BulkOrderDeleteModal = ({ modalRef, selectedOrders = [], onDeleted }) => {
  const queryClient = useQueryClient();

  const selectedCount = selectedOrders.length;
  const totalAmount = selectedOrders.reduce(
    (sum, o) => sum + (Number(o.total ?? o.totalPrice ?? 0) || 0),
    0,
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const orderIds = selectedOrders.map((o) => o._id);
      return await bulkDeleteOrders(orderIds);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orderStats"] });
      const count = data?.deletedCount ?? selectedCount;
      toast.success(
        `${count} ${count === 1 ? "order" : "orders"} deleted successfully`,
      );
      onDeleted?.();
      handleClose();
    },
    onError: (err) => {
      console.error("Bulk delete error:", err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete selected orders",
      );
    },
  });

  const handleClose = () => {
    if (mutation.isPending) return;
    modalRef?.current?.close();
  };

  const handleConfirm = () => {
    if (selectedCount === 0) return;
    mutation.mutate();
  };

  return (
    <dialog
      ref={modalRef}
      className="modal bg-black/40 backdrop-blur-xs z-50 modal-bottom sm:modal-middle"
    >
      <div className="modal-box max-w-lg p-6 rounded-3xl border border-zinc-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2.5 text-rose-600">
            <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600">
              <LuTrash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-zinc-900 leading-tight">
                Delete {selectedCount} Selected{" "}
                {selectedCount === 1 ? "Order" : "Orders"}?
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Batch delete customer orders
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={mutation.isPending}
            className="btn btn-sm btn-circle btn-ghost text-zinc-400 hover:text-zinc-700"
          >
            <LuX className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-3.5 text-sm text-zinc-600">
          {/* Warning Banner */}
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50/70 border border-rose-100 text-rose-700 text-xs">
            <LuTriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Permanent action:</span> This will
              permanently delete{" "}
              <strong className="font-semibold text-rose-900">
                {selectedCount} {selectedCount === 1 ? "order" : "orders"}
              </strong>{" "}
              from your database. Associated transaction and fulfillment records
              cannot be recovered.
            </div>
          </div>

          {/* Aggregated Info Badge */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-zinc-50 border border-zinc-100 p-2.5 rounded-xl">
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold block">
                Total Orders
              </span>
              <span className="text-base font-bold text-zinc-900">
                {selectedCount}
              </span>
            </div>
            <div className="bg-zinc-50 border border-zinc-100 p-2.5 rounded-xl">
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold block">
                Combined Value
              </span>
              <span className="text-base font-bold text-emerald-600">
                $
                {Number(totalAmount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Orders preview list */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">
              Selected Orders Preview
            </p>
            <div className="max-h-44 overflow-y-auto rounded-xl border border-zinc-100 divide-y divide-zinc-100 bg-zinc-50/50">
              {selectedOrders.map((order) => {
                const orderNum =
                  order.orderNumber ||
                  `PP-${String(order._id || "").slice(-6)}`;
                const customerName =
                  order.customer?.name ||
                  [order.customer?.firstName, order.customer?.lastName]
                    .filter(Boolean)
                    .join(" ") ||
                  "Guest";
                const amount = Number(order.total ?? order.totalPrice ?? 0);

                return (
                  <div
                    key={order._id}
                    className="p-2.5 px-3 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-white border border-zinc-200/80 flex items-center justify-center text-zinc-400 shrink-0">
                        <LuPackage className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono font-bold text-zinc-900 truncate">
                          #{orderNum}
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate">
                          {customerName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-semibold text-zinc-900 font-mono">
                        ${amount.toFixed(2)}
                      </span>
                      <span className="block text-[10px] uppercase font-bold text-zinc-400">
                        {order.orderStatus || order.status || "pending"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="modal-action mt-2 pt-3 border-t border-zinc-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            className="btn btn-ghost rounded-xl px-4 text-zinc-600"
            onClick={handleClose}
            disabled={mutation.isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-error text-white rounded-xl px-5 gap-2"
            disabled={mutation.isPending || selectedCount === 0}
            onClick={handleConfirm}
          >
            {mutation.isPending ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <LuTrash2 className="w-4 h-4" />
                <span>
                  Delete {selectedCount}{" "}
                  {selectedCount === 1 ? "Order" : "Orders"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose} disabled={mutation.isPending}>
          close
        </button>
      </form>
    </dialog>
  );
};

export default BulkOrderDeleteModal;
