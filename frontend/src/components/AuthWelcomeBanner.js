import React from "react";
import { Alert, Snackbar } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

export default function AuthWelcomeBanner() {
  const { t } = useTranslation();
  const { welcomeNotice, dismissWelcome } = useAuth();

  return (
    <Snackbar
      key={welcomeNotice?.id}
      open={Boolean(welcomeNotice)}
      autoHideDuration={4500}
      onClose={dismissWelcome}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      sx={{ mt: { xs: 7, sm: 1 } }}
    >
      <Alert
        severity="success"
        variant="filled"
        onClose={dismissWelcome}
        sx={{ width: "100%", fontWeight: 700, borderRadius: 2 }}
      >
        {welcomeNotice?.name
          ? t("Welcome, {{name}}!", { name: welcomeNotice.name })
          : t("Welcome!")}
      </Alert>
    </Snackbar>
  );
}
