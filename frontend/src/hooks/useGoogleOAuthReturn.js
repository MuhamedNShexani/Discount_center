import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * Handles full-page Google OAuth return (#google_oauth_token= or ?google_oauth_token=).
 */
export function useGoogleOAuthReturn({
  enabled = true,
  onSuccess,
  onError,
} = {}) {
  const { completeSessionWithToken } = useAuth();

  useEffect(() => {
    if (!enabled) return undefined;

    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(
      (window.location.hash || "").replace(/^#/, ""),
    );
    const oauthErr = params.get("google_error");
    const oauthTok =
      params.get("google_oauth_token") || hashParams.get("google_oauth_token");

    const stripOAuthFromUrl = () => {
      window.history.replaceState({}, document.title, window.location.pathname);
    };

    if (oauthErr) {
      const message = (() => {
        try {
          return decodeURIComponent(oauthErr);
        } catch {
          return oauthErr;
        }
      })();
      onError?.(message);
      stripOAuthFromUrl();
      return undefined;
    }

    if (!oauthTok) return undefined;

    const tokenSnapshot = oauthTok;
    stripOAuthFromUrl();

    let cancelled = false;
    (async () => {
      const result = await completeSessionWithToken(tokenSnapshot);
      if (cancelled) return;
      if (result.success) {
        onSuccess?.();
      } else {
        onError?.(result.message || "Google sign-in failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, completeSessionWithToken, onSuccess, onError]);
}
