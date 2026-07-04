import React from "react";
import { Box, Skeleton, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

function ProfileListRowSkeleton({ isDark }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        py: 1.25,
        px: 2,
      }}
    >
      <Skeleton
        variant="rounded"
        width={32}
        height={32}
        sx={{
          flexShrink: 0,
          borderRadius: 1.5,
          bgcolor: isDark ? alpha("#fff", 0.08) : alpha("#1e6fd9", 0.08),
        }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Skeleton
          variant="text"
          width="58%"
          height={20}
          sx={{ bgcolor: isDark ? alpha("#fff", 0.1) : alpha("#0d111c", 0.08) }}
        />
        <Skeleton
          variant="text"
          width="38%"
          height={16}
          sx={{ bgcolor: isDark ? alpha("#fff", 0.06) : alpha("#0d111c", 0.05) }}
        />
      </Box>
    </Box>
  );
}

function ProfileCardSkeleton({ isDark, rows = 3, children }) {
  const cardSx = {
    borderRadius: "16px",
    overflow: "hidden",
    border: `1px solid ${isDark ? alpha("#fff", 0.07) : alpha("#1e6fd9", 0.09)}`,
    background: isDark ? alpha("#fff", 0.03) : "#fff",
    boxShadow: isDark
      ? `inset 0 1px 0 ${alpha("#fff", 0.05)}, 0 4px 20px rgba(0,0,0,0.22)`
      : `0 1px 0 ${alpha("#1e6fd9", 0.06)}, 0 4px 16px ${alpha("#1e6fd9", 0.05)}`,
  };

  return (
    <Box sx={cardSx}>
      {children}
      {Array.from({ length: rows }).map((_, i) => (
        <React.Fragment key={i}>
          {i > 0 ? (
            <Box
              sx={{
                mx: 2,
                height: "1px",
                bgcolor: isDark ? alpha("#fff", 0.06) : alpha("#1e6fd9", 0.08),
              }}
            />
          ) : null}
          <ProfileListRowSkeleton isDark={isDark} />
        </React.Fragment>
      ))}
    </Box>
  );
}

export default function ProfilePageSkeleton() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        height: "100dvh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        background: isDark
          ? "linear-gradient(180deg, #0c1525 0%, #0f1927 60%, #0b1220 100%)"
          : "linear-gradient(180deg, #eef3ff 0%, #f6f9ff 25%, #fff 55%)",
      }}
    >
      <Box
        sx={{
          position: "relative",
          pb: 3,
          px: 2.5,
          background: isDark
            ? `linear-gradient(150deg, ${alpha("#1e6fd9", 0.22)} 0%, ${alpha("#6366f1", 0.1)} 50%, transparent 100%)`
            : `linear-gradient(150deg, ${alpha("#1e6fd9", 0.12)} 0%, ${alpha("#6366f1", 0.05)} 50%, transparent 100%)`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pt: 1.5,
            pb: 2,
          }}
        >
          <Skeleton
            variant="text"
            width={72}
            height={18}
            sx={{ bgcolor: isDark ? alpha("#fff", 0.1) : alpha("#0d111c", 0.08) }}
          />
          <Skeleton
            variant="rounded"
            width={30}
            height={30}
            sx={{
              borderRadius: "50%",
              bgcolor: isDark ? alpha("#fff", 0.08) : alpha("#000", 0.06),
            }}
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Skeleton
            variant="circular"
            width={68}
            height={68}
            sx={{
              flexShrink: 0,
              bgcolor: isDark ? alpha("#fff", 0.12) : alpha("#1e6fd9", 0.15),
            }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton
              variant="text"
              width="72%"
              height={28}
              sx={{ bgcolor: isDark ? alpha("#fff", 0.12) : alpha("#0d111c", 0.1) }}
            />
            <Skeleton
              variant="text"
              width="48%"
              height={18}
              sx={{ bgcolor: isDark ? alpha("#fff", 0.07) : alpha("#0d111c", 0.06) }}
            />
            <Skeleton
              variant="rounded"
              width={88}
              height={22}
              sx={{
                mt: 0.75,
                borderRadius: 999,
                bgcolor: isDark ? alpha("#1e6fd9", 0.2) : alpha("#1e6fd9", 0.12),
              }}
            />
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          py: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
          px: 2,
        }}
      >
        <ProfileCardSkeleton isDark={isDark} rows={2} />
        <ProfileCardSkeleton isDark={isDark} rows={4}>
          <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
            <Skeleton
              variant="text"
              width="36%"
              height={20}
              sx={{ bgcolor: isDark ? alpha("#fff", 0.1) : alpha("#0d111c", 0.08) }}
            />
          </Box>
        </ProfileCardSkeleton>
        <ProfileCardSkeleton isDark={isDark} rows={3} />
      </Box>
    </Box>
  );
}
