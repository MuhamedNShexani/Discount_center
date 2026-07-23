import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, CircularProgress, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import {
  isFlutterAppleSignIn,
  loginWithApple as runAppleLoginFlow,
} from "../utils/appleSignIn";
import { isAndroidDevice } from "../utils/androidPerformance";

function AppleLogo({ size = 20, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill={color}
        d="M16.365 1.43c0 1.14-.46 2.2-1.22 2.99-.79.83-2.1 1.47-3.2 1.38-.13-1.1.44-2.25 1.2-3.02.8-.82 2.2-1.42 3.22-1.35zM20.5 17.2c-.58 1.34-.86 1.93-1.61 3.11-1.05 1.63-2.53 3.66-4.36 3.68-1.62.03-2.04-1.06-4.25-1.05-2.2.01-2.67 1.08-4.29 1.05-1.83-.03-3.23-1.85-4.28-3.48C-.04 17.4-.9 13.3.99 10.5c1.07-1.58 2.76-2.58 4.4-2.58 1.64 0 2.67 1.07 4.25 1.07 1.54 0 2.48-1.08 4.24-1.08 1.5 0 3.09.82 4.15 2.23-3.65 2-3.05 7.2 2.47 7.06z"
      />
    </svg>
  );
}

/**
 * Continue with Apple — iOS Flutter only.
 * Hidden on Android and in normal browsers (no Apple web SDK).
 */
export default function AppleSignInButton({
  onSuccess,
  onError,
  disabled = false,
  buttonSx,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { t } = useTranslation();
  const { loginWithApple } = useAuth();
  const [pending, setPending] = useState(false);
  const isAndroid = useMemo(() => isAndroidDevice(), []);
  const [bridgeReady, setBridgeReady] = useState(
    () => !isAndroidDevice() && isFlutterAppleSignIn(),
  );
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  /** Flutter may inject the bridge shortly after the WebView loads (iOS only). */
  useEffect(() => {
    if (isAndroid || bridgeReady) return undefined;
    const tick = () => {
      if (isFlutterAppleSignIn()) setBridgeReady(true);
    };
    tick();
    const id = window.setInterval(tick, 400);
    const stop = window.setTimeout(() => window.clearInterval(id), 12_000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(stop);
    };
  }, [bridgeReady, isAndroid]);

  const buttonColors = useMemo(
    () => ({
      bgcolor: isDark ? "#ffffff" : "#000000",
      color: isDark ? "#000000" : "#ffffff",
      hoverBg: isDark ? "rgba(255,255,255,0.88)" : "rgba(0,0,0,0.85)",
    }),
    [isDark],
  );

  const defaultButtonSx = useMemo(
    () => ({
      py: 1.25,
      borderRadius: "14px",
      textTransform: "none",
      fontWeight: 700,
      fontSize: "1rem",
      gap: 1.25,
      bgcolor: buttonColors.bgcolor,
      color: buttonColors.color,
      border: "1px solid transparent",
      "&:hover": {
        bgcolor: buttonColors.hoverBg,
      },
      "&.Mui-disabled": {
        bgcolor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.35)",
        color: isDark ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.7)",
      },
      ...buttonSx,
    }),
    [buttonColors, buttonSx, isDark],
  );

  const handleClick = useCallback(async () => {
    setPending(true);
    try {
      const result = await runAppleLoginFlow(loginWithApple);
      if (result?.cancelled) {
        return;
      }
      if (result?.success) {
        onSuccessRef.current?.();
        return;
      }
      onErrorRef.current?.(
        result?.message ||
          t("Apple sign-in failed", {
            defaultValue: "Apple sign-in failed",
          }),
      );
    } catch {
      onErrorRef.current?.(
        t("Apple sign-in failed", {
          defaultValue: "Apple sign-in failed",
        }),
      );
    } finally {
      setPending(false);
    }
  }, [loginWithApple, t]);

  if (isAndroid || !bridgeReady) return null;

  return (
    <Box sx={{ width: "100%" }}>
      <Button
        type="button"
        fullWidth
        variant="contained"
        size="large"
        disabled={disabled || pending}
        onClick={() => void handleClick()}
        sx={defaultButtonSx}
        aria-label={t("Continue with Apple", {
          defaultValue: "Continue with Apple",
        })}
      >
        {pending ? (
          <CircularProgress
            size={22}
            thickness={4}
            sx={{ color: "inherit" }}
          />
        ) : (
          <AppleLogo size={22} color="currentColor" />
        )}
        {pending
          ? t("Signing in...", { defaultValue: "Signing in..." })
          : t("Continue with Apple", {
              defaultValue: "Continue with Apple",
            })}
      </Button>
    </Box>
  );
}
