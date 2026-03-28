import React from "react";
import { Box, Card, CardContent, CardMedia, Chip, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import BusinessIcon from "@mui/icons-material/Business";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { useTranslation } from "react-i18next";
import { normalizeImage } from "../utils/mediaUrl";

const genderLabel = (t, g) => {
  const v = String(g || "any").toLowerCase();
  if (v === "male") return t("Male");
  if (v === "female") return t("Female");
  return t("Any");
};

export default function JobCardRow({ job, onClick }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const ownerName = job?.storeId?.name || job?.brandId?.name || "";
  const ownerIsBrand = Boolean(job?.brandId?._id || job?.brandId);
  const imageSrc = normalizeImage(job?.image);

  return (
    <Card
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "stretch",
        borderRadius: 3,
        overflow: "hidden",
        cursor: "pointer",
        border: `1px solid ${theme.palette.divider}`,
        "&:hover": { boxShadow: 6 },
      }}
    >
      <CardMedia
        component="img"
        image={imageSrc || "/logo192.png"}
        alt={job?.title || "job"}
        sx={{
          width: 110,
          height: 92,
          objectFit: "cover",
          backgroundColor: theme.palette.mode === "dark" ? "#111" : "#f3f4f6",
          flexShrink: 0,
        }}
      />
      <CardContent sx={{ py: 1.2, px: 1.5, flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 900 }} noWrap>
          {job?.title || t("Job")}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
          <Chip size="small" label={genderLabel(t, job?.gender)} />
          <Chip
            size="small"
            icon={ownerIsBrand ? <BusinessIcon /> : <StorefrontIcon />}
            label={ownerName || t("Owner")}
            sx={{ maxWidth: "100%" }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

