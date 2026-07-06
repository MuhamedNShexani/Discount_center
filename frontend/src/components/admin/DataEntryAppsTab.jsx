import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useTranslation } from "react-i18next";
import { appAPI } from "../../services/api";
import {
  normalizeExpiryInputForApi,
  toDatetimeLocalValue,
} from "../../utils/expiryDate";
import {
  APP_DISCOUNT_TYPE_OPTIONS,
  APP_DISCOUNT_TYPES,
  discountRowSummary,
  isPercentAppDiscountType,
  normalizeAppDiscountType,
  normalizeDiscountRowsForApi,
} from "../../utils/appSpecialDiscount";
import DataEntryEntityAutocomplete from "../DataEntryEntityAutocomplete";
import MultilingualFieldGroup from "../MultilingualFieldGroup";

const emptyDiscountRow = () => ({
  storeId: "",
  discountType: APP_DISCOUNT_TYPES.PERCENT_ALL,
  percentageDiscount: "",
  fixedAmountIqd: "",
  expireDate: "",
});

const defaultAppForm = () => ({
  name: "",
  nameEn: "",
  nameAr: "",
  nameKu: "",
  logo: "",
  specialDiscounts: [emptyDiscountRow()],
});

export default function DataEntryAppsTab({ stores = [], toolbarSx }) {
  const { t } = useTranslation();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [appForm, setAppForm] = useState(defaultAppForm);
  const [logoFile, setLogoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchApps = useCallback(async () => {
    try {
      const res = await appAPI.getAll();
      setApps(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching apps:", err);
      setApps([]);
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const paginatedApps = useMemo(() => {
    const start = page * rowsPerPage;
    return apps.slice(start, start + rowsPerPage);
  }, [apps, page, rowsPerPage]);

  const uploadLogo = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await appAPI.uploadLogo(formData);
    return res.data?.imageUrl || res.data?.url || "";
  };

  const openCreate = () => {
    setEditingId("");
    setAppForm(defaultAppForm());
    setLogoFile(null);
    setDialogOpen(true);
  };

  const openEdit = (app) => {
    setEditingId(app._id);
    setAppForm({
      name: app.name || "",
      nameEn: app.nameEn || "",
      nameAr: app.nameAr || "",
      nameKu: app.nameKu || "",
      logo: app.logo || "",
      specialDiscounts: (app.specialDiscounts || []).length
        ? app.specialDiscounts.map((row) => ({
            storeId: row.storeId?._id || row.storeId || "",
            discountType: normalizeAppDiscountType(row.discountType),
            percentageDiscount: row.percentageDiscount ?? "",
            fixedAmountIqd: row.fixedAmountIqd ?? "",
            expireDate: row.expireDate
              ? toDatetimeLocalValue(row.expireDate)
              : "",
          }))
        : [emptyDiscountRow()],
    });
    setLogoFile(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!appForm.name?.trim()) {
      setMessage({ type: "error", text: t("App name is required") });
      return;
    }
    const discounts = normalizeDiscountRowsForApi(appForm.specialDiscounts).map(
      (row) => ({
        ...row,
        expireDate: row.expireDate
          ? normalizeExpiryInputForApi(row.expireDate)
          : null,
      }),
    );
    if (discounts.length === 0) {
      setMessage({
        type: "error",
        text: t(
          "Add at least one store discount with a valid value for its type.",
        ),
      });
      return;
    }
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      let logo = appForm.logo || "";
      if (logoFile) {
        setUploading(true);
        logo = await uploadLogo(logoFile);
        setUploading(false);
      }
      const payload = {
        name: appForm.name.trim(),
        nameEn: appForm.nameEn?.trim() || "",
        nameAr: appForm.nameAr?.trim() || "",
        nameKu: appForm.nameKu?.trim() || "",
        logo,
        specialDiscounts: discounts,
      };
      if (editingId) {
        await appAPI.update(editingId, payload);
        setMessage({ type: "success", text: t("App updated successfully!") });
      } else {
        await appAPI.create(payload);
        setMessage({ type: "success", text: t("App created successfully!") });
      }
      setDialogOpen(false);
      setAppForm(defaultAppForm());
      setLogoFile(null);
      fetchApps();
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: t("Failed to save app. Please try again."),
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleDelete = async (app) => {
    if (!window.confirm(t("Delete this app?"))) return;
    try {
      await appAPI.delete(app._id);
      setMessage({ type: "success", text: t("App deleted successfully!") });
      fetchApps();
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: t("Failed to delete app. Please try again."),
      });
    }
  };

  const updateDiscountRow = (index, patch) => {
    setAppForm((prev) => {
      const rows = [...(prev.specialDiscounts || [])];
      rows[index] = { ...rows[index], ...patch };
      return { ...prev, specialDiscounts: rows };
    });
  };

  return (
    <Box>
      {message.text ? (
        <Typography
          sx={{ mb: 1 }}
          color={message.type === "error" ? "error.main" : "success.main"}
        >
          {message.text}
        </Typography>
      ) : null}
      <Toolbar sx={toolbarSx}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          {t("New App")}
        </Button>
        <Button variant="outlined" onClick={fetchApps}>
          {t("Refresh")}
        </Button>
      </Toolbar>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t("Logo")}</TableCell>
              <TableCell>{t("Name")}</TableCell>
              <TableCell>{t("Store discounts")}</TableCell>
              <TableCell align="right">{t("Actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedApps.map((app) => (
              <TableRow key={app._id}>
                <TableCell>
                  {app.logo ? (
                    <Box
                      component="img"
                      src={app.logo}
                      alt=""
                      sx={{ width: 36, height: 36, borderRadius: 1, objectFit: "cover" }}
                    />
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{app.name}</TableCell>
                <TableCell>{(app.specialDiscounts || []).length}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(app)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(app)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={apps.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editingId ? t("Edit App") : t("New App")}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              required
              label={t("App name")}
              value={appForm.name}
              onChange={(e) =>
                setAppForm((prev) => ({ ...prev, name: e.target.value }))
              }
              sx={{ mb: 2 }}
            />
            <MultilingualFieldGroup
              value={{
                english: appForm.nameEn,
                arabic: appForm.nameAr,
                kurdish: appForm.nameKu,
              }}
              onValueChange={(v) =>
                setAppForm((prev) => ({
                  ...prev,
                  nameEn: v.english,
                  nameAr: v.arabic,
                  nameKu: v.kurdish,
                }))
              }
              sourceText={appForm.name}
              aiType="general"
            />
            <Button variant="outlined" component="label" sx={{ mt: 2, mb: 2 }}>
              {t("Upload logo")}
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              />
            </Button>
            {appForm.logo && !logoFile ? (
              <Box
                component="img"
                src={appForm.logo}
                alt=""
                sx={{ display: "block", width: 64, height: 64, mb: 2, borderRadius: 1 }}
              />
            ) : null}
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
              {t("Special store discounts")}
            </Typography>
            {(appForm.specialDiscounts || []).map((row, index) => {
              const discountType = normalizeAppDiscountType(row.discountType);
              const isPercent = isPercentAppDiscountType(discountType);
              return (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    mb: 1.5,
                    alignItems: "flex-end",
                    p: 1.25,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box sx={{ flex: "1 1 220px", minWidth: 200 }}>
                    <DataEntryEntityAutocomplete
                      label={t("Store")}
                      options={stores}
                      valueId={row.storeId || ""}
                      onChangeId={(id) =>
                        updateDiscountRow(index, { storeId: id || "" })
                      }
                    />
                  </Box>
                  <FormControl sx={{ minWidth: 220 }} size="small">
                    <InputLabel>{t("Discount type")}</InputLabel>
                    <Select
                      label={t("Discount type")}
                      value={discountType}
                      onChange={(e) => {
                        const nextType = normalizeAppDiscountType(
                          e.target.value,
                        );
                        updateDiscountRow(index, {
                          discountType: nextType,
                          ...(nextType === APP_DISCOUNT_TYPES.FIXED_IQD
                            ? { percentageDiscount: "" }
                            : { fixedAmountIqd: "" }),
                        });
                      }}
                    >
                      {APP_DISCOUNT_TYPE_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {t(opt.labelKey)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {isPercent ? (
                    <TextField
                      type="number"
                      size="small"
                      label={t("Discount %")}
                      value={row.percentageDiscount}
                      onChange={(e) =>
                        updateDiscountRow(index, {
                          percentageDiscount: e.target.value,
                        })
                      }
                      inputProps={{ min: 0, max: 100 }}
                      sx={{ width: 120 }}
                    />
                  ) : (
                    <TextField
                      type="number"
                      size="small"
                      label={t("Amount (IQD)")}
                      value={row.fixedAmountIqd}
                      onChange={(e) =>
                        updateDiscountRow(index, {
                          fixedAmountIqd: e.target.value,
                        })
                      }
                      inputProps={{ min: 0 }}
                      sx={{ width: 140 }}
                    />
                  )}
                  <TextField
                    type="datetime-local"
                    size="small"
                    label={t("Expires (optional)")}
                    value={row.expireDate || ""}
                    onChange={(e) =>
                      updateDiscountRow(index, { expireDate: e.target.value })
                    }
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 220 }}
                  />
                  <IconButton
                    color="error"
                    onClick={() =>
                      setAppForm((prev) => ({
                        ...prev,
                        specialDiscounts: (prev.specialDiscounts || []).filter(
                          (_, i) => i !== index,
                        ),
                      }))
                    }
                    disabled={(appForm.specialDiscounts || []).length <= 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                  <Typography
                    variant="caption"
                    sx={{ width: "100%", color: "text.secondary" }}
                  >
                    {t("Preview")}: {discountRowSummary(row, t)}
                  </Typography>
                </Box>
              );
            })}
            <Button
              startIcon={<AddIcon />}
              onClick={() =>
                setAppForm((prev) => ({
                  ...prev,
                  specialDiscounts: [
                    ...(prev.specialDiscounts || []),
                    emptyDiscountRow(),
                  ],
                }))
              }
            >
              {t("Add store discount")}
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>{t("Cancel")}</Button>
            <Button type="submit" variant="contained" disabled={loading || uploading}>
              {loading || uploading ? t("Saving...") : t("Save")}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
