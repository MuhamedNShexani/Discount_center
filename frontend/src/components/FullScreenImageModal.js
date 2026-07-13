import React, { useState, useEffect, useRef, useCallback } from "react";
import { Modal, Box, IconButton, Stack } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.35;

function clampScale(value) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

function touchDistance(touches) {
  const [a, b] = touches;
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.hypot(dx, dy);
}

/**
 * Full-screen lightbox for product images with pinch / wheel / button zoom and pan.
 * Close: X, backdrop click, or Escape (Modal default).
 */
function FullScreenImageModal({ open, onClose, imageUrl, alt = "" }) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const pinchRef = useRef(null);
  const dragRef = useRef(null);
  const lastTapRef = useRef(0);
  const containerRef = useRef(null);

  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    pinchRef.current = null;
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!open) resetView();
  }, [open, resetView]);

  const zoomIn = useCallback((e) => {
    e?.stopPropagation();
    setScale((s) => clampScale(s + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback((e) => {
    e?.stopPropagation();
    setScale((s) => {
      const next = clampScale(s - ZOOM_STEP);
      if (next <= MIN_SCALE) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    setScale((s) => {
      const next = clampScale(s + delta);
      if (next <= MIN_SCALE) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!open || !el) return undefined;

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [open, handleWheel]);

  const handlePointerDown = useCallback(
    (e) => {
      e.stopPropagation();
      if (scale <= MIN_SCALE) return;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: offset.x,
        originY: offset.y,
      };
      setIsDragging(true);
    },
    [scale, offset.x, offset.y],
  );

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current) return;
    e.preventDefault();
    const { startX, startY, originX, originY } = dragRef.current;
    setOffset({
      x: originX + (e.clientX - startX),
      y: originY + (e.clientY - startY),
    });
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback(
    (e) => {
      e.stopPropagation();
      if (e.touches.length === 2) {
        pinchRef.current = {
          distance: touchDistance(e.touches),
          scale,
        };
        dragRef.current = null;
        setIsDragging(false);
        return;
      }

      if (e.touches.length === 1 && scale > MIN_SCALE) {
        dragRef.current = {
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          originX: offset.x,
          originY: offset.y,
        };
        setIsDragging(true);
      }
    },
    [scale, offset.x, offset.y],
  );

  const handleTouchMove = useCallback((e) => {
    e.stopPropagation();

    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const distance = touchDistance(e.touches);
      const ratio = distance / pinchRef.current.distance;
      setScale(clampScale(pinchRef.current.scale * ratio));
      return;
    }

    if (e.touches.length === 1 && dragRef.current) {
      e.preventDefault();
      const { startX, startY, originX, originY } = dragRef.current;
      setOffset({
        x: originX + (e.touches[0].clientX - startX),
        y: originY + (e.touches[0].clientY - startY),
      });
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      e.stopPropagation();
      if (e.touches.length < 2) pinchRef.current = null;
      if (e.touches.length === 0) {
        endDrag();
        setScale((s) => {
          if (s <= MIN_SCALE) setOffset({ x: 0, y: 0 });
          return s;
        });
      }
    },
    [endDrag],
  );

  const handleDoubleTap = useCallback(
    (e) => {
      e.stopPropagation();
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        if (scale > MIN_SCALE) {
          resetView();
        } else {
          setScale(2);
        }
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;
    },
    [scale, resetView],
  );

  if (!imageUrl) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(0,0,0,0.92)",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          outline: "none",
          touchAction: "none",
          overflow: "hidden",
        }}
        onClick={onClose}
      >
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          sx={{
            position: "fixed",
            top: "calc(8px + env(safe-area-inset-top, 0px))",
            right: 8,
            color: "common.white",
            bgcolor: "rgba(0,0,0,0.45)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
            zIndex: 2,
          }}
          aria-label="close"
          size="large"
        >
          <CloseIcon />
        </IconButton>

        <Stack
          direction="row"
          spacing={0.5}
          onClick={(e) => e.stopPropagation()}
          sx={{
            position: "fixed",
            bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
            bgcolor: "rgba(0,0,0,0.45)",
            borderRadius: 2,
            p: 0.25,
          }}
        >
          <IconButton
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE}
            sx={{ color: "common.white" }}
            aria-label="zoom out"
            size="large"
          >
            <ZoomOutIcon />
          </IconButton>
          <IconButton
            onClick={zoomIn}
            disabled={scale >= MAX_SCALE}
            sx={{ color: "common.white" }}
            aria-label="zoom in"
            size="large"
          >
            <ZoomInIcon />
          </IconButton>
        </Stack>

        <Box
          ref={containerRef}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onDoubleClick={handleDoubleTap}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            cursor: scale > MIN_SCALE ? (isDragging ? "grabbing" : "grab") : "zoom-in",
            touchAction: "none",
          }}
        >
          <Box
            component="img"
            src={imageUrl}
            alt={alt}
            draggable={false}
            sx={{
              maxWidth: "100vw",
              maxHeight: "100vh",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              p: { xs: 1, sm: 2 },
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.15s ease-out",
              userSelect: "none",
              WebkitUserDrag: "none",
            }}
          />
        </Box>
      </Box>
    </Modal>
  );
}

export default FullScreenImageModal;
