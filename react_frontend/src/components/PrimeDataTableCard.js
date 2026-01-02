import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";

/**
 * PrimeReact DataTable wrapper that intentionally uses PrimeReact defaults:
 * - Built-in pagination (paginator)
 * - Built-in sorting (sortable columns)
 *
 * NOTE: Filtering UI (global + per-column filters) has been intentionally removed/disabled
 * per product requirements. Sorting and pagination remain enabled.
 *
 * This replaces previous legacy/custom table logic (external paginator, overlay filters,
 * custom sort/search handling).
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
}) {
  const dtRef = React.useRef(null);

  const visibleColumns = React.useMemo(() => {
    return Array.isArray(columns) ? columns : [];
  }, [columns]);

  function clearAll() {
    // Intentionally no DataTable filter state to clear anymore.
    // Kept for UX consistency (the reset icon still exists in the toolbar).
  }

  function exportCsv() {
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

            <Button
              type="button"
              icon="pi pi-download"
              className="p-button-outlined p-button-icon-only"
              onClick={exportCsv}
              disabled={loading || !Array.isArray(rows) || rows.length === 0}
              aria-label="Export table to CSV"
              tooltip="Export CSV"
              tooltipOptions={{ position: "top" }}
            />
          </div>
        </div>
      )}

      {/* Filter UI intentionally removed (no global search input, no column filter row). */}

      <DataTable
        ref={dtRef}
        value={Array.isArray(rows) ? rows : []}
        loading={loading}
        emptyMessage={errorMessage ? "No data." : "No records found."}
        dataKey="__internalKey"
        rowKey={(rowData) => rowKey(rowData)}
        paginator
        rows={defaultPageSize}
        rowsPerPageOptions={pageSizes}
        removableSort
        showGridlines
        stripedRows
        scrollable
        /*
          Critical for header/body alignment + sticky headers:
          - Provide a real scroll container height so Prime can compute column widths consistently.
          - `scrollHeight="flex"` can cause transient width calc mismatches when the parent has
            its own scrolling / overflow rules.
        */
        scrollHeight="60vh"
        className="p-datatable-sm RmgPrimeDataTable"
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
