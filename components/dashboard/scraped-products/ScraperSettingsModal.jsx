"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveScraperSettings } from "@/api/scrapedProductApi";
import { useState } from "react";
import { LuPlay, LuSquare } from "react-icons/lu";
import { toast } from "react-toastify";

const NUMBER_FIELDS = [
  {
    key: "intervalMinutes",
    label: "Scan every",
    unit: "minutes",
    help: "Each scan covers one pet category.",
  },
  {
    key: "maxNewPerScan",
    label: "New products per scan",
    unit: "max",
    help: "The best-scoring new products are added first. Products already tracked are still refreshed.",
  },
  {
    key: "minScoreToSave",
    label: "Minimum score to add",
    unit: "/ 100",
    help: "New products scoring below this are not added. 0 adds everything.",
  },
  {
    key: "retentionDays",
    label: "Remove unseen products after",
    unit: "days",
    help: "Shortlisted products are never removed.",
  },
];

/**
 * Runner settings. Rendered only while open, so its form state starts from the
 * saved settings each time it opens.
 */
const ScraperSettingsModal = ({ scraper, onClose }) => {
  const queryClient = useQueryClient();
  const saved = scraper.settings;
  const categories = scraper.categories || [];
  const limits = scraper.limits || {};

  const [enabled, setEnabled] = useState(saved.enabled);
  const [numbers, setNumbers] = useState(() =>
    Object.fromEntries(NUMBER_FIELDS.map((f) => [f.key, String(saved[f.key])])),
  );
  // An empty saved list means "all categories"
  const [categoryIds, setCategoryIds] = useState(() =>
    saved.categoryIds.length ? saved.categoryIds : categories.map((c) => c.id),
  );
  const [searches, setSearches] = useState(saved.searches);

  const mutation = useMutation({
    mutationFn: saveScraperSettings,
    onSuccess: () => {
      toast.success("Scanner settings saved");
      queryClient.invalidateQueries({ queryKey: ["scraperStatus"] });
      onClose();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to save settings");
    },
  });

  const numberError = (field) => {
    const [min, max] = limits[field.key] || [0, Infinity];
    const value = Number(numbers[field.key]);
    return numbers[field.key] === "" ||
      !Number.isInteger(value) ||
      value < min ||
      value > max
      ? `Enter a whole number from ${min} to ${max}`
      : null;
  };

  const noCategory = categories.length > 0 && categoryIds.length === 0;
  const noSearch = !Object.values(searches).some(Boolean);
  const invalid =
    NUMBER_FIELDS.some((f) => numberError(f)) || noCategory || noSearch;

  const toggleCategory = (id) =>
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleSave = (e) => {
    e.preventDefault();
    if (invalid) return;
    const allCategories = categoryIds.length === categories.length;
    mutation.mutate({
      enabled,
      ...Object.fromEntries(
        NUMBER_FIELDS.map((f) => [f.key, Number(numbers[f.key])]),
      ),
      categoryIds: allCategories ? [] : categoryIds,
      searches,
    });
  };

  return (
    <dialog className="modal modal-open" onCancel={onClose}>
      <form
        className="modal-box max-w-2xl max-h-[90dvh] overflow-y-auto"
        onSubmit={handleSave}
      >
        <h3 className="font-bold text-lg">Scanner Settings</h3>
        <p className="text-xs text-base-content/60 mt-0.5">
          Controls the automatic product research. Changes apply within a
          minute.
        </p>

        {/* Start / stop */}
        <div
          className={`mt-4 flex items-center justify-between gap-3 rounded-xl border p-3.5 ${
            enabled
              ? "border-success/30 bg-success/5"
              : "border-base-300 bg-base-200/50"
          }`}
        >
          <div>
            <div className="font-semibold text-sm">
              Automatic scanning is {enabled ? "running" : "stopped"}
            </div>
            <div className="text-xs text-base-content/60">
              {enabled
                ? "The server scans on its own at the interval below."
                : "Nothing is scanned until you start it again. Scan Now still works."}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`btn btn-sm gap-1.5 ${enabled ? "btn-outline btn-error" : "btn-success"}`}
          >
            {enabled ? (
              <>
                <LuSquare className="size-3.5" /> Stop
              </>
            ) : (
              <>
                <LuPlay className="size-3.5" /> Start
              </>
            )}
          </button>
        </div>

        {/* Numbers */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
          {NUMBER_FIELDS.map((field) => {
            const error = numberError(field);
            return (
              <div key={field.key}>
                <label
                  htmlFor={`scraper-${field.key}`}
                  className="text-xs font-semibold"
                >
                  {field.label}
                </label>
                <label
                  className={`input input-sm w-full mt-1 ${error ? "input-error" : ""}`}
                >
                  <input
                    id={`scraper-${field.key}`}
                    type="number"
                    inputMode="numeric"
                    min={limits[field.key]?.[0]}
                    max={limits[field.key]?.[1]}
                    step="1"
                    value={numbers[field.key]}
                    onChange={(e) =>
                      setNumbers({ ...numbers, [field.key]: e.target.value })
                    }
                  />
                  <span className="text-xs text-base-content/50">
                    {field.unit}
                  </span>
                </label>
                <p
                  className={`text-[11px] mt-1 ${error ? "text-error" : "text-base-content/50"}`}
                >
                  {error || field.help}
                </p>
              </div>
            );
          })}
        </div>

        {/* Categories */}
        <fieldset className="mt-4">
          <div className="flex items-center justify-between">
            <legend className="text-xs font-semibold">
              Categories to scan
            </legend>
            {categories.length > 0 && (
              <div className="flex gap-2 text-[11px]">
                <button
                  type="button"
                  className="link link-hover"
                  onClick={() => setCategoryIds(categories.map((c) => c.id))}
                >
                  Select all
                </button>
                <button
                  type="button"
                  className="link link-hover"
                  onClick={() => setCategoryIds([])}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          {categories.length === 0 ? (
            <p className="text-[11px] text-base-content/50 mt-1">
              The category list loads from CJ on the first scan. Until then all
              pet categories are scanned.
            </p>
          ) : (
            <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-2 text-xs cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs"
                    checked={categoryIds.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                  />
                  {category.name}
                </label>
              ))}
            </div>
          )}
          {noCategory && (
            <p className="text-[11px] text-error mt-1">
              Select at least one category.
            </p>
          )}
        </fieldset>

        {/* Search types */}
        <fieldset className="mt-4">
          <legend className="text-xs font-semibold">
            Searches run in each scan
          </legend>
          <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {(scraper.searchTypes || []).map((type) => (
              <label
                key={type.key}
                className="flex items-center gap-2 text-xs cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs"
                  checked={Boolean(searches[type.key])}
                  onChange={() =>
                    setSearches({ ...searches, [type.key]: !searches[type.key] })
                  }
                />
                {type.label}
              </label>
            ))}
          </div>
          {noSearch && (
            <p className="text-[11px] text-error mt-1">
              Keep at least one search on.
            </p>
          )}
        </fieldset>

        <div className="modal-action">
          <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-sm btn-main"
            disabled={invalid || mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
      <button
        type="button"
        className="modal-backdrop"
        onClick={onClose}
        aria-label="Close settings"
      ></button>
    </dialog>
  );
};

export default ScraperSettingsModal;
