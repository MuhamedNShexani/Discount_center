import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tracks the currently visible reel and ensures only one video plays.
 * Exposes ref registrars so pages/components stay composable.
 */
const useIntersectionVideo = ({
  rootRef,
  itemCount,
  threshold = [0.5, 0.7, 0.9],
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRefs = useRef([]);
  const videoRefs = useRef([]);

  const registerSectionRef = useCallback((index, element) => {
    sectionRefs.current[index] = element;
  }, []);

  const registerVideoRef = useCallback((index, element) => {
    videoRefs.current[index] = element;
  }, []);

  useEffect(() => {
    if (itemCount === 0) {
      setActiveIndex(0);
      return;
    }
    if (activeIndex >= itemCount) {
      setActiveIndex(0);
    }
  }, [activeIndex, itemCount]);

  useEffect(() => {
    if (!rootRef.current || itemCount === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => ({
            index: Number(entry.target.dataset.reelIndex),
            ratio: entry.intersectionRatio,
          }))
          .filter((entry) => Number.isFinite(entry.index))
          .sort((a, b) => b.ratio - a.ratio);

        if (visible.length > 0) {
          setActiveIndex(visible[0].index);
        }
      },
      { root: rootRef.current, threshold },
    );

    sectionRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [itemCount, rootRef, threshold]);

  return {
    activeIndex,
    registerSectionRef,
    registerVideoRef,
    videoRefs,
  };
};

export default useIntersectionVideo;
