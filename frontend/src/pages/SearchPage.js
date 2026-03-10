import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Paper,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  IconButton,
  Button,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import StorefrontIcon from "@mui/icons-material/Storefront";
import BusinessIcon from "@mui/icons-material/Business";
import CategoryIcon from "@mui/icons-material/Category";
import HistoryIcon from "@mui/icons-material/History";
import ClearIcon from "@mui/icons-material/Clear";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import { searchAPI } from "../services/api";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { getLocalizedName } from "../utils/localize";
import { getDeviceId } from "../utils/deviceId";
import {
  getSearchHistory,
  addToSearchHistory,
  removeFromSearchHistory,
  clearSearchHistory,
} from "../utils/searchHistory";

const SearchPage = () => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "en";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get("q") || "";

  const [query, setQuery] = useState(qParam);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    products: [],
    stores: [],
    brands: [],
  });
  const [searched, setSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  const userId = user?.id || user?._id || null;
  const deviceId = userId ? null : getDeviceId();

  const refreshRecentSearches = useCallback(() => {
    setRecentSearches(getSearchHistory(userId, deviceId));
  }, [userId, deviceId]);

  useEffect(() => {
    refreshRecentSearches();
  }, [refreshRecentSearches]);

  const performSearch = useCallback(
    async (q) => {
      const trimmed = (q || "").trim();
      if (trimmed.length < 2) {
        setResults({ products: [], stores: [], brands: [] });
        setSearched(trimmed.length > 0);
        return;
      }
      setLoading(true);
      setSearched(true);
      try {
        const res = await searchAPI.search(trimmed);
        const data = res?.data?.data || res?.data || {};
        setResults({
          products: data.products || [],
          stores: data.stores || [],
          brands: data.brands || [],
        });
        addToSearchHistory(trimmed, userId, deviceId);
        refreshRecentSearches();
      } catch (err) {
        console.error("Search error:", err);
        setResults({ products: [], stores: [], brands: [] });
      } finally {
        setLoading(false);
      }
    },
    [userId, deviceId, refreshRecentSearches],
  );

  useEffect(() => {
    if (qParam) {
      setQuery(qParam);
    } else {
      setResults({ products: [], stores: [], brands: [] });
      setSearched(false);
    }
  }, [qParam]);

  const handleSearchClick = () => {
    const trimmed = (query || "").trim();
    if (trimmed.length < 2) return;
    setSearchParams({ q: trimmed }, { replace: true });
    performSearch(trimmed);
  };

  const handleRecentClick = (term) => {
    setQuery(term);
    setSearchParams({ q: term }, { replace: true });
    performSearch(term);
  };

  const handleRemoveRecent = (e, term) => {
    e.stopPropagation();
    removeFromSearchHistory(term, userId, deviceId);
    refreshRecentSearches();
  };

  const handleClearRecent = () => {
    clearSearchHistory(userId, deviceId);
    refreshRecentSearches();
  };

  const handleProductClick = (id) => {
    navigate(`/products/${id}`);
  };
  const handleStoreClick = (id) => {
    navigate(`/stores/${id}`);
  };
  const handleBrandClick = (id) => {
    navigate(`/brands/${id}`);
  };

  const backendUrl = process.env.REACT_APP_BACKEND_URL || "";
  const hasResults =
    results.products.length > 0 ||
    results.stores.length > 0 ||
    results.brands.length > 0;

  return (
    <Box sx={{ pt: 5 }}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "stretch" }}>
          <TextField
            fullWidth
            autoFocus
            placeholder={t("Search products, stores, brands")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearchClick();
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearchClick}
            disabled={loading || (query || "").trim().length < 2}
            startIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SearchIcon />
              )
            }
            sx={{
              minWidth: 60,
              borderRadius: 2,
              px: 2,
            }}
          >
            {t("Search")}
          </Button>
        </Box>
      </Paper>

      {(query || "").trim().length < 2 && recentSearches.length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center", py: 4 }}
        >
          {t("No recent searches")}
        </Typography>
      )}

      {(query || "").trim().length < 2 && recentSearches.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "action.hover",
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <HistoryIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight={600}>
                {t("Recent searches")}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={handleClearRecent}
              sx={{ color: "text.secondary" }}
              title={t("Clear all")}
              aria-label={t("Clear all")}
            >
              <DeleteSweepIcon fontSize="small" />
            </IconButton>
          </Box>
          <List disablePadding>
            {recentSearches.map((term) => (
              <ListItemButton
                key={term}
                onClick={() => handleRecentClick(term)}
                sx={{
                  py: 1.25,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                </ListItemAvatar>
                <ListItemText
                  primary={term}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
                <IconButton
                  size="small"
                  onClick={(e) => handleRemoveRecent(e, term)}
                  sx={{
                    color: "text.secondary",
                    "&:hover": { color: "error.main" },
                  }}
                  aria-label={t("Remove from history")}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}

      {searched &&
        !loading &&
        !hasResults &&
        (query || "").trim().length >= 2 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", py: 4 }}
          >
            {t("No results found")}
          </Typography>
        )}

      {searched && hasResults && (query || "").trim().length >= 2 && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {results.products.length > 0 && (
            <>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CategoryIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={600}>
                  {t("Products")}
                </Typography>
              </Box>
              <List disablePadding>
                {results.products.map((p, i) => (
                  <ListItemButton
                    key={p._id}
                    onClick={() => handleProductClick(p._id)}
                    sx={{
                      py: 1.5,
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        src={p.image ? `${backendUrl}${p.image}` : undefined}
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: "grey.200",
                        }}
                      >
                        {!p.image && (
                          <CategoryIcon sx={{ color: "grey.600" }} />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={getLocalizedName(p, "name", lang) || p.name}
                      secondary={
                        [
                          getLocalizedName(p.brandId, "name", lang) ||
                            p.brandId?.name,
                          getLocalizedName(p.storeId, "name", lang) ||
                            p.storeId?.name,
                        ]
                          .filter(Boolean)
                          .join(" • ") || undefined
                      }
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItemButton>
                ))}
              </List>
              <Divider />
            </>
          )}

          {results.stores.length > 0 && (
            <>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <StorefrontIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={600}>
                  {t("Stores")}
                </Typography>
              </Box>
              <List disablePadding>
                {results.stores.map((s) => (
                  <ListItemButton
                    key={s._id}
                    onClick={() => handleStoreClick(s._id)}
                    sx={{
                      py: 1.5,
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        src={s.logo ? `${backendUrl}${s.logo}` : undefined}
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: "grey.200",
                        }}
                      >
                        {!s.logo && (
                          <StorefrontIcon sx={{ color: "grey.600" }} />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={getLocalizedName(s, "name", lang) || s.name}
                      secondary={
                        s.storeTypeId?.name ? t(s.storeTypeId.name) : undefined
                      }
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItemButton>
                ))}
              </List>
              <Divider />
            </>
          )}

          {results.brands.length > 0 && (
            <>
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <BusinessIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={600}>
                  {t("Brands")}
                </Typography>
              </Box>
              <List disablePadding>
                {results.brands.map((b) => (
                  <ListItemButton
                    key={b._id}
                    onClick={() => handleBrandClick(b._id)}
                    sx={{
                      py: 1.5,
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        src={b.logo ? `${backendUrl}${b.logo}` : undefined}
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: "grey.200",
                        }}
                      >
                        {!b.logo && <BusinessIcon sx={{ color: "grey.600" }} />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={getLocalizedName(b, "name", lang) || b.name}
                      secondary={
                        b.brandTypeId?.name ? t(b.brandTypeId.name) : undefined
                      }
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default SearchPage;
