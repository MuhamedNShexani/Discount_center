import { useState } from "react";
import { Alert, Box, TextField, Typography } from "@mui/material";
import AITranslateButton from "./AITranslateButton";

function mergeOnlyEmptyLocales(prev, { english, arabic, kurdish }) {
  return {
    english: String(prev?.english ?? "").trim()
      ? prev.english
      : english ?? "",
    arabic: String(prev?.arabic ?? "").trim()
      ? prev.arabic
      : arabic ?? "",
    kurdish: String(prev?.kurdish ?? "").trim()
      ? prev.kurdish
      : kurdish ?? "",
  };
}

/**
 * EN / AR / KU fields with AI translate from `sourceText`.
 * Fills only empty locale fields when AI returns (see mergeOnlyEmptyLocales).
 */
export default function MultilingualFieldGroup({
  sectionLabel,
  value = { english: "", arabic: "", kurdish: "" },
  onValueChange,
  sourceText = "",
  aiType = "general",
  multiline = false,
  minRows = 2,
  disabled = false,
  aiButtonLabel,
}) {
  const [aiError, setAiError] = useState("");
  const v = {
    english: value?.english ?? "",
    arabic: value?.arabic ?? "",
    kurdish: value?.kurdish ?? "",
  };

  const setField = (key, text) => {
    onValueChange({ ...v, [key]: text });
  };

  return (
    <Box
      sx={{
        mt: 1.5,
        mb: 1,
        p: 1.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "action.hover",
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {sectionLabel}
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          alignItems: "flex-start",
        }}
      >
        <TextField
          size="small"
          label="English"
          value={v.english}
          onChange={(e) => setField("english", e.target.value)}
          disabled={disabled}
          multiline={multiline}
          minRows={multiline ? minRows : undefined}
          sx={{ flex: "1 1 200px", minWidth: 0 }}
        />
        <TextField
          size="small"
          label="العربية"
          value={v.arabic}
          onChange={(e) => setField("arabic", e.target.value)}
          disabled={disabled}
          multiline={multiline}
          minRows={multiline ? minRows : undefined}
          sx={{ flex: "1 1 200px", minWidth: 0 }}
          dir="rtl"
        />
        <TextField
          size="small"
          label="کوردی"
          value={v.kurdish}
          onChange={(e) => setField("kurdish", e.target.value)}
          disabled={disabled}
          multiline={multiline}
          minRows={multiline ? minRows : undefined}
          sx={{ flex: "1 1 200px", minWidth: 0 }}
          dir="rtl"
        />
      </Box>
      <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
        <AITranslateButton
          text={sourceText || ""}
          type={aiType}
          size="small"
          variant="outlined"
          label={aiButtonLabel || "🌐 AI translate"}
          disabled={disabled}
          onResult={({ english, arabic, kurdish }) => {
            setAiError("");
            onValueChange(mergeOnlyEmptyLocales(v, { english, arabic, kurdish }));
          }}
          onError={(msg) => setAiError(msg || "")}
        />
      </Box>
      {aiError ? (
        <Alert
          severity="error"
          onClose={() => setAiError("")}
          sx={{ mt: 1 }}
        >
          {aiError}
        </Alert>
      ) : null}
    </Box>
  );
}
