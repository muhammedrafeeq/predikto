"use client";

import { useEffect, useRef } from "react";

export default function AdsterraNativeBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = "https://pl29633839.effectivecpmnetwork.com/d940a0643b83fbb38d2f7e88a787ae28/invoke.js";
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="w-full my-4">
      <div
        ref={containerRef}
        id="container-d940a0643b83fbb38d2f7e88a787ae28"
      />
    </div>
  );
}
