import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";

/**
 * PrimeReact DataTable wrapper that uses PrimeReact built-ins:
 * - Built-in pagination (paginator)
 * - Built-in sorting (sortable columns)
 * - Built-in per-column filters (row filter UI)
 *
 * Product requirement:
 * - Wrap the table toolbar (global search + CSV) and the DataTable in a single unified card.
 * - Keep icon-only global search + CSV controls with tooltips.
 * - Preserve current behaviors: compact sticky headers, bottom-only paginator,
 *   per-column filters in header row, horizontal scrolling (no zoom),
 *   intrinsic/max-content column sizing, tightened vertical spacing.
 *
 * This component is shared by multiple pages. Any improvements made here apply across
 * those screens.
 */

/** Small helper: safe text normalization for display fallbacks */
function normalizeText(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function defaultRowKey(row, idx) {
  return (
    row?.id ??
    row?.empId ??
    row?.assessmentId ??
    row?.skillFactoryId ??
    row?.learningPathName ??
    idx
  );
}

function getDefaultMatchModeForValue(sampleValue) {
  if (typeof sampleValue === "number") return FilterMatchMode.EQUALS;
  if (typeof sampleValue === "boolean") return FilterMatchMode.EQUALS;
  return FilterMatchMode.CONTAINS;
}

function buildInitialColumnFilters({ columns, rows }) {
  const safeColumns = Array.isArray(columns) ? columns : [];
  const safeRows = Array.isArray(rows) ? rows : [];
  const sample = safeRows[0] || {};

  const next = { global: { value: "", matchMode: FilterMatchMode.CONTAINS } };

  // Use column.id as the field key (matches `field` passed to <Column/>).
  // We default all column filters to text-ish CONTAINS unless the sample value is numeric/boolean.
  for (const c of safeColumns) {
    const sampleValue = sample?.[c.id];
    next[c.id] = { value: null, matchMode: getDefaultMatchModeForValue(sampleValue) };
  }

  return next;
}

// PUBLIC_INTERFACE
export default function PrimeDataTableCard({
  /** Card title above the table. */
  title,
  /** Optional subtitle text. */
  subtitle,
  /** Column definitions. Each column should have: { id, label, accessor?, body?, sortable? } */
  columns,
  /** Row data array. */
  rows,
  /** Loading state */
  loading,
  /** Optional error message (shown via emptyMessage) */
  errorMessage,
  /** Page size options (default [5,10,20,50]) */
  pageSizes = [5, 10, 20, 50],
  /** Default page size */
  defaultPageSize = 10,
  /** Row key field or accessor */
  rowKey = defaultRowKey,
  /** Custom cell renderer: (row, columnId) => ReactNode */
  renderCell,
  /**
   * Optional override: which fields are included in global search.
   * If not provided, we will derive it from `columns` (using column.id).
   */
  globalSearchFields,
}) {
  /** Shared table component used across pages. Provides consistent layout + Prime defaults. */
  const dtRef = React.useRef(null);

  const visibleColumns = React.useMemo(() => {
    return Array.isArray(columns) ? columns : [];
  }, [columns]);

  /**
   * PrimeReact DataTable filtering is driven by:
   * - `filters` object (global + per-column)
   * - `onFilter` event
   */
  const [globalFilterValue, setGlobalFilterValue] = React.useState("");
  const [filters, setFilters] = React.useState(() =>
    buildInitialColumnFilters({ columns: visibleColumns, rows })
  );

  // If column definitions change (or initial dataset shape changes), ensure we have keys for each column.
  React.useEffect(() => {
    setFilters((prev) => {
      const next = { ...(prev || {}) };

      // Always keep global.
      if (!next.global) next.global = { value: "", matchMode: FilterMatchMode.CONTAINS };

      const sample = Array.isArray(rows) && rows.length > 0 ? rows[0] : {};
      for (const c of visibleColumns) {
        if (!next[c.id]) {
          next[c.id] = {
            value: null,
            matchMode: getDefaultMatchModeForValue(sample?.[c.id]),
          };
        }
      }

      return next;
    });
  }, [visibleColumns, rows]);

  const derivedGlobalFields = React.useMemo(() => {
    if (Array.isArray(globalSearchFields) && globalSearchFields.length > 0) {
      return globalSearchFields;
    }
    // Default: search across the column ids (which match row fields).
    return visibleColumns.map((c) => c.id);
  }, [globalSearchFields, visibleColumns]);

  function clearAll() {
    // Clear global + per-column filters (built-in row filter UI).
    setGlobalFilterValue("");
    setFilters(buildInitialColumnFilters({ columns: visibleColumns, rows }));
  }

  function exportCsv() {
    // PrimeReact exportCSV exports the currently visible dataset (after sorting/filtering).
    if (dtRef.current) dtRef.current.exportCSV({ selectionOnly: false });
  }

  function bodyTemplate(row, colId) {
    if (typeof renderCell === "function") return renderCell(row, colId);
    const col = visibleColumns.find((c) => c.id === colId);
    const value = typeof col?.accessor === "function" ? col.accessor(row) : row?.[colId];
    return normalizeText(value) || "—";
  }

  // PUBLIC_INTERFACE
  function applyGlobalSearch() {
    /** Apply the current global search input to the PrimeReact DataTable global filter. */
    setFilters((prev) => ({
      ...(prev || {}),
      global: { value: globalFilterValue, matchMode: FilterMatchMode.CONTAINS },
    }));
  }

  function handleSearchKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      applyGlobalSearch();
    }
  }

  const showHeaderBar = Boolean(title || subtitle);

  return (
    <div
      className="RmgTableWrap"
      role="region"
      aria-label={title ? `${title} table` : "Data table"}
    >
      {/* Unified inner card to ensure toolbar + controls + table share one surface */}
      <div className="RmgTableCard" aria-label={title ? `${title} card` : "Table card"}>
        {showHeaderBar && (
          <div className="RmgToolbar" aria-label={`${title || "Table"} actions`}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              {title && <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{title}</h2>}
              {subtitle && <span style={{ opacity: 0.8 }}>{subtitle}</span>}
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <Button
                type="button"
                icon="pi pi-filter-slash"
                className="p-button-outlined p-button-icon-only RmgIconButton"
                onClick={clearAll}
                aria-label="Reset filters"
                tooltip="Reset filters"
                tooltipOptions={{ position: "top" }}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Compact controls row: icon-only global search + CSV download */}
        <div className="RmgTableControls" aria-label="Table controls">
          <div className="RmgTableControls-left">
            <span className="p-input-icon-left RmgTableSearch">
              <i className="pi pi-search" aria-hidden="true" />
              <InputText
                value={globalFilterValue}
                onChange={(e) => setGlobalFilterValue(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search…"
                aria-label="Global search"
                disabled={loading}
              />
            </span>

            <Button
              type="button"
              icon="pi pi-search"
              className="p-button-outlined p-button-icon-only RmgIconButton"
              onClick={applyGlobalSearch}
              disabled={loading}
              aria-label="Apply global search"
              tooltip="Search"
              tooltipOptions={{ position: "top" }}
            />
          </div>

          <div className="RmgTableControls-right">
            <Button
              type="button"
              icon="pi pi-download"
              className="p-button-outlined p-button-icon-only RmgIconButton"
              onClick={exportCsv}
              disabled={loading || !Array.isArray(rows) || rows.length === 0}
              aria-label="Download CSV"
              tooltip="Download CSV"
              tooltipOptions={{ position: "top" }}
            />
          </div>
        </div>

        <DataTable
          ref={dtRef}
          value={Array.isArray(rows) ? rows : []}
          loading={loading}
          emptyMessage={errorMessage ? "No data." : "No records found."}
          dataKey="__internalKey"
          rowKey={(rowData) => rowKey(rowData)}
          paginator
          paginatorPosition="bottom"
          rows={defaultPageSize}
          rowsPerPageOptions={pageSizes}
          removableSort
          showGridlines
          stripedRows
          scrollable
          /*
            Critical for header/body alignment + sticky headers:
            - Provide a real scroll container height so Prime can compute column widths consistently.
          */
          scrollHeight="60vh"
          className="p-datatable-sm RmgPrimeDataTable"
          filters={filters}
          onFilter={(e) => setFilters(e.filters)}
          filterDisplay="row"
          globalFilterFields={derivedGlobalFields}
        >
          {visibleColumns.map((c) => (
            <Column
              key={c.id}
              field={c.id}
              header={c.label}
              sortable={c.sortable !== false}
              filter
              showFilterMenu={false}
              filterPlaceholder="Filter…"
              body={(rowData) => bodyTemplate(rowData, c.id)}
            />
          ))}
        </DataTable>
      </div>
    </div>
  );
}
