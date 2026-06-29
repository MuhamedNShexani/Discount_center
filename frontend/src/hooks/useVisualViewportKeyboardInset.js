import { useEffect, useState } from "react";

/**
 * Height of the on-screen keyboard (layout viewport minus visual viewport).
 * Use with `translateY(inset)` on fixed bottom UI so it stays at the physical
 * screen bottom instead of jumping above the keyboard.
 */
export function useVisualViewportKeyboardInset(enabled = true) {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;

    const vv = window.visualViewport;
    if (!vv) return undefined;

    const update = () => {
      const keyboardInset = Math.max(
        0,
        window.innerHeight - vv.height - vv.offsetTop,
      );
      setInset(keyboardInset);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [enabled]);

  return inset;
}
