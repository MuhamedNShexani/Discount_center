import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  List,
  ListItem,
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
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  Autocomplete,
  Alert,
  IconButton,
  Stack,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Person as PersonIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  PrivacyTip as PrivacyTipIcon,
  LocationOn as LocationOnIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Block as BlockIcon,
  ArrowBack as ArrowBackIcon,
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
  InfoOutlined as InfoOutlinedIcon,
  LightModeOutlined,
  DarkModeOutlined,
  BrightnessAutoRounded,
  Storefront as StorefrontIcon,
  Add as AddIcon,
  DeleteOutline as DeleteOutlineIcon,
  HomeOutlined,
  Close as CloseIcon,
  Search as SearchNavIcon,
  Category as CategoryNavIcon,
  VideoLibrary as VideoLibraryNavIcon,
  Favorite as FavoriteNavIcon,
  Store as StoreNavIcon,
  CardGiftcard as CardGiftcardNavIcon,
  ShoppingBag as ShoppingBagNavIcon,
  Business as BusinessNavIcon,
  CorporateFare as CorporateFareNavIcon,
  WorkOutline as WorkOutlineNavIcon,
  BarChart as BarChartIcon,
  HourglassTop as HourglassTopIcon,
  Feedback as FeedbackIcon,
  GridView as GridViewIcon,
  ContactMail as ContactMailIcon,
  EditOutlined as EditIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useUserTracking } from "../hooks/useUserTracking";
import { useCityFilter } from "../context/CityFilterContext";
import { useAppSettings } from "../context/AppSettingsContext";
import kurdishFlag from "../styles/kurdish_flag.jpg";
import {
  normalizeWhatsAppUrl,
  openWhatsAppLink,
} from "../utils/openWhatsAppLink";
import {
  useDataLanguage,
  DATA_LANG_AR,
  DATA_LANG_EN,
  DATA_LANG_KU,
  DATA_LANG_NORMAL,
} from "../context/DataLanguageContext";
import { useLocalizedContent } from "../hooks/useLocalizedContent";
import { getLocalizedField } from "../utils/localize";
import { useDarkMode } from "../context/DarkModeContext";
import {
  isAdminEmail,
  canAccessDataEntry,
  canAccessOwnerDashboard,
  canAccessOwnerDataEntryPage,
  canAccessPendingPage,
} from "../utils/adminAccess";
import {
  normalizeOwnerEntities,
  getOwnerPublicProfileChoices,
} from "../utils/ownerEntities";
import { isOwnerDashboardRole } from "../utils/roles";
import { storeAPI, brandAPI, companyAPI, feedbackAPI } from "../services/api";
import { useActiveTheme } from "../context/ActiveThemeContext";
import ProfilePageSkeleton, {
  ProfileOwnerSectionSkeleton,
} from "../components/ProfilePageSkeleton";
import { DrawerSafeAreaTop } from "../utils/drawerSafeArea";
import { useAboutDrawer } from "../hooks/useAboutDrawer";
import { usePrivacyDrawer } from "../hooks/usePrivacyDrawer";
import {
  PROFILE_SHORTCUT_CATALOG,
  normalizeProfileShortcutIds,
} from "../utils/profileShortcutCatalog";

const PROFILE_SHORTCUT_ICONS = {
  home: HomeOutlined,
  search: SearchNavIcon,
  categories: CategoryNavIcon,
  reels: VideoLibraryNavIcon,
  favourites: FavoriteNavIcon,
  stores: StoreNavIcon,
  gifts: CardGiftcardNavIcon,
  shopping: ShoppingBagNavIcon,
  brands: BusinessNavIcon,
  companies: CorporateFareNavIcon,
  findjob: WorkOutlineNavIcon,
};

function ownerEntityIdsEqual(a, b) {
  const sa = String(a ?? "").trim();
  const sb = String(b ?? "").trim();
  if (!sa || !sb) return false;
  if (sa === sb) return true;
  return sa.toLowerCase() === sb.toLowerCase();
}

function ownerProfileChoiceKey(choice) {
  return `${String(choice.entityType || "").toLowerCase()}:${String(
    choice.entityId || "",
  ).trim()}`;
}

function findOwnerEntityRow(choice, entityLists) {
  const idStr = String(choice.entityId || "").trim();
  if (!idStr) return null;
  const typ = String(choice.entityType || "").toLowerCase();
  if (typ === "store") {
    return (
      entityLists.stores.find((s) => ownerEntityIdsEqual(s?._id, idStr)) || null
    );
  }
  if (typ === "brand") {
    return (
      entityLists.brands.find((b) => ownerEntityIdsEqual(b?._id, idStr)) || null
    );
  }
  if (typ === "company") {
    return (
      entityLists.companies.find((c) => ownerEntityIdsEqual(c?._id, idStr)) ||
      null
    );
  }
  return null;
}

function ownerProfileFallbackLabel(choice, t) {
  const typ = String(choice.entityType || "").toLowerCase();
  const idStr = String(choice.entityId || "").trim();
  const tail = idStr.length > 8 ? idStr.slice(-8) : idStr;
  if (typ === "store") {
    return `${t("Store", { defaultValue: "Store" })} (${tail})`;
  }
  if (typ === "brand") {
    return `${t("Brand", { defaultValue: "Brand" })} (${tail})`;
  }
  return `${t("Company", { defaultValue: "Company" })} (${tail})`;
}

/** Matches ListItemButton + ListItemText icon/label styling across profile sections. */
function ProfileSectionLabel({ icon: Icon, label, sx }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
        minWidth: 0,
        ...sx,
      }}
    >
      <ListItemIcon>
        <Icon fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primary={label}
        sx={{ my: 0, flex: "0 1 auto" }}
        primaryTypographyProps={{ variant: "body1" }}
      />
    </Box>
  );
}

const profileSettingsRowSx = {
  py: 1,
  px: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  gap: 1,
};

const PROFILE_HERO_SAFE_BG = {
  dark: "#0c1525",
  light: "#eef3ff",
};

const ProfilePage = ({ onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, logout, updateProfile, deactivate, loading: authLoading } = useAuth();
  const { user: guestUser, updateGuestName } = useUserTracking();
  const { selectedCity, changeCity, cities } = useCityFilter();
  const { contactInfo } = useAppSettings();
  const { profileShortcuts } = useActiveTheme();
  const { dataLanguage, setDataLanguage } = useDataLanguage();
  const { locName } = useLocalizedContent();
  const { colorMode, setColorMode } = useDarkMode();
  const { openAbout } = useAboutDrawer();
  const { openPrivacy } = usePrivacyDrawer();

  const [guestNameDialogOpen, setGuestNameDialogOpen] = useState(false);
  const [ownerProfilePickerOpen, setOwnerProfilePickerOpen] = useState(false);
  const [pageEnterActive, setPageEnterActive] = useState(false);
  const [pageClosing, setPageClosing] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState("");
  const [userNameDialogOpen, setUserNameDialogOpen] = useState(false);
  const [userNameInput, setUserNameInput] = useState("");
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("suggestion");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState("");
  const changeNameButtonRef = useRef(null);
  const deactivateButtonRef = useRef(null);
  const deactivateCancelButtonRef = useRef(null);

  const [draftOwnerEntities, setDraftOwnerEntities] = useState(() =>
    normalizeOwnerEntities(user),
  );
  const [entityLists, setEntityLists] = useState({
    stores: [],
    brands: [],
    companies: [],
  });
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [ownerSaveError, setOwnerSaveError] = useState("");
  const [savingOwnerEntity, setSavingOwnerEntity] = useState(false);
  const [ownerProfileFetchedNames, setOwnerProfileFetchedNames] = useState({});
  const ownerProfileFetchedKeysRef = useRef(new Set());

  const ownerEntitiesServerSig = useMemo(
    () =>
      isOwnerDashboardRole(user)
        ? JSON.stringify(normalizeOwnerEntities(user))
        : "",
    [
      user?.role,
      user?.ownerEntities,
      user?.ownerEntityType,
      user?.ownerEntityId,
    ],
  );

  useEffect(() => {
    if (!isOwnerDashboardRole(user)) return;
    setDraftOwnerEntities(normalizeOwnerEntities(user));
  }, [ownerEntitiesServerSig, user?.role]);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      setPageEnterActive(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const loadEntityLists = useCallback(async () => {
    if (!user) return;
    const profileChoices = getOwnerPublicProfileChoices(user);
    const needsLists = isOwnerDashboardRole(user) || profileChoices.length > 0;
    if (!needsLists) return;
    setLoadingEntities(true);
    setOwnerSaveError("");
    try {
      const [storesRes, brandsRes, companiesRes] = await Promise.all([
        storeAPI.getVisible(),
        brandAPI.getAll(),
        companyAPI.getAll(),
      ]);
      setEntityLists({
        stores: Array.isArray(storesRes.data) ? storesRes.data : [],
        brands: Array.isArray(brandsRes.data) ? brandsRes.data : [],
        companies: Array.isArray(companiesRes.data) ? companiesRes.data : [],
      });
    } catch (e) {
      console.error(e);
      setEntityLists({ stores: [], brands: [], companies: [] });
      setOwnerSaveError(
        e?.response?.data?.message ||
          e?.message ||
          t("Could not load list", { defaultValue: "Could not load list" }),
      );
    } finally {
      setLoadingEntities(false);
    }
  }, [
    user?._id,
    user?.role,
    user?.ownerEntities,
    user?.ownerEntityType,
    user?.ownerEntityId,
    user?.ownerDataEntryStoreIds,
    user?.ownerDataEntryBrandIds,
    user?.ownerDataEntryCompanyIds,
    user?.ownerDataEntryAllStores,
    user?.ownerDataEntryAllBrands,
    user?.ownerDataEntryAllCompanies,
    t,
  ]);

  useEffect(() => {
    loadEntityLists();
  }, [loadEntityLists]);

  const getOptionsForOwnerType = (typ) => {
    if (typ === "store") return entityLists.stores;
    if (typ === "brand") return entityLists.brands;
    return entityLists.companies;
  };

  const handleSaveOwnerEntities = async () => {
    const valid = draftOwnerEntities.filter(
      (e) => e.entityType && e.entityId && String(e.entityId).trim() !== "",
    );
    if (valid.length === 0) {
      setOwnerSaveError(
        t("Select at least one store, brand, or company.", {
          defaultValue: "Select at least one store, brand, or company.",
        }),
      );
      return;
    }
    setSavingOwnerEntity(true);
    setOwnerSaveError("");
    try {
      await updateProfile({
        ownerEntities: valid.map((e) => ({
          entityType: e.entityType,
          entityId: String(e.entityId).trim(),
        })),
      });
    } catch (e) {
      console.error(e);
      setOwnerSaveError(
        e?.response?.data?.message ||
          e?.message ||
          t("Could not save", { defaultValue: "Could not save" }),
      );
    } finally {
      setSavingOwnerEntity(false);
    }
  };

  const displayName =
    user?.displayName ||
    user?.username ||
    guestUser?.displayName ||
    t("Guest User");
  const email = user?.email || "";
  const isAdmin = !!user && isAdminEmail(user);
  const showDataEntryLink = !!user && canAccessDataEntry(user);

  const ownerProfileChoices = useMemo(
    () => getOwnerPublicProfileChoices(user),
    [
      user?._id,
      user?.role,
      user?.ownerEntities,
      user?.ownerEntityType,
      user?.ownerEntityId,
      user?.ownerDataEntryStoreIds,
      user?.ownerDataEntryBrandIds,
      user?.ownerDataEntryCompanyIds,
      user?.ownerDataEntryAllStores,
      user?.ownerDataEntryAllBrands,
      user?.ownerDataEntryAllCompanies,
    ],
  );

  const ownerProfileChoicesSig = useMemo(
    () =>
      ownerProfileChoices
        .map((c) => ownerProfileChoiceKey(c))
        .sort()
        .join("|"),
    [ownerProfileChoices],
  );

  useEffect(() => {
    ownerProfileFetchedKeysRef.current = new Set();
    setOwnerProfileFetchedNames({});
  }, [ownerProfileChoicesSig, user?._id, dataLanguage]);

  useEffect(() => {
    if (!ownerProfileChoices.length) return undefined;
    let cancelled = false;

    (async () => {
      for (const choice of ownerProfileChoices) {
        if (cancelled) break;
        const key = ownerProfileChoiceKey(choice);
        const row = findOwnerEntityRow(choice, entityLists);
        const fromList = row
          ? getLocalizedField(row, "name", dataLanguage)
          : "";
        if (fromList) continue;
        if (ownerProfileFetchedKeysRef.current.has(key)) continue;

        try {
          let res;
          if (choice.entityType === "store") {
            res = await storeAPI.getById(choice.entityId);
          } else if (choice.entityType === "brand") {
            res = await brandAPI.getById(choice.entityId);
          } else {
            res = await companyAPI.getById(choice.entityId);
          }
          const data = res?.data;
          const name = data
            ? getLocalizedField(data, "name", dataLanguage)
            : "";
          if (!cancelled && name) {
            ownerProfileFetchedKeysRef.current.add(key);
            setOwnerProfileFetchedNames((prev) => {
              if (prev[key]) return prev;
              return { ...prev, [key]: name };
            });
          }
        } catch {
          /* ignore */
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ownerProfileChoices, entityLists, dataLanguage, ownerProfileChoicesSig]);

  const OwnerProfileListIcon = useMemo(() => {
    if (ownerProfileChoices.length !== 1) return StorefrontIcon;
    const p = ownerProfileChoices[0].path || "";
    if (p.startsWith("/stores/")) return StoreNavIcon;
    if (p.startsWith("/brands/")) return BusinessNavIcon;
    if (p.startsWith("/companies/")) return CorporateFareNavIcon;
    return StorefrontIcon;
  }, [ownerProfileChoices]);

  const ownerProfileChoiceLabel = useCallback(
    (choice) => {
      const row = findOwnerEntityRow(choice, entityLists);
      const fromList = row ? locName(row) : "";
      if (fromList) return fromList;
      const key = ownerProfileChoiceKey(choice);
      if (ownerProfileFetchedNames[key]) return ownerProfileFetchedNames[key];
      return ownerProfileFallbackLabel(choice, t);
    },
    [entityLists, locName, ownerProfileFetchedNames, t],
  );

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

  const contactStr = (v) => {
    if (v == null) return undefined;
    const s = String(v).trim();
    return s === "" ? undefined : s;
  };

  const profileShortcutItems = useMemo(() => {
    const byId = Object.fromEntries(
      PROFILE_SHORTCUT_CATALOG.map((x) => [x.id, x]),
    );
    return normalizeProfileShortcutIds(profileShortcuts)
      .map((id) => byId[id])
      .filter(Boolean);
  }, [profileShortcuts]);

  const contactItems = [
    {
      key: "whatsapp",
      value: contactStr(contactInfo?.whatsapp),
      icon: <WhatsAppIcon />,
    },
    {
      key: "facebook",
      value: contactStr(contactInfo?.facebook),
      icon: <FacebookIcon />,
    },
    {
      key: "instagram",
      value: contactStr(contactInfo?.instagram),
      icon: <InstagramIcon />,
    },
    {
      key: "snapchat",
      value: contactStr(contactInfo?.snapchat),
      icon: <SnapchatIcon />,
    },
    {
      key: "gmail",
      value: contactStr(contactInfo?.gmail),
      icon: <GmailIcon />,
    },
    {
      key: "tiktok",
      value: contactStr(contactInfo?.tiktok),
      icon: <TikTokIcon />,
    },
    {
      key: "viber",
      value: contactStr(contactInfo?.viber),
      icon: <ViberIcon />,
    },
    {
      key: "telegram",
      value: contactStr(contactInfo?.telegram),
      icon: <TelegramIcon />,
    },
  ].filter((item) => Boolean(item.value));

  const openFeedbackDialog = () => {
    setFeedbackError("");
    setFeedbackSuccess("");
    setFeedbackType("suggestion");
    setFeedbackNote("");
    setFeedbackDialogOpen(true);
  };

  const submitFeedback = async () => {
    const note = feedbackNote.trim();
    if (!note) {
      setFeedbackError(
        t("Please enter your note.", {
          defaultValue: "Please enter your note.",
        }),
      );
      return;
    }

    setFeedbackSubmitting(true);
    setFeedbackError("");
    setFeedbackSuccess("");
    try {
      await feedbackAPI.create({
        type: feedbackType,
        note,
        guestDeviceId: user
          ? null
          : guestUser?.deviceId || guestUser?._id || null,
        guestName: user ? null : guestUser?.displayName || null,
        email: user ? user?.email || null : null,
      });
      setFeedbackSuccess(
        t("Thanks! Your note was sent.", {
          defaultValue: "Thanks! Your note was sent.",
        }),
      );
      setFeedbackNote("");
      window.setTimeout(() => setFeedbackDialogOpen(false), 700);
    } catch (error) {
      setFeedbackError(
        error?.response?.data?.message ||
          t("Failed to send note.", { defaultValue: "Failed to send note." }),
      );
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const closeThen = useCallback(
    (fn) => {
      onClose?.();
      fn?.();
    },
    [onClose],
  );

  const handleBack = useCallback(() => {
    if (pageClosing) return;
    setPageClosing(true);
    window.setTimeout(() => {
      onClose?.();
    }, 170);
  }, [onClose, pageClosing]);

  const isDark = theme.palette.mode === "dark";

  const cardSx = {
    borderRadius: 0,
    overflow: "hidden",
    border: `1px solid ${isDark ? alpha("#fff", 0.07) : alpha("#1e6fd9", 0.09)}`,
    background: isDark ? alpha("#fff", 0.03) : "#fff",
    boxShadow: isDark
      ? `inset 0 1px 0 ${alpha("#fff", 0.05)}, 0 4px 20px rgba(0,0,0,0.22)`
      : `0 1px 0 ${alpha("#1e6fd9", 0.06)}, 0 4px 16px ${alpha("#1e6fd9", 0.05)}`,
  };

  const hubCardSx = {
    minHeight: 86,
    p: 1.25,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 1,
    textDecoration: "none",
    border: `1px solid ${isDark ? alpha("#fff", 0.09) : alpha("#1e6fd9", 0.1)}`,
    borderRadius: 0,
    background: isDark
      ? alpha("#fff", 0.045)
      : `linear-gradient(135deg, ${alpha("#f8fafc", 0.98)}, ${alpha("#eef5ff", 0.78)})`,
    color: "text.primary",
    transition:
      "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
    "&:hover": {
      transform: "translateY(-2px)",
      borderColor: "primary.main",
      boxShadow: `0 8px 22px ${alpha("#1e6fd9", isDark ? 0.18 : 0.12)}`,
    },
  };

  const profileHubGroups = [
    {
      title: t("Discover", { defaultValue: "Discover" }),
      items: profileShortcutItems.map((item) => ({
        key: item.id,
        label: t(item.labelKey),
        path: item.path,
        Icon: PROFILE_SHORTCUT_ICONS[item.id] || GridViewIcon,
      })),
    },
    {
      title: t("Personal", { defaultValue: "Personal" }),
      items: [
        {
          key: "my-profile",
          label: t("My Profile", { defaultValue: "My Profile" }),
          Icon: PersonIcon,
          onClick: () => {
            if (user) {
              setUserNameInput(user?.displayName || user?.username || "");
              setUserNameDialogOpen(true);
            } else {
              setGuestNameInput(guestUser?.displayName || "");
              setGuestNameDialogOpen(true);
            }
          },
        },
        {
          key: "language",
          label: t("Language"),
          Icon: LanguageIcon,
          onClick: () => setLanguageDialogOpen(true),
        },
        {
          key: "city",
          label: t("Change City", { defaultValue: "Change City" }),
          Icon: LocationOnIcon,
          onClick: () => setCityDialogOpen(true),
        },
        {
          key: "theme",
          label: t("Theme", { defaultValue: "Theme" }),
          Icon: PaletteIcon,
          onClick: () => setThemeDialogOpen(true),
        },
      ],
    },
    {
      title: t("Support", { defaultValue: "Support" }),
      items: [
        {
          key: "feedback",
          label: t("Help", { defaultValue: "Help" }),
          Icon: FeedbackIcon,
          onClick: openFeedbackDialog,
        },
        {
          key: "about",
          label: t("About the app", { defaultValue: "About the app" }),
          Icon: InfoOutlinedIcon,
          onClick: () => openAbout(),
        },
        {
          key: "privacy",
          label: t("Privacy Policy"),
          Icon: PrivacyTipIcon,
          onClick: () => openPrivacy(),
        },
      ],
    },
  ].filter((group) => group.items.length > 0);

  const showOwnerAdminSection =
    user &&
    (ownerProfileChoices.length > 0 ||
      canAccessOwnerDashboard(user) ||
      canAccessOwnerDataEntryPage(user) ||
      canAccessPendingPage(user) ||
      showDataEntryLink);

  if (authLoading) {
    return <ProfilePageSkeleton />;
  }

  return (
    <>
      <Box
        sx={{
          width: "100%",
          maxWidth: "100%",
          height: "100%",
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          background: isDark
            ? `linear-gradient(180deg, #0c1525 0%, #0f1927 60%, #0b1220 100%)`
            : `linear-gradient(180deg, #eef3ff 0%, #f6f9ff 25%, #fff 55%)`,
          boxShadow: isDark
            ? "-32px 0 96px rgba(0,0,0,0.7)"
            : "-24px 0 64px rgba(30,111,217,0.14)",
          transform: pageClosing
            ? "translateX(32px)"
            : pageEnterActive
              ? "translateX(0)"
              : "translateX(24px)",
          opacity: pageClosing ? 0.55 : pageEnterActive ? 1 : 0.7,
          transition:
            "transform 220ms cubic-bezier(0.22,1,0.36,1), opacity 180ms ease",
          willChange: "transform, opacity",
        }}
      >
        <DrawerSafeAreaTop
          bgcolor={isDark ? PROFILE_HERO_SAFE_BG.dark : PROFILE_HERO_SAFE_BG.light}
        />
        {/* ── HERO HEADER ── */}
        <Box
          sx={{
            position: "relative",
            pb: 3,
            px: 2.5,
            background: isDark
              ? `linear-gradient(150deg, ${alpha("#1e6fd9", 0.22)} 0%, ${alpha("#6366f1", 0.1)} 50%, transparent 100%)`
              : `linear-gradient(150deg, ${alpha("#1e6fd9", 0.12)} 0%, ${alpha("#6366f1", 0.05)} 50%, transparent 100%)`,
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              backgroundImage: isDark
                ? `radial-gradient(circle at 88% 12%, ${alpha("#6366f1", 0.14)} 0%, transparent 55%)`
                : `radial-gradient(circle at 88% 12%, ${alpha("#6366f1", 0.07)} 0%, transparent 55%)`,
              pointerEvents: "none",
            },
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: 0,
              left: 20,
              right: 20,
              height: "1px",
              background: isDark
                ? `linear-gradient(90deg, transparent, ${alpha("#1e6fd9", 0.45)}, transparent)`
                : `linear-gradient(90deg, transparent, ${alpha("#1e6fd9", 0.2)}, transparent)`,
            },
          }}
        >
          {/* Top bar: title + close */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              pt: 1.5,
              pb: 2,
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{
                color: "text.secondary",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                fontSize: "0.72rem",
              }}
            >
              {t("Account", { defaultValue: "Account" })}
            </Typography>
            <IconButton
              onClick={handleBack}
              disabled={pageClosing}
              size="small"
              sx={{
                width: 30,
                height: 30,
                bgcolor: isDark ? alpha("#fff", 0.08) : alpha("#000", 0.05),
                transition: "all 0.15s ease",
                "&:hover": {
                  bgcolor: isDark ? alpha("#fff", 0.14) : alpha("#000", 0.1),
                  transform: "scale(1.1)",
                },
              }}
            >
              <CloseIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Avatar
              sx={{
                width: 68,
                height: 68,
                fontSize: "1.7rem",
                fontWeight: 800,
                flexShrink: 0,
                background: "linear-gradient(135deg, #1e6fd9 0%, #6366f1 100%)",
                boxShadow: `0 8px 32px ${alpha("#1e6fd9", isDark ? 0.55 : 0.35)}, 0 2px 8px rgba(0,0,0,0.15)`,
                border: `3px solid ${isDark ? alpha("#fff", 0.12) : alpha("#fff", 0.95)}`,
              }}
            >
              {(displayName || "U").charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  minWidth: 0,
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={800}
                  noWrap
                  sx={{ flex: 1, minWidth: 0, letterSpacing: "-0.02em" }}
                >
                  {displayName}
                </Typography>
                <IconButton
                  ref={changeNameButtonRef}
                  size="small"
                  onClick={(e) => {
                    e?.currentTarget?.blur?.();
                    if (user) {
                      setUserNameInput(
                        user?.displayName || user?.username || "",
                      );
                      setUserNameDialogOpen(true);
                      return;
                    }
                    setGuestNameInput(guestUser?.displayName || "");
                    setGuestNameDialogOpen(true);
                  }}
                  sx={{
                    flexShrink: 0,
                    width: 28,
                    height: 28,
                    bgcolor: isDark
                      ? alpha("#1e6fd9", 0.2)
                      : alpha("#1e6fd9", 0.1),
                    color: "primary.main",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      bgcolor: isDark
                        ? alpha("#1e6fd9", 0.32)
                        : alpha("#1e6fd9", 0.2),
                      transform: "scale(1.1)",
                    },
                  }}
                >
                  <EditIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Box>

              {!!email && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  noWrap
                  sx={{ mt: 0.3 }}
                >
                  {email}
                </Typography>
              )}

              {!user && (
                <Box
                  sx={{
                    mt: 0.75,
                    display: "inline-flex",
                    alignItems: "center",
                    px: 1,
                    py: 0.25,
                    borderRadius: 0,
                    border: `1px solid ${isDark ? alpha("#fff", 0.1) : alpha("#1e6fd9", 0.2)}`,
                    bgcolor: isDark
                      ? alpha("#fff", 0.05)
                      : alpha("#1e6fd9", 0.05),
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{
                      color: isDark ? alpha("#fff", 0.6) : "#1e6fd9",
                      fontSize: "0.7rem",
                    }}
                  >
                    {t("Guest User")}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* ── SCROLLABLE BODY ── */}
        <Box
          sx={{
            flex: 1,
            py: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1.25,
          }}
        >
          {/* Owner / Admin section */}
          {showOwnerAdminSection && (
              <Box sx={{ px: 2 }}>
                {loadingEntities ? (
                  <ProfileOwnerSectionSkeleton rows={3} />
                ) : (
                <Box sx={cardSx}>
                  {user && ownerProfileChoices.length > 0 && (
                    <ListItemButton
                      component={
                        ownerProfileChoices.length === 1 ? Link : undefined
                      }
                      to={
                        ownerProfileChoices.length === 1
                          ? ownerProfileChoices[0].path
                          : undefined
                      }
                      onClick={
                        ownerProfileChoices.length > 1
                          ? (e) => {
                              e.preventDefault();
                              e.currentTarget?.blur?.();
                              setOwnerProfilePickerOpen(true);
                            }
                          : () => onClose?.()
                      }
                    >
                      <ListItemIcon>
                        <OwnerProfileListIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={t("ownerMyProfile", {
                          defaultValue: "My profile",
                        })}
                        secondary={t("ownerMyProfileHint", {
                          defaultValue: "Open your public Profile",
                        })}
                      />
                    </ListItemButton>
                  )}
                  {user && canAccessOwnerDashboard(user) && (
                    <>
                      {user && ownerProfileChoices.length > 0 && (
                        <Divider sx={{ mx: 2, opacity: 0.4 }} />
                      )}
                      <ListItemButton
                        component={Link}
                        to="/owner-dashboard"
                        onClick={() => onClose?.()}
                      >
                        <ListItemIcon>
                          <StorefrontIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={t("Owner dashboard", {
                            defaultValue: "Owner dashboard",
                          })}
                        />
                      </ListItemButton>
                    </>
                  )}
                  {user && canAccessOwnerDataEntryPage(user) && (
                    <>
                      <Divider sx={{ mx: 2, opacity: 0.4 }} />
                      <ListItemButton
                        component={Link}
                        to="/owner-data-entry"
                        onClick={() => onClose?.()}
                      >
                        <ListItemIcon>
                          <AddIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={t("Owner Data Entry", {
                            defaultValue: "Owner Data Entry",
                          })}
                        />
                      </ListItemButton>
                    </>
                  )}
                  {user && canAccessPendingPage(user) && (
                    <>
                      <Divider sx={{ mx: 2, opacity: 0.4 }} />
                      <ListItemButton
                        component={Link}
                        to="/pending"
                        onClick={() => onClose?.()}
                      >
                        <ListItemIcon>
                          <HourglassTopIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={t("Pending reviews", {
                            defaultValue: "Pending reviews",
                          })}
                        />
                      </ListItemButton>
                    </>
                  )}
                  {showDataEntryLink && (
                    <>
                      <Divider sx={{ mx: 2, opacity: 0.4 }} />
                      <ListItemButton
                        component={Link}
                        to="/admin"
                        onClick={() => onClose?.()}
                      >
                        <ListItemIcon>
                          <AdminPanelSettingsIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={t("Data Entry")} />
                      </ListItemButton>
                      {isAdmin && (
                        <>
                          <Divider sx={{ mx: 2, opacity: 0.4 }} />
                          <ListItemButton
                            component={Link}
                            to="/admin/customization"
                            onClick={() => onClose?.()}
                          >
                            <ListItemIcon>
                              <PaletteIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={t("Customization")} />
                          </ListItemButton>
                          <Divider sx={{ mx: 2, opacity: 0.4 }} />
                          <ListItemButton
                            component={Link}
                            to="/admin/users"
                            onClick={() => onClose?.()}
                          >
                            <ListItemIcon>
                              <PeopleIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={t("Users")} />
                          </ListItemButton>
                          <Divider sx={{ mx: 2, opacity: 0.4 }} />
                          <ListItemButton
                            component={Link}
                            to="/admin/visitors"
                            onClick={() => onClose?.()}
                          >
                            <ListItemIcon>
                              <BarChartIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={t("Visitors report")} />
                          </ListItemButton>
                          <Divider sx={{ mx: 2, opacity: 0.4 }} />
                          <ListItemButton
                            component={Link}
                            to="/admin/feedback"
                            onClick={() => onClose?.()}
                          >
                            <ListItemIcon>
                              <FeedbackIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={t("User feedback", {
                                defaultValue: "User feedback",
                              })}
                            />
                          </ListItemButton>
                          <Divider sx={{ mx: 2, opacity: 0.4 }} />
                          <ListItemButton
                            component={Link}
                            to="/admin/translations"
                            onClick={() => onClose?.()}
                          >
                            <ListItemIcon>
                              <LanguageIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={t("translationPage.title")}
                            />
                          </ListItemButton>
                          <Divider sx={{ mx: 2, opacity: 0.4 }} />
                          <ListItemButton
                            component={Link}
                            to="/admin/dashboard"
                            onClick={() => onClose?.()}
                          >
                            <ListItemIcon>
                              <DashboardIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={t("Admin Dashboard")} />
                          </ListItemButton>
                          <Divider sx={{ mx: 2, opacity: 0.4 }} />
                          <ListItemButton
                            component={Link}
                            to="/admin/cities"
                            onClick={() => onClose?.()}
                          >
                            <ListItemIcon>
                              <LocationOnIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={t("City management", {
                                defaultValue: "City management",
                              })}
                            />
                          </ListItemButton>
                        </>
                      )}
                    </>
                  )}
                </Box>
                )}
              </Box>
            )}

          {/* Profile navigation hub */}
          <Box sx={{ px: 2 }}>
            <Box sx={{ ...cardSx, p: 1.5 }}>
              <ProfileSectionLabel
                icon={GridViewIcon}
                label={t("Navigation Hub", { defaultValue: "Navigation Hub" })}
                sx={{ mb: 1.25 }}
              />
              <Stack spacing={1.75}>
                {profileHubGroups.map((group) => (
                  <Box key={group.title}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mb: 0.75,
                        fontWeight: 800,
                        color: "text.secondary",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {group.title}
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: 1,
                      }}
                    >
                      {group.items.map(
                        ({ key, label, path, Icon, onClick }) => {
                          const content = (
                            <>
                              <Box
                                sx={{
                                  width: 34,
                                  height: 34,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: 0,
                                  bgcolor: isDark
                                    ? alpha("#1e6fd9", 0.18)
                                    : alpha("#1e6fd9", 0.09),
                                  color: "primary.main",
                                }}
                              >
                                <Icon sx={{ fontSize: 19 }} />
                              </Box>
                              <Typography
                                sx={{
                                  fontSize: "0.78rem",
                                  fontWeight: 800,
                                  lineHeight: 1.25,
                                }}
                              >
                                {label}
                              </Typography>
                            </>
                          );

                          if (path) {
                            return (
                              <Box
                                key={key}
                                component={Link}
                                to={path}
                                onClick={() => onClose?.()}
                                sx={hubCardSx}
                              >
                                {content}
                              </Box>
                            );
                          }

                          return (
                            <Box
                              key={key}
                              component="button"
                              type="button"
                              onClick={onClick}
                              sx={{
                                ...hubCardSx,
                                cursor: "pointer",
                                textAlign: "start",
                                fontFamily: "inherit",
                              }}
                            >
                              {content}
                            </Box>
                          );
                        },
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>

          {/* Contact Us */}
          {contactItems.length > 0 && (
            <Box sx={{ px: 2 }}>
              <Box sx={cardSx}>
                <ListItem sx={profileSettingsRowSx}>
                  <ProfileSectionLabel
                    icon={ContactMailIcon}
                    label={t("Contact Us")}
                  />
                  <Box
                    sx={{
                      display: "flex",
                      gap: 0.5,
                      flexShrink: 0,
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                    }}
                  >
                    {contactItems.map((item) => {
                      const href = normalizeUrl(item.value, item.key);
                      const btnSx = {
                        minWidth: 34,
                        width: 34,
                        height: 34,
                        p: 0,
                        borderRadius: 0,
                        borderColor: isDark
                          ? alpha("#fff", 0.1)
                          : alpha("#000", 0.08),
                        color: "text.secondary",
                        flexShrink: 0,
                        transition: "all 0.15s ease",
                        "&:hover": {
                          borderColor: "primary.main",
                          color: "primary.main",
                          transform: "translateY(-1px)",
                          boxShadow: `0 4px 12px ${alpha("#1e6fd9", 0.2)}`,
                        },
                      };
                      if (item.key === "whatsapp" && href) {
                        return (
                          <Button
                            key={item.key}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              openWhatsAppLink(href);
                            }}
                            size="small"
                            variant="outlined"
                            sx={btnSx}
                          >
                            {item.icon}
                          </Button>
                        );
                      }
                      return (
                        <Button
                          key={item.key}
                          component="a"
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          variant="outlined"
                          sx={btnSx}
                        >
                          {item.icon}
                        </Button>
                      );
                    })}
                  </Box>
                </ListItem>
              </Box>
            </Box>
          )}

          {/* Auth actions */}
          <Box sx={{ px: 2, pb: 2 }}>
            <Box sx={cardSx}>
              {user ? (
                <>
                  <ListItemButton
                    ref={deactivateButtonRef}
                    onClick={(e) => {
                      e?.currentTarget?.blur?.();
                      setDeactivateDialogOpen(true);
                    }}
                    sx={{
                      color: isDark ? "#fbbf24" : "#d97706",
                      "&:hover": { bgcolor: alpha("#f59e0b", 0.07) },
                    }}
                  >
                    <ListItemIcon>
                      <BlockIcon
                        sx={{ color: isDark ? "#fbbf24" : "#d97706" }}
                        fontSize="small"
                      />
                    </ListItemIcon>
                    <ListItemText primary={t("Deactivate Account")} />
                  </ListItemButton>
                  <Divider sx={{ mx: 2, opacity: 0.4 }} />
                  <ListItemButton
                    onClick={() => logout()}
                    sx={{
                      color: "#ef4444",
                      "&:hover": { bgcolor: alpha("#ef4444", 0.07) },
                    }}
                  >
                    <ListItemIcon>
                      <LogoutIcon sx={{ color: "#ef4444" }} fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={t("Logout")} />
                  </ListItemButton>
                </>
              ) : (
                <ListItemButton
                  component={Link}
                  to="/login"
                  onClick={() => onClose?.()}
                  sx={{
                    color: "primary.main",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.07),
                    },
                  }}
                >
                  <ListItemIcon>
                    <LoginIcon
                      sx={{ color: "primary.main" }}
                      fontSize="small"
                    />
                  </ListItemIcon>
                  <ListItemText primary={t("Login")} />
                </ListItemButton>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── DIALOGS ── */}
      <Dialog
        open={languageDialogOpen}
        onClose={() => setLanguageDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t("Language")}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[
              { code: "en", flag: "🇺🇸", label: t("English") },
              { code: "ar", flag: "🇸🇦", label: t("Arabic") },
            ].map(({ code, flag, label }) => (
              <Button
                key={code}
                fullWidth
                variant={i18n.language === code ? "contained" : "outlined"}
                onClick={() => {
                  i18n.changeLanguage(code);
                  setLanguageDialogOpen(false);
                }}
                sx={{
                  justifyContent: "flex-start",
                  textTransform: "none",
                  fontWeight: 600,
                  py: 1.1,
                }}
              >
                {flag} {label}
              </Button>
            ))}
            <Button
              fullWidth
              variant={i18n.language === "ku" ? "contained" : "outlined"}
              onClick={() => {
                i18n.changeLanguage("ku");
                setLanguageDialogOpen(false);
              }}
              sx={{
                justifyContent: "flex-start",
                textTransform: "none",
                fontWeight: 600,
                py: 1.1,
              }}
            >
              <Box
                component="span"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Box
                  component="img"
                  src={kurdishFlag}
                  alt="Kurdish"
                  sx={{
                    width: 18,
                    height: 12,
                    objectFit: "cover",
                    borderRadius: 0.5,
                  }}
                />
                {t("Kurdish")}
              </Box>
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLanguageDialogOpen(false)}>
            {t("Close")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={cityDialogOpen}
        onClose={() => setCityDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {t("Change City", { defaultValue: "Change City" })}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>{t("City")}</InputLabel>
            <Select
              label={t("City")}
              value={selectedCity}
              onChange={(e) => changeCity(e.target.value)}
            >
              {cities.map((city) => (
                <MenuItem key={city.value} value={city.value}>
                  {city.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCityDialogOpen(false)}>
            {t("Done", { defaultValue: "Done" })}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={themeDialogOpen}
        onClose={() => setThemeDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t("Theme", { defaultValue: "Theme" })}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1.5, mt: 0.5 }}
          >
            {t("Appearance", { defaultValue: "Appearance" })}
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              p: 0.5,
              borderRadius: 1,
              border: `1px solid ${isDark ? alpha("#fff", 0.08) : alpha("#000", 0.07)}`,
              background: isDark ? alpha("#fff", 0.03) : alpha("#f0f4ff", 0.8),
            }}
          >
            {[
              { value: "light", Icon: LightModeOutlined, label: t("Light") },
              { value: "dark", Icon: DarkModeOutlined, label: t("Dark") },
              {
                value: "system",
                Icon: BrightnessAutoRounded,
                label: t("System", { defaultValue: "System" }),
              },
            ].map(({ value, Icon, label }) => (
              <Box
                key={value}
                component="button"
                type="button"
                onClick={() => setColorMode(value)}
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.4,
                  py: 1,
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 1,
                  transition: "all 0.18s ease",
                  background:
                    colorMode === value
                      ? isDark
                        ? `linear-gradient(135deg, ${alpha("#1e6fd9", 0.35)}, ${alpha("#6366f1", 0.25)})`
                        : `linear-gradient(135deg, ${alpha("#1e6fd9", 0.12)}, ${alpha("#6366f1", 0.08)})`
                      : "transparent",
                  boxShadow:
                    colorMode === value
                      ? `0 2px 10px ${alpha("#1e6fd9", 0.25)}, inset 0 1px 0 ${alpha("#fff", 0.1)}`
                      : "none",
                  "&:hover": {
                    background:
                      colorMode !== value
                        ? isDark
                          ? alpha("#fff", 0.04)
                          : alpha("#1e6fd9", 0.04)
                        : undefined,
                  },
                }}
              >
                <Icon
                  sx={{
                    fontSize: 22,
                    color:
                      colorMode === value ? "primary.main" : "text.secondary",
                  }}
                />
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color:
                      colorMode === value ? "primary.main" : "text.secondary",
                    lineHeight: 1,
                  }}
                >
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setThemeDialogOpen(false)}>
            {t("Done", { defaultValue: "Done" })}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={feedbackDialogOpen}
        onClose={() => !feedbackSubmitting && setFeedbackDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t("Suggestion / Report a problem", {
            defaultValue: "Suggestion / Report a problem",
          })}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>{t("Type", { defaultValue: "Type" })}</InputLabel>
            <Select
              label={t("Type", { defaultValue: "Type" })}
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              MenuProps={{
                PaperProps: {
                  sx: {
                    "& .MuiMenuItem-root": {
                      whiteSpace: "normal",
                      lineHeight: 1.35,
                    },
                  },
                },
              }}
              sx={{
                "& .MuiSelect-select": {
                  whiteSpace: "normal",
                  lineHeight: 1.35,
                  py: 1.2,
                },
              }}
            >
              <MenuItem value="suggestion" sx={{ whiteSpace: "normal" }}>
                {t("Suggestion", { defaultValue: "Suggestion" })}
              </MenuItem>
              <MenuItem value="problem" sx={{ whiteSpace: "normal" }}>
                {t("Report a problem", { defaultValue: "Report a problem" })}
              </MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            minRows={4}
            maxRows={8}
            value={feedbackNote}
            onChange={(e) => setFeedbackNote(e.target.value)}
            placeholder={t("Write your note here...", {
              defaultValue: "Write your note here...",
            })}
          />
          {feedbackError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {feedbackError}
            </Alert>
          )}
          {feedbackSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {feedbackSuccess}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setFeedbackDialogOpen(false)}
            disabled={feedbackSubmitting}
          >
            {t("Cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={submitFeedback}
            disabled={feedbackSubmitting}
          >
            {feedbackSubmitting
              ? t("Sending...", { defaultValue: "Sending..." })
              : t("Send", { defaultValue: "Send" })}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={ownerProfilePickerOpen}
        onClose={() => setOwnerProfilePickerOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {t("ownerMyProfilePickTitle", {
            defaultValue: "Which page do you want to open?",
          })}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <List disablePadding>
            {ownerProfileChoices.map((choice) => {
              const RowIcon = choice.path.startsWith("/stores/")
                ? StoreNavIcon
                : choice.path.startsWith("/brands/")
                  ? BusinessNavIcon
                  : CorporateFareNavIcon;
              return (
                <ListItem
                  key={`${choice.entityType}:${choice.entityId}`}
                  disablePadding
                  sx={{ mb: 0.5 }}
                >
                  <ListItemButton
                    onClick={() => {
                      setOwnerProfilePickerOpen(false);
                      closeThen(() => navigate(choice.path));
                    }}
                  >
                    <ListItemIcon>
                      <RowIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={ownerProfileChoiceLabel(choice)}
                      secondary={
                        choice.entityType === "store"
                          ? t("Store", { defaultValue: "Store" })
                          : choice.entityType === "brand"
                            ? t("Brand", { defaultValue: "Brand" })
                            : t("Company", { defaultValue: "Company" })
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOwnerProfilePickerOpen(false)}>
            {t("Cancel")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={guestNameDialogOpen}
        onClose={() => setGuestNameDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        TransitionProps={{
          onExited: () => changeNameButtonRef.current?.focus?.(),
        }}
      >
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
        TransitionProps={{
          onExited: () => changeNameButtonRef.current?.focus?.(),
        }}
      >
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
        TransitionProps={{
          onEntered: () => deactivateCancelButtonRef.current?.focus?.(),
          onExited: () => deactivateButtonRef.current?.focus?.(),
        }}
      >
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
            autoFocus
            ref={deactivateCancelButtonRef}
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
                closeThen(() => navigate("/"));
              } else {
                alert(result?.message || t("Deactivation failed"));
              }
            }}
          >
            {deactivating ? t("Deactivating...") : t("Deactivate Account")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProfilePage;
