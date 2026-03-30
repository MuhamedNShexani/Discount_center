import { useMemo } from "react";
import { useDataLanguage } from "../context/DataLanguageContext";
import { getLocalizedField } from "../utils/localize";

/**
 * Helpers for store/product/brand/category strings (nameEn/nameAr/nameKu vs primary).
 */
export function useLocalizedContent() {
  const { dataLanguage } = useDataLanguage();
  return useMemo(
    () => ({
      dataLanguage,
      locName: (o) => (o ? getLocalizedField(o, "name", dataLanguage) : ""),
      locDescription: (o) =>
        o ? getLocalizedField(o, "description", dataLanguage) : "",
      locTitle: (o) => (o ? getLocalizedField(o, "title", dataLanguage) : ""),
      locAddress: (o) => (o ? getLocalizedField(o, "address", dataLanguage) : ""),
    }),
    [dataLanguage],
  );
}
