import { useState, useCallback } from "react";
import { Button, CircularProgress } from "@mui/material";
import { aiAPI } from "../services/api";

/**
 * Calls POST /api/ai/translate and returns { english, arabic, kurdish } via onResult.
 *
 * To avoid overwriting user edits, merge in the parent only into empty fields, e.g.:
 *
 *   onResult={({ english, arabic, kurdish }) => setForm((f) => ({
 *     ...f,
 *     nameEn: f.nameEn?.trim() ? f.nameEn : english,
 *     nameAr: f.nameAr?.trim() ? f.nameAr : arabic,
 *     nameKu: f.nameKu?.trim() ? f.nameKu : kurdish,
 *   }))}
 *
 * @param {string} text - Source text to translate (required for the request; button disabled if empty)
 * @param {string} [type='general'] - Hint for future use; backend accepts product | store | brand | … (Google Translate uses same model for all)
 * @param {(result: { english: string, arabic: string, kurdish: string }) => void} onResult
 * @param {(message: string) => void} [onError]
 */
export default function AITranslateButton({
  text,
  type = "general",
  onResult,
  onError,
  disabled = false,
  size = "small",
  variant = "outlined",
  label = "Translate",
  icon = "🌐",
  sx,
  ...buttonProps
}) {
  const [loading, setLoading] = useState(false);
  const trimmed = typeof text === "string" ? text.trim() : "";
  const canRun = Boolean(trimmed);

  const handleClick = useCallback(async () => {
    if (!canRun || loading) return;
    setLoading(true);
    try {
      const { data: body } = await aiAPI.translate({
        text: trimmed,
        type,
      });
      if (body?.success && body?.data) {
        onResult?.({
          english: body.data.english,
          arabic: body.data.arabic,
          kurdish: body.data.kurdish,
        });
      } else {
        onError?.(body?.message || "Translation failed.");
      }
    } catch (err) {
      const data = err?.response?.data;
      const msg =
        (typeof data === "string" ? data : data?.message) ||
        err?.message ||
        "Network error while translating.";
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  }, [canRun, loading, trimmed, type, onResult, onError]);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled || !canRun || loading}
      onClick={handleClick}
      startIcon={
        loading ? (
          <CircularProgress color="inherit" size={16} thickness={5} />
        ) : (
          <span aria-hidden="true" style={{ fontSize: "1.05rem", lineHeight: 1 }}>
            {icon}
          </span>
        )
      }
      sx={{
        textTransform: "none",
        fontWeight: 600,
        minWidth: 0,
        ...sx,
      }}
      {...buttonProps}
    >
      {label}
    </Button>
  );
}
