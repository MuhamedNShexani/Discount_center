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
import {
  DrawerBody,
  DrawerSafeAreaTop,
  drawerPaperSx,
} from "../utils/drawerSafeArea";

const FindJob = lazy(() => import("../pages/FindJob"));

export const FindJobDrawerContext = createContext(null);

function FindJobDrawerFallback() {
  return (
    <Box sx={{ width: { xs: "100vw", sm: 420 }, p: 2.5 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          height={92}
          sx={{ borderRadius: 3, mb: 1.5 }}
        />
      ))}
    </Box>
  );
}

export function FindJobDrawerProvider({ children }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [open, setOpen] = useState(false);

  const openFindJobs = useCallback(() => setOpen(true), []);
  const closeFindJobs = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ openFindJobs, closeFindJobs, isOpen: open }),
    [openFindJobs, closeFindJobs, open],
  );

  return (
    <FindJobDrawerContext.Provider value={value}>
      {children}
      <Drawer
        anchor="right"
        open={open}
        onClose={closeFindJobs}
        PaperProps={{
          sx: drawerPaperSx(isDark),
        }}
      >
        {open ? (
          <>
            <DrawerSafeAreaTop bgcolor={isDark ? "#0f1927" : "#ffffff"} />
            <DrawerBody>
              <Suspense fallback={<FindJobDrawerFallback />}>
                <FindJob embedded onClose={closeFindJobs} />
              </Suspense>
            </DrawerBody>
          </>
        ) : null}
      </Drawer>
    </FindJobDrawerContext.Provider>
  );
}

export function FindJobRouteRedirect() {
  const { openFindJobs } = useContext(FindJobDrawerContext);

  useEffect(() => {
    openFindJobs?.();
  }, [openFindJobs]);

  return <Navigate to="/" replace />;
}
