import React, { useState, useEffect } from "react";
import { Snackbar, Button, Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNotifications } from "../context/NotificationContext";

const DISMISS_KEY = "notification-banner-dismissed";

export default function NotificationEnableBanner() {
  const { t } = useTranslation();
  const {
    pushSupported,
    pushPermission,
    pushSubscribing,
    requestPushPermission,
    pushEnabled,
  } = useNotifications();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!pushSupported) return;
    if (!pushEnabled) return;
    if (pushPermission === "denied") return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    if (pushPermission === "default") {
      setOpen(true);
    }
  }, [pushSupported, pushPermission, pushEnabled]);

  const handleEnable = async () => {
    const ok = await requestPushPermission();
    if (ok) {
      setOpen(false);
    }
  };

  const handleDismiss = () => {
    setOpen(false);
    sessionStorage.setItem(DISMISS_KEY, "1");
  };

  return (
    <>
      <Snackbar
        open={open}
        autoHideDuration={null}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ bottom: { xs: 70, sm: 24 } }}
      >
        <Box
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "#1E6FD9" : "#1a1a1a",
            color: "#fff",
            borderRadius: 2,
            p: 2,
            maxWidth: 360,
            boxShadow: 4,
          }}
        >
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            {t("Get notifications when app is closed or in background")}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button
              size="small"
              onClick={handleDismiss}
              sx={{ color: "rgba(255,255,255,0.7)" }}
            >
              {t("Not now")}
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleEnable}
              disabled={pushSubscribing}
              sx={{
                backgroundColor: "var(--brand-accent-orange)",
                "&:hover": { backgroundColor: "var(--brand-light-orange)" },
              }}
            >
              {pushSubscribing ? t("Enabling...") : t("Enable")}
            </Button>
          </Box>
        </Box>
      </Snackbar>
    </>
  );
}
