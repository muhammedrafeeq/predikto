"use client";

import { useEffect, useRef } from "react";

interface AdBannerProps {
  adKey: string;
  width: number;
  height: number;
  className?: string;
}

export default function AdBanner({ adKey, width, height, className = "" }: AdBannerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";

    const optScript = document.createElement("script");
    optScript.text = `atOptions = { 'key': '${adKey}', 'format': 'iframe', 'height': ${height}, 'width': ${width}, 'params': {} };`;
    ref.current.appendChild(optScript);

    const invokeScript = document.createElement("script");
    invokeScript.src = `https://www.highperformanceformat.com/${adKey}/invoke.js`;
    ref.current.appendChild(invokeScript);

    return () => { if (ref.current) ref.current.innerHTML = ""; };
  }, [adKey]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ width, height, overflow: "hidden", margin: "0 auto" }}
    />
  );
}
