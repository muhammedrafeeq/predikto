"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function AppInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore
      window.navigator.standalone === true ||
      localStorage.getItem("app-banner-dismissed") === "true"
    ) return;

    const ua = navigator.userAgent.toLowerCase();
    const ios = (ua.includes("iphone") || ua.includes("ipad")) && ua.includes("safari") && !ua.includes("crios");
    if (ios) { setIsIOS(true); setShow(true); return; }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("app-banner-dismissed", "true");
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
    dismiss();
  };

  if (!show) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl shrink-0 overflow-hidden border border-white/10">
          <img src="/skorio-logo.png" alt="Skorio" className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-white text-xs font-black leading-tight">Install Skorio App</p>
          <p className="text-white/40 text-[10px] mt-0.5 truncate">
            {isIOS ? "Tap Share → Add to Home Screen" : "Add to home screen for faster access"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!isIOS && (
          <button
            onClick={install}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-[11px] font-black hover:bg-violet-500 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-3 h-3" />
            Install
          </button>
        )}
        <button onClick={dismiss} className="p-1 text-white/30 hover:text-white transition-colors cursor-pointer">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
