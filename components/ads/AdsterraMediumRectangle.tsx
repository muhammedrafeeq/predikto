"use client";

import { useEffect, useRef } from "react";

export default function AdsterraMediumRectangle() {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    const optionsScript = document.createElement("script");
    optionsScript.innerHTML = `
      atOptions = {
        'key': '70c7ee89310beba32f1c1ee13a530480',
        'format': 'iframe',
        'height': 250,
        'width': 300,
        'params': {}
      };
    `;
    containerRef.current.appendChild(optionsScript);

    const invokeScript = document.createElement("script");
    invokeScript.src = "https://www.highperformanceformat.com/70c7ee89310beba32f1c1ee13a530480/invoke.js";
    containerRef.current.appendChild(invokeScript);
  }, []);

  return (
    <div className="flex justify-center my-4">
      <div ref={containerRef} style={{ width: 300, height: 250 }} />
    </div>
  );
}
