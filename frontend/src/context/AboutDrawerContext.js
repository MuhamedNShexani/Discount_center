import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Drawer, useTheme } from "@mui/material";
import { Navigate } from "react-router-dom";
import AboutPage from "../pages/AboutPage";
import {
  DrawerBody,
  DrawerSafeAreaTop,
  drawerPaperSx,
} from "../utils/drawerSafeArea";

export const AboutDrawerContext = createContext(null);

export function AboutDrawerProvider({ children }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [open, setOpen] = useState(false);

  const openAbout = useCallback(() => setOpen(true), []);
  const closeAbout = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ openAbout, closeAbout, isOpen: open }),
    [openAbout, closeAbout, open],
  );

  return (
    <AboutDrawerContext.Provider value={value}>
      {children}
      <Drawer
        anchor="right"
        open={open}
        onClose={closeAbout}
        PaperProps={{
          sx: drawerPaperSx(isDark, {
            width: { xs: "100vw", sm: 420 },
            maxWidth: "100%",
          }),
        }}
      >
        {open ? (
          <>
            <DrawerSafeAreaTop bgcolor={isDark ? "#0f1927" : "#ffffff"} />
            <DrawerBody>
              <AboutPage embedded onClose={closeAbout} />
            </DrawerBody>
          </>
        ) : null}
      </Drawer>
    </AboutDrawerContext.Provider>
  );
}

export function AboutRouteRedirect() {
  const { openAbout } = useContext(AboutDrawerContext);

  useEffect(() => {
    openAbout?.();
  }, [openAbout]);

  return <Navigate to="/" replace />;
}
