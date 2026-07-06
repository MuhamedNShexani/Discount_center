import { useContext } from "react";
import { StoreWideDiscountDrawerContext } from "../context/StoreWideDiscountDrawerContext";

export function useStoreWideDiscountDrawer() {
  const ctx = useContext(StoreWideDiscountDrawerContext);
  if (!ctx) {
    throw new Error(
      "useStoreWideDiscountDrawer must be used within StoreWideDiscountDrawerProvider",
    );
  }
  return ctx;
}
