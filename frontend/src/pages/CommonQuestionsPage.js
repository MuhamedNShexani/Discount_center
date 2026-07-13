import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";
import { faqAPI } from "../services/api";
import { getLocalizedName } from "../utils/localize";
import { FAQ_QUESTION_KEYS } from "../utils/faqCatalog";

const CommonQuestionsPage = ({ embedded = false, onClose } = {}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await faqAPI.getAll();
      setFaqs(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  const staticFallbackItems = useMemo(
    () =>
      FAQ_QUESTION_KEYS.map((key) => ({
        _id: key,
        question: t(key),
        answer: t(`${key}.a`),
      })),
    [t, i18n.language],
  );

  const displayItems = faqs.length > 0 ? faqs : staticFallbackItems;

  const locQuestion = (item) =>
    getLocalizedName(item, "question", i18n.language) || item.question || "";
  const locAnswer = (item) =>
    getLocalizedName(item, "answer", i18n.language) || item.answer || "";

  const pageShell = embedded
    ? {
        width: { xs: "100vw", sm: 420 },
        maxWidth: "100%",
        height: "100%",
        minHeight: 0,
        overflow: "auto",
        bgcolor: "background.default",
        boxSizing: "border-box",
        px: 2,
        pt: 2.5,
        pb: 3,
      }
    : {
        bgcolor: "background.default",
        minHeight: "60vh",
        py: { xs: 3, md: 5 },
        px: { xs: 2, md: 3 },
      };

  return (
    <Box sx={pageShell}>
      {embedded ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              bgcolor: isDark ? alpha("#1e6fd9", 0.22) : alpha("#1e6fd9", 0.12),
              color: "primary.main",
            }}
          >
            <QuestionAnswerIcon sx={{ fontSize: "1.1rem" }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              {t("Common Questions", { defaultValue: "Common Questions" })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
              {t("faq.page.subtitle", {
                defaultValue: "Quick answers to the most asked questions.",
              })}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            aria-label={t("Close")}
            sx={{
              bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6",
              "&:hover": {
                bgcolor: isDark ? "rgba(255,255,255,0.1)" : "#e9ecf0",
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      ) : (
        <Box sx={{ maxWidth: 760, mx: "auto", mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.75 }}>
            {t("Common Questions", { defaultValue: "Common Questions" })}
          </Typography>
          <Typography color="text.secondary">
            {t("faq.page.subtitle", {
              defaultValue: "Quick answers to the most asked questions.",
            })}
          </Typography>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <Stack
          spacing={1}
          sx={{ maxWidth: embedded ? "100%" : 760, mx: embedded ? 0 : "auto" }}
        >
          {displayItems.map((faq) => (
            <Accordion
              key={faq._id}
              disableGutters
              sx={{
                bgcolor: isDark ? "rgba(17,24,39,0.9)" : "background.paper",
                border: "1px solid",
                borderColor: isDark ? "rgba(148,163,184,0.2)" : "divider",
                borderRadius: "12px !important",
                overflow: "hidden",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ px: 1.5, minHeight: 52 }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: "0.92rem" }}>
                  {locQuestion(faq)}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 1.5, pt: 0, pb: 1.5 }}>
                <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {locAnswer(faq)}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
          {displayItems.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
              {t("faq.admin.empty", {
                defaultValue: "No common questions yet.",
              })}
            </Typography>
          ) : null}
        </Stack>
      )}
    </Box>
  );
};

export default CommonQuestionsPage;
