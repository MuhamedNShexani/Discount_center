import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, IconButton, Skeleton, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useTranslation } from "react-i18next";
import { videoAPI } from "../../services/api";
import { useCityFilter } from "../../context/CityFilterContext";
import { isRtlLanguage } from "../../utils/isRtlLanguage";
import SectionHeader from "../SectionHeader";
import ReelCard from "./ReelCard";
import { filterHomeReels } from "./reelUtils";

function HomeReelsSkeleton({ skeletonBase, skeletonHighlight }) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.25,
        overflow: "hidden",
        px: { xs: 1.5, sm: 2 },
        py: { xs: 1.5, sm: 2 },
      }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          animation="wave"
          sx={{
            flexShrink: 0,
            width: { xs: 160, sm: 170, md: 180 },
            aspectRatio: "9 / 16",
            borderRadius: "20px",
            bgcolor: i % 2 === 0 ? skeletonHighlight : skeletonBase,
          }}
        />
      ))}
    </Box>
  );
}

const HomeReelsSection = memo(function HomeReelsSection() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);
  const { selectedCity } = useCityFilter();

  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const scrollRef = useRef(null);
  const dragState = useRef({ active: false, startX: 0, scrollLeft: 0 });
  const activeVideoIdRef = useRef(null);

  const skeletonBase = isDark ? alpha("#fff", 0.08) : alpha("#0d111c", 0.07);
  const skeletonHighlight = isDark
    ? alpha("#fff", 0.12)
    : alpha("#0d111c", 0.1);

  const loadReels = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await videoAPI.getAll();
      const list = Array.isArray(res?.data) ? res.data : [];
      setReels(list);
    } catch (e) {
      console.error("[HomeReelsSection]", e);
      setError(
        e?.response?.data?.message ||
          t("Failed to load reels.", { defaultValue: "Failed to load reels." }),
      );
      setReels([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadReels();
  }, [loadReels, selectedCity]);

  const visibleReels = useMemo(
    () => filterHomeReels(reels, selectedCity),
    [reels, selectedCity],
  );

  const scrollByPage = useCallback(
    (direction) => {
      const el = scrollRef.current;
      if (!el) return;
      const cardWidth = el.querySelector("article")?.offsetWidth || 170;
      const delta = (cardWidth + 10) * (direction === "next" ? 1 : -1);
      el.scrollBy({
        left: isRtl ? -delta : delta,
        behavior: "smooth",
      });
    },
    [isRtl],
  );

  const onPointerDown = (e) => {
    const el = scrollRef.current;
    if (!el || e.pointerType === "touch") return;
    dragState.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
    };
    el.setPointerCapture?.(e.pointerId);
    el.style.scrollSnapType = "none";
    el.style.cursor = "grabbing";
  };

  const onPointerMove = (e) => {
    const el = scrollRef.current;
    if (!el || !dragState.current.active) return;
    e.preventDefault();
    const dx = e.clientX - dragState.current.startX;
    el.scrollLeft = dragState.current.scrollLeft - dx;
  };

  const endDrag = (e) => {
    const el = scrollRef.current;
    if (!el || !dragState.current.active) return;
    dragState.current.active = false;
    el.releasePointerCapture?.(e.pointerId);
    el.style.scrollSnapType = "x mandatory";
    el.style.cursor = "grab";
  };

  const handleActivate = useCallback((id) => {
    activeVideoIdRef.current = id;
  }, []);

  const handleDeactivate = useCallback((id) => {
    if (activeVideoIdRef.current === id) {
      activeVideoIdRef.current = null;
    }
  }, []);

  const shellSx = {
    borderRadius: "20px",
    overflow: "hidden",
    mb: { xs: 1.5, sm: 2 },
    background: isDark
      ? "linear-gradient(135deg, #121826 0%, #0f172a 55%, #0b1220 100%)"
      : "linear-gradient(135deg, #eef3ff 0%, #f8fafc 50%, #ffffff 100%)",
    border: `1px solid ${isDark ? alpha("#fff", 0.08) : alpha("#1e6fd9", 0.12)}`,
    boxShadow: isDark
      ? "0 4px 20px rgba(0,0,0,0.35)"
      : "0 4px 20px rgba(30,111,217,0.08)",
  };

  return (
    <Box sx={shellSx} aria-label={t("Reels", { defaultValue: "Reels" })}>
      <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: { xs: 1.25, sm: 1.5 } }}>
        <SectionHeader
          icon={VideoLibraryIcon}
          title={t("Reels", { defaultValue: "Reels" })}
          subtitle={t("Short videos from stores & brands", {
            defaultValue: "Short videos from stores & brands",
          })}
          seeAllTo="/reels"
          action={t("See All", { defaultValue: "See All" })}
        />
      </Box>

      {loading ? (
        <HomeReelsSkeleton
          skeletonBase={skeletonBase}
          skeletonHighlight={skeletonHighlight}
        />
      ) : visibleReels.length === 0 ? (
        <Box
          sx={{
            mx: { xs: 1.5, sm: 2 },
            mb: { xs: 1.5, sm: 2 },
            py: 3.5,
            px: 2,
            textAlign: "center",
            borderRadius: "16px",
            border: `1px dashed ${isDark ? alpha("#fff", 0.12) : alpha("#1e6fd9", 0.2)}`,
            bgcolor: isDark ? alpha("#fff", 0.03) : alpha("#1e6fd9", 0.04),
          }}
        >
          <VideoLibraryIcon
            sx={{
              fontSize: 40,
              mb: 1,
              color: isDark ? alpha("#93c5fd", 0.7) : "primary.main",
            }}
          />
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
            {t("No Reels yet.", { defaultValue: "No Reels yet." })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error ||
              t("Check back soon for new videos.", {
                defaultValue: "Check back soon for new videos.",
              })}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ position: "relative", pb: { xs: 1.5, sm: 2 } }}>
          <IconButton
            aria-label={t("Previous reels", { defaultValue: "Previous reels" })}
            onClick={() => scrollByPage("prev")}
            sx={{
              display: { xs: "none", md: "flex" },
              position: "absolute",
              left: 4,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              bgcolor: isDark ? alpha("#000", 0.55) : alpha("#fff", 0.92),
              border: `1px solid ${isDark ? alpha("#fff", 0.12) : alpha("#1e6fd9", 0.15)}`,
              boxShadow: 2,
              "&:hover": {
                bgcolor: isDark ? alpha("#000", 0.72) : "#fff",
              },
            }}
          >
            {isRtl ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>

          <IconButton
            aria-label={t("Next reels", { defaultValue: "Next reels" })}
            onClick={() => scrollByPage("next")}
            sx={{
              display: { xs: "none", md: "flex" },
              position: "absolute",
              right: 4,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              bgcolor: isDark ? alpha("#000", 0.55) : alpha("#fff", 0.92),
              border: `1px solid ${isDark ? alpha("#fff", 0.12) : alpha("#1e6fd9", 0.15)}`,
              boxShadow: 2,
              "&:hover": {
                bgcolor: isDark ? alpha("#000", 0.72) : "#fff",
              },
            }}
          >
            {isRtl ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>

          <Box
            ref={scrollRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            onPointerCancel={endDrag}
            sx={{
              display: "flex",
              gap: 1.25,
              overflowX: "auto",
              overflowY: "hidden",
              px: { xs: 1.5, sm: 2 },
              py: 0.25,
              scrollSnapType: "x mandatory",
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",
              cursor: { md: "grab" },
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {visibleReels.map((reel) => (
              <ReelCard
                key={reel._id}
                reel={reel}
                onActivate={handleActivate}
                onDeactivate={handleDeactivate}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
});

export default HomeReelsSection;
