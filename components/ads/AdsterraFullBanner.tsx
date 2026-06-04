"use client";

import { useEffect, useRef } from "react";

export default function AdsterraFullBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    const optionsScript = document.createElement("script");
    optionsScript.innerHTML = `
      atOptions = {
        'key': '36cddb46254d8d5aeb4a5bf6fe81747e',
        'format': 'iframe',
        'height': 60,
        'width': 468,
        'params': {}
      };
    `;
    containerRef.current.appendChild(optionsScript);

    const invokeScript = document.createElement("script");
    invokeScript.src = "https://www.highperformanceformat.com/36cddb46254d8d5aeb4a5bf6fe81747e/invoke.js";
    containerRef.current.appendChild(invokeScript);
  }, []);

  return (
    <div className="flex justify-center my-4">
      <div ref={containerRef} style={{ width: 468, height: 60 }} />
    </div>
  );
}
