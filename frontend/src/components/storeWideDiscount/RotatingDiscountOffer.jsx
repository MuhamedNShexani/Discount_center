import React, { memo, useEffect, useMemo, useState } from "react";
import { Box, Chip, Typography } from "@mui/material";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  formatExpiryChipLabel,
  getExpiryRemainingInfo,
} from "../../utils/expiryDate";
import {
  getShowcaseDiscountChipColors,
  resolveShowcaseOffers,
} from "../../utils/showcaseDiscountOffers";
import {
  getSpecialDiscountLabel,
  isSpecialDiscountRowActive,
} from "../../utils/appSpecialDiscount";

export const SHOWCASE_OFFER_ROTATE_MS = 5000;

const MOTION_EASE = [0.22, 1, 0.36, 1];

const OfferSlide = memo(function OfferSlide({
  offer,
  colorIndex,
  locName,
  t,
  isDark,
  chipSize,
}) {
  if (!isSpecialDiscountRowActive(offer, () => true)) return null;

  const chipColors = getShowcaseDiscountChipColors(colorIndex, isDark);
  const chipLabel = getSpecialDiscountLabel(offer, t);
  const appName =
    offer.source === "app" ? locName(offer) || offer.name || "" : "";
  const expiryLabel = offer.expireDate
    ? formatExpiryChipLabel(getExpiryRemainingInfo(offer.expireDate), t)
    : "";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <motion.div
          initial={{ scale: 0.92 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.38, ease: MOTION_EASE, delay: 0.04 }}
        >
          <Chip
            size={chipSize}
            label={chipLabel}
            sx={{
              height: "auto",
              minHeight: chipSize === "small" ? 24 : 26,
              maxWidth: "none",
              fontWeight: 700,
              bgcolor: chipColors.bgcolor,
              color: chipColors.color,
              border: `1px solid ${chipColors.borderColor}`,
              boxShadow: `0 2px 10px ${chipColors.borderColor}`,
              "& .MuiChip-label": {
                whiteSpace: "nowrap",
                px: 1,
                py: 0.35,
                lineHeight: 1.25,
              },
            }}
          />
        </motion.div>
      </Box>
      {offer.source === "app" && appName ? (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.5,
            color: "text.secondary",
            textAlign: "center",
            width: "100%",
          }}
        >
          {t("via {{appName}}", {
            appName,
            defaultValue: `via ${appName}`,
          })}
        </Typography>
      ) : offer.source === "public" ? (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.5,
            color: "text.secondary",
            textAlign: "center",
            width: "100%",
          }}
        >
          {t("Public store-wide discount", {
            defaultValue: "Public store-wide discount",
          })}
        </Typography>
      ) : null}
      {expiryLabel ? (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.35,
            color: "text.secondary",
            textAlign: "center",
            width: "100%",
          }}
        >
          {expiryLabel}
        </Typography>
      ) : null}
    </Box>
  );
});

const RotatingDiscountOffer = memo(function RotatingDiscountOffer({
  entry,
  locName,
  t,
  isDark = false,
  chipSize = "small",
}) {
  const offers = useMemo(() => resolveShowcaseOffers(entry), [entry]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const storeId = entry?.store?._id;
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setActiveIndex(0);
    setDirection(1);
  }, [storeId, offers.length]);

  useEffect(() => {
    if (offers.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % offers.length);
    }, SHOWCASE_OFFER_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [offers.length, storeId]);

  const active = offers[activeIndex] || offers[0];
  if (!active || !isSpecialDiscountRowActive(active, () => true)) return null;

  const slideVariants = prefersReducedMotion
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: (dir) => ({
          opacity: 0,
          x: dir > 0 ? -36 : 36,
          scale: 0.96,
          filter: "blur(5px)",
        }),
        center: {
          opacity: 1,
          x: 0,
          scale: 1,
          filter: "blur(0px)",
        },
        exit: (dir) => ({
          opacity: 0,
          x: dir > 0 ? 36 : -36,
          scale: 0.98,
          filter: "blur(3px)",
        }),
      };

  const transition = prefersReducedMotion
    ? { duration: 0.12 }
    : { duration: 0.48, ease: MOTION_EASE };

  return (
    <Box
      sx={{
        mt: 0.25,
        position: "relative",
        minHeight: chipSize === "small" ? 56 : 60,
        overflow: "hidden",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={`${storeId}-${activeIndex}-${active.source}-${active._id || "public"}-${active.discountPercent}`}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transition}
          style={{ width: "100%", display: "flex", justifyContent: "center" }}
        >
          <OfferSlide
            offer={active}
            colorIndex={activeIndex}
            locName={locName}
            t={t}
            isDark={isDark}
            chipSize={chipSize}
          />
        </motion.div>
      </AnimatePresence>
    </Box>
  );
});

export default RotatingDiscountOffer;
