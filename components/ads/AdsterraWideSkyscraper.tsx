"use client";

import { useEffect, useRef } from "react";
import { useAdEnabled } from "@/lib/AdContext";

export default function AdsterraWideSkyscraper() {
  const enabled = useAdEnabled("ad_wide_skyscraper");
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!enabled || loaded.current || !containerRef.current) return;
    loaded.current = true;

    const optionsScript = document.createElement("script");
    optionsScript.innerHTML = `
      atOptions = {
        'key': 'ac22ba37d5a293ea9cfab0711c413069',
        'format': 'iframe',
        'height': 600,
        'width': 160,
        'params': {}
      };
    `;
    containerRef.current.appendChild(optionsScript);

    const invokeScript = document.createElement("script");
    invokeScript.src = "https://www.highperformanceformat.com/ac22ba37d5a293ea9cfab0711c413069/invoke.js";
    containerRef.current.appendChild(invokeScript);
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div className="hidden lg:flex justify-center my-4">
      <div ref={containerRef} style={{ width: 160, height: 600 }} />
    </div>
  );
}
