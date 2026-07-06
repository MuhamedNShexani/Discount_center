import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  Suspense,
  lazy,
} from "react";
import { Box, Drawer, Skeleton, useTheme } from "@mui/material";
import { Navigate } from "react-router-dom";

const Gifts = lazy(() => import("../pages/Gifts"));

export const GiftsDrawerContext = createContext(null);

function GiftsDrawerFallback() {
  return (
    <Box sx={{ width: { xs: "100vw", sm: 420 }, p: 2.5 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          height={200}
          sx={{ borderRadius: 3, mb: 1.5 }}
        />
      ))}
    </Box>
  );
}

export function GiftsDrawerProvider({ children }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [open, setOpen] = useState(false);

  const openGifts = useCallback(() => setOpen(true), []);
  const closeGifts = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ openGifts, closeGifts, isOpen: open }),
    [openGifts, closeGifts, open],
  );

  return (
    <GiftsDrawerContext.Provider value={value}>
      {children}
      <Drawer
        anchor="right"
        open={open}
        onClose={closeGifts}
        PaperProps={{
          sx: {
            borderRadius: 0,
            background: isDark ? "#0f1927" : "#ffffff",
            borderLeft: isDark
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid #eef0f4",
            overflow: "hidden",
          },
        }}
      >
        {open ? (
          <Suspense fallback={<GiftsDrawerFallback />}>
            <Gifts embedded onClose={closeGifts} />
          </Suspense>
        ) : null}
      </Drawer>
    </GiftsDrawerContext.Provider>
  );
}

export function GiftsRouteRedirect() {
  const { openGifts } = useContext(GiftsDrawerContext);

  useEffect(() => {
    openGifts?.();
  }, [openGifts]);

  return <Navigate to="/" replace />;
}
