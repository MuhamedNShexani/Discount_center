import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Box, IconButton } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import { isRtlLanguage } from "../utils/isRtlLanguage";
import { useLocalizedContent } from "../hooks/useLocalizedContent";
import SectionHeader from "./SectionHeader";
import StoreTypeCard, { getStoreTypeAccentColor } from "./StoreTypeCard";

/**
 * Facebook Marketplace–style store type browser.
 * Pure UI layer — selection state, filtering, and data all stay owned by the parent
 * (same contract `FilterChips` used for its old chip row: `storeTypes` excludes "All").
 */
const StoreTypeCarousel = memo(function StoreTypeCarousel({
  storeTypes,
  selectedStoreTypeId,
  onStoreTypeSelect,
  storeTypeCounts,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);
  const { locName } = useLocalizedContent();

  const scrollRef = useRef(null);
  const dragState = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0 });
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const updateScrollHints = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    if (scrollWidth <= clientWidth + 2) {
      setShowLeftFade(false);
      setShowRightFade(false);
      return;
    }
    const max = scrollWidth - clientWidth;
    setShowLeftFade(scrollLeft > 6);
    setShowRightFade(scrollLeft < max - 6);
  }, []);

  useEffect(() => {
    updateScrollHints();
    const el = scrollRef.current;
    if (!el) return undefined;
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => updateScrollHints());
      ro.observe(el);
    }
    const onWin = () => updateScrollHints();
    window.addEventListener("resize", onWin);
    const timer = window.setTimeout(updateScrollHints, 150);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onWin);
      ro?.disconnect();
    };
  }, [updateScrollHints, storeTypes]);

  const scrollByStep = useCallback(
    (direction) => {
      const el = scrollRef.current;
      if (!el) return;
      const cardWidth = el.querySelector('[role="button"]')?.offsetWidth || 116;
      const step = (cardWidth + 10) * 3 * direction;
      el.scrollBy({ left: isRtl ? -step : step, behavior: "smooth" });
    },
    [isRtl],
  );

  const onPointerDown = (e) => {
    const el = scrollRef.current;
    if (!el || e.pointerType === "touch") return;
    dragState.current = {
      active: true,
      moved: false,
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
    const dx = e.clientX - dragState.current.startX;
    if (Math.abs(dx) > 3) dragState.current.moved = true;
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

  /** Prevents a drag-release from also firing the card's click/select. */
  const suppressClickIfDragged = (onSelect) => () => {
    if (dragState.current.moved) {
      dragState.current.moved = false;
      return;
    }
    onSelect();
  };

  const totalCount = useMemo(() => {
    if (!storeTypeCounts) return undefined;
    return Object.values(storeTypeCounts).reduce(
      (sum, n) => sum + (Number(n) || 0),
      0,
    );
  }, [storeTypeCounts]);

  const cards = useMemo(
    () => [
      { _id: "all", label: t("All"), icon: "", count: totalCount, isAll: true },
      ...storeTypes.map((type) => ({
        _id: type._id,
        label: locName(type) || t(type.name),
        icon: type.icon || "",
        count: storeTypeCounts?.[String(type._id)],
        badge: type.badge,
        accentColor: getStoreTypeAccentColor(type._id),
      })),
    ],
    [storeTypes, storeTypeCounts, totalCount, locName, t],
  );

  return (
    <Box sx={{ mb: 1.5 }}>
      <SectionHeader
        icon={StorefrontRoundedIcon}
        title={t("Store Types", { defaultValue: "Store Types" })}
        seeAllTo="/stores"
        action={t("See All", { defaultValue: "See All" })}
      />

      <Box sx={{ position: "relative" }}>
        {showLeftFade && (
          <Box
            aria-hidden
            sx={{
              pointerEvents: "none",
              position: "absolute",
              [isRtl ? "right" : "left"]: 0,
              top: 0,
              bottom: 0,
              width: 32,
              zIndex: 2,
              background: isDark
                ? `linear-gradient(${isRtl ? "270deg" : "90deg"}, ${alpha("#0d111c", 0.95)} 0%, transparent 100%)`
                : `linear-gradient(${isRtl ? "270deg" : "90deg"}, ${alpha("#fff", 0.95)} 0%, transparent 100%)`,
            }}
          />
        )}
        {showRightFade && (
          <Box
            aria-hidden
            sx={{
              pointerEvents: "none",
              position: "absolute",
              [isRtl ? "left" : "right"]: 0,
              top: 0,
              bottom: 0,
              width: 32,
              zIndex: 2,
              background: isDark
                ? `linear-gradient(${isRtl ? "90deg" : "270deg"}, ${alpha("#0d111c", 0.95)} 0%, transparent 100%)`
                : `linear-gradient(${isRtl ? "90deg" : "270deg"}, ${alpha("#fff", 0.95)} 0%, transparent 100%)`,
            }}
          />
        )}

        {showLeftFade && (
          <IconButton
            aria-label={t("Scroll left")}
            onClick={() => scrollByStep(-1)}
            size="small"
            sx={{
              display: { xs: "none", md: "flex" },
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 3,
              bgcolor: isDark ? alpha("#000", 0.55) : alpha("#fff", 0.95),
              border: `1px solid ${isDark ? alpha("#fff", 0.12) : alpha("#1e6fd9", 0.15)}`,
              boxShadow: 2,
              "&:hover": { bgcolor: isDark ? alpha("#000", 0.72) : "#fff" },
            }}
          >
            {isRtl ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
        {showRightFade && (
          <IconButton
            aria-label={t("Scroll right")}
            onClick={() => scrollByStep(1)}
            size="small"
            sx={{
              display: { xs: "none", md: "flex" },
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 3,
              bgcolor: isDark ? alpha("#000", 0.55) : alpha("#fff", 0.95),
              border: `1px solid ${isDark ? alpha("#fff", 0.12) : alpha("#1e6fd9", 0.15)}`,
              boxShadow: 2,
              "&:hover": { bgcolor: isDark ? alpha("#000", 0.72) : "#fff" },
            }}
          >
            {isRtl ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        )}

        <Box
          ref={scrollRef}
          onScroll={updateScrollHints}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
          role="listbox"
          aria-label={t("Store Types", { defaultValue: "Store Types" })}
          sx={{
            display: "flex",
            gap: 1,
            overflowX: "auto",
            overflowY: "hidden",
            scrollSnapType: "x mandatory",
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
            px: { xs: 0.25, sm: 0.5 },
            py: 0.5,
            cursor: { md: "grab" },
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {cards.map((card) => (
            <StoreTypeCard
              key={card._id}
              icon={card.icon}
              label={card.label}
              count={card.count}
              badge={card.badge}
              isAll={card.isAll}
              accentColor={card.accentColor}
              selected={String(selectedStoreTypeId) === String(card._id)}
              onSelect={suppressClickIfDragged(() =>
                onStoreTypeSelect(card._id),
              )}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
});

export default StoreTypeCarousel;
