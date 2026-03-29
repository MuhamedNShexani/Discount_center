import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
} from "@mui/material";
import {
  Person as PersonIcon,
  Favorite as FavoriteIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  PrivacyTip as PrivacyTipIcon,
  ContactSupport as ContactSupportIcon,
  LocationOn as LocationOnIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Block as BlockIcon,
  Palette as PaletteIcon,
  WhatsApp as WhatsAppIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  CameraAlt as SnapchatIcon,
  AlternateEmail as GmailIcon,
  MusicNote as TikTokIcon,
  Call as ViberIcon,
  Telegram as TelegramIcon,
  Language as LanguageIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useUserTracking } from "../hooks/useUserTracking";
import { useCityFilter } from "../context/CityFilterContext";
import { useAppSettings } from "../context/AppSettingsContext";
import { useActiveTheme } from "../context/ActiveThemeContext";
import kurdishFlag from "../styles/kurdish_flag.jpg";
import { normalizeWhatsAppUrl } from "../utils/openWhatsAppLink";
import {
  useDataLanguage,
  DATA_LANG_AR,
  DATA_LANG_EN,
  DATA_LANG_KU,
  DATA_LANG_NORMAL,
} from "../context/DataLanguageContext";

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

const ProfilePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, logout, updateProfile, deactivate } = useAuth();
  const { user: guestUser, updateGuestName } = useUserTracking();
  const { selectedCity, changeCity, cities } = useCityFilter();
  const { openWhatsApp, contactInfo } = useAppSettings();
  const {
    activeTheme,
    userThemeOverride,
    setUserThemeOverride,
    clearUserThemeOverride,
  } = useActiveTheme();
  const { dataLanguage, setDataLanguage } = useDataLanguage();

  const [guestNameDialogOpen, setGuestNameDialogOpen] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState("");
  const [userNameDialogOpen, setUserNameDialogOpen] = useState(false);
  const [userNameInput, setUserNameInput] = useState("");
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const displayName =
    user?.displayName ||
    user?.username ||
    guestUser?.displayName ||
    t("Guest User");
  const email = user?.email || "";
  const isAdmin =
    !!user &&
    (user.email === "mshexani45@gmail.com" || user.email === "admin@gmail.com");

  const normalizeUrl = (url, type) => {
    if (!url || typeof url !== "string") return null;
    const trimmed = url.trim();
    if (type === "whatsapp" || type === "viber" || type === "telegram") {
      if (
        /^(https?:\/\/)?(wa\.me|api\.whatsapp\.com|viber\.com|t\.me|telegram\.me)\//i.test(
          trimmed,
        )
      ) {
        const withProto = /^https?:\/\//i.test(trimmed)
          ? trimmed
          : `https://${trimmed}`;
        if (type === "whatsapp") {
          return normalizeWhatsAppUrl(withProto);
        }
        return withProto;
      }
      const digits = trimmed.replace(/[^\d]/g, "");
      if (type === "whatsapp") {
        return digits ? `https://api.whatsapp.com/send?phone=${digits}` : null;
      }
      if (type === "viber")
        return digits ? `viber://chat?number=${digits}` : null;
      if (type === "telegram") return digits ? `https://t.me/+${digits}` : null;
    }
    if (type === "gmail") {
      return `mailto:${trimmed}`;
    }
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  const contactItems = [
    { key: "whatsapp", value: contactInfo?.whatsapp, icon: <WhatsAppIcon /> },
    { key: "facebook", value: contactInfo?.facebook, icon: <FacebookIcon /> },
    {
      key: "instagram",
      value: contactInfo?.instagram,
      icon: <InstagramIcon />,
    },
    { key: "snapchat", value: contactInfo?.snapchat, icon: <SnapchatIcon /> },
    { key: "gmail", value: contactInfo?.gmail, icon: <GmailIcon /> },
    { key: "tiktok", value: contactInfo?.tiktok, icon: <TikTokIcon /> },
    { key: "viber", value: contactInfo?.viber, icon: <ViberIcon /> },
    { key: "telegram", value: contactInfo?.telegram, icon: <TelegramIcon /> },
  ].filter((item) => Boolean(item.value));

  return (
    <Box sx={{ pt: 5, px: { xs: 1, sm: 2 }, pb: 3 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 2.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.04)"
                : "rgba(0,0,0,0.02)",
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar
              sx={{
                width: 46,
                height: 46,
                backgroundColor: theme.palette.primary.main,
                fontWeight: 700,
              }}
            >
              {(displayName || "U").charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                {displayName}
              </Typography>
              {!!email && (
                <Typography variant="body2" color="text.secondary">
                  {email}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        <List disablePadding>
          <ListItemButton
            onClick={() => {
              if (user) {
                setUserNameInput(user?.displayName || user?.username || "");
                setUserNameDialogOpen(true);
                return;
              }
              setGuestNameInput(guestUser?.displayName || "");
              setGuestNameDialogOpen(true);
            }}
          >
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t("Change Your Account Name")} />
          </ListItemButton>

          {/* <ListItemButton component={Link} to="/favourites">
            <ListItemIcon>
              <FavoriteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t("Favourites")} />
          </ListItemButton> */}

          {isAdmin && (
            <>
              <Divider />
              <ListItemButton component={Link} to="/admin">
                <ListItemIcon>
                  <AdminPanelSettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t("Data Entry")} />
              </ListItemButton>
              <ListItemButton component={Link} to="/admin/customization">
                <ListItemIcon>
                  <PaletteIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t("Customization")} />
              </ListItemButton>
              <ListItemButton component={Link} to="/admin/users">
                <ListItemIcon>
                  <PeopleIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t("Users")} />
              </ListItemButton>
              <ListItemButton component={Link} to="/admin/translations">
                <ListItemIcon>
                  <LanguageIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t("translationPage.title")} />
              </ListItemButton>
              <ListItemButton component={Link} to="/admin/dashboard">
                <ListItemIcon>
                  <DashboardIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t("Admin Dashboard")} />
              </ListItemButton>
            </>
          )}

          <Divider />

          <Box sx={{ px: 2, py: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1, display: "block" }}
            >
              {t("Theme")}
            </Typography>
            <FormControl fullWidth size="small">
              {/* <InputLabel>{t("Theme")}</InputLabel> */}
              <Select
                label={t("Theme")}
                value={userThemeOverride || "__global__"}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "__global__") {
                    clearUserThemeOverride();
                  } else {
                    setUserThemeOverride(v);
                  }
                }}
              >
                <MenuItem value="__global__">
                  {t("Use Global Theme")} ({activeTheme})
                </MenuItem>
                {THEME_OPTIONS.map((opt) => (
                  <MenuItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              {t("This changes theme only for you on this device.")}
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ px: 2, py: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1, display: "block" }}
            >
              {t("City")}
            </Typography>
            <FormControl fullWidth size="small">
              {/* <InputLabel>{t("City")}</InputLabel> */}
              <Select
                value={selectedCity}
                label={t("City")}
                onChange={(e) => changeCity(e.target.value)}
                startAdornment={<LocationOnIcon sx={{ mr: 1, fontSize: 18 }} />}
              >
                {cities.map((city) => (
                  <MenuItem key={city.value} value={city.value}>
                    {city.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ px: 2, pb: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1, display: "block" }}
            >
              {t("Language")}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                variant={i18n.language === "en" ? "contained" : "outlined"}
                onClick={() => i18n.changeLanguage("en")}
              >
                🇺🇸 {t("English")}
              </Button>
              <Button
                size="small"
                variant={i18n.language === "ar" ? "contained" : "outlined"}
                onClick={() => i18n.changeLanguage("ar")}
              >
                🇸🇦 {t("Arabic")}
              </Button>
              <Button
                size="small"
                variant={i18n.language === "ku" ? "contained" : "outlined"}
                onClick={() => i18n.changeLanguage("ku")}
              >
                <Box
                  component="span"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <img
                    src={kurdishFlag}
                    alt="Kurdish"
                    style={{
                      width: 16,
                      height: 12,
                      objectFit: "cover",
                      borderRadius: 2,
                    }}
                  />
                  {t("Kurdish")}
                </Box>
              </Button>
            </Box>
          </Box>

          <Box sx={{ px: 2, pb: 2, pt: 0 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1, display: "block" }}
            >
              {t("System Data Language")}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1, display: "block", opacity: 0.9 }}
            >
              {t(
                "Choose which language to use for names and descriptions from the database (stores, brands, products, categories, gifts, jobs). This is separate from the interface language above.",
              )}
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Button
                size="small"
                variant={
                  dataLanguage === DATA_LANG_NORMAL ? "contained" : "outlined"
                }
                onClick={() => setDataLanguage(DATA_LANG_NORMAL)}
              >
                🌐 {t("Normal")}
              </Button>
              <Button
                size="small"
                variant={
                  dataLanguage === DATA_LANG_KU ? "contained" : "outlined"
                }
                onClick={() => setDataLanguage(DATA_LANG_KU)}
              >
                <Box
                  component="span"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <img
                    src={kurdishFlag}
                    alt="Kurdish"
                    style={{
                      width: 16,
                      height: 12,
                      objectFit: "cover",
                      borderRadius: 2,
                    }}
                  />
                  {t("Kurdish")}
                </Box>
              </Button>
              <Button
                size="small"
                variant={
                  dataLanguage === DATA_LANG_EN ? "contained" : "outlined"
                }
                onClick={() => setDataLanguage(DATA_LANG_EN)}
              >
                🇺🇸 {t("English")}
              </Button>
              <Button
                size="small"
                variant={
                  dataLanguage === DATA_LANG_AR ? "contained" : "outlined"
                }
                onClick={() => setDataLanguage(DATA_LANG_AR)}
              >
                🇸🇦 {t("Arabic")}
              </Button>
            </Box>
          </Box>
          <Divider />
          <ListItemButton onClick={() => openWhatsApp()}>
            <ListItemIcon>
              <ContactSupportIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t("Contact Us")} />
          </ListItemButton>
          {contactItems.length > 0 && (
            <Box
              sx={{
                px: 2,
                pb: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "nowrap",
                overflowX: "auto",
              }}
            >
              {contactItems.map((item) => (
                <Button
                  key={item.key}
                  component="a"
                  href={normalizeUrl(item.value, item.key)}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  variant="outlined"
                  sx={{
                    minWidth: 36,
                    px: 1,
                    color: "text.primary",
                    borderColor: "divider",
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </Button>
              ))}
            </Box>
          )}
          <ListItemButton component={Link} to="/privacy-policy">
            <ListItemIcon>
              <PrivacyTipIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t("Privacy Policy")} />
          </ListItemButton>
          <Divider />
          {user ? (
            <>
              <ListItemButton
                onClick={() => setDeactivateDialogOpen(true)}
                sx={{ color: theme.palette.secondary.main }}
              >
                <ListItemIcon>
                  <BlockIcon
                    sx={{ color: theme.palette.secondary.main }}
                    fontSize="small"
                  />
                </ListItemIcon>
                <ListItemText primary={t("Deactivate Account")} />
              </ListItemButton>
              <ListItemButton
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                sx={{ color: "#e53e3e" }}
              >
                <ListItemIcon>
                  <LogoutIcon sx={{ color: "#e53e3e" }} fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t("Logout")} />
              </ListItemButton>
            </>
          ) : (
            <ListItemButton
              component={Link}
              to="/login"
              sx={{ color: theme.palette.primary.main }}
            >
              <ListItemIcon>
                <LoginIcon
                  sx={{ color: theme.palette.primary.main }}
                  fontSize="small"
                />
              </ListItemIcon>
              <ListItemText primary={t("Login")} />
            </ListItemButton>
          )}
        </List>
      </Paper>

      <Dialog
        open={guestNameDialogOpen}
        onClose={() => setGuestNameDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t("Change Your Account Name")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="normal"
            label={t("Name")}
            value={guestNameInput}
            onChange={(e) => setGuestNameInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGuestNameDialogOpen(false)}>
            {t("Cancel")}
          </Button>
          <Button
            onClick={async () => {
              const name = guestNameInput.trim();
              if (!name) return;
              const res = await updateGuestName(name);
              if (res?.success) setGuestNameDialogOpen(false);
            }}
          >
            {t("Save")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={userNameDialogOpen}
        onClose={() => setUserNameDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t("Change Your Account Name")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="normal"
            label={t("Name")}
            value={userNameInput}
            onChange={(e) => setUserNameInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserNameDialogOpen(false)}>
            {t("Cancel")}
          </Button>
          <Button
            onClick={async () => {
              const name = userNameInput.trim();
              if (!name) return;
              const res = await updateProfile({ displayName: name });
              if (res?.success) setUserNameDialogOpen(false);
            }}
          >
            {t("Save")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deactivateDialogOpen}
        onClose={() => !deactivating && setDeactivateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t("Deactivate Account")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t(
              "Your account will be inactive immediately and you will be logged out.",
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t(
              "You have 30 days to log in again to reactivate your account and cancel deletion.",
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t(
              "If you do not log in within 30 days, your account and all data will be permanently deleted.",
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeactivateDialogOpen(false)}
            disabled={deactivating}
          >
            {t("Cancel")}
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deactivating}
            onClick={async () => {
              setDeactivating(true);
              const result = await deactivate();
              setDeactivating(false);
              if (result?.success) {
                setDeactivateDialogOpen(false);
                navigate("/");
              } else {
                alert(result?.message || t("Deactivation failed"));
              }
            }}
          >
            {deactivating ? t("Deactivating...") : t("Deactivate Account")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;
