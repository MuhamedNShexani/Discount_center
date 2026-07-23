import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Alert,
  useTheme,
  alpha,
  LinearProgress,
  Divider,
} from "@mui/material";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import InputAdornment from "@mui/material/InputAdornment";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  useCityFilter,
  CITY_STEP_KEY,
  LANGUAGE_ONBOARDING_KEY,
  isOnboardingFullyComplete,
} from "../context/CityFilterContext";
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "./GoogleSignInButton";
import AppleSignInButton from "./AppleSignInButton";
import { useGoogleOAuthReturn } from "../hooks/useGoogleOAuthReturn";
import { useProfileDrawer } from "../hooks/useProfileDrawer";
import kurdishFlag from "../styles/kurdish_flag.jpg";

const LANGUAGES = [
  {
    code: "ku",
    native: "کوردی",
    hint: "Kurdish (Sorani)",
    flagImage: kurdishFlag,
  },
  { code: "en", native: "English", hint: "English", flag: "🇬🇧" },
  { code: "ar", native: "العربية", hint: "Arabic", flag: "🇸🇦" },
];

function getInitialFlowStep() {
  if (typeof window === "undefined") return "done";
  try {
    if (isOnboardingFullyComplete()) return "done";
    if (localStorage.getItem(CITY_STEP_KEY) === "1") return "account";
    if (localStorage.getItem(LANGUAGE_ONBOARDING_KEY) === "1") return "city";
  } catch {
    return "language";
  }
  return "language";
}

/**
 * First visit: step 1 language → step 2 city → step 3 account (modal, must complete).
 */
const FirstVisitCityDialog = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading, login } = useAuth();
  const { isOpen: isProfileDrawerOpen } = useProfileDrawer();
  const {
    cities,
    citiesLoading,
    selectedCity,
    cityOnboardingDone,
    completeCityStep,
    completeAccountOnboarding,
  } = useCityFilter();

  const [flowStep, setFlowStep] = useState(getInitialFlowStep);
  const [langChoice, setLangChoice] = useState(() => {
    const lng = i18n.language?.split("-")[0] || "ku";
    return LANGUAGES.some((l) => l.code === lng) ? lng : "ku";
  });
  const [cityChoice, setCityChoice] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const pickedCity =
    cityChoice ??
    (selectedCity && cities.some((c) => c.value === selectedCity)
      ? selectedCity
      : cities[0]?.value) ??
    null;

  const handleLanguageContinue = useCallback(async () => {
    await i18n.changeLanguage(langChoice);
    try {
      localStorage.setItem(LANGUAGE_ONBOARDING_KEY, "1");
    } catch {
      // ignore
    }
    setFlowStep("city");
  }, [i18n, langChoice]);

  const handleCityContinue = useCallback(() => {
    if (!pickedCity) return;
    completeCityStep(pickedCity);
    setFlowStep("account");
  }, [pickedCity, completeCityStep]);

  const handleSkipStep = useCallback(async () => {
    if (flowStep === "language") {
      await i18n.changeLanguage(langChoice || "ku");
      try {
        localStorage.setItem(LANGUAGE_ONBOARDING_KEY, "1");
      } catch {
        // ignore
      }
      setFlowStep("city");
      return;
    }
    if (flowStep === "city") {
      const city =
        pickedCity || selectedCity || cities[0]?.value || "Erbil";
      if (city) completeCityStep(city);
      setFlowStep("account");
      return;
    }
    if (flowStep === "account") {
      completeAccountOnboarding();
      setFlowStep("done");
    }
  }, [
    flowStep,
    i18n,
    langChoice,
    pickedCity,
    selectedCity,
    cities,
    completeCityStep,
    completeAccountOnboarding,
  ]);

  const handleDialogClose = useCallback(
    (_, reason) => {
      if (reason === "backdropClick" && flowStep === "account") {
        void handleSkipStep();
      }
    },
    [flowStep, handleSkipStep],
  );

  const handlePasswordLogin = useCallback(
    async (e) => {
      e?.preventDefault?.();
      setLoginError("");
      const email = loginEmail.trim();
      if (!email) {
        setLoginError(
          t("Email or username is required", {
            defaultValue: "Email or username is required",
          }),
        );
        return;
      }
      if (!loginPassword) {
        setLoginError(
          t("Password is required", { defaultValue: "Password is required" }),
        );
        return;
      }
      setLoginSubmitting(true);
      try {
        const result = await login(email, loginPassword);
        if (result?.success) {
          completeAccountOnboarding();
          setFlowStep("done");
        } else {
          setLoginError(
            result?.message ||
              t("Login failed", { defaultValue: "Login failed" }),
          );
        }
      } catch (err) {
        setLoginError(
          err?.response?.data?.message ||
            err?.message ||
            t("Login failed", { defaultValue: "Login failed" }),
        );
      } finally {
        setLoginSubmitting(false);
      }
    },
    [loginEmail, loginPassword, login, completeAccountOnboarding, t],
  );

  const handleRegisterClick = useCallback(() => {
    navigate("/login", {
      state: {
        from: { pathname: "/" },
        fromOnboarding: true,
        onboardingTab: "register",
      },
    });
  }, [navigate]);

  const handleBackToLanguage = useCallback(() => {
    try {
      localStorage.removeItem(LANGUAGE_ONBOARDING_KEY);
    } catch {
      // ignore
    }
    setFlowStep("language");
  }, []);

  const handleBackToCity = useCallback(() => {
    try {
      localStorage.removeItem(CITY_STEP_KEY);
    } catch {
      // ignore
    }
    setFlowStep("city");
  }, []);

  const handleHeaderBack = useCallback(() => {
    if (flowStep === "city") handleBackToLanguage();
    else if (flowStep === "account") handleBackToCity();
  }, [flowStep, handleBackToLanguage, handleBackToCity]);

  useEffect(() => {
    if (flowStep !== "account" || authLoading || !user) return;
    completeAccountOnboarding();
    setFlowStep("done");
  }, [flowStep, authLoading, user, completeAccountOnboarding]);

  /** First paint of onboarding: apply selected/default language (Kurdish). */
  useEffect(() => {
    if (flowStep !== "language") return;
    const current = (i18n.language || "").split("-")[0];
    if (current !== langChoice) {
      void i18n.changeLanguage(langChoice);
    }
    // intentionally once when language step is shown
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useGoogleOAuthReturn({
    enabled: flowStep === "account",
    onSuccess: () => {
      completeAccountOnboarding();
      setFlowStep("done");
    },
  });

  const isDark = theme.palette.mode === "dark";
  const isRtl = i18n.language === "ar" || i18n.language === "ku";

  const paperSx = useMemo(
    () => ({
      borderRadius: 4,
      overflow: "hidden",
      width: { xs: "100%", sm: 440 },
      maxWidth: 440,
      height: { xs: "min(640px, calc(100dvh - 40px))", sm: 640 },
      maxHeight: "calc(100dvh - 32px)",
      display: "flex",
      flexDirection: "column",
      background: isDark
        ? `linear-gradient(155deg, ${alpha("#0c1222", 0.98)} 0%, ${alpha("#151b2e", 0.99)} 45%, ${alpha("#0a0f1a", 0.98)} 100%)`
        : `linear-gradient(180deg, ${alpha("#ffffff", 0.98)} 0%, ${alpha("#f4f7ff", 0.99)} 50%, ${alpha("#eef3ff", 0.97)} 100%)`,
      border: `1px solid ${isDark ? alpha("#fff", 0.08) : alpha("#1e6fd9", 0.12)}`,
      boxShadow: isDark
        ? `0 24px 80px rgba(0,0,0,0.55), 0 0 0 1px ${alpha("#fff", 0.04)} inset`
        : `0 28px 90px ${alpha("#1e6fd9", 0.12)}, 0 12px 40px ${alpha("#000", 0.06)}`,
      backdropFilter: "blur(20px)",
    }),
    [isDark],
  );

  const onLoginPage = location.pathname === "/login";
  const showDialog =
    !onLoginPage &&
    !isProfileDrawerOpen &&
    flowStep !== "done" &&
    (flowStep === "language" ||
      flowStep === "account" ||
      (flowStep === "city" && !cityOnboardingDone));

  const stepIndex =
    flowStep === "language" ? 0 : flowStep === "city" ? 1 : 2;

  const primaryButtonSx = {
    py: 1.5,
    fontWeight: 800,
    letterSpacing: "0.02em",
    borderRadius: 2.5,
    textTransform: "none",
    fontSize: "1rem",
    background: `linear-gradient(135deg, #1e6fd9 0%, #0d47a1 55%, #1e40af 100%)`,
    boxShadow: `0 12px 36px ${alpha("#1e6fd9", 0.35)}`,
    "&:hover": {
      background: `linear-gradient(135deg, #2563eb 0%, #1e40af 100%)`,
      boxShadow: `0 14px 40px ${alpha("#1e6fd9", 0.4)}`,
    },
  };

  const outlinedButtonSx = {
    py: 1.35,
    fontWeight: 700,
    borderRadius: 2.5,
    textTransform: "none",
    fontSize: "1rem",
    borderColor: isDark ? alpha("#fff", 0.2) : alpha("#000", 0.12),
    color: "text.primary",
    "&:hover": {
      borderColor: alpha("#1e6fd9", 0.55),
      bgcolor: isDark ? alpha("#1e6fd9", 0.1) : alpha("#1e6fd9", 0.06),
    },
  };

  if (flowStep === "done") {
    return null;
  }

  return (
    <Dialog
      open={showDialog}
      disableEscapeKeyDown
      onClose={handleDialogClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(8px)",
            backgroundColor: isDark
              ? alpha("#020617", 0.75)
              : alpha("#0f172a", 0.35),
          },
        },
      }}
      PaperProps={{
        elevation: 0,
        sx: paperSx,
      }}
    >
      <DialogContent
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          pt: { xs: 2, sm: 2.5 },
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Top bar: back · steps · skip */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "72px 1fr 72px",
            alignItems: "center",
            mb: 2,
            flexShrink: 0,
            minHeight: 40,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
            {flowStep !== "language" ? (
              <IconButton
                type="button"
                aria-label={t("onboarding.back", { defaultValue: "Back" })}
                onClick={handleHeaderBack}
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    bgcolor: isDark
                      ? alpha("#fff", 0.06)
                      : alpha("#000", 0.04),
                    color: "text.primary",
                  },
                }}
              >
                <ArrowBackRoundedIcon
                  fontSize="small"
                  sx={{ transform: isRtl ? "scaleX(-1)" : undefined }}
                />
              </IconButton>
            ) : null}
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.75,
            }}
          >
            {[0, 1, 2].map((index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <Box
                    sx={{
                      width: 28,
                      height: 2,
                      borderRadius: 1,
                      bgcolor:
                        stepIndex >= index
                          ? alpha("#1e6fd9", 0.45)
                          : alpha("#1e6fd9", 0.2),
                    }}
                  />
                )}
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor:
                      stepIndex >= index
                        ? "primary.main"
                        : alpha("#1e6fd9", 0.35),
                  }}
                />
              </React.Fragment>
            ))}
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="button"
              onClick={() => void handleSkipStep()}
              sx={{
                minWidth: 0,
                px: 1,
                py: 0.5,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.875rem",
                color: "text.secondary",
                borderRadius: 2,
                "&:hover": {
                  bgcolor: isDark
                    ? alpha("#fff", 0.06)
                    : alpha("#000", 0.04),
                  color: "text.primary",
                },
              }}
            >
              {t("Skip", { defaultValue: "Skip" })}
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
          }}
        >
        <AnimatePresence mode="wait">
          {flowStep === "language" ? (
            <motion.div
              key="lang"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.22 }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: "100%",
              }}
            >
              <Box sx={{ textAlign: "center", mb: 3 }}>
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                >
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      mx: "auto",
                      mb: 2,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isDark
                        ? `linear-gradient(135deg, ${alpha("#3b82f6", 0.35)} 0%, ${alpha("#8b5cf6", 0.25)} 100%)`
                        : `linear-gradient(135deg, ${alpha("#1e6fd9", 0.2)} 0%, ${alpha("#6366f1", 0.15)} 100%)`,
                      border: `1px solid ${alpha("#1e6fd9", isDark ? 0.35 : 0.25)}`,
                      boxShadow: `0 8px 32px ${alpha("#1e6fd9", isDark ? 0.2 : 0.15)}`,
                    }}
                  >
                    <TranslateRoundedIcon
                      sx={{
                        fontSize: 40,
                        color: isDark ? "#93c5fd" : "#1e6fd9",
                      }}
                    />
                  </Box>
                </motion.div>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                    mb: 1,
                    background: isDark
                      ? `linear-gradient(90deg, #f8fafc 0%, #cbd5e1 100%)`
                      : `linear-gradient(90deg, #0f172a 0%, #334155 100%)`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t("onboarding.language.title", {
                    defaultValue: "Choose your language",
                  })}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    maxWidth: 360,
                    mx: "auto",
                    lineHeight: 1.6,
                  }}
                >
                  {t("onboarding.language.subtitle", {
                    defaultValue:
                      "You can change this anytime from your profile.",
                  })}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.25,
                  mb: 3,
                  flex: 1,
                }}
              >
                {LANGUAGES.map((lang, index) => {
                  const selected = langChoice === lang.code;
                  return (
                    <motion.div
                      key={lang.code}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.22 }}
                    >
                      <Box
                        component="button"
                        type="button"
                        onClick={() => setLangChoice(lang.code)}
                        sx={{
                          width: "100%",
                          textAlign: "left",
                          cursor: "pointer",
                          border: "none",
                          p: 0,
                          background: "transparent",
                          font: "inherit",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            p: 1.75,
                            borderRadius: 2.5,
                            border: `2px solid ${
                              selected
                                ? alpha("#1e6fd9", isDark ? 0.85 : 0.65)
                                : isDark
                                  ? alpha("#fff", 0.06)
                                  : alpha("#000", 0.06)
                            }`,
                            background: selected
                              ? isDark
                                ? alpha("#1e6fd9", 0.12)
                                : alpha("#1e6fd9", 0.08)
                              : isDark
                                ? alpha("#fff", 0.03)
                                : alpha("#fff", 0.9),
                            boxShadow: selected
                              ? `0 8px 28px ${alpha("#1e6fd9", isDark ? 0.2 : 0.12)}`
                              : "none",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              borderColor: alpha("#1e6fd9", 0.45),
                              transform: "translateY(-2px)",
                            },
                          }}
                        >
                          {lang.flagImage ? (
                            <Box
                              component="img"
                              src={lang.flagImage}
                              alt=""
                              sx={{
                                width: 34,
                                height: 24,
                                objectFit: "cover",
                                borderRadius: 0.75,
                                flexShrink: 0,
                                boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                              }}
                            />
                          ) : (
                            <Typography sx={{ fontSize: "1.5rem" }}>
                              {lang.flag}
                            </Typography>
                          )}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontWeight: 800,
                                fontSize: "1.05rem",
                                color: "text.primary",
                                lineHeight: 1.25,
                              }}
                            >
                              {lang.native}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary" }}
                            >
                              {lang.hint}
                            </Typography>
                          </Box>
                          {selected && (
                            <CheckRoundedIcon
                              sx={{
                                fontSize: 22,
                                color: "primary.main",
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </motion.div>
                  );
                })}
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleLanguageContinue}
                sx={{ ...primaryButtonSx, mt: "auto", flexShrink: 0 }}
              >
                {t("onboarding.language.continue", {
                  defaultValue: "Continue",
                })}
              </Button>
            </motion.div>
          ) : flowStep === "city" ? (
            <motion.div
              key="city"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22 }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: "100%",
              }}
            >
              <Box sx={{ textAlign: "center", mb: 3 }}>
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                >
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      mx: "auto",
                      mb: 2,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isDark
                        ? `linear-gradient(135deg, ${alpha("#3b82f6", 0.35)} 0%, ${alpha("#8b5cf6", 0.25)} 100%)`
                        : `linear-gradient(135deg, ${alpha("#1e6fd9", 0.2)} 0%, ${alpha("#6366f1", 0.15)} 100%)`,
                      border: `1px solid ${alpha("#1e6fd9", isDark ? 0.35 : 0.25)}`,
                      boxShadow: `0 8px 32px ${alpha("#1e6fd9", isDark ? 0.2 : 0.15)}`,
                    }}
                  >
                    <LocationOnRoundedIcon
                      sx={{
                        fontSize: 40,
                        color: isDark ? "#93c5fd" : "#1e6fd9",
                      }}
                    />
                  </Box>
                </motion.div>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                    mb: 1,
                    background: isDark
                      ? `linear-gradient(90deg, #f8fafc 0%, #cbd5e1 100%)`
                      : `linear-gradient(90deg, #0f172a 0%, #334155 100%)`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t("onboarding.city.title", {
                    defaultValue: "Where are you shopping?",
                  })}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    maxWidth: 360,
                    mx: "auto",
                    lineHeight: 1.6,
                  }}
                >
                  {t("onboarding.city.subtitle", {
                    defaultValue:
                      "Pick your city for tailored offers, stores, and delivery options near you.",
                  })}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                    sm: "repeat(2, 1fr)",
                  },
                  gap: 1.25,
                  mb: 3,
                  flex: 1,
                  alignContent: "start",
                  minHeight: citiesLoading ? 120 : "auto",
                }}
              >
                {citiesLoading || cities.length === 0 ? (
                  <Box sx={{ gridColumn: "1 / -1" }}>
                    <LinearProgress
                      sx={{ height: 3, borderRadius: 1, mb: 2 }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textAlign="center"
                    >
                      {t("onboarding.city.loading", {
                        defaultValue: "Loading cities…",
                      })}
                    </Typography>
                  </Box>
                ) : (
                  <AnimatePresence>
                    {cities.map((city, index) => {
                      const selected = pickedCity === city.value;
                      return (
                        <motion.div
                          key={city.value}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04, duration: 0.25 }}
                        >
                          <Box
                            component="button"
                            type="button"
                            onClick={() => setCityChoice(city.value)}
                            sx={{
                              width: "100%",
                              textAlign: "left",
                              cursor: "pointer",
                              border: "none",
                              p: 0,
                              background: "transparent",
                              font: "inherit",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.25,
                                p: 1.75,
                                borderRadius: 2.5,
                                border: `2px solid ${
                                  selected
                                    ? alpha("#1e6fd9", isDark ? 0.85 : 0.65)
                                    : isDark
                                      ? alpha("#fff", 0.06)
                                      : alpha("#000", 0.06)
                                }`,
                                background: selected
                                  ? isDark
                                    ? alpha("#1e6fd9", 0.12)
                                    : alpha("#1e6fd9", 0.08)
                                  : isDark
                                    ? alpha("#fff", 0.03)
                                    : alpha("#fff", 0.9),
                                boxShadow: selected
                                  ? `0 8px 28px ${alpha("#1e6fd9", isDark ? 0.2 : 0.12)}`
                                  : "none",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  borderColor: alpha("#1e6fd9", 0.45),
                                  transform: "translateY(-2px)",
                                },
                              }}
                            >
                              <Typography
                                sx={{
                                  fontWeight: 700,
                                  fontSize: "0.95rem",
                                  flex: 1,
                                  color: "text.primary",
                                  lineHeight: 1.25,
                                }}
                              >
                                {city.label}
                              </Typography>
                              {selected && (
                                <CheckRoundedIcon
                                  sx={{
                                    fontSize: 22,
                                    color: "primary.main",
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                disabled={!pickedCity || citiesLoading || cities.length === 0}
                onClick={handleCityContinue}
                sx={{
                  ...primaryButtonSx,
                  mt: "auto",
                  flexShrink: 0,
                  "&.Mui-disabled": {
                    background: alpha("#1e6fd9", 0.25),
                  },
                }}
              >
                {t("onboarding.city.continue", { defaultValue: "Continue" })}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="account"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22 }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: "100%",
              }}
            >
              <Box sx={{ textAlign: "center", mb: 3 }}>
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                >
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      mx: "auto",
                      mb: 2,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isDark
                        ? `linear-gradient(135deg, ${alpha("#3b82f6", 0.35)} 0%, ${alpha("#8b5cf6", 0.25)} 100%)`
                        : `linear-gradient(135deg, ${alpha("#1e6fd9", 0.2)} 0%, ${alpha("#6366f1", 0.15)} 100%)`,
                      border: `1px solid ${alpha("#1e6fd9", isDark ? 0.35 : 0.25)}`,
                      boxShadow: `0 8px 32px ${alpha("#1e6fd9", isDark ? 0.2 : 0.15)}`,
                    }}
                  >
                    <PersonRoundedIcon
                      sx={{
                        fontSize: 40,
                        color: isDark ? "#93c5fd" : "#1e6fd9",
                      }}
                    />
                  </Box>
                </motion.div>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                    mb: 1,
                    background: isDark
                      ? `linear-gradient(90deg, #f8fafc 0%, #cbd5e1 100%)`
                      : `linear-gradient(90deg, #0f172a 0%, #334155 100%)`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {t("onboarding.account.title", {
                    defaultValue: "Sign in to continue",
                  })}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    maxWidth: 360,
                    mx: "auto",
                    lineHeight: 1.6,
                  }}
                >
                  {t("onboarding.account.subtitle", {
                    defaultValue:
                      "Create an account to save likes and preferences, or skip for now.",
                  })}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.25,
                  flex: 1,
                }}
              >
                <GoogleSignInButton
                  returnTo="/"
                  buttonSx={outlinedButtonSx}
                  showEnvWarning={false}
                />
                <AppleSignInButton />
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    py: 0.25,
                  }}
                >
                  <Divider sx={{ flex: 1 }} />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 600,
                    }}
                  >
                    {t("or")}
                  </Typography>
                  <Divider sx={{ flex: 1 }} />
                </Box>
                <Box
                  component="form"
                  onSubmit={(e) => void handlePasswordLogin(e)}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.25,
                  }}
                >
                  {loginError ? (
                    <Alert
                      severity="error"
                      onClose={() => setLoginError("")}
                      sx={{ borderRadius: 2, py: 0.25 }}
                    >
                      {loginError}
                    </Alert>
                  ) : null}
                  <TextField
                    fullWidth
                    size="small"
                    type="email"
                    autoComplete="username"
                    label={t("Email", { defaultValue: "Email" })}
                    placeholder={t("Email or username", {
                      defaultValue: "Email or username",
                    })}
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      if (loginError) setLoginError("");
                    }}
                    disabled={loginSubmitting}
                    sx={{
                      "& .MuiOutlinedInput-root": { borderRadius: 2.5 },
                    }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    label={t("Password", { defaultValue: "Password" })}
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (loginError) setLoginError("");
                    }}
                    disabled={loginSubmitting}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            type="button"
                            aria-label={
                              showPassword
                                ? t("Hide password", {
                                    defaultValue: "Hide password",
                                  })
                                : t("Show password", {
                                    defaultValue: "Show password",
                                  })
                            }
                            onClick={() => setShowPassword((v) => !v)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? (
                              <VisibilityOff fontSize="small" />
                            ) : (
                              <Visibility fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": { borderRadius: 2.5 },
                    }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loginSubmitting}
                    sx={primaryButtonSx}
                  >
                    {loginSubmitting
                      ? t("Signing in...", { defaultValue: "Signing in..." })
                      : t("Sign In", { defaultValue: "Sign In" })}
                  </Button>
                </Box>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<PersonAddRoundedIcon />}
                  onClick={handleRegisterClick}
                  disabled={loginSubmitting}
                  sx={outlinedButtonSx}
                >
                  {t("Register", { defaultValue: "Register" })}
                </Button>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default FirstVisitCityDialog;
