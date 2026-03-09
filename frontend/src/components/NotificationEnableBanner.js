import React, { useState, useEffect } from "react";
import { Snackbar, Button, Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNotifications } from "../context/NotificationContext";

const DISMISS_KEY = "notification-banner-dismissed";

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

export default function NotificationEnableBanner() {
  const { t } = useTranslation();
  const {
    pushSupported,
    pushPermission,
    pushSubscribing,
    requestPushPermission,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    if (!pushSupported) return;
    if (pushPermission === "denied") return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    if (pushPermission === "default") {
      setOpen(true);
    }
    if (isIOS() && !isStandalone()) {
      setShowIOSHint(true);
    }
  }, [pushSupported, pushPermission]);

  const handleEnable = async () => {
    const ok = await requestPushPermission();
    if (ok) {
      setOpen(false);
      setShowIOSHint(false);
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
              theme.palette.mode === "dark" ? "#2c3e50" : "#1a1a1a",
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
                backgroundColor: "#2B8264",
                "&:hover": { backgroundColor: "#1E5F49" },
              }}
            >
              {pushSubscribing ? t("Enabling...") : t("Enable")}
            </Button>
          </Box>
        </Box>
      </Snackbar>

      {showIOSHint && !open && pushPermission === "granted" && (
        <Snackbar
          open={showIOSHint}
          autoHideDuration={null}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          sx={{ bottom: { xs: 70, sm: 24 } }}
        >
          <Box
            sx={{
              backgroundColor: (theme) =>
                theme.palette.mode === "dark" ? "#2c3e50" : "#1a1a1a",
              color: "#fff",
              borderRadius: 2,
              p: 2,
              maxWidth: 360,
              boxShadow: 4,
            }}
          >
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              {t("For notifications when app is closed: tap Share → Add to Home Screen")}
            </Typography>
            <Button
              size="small"
              onClick={() => setShowIOSHint(false)}
              sx={{ color: "rgba(255,255,255,0.7)" }}
            >
              {t("Got it")}
            </Button>
          </Box>
        </Snackbar>
      )}
    </>
  );
}
