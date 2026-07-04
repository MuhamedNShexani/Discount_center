import React, { memo, useEffect, useRef, useState } from "react";
import { Avatar, Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VerifiedIcon from "@mui/icons-material/Verified";
import { useNavigate } from "react-router-dom";
import { useLocalizedContent } from "../../hooks/useLocalizedContent";
import {
  formatReelViews,
  getReelAvatarSrc,
  getReelCaption,
  getReelOwner,
  getReelVideoSrc,
} from "./reelUtils";

const ReelCard = memo(function ReelCard({ reel, onActivate, onDeactivate }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const { locName, locTitle, locDescription } = useLocalizedContent();
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);

  const owner = getReelOwner(reel);
  const ownerName = owner ? locName(owner) : "";
  const avatarSrc = getReelAvatarSrc(owner);
  const caption = getReelCaption(reel, locTitle, locDescription);
  const videoSrc = getReelVideoSrc(reel);
  const views = formatReelViews(reel?.views);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || !videoSrc) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
          onActivate?.(reel._id);
          const video = videoRef.current;
          if (video) {
            video.play().catch(() => {});
          }
        } else {
          onDeactivate?.(reel._id);
          const video = videoRef.current;
          if (video) {
            video.pause();
            video.currentTime = 0;
          }
        }
      },
      { threshold: [0, 0.55, 0.85], rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [onActivate, onDeactivate, reel._id, videoSrc]);

  useEffect(() => {
    return () => {
      videoRef.current?.pause();
    };
  }, []);

  const handleOpen = () => {
    videoRef.current?.pause();
    navigate(`/reels/${encodeURIComponent(String(reel._id))}`);
  };

  return (
    <Box
      ref={rootRef}
      component="article"
      role="button"
      tabIndex={0}
      aria-label={caption || ownerName || "Reel"}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpen();
        }
      }}
      sx={{
        flex: "0 0 auto",
        width: { xs: 160, sm: 170, md: 180 },
        scrollSnapAlign: "start",
        borderRadius: "20px",
        overflow: "hidden",
        position: "relative",
        aspectRatio: "9 / 16",
        cursor: "pointer",
        bgcolor: isDark ? "#0a0a0a" : "#111",
        boxShadow: isDark
          ? "0 8px 28px rgba(0,0,0,0.45)"
          : "0 8px 24px rgba(30,111,217,0.12)",
        border: `1px solid ${isDark ? alpha("#fff", 0.08) : alpha("#1e6fd9", 0.1)}`,
        transition: "transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease",
        "&:hover": {
          transform: "scale(1.04)",
          boxShadow: isDark
            ? "0 14px 36px rgba(0,0,0,0.55)"
            : "0 14px 32px rgba(30,111,217,0.18)",
        },
        "&:active": {
          transform: "scale(0.97)",
        },
      }}
    >
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={() => setVideoReady(true)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            backgroundColor: "#101010",
            opacity: videoReady ? 1 : 0,
            transition: "opacity 280ms ease",
          }}
        />
      ) : (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: isDark
              ? "linear-gradient(160deg, #1e293b 0%, #0f172a 100%)"
              : "linear-gradient(160deg, #dbeafe 0%, #eff6ff 100%)",
          }}
        />
      )}

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.82) 100%)",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <PlayCircleOutlineIcon
          sx={{
            fontSize: 48,
            color: alpha("#fff", 0.92),
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.45))",
            opacity: 0.92,
          }}
        />
      </Box>

      <Box
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          p: 1.25,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          pointerEvents: "none",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
          <Avatar
            src={avatarSrc || undefined}
            sx={{
              width: 28,
              height: 28,
              fontSize: "0.75rem",
              fontWeight: 700,
              border: `1.5px solid ${alpha("#fff", 0.35)}`,
              bgcolor: alpha("#1e6fd9", 0.85),
            }}
          >
            {(ownerName || "R").charAt(0).toUpperCase()}
          </Avatar>
          <Typography
            variant="caption"
            noWrap
            sx={{
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.78rem",
              flex: "0 1 auto",
              minWidth: 0,
              textShadow: "0 1px 4px rgba(0,0,0,0.5)",
            }}
          >
            {ownerName || "—"}
          </Typography>
          {owner?.isVip && (
            <VerifiedIcon
              sx={{ fontSize: 14, color: "#4A90E2", flexShrink: 0 }}
            />
          )}
        </Box>

        {caption ? (
          <Typography
            variant="caption"
            sx={{
              color: alpha("#fff", 0.92),
              fontSize: "0.72rem",
              lineHeight: 1.35,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textShadow: "0 1px 3px rgba(0,0,0,0.45)",
            }}
          >
            {caption}
          </Typography>
        ) : null}

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.35 }}>
          <VisibilityOutlinedIcon sx={{ fontSize: 13, color: alpha("#fff", 0.75) }} />
          <Typography
            variant="caption"
            sx={{
              color: alpha("#fff", 0.8),
              fontSize: "0.68rem",
              fontWeight: 600,
            }}
          >
            {views}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
});

export default ReelCard;
