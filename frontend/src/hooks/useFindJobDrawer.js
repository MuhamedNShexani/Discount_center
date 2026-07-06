import { useContext } from "react";
import { FindJobDrawerContext } from "../context/FindJobDrawerContext";

export function useFindJobDrawer() {
  const ctx = useContext(FindJobDrawerContext);
  if (!ctx) {
    throw new Error("useFindJobDrawer must be used within FindJobDrawerProvider");
  }
  return ctx;
}
