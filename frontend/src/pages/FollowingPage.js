import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Skeleton,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import ArrowBack from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BusinessIcon from "@mui/icons-material/Business";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import PersonAddDisabledIcon from "@mui/icons-material/PersonAddDisabled";
import { useTranslation } from "react-i18next";
import { useUserTracking } from "../hooks/useUserTracking";
import { useLocalizedContent } from "../hooks/useLocalizedContent";
import { resolveMediaUrl } from "../utils/mediaUrl";
import FollowButton from "../components/store/FollowButton";

const ENTITY_TABS = [
  { key: "stores", labelKey: "Stores", Icon: StorefrontIcon },
  { key: "brands", labelKey: "Brands", Icon: BusinessIcon },
  { key: "companies", labelKey: "Companies", Icon: CorporateFareIcon },
];

const FollowingPage = ({ embedded = false, onClose }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const { locName } = useLocalizedContent();
  const {
    getFollowing,
    toggleFollowStore,
    toggleFollowBrand,
    toggleFollowCompany,
    user,
  } = useUserTracking();

  const [activeTab, setActiveTab] = useState("stores");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stores, setStores] = useState([]);
  const [brands, setBrands] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [unfollowLoading, setUnfollowLoading] = useState({});

  const loadFollowing = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getFollowing();
      if (result?.success && result?.data) {
        setStores(Array.isArray(result.data.stores) ? result.data.stores : []);
        setBrands(Array.isArray(result.data.brands) ? result.data.brands : []);
        setCompanies(
          Array.isArray(result.data.companies) ? result.data.companies : [],
        );
      } else {
        setStores([]);
        setBrands([]);
        setCompanies([]);
        if (result && result.success === false) {
          setError(result.message || t("Failed to load following"));
        }
      }
    } catch (err) {
      console.error("Error loading following:", err);
      setError(t("Failed to load following"));
      setStores([]);
      setBrands([]);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [getFollowing, t]);

  useEffect(() => {
    loadFollowing();
  }, [loadFollowing, user]);

  const listsByTab = useMemo(
    () => ({
      stores,
      brands,
      companies,
    }),
    [stores, brands, companies],
  );

  const activeList = listsByTab[activeTab] || [];

  const handleEntityOpen = (entity) => {
    if (!entity?._id) return;
    const path =
      activeTab === "brands"
        ? `/brands/${entity._id}`
        : activeTab === "companies"
          ? `/companies/${entity._id}`
          : `/stores/${entity._id}`;
    if (embedded) onClose?.();
    navigate(path);
  };

  const handleUnfollow = async (entity, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!entity?._id || unfollowLoading[entity._id]) return;

    setUnfollowLoading((prev) => ({ ...prev, [entity._id]: true }));
    try {
      let result;
      if (activeTab === "brands") {
        result = await toggleFollowBrand(entity._id);
      } else if (activeTab === "companies") {
        result = await toggleFollowCompany(entity._id);
      } else {
        result = await toggleFollowStore(entity._id);
      }

      if (result?.success) {
        const remover = (list) =>
          list.filter((item) => String(item._id) !== String(entity._id));
        if (activeTab === "brands") setBrands(remover);
        else if (activeTab === "companies") setCompanies(remover);
        else setStores(remover);
      }
    } finally {
      setUnfollowLoading((prev) => ({ ...prev, [entity._id]: false }));
    }
  };

  const navigationControl = embedded ? (
    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
      <IconButton
        onClick={() => onClose?.()}
        aria-label={t("Close")}
        size="small"
        sx={{
          width: 30,
          height: 30,
          bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
          "&:hover": {
            bgcolor: isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.1)",
          },
        }}
      >
        <CloseIcon sx={{ fontSize: 17 }} />
      </IconButton>
    </Box>
  ) : (
    <Button
      variant="outlined"
      startIcon={
        <ArrowBack sx={{ transform: isRtl ? "scaleX(-1)" : undefined }} />
      }
      onClick={() => navigate(-1)}
      sx={{
        mt: { xs: 4, md: 3 },
        mb: 3,
        borderRadius: 2,
        borderColor: isDark ? "#4A90E2" : "#1E6FD9",
        color: isDark ? "#4A90E2" : "#1E6FD9",
        "&:hover": {
          borderColor: isDark ? "#4A90E2" : "#1E6FD9",
          backgroundColor: isDark
            ? "rgba(255, 122, 26, 0.1)"
            : "rgba(30, 111, 217, 0.1)",
        },
      }}
    >
      {t("Back")}
    </Button>
  );

  const emptyCopy = {
    stores: {
      title: t("No followed stores yet"),
      hint: t("Follow stores from the main page to see them here"),
    },
    brands: {
      title: t("No followed brands yet", {
        defaultValue: "No followed brands yet",
      }),
      hint: t("Follow brands from brand pages to see them here", {
        defaultValue: "Follow brands from brand pages to see them here",
      }),
    },
    companies: {
      title: t("No followed companies yet", {
        defaultValue: "No followed companies yet",
      }),
      hint: t("Follow companies from company pages to see them here", {
        defaultValue: "Follow companies from company pages to see them here",
      }),
    },
  };

  const shellSx = {
    py: 3,
    px: 2,
    pb: { xs: embedded ? 3 : 10, sm: 3 },
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    overflowX: "hidden",
    boxSizing: "border-box",
    minHeight: embedded ? "100%" : "100vh",
    height: embedded ? "100%" : "auto",
    overflowY: embedded ? "auto" : undefined,
    bgcolor: "background.default",
  };

  if (loading) {
    return (
      <Box sx={shellSx}>
        {navigationControl}
        <Skeleton variant="text" sx={{ width: "40%", mb: 2 }} />
        <Skeleton variant="rectangular" height={42} sx={{ mb: 2, borderRadius: 2 }} />
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton
            key={idx}
            variant="rectangular"
            height={88}
            sx={{ mb: 1.5, borderRadius: 2 }}
          />
        ))}
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={shellSx}>
        {navigationControl}
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadFollowing}>
          {t("Retry", { defaultValue: "Retry" })}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={shellSx}>
      {navigationControl}

      <Typography
        variant="h4"
        sx={{
          mb: 2,
          fontWeight: 800,
          color: isDark ? "#fff" : "#111827",
        }}
      >
        {t("Following")}
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{
          mb: 2,
          minHeight: 42,
          "& .MuiTab-root": {
            minHeight: 42,
            textTransform: "none",
            fontWeight: 700,
          },
        }}
      >
        {ENTITY_TABS.map(({ key, labelKey, Icon }) => (
          <Tab
            key={key}
            value={key}
            icon={<Icon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`${t(labelKey)} (${listsByTab[key]?.length || 0})`}
          />
        ))}
      </Tabs>

      {activeList.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            px: 2,
            borderRadius: 4,
            backgroundColor: isDark
              ? "rgba(255,255,255,0.03)"
              : "rgba(0,0,0,0.02)",
          }}
        >
          <PersonAddDisabledIcon
            sx={{
              fontSize: 72,
              mb: 2,
              color: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)",
            }}
            gutterBottom
          >
            {emptyCopy[activeTab].title}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
            }}
          >
            {emptyCopy[activeTab].hint}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
            },
            gap: 1.5,
            width: "100%",
          }}
        >
          {activeList.map((entity) => {
            const name = locName(entity) || t("Untitled");
            const typeLabel =
              activeTab === "brands"
                ? locName(entity.brandTypeId) || t("Brand")
                : activeTab === "companies"
                  ? locName(entity.brandTypeId) || t("Company")
                  : locName(entity.storeTypeId) || t("Store");

            return (
              <Card
                key={entity._id}
                onClick={() => handleEntityOpen(entity)}
                sx={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 3,
                  background: isDark
                    ? "linear-gradient(145deg,#1a2235,#1e2a42)"
                    : "#ffffff",
                  border: `1px solid ${
                    isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"
                  }`,
                  boxShadow: isDark
                    ? "0 2px 12px rgba(0,0,0,0.3)"
                    : "0 2px 10px rgba(0,0,0,0.05)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    borderColor: isDark ? "rgba(74,144,226,0.4)" : "#dce8ff",
                  },
                }}
              >
                <Avatar
                  src={entity.logo ? resolveMediaUrl(entity.logo) : undefined}
                  alt={name}
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(30,111,217,0.1)",
                  }}
                >
                  {activeTab === "stores" ? (
                    <StorefrontIcon />
                  ) : activeTab === "brands" ? (
                    <BusinessIcon />
                  ) : (
                    <CorporateFareIcon />
                  )}
                </Avatar>
                <CardContent sx={{ p: 0, flex: 1, minWidth: 0, "&:last-child": { pb: 0 } }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={800}
                    noWrap
                    sx={{ color: isDark ? "#fff" : "#111827" }}
                  >
                    {name}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.75, mt: 0.5, flexWrap: "wrap" }}>
                    <Chip
                      size="small"
                      label={typeLabel}
                      sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600 }}
                    />
                    {entity.isVip ? (
                      <Chip
                        size="small"
                        label={t("VIP")}
                        sx={{
                          height: 22,
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          bgcolor: "#f59e0b",
                          color: "#fff",
                        }}
                      />
                    ) : null}
                    <Chip
                      size="small"
                      label={`${Math.max(0, Number(entity.followerCount) || 0)} ${t("Followers")}`}
                      sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600 }}
                    />
                  </Box>
                </CardContent>
                <FollowButton
                  isFollowed
                  loading={Boolean(unfollowLoading[entity._id])}
                  t={t}
                  onClick={(e) => handleUnfollow(entity, e)}
                />
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default FollowingPage;
