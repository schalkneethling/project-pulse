import { useEffect, useRef } from "react";

const AUTO_DISMISS_MS = 10000;

/**
 * Accessible toast notification built on the native Popover API.
 *
 * `popover="auto"` gives us Escape-to-dismiss and the top-layer rendering
 * for free; we add an auto-dismiss timer and listen to the `toggle` event
 * so the parent can unmount us when the user closes the popover via any
 * of the built-in mechanisms.
 *
 * `role="status"` + `aria-live="polite"` ensure screen readers announce
 * the message non-disruptively.
 */
export function Toast({ message, actionLabel, onAction, onDismiss }) {
  const popoverRef = useRef(null);

  useEffect(() => {
    const el = popoverRef.current;
    if (!el) {
      return;
    }

    el.showPopover();

    const handleToggle = (event) => {
      if (event.newState === "closed") {
        onDismiss();
      }
    };
    el.addEventListener("toggle", handleToggle);

    const timer = setTimeout(() => {
      // Closing the popover fires `toggle`, which calls onDismiss for us.
      if (el.matches(":popover-open")) {
        el.hidePopover();
      }
    }, AUTO_DISMISS_MS);

    return () => {
      clearTimeout(timer);
      el.removeEventListener("toggle", handleToggle);
    };
  }, [onDismiss]);

  return (
    <output
      ref={popoverRef}
      popover="auto"
      aria-live="polite"
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:max-w-sm flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl px-4 py-3 text-sm text-slate-100"
    >
      <span className="flex-1">{message}</span>
      {actionLabel && (
        <button
          type="button"
          onClick={() => {
            onAction?.();
            popoverRef.current?.hidePopover();
          }}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium text-white transition-colors"
        >
          {actionLabel}
        </button>
      )}
      <button
        type="button"
        popoverTarget={popoverRef.current?.id}
        onClick={() => popoverRef.current?.hidePopover()}
        aria-label="Dismiss notification"
        className="p-1 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </output>
  );
}
