import React, {
  createContext,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  Typography,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useNotifications } from "./NotificationContext";
import {
  DATA_LANG_AR,
  DATA_LANG_EN,
  DATA_LANG_KU,
  useDataLanguage,
} from "./DataLanguageContext";
import {
  DrawerBody,
  DrawerSafeAreaTop,
  drawerPaperSx,
} from "../utils/drawerSafeArea";

export const NotificationDrawerContext = createContext(null);

export function NotificationDrawerProvider({ children }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { t } = useTranslation();
  const { dataLanguage } = useDataLanguage();
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
    pushSupported,
    pushSubscribing,
    requestPushPermission,
    showEnableNotifications,
  } = useNotifications();

  const openNotifications = useCallback(() => {
    fetchNotifications?.();
    setOpen(true);
  }, [fetchNotifications]);

  const closeNotifications = useCallback(() => setOpen(false), []);

  const pickNotificationText = useCallback(
    (n, field) => {
      const isAr = dataLanguage === DATA_LANG_AR;
      const isKu = dataLanguage === DATA_LANG_KU;
      const isEn = dataLanguage === DATA_LANG_EN;
      if (field === "title") {
        return (
          (isAr ? n?.titleAr : isKu ? n?.titleKu : isEn ? n?.titleEn : "") ||
          n?.title ||
          ""
        );
      }
      return (
        (isAr ? n?.bodyAr : isKu ? n?.bodyKu : isEn ? n?.bodyEn : "") ||
        n?.body ||
        ""
      );
    },
    [dataLanguage],
  );

  const value = useMemo(
    () => ({ openNotifications, closeNotifications, isOpen: open }),
    [openNotifications, closeNotifications, open],
  );

  return (
    <NotificationDrawerContext.Provider value={value}>
      {children}
      <Drawer
        anchor="right"
        open={open}
        onClose={closeNotifications}
        PaperProps={{
          sx: drawerPaperSx(isDark, {
            width: { xs: "100vw", sm: 380 },
            maxWidth: "100%",
          }),
        }}
      >
        <DrawerSafeAreaTop bgcolor={isDark ? "#0f1927" : "#ffffff"} />
        <DrawerBody>
        <Box
          sx={{
            width: "100%",
            height: "100%",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
          }}
        >
          <Box sx={{ p: 2.5, flexShrink: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "12px",
                    background: "linear-gradient(135deg,#1e6fd9,#1558b0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 3px 8px rgba(30,111,217,0.35)",
                  }}
                >
                  <NotificationsIcon sx={{ fontSize: 18, color: "white" }} />
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: isDark ? "rgba(255,255,255,0.95)" : "#111827",
                  }}
                >
                  {t("Notifications")}
                </Typography>
                {unreadCount > 0 && (
                  <Chip
                    label={`${unreadCount}`}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      bgcolor: "#ef4444",
                      color: "white",
                      "& .MuiChip-label": { px: 0.8 },
                    }}
                  />
                )}
              </Box>
              <IconButton
                edge="end"
                onClick={closeNotifications}
                size="small"
                sx={{
                  bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6",
                  "&:hover": {
                    bgcolor: isDark ? "rgba(255,255,255,0.1)" : "#e9ecf0",
                  },
                }}
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>

            {(unreadCount > 0 || notifications.length > 0) && (
              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                {unreadCount > 0 && (
                  <Button
                    size="small"
                    onClick={() => markAllAsRead?.()}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    {t("Mark all read")}
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    size="small"
                    onClick={() => clearAll?.()}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      color: "text.secondary",
                    }}
                  >
                    {t("Clear notifications")}
                  </Button>
                )}
              </Box>
            )}

            {pushSupported && showEnableNotifications && (
              <Button
                fullWidth
                variant="outlined"
                size="small"
                disabled={pushSubscribing}
                onClick={() => requestPushPermission?.()}
                sx={{ textTransform: "none", mt: 1.25, borderRadius: 2 }}
              >
                {pushSubscribing
                  ? t("Enabling...")
                  : t("Enable system notifications")}
              </Button>
            )}
          </Box>

          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              px: 2.5,
              pb: 2.5,
            }}
          >
            {notifications.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <NotificationsNoneIcon
                  sx={{
                    fontSize: 56,
                    color: isDark ? "rgba(255,255,255,0.15)" : "#d1d5db",
                    mb: 1.5,
                  }}
                />
                <Typography color="text.secondary" sx={{ fontSize: "0.9rem" }}>
                  {t("No notifications")}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                {notifications.map((n) => {
                  const title = pickNotificationText(n, "title");
                  const body = pickNotificationText(n, "body");
                  return (
                    <Box
                      key={n._id}
                      onClick={() => markAsRead?.(n._id)}
                      sx={{
                        borderRadius: "14px",
                        overflow: "hidden",
                        cursor: "pointer",
                        background: n.read
                          ? isDark
                            ? "linear-gradient(145deg,#151b28,#1a2236)"
                            : "#f9fafb"
                          : isDark
                            ? "linear-gradient(145deg,#1a2236,#1e2a40)"
                            : "#eef3ff",
                        border: isDark
                          ? "1px solid rgba(255,255,255,0.07)"
                          : n.read
                            ? "1px solid #eef0f4"
                            : "1px solid rgba(30,111,217,0.18)",
                        p: "12px 14px",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          background: isDark
                            ? "linear-gradient(145deg,#1e2a40,#243050)"
                            : "#f0f2f5",
                          transform: "translateX(-2px)",
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: n.read ? 600 : 800,
                          fontSize: "0.88rem",
                          color: isDark ? "rgba(255,255,255,0.9)" : "#111827",
                          mb: body ? 0.4 : 0,
                        }}
                      >
                        {title}
                      </Typography>
                      {!!body && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            fontSize: "0.8rem",
                            lineHeight: 1.45,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {body}
                        </Typography>
                      )}
                      {n.link && (
                        <Typography
                          component={Link}
                          to={n.link}
                          variant="caption"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead?.(n._id);
                            closeNotifications();
                          }}
                          sx={{
                            display: "inline-block",
                            mt: 0.75,
                            color: "primary.main",
                            textDecoration: "underline",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            "&:hover": { color: "primary.dark" },
                          }}
                        >
                          {t("View")} →
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
        </DrawerBody>
      </Drawer>
    </NotificationDrawerContext.Provider>
  );
}
