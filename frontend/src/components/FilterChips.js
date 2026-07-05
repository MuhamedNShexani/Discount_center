import React, { useState } from "react";
import {
  Box,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import CategoryIcon from "@mui/icons-material/Category";
import ClearIcon from "@mui/icons-material/Clear";
import TuneIcon from "@mui/icons-material/Tune";
import ViewStreamIcon from "@mui/icons-material/ViewStream";
import GridViewIcon from "@mui/icons-material/GridView";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useLocalizedContent } from "../hooks/useLocalizedContent";

const DEFAULT_MAX_PRICE = 1000000;

const getCategoryStoreTypeId = (category) => {
  const st = category?.storeTypeId;
  if (!st) return "";
  if (typeof st === "object" && st._id != null) return String(st._id);
  return String(st);
};

const FilterChips = ({
  search,
  onSearchChange,
  storeTypes,
  selectedStoreTypeId,
  onStoreTypeSelect,
  allCategories = [],
  selectedCategory,
  onCategorySelect,
  sortByNewest,
  sortByNearMe,
  onToggleNewest,
  onToggleNearMe,
  geoLoading,
  productLayout = "row",
  onLayoutChange,
  priceRange,
  onPriceRangeChange,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { locName } = useLocalizedContent();
  const isDark = theme.palette.mode === "dark";
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftMin, setDraftMin] = useState("");
  const [draftMax, setDraftMax] = useState("");
  const [draftStoreTypeId, setDraftStoreTypeId] = useState("all");
  const [draftCategory, setDraftCategory] = useState(null);

  const draftCategories = React.useMemo(() => {
    if (draftStoreTypeId === "all") return allCategories;
    return allCategories.filter(
      (cat) => getCategoryStoreTypeId(cat) === String(draftStoreTypeId),
    );
  }, [allCategories, draftStoreTypeId]);

  const hasCustomFilters =
    selectedStoreTypeId !== "all" ||
    Boolean(selectedCategory) ||
    (Array.isArray(priceRange) &&
      (Number(priceRange[0]) > 0 || Number(priceRange[1]) < DEFAULT_MAX_PRICE));

  const openFilterDialog = () => {
    setDraftMin(priceRange?.[0] ? String(priceRange[0]) : "");
    setDraftMax(
      priceRange?.[1] && priceRange[1] !== DEFAULT_MAX_PRICE
        ? String(priceRange[1])
        : "",
    );
    setDraftStoreTypeId(selectedStoreTypeId || "all");
    setDraftCategory(selectedCategory || null);
    setFilterOpen(true);
  };

  const applyFilterDialog = () => {
    const min = Math.max(0, Number(draftMin) || 0);
    const max = draftMax
      ? Math.max(min, Number(draftMax) || DEFAULT_MAX_PRICE)
      : DEFAULT_MAX_PRICE;
    onPriceRangeChange?.([min, max]);
    onStoreTypeSelect?.(draftStoreTypeId || "all");
    onCategorySelect?.(draftCategory);
    setFilterOpen(false);
  };

  const resetFilterDialog = () => {
    setDraftMin("");
    setDraftMax("");
    setDraftStoreTypeId("all");
    setDraftCategory(null);
    onPriceRangeChange?.([0, DEFAULT_MAX_PRICE]);
    onStoreTypeSelect?.("all");
    onCategorySelect?.(null);
    setFilterOpen(false);
  };

  const handleDraftStoreType = (storeTypeId) => {
    setDraftStoreTypeId(storeTypeId);
    setDraftCategory(null);
  };

  const activePillSx = {
    background:
      "linear-gradient(135deg, var(--brand-primary-blue, #1E6FD9) 0%, #4A90E2 100%)",
    color: "white",
    fontWeight: 700,
    border: "none",
    boxShadow: "0 2px 8px rgba(30,111,217,0.35)",
    "&:hover": {
      background: "linear-gradient(135deg, #1660c2 0%, #3a7fd2 100%)",
    },
    "&.MuiChip-root": { height: 34 },
  };

  const inactivePillSx = {
    background: isDark ? "rgba(255,255,255,0.07)" : "#f3f4f6",
    color: isDark ? "rgba(255,255,255,0.85)" : "#374151",
    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb",
    fontWeight: 500,
    "&:hover": {
      background: isDark ? "rgba(255,255,255,0.12)" : "#e9ecf0",
      border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid #d1d5db",
    },
    "&.MuiChip-root": { height: 34 },
  };

  const sortActiveSx = {
    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    color: "white",
    fontWeight: 700,
    border: "none",
    boxShadow: "0 2px 8px rgba(245,158,11,0.35)",
    "&.MuiChip-root": { height: 32 },
  };

  const sortInactiveSx = {
    ...inactivePillSx,
    "&.MuiChip-root": { height: 32 },
  };

  const layoutBtnSx = (active) => ({
    width: 34,
    height: 34,
    borderRadius: "10px",
    border: `1.5px solid ${
      active
        ? "var(--brand-primary-blue, #1E6FD9)"
        : isDark
          ? "rgba(255,255,255,0.12)"
          : "#e5e7eb"
    }`,
    backgroundColor: active
      ? isDark
        ? "rgba(30,111,217,0.2)"
        : "rgba(30,111,217,0.1)"
      : isDark
        ? "rgba(255,255,255,0.05)"
        : "#f3f4f6",
    color: active
      ? "var(--brand-primary-blue, #1E6FD9)"
      : isDark
        ? "rgba(255,255,255,0.55)"
        : "#6b7280",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: "var(--brand-primary-blue, #1E6FD9)",
      color: "var(--brand-primary-blue, #1E6FD9)",
      backgroundColor: isDark
        ? "rgba(30,111,217,0.15)"
        : "rgba(30,111,217,0.07)",
    },
  });

  return (
    <Box sx={{ mb: 2 }}>
      {/* Search bar */}
      <TextField
        variant="outlined"
        placeholder={t("Search for products or stores...")}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
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
                  onClick={() => onSearchChange("")}
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
                    ? "var(--brand-primary-blue, #1E6FD9)"
                    : isDark
                      ? "rgba(255,255,255,0.6)"
                      : "text.secondary",
                }}
              >
                <Badge
                  variant="dot"
                  color="primary"
                  invisible={!hasCustomFilters}
                >
                  <TuneIcon sx={{ fontSize: 19 }} />
                </Badge>
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          mb: 1.25,
          "& .MuiOutlinedInput-root": {
            borderRadius: "14px",
            background: isDark ? "rgba(255,255,255,0.06)" : "#f9fafb",
            "& fieldset": {
              borderColor: isDark ? "rgba(255,255,255,0.12)" : "#e5e7eb",
            },
            "&:hover fieldset": {
              borderColor: "var(--brand-primary-blue, #1E6FD9)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "var(--brand-primary-blue, #1E6FD9)",
              borderWidth: 1.5,
            },
          },
          "& .MuiInputBase-input": {
            fontSize: "0.9rem",
            py: "9px",
          },
        }}
      />

      {/* Sort row: Newest + Near Me on the left, layout toggle on the right */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          mt: 1,
          pb: 0.25,
        }}
      >
        {/* Sort chips */}
        <Chip
          icon={<AccessTimeIcon sx={{ fontSize: "0.9rem !important" }} />}
          label={t("Newest")}
          onClick={onToggleNewest}
          sx={sortByNewest ? sortActiveSx : sortInactiveSx}
        />
        <Chip
          icon={<MyLocationIcon sx={{ fontSize: "0.9rem !important" }} />}
          label={geoLoading ? t("...") : t("Near Me")}
          onClick={onToggleNearMe}
          disabled={geoLoading}
          sx={sortByNearMe ? sortActiveSx : sortInactiveSx}
        />

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Layout toggle */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            p: 0.4,
            borderRadius: "12px",
            backgroundColor: isDark
              ? "rgba(255,255,255,0.04)"
              : "rgba(0,0,0,0.03)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`,
          }}
        >
          <Tooltip title={t("Single row")} placement="top">
            <IconButton
              size="small"
              onClick={() => onLayoutChange?.("row")}
              sx={layoutBtnSx(productLayout === "row")}
            >
              <ViewStreamIcon sx={{ fontSize: "1.1rem" }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("Two rows")} placement="top">
            <IconButton
              size="small"
              onClick={() => onLayoutChange?.("grid2")}
              sx={layoutBtnSx(productLayout === "grid2")}
            >
              <GridViewIcon sx={{ fontSize: "1.1rem" }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Dialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: "18px" } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {t("Filters", { defaultValue: "Filters" })}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth size="small" sx={{ mb: 2, mt: 1 }}>
            <InputLabel id="filter-store-type-label">
              {t("Store Type", { defaultValue: "Store Type" })}
            </InputLabel>
            <Select
              labelId="filter-store-type-label"
              label={t("Store Type", { defaultValue: "Store Type" })}
              value={draftStoreTypeId}
              onChange={(e) => handleDraftStoreType(e.target.value)}
            >
              <MenuItem value="all">{t("All")}</MenuItem>
              {(storeTypes || []).map((type) => (
                <MenuItem key={String(type._id)} value={String(type._id)}>
                  {type.icon ? `${type.icon} ` : ""}
                  {locName(type) || t(type.name)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {draftStoreTypeId !== "all" && (
            <>
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
                <CategoryIcon sx={{ fontSize: 18 }} />
                {t("Category")}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2 }}>
                <Chip
                  label={t("all")}
                  onClick={() => setDraftCategory(null)}
                  sx={draftCategory === null ? activePillSx : inactivePillSx}
                />
                {draftCategories.map((cat) => (
                  <Chip
                    key={String(cat._id)}
                    label={locName(cat) || t(cat.name)}
                    onClick={() => setDraftCategory(cat)}
                    sx={
                      draftCategory?._id === cat._id
                        ? activePillSx
                        : inactivePillSx
                    }
                  />
                ))}
              </Box>
            </>
          )}

          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, mb: 1, mt: 0.5 }}
          >
            {t("Price Range", { defaultValue: "Price Range" })}
          </Typography>
          <Box sx={{ display: "flex", gap: 1.25, mb: 2 }}>
            <TextField
              type="number"
              size="small"
              fullWidth
              label={t("Min Price")}
              value={draftMin}
              onChange={(e) => setDraftMin(e.target.value)}
            />
            <TextField
              type="number"
              size="small"
              fullWidth
              label={t("Max Price")}
              value={draftMax}
              onChange={(e) => setDraftMax(e.target.value)}
            />
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
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {t("Apply", { defaultValue: "Apply" })}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FilterChips;
