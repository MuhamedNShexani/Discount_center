import { useContext } from "react";
import { GiftsDrawerContext } from "../context/GiftsDrawerContext";

export function useGiftsDrawer() {
  const ctx = useContext(GiftsDrawerContext);
  if (!ctx) {
    throw new Error("useGiftsDrawer must be used within GiftsDrawerProvider");
  }
  return ctx;
}
