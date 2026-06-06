"use client";

import React, { useState, useRef } from "react";
import { X, LogIn, UserPlus, Zap, Loader2 } from "lucide-react";

type Tab = "login" | "register" | "guest";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hint?: string; // e.g. "Sign in to join this contest"
}

export default function AuthModal({ isOpen, onClose, onSuccess, hint }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login state
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPin, setLoginPin] = useState(["", "", "", "", "", ""]);
  const loginPinRefs = Array.from({ length: 6 }, () => useRef<HTMLInputElement | null>(null));

  // Register state
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPin, setRegPin] = useState(["", "", "", "", "", ""]);
  const regPinRefs = Array.from({ length: 6 }, () => useRef<HTMLInputElement | null>(null));

  if (!isOpen) return null;

  const resetErrors = () => { setError(""); setSuccess(""); };

  const switchTab = (t: Tab) => { setTab(t); resetErrors(); };

  const handlePinChange = (
    value: string, index: number,
    pin: string[], setPin: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.RefObject<HTMLInputElement | null>[]
  ) => {
    const numeric = value.replace(/\D/g, "");
    if (!numeric && value !== "") return;
    const next = [...pin];
    next[index] = numeric.substring(numeric.length - 1);
    setPin(next);
    if (next[index] && index < 5) refs[index + 1].current?.focus();
  };

  const handlePinKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>, index: number,
    pin: string[], setPin: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.RefObject<HTMLInputElement | null>[]
  ) => {
    if (e.key === "Backspace") {
      if (!pin[index] && index > 0) {
        const next = [...pin]; next[index - 1] = ""; setPin(next);
        refs[index - 1].current?.focus();
      } else if (pin[index]) {
        const next = [...pin]; next[index] = ""; setPin(next);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPin = loginPin.join("");
    if (fullPin.length < 6) { setError("Please enter all 6 digits."); return; }
    setIsLoading(true); resetErrors();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: loginPhone.trim(), pin: fullPin }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed."); setIsLoading(false); return; }
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPin = regPin.join("");
    if (fullPin.length < 6) { setError("Please enter all 6 digits."); return; }
    setIsLoading(true); resetErrors();
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName.trim(), phone: regPhone.trim(), pin: fullPin }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed."); setIsLoading(false); return; }
      // Auto-login after register
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: regPhone.trim(), pin: fullPin }),
      });
      if (loginRes.ok) { onSuccess(); } else { setSuccess("Account created! Please log in."); switchTab("login"); setIsLoading(false); }
    } catch {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGuest = async () => {
    setIsLoading(true); resetErrors();
    try {
      const res = await fetch("/api/auth/guest", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Could not create guest session."); setIsLoading(false); return; }
      if (data.credentials) localStorage.setItem("guestCredentials", JSON.stringify(data.credentials));
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  const pinBoxClass =
    "w-10 h-10 sm:w-11 sm:h-11 bg-white/5 border border-white/10 rounded-lg text-center text-base font-black text-primary transition-all duration-200 focus:outline-none focus:border-primary focus:scale-[1.08] focus:ring-1 focus:ring-primary/20";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-sm bg-slate-950/98 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        style={{ background: "linear-gradient(180deg, rgba(15,15,25,0.99) 0%, rgba(5,5,12,1) 100%)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">
              {tab === "login" ? "Welcome Back" : tab === "register" ? "Join the Game" : "Quick Entry"}
            </h2>
            {hint && <p className="text-xs text-white/40 mt-0.5">{hint}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 px-2">
          {(["login", "register", "guest"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                tab === t ? "text-primary border-b-2 border-primary" : "text-white/30 hover:text-white/60"
              }`}
            >
              {t === "login" && <LogIn className="w-3.5 h-3.5" />}
              {t === "register" && <UserPlus className="w-3.5 h-3.5" />}
              {t === "guest" && <Zap className="w-3.5 h-3.5" />}
              {t === "login" ? "Login" : t === "register" ? "Register" : "Guest"}
            </button>
          ))}
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">

          {/* LOGIN */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <input
                type="tel" required placeholder="Phone number"
                value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-primary transition-colors"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">6-Digit Password</label>
                <div className="flex justify-between gap-1.5">
                  {loginPin.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { loginPinRefs[i].current = el; }}
                      type="text" inputMode="numeric" pattern="\d*" maxLength={1} required
                      value={digit}
                      onChange={(e) => handlePinChange(e.target.value, i, loginPin, setLoginPin, loginPinRefs)}
                      onKeyDown={(e) => handlePinKeyDown(e, i, loginPin, setLoginPin, loginPinRefs)}
                      className={pinBoxClass}
                    />
                  ))}
                </div>
              </div>
              {error && <p className="text-red-400 text-xs font-semibold text-center">{error}</p>}
              <button type="submit" disabled={isLoading}
                className="w-full py-3 rounded-xl text-sm font-black text-white bg-primary hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer">
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : "Sign In"}
              </button>
            </form>
          )}

          {/* REGISTER */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
              <input
                type="text" required placeholder="Your name"
                value={regName} onChange={(e) => setRegName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-primary transition-colors"
              />
              <input
                type="tel" required placeholder="Phone number"
                value={regPhone} onChange={(e) => setRegPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-primary transition-colors"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Choose 6-Digit Password</label>
                <div className="flex justify-between gap-1.5">
                  {regPin.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { regPinRefs[i].current = el; }}
                      type="text" inputMode="numeric" pattern="\d*" maxLength={1} required
                      value={digit}
                      onChange={(e) => handlePinChange(e.target.value, i, regPin, setRegPin, regPinRefs)}
                      onKeyDown={(e) => handlePinKeyDown(e, i, regPin, setRegPin, regPinRefs)}
                      className={pinBoxClass}
                    />
                  ))}
                </div>
              </div>
              {error && <p className="text-red-400 text-xs font-semibold text-center">{error}</p>}
              {success && <p className="text-emerald-400 text-xs font-semibold text-center">{success}</p>}
              <button type="submit" disabled={isLoading}
                className="w-full py-3 rounded-xl text-sm font-black text-white bg-primary hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer">
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : "Create Account"}
              </button>
            </form>
          )}

          {/* GUEST */}
          {tab === "guest" && (
            <div className="flex flex-col gap-4 py-2">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col gap-2">
                <p className="text-sm font-bold text-amber-400">Guest Mode</p>
                <ul className="text-xs text-white/50 flex flex-col gap-1 list-disc pl-4">
                  <li>Random name &amp; phone assigned</li>
                  <li>Points start at 0</li>
                  <li>Can participate in all contests &amp; games</li>
                  <li>Upgrade to a real account anytime</li>
                </ul>
              </div>
              {error && <p className="text-red-400 text-xs font-semibold text-center">{error}</p>}
              <button
                onClick={handleGuest} disabled={isLoading}
                className="w-full py-3.5 rounded-xl text-sm font-black text-white bg-gradient-to-r from-amber-600 to-orange-500 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up…</> : <><Zap className="w-4 h-4" /> Continue as Guest</>}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
