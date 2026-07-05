import React, { memo } from "react";
import { Box } from "@mui/material";
import StoreTypeCarousel from "./StoreTypeCarousel";

/** Homepage browse section — navigates to store-type pages (not main-feed filter). */
const StoreTypesBrowseSection = memo(function StoreTypesBrowseSection({
  storeTypes,
}) {
  if (!storeTypes?.length) return null;

  return (
    <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
      <StoreTypeCarousel
        browseMode
        storeTypes={storeTypes}
        seeAllTo="/store-types"
      />
    </Box>
  );
});

export default StoreTypesBrowseSection;
