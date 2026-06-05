"use client";

import { useEffect, useRef, useState } from "react";

// Simple module-level cache so all banners on a page share one fetch
let settingsCache: Record<string, boolean> | null = null;
let fetchPromise: Promise<void> | null = null;

function fetchSettings(): Promise<void> {
  if (settingsCache !== null) return Promise.resolve();
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch("/api/ads")
    .then((r) => r.json())
    .then((data) => { settingsCache = data.settings ?? {}; })
    .catch(() => { settingsCache = {}; });
  return fetchPromise;
}

interface AdBannerProps {
  adKey: string;
  width: number;
  height: number;
  placement: string;
  className?: string;
}

interface NativeBannerProps {
  src: string;
  containerId: string;
  placement: string;
  className?: string;
}

export function NativeBanner({ src, containerId, placement, className = "" }: NativeBannerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetchSettings().then(() => {
      setEnabled(settingsCache?.[placement] !== false);
    });
  }, [placement]);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    ref.current.innerHTML = `<div id="${containerId}"></div>`;
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    ref.current.appendChild(script);
    return () => { if (ref.current) ref.current.innerHTML = ""; };
  }, [enabled, src, containerId]);

  if (!enabled) return null;
  return <div ref={ref} className={className} />;
}

export default function AdBanner({ adKey, width, height, placement, className = "" }: AdBannerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetchSettings().then(() => {
      setEnabled(settingsCache?.[placement] !== false);
    });
  }, [placement]);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    ref.current.innerHTML = "";
    const optScript = document.createElement("script");
    optScript.text = `atOptions = { 'key': '${adKey}', 'format': 'iframe', 'height': ${height}, 'width': ${width}, 'params': {} };`;
    ref.current.appendChild(optScript);
    const invokeScript = document.createElement("script");
    invokeScript.src = `https://www.highperformanceformat.com/${adKey}/invoke.js`;
    ref.current.appendChild(invokeScript);
    return () => { if (ref.current) ref.current.innerHTML = ""; };
  }, [enabled, adKey]);

  if (!enabled) return null;
  return (
    <div
      ref={ref}
      className={className}
      style={{ width, height, overflow: "hidden", margin: "0 auto" }}
    />
  );
}
