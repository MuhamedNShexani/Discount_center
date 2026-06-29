import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Chip,
  ListItemIcon,
  ListItemText,
  Paper,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import GridViewIcon from "@mui/icons-material/GridView";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import SearchIcon from "@mui/icons-material/Search";
import CategoryIcon from "@mui/icons-material/Category";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import FavoriteIcon from "@mui/icons-material/Favorite";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import BusinessIcon from "@mui/icons-material/Business";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { useTranslation } from "react-i18next";
import { useActiveTheme } from "../context/ActiveThemeContext";
import {
  PROFILE_SHORTCUT_CATALOG,
  normalizeProfileShortcutIds,
} from "../utils/profileShortcutCatalog";

const PROFILE_SHORTCUT_ICONS = {
  home: HomeOutlined,
  search: SearchIcon,
  categories: CategoryIcon,
  reels: VideoLibraryIcon,
  favourites: FavoriteIcon,
  stores: StorefrontIcon,
  gifts: CardGiftcardIcon,
  shopping: ShoppingBagIcon,
  brands: BusinessIcon,
  companies: CorporateFareIcon,
  findjob: WorkOutlineIcon,
};

export default function ProfileShortcuts({
  onItemClick,
  excludeIds = [],
  sx: sxProp,
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { profileShortcuts } = useActiveTheme();
  const isDark = theme.palette.mode === "dark";

  const excludeSet = useMemo(
    () => new Set((excludeIds || []).map((id) => String(id))),
    [excludeIds],
  );

  const items = useMemo(() => {
    const byId = Object.fromEntries(
      PROFILE_SHORTCUT_CATALOG.map((x) => [x.id, x]),
    );
    return normalizeProfileShortcutIds(profileShortcuts)
      .filter((id) => !excludeSet.has(id))
      .map((id) => byId[id])
      .filter(Boolean);
  }, [profileShortcuts, excludeSet]);

  if (items.length === 0) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        border: `1px solid ${theme.palette.divider}`,
        mt: 2,
        ...sxProp,
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
          bgcolor: "action.hover",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <ListItemIcon sx={{ minWidth: 32 }}>
          <GridViewIcon fontSize="small" color="primary" />
        </ListItemIcon>
        <ListItemText
          primary={t("Shortcuts", { defaultValue: "Shortcuts" })}
          primaryTypographyProps={{ variant: "subtitle2", fontWeight: 600 }}
          sx={{ my: 0 }}
        />
      </Box>
      <Box
        sx={{
          display: "flex",
          gap: 1,
          overflowX: "auto",
          px: 2,
          py: 1.5,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {items.map((item) => {
          const IconComp = PROFILE_SHORTCUT_ICONS[item.id];
          return (
            <Chip
              key={item.id}
              component={Link}
              to={item.path}
              onClick={() => onItemClick?.()}
              clickable
              variant="outlined"
              label={t(item.labelKey)}
              icon={IconComp ? <IconComp sx={{ fontSize: 16 }} /> : undefined}
              sx={{
                flexShrink: 0,
                borderRadius: 2,
                fontWeight: 600,
                fontSize: "0.82rem",
                height: 34,
                borderColor: isDark
                  ? alpha("#fff", 0.12)
                  : alpha("#1e6fd9", 0.18),
                "&:hover": {
                  bgcolor: isDark
                    ? alpha("#1e6fd9", 0.14)
                    : alpha("#1e6fd9", 0.07),
                  borderColor: "primary.main",
                },
              }}
            />
          );
        })}
      </Box>
    </Paper>
  );
}
