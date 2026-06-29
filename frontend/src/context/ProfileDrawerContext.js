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
import { Box, Drawer, useTheme } from "@mui/material";
import { Navigate } from "react-router-dom";
import Loader from "../components/Loader";

const ProfilePage = lazy(() => import("../pages/ProfilePage"));

export const ProfileDrawerContext = createContext(null);

export function ProfileDrawerProvider({ children }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [open, setOpen] = useState(false);

  const openProfile = useCallback(() => setOpen(true), []);
  const closeProfile = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ openProfile, closeProfile, isOpen: open }),
    [openProfile, closeProfile, open],
  );

  return (
    <ProfileDrawerContext.Provider value={value}>
      {children}
      <Drawer
        anchor="right"
        open={open}
        onClose={closeProfile}
        PaperProps={{
          sx: {
            background: isDark ? "#0f1927" : "#ffffff",
            borderLeft: isDark
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid #eef0f4",
            width: { xs: "100vw", sm: 390 },
            maxWidth: "100%",
          },
        }}
      >
        {open ? (
          <Suspense
            fallback={
              <Box
                sx={{
                  width: { xs: "100vw", sm: 390 },
                  height: "100dvh",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Loader />
              </Box>
            }
          >
            <ProfilePage onClose={closeProfile} />
          </Suspense>
        ) : null}
      </Drawer>
    </ProfileDrawerContext.Provider>
  );
}

/** Opens the profile drawer then leaves /profile (bookmarks, protected-route redirects). */
export function ProfileRouteRedirect() {
  const { openProfile } = useContext(ProfileDrawerContext);

  useEffect(() => {
    openProfile?.();
  }, [openProfile]);

  return <Navigate to="/" replace />;
}
