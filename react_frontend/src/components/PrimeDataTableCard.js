import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";

/**
 * PrimeReact DataTable wrapper that intentionally uses PrimeReact defaults:
 * - Built-in pagination (paginator)
 * - Built-in sorting (sortable columns)
 *
 * Product requirement:
 * - Keep per-column filters disabled.
 * - Add a compact global search control + CSV download button before each table.
 *
 * This component is shared by multiple pages (RMG Tracker, Skill Factories, Learning Paths,
 * and Assessments). Any layout improvements made here apply across those screens.
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
  /** Optional: additional top controls to render before the table (e.g., extra dropdown filters). */
  extraControls,
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
   * PrimeReact DataTable global filtering is driven by:
   * - `filters={{ global: { value, matchMode } }}`
   * - `globalFilterFields=[...]`
   */
  const [globalFilterValue, setGlobalFilterValue] = React.useState("");
  const [filters, setFilters] = React.useState({ global: { value: "", matchMode: "contains" } });

  const derivedGlobalFields = React.useMemo(() => {
    if (Array.isArray(globalSearchFields) && globalSearchFields.length > 0) {
      return globalSearchFields;
    }
    // Default: search across the column ids (which match row fields).
    // This covers the majority of the mocked datasets used in the pages.
    return visibleColumns.map((c) => c.id);
  }, [globalSearchFields, visibleColumns]);

  function clearAll() {
    // Clear the global filter (per-column filters remain disabled).
    setGlobalFilterValue("");
    setFilters({ global: { value: "", matchMode: "contains" } });
  }

  function exportCsv() {
    // PrimeReact exportCSV exports the currently visible dataset (after sorting/filtering),
    // which matches the requirement "export currently visible rows/columns".
    if (dtRef.current) dtRef.current.exportCSV({ selectionOnly: false });
  }

  function bodyTemplate(row, colId) {
    if (typeof renderCell === "function") return renderCell(row, colId);
    const col = visibleColumns.find((c) => c.id === colId);
    const value =
      typeof col?.accessor === "function" ? col.accessor(row) : row?.[colId];
    return normalizeText(value) || "—";
  }

  const showHeaderBar = Boolean(title || subtitle || extraControls);

  // PUBLIC_INTERFACE
  function applyGlobalSearch() {
    /** Apply the current global search input to the PrimeReact DataTable global filter. */
    setFilters({ global: { value: globalFilterValue, matchMode: "contains" } });
  }

  function handleSearchKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      applyGlobalSearch();
    }
  }

  return (
    <div
      className="RmgTableWrap"
      role="region"
      aria-label={title ? `${title} table` : "Data table"}
    >
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
            {title && (
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>
                {title}
              </h2>
            )}
            {subtitle && <span style={{ opacity: 0.8 }}>{subtitle}</span>}
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {extraControls}

            <Button
              type="button"
              icon="pi pi-refresh"
              className="p-button-outlined p-button-icon-only"
              onClick={clearAll}
              aria-label="Reset table"
              tooltip="Reset"
              tooltipOptions={{ position: "top" }}
              disabled={loading}
            />
          </div>
        </div>
      )}

      {/* Compact controls row: global search + Search button + CSV download */}
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
        globalFilterFields={derivedGlobalFields}
      >
        {visibleColumns.map((c) => (
          <Column
            key={c.id}
            field={c.id}
            header={c.label}
            sortable={c.sortable !== false}
            body={(rowData) => bodyTemplate(rowData, c.id)}
          />
        ))}
      </DataTable>

      <div style={{ marginTop: 10, opacity: 0.75, fontSize: 12 }}>
        <Tag
          value="PrimeReact defaults (paginator + sort)"
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
