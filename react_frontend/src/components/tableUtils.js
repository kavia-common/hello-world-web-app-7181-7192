import React from "react";

/**
 * Shared table sorting + per-column filtering utilities.
 * Used by all existing pages to keep UX consistent without changing their mocked fetching logic.
 */

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(" ");
  return String(value);
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

function toNumberOrNull(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toDateMsOrNull(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  const ms = d.getTime();
  return Number.isNaN(ms) ? null : ms;
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    String(a).localeCompare(String(b))
  );
}

/**
 * Returns a comparable value for sorting, based on the column definition.
 * Column def can provide:
 * - accessor(row) => any
 * - sortType: "text" | "number" | "date"
 */
function getSortValue(row, col) {
  const raw = typeof col.accessor === "function" ? col.accessor(row) : row?.[col.id];

  if (col.sortType === "number") {
    const n = toNumberOrNull(raw);
    // Keep nulls sortable at the end.
    return n === null ? Number.POSITIVE_INFINITY : n;
  }

  if (col.sortType === "date") {
    const ms = toDateMsOrNull(raw);
    return ms === null ? Number.POSITIVE_INFINITY : ms;
  }

  // Default: text
  const s = normalizeText(raw).toLowerCase();
  return s === "" ? "\uffff" : s;
}

// PUBLIC_INTERFACE
export function useTableSorting(initial = { columnId: "", direction: "none" }) {
  /** Hook to manage asc/desc/none sorting state for a table. */
  const [sortState, setSortState] = React.useState(initial);

  // PUBLIC_INTERFACE
  function toggleSort(columnId) {
    /** Cycles sort state: none -> asc -> desc -> none */
    setSortState((prev) => {
      if (prev.columnId !== columnId) {
        return { columnId, direction: "asc" };
      }
      if (prev.direction === "none") return { columnId, direction: "asc" };
      if (prev.direction === "asc") return { columnId, direction: "desc" };
      return { columnId: "", direction: "none" };
    });
  }

  // PUBLIC_INTERFACE
  function clearSort() {
    /** Clears active sorting. */
    setSortState({ columnId: "", direction: "none" });
  }

  return { sortState, toggleSort, clearSort, setSortState };
}

// PUBLIC_INTERFACE
export function sortRows(rows, columns, sortState) {
  /** Returns a new sorted array based on sortState. Keeps stable ordering for equal values. */
  const safeRows = Array.isArray(rows) ? rows : [];
  if (!sortState?.columnId || sortState.direction === "none") return safeRows;

  const col = columns.find((c) => c.id === sortState.columnId);
  if (!col) return safeRows;

  const dir = sortState.direction === "desc" ? -1 : 1;

  return safeRows
    .map((r, idx) => ({ r, idx }))
    .sort((a, b) => {
      const va = getSortValue(a.r, col);
      const vb = getSortValue(b.r, col);

      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;

      // Stable tie-breaker
      return a.idx - b.idx;
    })
    .map((x) => x.r);
}

function includesAnySelected(cellValue, selected) {
  // selected: string[]
  if (!Array.isArray(selected) || selected.length === 0) return true;

  const set = new Set(selected);
  if (Array.isArray(cellValue)) {
    return cellValue.some((v) => set.has(String(v)));
  }
  return set.has(String(cellValue));
}

function passTextFilter(cellValue, filter) {
  if (!filter || isBlank(filter.value)) return true;
  const q = String(filter.value).trim().toLowerCase();
  if (!q) return true;
  return normalizeText(cellValue).toLowerCase().includes(q);
}

function passSelectFilter(cellValue, filter) {
  if (!filter || isBlank(filter.value)) return true;
  return String(cellValue || "") === String(filter.value);
}

function passMultiSelectFilter(cellValue, filter) {
  if (!filter || !Array.isArray(filter.values) || filter.values.length === 0) return true;
  return includesAnySelected(cellValue, filter.values);
}

function passNumberRangeFilter(cellValue, filter) {
  if (!filter) return true;
  const n = toNumberOrNull(cellValue);
  if (n === null) return false;

  const min = isBlank(filter.min) ? null : toNumberOrNull(filter.min);
  const max = isBlank(filter.max) ? null : toNumberOrNull(filter.max);

  if (min !== null && n < min) return false;
  if (max !== null && n > max) return false;
  return true;
}

function passDateRangeFilter(cellValue, filter) {
  if (!filter) return true;
  const ms = toDateMsOrNull(cellValue);
  if (ms === null) return false;

  const minMs = isBlank(filter.min) ? null : toDateMsOrNull(filter.min);
  const maxMs = isBlank(filter.max) ? null : toDateMsOrNull(filter.max);

  if (minMs !== null && ms < minMs) return false;
  if (maxMs !== null && ms > maxMs) return false;
  return true;
}

// PUBLIC_INTERFACE
export function applyColumnFilters(rows, columns, columnFilters) {
  /**
   * Applies per-column filters to rows.
   * columnFilters is an object keyed by column id, where each value depends on filterType:
   * - text: { type: "text", value: string }
   * - select: { type: "select", value: string }
   * - multiselect: { type: "multiselect", values: string[] }
   * - numberRange: { type: "numberRange", min: string, max: string }
   * - dateRange: { type: "dateRange", min: "YYYY-MM-DD", max: "YYYY-MM-DD" }
   */
  const safeRows = Array.isArray(rows) ? rows : [];
  if (!columnFilters) return safeRows;

  return safeRows.filter((row) => {
    for (const col of columns) {
      const f = columnFilters[col.id];
      if (!f) continue;

      const cellValue = typeof col.accessor === "function" ? col.accessor(row) : row?.[col.id];

      // Column can override how we read/filter values
      const filterValue =
        typeof col.filterAccessor === "function" ? col.filterAccessor(row) : cellValue;

      switch (f.type) {
        case "text":
          if (!passTextFilter(filterValue, f)) return false;
          break;
        case "select":
          if (!passSelectFilter(filterValue, f)) return false;
          break;
        case "multiselect":
          if (!passMultiSelectFilter(filterValue, f)) return false;
          break;
        case "numberRange":
          if (!passNumberRangeFilter(filterValue, f)) return false;
          break;
        case "dateRange":
          if (!passDateRangeFilter(filterValue, f)) return false;
          break;
        default:
          break;
      }
    }
    return true;
  });
}

// PUBLIC_INTERFACE
export function buildFacetOptions(rows, columns) {
  /**
   * Builds unique option lists for select/multiselect columns.
   * Returns: { [colId]: string[] }
   */
  const safeRows = Array.isArray(rows) ? rows : [];
  const out = {};

  for (const col of columns) {
    if (col.filterType !== "select" && col.filterType !== "multiselect") continue;

    const values = [];
    for (const row of safeRows) {
      const raw = typeof col.filterAccessor === "function" ? col.filterAccessor(row) : row?.[col.id];
      if (Array.isArray(raw)) values.push(...raw.map((v) => String(v)));
      else values.push(String(raw || ""));
    }

    out[col.id] = uniqueSorted(values.filter((v) => v && v !== "—" && v !== "-"));
  }

  return out;
}

/**
 * ---------------------------------------------------------------------------
 * UI helpers (shared across tables)
 * These are intentionally tiny, so pages remain free to render their own UI,
 * but can share stable constants to avoid overlapping filter controls.
 * ---------------------------------------------------------------------------
 */

// PUBLIC_INTERFACE
export function getStableTableHeaderHeights() {
  /** Returns the assumed sticky header + filter-row heights used in CSS. */
  return { headerPx: 44, filterRowPx: 44 };
}

// PUBLIC_INTERFACE
export function getTableFilterControlWidthBounds() {
  /** Returns recommended min/max widths for column filter controls to prevent overlap. */
  return { minPx: 140, maxPx: 320 };
}
