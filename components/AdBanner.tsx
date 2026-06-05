"use client";

import { useEffect, useRef } from "react";

interface AdBannerProps {
  adKey: string;
  width: number;
  height: number;
  className?: string;
}

interface NativeBannerProps {
  src: string;
  containerId: string;
  className?: string;
}

export function NativeBanner({ src, containerId, className = "" }: NativeBannerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = `<div id="${containerId}"></div>`;

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    ref.current.appendChild(script);

    return () => { if (ref.current) ref.current.innerHTML = ""; };
  }, [src, containerId]);

  return <div ref={ref} className={className} />;
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
