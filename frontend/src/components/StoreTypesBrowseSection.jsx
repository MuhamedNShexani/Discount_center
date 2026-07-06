import React, { memo } from "react";
import { Box } from "@mui/material";
import StoreTypeCarousel from "./StoreTypeCarousel";
import { isStoreTypeShownOnCategoriesList } from "../utils/storeTypeVisibility";

/** Homepage browse section — navigates to store-type pages (not main-feed filter). */
const StoreTypesBrowseSection = memo(function StoreTypesBrowseSection({
  storeTypes,
}) {
  const visibleStoreTypes = (storeTypes || []).filter(
    isStoreTypeShownOnCategoriesList,
  );
  if (!visibleStoreTypes.length) return null;

  return (
    <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
      <StoreTypeCarousel
        browseMode
        storeTypes={visibleStoreTypes}
        seeAllTo="/store-types"
      />
    </Box>
  );
});

export default StoreTypesBrowseSection;
