"use client";

import { useEffect, useRef } from "react";

// The 1947 newsreel opens and closes on black; loop only the footage between.
const START = 4;
const END = 47;

export function ArchiveClip({ className }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMeta = () => {
      v.currentTime = START;
      if (!reduce.matches) v.play().catch(() => {});
    };
    const onTime = () => {
      if (v.currentTime >= END) v.currentTime = START;
    };
    const onVisibility = () => (document.hidden ? v.pause() : !reduce.matches && v.play().catch(() => {}));
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("timeupdate", onTime);
    document.addEventListener("visibilitychange", onVisibility);
    if (v.readyState >= 1) onMeta();
    return () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("timeupdate", onTime);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      muted
      playsInline
      preload="metadata"
      poster="/archive/cargo-arrival-1947-poster.jpg"
      aria-hidden="true"
      width={720}
      height={576}
    >
      <source src="/archive/cargo-arrival-1947.webm" type="video/webm" />
    </video>
  );
}
