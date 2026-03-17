import { createTheme } from "@mui/material/styles";

const BRAND = {
  primaryBlue: "#1E6FD9",
  secondaryBlue: "#4A90E2",
  accentOrange: "#FF7A1A",
  lightOrange: "#FFA94D",
  background: "#F5F7FA",
  surface: "#FFFFFF",
  textPrimary: "#1A1A1A",
  textSecondary: "#6B7280",
};

export const createAppTheme = ({ darkMode = false, language = "en" } = {}) =>
  createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: BRAND.primaryBlue,
        light: BRAND.secondaryBlue,
        dark: "#155AB2",
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: BRAND.accentOrange,
        light: BRAND.lightOrange,
        dark: "#D9630E",
        contrastText: "#FFFFFF",
      },
      background: darkMode
        ? { default: "#0F172A", paper: "#111827" }
        : { default: BRAND.background, paper: BRAND.surface },
      text: darkMode
        ? { primary: "#F9FAFB", secondary: "#CBD5E1" }
        : { primary: BRAND.textPrimary, secondary: BRAND.textSecondary },
      info: { main: BRAND.secondaryBlue },
      warning: { main: BRAND.lightOrange },
      error: { main: "#DC2626" },
      success: { main: "#16A34A" },
      divider: darkMode ? "rgba(148,163,184,0.3)" : "rgba(30,111,217,0.16)",
      brand: BRAND,
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily:
        language === "ku"
          ? "'NRT', 'Noto Sans Kurdish', 'Scheherazade New', 'Arial', sans-serif"
          : "'Roboto', 'Helvetica', 'Arial', sans-serif",
      h1: { color: darkMode ? "#F9FAFB" : BRAND.primaryBlue },
      h2: { color: darkMode ? "#F9FAFB" : BRAND.primaryBlue },
      h3: { color: darkMode ? "#F9FAFB" : BRAND.primaryBlue },
      h4: { color: darkMode ? "#F9FAFB" : BRAND.primaryBlue },
      h5: { color: darkMode ? "#F9FAFB" : BRAND.primaryBlue },
      h6: { color: darkMode ? "#F9FAFB" : BRAND.primaryBlue },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ":root": {
            "--brand-primary-blue": BRAND.primaryBlue,
            "--brand-secondary-blue": BRAND.secondaryBlue,
            "--brand-accent-orange": BRAND.accentOrange,
            "--brand-light-orange": BRAND.lightOrange,
            "--brand-bg": BRAND.background,
            "--brand-surface": BRAND.surface,
            "--brand-text-primary": BRAND.textPrimary,
            "--brand-text-secondary": BRAND.textSecondary,
            "--brand-radius": "12px",
            "--brand-transition": "all 240ms ease",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background:
              "linear-gradient(120deg, #1E6FD9 0%, #4A90E2 56%, #FF7A1A 100%)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: "none",
            fontWeight: 700,
            transition: "all 240ms ease",
          },
        },
        variants: [
          {
            props: { variant: "contained" },
            style: {
              backgroundColor: BRAND.accentOrange,
              color: "#FFFFFF",
              "&:hover": {
                backgroundColor: "#E66D14",
                transform: "translateY(-1px)",
              },
            },
          },
          {
            props: { variant: "outlined" },
            style: {
              borderColor: BRAND.primaryBlue,
              color: BRAND.primaryBlue,
              "&:hover": {
                borderColor: BRAND.secondaryBlue,
                backgroundColor: "rgba(74,144,226,0.08)",
              },
            },
          },
        ],
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            backgroundColor: BRAND.surface,
            boxShadow: "0 6px 18px rgba(30,111,217,0.10)",
            border: "1px solid rgba(30,111,217,0.16)",
            transition: "all 240ms ease",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 999 },
          colorPrimary: {
            backgroundColor: BRAND.accentOrange,
            color: "#FFFFFF",
            fontWeight: 700,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            color: "rgba(255,255,255,0.84)",
            "&.Mui-selected": {
              color: "#FFFFFF",
              backgroundColor: "rgba(255,122,26,0.24)",
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: "all 220ms ease",
          },
        },
      },
    },
  });

