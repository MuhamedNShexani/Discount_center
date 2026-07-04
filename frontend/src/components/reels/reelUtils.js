import { isExpiryStillValid } from "../../utils/expiryDate";
import { toCanonicalCity } from "../../utils/cityMatch";
import { resolveMediaUrl } from "../../utils/mediaUrl";

export function formatReelViews(value) {
  const n = Number(value) || 0;
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}M`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  }
  return n.toLocaleString();
}

export function filterHomeReels(reels, selectedCity) {
  const selectedCanonical = toCanonicalCity(selectedCity);

  return (Array.isArray(reels) ? reels : []).filter((reel) => {
    if (!reel?._id) return false;
    if (reel.expireDate && !isExpiryStillValid(reel.expireDate)) return false;

    if (!selectedCanonical) return true;

    const hasBrand = Boolean(reel?.brandId?._id || reel?.brandId);
    if (hasBrand) return true;

    const storeCity =
      reel?.storeId?.storecity || reel?.storeId?.city || "";
    const ownerCanonical = toCanonicalCity(storeCity);
    return ownerCanonical && ownerCanonical === selectedCanonical;
  });
}

export function getReelOwner(reel) {
  if (reel?.brandId?._id || reel?.brandId) {
    return { ...reel.brandId, type: "brand" };
  }
  if (reel?.storeId?._id || reel?.storeId) {
    return { ...reel.storeId, type: "store" };
  }
  return null;
}

export function getReelCaption(reel, locTitle, locDescription) {
  return (
    locTitle(reel) ||
    locDescription(reel) ||
    reel?.title ||
    ""
  );
}

export function getReelVideoSrc(reel) {
  return resolveMediaUrl(reel?.videoUrl || "");
}

export function getReelAvatarSrc(owner) {
  return owner?.logo ? resolveMediaUrl(owner.logo) : "";
}

/** Dev fallback when API is empty — not used in production path unless needed. */
export const MOCK_HOME_REELS = [
  {
    _id: "mock-reel-1",
    videoUrl: "",
    title: "Summer deals",
    like: 128,
    views: 2400,
    storeId: {
      _id: "mock-store",
      name: "Sample Store",
      logo: "",
    },
  },
];
