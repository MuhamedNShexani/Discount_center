import React, { useEffect, useRef } from "react";
import { Box } from "@mui/material";

/**
 * When the wrapped product card intersects the viewport, calls onVisible(productId) once
 * per page session (tracked via recordedIdsRef).
 */
const ProductViewTracker = ({
  productId,
  onVisible,
  recordedIdsRef,
  children,
}) => {
  const rootRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || productId == null) return;

    const id = String(productId);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (recordedIdsRef.current.has(id)) return;
          recordedIdsRef.current.add(id);
          onVisible(productId);
          break;
        }
      },
      { threshold: 0.25, rootMargin: "0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [productId, onVisible, recordedIdsRef]);

  return (
    <Box
      ref={rootRef}
      sx={{
        display: "inline-flex",
        maxWidth: "100%",
        verticalAlign: "top",
      }}
    >
      {children}
    </Box>
  );
};

export default ProductViewTracker;
