import { useContext } from "react";
import { ProfileDrawerContext } from "../context/ProfileDrawerContext";

export function useProfileDrawer() {
  const ctx = useContext(ProfileDrawerContext);
  if (!ctx) {
    throw new Error(
      "useProfileDrawer must be used within ProfileDrawerProvider",
    );
  }
  return ctx;
}
