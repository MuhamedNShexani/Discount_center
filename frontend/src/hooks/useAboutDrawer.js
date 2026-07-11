import { useContext } from "react";
import { AboutDrawerContext } from "../context/AboutDrawerContext";

export function useAboutDrawer() {
  const ctx = useContext(AboutDrawerContext);
  if (!ctx) {
    throw new Error("useAboutDrawer must be used within AboutDrawerProvider");
  }
  return ctx;
}
