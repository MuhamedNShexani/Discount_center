import React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  IconButton,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import CloseIcon from "@mui/icons-material/Close";

const ltrCache = createCache({ key: "muiltr-policy", stylisPlugins: [] });

const CONTACT_EMAIL = "idashkan2026@gmail.com";

const PrivacyPolicy = ({ embedded = false, onClose } = {}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { t } = useTranslation();

  const outerSx = embedded
    ? {
        width: { xs: "100vw", sm: 420 },
        maxWidth: "100%",
        height: "100%",
        minHeight: 0,
        overflow: "auto",
        boxSizing: "border-box",
        px: 2,
        pt: 2.5,
        pb: 3,
        direction: "ltr",
        textAlign: "left",
      }
    : {
        minHeight: "60vh",
        py: 1,
        direction: "ltr",
        textAlign: "left",
      };

  return (
    <CacheProvider value={ltrCache}>
      <Box dir="ltr" sx={outerSx}>
        {embedded ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 2,
              direction: "ltr",
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                bgcolor: isDark ? alpha("#1e6fd9", 0.22) : alpha("#1e6fd9", 0.12),
                color: "primary.main",
              }}
            >
              <PrivacyTipIcon sx={{ fontSize: "1.1rem" }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                }}
              >
                {t("Privacy Policy")}
              </Typography>
            </Box>
            <IconButton
              onClick={onClose}
              size="small"
              aria-label={t("Close")}
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
        ) : null}

        <Container maxWidth={embedded ? false : "md"} disableGutters={embedded}>
          <Paper
            elevation={0}
            sx={{
              p: embedded ? { xs: 1.5, sm: 2 } : { xs: 2, sm: 4 },
              borderRadius: embedded ? 0 : 2,
              backgroundColor: isDark
                ? theme.palette.background.paper
                : "#ffffff",
              border: embedded ? "none" : `1px solid ${theme.palette.divider}`,
            }}
          >
            {!embedded ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 4,
                  pb: 2,
                  borderBottom: `2px solid ${theme.palette.primary.main}`,
                }}
              >
                <PrivacyTipIcon
                  sx={{ fontSize: 48, color: theme.palette.primary.main }}
                />
                <Box>
                  <Typography
                    variant="h4"
                    component="h1"
                    fontWeight={700}
                    color={theme.palette.text.primary}
                    gutterBottom
                  >
                    Privacy Policy
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("Last updated")}: March 9, 2025
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2.5 }}
              >
                {t("Last updated")}: March 9, 2025
              </Typography>
            )}

            <Typography variant="body1" paragraph sx={{ mb: 3 }}>
              {t("Privacy Policy intro")}
            </Typography>

            {/* Section 1 */}
            <Typography
              variant="h5"
              fontWeight={600}
              gutterBottom
              sx={{ mt: 4, mb: 2 }}
            >
              {t("Interpretation and Definitions")}
            </Typography>
            <Typography variant="h6" fontWeight={500} sx={{ mt: 2, mb: 1 }}>
              {t("Interpretation")}
            </Typography>
            <Typography variant="body1" paragraph>
              {t("Privacy Interpretation text")}
            </Typography>
            <Typography variant="h6" fontWeight={500} sx={{ mt: 2, mb: 1 }}>
              {t("Definitions")}
            </Typography>
            <Box component="ul" sx={{ pl: 3, "& li": { mb: 1 } }}>
              <li>
                <strong>Account</strong>: {t("Privacy Account def")}
              </li>
              <li>
                <strong>{t("Application")}</strong>:{" "}
                {t("Privacy Application def")}
              </li>
              <li>
                <strong>{t("Company")}</strong>: {t("Privacy Company def")}
              </li>
              <li>
                <strong>{t("Country")}</strong>: {t("Privacy Country def")}
              </li>
              <li>
                <strong>{t("Device")}</strong>: {t("Privacy Device def")}
              </li>
              <li>
                <strong>{t("Personal Data")}</strong>:{" "}
                {t("Privacy Personal Data def")}
              </li>
              <li>
                <strong>{t("Service")}</strong>: {t("Privacy Service def")}
              </li>
              <li>
                <strong>{t("Usage Data")}</strong>:{" "}
                {t("Privacy Usage Data def")}
              </li>
              <li>
                <strong>{t("You")}</strong>: {t("Privacy You def")}
              </li>
            </Box>

            {/* Section 2 */}
            <Typography
              variant="h5"
              fontWeight={600}
              gutterBottom
              sx={{ mt: 4, mb: 2 }}
            >
              {t("Collecting and Using Your Personal Data")}
            </Typography>
            <Typography variant="h6" fontWeight={500} sx={{ mt: 2, mb: 1 }}>
              {t("Types of Data Collected")}
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5 }}>
              {t("Personal Data")}
            </Typography>
            <Typography variant="body1" paragraph>
              {t("Privacy Personal Data collect")}
            </Typography>
            <Box component="ul" sx={{ pl: 3, "& li": { mb: 0.5 } }}>
              <li>{t("Email address")}</li>
              <li>{t("First name and last name")}</li>
              <li>{t("Phone number")}</li>
              <li>{t("Usage Data")}</li>
            </Box>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5 }}>
              {t("Usage Data")}
            </Typography>
            <Typography variant="body1" paragraph>
              {t("Privacy Usage Data collect")}
            </Typography>

            {/* Use of Data */}
            <Typography variant="h6" fontWeight={500} sx={{ mt: 2, mb: 1 }}>
              {t("Use of Your Personal Data")}
            </Typography>
            <Typography variant="body1" paragraph>
              {t("Privacy Use of Data intro")}
            </Typography>
            <Box component="ul" sx={{ pl: 3, "& li": { mb: 0.5 } }}>
              <li>{t("Privacy Use 1")}</li>
              <li>{t("Privacy Use 2")}</li>
              <li>{t("Privacy Use 3")}</li>
              <li>{t("Privacy Use 4")}</li>
              <li>{t("Privacy Use 5")}</li>
              <li>{t("Privacy Use 6")}</li>
            </Box>

            {/* Retention */}
            <Typography variant="h6" fontWeight={500} sx={{ mt: 2, mb: 1 }}>
              {t("Retention of Your Personal Data")}
            </Typography>
            <Typography variant="body1" paragraph>
              {t("Privacy Retention text")}
            </Typography>

            {/* Deletion */}
            <Typography variant="h6" fontWeight={500} sx={{ mt: 2, mb: 1 }}>
              {t("Deletion of Your Personal Data")}
            </Typography>
            <Typography variant="body1" paragraph>
              {t("Privacy Deletion text")}
            </Typography>

            {/* Security */}
            <Typography variant="h6" fontWeight={500} sx={{ mt: 2, mb: 1 }}>
              {t("Security of Your Personal Data")}
            </Typography>
            <Typography variant="body1" paragraph>
              {t("Privacy Security text")}
            </Typography>

            {/* Children */}
            <Typography
              variant="h5"
              fontWeight={600}
              gutterBottom
              sx={{ mt: 4, mb: 2 }}
            >
              {t("Children's Privacy")}
            </Typography>
            <Typography variant="body1" paragraph>
              {t("Privacy Children text")}
            </Typography>

            {/* Links */}
            <Typography
              variant="h5"
              fontWeight={600}
              gutterBottom
              sx={{ mt: 4, mb: 2 }}
            >
              {t("Links to Other Websites")}
            </Typography>
            <Typography variant="body1" paragraph>
              {t("Privacy Links text")}
            </Typography>

            {/* Changes */}
            <Typography
              variant="h5"
              fontWeight={600}
              gutterBottom
              sx={{ mt: 4, mb: 2 }}
            >
              {t("Changes to this Privacy Policy")}
            </Typography>
            <Typography variant="body1" paragraph>
              {t("Privacy Changes text")}
            </Typography>

            {/* Contact */}
            <Typography
              variant="h5"
              fontWeight={600}
              gutterBottom
              sx={{ mt: 4, mb: 2 }}
            >
              Contact Us
            </Typography>
            <Typography variant="body1" paragraph>
              {t("Privacy Contact intro")}
            </Typography>
            <Typography variant="body1">
              {t("By email")}:{" "}
              <Typography
                component="a"
                href={`mailto:${CONTACT_EMAIL}`}
                sx={{
                  color: theme.palette.primary.main,
                  textDecoration: "none",
                  fontWeight: 600,
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {CONTACT_EMAIL}
              </Typography>
            </Typography>
          </Paper>
        </Container>
      </Box>
    </CacheProvider>
  );
};

export default PrivacyPolicy;
