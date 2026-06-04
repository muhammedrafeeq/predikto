"use client";

import { useEffect, useRef } from "react";

export default function AdsterraMobileBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    const optionsScript = document.createElement("script");
    optionsScript.innerHTML = `
      atOptions = {
        'key': '753405b7f38e29d2a92c4475af5f639c',
        'format': 'iframe',
        'height': 50,
        'width': 320,
        'params': {}
      };
    `;
    containerRef.current.appendChild(optionsScript);

    const invokeScript = document.createElement("script");
    invokeScript.src = "https://www.highperformanceformat.com/753405b7f38e29d2a92c4475af5f639c/invoke.js";
    containerRef.current.appendChild(invokeScript);
  }, []);

  return (
    <div className="flex lg:hidden justify-center my-4">
      <div ref={containerRef} style={{ width: 320, height: 50 }} />
    </div>
  );
}
