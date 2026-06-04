"use client";

import { useEffect, useRef, useState } from "react";
import { useAdEnabled } from "@/lib/AdContext";

interface Props {
  onClose: () => void;
}

export default function AdsterraInterstitial({ onClose }: Props) {
  const enabled = useAdEnabled("ad_interstitial");
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!enabled || loaded.current || !containerRef.current) return;
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
  }, [enabled]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // If interstitial is disabled, skip straight to close
  useEffect(() => {
    if (!enabled) onClose();
  }, [enabled, onClose]);

  if (!enabled) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative flex flex-col items-center gap-4 bg-surface rounded-2xl p-6 shadow-2xl border border-white/10 mx-4">
        <p className="text-xs text-on-surface-variant uppercase tracking-widest font-semibold">Advertisement</p>

        <div ref={containerRef} style={{ width: 300, height: 250 }} />

        <button
          onClick={onClose}
          disabled={countdown > 0}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
            countdown > 0
              ? "bg-white/10 text-on-surface-variant cursor-not-allowed"
              : "bg-primary text-on-primary cursor-pointer hover:brightness-110 active:scale-95"
          }`}
        >
          {countdown > 0 ? `Skip in ${countdown}s` : "Continue →"}
        </button>
      </div>
    </div>
  );
}
