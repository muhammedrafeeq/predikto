"use client";

import { useEffect, useRef } from "react";

export default function AdsterraLeaderboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    const optionsScript = document.createElement("script");
    optionsScript.innerHTML = `
      atOptions = {
        'key': 'e6c3313ea909108b25518bcf45214f98',
        'format': 'iframe',
        'height': 90,
        'width': 728,
        'params': {}
      };
    `;
    containerRef.current.appendChild(optionsScript);

    const invokeScript = document.createElement("script");
    invokeScript.src = "https://www.highperformanceformat.com/e6c3313ea909108b25518bcf45214f98/invoke.js";
    containerRef.current.appendChild(invokeScript);
  }, []);

  return (
    <div className="hidden lg:flex justify-center my-4">
      <div ref={containerRef} style={{ width: 728, height: 90 }} />
    </div>
  );
}
