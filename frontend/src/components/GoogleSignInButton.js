import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import {
  getGoogleClientId,
  GoogleGLogo,
  googleIdentityState,
  loadGsiScript,
  shouldUseGoogleOAuthRedirect,
  shouldUseNativeGoogleSignIn,
  startGoogleOAuthRedirect,
} from "../utils/googleSignIn";
import {
  DASHKAN_AUTH_ERROR_EVENT,
  DASHKAN_AUTH_SESSION_EVENT,
  requestNativeGoogleSignIn,
} from "../utils/nativeGoogleAuthBridge";

export default function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
  returnTo = "/login",
  buttonSx,
  showEnvWarning = true,
  showWebViewHint = true,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { t } = useTranslation();
  const { loginWithGoogle, isAuthenticated } = useAuth();
  const googleRenderRef = useRef(null);
  const handlerRef = useRef(async () => {});
  const [nativePending, setNativePending] = useState(false);

  const googleClientId = getGoogleClientId();
  const useNativeGoogle = useMemo(() => shouldUseNativeGoogleSignIn(), []);
  const useGoogleOAuthRedirect = useMemo(
    () => shouldUseGoogleOAuthRedirect(),
    [],
  );

  const handleGoogleCredential = useCallback(
    async (credential) => {
      try {
        const result = await loginWithGoogle(credential);
        if (result.success) {
          onSuccess?.();
        } else {
          onError?.(
            result.message ||
              t("Google sign-in failed", {
                defaultValue: "Google sign-in failed",
              }),
          );
        }
      } catch {
        onError?.(
          t("Google sign-in failed", {
            defaultValue: "Google sign-in failed",
          }),
        );
      }
    },
    [loginWithGoogle, onSuccess, onError, t],
  );

  handlerRef.current = handleGoogleCredential;

  // Native WebView: AuthContext applies JWT; finish button waiters here.
  useEffect(() => {
    if (!useNativeGoogle) return undefined;

    const onSession = () => {
      setNativePending(false);
      onSuccess?.();
    };
    const onFail = (event) => {
      setNativePending(false);
      const message =
        (typeof event?.detail?.message === "string" && event.detail.message) ||
        t("Google sign-in failed", {
          defaultValue: "Google sign-in failed",
        });
      onError?.(message);
    };

    window.addEventListener(DASHKAN_AUTH_SESSION_EVENT, onSession);
    window.addEventListener(DASHKAN_AUTH_ERROR_EVENT, onFail);
    return () => {
      window.removeEventListener(DASHKAN_AUTH_SESSION_EVENT, onSession);
      window.removeEventListener(DASHKAN_AUTH_ERROR_EVENT, onFail);
    };
  }, [useNativeGoogle, onSuccess, onError, t]);

  useEffect(() => {
    if (isAuthenticated && nativePending) {
      setNativePending(false);
      onSuccess?.();
    }
  }, [isAuthenticated, nativePending, onSuccess]);

  const defaultButtonSx = useMemo(
    () => ({
      py: 1.25,
      borderRadius: "14px",
      textTransform: "none",
      fontWeight: 700,
      fontSize: "1rem",
      borderColor: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.14)",
      color: isDark ? "rgba(255,255,255,0.95)" : "text.primary",
      bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.9)",
      gap: 1.25,
      "&:hover": {
        borderColor: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.2)",
        bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
      },
      ...buttonSx,
    }),
    [isDark, buttonSx],
  );

  const startNativeGoogle = useCallback(() => {
    setNativePending(true);
    const ok = requestNativeGoogleSignIn({ returnTo });
    if (!ok) {
      setNativePending(false);
      onError?.(
        t("googleNativeUnavailable", {
          defaultValue:
            "Native Google sign-in is not available. Update the app and try again.",
        }),
      );
      return;
    }
    // Safety: if Flutter never answers, clear spinner.
    window.setTimeout(() => {
      setNativePending((pending) => {
        if (pending) {
          onError?.(
            t("Google sign-in failed", {
              defaultValue: "Google sign-in failed",
            }),
          );
        }
        return false;
      });
    }, 90_000);
  }, [returnTo, onError, t]);

  // Desktop / normal browsers only — never mount GIS inside embedded WebView.
  useEffect(() => {
    if (!googleClientId || useNativeGoogle || useGoogleOAuthRedirect) {
      return undefined;
    }

    let cancelled = false;

    const renderGoogleButton = async () => {
      await loadGsiScript();
      if (cancelled) return;
      const el = googleRenderRef.current;
      if (!el || !window.google?.accounts?.id) return;

      el.innerHTML = "";
      try {
        if (!googleIdentityState.initialized) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response) => {
              const c = response?.credential;
              if (c) void handlerRef.current?.(c);
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          googleIdentityState.initialized = true;
        }

        const rectW = el.getBoundingClientRect().width || el.offsetWidth || 0;
        const vw =
          typeof window !== "undefined"
            ? Math.min(window.innerWidth - 64, 480)
            : 320;
        const w = Math.max(rectW || vw, 280);
        window.google.accounts.id.renderButton(el, {
          theme: "outline",
          size: "large",
          width: w,
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          locale: typeof navigator !== "undefined" ? navigator.language : "en",
        });
      } catch (e) {
        console.warn("Google Sign-In renderButton:", e);
      }
    };

    let frames = 0;
    const maxFrames = 45;
    const tick = () => {
      if (cancelled) return;
      if (googleRenderRef.current && window.google?.accounts?.id) {
        void renderGoogleButton();
        return;
      }
      frames += 1;
      if (frames < maxFrames) {
        requestAnimationFrame(tick);
        return;
      }
      void renderGoogleButton();
    };

    void loadGsiScript().then(() => {
      requestAnimationFrame(tick);
    });

    return () => {
      cancelled = true;
      if (googleRenderRef.current) googleRenderRef.current.innerHTML = "";
    };
  }, [googleClientId, useNativeGoogle, useGoogleOAuthRedirect]);

  if (!googleClientId && !useNativeGoogle) {
    if (!showEnvWarning) return null;
    return (
      <Alert severity="warning" sx={{ borderRadius: 2 }}>
        {t("googleEnvMissing")}
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 1,
      }}
    >
      {showWebViewHint && useNativeGoogle && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {t("googleWebViewNativeHint", {
            defaultValue:
              "Continue with Google opens the Google account picker in the app, then signs you in here.",
          })}
        </Alert>
      )}
      {useNativeGoogle ? (
        <Button
          type="button"
          fullWidth
          variant="outlined"
          size="large"
          disabled={disabled || nativePending}
          onClick={startNativeGoogle}
          sx={defaultButtonSx}
        >
          {nativePending ? (
            <CircularProgress size={22} thickness={4} />
          ) : (
            <GoogleGLogo size={22} />
          )}
          {nativePending
            ? t("Signing in...", { defaultValue: "Signing in..." })
            : t("Continue with Google")}
        </Button>
      ) : useGoogleOAuthRedirect ? (
        <Button
          type="button"
          fullWidth
          variant="outlined"
          size="large"
          disabled={disabled}
          onClick={() => startGoogleOAuthRedirect(returnTo)}
          sx={defaultButtonSx}
        >
          <GoogleGLogo size={22} />
          {t("Continue with Google")}
        </Button>
      ) : (
        <Box
          ref={googleRenderRef}
          className="gsi-google-button-mount"
          sx={{
            width: "100%",
            minHeight: 48,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            opacity: disabled ? 0.55 : 1,
            pointerEvents: disabled ? "none" : "auto",
            "& > div": { width: "100% !important" },
            "& iframe": {
              width: "100% !important",
              maxWidth: "100% !important",
            },
          }}
        />
      )}
    </Box>
  );
}
