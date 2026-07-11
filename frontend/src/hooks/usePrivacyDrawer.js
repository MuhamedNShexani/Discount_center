import { useContext } from "react";
import { PrivacyDrawerContext } from "../context/PrivacyDrawerContext";

export function usePrivacyDrawer() {
  const ctx = useContext(PrivacyDrawerContext);
  if (!ctx) {
    throw new Error(
      "usePrivacyDrawer must be used within PrivacyDrawerProvider",
    );
  }
  return ctx;
}
