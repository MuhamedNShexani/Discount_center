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

const isValidHex = (value) =>
  typeof value === "string" && /^#([0-9a-fA-F]{6})$/.test(value.trim());

export const createAppTheme = (
  {
    darkMode = false,
    language = "en",
    primaryColor = "",
    fontFamily = "",
    activeFontKey = "default",
    activeTheme = "default",
  } = {},
) => {
  const themePrimaryMap = {
    default: BRAND.primaryBlue,
    blackWhite: "#000000",
    ramadan: "#D4AF37",
    rain: "#4A90E2",
    neon1: "#7C3AED",
    neon2: "#FF2D8D",
    "flash-sale": "#FF3B30",
    luxury: "#0B0B0B",
    "eco-green": "#2ECC71",
    ice: "#AEE6F9",
    festival: "#7B2CBF",
    tech: "#22D3EE",
    minimal: "#111827",
    sunset: "#FF7A1A",
    "middle-east": "#1E3A8A",
    marketplace: "#2563EB",
  };

  const primaryMain = isValidHex(primaryColor)
    ? primaryColor.trim()
    : themePrimaryMap[activeTheme] || BRAND.primaryBlue;
  const typographyFontFamily =
    typeof fontFamily === "string" && fontFamily.trim().length > 0
      ? fontFamily.trim()
      : (() => {
          const fontByKey = {
            default:
              "'NRT', 'Noto Sans Kurdish', 'Scheherazade New', 'Arial', sans-serif",
            nrt:
              "'NRT', 'Noto Sans Kurdish', 'Scheherazade New', 'Arial', sans-serif",
            system: "system-ui, sans-serif",
            arial: "Arial, sans-serif",
            roboto: "Roboto, Arial, sans-serif",
          };
          if (fontByKey[activeFontKey]) return fontByKey[activeFontKey];
          // Treat any other key as a registered public font-family name.
          return `'${activeFontKey}', ${fontByKey.default}`;
        })();

  return createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: primaryMain,
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
      fontFamily: typographyFontFamily,
      h1: { color: darkMode ? "#F9FAFB" : primaryMain },
      h2: { color: darkMode ? "#F9FAFB" : primaryMain },
      h3: { color: darkMode ? "#F9FAFB" : primaryMain },
      h4: { color: darkMode ? "#F9FAFB" : primaryMain },
      h5: { color: darkMode ? "#F9FAFB" : primaryMain },
      h6: { color: darkMode ? "#F9FAFB" : primaryMain },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ":root": {
            "--brand-primary-blue": primaryMain,
            "--brand-secondary-blue": BRAND.secondaryBlue,
            "--brand-accent-orange": BRAND.accentOrange,
            "--brand-light-orange": BRAND.lightOrange,
            "--brand-bg": darkMode ? "#0F172A" : BRAND.background,
            "--brand-surface": darkMode ? "#111827" : BRAND.surface,
            "--brand-text-primary": darkMode ? "#F9FAFB" : BRAND.textPrimary,
            "--brand-text-secondary": darkMode ? "#CBD5E1" : BRAND.textSecondary,
            ...(darkMode
              ? {
                  "--color-bg": "#0F172A",
                  "--color-surface": "#111827",
                }
              : {}),
            "--brand-radius": "12px",
            "--brand-transition": "all 240ms ease",
            "--app-font-family": typographyFontFamily,
          },
          html: {
            backgroundColor: darkMode ? "#0F172A" : BRAND.background,
          },
          body: {
            fontFamily: "var(--app-font-family)",
            WebkitTapHighlightColor: "transparent",
            backgroundColor: darkMode ? "#0F172A" : BRAND.background,
          },
          "#root": {
            backgroundColor: darkMode ? "#0F172A" : BRAND.background,
            minHeight: "100%",
          },
          button: {
            WebkitTapHighlightColor: "transparent",
          },
          "button:focus:not(:focus-visible)": {
            outline: "none",
          },
        },
      },
      MuiButtonBase: {
        defaultProps: {
          disableRipple: false,
        },
        styleOverrides: {
          root: {
            WebkitTapHighlightColor: "transparent",
            "&:focus:not(:focus-visible)": {
              outline: "none",
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          // Real gradient is on NavigationBar via inline style (not flipped in RTL).
          root: {
            backgroundColor: "transparent",
            backgroundImage: "none",
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
              borderColor: primaryMain,
              color: primaryMain,
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
        defaultProps: {
          disableRipple: true,
          disableFocusRipple: true,
        },
        styleOverrides: {
          root: {
            transition: "all 220ms ease",
            WebkitTapHighlightColor: "transparent",
            "&:focus:not(:focus-visible)": {
              outline: "none",
            },
            "&.Mui-focusVisible": {
              outline: `2px solid ${primaryMain}`,
              outlineOffset: 2,
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            WebkitTapHighlightColor: "transparent",
            "&:focus:not(:focus-visible)": {
              backgroundColor: "transparent",
            },
          },
        },
      },
    },
  });
};

