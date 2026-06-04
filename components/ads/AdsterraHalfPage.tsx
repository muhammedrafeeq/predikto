"use client";

import { useEffect, useRef } from "react";
import { useAdEnabled } from "@/lib/AdContext";

export default function AdsterraHalfPage() {
  const enabled = useAdEnabled("ad_half_page");
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!enabled || loaded.current || !containerRef.current) return;
    loaded.current = true;

    const optionsScript = document.createElement("script");
    optionsScript.innerHTML = `
      atOptions = {
        'key': '5ff9be8f6a972cfd4234d241e8db5b2d',
        'format': 'iframe',
        'height': 300,
        'width': 160,
        'params': {}
      };
    `;
    containerRef.current.appendChild(optionsScript);

    const invokeScript = document.createElement("script");
    invokeScript.src = "https://www.highperformanceformat.com/5ff9be8f6a972cfd4234d241e8db5b2d/invoke.js";
    containerRef.current.appendChild(invokeScript);
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div className="hidden lg:flex justify-center my-4">
      <div ref={containerRef} style={{ width: 160, height: 300 }} />
    </div>
  );
}
