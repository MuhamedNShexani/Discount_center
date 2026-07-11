import React from "react";
import { Box, Skeleton, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { DrawerSafeAreaTop } from "../utils/drawerSafeArea";

const PROFILE_HERO_SAFE_BG = {
  dark: "#0c1525",
  light: "#eef3ff",
};

function useSkeletonTokens(isDark) {
  return {
    base: isDark ? alpha("#fff", 0.08) : alpha("#0d111c", 0.07),
    highlight: isDark ? alpha("#fff", 0.12) : alpha("#0d111c", 0.1),
    soft: isDark ? alpha("#fff", 0.05) : alpha("#1e6fd9", 0.06),
    cardBorder: isDark ? alpha("#fff", 0.07) : alpha("#1e6fd9", 0.09),
    cardBg: isDark ? alpha("#fff", 0.03) : "#fff",
    divider: isDark ? alpha("#fff", 0.06) : alpha("#1e6fd9", 0.08),
  };
}

const cardShellSx = (isDark, tokens) => ({
  borderRadius: 0,
  overflow: "hidden",
  border: `1px solid ${tokens.cardBorder}`,
  background: tokens.cardBg,
  boxShadow: isDark
    ? `inset 0 1px 0 ${alpha("#fff", 0.05)}, 0 4px 20px rgba(0,0,0,0.22)`
    : `0 1px 0 ${alpha("#1e6fd9", 0.06)}, 0 4px 16px ${alpha("#1e6fd9", 0.05)}`,
});

function ProfileListRowSkeleton({ tokens }) {
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
        animation="wave"
        width={32}
        height={32}
        sx={{ flexShrink: 0, borderRadius: 1.5, bgcolor: tokens.soft }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Skeleton
          variant="rounded"
          animation="wave"
          height={18}
          sx={{ mb: 0.5, borderRadius: 1, bgcolor: tokens.base, width: "58%" }}
        />
        <Skeleton
          variant="rounded"
          animation="wave"
          height={14}
          sx={{ borderRadius: 1, bgcolor: tokens.soft, width: "38%" }}
        />
      </Box>
    </Box>
  );
}

function ProfileHubTileSkeleton({ tokens }) {
  return (
    <Box
      sx={{
        minHeight: 86,
        p: 1.25,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 1,
        border: `1px solid ${tokens.cardBorder}`,
        borderRadius: 0,
        background: tokens.soft,
      }}
    >
      <Skeleton
        variant="rounded"
        animation="wave"
        width={34}
        height={34}
        sx={{ borderRadius: 0, bgcolor: tokens.highlight }}
      />
      <Skeleton
        variant="rounded"
        animation="wave"
        height={14}
        sx={{ borderRadius: 1, bgcolor: tokens.base, width: "78%" }}
      />
    </Box>
  );
}

export function ProfileOwnerSectionSkeleton({ rows = 2 }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const tokens = useSkeletonTokens(isDark);

  return (
    <Box sx={{ ...cardShellSx(isDark, tokens) }}>
      {Array.from({ length: rows }).map((_, i) => (
        <React.Fragment key={i}>
          {i > 0 ? (
            <Box sx={{ mx: 2, height: "1px", bgcolor: tokens.divider }} />
          ) : null}
          <ProfileListRowSkeleton tokens={tokens} />
        </React.Fragment>
      ))}
    </Box>
  );
}

export default function ProfilePageSkeleton() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const tokens = useSkeletonTokens(isDark);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        height: "100%",
        minHeight: 0,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        background: isDark
          ? "linear-gradient(180deg, #0c1525 0%, #0f1927 60%, #0b1220 100%)"
          : "linear-gradient(180deg, #eef3ff 0%, #f6f9ff 25%, #fff 55%)",
      }}
    >
      <DrawerSafeAreaTop
        bgcolor={isDark ? PROFILE_HERO_SAFE_BG.dark : PROFILE_HERO_SAFE_BG.light}
      />
      <Box
        sx={{
          position: "relative",
          pb: 3,
          px: 2.5,
          background: isDark
            ? `linear-gradient(150deg, ${alpha("#1e6fd9", 0.22)} 0%, ${alpha("#6366f1", 0.1)} 50%, transparent 100%)`
            : `linear-gradient(150deg, ${alpha("#1e6fd9", 0.12)} 0%, ${alpha("#6366f1", 0.05)} 50%, transparent 100%)`,
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 20,
            right: 20,
            height: "1px",
            background: isDark
              ? `linear-gradient(90deg, transparent, ${alpha("#1e6fd9", 0.45)}, transparent)`
              : `linear-gradient(90deg, transparent, ${alpha("#1e6fd9", 0.2)}, transparent)`,
          },
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
            variant="rounded"
            animation="wave"
            width={72}
            height={14}
            sx={{ borderRadius: 1, bgcolor: tokens.base }}
          />
          <Skeleton
            variant="rounded"
            animation="wave"
            width={30}
            height={30}
            sx={{ borderRadius: 0, bgcolor: tokens.soft }}
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Skeleton
            variant="circular"
            animation="wave"
            width={68}
            height={68}
            sx={{ flexShrink: 0, bgcolor: tokens.highlight }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Skeleton
                variant="rounded"
                animation="wave"
                height={26}
                sx={{
                  flex: 1,
                  borderRadius: 1,
                  bgcolor: tokens.base,
                  maxWidth: "72%",
                }}
              />
              <Skeleton
                variant="rounded"
                animation="wave"
                width={28}
                height={28}
                sx={{ flexShrink: 0, borderRadius: 0, bgcolor: tokens.soft }}
              />
            </Box>
            <Skeleton
              variant="rounded"
              animation="wave"
              height={16}
              sx={{
                mt: 0.5,
                borderRadius: 1,
                bgcolor: tokens.soft,
                width: "48%",
              }}
            />
            <Skeleton
              variant="rounded"
              animation="wave"
              width={88}
              height={22}
              sx={{
                mt: 0.75,
                borderRadius: 0,
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
        <ProfileOwnerSectionSkeleton rows={2} />

        <Box sx={{ ...cardShellSx(isDark, tokens), p: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
            <Skeleton
              variant="rounded"
              animation="wave"
              width={22}
              height={22}
              sx={{ borderRadius: 0, bgcolor: tokens.soft }}
            />
            <Skeleton
              variant="rounded"
              animation="wave"
              height={16}
              sx={{ borderRadius: 1, bgcolor: tokens.base, width: 120 }}
            />
          </Box>

          <StackGroupSkeleton tokens={tokens} />
          <Box sx={{ mt: 1.75 }}>
            <StackGroupSkeleton tokens={tokens} />
          </Box>
        </Box>

        <Box sx={cardShellSx(isDark, tokens)}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: 1,
              px: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Skeleton
                variant="rounded"
                animation="wave"
                width={22}
                height={22}
                sx={{ borderRadius: 0, bgcolor: tokens.soft }}
              />
              <Skeleton
                variant="rounded"
                animation="wave"
                height={16}
                sx={{ borderRadius: 1, bgcolor: tokens.base, width: 88 }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  animation="wave"
                  width={34}
                  height={34}
                  sx={{ borderRadius: 0, bgcolor: tokens.soft }}
                />
              ))}
            </Box>
          </Box>
        </Box>

        <Box sx={cardShellSx(isDark, tokens)}>
          <ProfileListRowSkeleton tokens={tokens} />
          <Box sx={{ mx: 2, height: "1px", bgcolor: tokens.divider }} />
          <ProfileListRowSkeleton tokens={tokens} />
        </Box>
      </Box>
    </Box>
  );
}

function StackGroupSkeleton({ tokens }) {
  return (
    <Box>
      <Skeleton
        variant="rounded"
        animation="wave"
        height={12}
        sx={{ mb: 0.75, borderRadius: 1, bgcolor: tokens.soft, width: 72 }}
      />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 1,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <ProfileHubTileSkeleton key={i} tokens={tokens} />
        ))}
      </Box>
    </Box>
  );
}
