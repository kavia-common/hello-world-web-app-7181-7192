import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { Toast } from "primereact/toast";
import { uploadTableFile } from "../api/upload";

/**
 * PrimeReact DataTable wrapper that uses PrimeReact built-ins:
 * - Built-in pagination (paginator)
 * - Built-in sorting (sortable columns)
 * - Built-in per-column filters (row filter UI)
 *
 * Product requirement:
 * - Wrap the table toolbar (global search + CSV + Upload) and the DataTable in a single unified card.
 * - Keep icon-only global search + CSV controls with tooltips.
 * - Add icon-only Upload control with tooltip to every table.
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

function isAllowedUploadFile(file) {
  if (!file) return false;
  const name = String(file.name || "").toLowerCase();
  // Allow by extension (most reliable across browsers)
  return name.endsWith(".xlsx") || name.endsWith(".csv");
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
  /**
   * Upload endpoint path (relative to REACT_APP_API_BASE / REACT_APP_BACKEND_URL).
   * Example: "/uploads/rmg-tracker"
   */
  uploadEndpointPath,
  /**
   * When false, hides the unified toolbar row (global search + CSV + upload).
   * Default true to avoid affecting existing pages.
   */
  showUnifiedToolbar = true,
}) {
  /** Shared table component used across pages. Provides consistent layout + Prime defaults. */
  const dtRef = React.useRef(null);
  const toastRef = React.useRef(null);
  const uploadInputRef = React.useRef(null);

  const [isUploading, setIsUploading] = React.useState(false);

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

  function openUploadPicker() {
    if (uploadInputRef.current) {
      uploadInputRef.current.click();
    }
  }

  async function handleUploadFilesSelected(e) {
    const files = Array.from(e?.target?.files || []);
    // Allow selecting the same file again later
    if (uploadInputRef.current) uploadInputRef.current.value = "";

    if (!uploadEndpointPath) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Upload not configured",
        detail: "Missing upload endpoint for this table.",
        life: 3500,
      });
      return;
    }

    if (!files.length) return;

    // Support selecting multiple, but we upload sequentially to keep UX predictable.
    const invalid = files.filter((f) => !isAllowedUploadFile(f));
    if (invalid.length) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Unsupported file type",
        detail: "Please upload a .xlsx or .csv file.",
        life: 3500,
      });
      return;
    }

    setIsUploading(true);
    try {
      for (const file of files) {
        await uploadTableFile({ endpointPath: uploadEndpointPath, file });
      }

      toastRef.current?.show({
        severity: "success",
        summary: "Upload complete",
        detail: files.length === 1 ? `Uploaded ${files[0].name}` : `Uploaded ${files.length} files`,
        life: 3500,
      });
    } catch (err) {
      toastRef.current?.show({
        severity: "error",
        summary: "Upload failed",
        detail: err?.message || "Could not upload file. Please try again.",
        life: 5000,
      });
    } finally {
      setIsUploading(false);
    }
  }

  const showHeaderBar = Boolean(title || subtitle);

  return (
    <div className="RmgTableWrap" role="region" aria-label={title ? `${title} table` : "Data table"}>
      {/* Toast for upload success/error. (Rendered per card to avoid plumbing a global singleton.) */}
      <Toast ref={toastRef} position="top-right" />

      {/* Hidden file input (triggered by icon-only Upload button) */}
      <input
        ref={uploadInputRef}
        type="file"
        accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        style={{ display: "none" }}
        onChange={handleUploadFilesSelected}
        multiple
      />

      {/* Unified inner card to ensure toolbar + controls + table share one surface */}
      <div className="RmgTableCard" aria-label={title ? `${title} card` : "Table card"}>
        {/* Compact controls row: icon-only global search + Upload + CSV download */}
        {showUnifiedToolbar && (
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
                  disabled={loading || isUploading}
                />
              </span>

              <Button
                type="button"
                icon="pi pi-search"
                className="p-button-outlined p-button-icon-only RmgIconButton"
                onClick={applyGlobalSearch}
                disabled={loading || isUploading}
                aria-label="Apply global search"
                tooltip="Search"
                tooltipOptions={{ position: "top" }}
              />

              <Button
                type="button"
                icon={isUploading ? "pi pi-spin pi-spinner" : "pi pi-upload"}
                className="p-button-outlined p-button-icon-only RmgIconButton"
                onClick={openUploadPicker}
                disabled={loading || isUploading || !uploadEndpointPath}
                aria-label="Upload Excel/CSV"
                tooltip={uploadEndpointPath ? "Upload (Excel/CSV)" : "Upload not configured"}
                tooltipOptions={{ position: "top" }}
              />
            </div>

            <div className="RmgTableControls-right">
              <Button
                type="button"
                icon="pi pi-download"
                className="p-button-outlined p-button-icon-only RmgIconButton"
                onClick={exportCsv}
                disabled={loading || isUploading || !Array.isArray(rows) || rows.length === 0}
                aria-label="Download CSV"
                tooltip="Download CSV"
                tooltipOptions={{ position: "top" }}
              />
            </div>
          </div>
        )}

        <DataTable
          ref={dtRef}
          value={Array.isArray(rows) ? rows : []}
          loading={loading || isUploading}
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
