"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Share, ArrowUpRight, ShieldCheck, Zap } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Soccer Ball SVG
const SoccerIcon = ({ className = "w-10 h-10 text-primary" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m12 2-2 3h4Z" />
    <path d="M12 22v-3" />
    <path d="M10 5 6 8.5" />
    <path d="M14 5 18 8.5" />
    <path d="M6 8.5 7.5 13" />
    <path d="M18 8.5 16.5 13" />
    <path d="M7.5 13 12 15" />
    <path d="M16.5 13 12 15" />
    <path d="M12 15v4" />
    <path d="M12 22 8.5 19.5" />
    <path d="M12 22l3.5-2.5" />
    <path d="M7.5 13H4" />
    <path d="M16.5 13H20" />
  </svg>
);

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(true); // Default to true, loaded client-side

  useEffect(() => {
    // 1. Service Worker Registration
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => console.log("Service Worker registered with scope: ", reg.scope))
          .catch((err) => console.error("Service Worker registration failed: ", err));
      });
    }

    // 2. Check if already running in standalone (PWA) mode
    const checkStandalone = () => {
      const isMStandalone = window.matchMedia("(display-mode: standalone)").matches;
      // @ts-ignore
      const isNavStandalone = window.navigator.standalone === true;
      return isMStandalone || isNavStandalone;
    };

    const standaloneState = checkStandalone();
    setIsStandalone(standaloneState);

    // 3. Detect iOS platform
    const checkIOS = () => {
      const ua = window.navigator.userAgent.toLowerCase();
      const isIPhone = ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod");
      // Safari detection (exclude Chrome, Firefox, etc.)
      const isSafari = ua.includes("safari") && !ua.includes("crios") && !ua.includes("fxios");
      return isIPhone && isSafari;
    };
    setIsIOS(checkIOS());

    // 4. Load dismissal state from localStorage
    const pwaDismissed = localStorage.getItem("pwa-prompt-dismissed");
    const dismissedTime = localStorage.getItem("pwa-prompt-dismissed-time");
    
    let isDismissedExpired = false;
    if (dismissedTime) {
      const elapsed = Date.now() - parseInt(dismissedTime, 10);
      // Let prompt show again after 7 days
      if (elapsed > 7 * 24 * 60 * 60 * 1000) {
        isDismissedExpired = true;
      }
    }

    const hasDismissed = pwaDismissed === "true" && !isDismissedExpired;
    setDismissed(hasDismissed);

    // 5. Catch standard beforeinstallprompt event for Android/Chrome/Windows
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!standaloneState && !hasDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 6. Fallback trigger for iOS: show after 4 seconds of initial activity if not dismissed
    if (checkIOS() && !standaloneState && !hasDismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 4000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("pwa-prompt-dismissed", "true");
    localStorage.setItem("pwa-prompt-dismissed-time", Date.now().toString());
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setShowPrompt(false);
    
    // Trigger browser prompt
    await deferredPrompt.prompt();
    
    // Wait for the user selection
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User installation choice outcome: ${outcome}`);
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    } else {
      // Re-save dismiss key so they aren't prompted immediately
      localStorage.setItem("pwa-prompt-dismissed", "true");
      localStorage.setItem("pwa-prompt-dismissed-time", Date.now().toString());
    }
  };

  // If already installed, dismissed, or prompt shouldn't display, do not render
  if (isStandalone || dismissed || !showPrompt) return null;

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-up {
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .glass-prompt {
          background: rgba(15, 15, 25, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
      `}</style>

      {/* Screen Backdrop overlay on mobile */}
      <div className="fixed inset-0 bg-black/40 z-50 md:hidden animate-fade-in pointer-events-none" />

      {/* Main prompt widget */}
      <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:right-6 md:left-auto md:max-w-md w-full z-50 px-4 pb-6 pt-5 md:p-6 animate-slide-up">
        <div className="glass-prompt rounded-t-3xl md:rounded-2xl p-5 md:p-6 relative overflow-hidden">
          {/* Subtle neon glowing accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 via-primary to-secondary" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors cursor-pointer"
            aria-label="Dismiss install promotion"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex gap-4 items-start pr-6">
            {/* Logo container */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(99, 102, 241, 0.15))",
                border: "1px solid rgba(168, 85, 247, 0.25)",
                boxShadow: "0 0 20px rgba(168, 85, 247, 0.15)"
              }}
            >
              <SoccerIcon className="w-7 h-7 text-primary animate-spin-slow" />
            </div>

            {/* Content text */}
            <div className="flex flex-col text-left">
              <h4 className="text-white font-black tracking-tight text-base flex items-center gap-1.5">
                Install Predikto
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary px-1.5 py-0.5 rounded bg-secondary/10 border border-secondary/20">
                  PWA
                </span>
              </h4>
              <p className="text-white/60 text-xs mt-1.5 leading-relaxed">
                Add to your home screen to enjoy lightning-fast predictions, instant offline access, and real-time IST fixture countdowns.
              </p>
            </div>
          </div>

          {/* Conditional Instructions: iOS vs Standard browser prompt */}
          {isIOS ? (
            <div className="mt-5 p-3.5 rounded-xl bg-violet-950/20 border border-violet-900/30 flex flex-col gap-2.5 text-left">
              <div className="flex items-center gap-2 text-violet-400 text-xs font-bold">
                <Smartphone className="w-3.5 h-3.5" />
                iOS Safari Instructions:
              </div>
              <ol className="text-[11px] text-white/50 space-y-2 list-decimal list-inside pl-1 font-medium">
                <li>
                  Tap the <span className="text-white font-semibold">Share</span> icon{" "}
                  <Share className="w-3 h-3 inline-block mx-0.5 text-violet-400" /> at the bottom of the screen.
                </li>
                <li>
                  Scroll down the share menu and select{" "}
                  <span className="text-white font-semibold">Add to Home Screen</span>.
                </li>
                <li>
                  Tap <span className="text-white font-semibold">Add</span> in the top right to complete installation.
                </li>
              </ol>
            </div>
          ) : (
            <div className="mt-5 flex gap-3">
              <button
                onClick={handleDismiss}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white/50 border border-white/5 hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
              >
                Maybe Later
              </button>
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-primary text-white text-xs font-bold rounded-xl active:scale-95 hover:brightness-110 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-violet-700/20 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
            </div>
          )}

          {/* Features check footer */}
          <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between text-[10px] text-white/30">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-secondary" />
              Secure Sandbox
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              Instant Loading
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
