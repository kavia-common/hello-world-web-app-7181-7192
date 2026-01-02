import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { FilterMatchMode } from "primereact/api";

/**
 * PrimeReact DataTable wrapper that intentionally uses PrimeReact defaults:
 * - Built-in pagination (paginator)
 * - Built-in sorting (sortable columns)
 * - Built-in column filters (filter + filterDisplay="row")
 * - Built-in global filtering (globalFilterFields + globalFilter value)
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
  return row?.id ?? row?.empId ?? row?.assessmentId ?? row?.skillFactoryId ?? row?.learningPathName ?? idx;
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

  // Global search (Prime uses `globalFilter` + `globalFilterFields`)
  const [globalQuery, setGlobalQuery] = React.useState("");

  // Prime filter state (DataTable expects an object keyed by field name)
  const [filters, setFilters] = React.useState(() => ({
    global: { value: "", matchMode: FilterMatchMode.CONTAINS },
  }));

  // Keep filters.global synced with the Search input
  React.useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      global: { value: globalQuery || "", matchMode: FilterMatchMode.CONTAINS },
    }));
  }, [globalQuery]);

  const visibleColumns = React.useMemo(() => {
    return Array.isArray(columns) ? columns : [];
  }, [columns]);

  const globalFilterFields = React.useMemo(() => {
    // Prime global filter works best with actual string field names. For columns that only
    // have computed accessors, global filtering won't include those (by design).
    return visibleColumns.map((c) => c.id).filter(Boolean);
  }, [visibleColumns]);

  function clearAll() {
    setGlobalQuery("");
    setFilters({
      global: { value: "", matchMode: FilterMatchMode.CONTAINS },
    });
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
            icon="pi pi-refresh"
            className="p-button-outlined p-button-icon-only"
            onClick={clearAll}
            aria-label="Reset table filters"
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

      <div className="RmgOptions" aria-label="Table options">
        <div className="RmgOptionsRow" style={{ alignItems: "end" }}>
          <label className="RmgField" style={{ minWidth: 260, flex: 1 }}>
            <span className="RmgFieldLabel">Search</span>
            <span className="p-input-icon-left" style={{ width: "100%" }}>
              <i className="pi pi-search" aria-hidden="true" />
              <InputText
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                placeholder="Search…"
                aria-label="Global search"
                style={{ width: "100%" }}
                disabled={loading}
              />
            </span>
          </label>
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
        rows={defaultPageSize}
        rowsPerPageOptions={pageSizes}
        filters={filters}
        onFilter={(e) => setFilters(e.filters)}
        filterDisplay="row"
        globalFilterFields={globalFilterFields}
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
            filter
            filterPlaceholder={`Filter ${c.label}…`}
            showFilterMenu={false}
            body={(rowData) => bodyTemplate(rowData, c.id)}
          />
        ))}
      </DataTable>

      <div style={{ marginTop: 10, opacity: 0.75, fontSize: 12 }}>
        <Tag
          value="PrimeReact defaults (paginator + filters + sort + search)"
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
