import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Calendar } from "primereact/calendar";
import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";
import { Paginator } from "primereact/paginator";
import { Checkbox } from "primereact/checkbox";
import { Chip } from "primereact/chip";
import { Tag } from "primereact/tag";

/**
 * PrimeReact table wrapper that keeps the project’s existing UX behavior:
 * - global search
 * - per-column filters (via dedicated filter controls + header funnel with "Select All")
 * - sortable headers with indicators (Prime handles)
 * - column visibility toggles
 * - filter popover for dense/overflow filters (OverlayPanel)
 * - external pagination (Paginator)
 * - CSV export readiness (DataTable exportCSV)
 */

/** Small helper: safe text normalization for global search */
function normalizeText(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(" ");
  return String(value);
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
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b)));
}

function getCellValue(row, colDef) {
  if (typeof colDef?.accessor === "function") return colDef.accessor(row);
  return row?.[colDef.id];
}

function getFilterValue(row, colDef) {
  if (typeof colDef?.filterAccessor === "function") return colDef.filterAccessor(row);
  return getCellValue(row, colDef);
}

// PUBLIC_INTERFACE
export default function PrimeDataTableCard({
  /** Card title above the table. */
  title,
  /** Optional subtitle text. */
  subtitle,
  /** All columns definitions (including those that may be hidden). */
  columns,
  /** Raw rows (unfiltered). */
  rows,
  /** Loading state */
  loading,
  /** Optional error message (table will render empty if present; outer pages handle error UI). */
  errorMessage,
  /** Page size options (default [3,5,10,20]) */
  pageSizes = [3, 5, 10, 20],
  /** Default page size */
  defaultPageSize = 5,
  /** IDs of columns always kept inline for filter row heuristics */
  alwaysInlineColumnIds = [],
  /** Row key field or accessor */
  rowKey = (r, idx) =>
    r?.id ?? r?.empId ?? r?.assessmentId ?? r?.skillFactoryId ?? r?.learningPathName ?? idx,
  /** Custom cell renderer: (row, columnId) => ReactNode */
  renderCell,
  /** Optional: additional top controls to render before the table (e.g., extra dropdown filters). */
  extraControls,
}) {
  const dtRef = React.useRef(null);

  // Global search
  const [globalQuery, setGlobalQuery] = React.useState("");

  // Column visibility
  const defaultVisibleIds = React.useMemo(() => columns.map((c) => c.id), [columns]);
  const [visibleColumnIds, setVisibleColumnIds] = React.useState(defaultVisibleIds);
  const [columnPanelOpen, setColumnPanelOpen] = React.useState(false);

  // Prime sort state (single sort)
  const [sortField, setSortField] = React.useState(null);
  const [sortOrder, setSortOrder] = React.useState(null); // 1 | -1 | null

  // Per-column filters (preserves project semantics)
  const [columnFilters, setColumnFilters] = React.useState({});

  // Pagination (external paginator)
  const [first, setFirst] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(defaultPageSize);

  // Responsive inline vs overflow filters
  const overlayRef = React.useRef(null);

  const visibleColumns = React.useMemo(() => {
    const set = new Set(visibleColumnIds);
    return columns.filter((c) => set.has(c.id));
  }, [columns, visibleColumnIds]);

  const facets = React.useMemo(() => {
    const out = {};
    for (const col of columns) {
      if (col.filterType !== "select" && col.filterType !== "multiselect") continue;
      const values = [];
      for (const r of rows || []) {
        const raw = getFilterValue(r, col);
        if (Array.isArray(raw)) values.push(...raw.map((v) => String(v)));
        else values.push(String(raw || ""));
      }
      out[col.id] = uniqueSorted(values.filter((v) => v && v !== "—" && v !== "-"));
    }
    return out;
  }, [rows, columns]);

  const updateColumnFilter = React.useCallback((colId, nextValue) => {
    setColumnFilters((prev) => {
      const next = { ...prev, [colId]: nextValue };
      const v = next[colId];

      // keep state tidy
      if (!v) {
        delete next[colId];
        return next;
      }
      if (v.type === "text" && !String(v.value || "").trim()) delete next[colId];
      if (v.type === "select" && !String(v.value || "").trim()) delete next[colId];
      if (v.type === "multiselect" && (!Array.isArray(v.values) || v.values.length === 0))
        delete next[colId];
      if (v.type === "numberRange" && !String(v.min || "").trim() && !String(v.max || "").trim())
        delete next[colId];
      if (v.type === "dateRange" && !v.min && !v.max) delete next[colId];

      return next;
    });
  }, []);

  const clearAll = React.useCallback(() => {
    setGlobalQuery("");
    setColumnFilters({});
    setSortField(null);
    setSortOrder(null);
    setFirst(0);
  }, []);

  const applyFiltersAndSort = React.useMemo(() => {
    const safeRows = Array.isArray(rows) ? rows : [];
    const q = globalQuery.trim().toLowerCase();

    // 1) global search across all columns (not only visible)
    const globallyFiltered = safeRows.filter((r) => {
      if (!q) return true;
      return columns.some((c) => normalizeText(getCellValue(r, c)).toLowerCase().includes(q));
    });

    // 2) per-column filters
    const columnFiltered = globallyFiltered.filter((row) => {
      for (const col of columns) {
        const f = columnFilters[col.id];
        if (!f) continue;

        const value = getFilterValue(row, col);

        if (f.type === "text") {
          const term = String(f.value || "").trim().toLowerCase();
          if (!term) continue;
          if (!normalizeText(value).toLowerCase().includes(term)) return false;
        }

        if (f.type === "select") {
          const wanted = String(f.value || "").trim();
          if (!wanted) continue;
          if (String(value || "") !== wanted) return false;
        }

        if (f.type === "multiselect") {
          const wanted = Array.isArray(f.values) ? f.values.map(String) : [];
          if (wanted.length === 0) continue;

          const set = new Set(wanted);
          if (Array.isArray(value)) {
            if (!value.some((v) => set.has(String(v)))) return false;
          } else {
            if (!set.has(String(value))) return false;
          }
        }

        if (f.type === "numberRange") {
          const n = toNumberOrNull(value);
          if (n === null) return false;
          const min = String(f.min || "").trim() ? toNumberOrNull(f.min) : null;
          const max = String(f.max || "").trim() ? toNumberOrNull(f.max) : null;
          if (min !== null && n < min) return false;
          if (max !== null && n > max) return false;
        }

        if (f.type === "dateRange") {
          const ms = toDateMsOrNull(value);
          if (ms === null) return false;
          const minMs = f.min ? toDateMsOrNull(f.min) : null;
          const maxMs = f.max ? toDateMsOrNull(f.max) : null;
          if (minMs !== null && ms < minMs) return false;
          if (maxMs !== null && ms > maxMs) return false;
        }
      }
      return true;
    });

    // 3) sort (stable, uses column sortType)
    if (!sortField || !sortOrder) return columnFiltered;

    const colDef = columns.find((c) => c.id === sortField);
    if (!colDef) return columnFiltered;

    const dir = sortOrder === -1 ? -1 : 1;

    return columnFiltered
      .map((r, idx) => ({ r, idx }))
      .sort((a, b) => {
        const vaRaw = getCellValue(a.r, colDef);
        const vbRaw = getCellValue(b.r, colDef);

        let va = vaRaw;
        let vb = vbRaw;

        if (colDef.sortType === "number") {
          va = toNumberOrNull(vaRaw);
          vb = toNumberOrNull(vbRaw);
          if (va === null) va = Number.POSITIVE_INFINITY;
          if (vb === null) vb = Number.POSITIVE_INFINITY;
        } else if (colDef.sortType === "date") {
          va = toDateMsOrNull(vaRaw);
          vb = toDateMsOrNull(vbRaw);
          if (va === null) va = Number.POSITIVE_INFINITY;
          if (vb === null) vb = Number.POSITIVE_INFINITY;
        } else {
          va = normalizeText(vaRaw).toLowerCase();
          vb = normalizeText(vbRaw).toLowerCase();
          if (va === "") va = "\uffff";
          if (vb === "") vb = "\uffff";
        }

        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return a.idx - b.idx;
      })
      .map((x) => x.r);
  }, [rows, columns, globalQuery, columnFilters, sortField, sortOrder]);

  // Reset pagination when dataset changes
  React.useEffect(() => {
    setFirst(0);
  }, [globalQuery, rowsPerPage, JSON.stringify(columnFilters), sortField, sortOrder]);

  const total = applyFiltersAndSort.length;
  const pageRows = applyFiltersAndSort.slice(first, first + rowsPerPage);

  function toggleColumn(colId) {
    setVisibleColumnIds((prev) => {
      const set = new Set(prev);
      if (set.has(colId)) set.delete(colId);
      else set.add(colId);
      if (set.size === 0) return prev; // at least one
      return Array.from(set);
    });
  }

  // Inline vs overflow filters heuristic (preserves "More filters" behavior)
  const { inlineColumns, overflowColumns } = React.useMemo(() => {
    const maxInlineFilterCount = 8;
    const alwaysInline = new Set(alwaysInlineColumnIds);

    function weight(ft) {
      if (ft === "dateRange") return 3;
      if (ft === "numberRange") return 3;
      if (ft === "multiselect") return 2;
      if (ft === "text") return 2;
      if (ft === "select") return 1;
      return 0;
    }

    const withMeta = visibleColumns.map((c, idx) => ({
      col: c,
      idx,
      w: weight(c.filterType),
      forced: alwaysInline.has(c.id),
    }));

    const forced = withMeta.filter((x) => x.forced).map((x) => x.col);
    const remaining = withMeta
      .filter((x) => !x.forced)
      .sort((a, b) => (a.w !== b.w ? a.w - b.w : a.idx - b.idx))
      .map((x) => x.col);

    const inline = [...forced];
    for (const c of remaining) {
      if (inline.length >= maxInlineFilterCount) break;
      inline.push(c);
    }

    const inlineIds = new Set(inline.map((c) => c.id));
    return {
      inlineColumns: visibleColumns.filter((c) => inlineIds.has(c.id)),
      overflowColumns: visibleColumns.filter((c) => !inlineIds.has(c.id)),
    };
  }, [visibleColumns, alwaysInlineColumnIds]);

  // Header funnel filter overlay (distinct values + Select All)
  const headerFilterOverlayRef = React.useRef(null);
  const [headerFilterColumnId, setHeaderFilterColumnId] = React.useState("");

  const headerFilterOptions = React.useMemo(() => {
    if (!headerFilterColumnId) return [];
    const col = columns.find((c) => c.id === headerFilterColumnId);
    if (!col) return [];
    if (col.filterType === "select" || col.filterType === "multiselect") return facets?.[col.id] || [];

    const values = [];
    for (const r of applyFiltersAndSort) {
      const v = getFilterValue(r, col);
      if (Array.isArray(v)) values.push(...v.map(String));
      else values.push(String(v || ""));
    }
    return uniqueSorted(values.filter(Boolean));
  }, [headerFilterColumnId, columns, facets, applyFiltersAndSort]);

  const headerSelected = React.useMemo(() => {
    if (!headerFilterColumnId) return [];
    const f = columnFilters?.[headerFilterColumnId];
    if (!f) return [];
    if (f.type === "select" && f.value) return [String(f.value)];
    if (f.type === "multiselect" && Array.isArray(f.values)) return f.values.map(String);
    return [];
  }, [headerFilterColumnId, columnFilters]);

  const headerSelectedSet = React.useMemo(() => new Set(headerSelected.map(String)), [headerSelected]);

  const allCount = headerFilterOptions.length;
  const selectedCount = headerSelectedSet.size;
  const isAllSelected = allCount > 0 && selectedCount === allCount;
  const isIndeterminate = selectedCount > 0 && selectedCount < allCount;

  function openHeaderFilter(colId, event) {
    setHeaderFilterColumnId(colId);
    headerFilterOverlayRef.current?.toggle(event);
  }

  function applyHeaderSelection(nextSelected) {
    const unique = Array.from(new Set((nextSelected || []).map((v) => String(v))));
    if (unique.length === 0) {
      updateColumnFilter(headerFilterColumnId, null);
      return;
    }
    if (unique.length === 1) updateColumnFilter(headerFilterColumnId, { type: "select", value: unique[0] });
    else updateColumnFilter(headerFilterColumnId, { type: "multiselect", values: unique });
  }

  function renderFilterControl(col, withinPopover = false) {
    if (!col.filterType) return null;

    const value = columnFilters?.[col.id];

    const wrap = (control) => {
      if (!withinPopover) return control;
      return (
        <div className="RmgPopoverFilterBlock" aria-label={`More filters ${col.label}`}>
          <div className="RmgPopoverFilterLabel">{col.label}</div>
          {control}
        </div>
      );
    };

    if (col.filterType === "text") {
      return wrap(
        <span className="p-input-icon-left" style={{ width: "100%" }}>
          <i className="pi pi-search" aria-hidden="true" />
          <InputText
            value={value?.value || ""}
            onChange={(e) => updateColumnFilter(col.id, { type: "text", value: e.target.value })}
            placeholder="Filter…"
            aria-label={`Filter ${col.label} text`}
            style={{ width: "100%" }}
            disabled={loading}
          />
        </span>
      );
    }

    if (col.filterType === "select") {
      const options = (facets?.[col.id] || []).map((v) => ({ label: v, value: v }));
      return wrap(
        <Dropdown
          value={value?.value || ""}
          options={[{ label: "All", value: "" }, ...options]}
          onChange={(e) => updateColumnFilter(col.id, { type: "select", value: e.value })}
          placeholder="All"
          aria-label={`Filter ${col.label}`}
          style={{ width: "100%" }}
          disabled={loading}
        />
      );
    }

    if (col.filterType === "multiselect") {
      const options = (facets?.[col.id] || []).map((v) => ({ label: v, value: v }));
      const selected = Array.isArray(value?.values) ? value.values : [];
      return wrap(
        <MultiSelect
          value={selected}
          options={options}
          onChange={(e) => updateColumnFilter(col.id, { type: "multiselect", values: e.value || [] })}
          placeholder="Select…"
          aria-label={`Filter ${col.label} (multi-select)`}
          display="chip"
          style={{ width: "100%" }}
          disabled={loading}
        />
      );
    }

    if (col.filterType === "numberRange") {
      return wrap(
        <div className="RmgFilterControl RmgFilterControl--range">
          <div className="RmgFilterRangeField">
            <span className="RmgFilterRangeLabel">Min</span>
            <InputText
              value={value?.min || ""}
              onChange={(e) =>
                updateColumnFilter(col.id, { type: "numberRange", min: e.target.value, max: value?.max || "" })
              }
              inputMode="numeric"
              aria-label={`Filter ${col.label} min`}
              disabled={loading}
            />
          </div>
          <div className="RmgFilterRangeField">
            <span className="RmgFilterRangeLabel">Max</span>
            <InputText
              value={value?.max || ""}
              onChange={(e) =>
                updateColumnFilter(col.id, { type: "numberRange", min: value?.min || "", max: e.target.value })
              }
              inputMode="numeric"
              aria-label={`Filter ${col.label} max`}
              disabled={loading}
            />
          </div>
        </div>
      );
    }

    if (col.filterType === "dateRange") {
      const min = value?.min ? new Date(value.min) : null;
      const max = value?.max ? new Date(value.max) : null;

      return wrap(
        <div className="RmgFilterControl RmgFilterControl--range">
          <div className="RmgFilterRangeField">
            <span className="RmgFilterRangeLabel">Start</span>
            <Calendar
              value={min}
              onChange={(e) => updateColumnFilter(col.id, { type: "dateRange", min: e.value, max })}
              dateFormat="yy-mm-dd"
              showIcon
              aria-label={`Filter ${col.label} start date`}
              disabled={loading}
            />
          </div>
          <div className="RmgFilterRangeField">
            <span className="RmgFilterRangeLabel">End</span>
            <Calendar
              value={max}
              onChange={(e) => updateColumnFilter(col.id, { type: "dateRange", min, max: e.value })}
              dateFormat="yy-mm-dd"
              showIcon
              aria-label={`Filter ${col.label} end date`}
              disabled={loading}
            />
          </div>
        </div>
      );
    }

    return null;
  }

  function headerTemplate(colDef) {
    const selected = columnFilters?.[colDef.id];
    const activeCount =
      selected?.type === "multiselect"
        ? Array.isArray(selected.values)
          ? selected.values.length
          : 0
        : selected?.type === "select" && selected.value
          ? 1
          : 0;

    const filterA11y = activeCount
      ? `${colDef.label}. Filtered by ${activeCount} value${activeCount === 1 ? "" : "s"}. Activate to edit filter.`
      : `${colDef.label}. Not filtered. Activate to filter by distinct values.`;

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
        <span style={{ fontWeight: 800 }}>{colDef.label}</span>

        <Button
          type="button"
          icon="pi pi-filter"
          className="p-button-rounded p-button-text"
          severity="secondary"
          aria-label={filterA11y}
          aria-haspopup="menu"
          onClick={(e) => {
            e.stopPropagation();
            openHeaderFilter(colDef.id, e);
          }}
        />
      </div>
    );
  }

  function bodyTemplate(row, colId) {
    return renderCell ? renderCell(row, colId) : normalizeText(getCellValue(row, columns.find((c) => c.id === colId))) || "—";
  }

  // CSV export readiness
  function exportCsv() {
    if (dtRef.current) dtRef.current.exportCSV({ selectionOnly: false });
  }

  return (
    <div className="RmgTableWrap" role="region" aria-label={title ? `${title} table` : "Data table"}>
      <div className="RmgToolbar" aria-label={`${title || "Table"} actions`}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          {title && <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{title}</h2>}
          {subtitle && <span style={{ opacity: 0.8 }}>{subtitle}</span>}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {extraControls}

          <Button
            type="button"
            label="Columns"
            icon="pi pi-table"
            className="p-button-outlined"
            onClick={() => setColumnPanelOpen((v) => !v)}
            aria-expanded={columnPanelOpen ? "true" : "false"}
            aria-controls="prime-columns-panel"
            disabled={loading}
          />

          <Button
            type="button"
            label="Reset"
            icon="pi pi-refresh"
            className="p-button-outlined"
            onClick={clearAll}
            disabled={loading}
          />

          <Button
            type="button"
            label="Export CSV"
            icon="pi pi-download"
            className="p-button-outlined"
            onClick={exportCsv}
            disabled={loading || total === 0}
            aria-label="Export table to CSV"
          />
        </div>
      </div>

      <div className="RmgOptions" aria-label="Table options">
        <div className="RmgOptionsRow" style={{ alignItems: "end" }}>
          <label className="RmgField" style={{ minWidth: 260, flex: 1 }}>
            <span className="RmgFieldLabel">Search</span>
            <span className="p-input-icon-left" style={{ width: "100%" }}>
              <i className="pi pi-search" aria-hidden="true" />
              <InputText
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                placeholder="Search any field…"
                aria-label="Global search"
                style={{ width: "100%" }}
                disabled={loading}
              />
            </span>
          </label>

          {overflowColumns.filter((c) => Boolean(c.filterType)).length > 0 && (
            <div className="RmgField" style={{ minWidth: 220 }}>
              <span className="RmgFieldLabel" style={{ display: "block" }}>
                Filters
              </span>
              <Button
                type="button"
                label={`More filters (${overflowColumns.filter((c) => Boolean(c.filterType)).length})`}
                icon="pi pi-sliders-h"
                className="p-button-outlined"
                onClick={(e) => overlayRef.current?.toggle(e)}
                aria-haspopup="dialog"
              />
              <OverlayPanel ref={overlayRef} dismissable showCloseIcon aria-label="More filters">
                <div className="RmgPopoverFiltersGrid" style={{ width: 420, maxWidth: "85vw" }}>
                  {overflowColumns
                    .filter((c) => Boolean(c.filterType))
                    .map((c) => (
                      <div key={`overflow-filter-${c.id}`} className="RmgPopoverFiltersGridItem">
                        {renderFilterControl(c, true)}
                      </div>
                    ))}
                </div>
              </OverlayPanel>
            </div>
          )}
        </div>

        {columnPanelOpen && (
          <div id="prime-columns-panel" className="RmgColumnPanel" role="region" aria-label="Column visibility">
            <div className="RmgColumnPanelHeader">
              <div className="RmgColumnPanelTitle">Visible columns</div>
              <Button
                type="button"
                label="Close"
                icon="pi pi-times"
                className="p-button-text p-button-sm"
                onClick={() => setColumnPanelOpen(false)}
                aria-label="Close column visibility panel"
              />
            </div>

            <div className="RmgColumnGrid">
              {columns.map((c) => {
                const checked = visibleColumnIds.includes(c.id);
                const isLastVisible = checked && visibleColumnIds.length === 1;

                return (
                  <label key={c.id} className="RmgCheckbox">
                    <Checkbox
                      inputId={`colvis-${c.id}`}
                      checked={checked}
                      onChange={() => toggleColumn(c.id)}
                      disabled={isLastVisible}
                      aria-label={`Toggle column ${c.label}`}
                    />
                    <span>{c.label}</span>
                  </label>
                );
              })}
            </div>

            {visibleColumnIds.length === 1 && (
              <div className="RmgHint" role="note">
                At least one column must remain visible.
              </div>
            )}
          </div>
        )}
      </div>

      <OverlayPanel ref={headerFilterOverlayRef} dismissable showCloseIcon aria-label="Column filter menu">
        <div style={{ minWidth: 320 }}>
          <div className="RmgHeaderMenuTitleRow">
            <div className="RmgHeaderMenuTitle">
              Filter: {columns.find((c) => c.id === headerFilterColumnId)?.label || "Column"}
            </div>
            <button
              type="button"
              className="RmgHeaderMenuClearBtn"
              onClick={() => applyHeaderSelection([])}
              aria-label="Clear filter"
              disabled={headerSelected.length === 0}
            >
              Clear
            </button>
          </div>

          {headerFilterOptions.length === 0 ? (
            <div className="RmgHeaderMenuEmpty" role="status">
              No values available.
            </div>
          ) : (
            <div className="RmgHeaderMenuList" role="group" aria-label="Distinct values">
              <label className="RmgHeaderMenuCheck" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => applyHeaderSelection(e.target.checked ? headerFilterOptions : [])}
                  aria-label="Select all values"
                />
                <span className="RmgHeaderMenuValue">
                  Select all <span className="RmgMono">({selectedCount}/{allCount})</span>
                </span>
              </label>

              <div style={{ marginTop: 10, maxHeight: 260, overflow: "auto", paddingRight: 4 }}>
                {headerFilterOptions.map((v) => {
                  const checked = headerSelectedSet.has(String(v));
                  return (
                    <label
                      key={`distinct-${headerFilterColumnId}-${v}`}
                      className="RmgHeaderMenuCheck"
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = new Set(headerSelectedSet);
                          if (e.target.checked) next.add(String(v));
                          else next.delete(String(v));
                          applyHeaderSelection(Array.from(next));
                        }}
                        aria-label={`Filter by ${v}`}
                      />
                      <span className="RmgHeaderMenuValue">{v}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="RmgHeaderMenuFooter" style={{ marginTop: 12 }}>
            <Button type="button" label="Done" className="p-button-sm" onClick={() => headerFilterOverlayRef.current?.hide()} />
          </div>
        </div>
      </OverlayPanel>

      <DataTable
        ref={dtRef}
        value={pageRows}
        loading={loading}
        emptyMessage={errorMessage ? "No data." : "No records found."}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={(e) => {
          setSortField(e.sortField || null);
          setSortOrder(e.sortOrder || null);
        }}
        removableSort
        showGridlines
        stripedRows
        scrollable
        scrollHeight="flex"
        className="p-datatable-sm"
      >
        {visibleColumns.map((c) => (
          <Column
            key={c.id}
            field={c.id}
            header={headerTemplate(c)}
            sortable
            sortField={c.id}
            body={(rowData) => bodyTemplate(rowData, c.id)}
          />
        ))}
      </DataTable>

      <div className="RmgOptionsRow RmgOptionsRow--meta" aria-label="Table meta" style={{ marginTop: 12 }}>
        <div className="RmgMetaText" aria-live="polite">
          Showing <strong>{total === 0 ? 0 : first + 1}</strong>–<strong>{Math.min(first + rowsPerPage, total)}</strong> of{" "}
          <strong>{total}</strong>
        </div>

        <div style={{ marginLeft: "auto" }}>
          <Paginator
            first={first}
            rows={rowsPerPage}
            totalRecords={total}
            rowsPerPageOptions={pageSizes}
            onPageChange={(e) => {
              setFirst(e.first);
              setRowsPerPage(e.rows);
            }}
            template="RowsPerPageDropdown PrevPageLink PageLinks NextPageLink"
            aria-label="Pagination controls"
          />
        </div>
      </div>

      <div className="RmgFilterRowActions" aria-label="Column filters" style={{ marginTop: 12 }}>
        <div
          className="RmgPopoverFiltersGrid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {inlineColumns
            .filter((c) => Boolean(c.filterType))
            .map((c) => (
              <div key={`inline-filter-${c.id}`} className="RmgPopoverFiltersGridItem">
                {renderFilterControl(c, true)}
              </div>
            ))}
        </div>
      </div>

      {(globalQuery.trim() || Object.keys(columnFilters).length > 0) && (
        <div style={{ marginTop: 12 }} aria-label="Active filters">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {globalQuery.trim() && (
              <Chip label={`Search: ${globalQuery.trim()}`} removable onRemove={() => setGlobalQuery("")} />
            )}

            {Object.entries(columnFilters).map(([colId, f]) => {
              const col = columns.find((c) => c.id === colId);
              const labelBase = col?.label || colId;

              let vLabel = "";
              if (f.type === "text") vLabel = String(f.value || "");
              if (f.type === "select") vLabel = String(f.value || "");
              if (f.type === "multiselect") vLabel = Array.isArray(f.values) ? f.values.join(", ") : "";
              if (f.type === "numberRange") vLabel = `${f.min || "…"} to ${f.max || "…"}`;
              if (f.type === "dateRange") {
                const min = f.min instanceof Date ? f.min.toISOString().slice(0, 10) : f.min ? new Date(f.min).toISOString().slice(0, 10) : "…";
                const max = f.max instanceof Date ? f.max.toISOString().slice(0, 10) : f.max ? new Date(f.max).toISOString().slice(0, 10) : "…";
                vLabel = `${min} to ${max}`;
              }

              return (
                <Chip
                  key={`filter-chip-${colId}`}
                  label={`${labelBase}: ${vLabel || "…"}`}
                  removable
                  onRemove={() => updateColumnFilter(colId, null)}
                />
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: 10, opacity: 0.75, fontSize: 12 }}>
        <Tag
          value="CSV export ready"
          severity="info"
          style={{
            background: "rgba(3, 78, 161, 0.12)",
            color: "#0f172a",
            border: "1px solid rgba(3, 78, 161, 0.18)",
          }}
        />
      </div>
    </div>
  );
}
