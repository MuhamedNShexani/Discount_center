import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Skeleton,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import StorefrontIcon from "@mui/icons-material/Storefront";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import TuneIcon from "@mui/icons-material/Tune";
import WcIcon from "@mui/icons-material/Wc";
import { useNavigate } from "react-router-dom";
import BannerCarousel from "../components/BannerCarousel";
import { useTranslation } from "react-i18next";
import { adAPI, jobAPI, storeTypeAPI } from "../services/api";
import { resolveMediaUrl } from "../utils/mediaUrl";
import {
  getExpiryRemainingInfo,
  formatExpiryChipLabel,
  shouldShowExpiryChip,
  expiryChipBg,
  isExpiryStillValid,
} from "../utils/expiryDate";
import { useLocalizedContent } from "../hooks/useLocalizedContent";
import { useCityFilter } from "../context/CityFilterContext";
import { cityStringsMatch } from "../utils/cityMatch";
import { openWhatsAppLink } from "../utils/openWhatsAppLink";

function jobWhatsAppDigits(raw) {
  return String(raw ?? "").replace(/\D/g, "");
}

function buildJobWhatsAppApiUrl(digits) {
  if (!digits || digits.length < 8) return "";
  return `https://api.whatsapp.com/send?phone=${digits}`;
}

function buildJobMailtoUrl(emailRaw, titleLine) {
  const email = String(emailRaw ?? "").trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "";
  const subject = encodeURIComponent(
    titleLine ? `Job: ${titleLine}` : "Job inquiry",
  );
  const body = encodeURIComponent(
    titleLine
      ? `Hello,\n\nI am interested in: ${titleLine}\n\n`
      : "Hello,\n\nI am interested in this job posting.\n\n",
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

/** Matches `FindJobShowcase` on MainPage */
const JOB_ACCENT = "#10b981";
const JOB_ACCENT_DEEP = "#059669";
const JOB_GRADIENT_ICON = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
const JOB_GRADIENT_BTN = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
const JOB_GRADIENT_BTN_HOVER = "linear-gradient(135deg, #059669 0%, #047857 100%)";

const FindJob = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { locName, locDescription, locTitle } = useLocalizedContent();
  const { selectedCity } = useCityFilter();

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [bannerAds, setBannerAds] = useState([]);
  const [storeTypes, setStoreTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStoreType, setSelectedStoreType] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftStoreType, setDraftStoreType] = useState("all");
  const [draftGender, setDraftGender] = useState("all");
  const [selectedJob, setSelectedJob] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await storeTypeAPI.getAll();
        setStoreTypes(Array.isArray(res?.data) ? res.data : []);
      } catch {
        setStoreTypes([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [jobsRes, adsRes] = await Promise.all([
          jobAPI.getAll(),
          adAPI.getAll({ page: "findjob" }),
        ]);
        setJobs(Array.isArray(jobsRes?.data) ? jobsRes.data : []);
        const ads = Array.isArray(adsRes?.data) ? adsRes.data : [];
        setBannerAds(ads);
      } catch {
        setJobs([]);
        setBannerAds([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const bannerAdsWithImages = useMemo(
    () =>
      (bannerAds || [])
        .filter((ad) => !!ad.image)
        .map((ad) => ({
          _id: ad._id,
          src: resolveMediaUrl(ad.image),
          brandId: ad.brandId,
          storeId: ad.storeId,
          giftId: ad.giftId,
        })),
    [bannerAds],
  );

  const publicJobs = useMemo(
    () =>
      (jobs || []).filter((j) => {
        if (j?.active === false) return false;
        if (!isExpiryStillValid(j?.expireDate)) return false;
        const jobCity = String(j?.city || "").trim();
        if (!jobCity) return true;
        return cityStringsMatch(selectedCity, jobCity);
      }),
    [jobs, selectedCity],
  );

  const getOwner = (job) => {
    if (job?.companyId?._id) return { type: "company", ...job.companyId };
    if (job?.brandId?._id) return { type: "brand", ...job.brandId };
    if (job?.storeId?._id) return { type: "store", ...job.storeId };
    return null;
  };

  const getOwnerName = (job) => locName(getOwner(job)) || "";

  const getJobPlaceText = (job) =>
    [String(job?.city || "").trim(), String(job?.jobType || "").trim()]
      .filter(Boolean)
      .join(" ");

  const filteredJobs = useMemo(() => {
    let list = publicJobs;

    if (selectedStoreType !== "all") {
      list = list.filter((j) => {
        if (!j?.storeId) return false;
        const st = j.storeId?.storeTypeId;
        const stId = st && (st._id || st);
        return String(stId) === String(selectedStoreType);
      });
    }

    if (selectedGender !== "all") {
      list = list.filter(
        (j) => String(j?.gender || "any").toLowerCase() === selectedGender,
      );
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((job) => {
        const title = (locTitle(job) || job?.title || "").toLowerCase();
        const place = getJobPlaceText(job).toLowerCase();
        const owner = getOwnerName(job).toLowerCase();
        return (
          title.includes(q) || place.includes(q) || owner.includes(q)
        );
      });
    }

    return list;
  }, [
    publicJobs,
    selectedStoreType,
    selectedGender,
    search,
    locTitle,
    locName,
  ]);

  const hasCustomFilters =
    selectedStoreType !== "all" || selectedGender !== "all";

  const openFilterDialog = () => {
    setDraftStoreType(selectedStoreType);
    setDraftGender(selectedGender);
    setFilterOpen(true);
  };

  const applyFilterDialog = () => {
    setSelectedStoreType(draftStoreType || "all");
    setSelectedGender(draftGender || "all");
    setFilterOpen(false);
  };

  const resetFilterDialog = () => {
    setDraftStoreType("all");
    setDraftGender("all");
    setSelectedStoreType("all");
    setSelectedGender("all");
    setFilterOpen(false);
  };

  const activePillSx = {
    background: JOB_GRADIENT_BTN,
    color: "white",
    fontWeight: 700,
    border: "none",
    boxShadow: "0 2px 8px rgba(16,185,129,0.35)",
    "&.MuiChip-root": { height: 34 },
  };

  const inactivePillSx = {
    background: isDark ? "rgba(255,255,255,0.07)" : "#f3f4f6",
    color: isDark ? "rgba(255,255,255,0.85)" : "#374151",
    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb",
    fontWeight: 500,
    "&.MuiChip-root": { height: 34 },
  };

  const getOwnerIcon = (job) => {    const o = getOwner(job)?.type;
    if (o === "brand" || o === "company") {
      return <BusinessIcon sx={{ fontSize: "1rem" }} />;
    }
    return <StorefrontIcon sx={{ fontSize: "1rem" }} />;
  };

  const genderLabel = (g) => {
    const v = String(g || "any").toLowerCase();
    if (v === "male") return t("Male");
    if (v === "female") return t("Female");
    return t("Any");
  };

  return (
    <Box
      sx={{
        py: { xs: 3, md: 6 },
        mt: { xs: 3, md: 5 },
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="lg">
        {/* Ads banner — same as MainPage `BannerCarousel` */}
        <BannerCarousel
          banners={bannerAdsWithImages}
          onBannerClick={(ad) => {
            if (ad.brandId) navigate(`/brands/${ad.brandId}`);
            else if (ad.storeId) navigate(`/stores/${ad.storeId}`);
            else if (ad.giftId) navigate(`/gifts/${ad.giftId}`);
          }}
        />

        {/* Header — matches MainPage Find Job showcase accent */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 2,
            mt: { xs: 1, sm: 1.5 },
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: JOB_GRADIENT_ICON,
              boxShadow: "0 4px 12px rgba(16,185,129,0.4)",
            }}
          >
            <WorkOutlineIcon sx={{ color: "#fff", fontSize: "1.5rem" }} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                letterSpacing: "-0.02em",
                color: isDark ? "#fff" : "#064e3b",
                lineHeight: 1.2,
              }}
            >
              {t("Find Job")}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: isDark ? alpha("#fff", 0.65) : alpha("#065f46", 0.75),
                fontSize: { xs: "0.8rem", sm: "0.875rem" },
              }}
            >
              {t("Opportunities Near You")}
            </Typography>
          </Box>
        </Box>

        {/* Search + filters — same chrome as MainPage FilterChips */}
        <TextField
          variant="outlined"
          placeholder={t("Search jobs by title, place, or employer...", {
            defaultValue: "Search jobs by title, place, or employer...",
          })}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  sx={{
                    color: isDark ? "rgba(255,255,255,0.5)" : "text.secondary",
                    fontSize: 20,
                  }}
                />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {search ? (
                  <IconButton
                    size="small"
                    onClick={() => setSearch("")}
                    edge="end"
                    sx={{ p: 0.5, mr: 0.25 }}
                  >
                    <ClearIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                ) : null}
                <IconButton
                  size="small"
                  onClick={openFilterDialog}
                  edge="end"
                  aria-label={t("Filters", { defaultValue: "Filters" })}
                  sx={{
                    p: 0.6,
                    color: hasCustomFilters
                      ? JOB_ACCENT
                      : isDark
                        ? "rgba(255,255,255,0.6)"
                        : "text.secondary",
                  }}
                >
                  <Badge
                    variant="dot"
                    color="success"
                    invisible={!hasCustomFilters}
                  >
                    <TuneIcon sx={{ fontSize: 19 }} />
                  </Badge>
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: "14px",
              background: isDark ? "rgba(255,255,255,0.06)" : "#f9fafb",
              "& fieldset": {
                borderColor: isDark ? "rgba(255,255,255,0.12)" : "#e5e7eb",
              },
              "&:hover fieldset": {
                borderColor: JOB_ACCENT,
              },
              "&.Mui-focused fieldset": {
                borderColor: JOB_ACCENT,
                borderWidth: 1.5,
              },
            },
            "& .MuiInputBase-input": {
              fontSize: "0.9rem",
              py: "9px",
            },
          }}
        />

        <Dialog
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle sx={{ fontWeight: 800 }}>
            {t("Filters", { defaultValue: "Filters" })}
          </DialogTitle>
          <DialogContent>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 1,
                display: "flex",
                alignItems: "center",
                gap: 0.75,
              }}
            >
              <StorefrontRoundedIcon sx={{ fontSize: 18 }} />
              {t("Store Type", { defaultValue: "Store Type" })}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2 }}>
              <Chip
                label={t("All")}
                onClick={() => setDraftStoreType("all")}
                sx={draftStoreType === "all" ? activePillSx : inactivePillSx}
              />
              {storeTypes.map((st) => (
                <Chip
                  key={st._id}
                  label={locName(st) || t(st.name)}
                  onClick={() => setDraftStoreType(st._id)}
                  sx={
                    String(draftStoreType) === String(st._id)
                      ? activePillSx
                      : inactivePillSx
                  }
                />
              ))}
            </Box>

            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 1,
                display: "flex",
                alignItems: "center",
                gap: 0.75,
              }}
            >
              <WcIcon sx={{ fontSize: 18 }} />
              {t("Gender")}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {[
                { value: "all", label: t("All") },
                { value: "male", label: t("Male") },
                { value: "female", label: t("Female") },
                { value: "any", label: t("Any") },
              ].map(({ value, label }) => (
                <Chip
                  key={value}
                  label={label}
                  onClick={() => setDraftGender(value)}
                  sx={
                    draftGender === value ? activePillSx : inactivePillSx
                  }
                />
              ))}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={resetFilterDialog} sx={{ textTransform: "none" }}>
              {t("Reset", { defaultValue: "Reset" })}
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button
              onClick={() => setFilterOpen(false)}
              sx={{ textTransform: "none" }}
            >
              {t("Cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={applyFilterDialog}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                background: JOB_GRADIENT_BTN,
                boxShadow: "0 2px 8px rgba(16,185,129,0.3)",
                "&:hover": { background: JOB_GRADIENT_BTN_HOVER },
              }}
            >
              {t("Apply", { defaultValue: "Apply" })}
            </Button>
          </DialogActions>
        </Dialog>

        <Divider
          sx={{
            mb: 3,
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
          }}
        />
        {/* Job list */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  height={92}
                  sx={{
                    borderRadius: 3,
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.07)"
                      : undefined,
                  }}
                />
              ))}
            </>
          ) : filteredJobs.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 8,
                px: 2,
                borderRadius: 4,
                backgroundColor: isDark
                  ? alpha(JOB_ACCENT, 0.06)
                  : alpha(JOB_ACCENT, 0.04),
                border: `1px solid ${isDark ? alpha(JOB_ACCENT, 0.12) : alpha(JOB_ACCENT, 0.14)}`,
              }}
            >
              <WorkOutlineIcon
                sx={{
                  fontSize: 64,
                  mb: 2,
                  color: isDark ? alpha(JOB_ACCENT, 0.35) : alpha(JOB_ACCENT, 0.3),
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
                }}
              >
                {t("No jobs available")}
              </Typography>
              <Typography
                sx={{
                  color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
                  mt: 0.5,
                }}
              >
                {t("Try adjusting your search or filters.", {
                  defaultValue: "Try adjusting your search or filters.",
                })}
              </Typography>            </Box>
          ) : (
            filteredJobs.map((job) => {
              const imageSrc = resolveMediaUrl(job?.image);
              const expInfo = getExpiryRemainingInfo(job?.expireDate);
              const showExpiryChip = shouldShowExpiryChip(expInfo);

              return (
                <Card
                  key={job._id}
                  onClick={() => setSelectedJob(job)}
                  sx={{
                    display: "flex",
                    alignItems: "stretch",
                    borderRadius: 3,
                    overflow: "hidden",
                    cursor: "pointer",
                    background: isDark
                      ? "linear-gradient(145deg,#1a2235,#1e2a42)"
                      : "#ffffff",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : alpha(JOB_ACCENT, 0.14)}`,
                    boxShadow: isDark
                      ? "0 2px 12px rgba(0,0,0,0.3)"
                      : "0 2px 10px rgba(16,185,129,0.08)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      boxShadow: isDark
                        ? "0 6px 24px rgba(0,0,0,0.45)"
                        : "0 6px 20px rgba(16,185,129,0.14)",
                      borderColor: isDark
                        ? alpha(JOB_ACCENT, 0.4)
                        : alpha(JOB_ACCENT, 0.28),
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      width: 100,
                      height: 92,
                      flexShrink: 0,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "#f3f4f6",
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={imageSrc || "/logo192.png"}
                      alt={job?.title || "job"}
                      sx={{
                        width: 100,
                        height: 92,
                        objectFit: "cover",
                      }}
                    />
                    {showExpiryChip && (
                      <Chip
                        label={formatExpiryChipLabel(expInfo, t)}
                        size="small"
                        sx={{
                          position: "absolute",
                          bottom: 6,
                          left: 6,
                          maxWidth: "calc(100% - 12px)",
                          backgroundColor: expiryChipBg(expInfo),
                          color: "white",
                          fontWeight: 600,
                          fontSize: "0.6rem",
                          height: 20,
                          "& .MuiChip-label": { px: 0.6, lineHeight: 1.2 },
                        }}
                      />
                    )}
                  </Box>

                  <CardContent
                    sx={{
                      py: 1.25,
                      px: 1.75,
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: 0.6,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.95rem",
                        color: isDark ? "#fff" : "#111827",
                        lineHeight: 1.3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {locTitle(job) || t("Job")}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        flexWrap: "wrap",
                      }}
                    >
                      <Chip
                        size="small"
                        label={genderLabel(job?.gender)}
                        sx={{
                          height: 22,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          backgroundColor: isDark
                            ? alpha(JOB_ACCENT, 0.15)
                            : alpha(JOB_ACCENT, 0.08),
                          color: isDark ? "#34d399" : JOB_ACCENT_DEEP,
                          border: `1px solid ${isDark ? alpha(JOB_ACCENT, 0.28) : alpha(JOB_ACCENT, 0.2)}`,
                          "& .MuiChip-label": { px: 0.75 },
                        }}
                      />
                      {getOwnerName(job) && (
                        <Chip
                          size="small"
                          icon={getOwnerIcon(job)}
                          label={getOwnerName(job)}
                          sx={{
                            height: 22,
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            maxWidth: "100%",
                            backgroundColor: isDark
                              ? "rgba(255,255,255,0.07)"
                              : "rgba(0,0,0,0.04)",
                            color: isDark
                              ? "rgba(255,255,255,0.75)"
                              : "rgba(0,0,0,0.65)",
                            "& .MuiChip-icon": {
                              color: "inherit",
                              fontSize: "0.85rem !important",
                            },
                            "& .MuiChip-label": { px: 0.75 },
                          }}
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Box>
      </Container>

      {/* Job Detail Dialog */}
      <Dialog
        open={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        fullWidth
        maxWidth="sm"
        scroll="body"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: "background.paper",
            backgroundImage: "none",
            border: isDark
              ? "1px solid rgba(255,255,255,0.07)"
              : `1px solid ${alpha(JOB_ACCENT, 0.16)}`,
            boxShadow: isDark
              ? "0 24px 56px rgba(0,0,0,0.55)"
              : "0 24px 48px rgba(16,185,129,0.12)",
          },
        }}
      >
        {selectedJob && (
          <>
            <Box sx={{ position: "relative" }}>
              <IconButton
                aria-label={t("Close")}
                onClick={() => setSelectedJob(null)}
                sx={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  zIndex: 3,
                  color: "#fff",
                  backgroundColor: "rgba(0,0,0,0.38)",
                  backdropFilter: "blur(10px)",
                  "&:hover": {
                    backgroundColor: "rgba(0,0,0,0.52)",
                  },
                }}
              >
                <CloseIcon />
              </IconButton>

              <Box
                sx={{
                  position: "relative",
                  minHeight: { xs: 200, sm: 228 },
                  bgcolor: "background.default",
                }}
              >
                <Box
                  component="img"
                  src={resolveMediaUrl(selectedJob?.image) || "/logo192.png"}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.src = "/logo192.png";
                  }}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background: [
                      "linear-gradient(180deg, rgba(15,23,42,0.15) 0%, transparent 35%)",
                      "linear-gradient(180deg, transparent 25%, rgba(15,23,42,0.92) 100%)",
                    ].join(","),
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    p: { xs: 2, sm: 2.5 },
                    pt: 5,
                  }}
                >
                  <Typography
                    component="h2"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: "1.2rem", sm: "1.35rem" },
                      lineHeight: 1.25,
                      color: "#fff",
                      textShadow: "0 2px 12px rgba(0,0,0,0.45)",
                      pr: 5,
                    }}
                  >
                    {locTitle(selectedJob) || t("Job")}
                  </Typography>
                  {(() => {
                    const expInfo = getExpiryRemainingInfo(
                      selectedJob?.expireDate,
                    );
                    const showExp = shouldShowExpiryChip(expInfo);
                    if (!showExp) return null;
                    return (
                      <Chip
                        label={formatExpiryChipLabel(expInfo, t)}
                        size="small"
                        sx={{
                          mt: 1.25,
                          backgroundColor: expiryChipBg(expInfo),
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: "0.7rem",
                          height: 24,
                        }}
                      />
                    );
                  })()}
                </Box>
              </Box>
            </Box>

            <DialogContent
              sx={{
                px: { xs: 2, sm: 2.75 },
                py: 2.5,
                bgcolor: "background.paper",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  mb: 2,
                }}
              >
                <Chip
                  size="small"
                  label={`${t("Gender")}: ${genderLabel(selectedJob?.gender)}`}
                  sx={{
                    height: 28,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    backgroundColor: isDark
                      ? alpha(JOB_ACCENT, 0.2)
                      : alpha(JOB_ACCENT, 0.1),
                    color: isDark ? "#34d399" : JOB_ACCENT_DEEP,
                    border: `1px solid ${isDark ? alpha(JOB_ACCENT, 0.35) : alpha(JOB_ACCENT, 0.22)}`,
                  }}
                />
                {String(selectedJob?.jobType || "").trim() && (
                  <Chip
                    size="small"
                    label={String(selectedJob.jobType).trim()}
                    sx={{
                      height: 28,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(15,23,42,0.06)",
                      color: isDark
                        ? "rgba(255,255,255,0.88)"
                        : "rgba(15,23,42,0.85)",
                    }}
                  />
                )}
                {String(selectedJob?.city || "").trim() && (
                  <Chip
                    size="small"
                    icon={
                      <LocationOnOutlinedIcon
                        sx={{
                          fontSize: "1rem !important",
                          ml: "4px !important",
                        }}
                      />
                    }
                    label={t(`city.${String(selectedJob.city).trim()}`, {
                      defaultValue: String(selectedJob.city).trim(),
                    })}
                    sx={{
                      height: 28,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(15,23,42,0.06)",
                      color: isDark
                        ? "rgba(255,255,255,0.85)"
                        : "rgba(15,23,42,0.8)",
                      "& .MuiChip-icon": { color: "inherit" },
                    }}
                  />
                )}
                {getOwnerName(selectedJob) && (
                  <Chip
                    size="small"
                    icon={getOwnerIcon(selectedJob)}
                    label={getOwnerName(selectedJob)}
                    sx={{
                      height: 28,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      maxWidth: "100%",
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(15,23,42,0.06)",
                      color: isDark
                        ? "rgba(255,255,255,0.88)"
                        : "rgba(15,23,42,0.85)",
                      "& .MuiChip-icon": {
                        color: "inherit",
                        fontSize: "1rem !important",
                      },
                    }}
                  />
                )}
              </Box>

              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: isDark
                    ? "rgba(255,255,255,0.45)"
                    : "rgba(15,23,42,0.45)",
                  mb: 1,
                }}
              >
                {t("Description")}
              </Typography>

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2.5,
                  borderRadius: 2,
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)"}`,
                  backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#fff",
                }}
              >
                <Typography
                  sx={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.75,
                    color: isDark
                      ? "rgba(255,255,255,0.88)"
                      : "rgba(15,23,42,0.82)",
                    fontSize: "0.94rem",
                  }}
                >
                  {locDescription(selectedJob) || "—"}
                </Typography>
              </Paper>
              {(() => {
                const raw = String(selectedJob?.indeed ?? "").trim();
                if (!raw) return null;
                const isUrl = /^https?:\/\//i.test(raw);
                return (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      mb: 2,
                      borderRadius: 2,
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"}`,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.04)"
                        : "#fff",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        fontWeight: 800,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        color: isDark
                          ? "rgba(255,255,255,0.45)"
                          : "rgba(15,23,42,0.45)",
                        mb: 0.75,
                      }}
                    >
                      {t("Indeed")}
                    </Typography>
                    {isUrl ? (
                      <Link
                        href={raw}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          fontWeight: 600,
                          fontSize: "0.9rem",
                          wordBreak: "break-all",
                        }}
                      >
                        {t("View on Indeed")}
                        <OpenInNewIcon
                          sx={{ fontSize: "1rem", opacity: 0.85 }}
                        />
                      </Link>
                    ) : (
                      <Typography
                        sx={{
                          fontSize: "0.9rem",
                          lineHeight: 1.55,
                          color: isDark
                            ? "rgba(255,255,255,0.85)"
                            : "rgba(15,23,42,0.85)",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {raw}
                      </Typography>
                    )}
                  </Paper>
                );
              })()}
              {(() => {
                const titleLine =
                  locTitle(selectedJob) || selectedJob?.title || "";
                const waDigits = jobWhatsAppDigits(selectedJob?.whatsapp);
                const waUrl = buildJobWhatsAppApiUrl(waDigits);
                const mailHref = buildJobMailtoUrl(
                  selectedJob?.email,
                  titleLine,
                );
                if (!waUrl && !mailHref) return null;
                return (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: isDark
                          ? "rgba(255,255,255,0.45)"
                          : "rgba(15,23,42,0.45)",
                        mb: 1.25,
                      }}
                    >
                      {t("Contact about this job")}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: 1.25,
                        flexWrap: "wrap",
                      }}
                    >
                      {waUrl && (
                        <Button
                          variant="contained"
                          size="medium"
                          startIcon={<WhatsAppIcon />}
                          onClick={() => openWhatsAppLink(waUrl)}
                          sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            borderRadius: 2,
                            py: 1.1,
                            backgroundColor: "#25D366",
                            boxShadow: "none",
                            "&:hover": {
                              backgroundColor: "#1ebe57",
                              boxShadow: "0 6px 16px rgba(37,211,102,0.35)",
                            },
                          }}
                        >
                          {t("Apply via WhatsApp")}
                        </Button>
                      )}
                      {mailHref && (
                        <Button
                          variant="outlined"
                          size="medium"
                          startIcon={<EmailIcon />}
                          href={mailHref}
                          component="a"
                          sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            borderRadius: 2,
                            py: 1.1,
                            borderColor: isDark
                              ? alpha(JOB_ACCENT, 0.35)
                              : alpha(JOB_ACCENT, 0.35),
                            color: isDark ? "#34d399" : JOB_ACCENT_DEEP,
                            "&:hover": {
                              borderColor: JOB_ACCENT,
                              backgroundColor: alpha(JOB_ACCENT, 0.06),
                            },
                          }}
                        >
                          {t("Email about this job")}
                        </Button>
                      )}
                    </Box>
                  </Box>
                );
              })()}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default FindJob;
