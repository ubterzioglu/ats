"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { shouldShowScrollTop } from "@/lib/scroll-top";
import { cx } from "@/lib/ui";

export function ScrollTopButton() {
  const t = useTranslations("help");
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      rafRef.current = requestAnimationFrame(() => {
        setVisible(shouldShowScrollTop(window.scrollY, window.innerHeight));
        ticking = false;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function scrollToTop() {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={cx(
        "btn-quiet min-h-11 min-w-11 rounded-full border-2 border-bone/10 bg-bench p-0",
        "transition-[opacity,visibility] duration-200",
        visible ? "opacity-100" : "invisible opacity-0"
      )}
      aria-label={t("scrollTop")}
      tabIndex={visible ? 0 : -1}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 16V4" />
        <path d="M4 10l6-6 6 6" />
      </svg>
    </button>
  );
}
