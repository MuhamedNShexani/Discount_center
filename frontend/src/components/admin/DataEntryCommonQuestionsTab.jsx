import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Switch,
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
import { faqAPI } from "../../services/api";
import MultilingualFieldGroup from "../MultilingualFieldGroup";

const defaultFaqForm = () => ({
  question: "",
  questionEn: "",
  questionAr: "",
  questionKu: "",
  answer: "",
  answerEn: "",
  answerAr: "",
  answerKu: "",
  sortOrder: 0,
  active: true,
});

export default function DataEntryCommonQuestionsTab({ toolbarSx }) {
  const { t } = useTranslation();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [faqForm, setFaqForm] = useState(defaultFaqForm);

  const fetchFaqs = useCallback(async () => {
    try {
      const res = await faqAPI.getAllAdmin();
      const rows = res.data?.data || [];
      setFaqs(rows);
      return rows;
    } catch (err) {
      console.error("Error fetching FAQs:", err);
      setFaqs([]);
      return [];
    }
  }, []);

  const importDefaults = useCallback(async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await faqAPI.seedDefaults();
      setFaqs(res.data?.data || []);
      setMessage({
        type: "success",
        text: t("faq.admin.imported", {
          defaultValue: "Default common questions imported.",
        }),
      });
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: t("faq.admin.importFailed", {
          defaultValue: "Failed to import default questions.",
        }),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    (async () => {
      const rows = await fetchFaqs();
      if (rows.length === 0) {
        await importDefaults();
      }
    })();
  }, [fetchFaqs, importDefaults]);

  const paginatedFaqs = useMemo(() => {
    const start = page * rowsPerPage;
    return faqs.slice(start, start + rowsPerPage);
  }, [faqs, page, rowsPerPage]);

  const openCreate = () => {
    setEditingId("");
    setFaqForm(defaultFaqForm());
    setDialogOpen(true);
  };

  const openEdit = (faq) => {
    setEditingId(faq._id);
    setFaqForm({
      question: faq.question || "",
      questionEn: faq.questionEn || "",
      questionAr: faq.questionAr || "",
      questionKu: faq.questionKu || "",
      answer: faq.answer || "",
      answerEn: faq.answerEn || "",
      answerAr: faq.answerAr || "",
      answerKu: faq.answerKu || "",
      sortOrder: Number(faq.sortOrder) || 0,
      active: faq.active !== false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      setMessage({
        type: "error",
        text: t("faq.admin.requiredFields", {
          defaultValue: "Question and answer are required.",
        }),
      });
      return;
    }
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const payload = {
        question: faqForm.question.trim(),
        questionEn: faqForm.questionEn?.trim() || "",
        questionAr: faqForm.questionAr?.trim() || "",
        questionKu: faqForm.questionKu?.trim() || "",
        answer: faqForm.answer.trim(),
        answerEn: faqForm.answerEn?.trim() || "",
        answerAr: faqForm.answerAr?.trim() || "",
        answerKu: faqForm.answerKu?.trim() || "",
        sortOrder: Number(faqForm.sortOrder) || 0,
        active: faqForm.active !== false,
      };
      if (editingId) {
        await faqAPI.update(editingId, payload);
        setMessage({
          type: "success",
          text: t("faq.admin.updated", {
            defaultValue: "Common question updated.",
          }),
        });
      } else {
        await faqAPI.create(payload);
        setMessage({
          type: "success",
          text: t("faq.admin.created", {
            defaultValue: "Common question created.",
          }),
        });
      }
      setDialogOpen(false);
      setFaqForm(defaultFaqForm());
      fetchFaqs();
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text:
          err?.response?.data?.message ||
          t("faq.admin.saveFailed", {
            defaultValue: "Failed to save common question.",
          }),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (faq) => {
    if (
      !window.confirm(
        t("faq.admin.deleteConfirm", {
          defaultValue: "Delete this common question?",
        }),
      )
    ) {
      return;
    }
    try {
      await faqAPI.delete(faq._id);
      setMessage({
        type: "success",
        text: t("faq.admin.deleted", {
          defaultValue: "Common question deleted.",
        }),
      });
      fetchFaqs();
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: t("faq.admin.deleteFailed", {
          defaultValue: "Failed to delete common question.",
        }),
      });
    }
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
          {t("faq.admin.new", { defaultValue: "New question" })}
        </Button>
        <Button variant="outlined" onClick={importDefaults} disabled={loading}>
          {t("faq.admin.importDefaults", {
            defaultValue: "Import default questions",
          })}
        </Button>
        <Button variant="outlined" onClick={fetchFaqs}>
          {t("Refresh")}
        </Button>
      </Toolbar>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t("Order", { defaultValue: "Order" })}</TableCell>
              <TableCell>
                {t("Question", { defaultValue: "Question" })}
              </TableCell>
              <TableCell>{t("Status")}</TableCell>
              <TableCell align="right">{t("Actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedFaqs.map((faq) => (
              <TableRow key={faq._id}>
                <TableCell>{faq.sortOrder ?? 0}</TableCell>
                <TableCell sx={{ maxWidth: 420 }}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {faq.question}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={
                      faq.active !== false ? t("Active") : t("Inactive")
                    }
                    color={faq.active !== false ? "success" : "default"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => openEdit(faq)}
                    sx={{ color: "primary.main" }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(faq)}
                    sx={{ color: "error.main" }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {paginatedFaqs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    {t("faq.admin.empty", {
                      defaultValue: "No common questions yet.",
                    })}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={faqs.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />

      <Dialog
        open={dialogOpen}
        onClose={() => !loading && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingId
            ? t("faq.admin.editTitle", {
                defaultValue: "Edit common question",
              })
            : t("faq.admin.createTitle", {
                defaultValue: "New common question",
              })}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label={t("Question", { defaultValue: "Question" })}
            value={faqForm.question}
            onChange={(e) =>
              setFaqForm((prev) => ({ ...prev, question: e.target.value }))
            }
            sx={{ mt: 1, mb: 1 }}
            required
          />
          <MultilingualFieldGroup
            sectionLabel={t("Question translations", {
              defaultValue: "Question translations",
            })}
            value={{
              english: faqForm.questionEn,
              arabic: faqForm.questionAr,
              kurdish: faqForm.questionKu,
            }}
            onValueChange={(v) =>
              setFaqForm((prev) => ({
                ...prev,
                questionEn: v.english,
                questionAr: v.arabic,
                questionKu: v.kurdish,
              }))
            }
            sourceText={faqForm.question}
            aiType="general"
          />
          <TextField
            fullWidth
            multiline
            minRows={4}
            label={t("Answer", { defaultValue: "Answer" })}
            value={faqForm.answer}
            onChange={(e) =>
              setFaqForm((prev) => ({ ...prev, answer: e.target.value }))
            }
            sx={{ mt: 2, mb: 1 }}
            required
          />
          <MultilingualFieldGroup
            sectionLabel={t("Answer translations", {
              defaultValue: "Answer translations",
            })}
            value={{
              english: faqForm.answerEn,
              arabic: faqForm.answerAr,
              kurdish: faqForm.answerKu,
            }}
            onValueChange={(v) =>
              setFaqForm((prev) => ({
                ...prev,
                answerEn: v.english,
                answerAr: v.arabic,
                answerKu: v.kurdish,
              }))
            }
            sourceText={faqForm.answer}
            aiType="general"
            multiline
            minRows={3}
          />
          <TextField
            fullWidth
            type="number"
            label={t("Order", { defaultValue: "Order" })}
            value={faqForm.sortOrder}
            onChange={(e) =>
              setFaqForm((prev) => ({
                ...prev,
                sortOrder: e.target.value,
              }))
            }
            sx={{ mt: 2 }}
            helperText={t("faq.admin.orderHint", {
              defaultValue: "Lower numbers appear first.",
            })}
          />
          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Switch
                checked={faqForm.active !== false}
                onChange={(e) =>
                  setFaqForm((prev) => ({
                    ...prev,
                    active: e.target.checked,
                  }))
                }
              />
            }
            label={t("Active")}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={loading}>
            {t("Cancel")}
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            {loading ? t("Saving...", { defaultValue: "Saving..." }) : t("Save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
