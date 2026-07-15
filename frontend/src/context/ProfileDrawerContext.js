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
import { Drawer, useTheme } from "@mui/material";
import { Navigate } from "react-router-dom";
import ProfilePageSkeleton from "../components/ProfilePageSkeleton";
import {
  DrawerBody,
  DrawerSafeAreaTop,
  drawerPaperSx,
} from "../utils/drawerSafeArea";

const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const FavouritesPage = lazy(() => import("../pages/FavouritesPage"));
const FollowingPage = lazy(() => import("../pages/FollowingPage"));

export const ProfileDrawerContext = createContext(null);

export function ProfileDrawerProvider({ children }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("profile");

  const openProfile = useCallback(() => {
    setView("profile");
    setOpen(true);
  }, []);
  const openLogin = useCallback(() => {
    setView("login");
    setOpen(true);
  }, []);
  const openFavourites = useCallback(() => {
    setView("favourites");
    setOpen(true);
  }, []);
  const openFollowing = useCallback(() => {
    setView("following");
    setOpen(true);
  }, []);
  const closeProfile = useCallback(() => {
    setOpen(false);
    setView("profile");
  }, []);
  const showProfile = useCallback(() => setView("profile"), []);

  const value = useMemo(
    () => ({
      openProfile,
      openLogin,
      openFavourites,
      openFollowing,
      closeProfile,
      isOpen: open,
    }),
    [openProfile, openLogin, openFavourites, openFollowing, closeProfile, open],
  );

  return (
    <ProfileDrawerContext.Provider value={value}>
      {children}
      <Drawer
        anchor="right"
        open={open}
        onClose={closeProfile}
        PaperProps={{
          sx: drawerPaperSx(isDark, {
            width: { xs: "100vw", sm: 390 },
            maxWidth: "100%",
          }),
        }}
      >
        {open ? (
          <>
            <DrawerSafeAreaTop bgcolor={isDark ? "#0c1525" : "#eef3ff"} />
            <DrawerBody>
              <Suspense fallback={<ProfilePageSkeleton />}>
                {view === "login" ? (
                  <LoginPage
                    embedded
                    onClose={closeProfile}
                    onAuthenticated={showProfile}
                  />
                ) : view === "favourites" ? (
                  <FavouritesPage embedded onClose={closeProfile} />
                ) : view === "following" ? (
                  <FollowingPage embedded onClose={closeProfile} />
                ) : (
                  <ProfilePage
                    onClose={closeProfile}
                    onLogin={openLogin}
                    onFavourites={openFavourites}
                    onFollowing={openFollowing}
                  />
                )}
              </Suspense>
            </DrawerBody>
          </>
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
