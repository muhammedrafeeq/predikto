"use client";

import { useEffect, useRef, useState } from "react";

let settingsCache: Record<string, boolean> | null = null;
let fetchPromise: Promise<void> | null = null;
let hilltopInjected = false;

function fetchSettings(): Promise<void> {
  if (settingsCache !== null) return Promise.resolve();
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch("/api/ads")
    .then((r) => r.json())
    .then((data) => { settingsCache = data.settings ?? {}; })
    .catch(() => { settingsCache = {}; });
  return fetchPromise;
}

function injectHilltop() {
  if (hilltopInjected || typeof document === "undefined") return;
  hilltopInjected = true;
  const s = document.createElement("script");
  s.src = "//untimely-hello.com/bEXPVas.daGtl/0HY/WRce/le/m/9/uMZXU/lXkmPATZc_xTMhDIgmwAN/TzcLtGNWzIE/wrOZDYAT2nMIQa";
  s.async = true;
  s.referrerPolicy = "no-referrer-when-downgrade";
  document.head.appendChild(s);
}

interface AdBannerProps {
  adKey: string;
  width: number;
  height: number;
  placement: string;
  className?: string;
}

export default function AdBanner({ adKey, width, height, placement, className = "" }: AdBannerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetchSettings().then(() => {
      const on = settingsCache?.[placement] !== false;
      setEnabled(on);
      if (!on) injectHilltop();
    });
  }, [placement]);

  useEffect(() => {
    if (enabled !== true || !ref.current) return;
    ref.current.innerHTML = "";
    const optScript = document.createElement("script");
    optScript.text = `atOptions = { 'key': '${adKey}', 'format': 'iframe', 'height': ${height}, 'width': ${width}, 'params': {} };`;
    ref.current.appendChild(optScript);
    const invokeScript = document.createElement("script");
    invokeScript.src = `https://www.highperformanceformat.com/${adKey}/invoke.js`;
    ref.current.appendChild(invokeScript);
    return () => { if (ref.current) ref.current.innerHTML = ""; };
  }, [enabled, adKey]);

  if (enabled !== true) return null;
  return (
    <div
      ref={ref}
      className={className}
      style={{ width, height, overflow: "hidden", margin: "0 auto" }}
    />
  );
}
