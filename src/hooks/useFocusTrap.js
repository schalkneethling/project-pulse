import { useEffect } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps keyboard focus inside a container element.
 * On Tab, cycles forward. On Shift+Tab, cycles backward.
 * Wraps from last to first and vice versa.
 */
export function useFocusTrap(containerRef) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    function handleKeyDown(event) {
      if (event.key !== "Tab") {
        return;
      }

      const focusable = Array.from(container.querySelectorAll(FOCUSABLE));
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const currentIndex = focusable.indexOf(document.activeElement);

      if (event.getModifierState("Shift")) {
        // Shift+Tab: if focus is on (or before) the first element, wrap to last.
        if (currentIndex <= 0) {
          event.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if focus is on (or after) the last element, wrap to first.
        if (currentIndex >= focusable.length - 1 || currentIndex === -1) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [containerRef]);
}
