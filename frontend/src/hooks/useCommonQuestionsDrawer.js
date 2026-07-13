import { useContext } from "react";
import { CommonQuestionsDrawerContext } from "../context/CommonQuestionsDrawerContext";

export function useCommonQuestionsDrawer() {
  const ctx = useContext(CommonQuestionsDrawerContext);
  if (!ctx) {
    throw new Error(
      "useCommonQuestionsDrawer must be used within CommonQuestionsDrawerProvider",
    );
  }
  return ctx;
}
