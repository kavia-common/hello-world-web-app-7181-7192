import React from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

/**
 * Unified table toolbar used above all PrimeReact DataTables.
 * - Icon-only actions with tooltips (Search, Download CSV, Upload)
 * - Preserves compact look and matches the "glassy/rounded" theme via shared CSS classes
 */

// PUBLIC_INTERFACE
export default function RmgTableControls({
  /** Current global search input value. */
  globalFilterValue,
  /** Setter for global search value. */
  onGlobalFilterChange,
  /** Called when user wants to "apply" search (Enter key or Search icon). */
  onApplySearch,
  /** Called to download/export CSV. */
  onExportCsv,
  /** Called to open the file picker (upload). */
  onOpenUpload,
  /** True when table is loading. */
  loading = false,
  /** True when upload is in progress. */
  isUploading = false,
  /** If false, disables Upload button and shows "Upload not configured" tooltip. */
  canUpload = true,
}) {
  function handleSearchKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      onApplySearch?.();
    }
  }

  const disabled = Boolean(loading || isUploading);

  return (
    <div className="RmgTableControls" aria-label="Table controls">
      <div className="RmgTableControls-left">
        <span className="p-input-icon-left RmgTableSearch">
          <i className="pi pi-search" aria-hidden="true" />
          <InputText
            value={globalFilterValue}
            onChange={(e) => onGlobalFilterChange?.(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search…"
            aria-label="Global search"
            disabled={disabled}
          />
        </span>

        <Button
          type="button"
          icon="pi pi-search"
          className="p-button-outlined p-button-icon-only RmgIconButton"
          onClick={onApplySearch}
          disabled={disabled}
          aria-label="Search"
          tooltip="Search"
          tooltipOptions={{ position: "top" }}
        />

        <Button
          type="button"
          icon={isUploading ? "pi pi-spin pi-spinner" : "pi pi-upload"}
          className="p-button-outlined p-button-icon-only RmgIconButton"
          onClick={onOpenUpload}
          disabled={disabled || !canUpload}
          aria-label="Upload"
          tooltip={canUpload ? "Upload (Excel/CSV)" : "Upload not configured"}
          tooltipOptions={{ position: "top" }}
        />
      </div>

      <div className="RmgTableControls-right">
        <Button
          type="button"
          icon="pi pi-download"
          className="p-button-outlined p-button-icon-only RmgIconButton"
          onClick={onExportCsv}
          disabled={disabled}
          aria-label="Download CSV"
          tooltip="Download CSV"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    </div>
  );
}
