"use client";

import React, { useState } from "react";
import { X, LogIn, Zap, Loader2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hint?: string;
}

export default function AuthModal({ isOpen, onClose, onSuccess, hint }: AuthModalProps) {
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleLogin = () => {
    window.location.href = "/login";
  };

  const handleGuest = async () => {
    setIsGuestLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/guest", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Could not create guest session."); setIsGuestLoading(false); return; }
      if (data.credentials) localStorage.setItem("guestCredentials", JSON.stringify(data.credentials));
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-xs bg-slate-950/98 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        style={{ background: "linear-gradient(180deg, rgba(15,15,25,0.99) 0%, rgba(5,5,12,1) 100%)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div>
            <h2 className="text-base font-black text-white tracking-tight">Join the Game</h2>
            {hint && <p className="text-xs text-white/40 mt-0.5">{hint}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-3">
          {error && <p className="text-red-400 text-xs font-semibold text-center">{error}</p>}

          <button
            onClick={handleLogin}
            className="w-full py-3.5 rounded-xl text-sm font-black text-white bg-primary hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Login / Register
          </button>

          <button
            onClick={handleGuest}
            disabled={isGuestLoading}
            className="w-full py-3.5 rounded-xl text-sm font-black border border-white/10 text-white/70 hover:text-white hover:bg-white/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isGuestLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up…</>
              : <><Zap className="w-4 h-4 text-amber-400" /> Continue as Guest</>
            }
          </button>

          <p className="text-center text-[10px] text-white/20 mt-1">Guest accounts start with 0 points</p>
        </div>
      </div>
    </div>
  );
}
