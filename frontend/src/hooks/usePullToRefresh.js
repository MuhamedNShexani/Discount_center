import { useEffect, useRef } from "react";

// Generic pull-to-refresh hook for mobile pages.
// Call usePullToRefresh(() => fetchFn()) inside a page component.
export const usePullToRefresh = (onRefresh) => {
  const pullStartY = useRef(null);
  const isPulling = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof onRefresh !== "function") return;

    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        pullStartY.current = e.touches[0].clientY;
        isPulling.current = true;
      } else {
        pullStartY.current = null;
        isPulling.current = false;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling.current || pullStartY.current == null) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - pullStartY.current;
      if (diff > 50) {
        isPulling.current = false;
        pullStartY.current = null;
        onRefresh();
      }
    };

    const handleTouchEnd = () => {
      isPulling.current = false;
      pullStartY.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onRefresh]);
}

