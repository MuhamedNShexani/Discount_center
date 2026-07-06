import React, { memo } from "react";
import { Box, Typography, Chip } from "@mui/material";
import PercentIcon from "@mui/icons-material/Percent";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import { useLocalizedContent } from "../../hooks/useLocalizedContent";
import {
  formatExpiryChipLabel,
  getExpiryRemainingInfo,
  isExpiryStillValid,
} from "../../utils/expiryDate";
import {
  getSpecialDiscountLabel,
  isSpecialDiscountRowActive,
} from "../../utils/appSpecialDiscount";

const bannerSx = (isDark) => ({
  display: "flex",
  alignItems: "center",
  gap: 1.25,
  px: { xs: 1.5, sm: 2 },
  py: 1.25,
  borderRadius: "16px",
  mb: 1.25,
  background: isDark
    ? "linear-gradient(135deg, rgba(249,115,22,0.22) 0%, rgba(239,68,68,0.16) 100%)"
    : "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
  border: `1px solid ${isDark ? alpha("#f97316", 0.35) : alpha("#f97316", 0.25)}`,
});

const StoreDiscountBanners = memo(function StoreDiscountBanners({
  store,
  appDiscounts = [],
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { t } = useTranslation();
  const { locName } = useLocalizedContent();

  const publicActive =
    store?.hasAllProductsDiscount &&
    Number(store?.allProductsDiscountPercent) > 0 &&
    isExpiryStillValid(store?.allProductsDiscountExpireDate);

  const activeAppDiscounts = (appDiscounts || []).filter((row) =>
    isSpecialDiscountRowActive(row, isExpiryStillValid),
  );

  if (!publicActive && activeAppDiscounts.length === 0) return null;

  return (
    <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
      {publicActive && (
        <Box sx={bannerSx(isDark)}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha("#f97316", isDark ? 0.28 : 0.15),
              flexShrink: 0,
            }}
          >
            <PercentIcon sx={{ color: "#f97316" }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>
              {t("{{percent}}% off all products", {
                percent: store.allProductsDiscountPercent,
                defaultValue: `${store.allProductsDiscountPercent}% off all products`,
              })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("Public store-wide discount", {
                defaultValue: "Public store-wide discount",
              })}
            </Typography>
            {store.allProductsDiscountExpireDate ? (
              <Typography variant="caption" display="block" color="text.secondary">
                {formatExpiryChipLabel(
                  getExpiryRemainingInfo(store.allProductsDiscountExpireDate),
                  t,
                )}
              </Typography>
            ) : null}
          </Box>
          <Chip
            size="small"
            label={t("Public", { defaultValue: "Public" })}
            sx={{ fontWeight: 700 }}
          />
        </Box>
      )}

      {activeAppDiscounts.map((row) => {
        const app = row.app || {};
        const appName = locName(app) || app.name || t("App");
        const logo = resolveMediaUrl(app.logo);
        return (
          <Box key={String(app._id || appName)} sx={bannerSx(isDark)}>
            {logo ? (
              <Box
                component="img"
                src={logo}
                alt={appName}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha("#1E6FD9", isDark ? 0.28 : 0.12),
                  flexShrink: 0,
                }}
              >
                <PercentIcon sx={{ color: "#1E6FD9" }} />
              </Box>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>
                {getSpecialDiscountLabel(row, t)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("via {{appName}}", {
                  appName,
                  defaultValue: `via ${appName}`,
                })}
              </Typography>
              {row.expireDate ? (
                <Typography variant="caption" display="block" color="text.secondary">
                  {formatExpiryChipLabel(
                    getExpiryRemainingInfo(row.expireDate),
                    t,
                  )}
                </Typography>
              ) : null}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
});

export default StoreDiscountBanners;
