import React from "react";
import FocusTrap from "focus-trap-react";

/**
 * Accessible popover for rendering overflow/dense filter controls.
 * - Focus-trapped while open
 * - Esc closes
 * - Click outside (overlay) closes
 * - Returns focus to the trigger button on close
 */

// PUBLIC_INTERFACE
export default function MoreFiltersPopover({
  /** Whether popover is open. */
  open,
  /** Called when popover should close (overlay click, Esc, close button). */
  onClose,
  /** id of trigger button to return focus to after close. */
  returnFocusToId,
  /** Accessible label for the dialog. */
  ariaLabel = "More filters",
  /** Popover content (usually filter controls). */
  children,
}) {
  /** Accessible popover for overflow filters, with focus trap and keyboard support. */
  const panelRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  React.useEffect(() => {
    if (open) return undefined;

    // Return focus to trigger after close (prevents keyboard users from "losing" focus).
    if (returnFocusToId) {
      const el = document.getElementById(returnFocusToId);
      if (el && typeof el.focus === "function") el.focus();
    }
    return undefined;
  }, [open, returnFocusToId]);

  if (!open) return null;

  return (
    <div className="RmgMoreFiltersOverlay" role="presentation" onMouseDown={() => onClose?.()}>
      <FocusTrap
        focusTrapOptions={{
          // Let our outside click handler close the popover.
          clickOutsideDeactivates: true,
          // We'll handle Esc ourselves so the close callback always runs.
          escapeDeactivates: false,
          // Prefer focusing the panel itself; controls inside can be tabbed to.
          initialFocus: () => panelRef.current,
        }}
      >
        <div
          className="RmgMoreFiltersPanel"
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          ref={panelRef}
          tabIndex={-1}
          // Prevent overlay click-close when clicking inside the panel.
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="RmgMoreFiltersHeader">
            <div className="RmgMoreFiltersTitle">{ariaLabel}</div>
            <button
              type="button"
              className="RmgButton RmgButton--small"
              onClick={() => onClose?.()}
              aria-label="Close more filters"
            >
              Close
            </button>
          </div>

          <div className="RmgMoreFiltersBody">{children}</div>
        </div>
      </FocusTrap>
    </div>
  );
}
