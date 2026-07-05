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
import { useNavigate } from "react-router-dom";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import { isRtlLanguage } from "../utils/isRtlLanguage";
import { useLocalizedContent } from "../hooks/useLocalizedContent";
import SectionHeader from "./SectionHeader";
import StoreTypeCard, { getStoreTypeAccentColor } from "./StoreTypeCard";

const SCROLL_EDGE_EPSILON = 6;

/** Horizontal overflow edges — handles LTR and `dir=rtl` (incl. Firefox negative scrollLeft). */
function readHorizontalScrollEdges(el) {
  const { scrollLeft, scrollWidth, clientWidth } = el;
  const max = Math.max(0, scrollWidth - clientWidth);
  if (max <= SCROLL_EDGE_EPSILON) {
    return { hasOverflow: false, atStart: true, atEnd: true };
  }

  // Firefox RTL: scrollLeft is 0 at inline-start, negative toward inline-end.
  if (scrollLeft < 0) {
    return {
      hasOverflow: true,
      atStart: scrollLeft >= -SCROLL_EDGE_EPSILON,
      atEnd: scrollLeft <= -(max - SCROLL_EDGE_EPSILON),
    };
  }

  // LTR and Chromium RTL: scrollLeft grows from 0 at inline-start.
  return {
    hasOverflow: true,
    atStart: scrollLeft <= SCROLL_EDGE_EPSILON,
    atEnd: scrollLeft >= max - SCROLL_EDGE_EPSILON,
  };
}

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
  browseMode = false,
  seeAllTo = "/stores",
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = isRtlLanguage(i18n.language);
  const { locName } = useLocalizedContent();

  const scrollRef = useRef(null);
  const dragState = useRef({
    active: false,
    moved: false,
    startX: 0,
    scrollLeft: 0,
  });
  const [showStartFade, setShowStartFade] = useState(false);
  const [showEndFade, setShowEndFade] = useState(false);

  const updateScrollHints = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { hasOverflow, atStart, atEnd } = readHorizontalScrollEdges(el);
    setShowStartFade(hasOverflow && !atStart);
    setShowEndFade(hasOverflow && !atEnd);
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
  }, [updateScrollHints, storeTypes, isRtl]);

  const scrollByStep = useCallback((direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector('[role="button"]')?.offsetWidth || 116;
    const step = (cardWidth + 10) * 3 * direction;
    el.scrollBy({ left: step, behavior: "smooth" });
  }, []);

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
    () =>
      browseMode
        ? storeTypes.map((type) => ({
            _id: type._id,
            label: locName(type) || t(type.name),
            icon: type.icon || "",
            picture: type.picture || "",
            badge: type.badge,
            accentColor: getStoreTypeAccentColor(type._id),
          }))
        : [
            {
              _id: "all",
              label: t("All"),
              icon: "",
              count: totalCount,
              isAll: true,
            },
            ...storeTypes.map((type) => ({
              _id: type._id,
              label: locName(type) || t(type.name),
              icon: type.icon || "",
              picture: type.picture || "",
              count: storeTypeCounts?.[String(type._id)],
              badge: type.badge,
              accentColor: getStoreTypeAccentColor(type._id),
            })),
          ],
    [storeTypes, storeTypeCounts, totalCount, locName, t, browseMode],
  );

  const handleBrowseSelect = useCallback(
    (storeTypeId) => {
      navigate(`/store-types/${encodeURIComponent(String(storeTypeId))}`);
    },
    [navigate],
  );

  return (
    <Box sx={{ mb: 1.5 }}>
      <SectionHeader
        icon={StorefrontRoundedIcon}
        title={t("Store Types", { defaultValue: "Store Types" })}
        seeAllTo={seeAllTo}
        action={t("See All", { defaultValue: "See All" })}
      />

      <Box sx={{ position: "relative" }}>
        {showStartFade && (
          <Box
            aria-hidden
            sx={{
              pointerEvents: "none",
              position: "absolute",
              insetInlineStart: 0,
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
        {showEndFade && (
          <Box
            aria-hidden
            sx={{
              pointerEvents: "none",
              position: "absolute",
              insetInlineEnd: 0,
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

        {showStartFade && (
          <IconButton
            aria-label={t("Scroll left")}
            onClick={() => scrollByStep(-1)}
            size="small"
            sx={{
              display: { xs: "none", md: "flex" },
              position: "absolute",
              insetInlineStart: 0,
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
        {showEndFade && (
          <IconButton
            aria-label={t("Scroll right")}
            onClick={() => scrollByStep(1)}
            size="small"
            sx={{
              display: { xs: "none", md: "flex" },
              position: "absolute",
              insetInlineEnd: 0,
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
          dir={isRtl ? "rtl" : "ltr"}
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
            flexDirection: "row",
            gap: 1.1,
            overflowX: "auto",
            overflowY: "hidden",
            scrollSnapType: "x mandatory",
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
            px: { xs: 0, sm: 0.25 },
            py: 0.75,
            cursor: { md: "grab" },
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {cards.map((card) => (
            <Box key={card._id} dir="ltr" sx={{ flex: "0 0 auto" }}>
              <StoreTypeCard
                icon={card.icon}
                picture={card.picture}
                label={card.label}
                count={card.count}
                badge={card.badge}
                isAll={card.isAll}
                accentColor={card.accentColor}
                selected={
                  !browseMode &&
                  String(selectedStoreTypeId) === String(card._id)
                }
                onSelect={suppressClickIfDragged(() =>
                  browseMode
                    ? handleBrowseSelect(card._id)
                    : onStoreTypeSelect(card._id),
                )}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
});

export default StoreTypeCarousel;
