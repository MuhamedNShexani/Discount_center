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
import CommonQuestionsPage from "../pages/CommonQuestionsPage";
import {
  DrawerBody,
  DrawerSafeAreaTop,
  drawerPaperSx,
} from "../utils/drawerSafeArea";

export const CommonQuestionsDrawerContext = createContext(null);

export function CommonQuestionsDrawerProvider({ children }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [open, setOpen] = useState(false);

  const openCommonQuestions = useCallback(() => setOpen(true), []);
  const closeCommonQuestions = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ openCommonQuestions, closeCommonQuestions, isOpen: open }),
    [openCommonQuestions, closeCommonQuestions, open],
  );

  return (
    <CommonQuestionsDrawerContext.Provider value={value}>
      {children}
      <Drawer
        anchor="right"
        open={open}
        onClose={closeCommonQuestions}
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
              <CommonQuestionsPage
                embedded
                onClose={closeCommonQuestions}
              />
            </DrawerBody>
          </>
        ) : null}
      </Drawer>
    </CommonQuestionsDrawerContext.Provider>
  );
}

export function CommonQuestionsRouteRedirect() {
  const { openCommonQuestions } = useContext(CommonQuestionsDrawerContext);

  useEffect(() => {
    openCommonQuestions?.();
  }, [openCommonQuestions]);

  return <Navigate to="/" replace />;
}
