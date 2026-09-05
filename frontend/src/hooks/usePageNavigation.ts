import { useEffect, useRef, useState } from "react";
import type { Page } from "../types";

const PAGE_ORDER: Page[] = [
  "weather",
  "entertainment",
  "knowledge",
];

export default function usePageNavigation() {
  const [page, setPage] = useState<Page>("weather");

  const autoRotateRef = useRef<number | null>(null);
  const resumeRef = useRef<number | null>(null);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      const target = event.target as HTMLElement;

      const scroller =
        target.closest<HTMLElement>(".event-scroll");

      if (!scroller) return;

      event.preventDefault();

      scroller.scrollBy({
        left: event.deltaY,
        behavior: "auto",
      });
    };

    document.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => {
      document.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    const closePickers = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      document
        .querySelectorAll<HTMLDetailsElement>(".picker[open]")
        .forEach((picker) => {
          if (!picker.contains(target)) {
            picker.removeAttribute("open");
          }
        });
    };

    document.addEventListener("click", closePickers);

    return () => {
      document.removeEventListener("click", closePickers);
    };
  }, []);

  useEffect(() => {
    const rotatePage = () => {
      setPage((current) => {
        const index = PAGE_ORDER.indexOf(current);

        return PAGE_ORDER[
          (index + 1) % PAGE_ORDER.length
        ];
      });
    };

    const startAutoRotate = () => {
      if (autoRotateRef.current) {
        window.clearInterval(autoRotateRef.current);
      }

      autoRotateRef.current = window.setInterval(
        rotatePage,
        30000
      );
    };

    const handleInteraction = () => {
      if (autoRotateRef.current) {
        window.clearInterval(autoRotateRef.current);
        autoRotateRef.current = null;
      }

      if (resumeRef.current) {
        window.clearTimeout(resumeRef.current);
      }

      resumeRef.current = window.setTimeout(() => {
        rotatePage();
        startAutoRotate();
      }, 60000);
    };

    startAutoRotate();

    const events = [
      "pointerdown",
      "wheel",
      "keydown",
      "touchstart",
    ];

    events.forEach((event) => {
      window.addEventListener(event, handleInteraction, {
        passive: true,
      });
    });

    return () => {
      if (autoRotateRef.current) {
        window.clearInterval(autoRotateRef.current);
      }

      if (resumeRef.current) {
        window.clearTimeout(resumeRef.current);
      }

      events.forEach((event) => {
        window.removeEventListener(
          event,
          handleInteraction
        );
      });
    };
  }, []);

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let ignoreSwipe = false;

    const handleTouchStart = (event: TouchEvent) => {
      const target = event.target as HTMLElement;

      ignoreSwipe =
        !!target.closest(".event-scroll") ||
        !!target.closest(".movie-filters") ||
        !!target.closest(".picker");

      if (ignoreSwipe) return;

      const touch = event.touches[0];

      startX = touch.clientX;
      startY = touch.clientY;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (ignoreSwipe) {
        ignoreSwipe = false;
        return;
      }

      const touch = event.changedTouches[0];

      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      if (
        Math.abs(deltaX) < 60 ||
        Math.abs(deltaX) <= Math.abs(deltaY)
      ) {
        return;
      }

      setPage((current) => {
        const index = PAGE_ORDER.indexOf(current);
        const direction = deltaX < 0 ? 1 : -1;

        return PAGE_ORDER[
          (
            index +
            direction +
            PAGE_ORDER.length
          ) % PAGE_ORDER.length
        ];
      });
    };

    document.addEventListener(
      "touchstart",
      handleTouchStart,
      { passive: true }
    );

    document.addEventListener(
      "touchend",
      handleTouchEnd,
      { passive: true }
    );

    return () => {
      document.removeEventListener(
        "touchstart",
        handleTouchStart
      );

      document.removeEventListener(
        "touchend",
        handleTouchEnd
      );
    };
  }, []);

  return {
    page,
    setPage,
  };
}