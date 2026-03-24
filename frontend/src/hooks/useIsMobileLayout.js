import { useMediaQuery, useTheme } from "@mui/material";

const useIsMobileLayout = () => {
  const theme = useTheme();
  const isNarrowScreen = useMediaQuery(theme.breakpoints.down("md"));
  const hasCoarsePrimaryPointer = useMediaQuery("(pointer: coarse)");
  const hasHoverCapability = useMediaQuery("(hover: hover)");

  // Keep mobile layout on touch devices even in landscape orientation.
  return isNarrowScreen || (hasCoarsePrimaryPointer && !hasHoverCapability);
};

export default useIsMobileLayout;
