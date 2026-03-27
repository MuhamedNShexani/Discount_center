import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import PaletteIcon from "@mui/icons-material/Palette";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useTranslation } from "react-i18next";
import { useActiveTheme } from "../context/ActiveThemeContext";
import { themeAPI } from "../services/api";

const THEME_OPTIONS = [
  { id: "default", label: "Default Theme" },
  { id: "blackWhite", label: "Black & White Theme" },
  { id: "ramadan", label: "Ramadan Theme" },
  { id: "rain", label: "Rain Theme" },
  { id: "neon1", label: "Neon Theme 1" },
  { id: "neon2", label: "Neon Theme 2" },
  { id: "flash-sale", label: "Flash Sale" },
  { id: "luxury", label: "Luxury" },
  { id: "eco-green", label: "Eco Green" },
  { id: "ice", label: "Ice" },
  { id: "festival", label: "Festival" },
  { id: "tech", label: "Tech" },
  { id: "minimal", label: "Minimal" },
  { id: "sunset", label: "Sunset" },
  { id: "middle-east", label: "Middle East" },
  { id: "marketplace", label: "Marketplace" },
];

const FALLBACK_FONT_OPTIONS = [
  { id: "default", label: "Default" },
  { id: "system", label: "System" },
  { id: "arial", label: "Arial" },
  { id: "roboto", label: "Roboto" },
];

const NAV_TEMPLATES = [
  { id: "template1", label: "Template 1 (Default)" },
  { id: "template2", label: "Template 2 " },
  { id: "custom", label: "Custom (Slots)" },
];

const NAV_ACTIONS = [
  { id: "", label: "Empty" },
  { id: "label", label: "Label (center text)" },
  { id: "home", label: "Home" },
  { id: "search", label: "Search" },
  { id: "refresh", label: "Refresh" },
  { id: "categories", label: "Categories" },
  { id: "reels", label: "Reels" },
  { id: "favourites", label: "Favourites" },
  { id: "stores", label: "Stores" },
  { id: "gifts", label: "Gifts" },
  { id: "shopping", label: "Shopping" },
  { id: "profile", label: "Account/Profile" },
];

const CustomizationPage = () => {
  const { t } = useTranslation();
  const { activeTheme, activeFontKey, navConfig, fetchTheme } =
    useActiveTheme();
  const [selectedTheme, setSelectedTheme] = useState(activeTheme);
  const [selectedFont, setSelectedFont] = useState(activeFontKey || "default");
  const [selectedNav, setSelectedNav] = useState(navConfig || {});
  const [isDirty, setIsDirty] = useState(false);
  const lastServerSnapshotRef = useRef({
    activeTheme,
    activeFontKey: activeFontKey || "default",
    navConfig: navConfig || {},
  });
  const [fontOptions, setFontOptions] = useState(FALLBACK_FONT_OPTIONS);
  const [saveToastOpen, setSaveToastOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(true);

  // keep UI selection in sync with server theme changes
  useEffect(() => {
    const nextSnapshot = {
      activeTheme,
      activeFontKey: activeFontKey || "default",
      navConfig: navConfig || {},
    };

    // If user is actively editing, don't overwrite their changes due to polling.
    if (isDirty) return;

    lastServerSnapshotRef.current = nextSnapshot;
    setSelectedTheme(nextSnapshot.activeTheme);
    setSelectedFont(nextSnapshot.activeFontKey);
    setSelectedNav(nextSnapshot.navConfig);
  }, [activeTheme, activeFontKey, navConfig, isDirty]);

  useEffect(() => {
    let mounted = true;
    fetch("/fonts/fonts.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!mounted) return;
        const families = Array.isArray(data?.families) ? data.families : [];
        const dynamic = families.map((f) => ({ id: f, label: f }));
        setFontOptions([...FALLBACK_FONT_OPTIONS, ...dynamic]);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const fontPreview = useMemo(() => {
    const picked = THEME_OPTIONS.find((f) => f.id === selectedTheme);
    return picked?.label || selectedTheme;
  }, [selectedTheme]);

  return (
    <Container maxWidth="md" sx={{ pt: { xs: 2, md: 4 }, pb: 6 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <PaletteIcon color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {t("Customization")}
            </Typography>
          </Box>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {t("Admin selects active theme. All users see it automatically.")}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr" },
              gap: 2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <PaletteIcon fontSize="small" />
                {t("Active Theme")}
              </Typography>
              <FormControl fullWidth>
                <InputLabel>{t("Theme")}</InputLabel>
                <Select
                  value={selectedTheme}
                  label={t("Theme")}
                  onChange={(e) => {
                    setIsDirty(true);
                    setSelectedTheme(e.target.value);
                  }}
                >
                  {THEME_OPTIONS.map((opt) => (
                    <MenuItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ height: 14 }} />

              <Typography sx={{ fontWeight: 800, mb: 1 }}>
                {t("Default Font")}
              </Typography>
              <FormControl fullWidth>
                <InputLabel>{t("Font")}</InputLabel>
                <Select
                  value={selectedFont}
                  label={t("Font")}
                  onChange={(e) => {
                    setIsDirty(true);
                    setSelectedFont(e.target.value);
                  }}
                >
                  {fontOptions.map((opt) => (
                    <MenuItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider sx={{ my: 2 }} />

              <Typography sx={{ fontWeight: 800, mb: 1 }}>
                {t("Mobile Navigation Template")}
              </Typography>
              <FormControl fullWidth>
                <InputLabel>{t("Template")}</InputLabel>
                <Select
                  value={selectedNav?.template || "template1"}
                  label={t("Template")}
                  onChange={(e) =>
                    setSelectedNav((prev) => {
                      setIsDirty(true);
                      return {
                        ...(prev || {}),
                        template: e.target.value,
                      };
                    })
                  }
                >
                  {NAV_TEMPLATES.map((opt) => (
                    <MenuItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedNav?.template === "custom" && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ fontWeight: 800, mb: 1 }}>
                    {t("Top Navigation Slots")}
                  </Typography>
                  {[
                    "topleft1",
                    "topleft2",
                    "center",
                    "topright1",
                    "topright2",
                  ].map((slot) => (
                    <FormControl key={slot} fullWidth sx={{ mb: 1 }}>
                      <InputLabel>{slot}</InputLabel>
                      <Select
                        value={selectedNav?.topSlots?.[slot] ?? ""}
                        label={slot}
                        onChange={(e) =>
                          setSelectedNav((prev) => {
                            setIsDirty(true);
                            return {
                              ...(prev || {}),
                              topSlots: {
                                ...(prev?.topSlots || {}),
                                [slot]: e.target.value,
                              },
                            };
                          })
                        }
                      >
                        {NAV_ACTIONS.map((a) => (
                          <MenuItem key={a.id || "empty"} value={a.id}>
                            {a.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ))}

                  <Typography sx={{ fontWeight: 800, mb: 1, mt: 2 }}>
                    {t("Bottom Navigation Slots")}
                  </Typography>
                  {[
                    "bottomleft1",
                    "bottomleft2",
                    "center",
                    "bottomright1",
                    "bottomright2",
                  ].map((slot) => (
                    <FormControl key={slot} fullWidth sx={{ mb: 1 }}>
                      <InputLabel>{slot}</InputLabel>
                      <Select
                        value={selectedNav?.bottomSlots?.[slot] ?? ""}
                        label={slot}
                        onChange={(e) =>
                          setSelectedNav((prev) => {
                            setIsDirty(true);
                            return {
                              ...(prev || {}),
                              bottomSlots: {
                                ...(prev?.bottomSlots || {}),
                                [slot]: e.target.value,
                              },
                            };
                          })
                        }
                      >
                        {NAV_ACTIONS.filter((a) => a.id !== "label").map(
                          (a) => (
                            <MenuItem key={a.id || "empty"} value={a.id}>
                              {a.label}
                            </MenuItem>
                          ),
                        )}
                      </Select>
                    </FormControl>
                  ))}
                </Box>
              )}

              <Box
                sx={{
                  mt: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px dashed",
                  borderColor: "divider",
                }}
              >
                <Typography sx={{ fontWeight: 800, mb: 0.5 }}>
                  {t("Preview")}
                </Typography>
                <Typography>
                  {t("Selected")}: {fontPreview}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  {t("Tip: theme effects auto-disable on low motion devices.")}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await themeAPI.update({
                    activeTheme: selectedTheme,
                    activeFontKey: selectedFont,
                    navConfig: selectedNav,
                  });
                  await fetchTheme();
                  setSaveOk(true);
                  setIsDirty(false);
                } catch {
                  setSaveOk(false);
                } finally {
                  setSaving(false);
                  setSaveToastOpen(true);
                }
              }}
              sx={{ textTransform: "none", mr: 1, minWidth: 110 }}
            >
              {saving ? t("Saving...") : t("Save")}
            </Button>
            <Button
              startIcon={<RestartAltIcon />}
              color="inherit"
              variant="outlined"
              onClick={async () => {
                setIsDirty(true);
                setSelectedTheme("default");
                setSelectedFont("default");
              }}
              sx={{ textTransform: "none" }}
            >
              {t("Reset")}
            </Button>
          </Box>
        </CardContent>
      </Card>
      <Snackbar
        open={saveToastOpen}
        autoHideDuration={2500}
        onClose={() => setSaveToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSaveToastOpen(false)}
          severity={saveOk ? "success" : "error"}
          sx={{ width: "100%" }}
        >
          {saveOk ? t("Saved") : t("Failed to save (admin only).")}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CustomizationPage;
