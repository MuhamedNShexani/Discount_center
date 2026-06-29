import React from "react";
import { Box } from "@mui/material";
import { getApiBaseURL } from "./getApiBaseURL";
import { isEmbeddedWebView } from "./isEmbeddedWebView";

/** GSI `initialize()` may only run once per page load. */
export const googleIdentityState = { initialized: false };

export function getGoogleClientId() {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
}

export function shouldUseGoogleOAuthRedirect() {
  if (import.meta.env.VITE_GOOGLE_OAUTH_REDIRECT === "true") return true;
  return isEmbeddedWebView();
}

export function startGoogleOAuthRedirect(returnTo = "/login") {
  const base = getApiBaseURL();
  const path =
    typeof returnTo === "string" && returnTo.startsWith("/") ? returnTo : "/login";
  const url = `${base}/auth/google/start?returnTo=${encodeURIComponent(path)}`;
  window.location.assign(url);
}

export function loadGsiScript() {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existing) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      const done = () => resolve();
      existing.addEventListener("load", done);
      existing.addEventListener("error", () =>
        reject(new Error("Google script failed to load")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google script failed to load"));
    document.body.appendChild(script);
  });
}

export function GoogleGLogo({ size = 20 }) {
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        lineHeight: 0,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 48 48">
        <path
          fill="#FFC107"
          d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.641-.142-3.225-.406-4.771z"
        />
        <path
          fill="#FF3D00"
          d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.574l.002-.001 6.19 5.238C37.83 39.411 44 34.956 44 24c0-1.641-.142-3.225-.406-4.771z"
        />
      </svg>
    </Box>
  );
}
