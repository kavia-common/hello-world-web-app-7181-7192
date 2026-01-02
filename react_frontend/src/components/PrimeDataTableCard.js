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

/**
 * Uses ResizeObserver to watch for element size changes.
 * We keep this hook in-file because it's tightly coupled with table layout behavior.
 */
function useResizeObserver(ref, onResize) {
  React.useEffect(() => {
    const el = ref?.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(() => onResize?.());
    ro.observe(el);

    return () => ro.disconnect();
  }, [ref, onResize]);
}

/**
 * Measures the "natural" table content width and compares it to the card container width.
 * Strategy:
 * - Prefer horizontal scroll always (never clip).
 * - If the table is *very* wide (exceeds zoomThresholdPx), apply a scale-down transform to keep
 *   more columns visible within the viewport.
 * - When scaling is active, show a small zoom control (+ / - / reset) for accessibility/usability.
 *
 * Notes:
 * - Scaling is applied to an inner wrapper with transform-origin: top left, so sticky header logic
 *   remains stable inside the DataTable's own scroll container (Prime manages vertical scroll).
 * - We avoid nesting vertical scrolling; only horizontal overflow is at the card level.
 */
function useTableAutoScale({
  containerRef,
  contentRef,
  zoomThresholdPx = 1300,
  minScale = 0.7,
  maxScale = 1,
  step = 0.05,
}) {
  const [naturalWidth, setNaturalWidth] = React.useState(0);
  const [containerWidth, setContainerWidth] = React.useState(0);

  const [isScalingActive, setIsScalingActive] = React.useState(false);
  const [scale, setScale] = React.useState(1);

  const recalc = React.useCallback(() => {
    const containerEl = containerRef?.current;
    const contentEl = contentRef?.current;
    if (!containerEl || !contentEl) return;

    // container width for "available viewport space" within the card
    const cw = Math.floor(containerEl.clientWidth || 0);

    // The *natural* width of the inner content (unscaled). We measure scrollWidth.
    const nw = Math.floor(contentEl.scrollWidth || 0);

    setContainerWidth(cw);
    setNaturalWidth(nw);
  }, [containerRef, contentRef]);

  useResizeObserver(containerRef, recalc);
  useResizeObserver(contentRef, recalc);

  React.useEffect(() => {
    // Initial calc after mount and after first paint.
    const t = window.setTimeout(() => recalc(), 0);
    return () => window.clearTimeout(t);
  }, [recalc]);

  React.useEffect(() => {
    // Decide whether scaling should be active based on the natural width threshold.
    const shouldScale = naturalWidth > zoomThresholdPx;

    setIsScalingActive(shouldScale);

    // When scaling becomes active, compute a sensible default scale that tries to fit width.
    // We clamp to minScale..1 to avoid unreadably small tables.
    if (shouldScale && containerWidth > 0 && naturalWidth > 0) {
      const fit = containerWidth / naturalWidth;
      const next = Math.max(minScale, Math.min(maxScale, fit));
      setScale(next);
      return;
    }

    // When scaling turns off, restore to 1.
    if (!shouldScale) setScale(1);
  }, [naturalWidth, containerWidth, zoomThresholdPx, minScale, maxScale]);

  const zoomIn = React.useCallback(() => {
    setScale((s) => Math.min(maxScale, Math.round((s + step) * 100) / 100));
  }, [maxScale, step]);

  const zoomOut = React.useCallback(() => {
    setScale((s) => Math.max(minScale, Math.round((s - step) * 100) / 100));
  }, [minScale, step]);

  const resetZoom = React.useCallback(() => {
    // Reset to the computed "fit" scale when scaling is active; else reset to 1.
    if (isScalingActive && containerWidth > 0 && naturalWidth > 0) {
      const fit = containerWidth / naturalWidth;
      const next = Math.max(minScale, Math.min(maxScale, fit));
      setScale(next);
      return;
    }
    setScale(1);
  }, [isScalingActive, containerWidth, naturalWidth, minScale, maxScale]);

  return {
    recalc,
    naturalWidth,
    containerWidth,
    isScalingActive,
    scale,
    zoomIn,
    zoomOut,
    resetZoom,
    minScale,
    maxScale,
  };
}

function ZoomControls({ isVisible, scale, onZoomIn, onZoomOut, onReset, minScale, maxScale }) {
  if (!isVisible) return null;

  const percent = Math.round(scale * 100);

  const onKeyDown = (e, action) => {
    // Provide explicit keyboard support in addition to button semantics.
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="RmgTableZoomBar" role="group" aria-label="Table zoom controls">
      <span className="RmgTableZoomLabel" aria-label={`Table zoom ${percent} percent`}>
        Zoom: <strong>{percent}%</strong>
      </span>

      <button
        type="button"
        className="RmgZoomBtn"
        onClick={onZoomOut}
        onKeyDown={(e) => onKeyDown(e, onZoomOut)}
        aria-label="Zoom out table"
        title={`Zoom out (min ${Math.round(minScale * 100)}%)`}
        disabled={scale <= minScale + 0.001}
      >
        −
      </button>

      <button
        type="button"
        className="RmgZoomBtn"
        onClick={onZoomIn}
        onKeyDown={(e) => onKeyDown(e, onZoomIn)}
        aria-label="Zoom in table"
        title={`Zoom in (max ${Math.round(maxScale * 100)}%)`}
        disabled={scale >= maxScale - 0.001}
      >
        +
      </button>

      <button
        type="button"
        className="RmgZoomBtn RmgZoomBtn--reset"
        onClick={onReset}
        onKeyDown={(e) => onKeyDown(e, onReset)}
        aria-label="Reset table zoom"
        title="Reset zoom"
      >
        Reset
      </button>
    </div>
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
   * Responsive behavior tuning:
   * - When the natural table width exceeds this threshold (px), enable scaling + zoom controls.
   * - Keep it between ~1200–1400px per requirements; default = 1300.
   */
  zoomThresholdPx = 1300,
}) {
  const dtRef = React.useRef(null);

  // Wrapper (card) that determines the usable viewport width.
  const containerRef = React.useRef(null);
  // Inner content wrapper used to measure natural width; scaling is applied to the scaled wrapper.
  const contentRef = React.useRef(null);

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

  const {
    isScalingActive,
    scale,
    zoomIn,
    zoomOut,
    resetZoom,
    minScale,
    maxScale,
  } = useTableAutoScale({
    containerRef,
    contentRef,
    zoomThresholdPx,
    minScale: 0.7,
    maxScale: 1,
    step: 0.05,
  });

  return (
    <div
      className="RmgTableWrap"
      role="region"
      aria-label={title ? `${title} table` : "Data table"}
      ref={containerRef}
      data-scaling={isScalingActive ? "true" : "false"}
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

      <ZoomControls
        isVisible={isScalingActive}
        scale={scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetZoom}
        minScale={minScale}
        maxScale={maxScale}
      />

      {/* Horizontal scroll is managed by the card; Prime manages vertical scroll inside wrapper. */}
      <div className="RmgTableViewport">
        {/* contentRef measures natural width; scale is applied to the scaled wrapper */}
        <div ref={contentRef} className="RmgTableMeasure">
          <div
            className="RmgTableScaled"
            style={{
              transform: isScalingActive ? `scale(${scale})` : "none",
              transformOrigin: "top left",
              // Important: keep layout stable when scaled so overflow-x scrolling works as expected.
              width: isScalingActive && scale > 0 ? `${100 / scale}%` : "100%",
            }}
          >
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
          </div>
        </div>
      </div>

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
