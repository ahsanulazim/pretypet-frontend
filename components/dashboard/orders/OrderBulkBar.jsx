"use client";

import React from "react";
import {
  LuTrash2,
  LuSparkles,
  LuX,
  LuSquareCheck,
  LuFilter,
} from "react-icons/lu";

const OrderBulkBar = ({
  selectedCount = 0,
  unfulfilledCount = 0,
  onClearSelection,
  onBulkDelete,
  onBulkFulfill,
  onSelectUnfulfilled,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-center gap-3 bg-neutral text-neutral-content px-5 py-3 rounded-2xl shadow-2xl border border-neutral-content/20 backdrop-blur-md">
        <div className="flex items-center gap-2 pr-3 border-r border-neutral-content/20">
          <LuSquareCheck className="size-4 text-primary" />
          <span className="text-xs font-semibold tracking-wide">
            {selectedCount} {selectedCount === 1 ? "Order" : "Orders"} Selected
          </span>
        </div>

        {onSelectUnfulfilled && unfulfilledCount > 0 && (
          <button
            type="button"
            onClick={onSelectUnfulfilled}
            className="btn btn-xs btn-ghost text-neutral-content hover:bg-neutral-content/20 gap-1.5"
            title="Select unfulfilled orders only"
          >
            <LuFilter className="size-3.5" />
            <span className="hidden sm:inline">Unfulfilled Only</span>
          </button>
        )}

        {onBulkFulfill && (
          <button
            type="button"
            onClick={onBulkFulfill}
            className="btn btn-xs btn-primary text-white gap-1.5 shadow-xs"
            title="Bulk fulfill selected orders with CJ Dropshipping"
          >
            <LuSparkles className="size-3.5" />
            <span className="hidden sm:inline">Bulk Fulfill CJ</span>
            <span>({unfulfilledCount})</span>
          </button>
        )}

        <button
          type="button"
          onClick={onBulkDelete}
          className="btn btn-xs btn-error text-white gap-1.5 shadow-xs"
          title="Delete selected orders"
        >
          <LuTrash2 className="size-3.5" />
          <span>Delete ({selectedCount})</span>
        </button>

        <button
          type="button"
          onClick={onClearSelection}
          className="btn btn-xs btn-circle btn-ghost text-neutral-content/60 hover:text-neutral-content"
          title="Clear selection"
        >
          <LuX className="size-3.5" />
        </button>
      </div>
    </div>
  );
};

export default OrderBulkBar;
