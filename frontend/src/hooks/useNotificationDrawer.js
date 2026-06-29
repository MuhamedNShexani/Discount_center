import { useContext } from "react";
import { NotificationDrawerContext } from "../context/NotificationDrawerContext";

export function useNotificationDrawer() {
  const ctx = useContext(NotificationDrawerContext);
  if (!ctx) {
    throw new Error(
      "useNotificationDrawer must be used within NotificationDrawerProvider",
    );
  }
  return ctx;
}
