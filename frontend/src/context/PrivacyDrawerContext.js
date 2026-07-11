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
import PrivacyPolicy from "../pages/PrivacyPolicy";
import {
  DrawerBody,
  DrawerSafeAreaTop,
  drawerPaperSx,
} from "../utils/drawerSafeArea";

export const PrivacyDrawerContext = createContext(null);

export function PrivacyDrawerProvider({ children }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [open, setOpen] = useState(false);

  const openPrivacy = useCallback(() => setOpen(true), []);
  const closePrivacy = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ openPrivacy, closePrivacy, isOpen: open }),
    [openPrivacy, closePrivacy, open],
  );

  return (
    <PrivacyDrawerContext.Provider value={value}>
      {children}
      <Drawer
        anchor="right"
        open={open}
        onClose={closePrivacy}
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
              <PrivacyPolicy embedded onClose={closePrivacy} />
            </DrawerBody>
          </>
        ) : null}
      </Drawer>
    </PrivacyDrawerContext.Provider>
  );
}

export function PrivacyRouteRedirect() {
  const { openPrivacy } = useContext(PrivacyDrawerContext);

  useEffect(() => {
    openPrivacy?.();
  }, [openPrivacy]);

  return <Navigate to="/" replace />;
}
