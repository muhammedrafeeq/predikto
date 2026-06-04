"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, UserPlus, LogIn } from "lucide-react";

type Mode = "login" | "register";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");

  // --- Login state ---
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPin, setLoginPin] = useState<string[]>(["", "", "", "", "", ""]);

  // --- Register state ---
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPin, setRegPin] = useState<string[]>(["", "", "", "", "", ""]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 6 PIN refs for login
  const loginPinRefs = Array.from({ length: 6 }, () =>
    useRef<HTMLInputElement | null>(null)
  );
  // 6 PIN refs for register
  const regPinRefs = Array.from({ length: 6 }, () =>
    useRef<HTMLInputElement | null>(null)
  );

  // Particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];

    const initCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      const count = Math.min(40, Math.floor((canvas.width * canvas.height) / 30000));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2 + 1,
          alpha: Math.random() * 0.4 + 0.1,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", initCanvas);
    initCanvas();
    animate();
    return () => {
      window.removeEventListener("resize", initCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Generic PIN change handler
  const handlePinChange = (
    value: string,
    index: number,
    pin: string[],
    setPin: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.RefObject<HTMLInputElement | null>[]
  ) => {
    const numeric = value.replace(/\D/g, "");
    if (!numeric && value !== "") return;
    const next = [...pin];
    next[index] = numeric.substring(numeric.length - 1);
    setPin(next);
    if (next[index] && index < 5) refs[index + 1].current?.focus();
  };

  // Generic PIN keydown handler
  const handlePinKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    pin: string[],
    setPin: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.RefObject<HTMLInputElement | null>[]
  ) => {
    if (e.key === "Backspace") {
      if (!pin[index] && index > 0) {
        const next = [...pin];
        next[index - 1] = "";
        setPin(next);
        refs[index - 1].current?.focus();
      } else if (pin[index]) {
        const next = [...pin];
        next[index] = "";
        setPin(next);
      }
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setSuccess("");
  };

  // Login submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const fullPin = loginPin.join("");
    if (fullPin.length < 6) {
      setError("Please enter all 6 digits of your password.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: loginPhone.trim(), pin: fullPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed. Please check your credentials.");
        setIsLoading(false);
        return;
      }
      if (data.user?.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/matches";
      }
    } catch {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  // Register submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    const fullPin = regPin.join("");
    if (fullPin.length < 6) {
      setError("Please enter all 6 digits for your password.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName.trim(), phone: regPhone.trim(), pin: fullPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }
      setSuccess("Account created! You can now log in.");
      setRegName("");
      setRegPhone("");
      setRegPin(["", "", "", "", "", ""]);
      setIsLoading(false);
      setTimeout(() => switchMode("login"), 1800);
    } catch {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  const pinBoxClass =
    "w-11 h-11 sm:w-13 sm:h-13 bg-surface-container-low border border-outline-variant rounded-md text-center headline-md text-primary transition-all duration-200 focus:outline-none focus:border-primary focus:scale-[1.08] focus:ring-1 focus:ring-primary/20";

  return (
    <div className="relative min-h-screen bg-base-bg text-on-surface overflow-hidden">
      {/* Particle canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />

      {/* Ambient glow */}
      <div className="fixed bottom-0 right-0 opacity-10 pointer-events-none z-0 w-full h-full">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,var(--color-primary),transparent_60%)]" />
      </div>

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-[440px] flex flex-col gap-8">

          {/* Logo */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3">
              <img src="/skorio-logo.png" alt="Skorio Logo" className="w-14 h-14 object-contain rounded-xl" />
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-on-surface select-none">
                SKO<span className="text-primary">RIO</span>
              </h1>
            </div>
          </div>

          {/* Glass card */}
          <div className="surface-glass-1 rounded-lg shadow-2xl overflow-hidden">

            {/* Tab switcher */}
            <div className="flex border-b border-white/5">
              <button
                id="tab-login"
                onClick={() => switchMode("login")}
                className={`flex-1 flex items-center justify-center gap-2 py-4 label-md transition-all duration-200 ${
                  mode === "login"
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <LogIn className="w-4 h-4" />
                Login
              </button>
              <button
                id="tab-register"
                onClick={() => switchMode("register")}
                className={`flex-1 flex items-center justify-center gap-2 py-4 label-md transition-all duration-200 ${
                  mode === "register"
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Register
              </button>
            </div>

            <div className="p-6 md:p-8 flex flex-col gap-6">

              {/* ── LOGIN FORM ── */}
              {mode === "login" && (
                <>
                  <header className="flex flex-col gap-1">
                    <h2 className="headline-lg text-on-surface">Who&apos;s winning tonight?</h2>
                    <p className="body-md text-on-surface-variant">Enter your credentials to join the match center.</p>
                  </header>

                  <form onSubmit={handleLogin} className="flex flex-col gap-6" id="loginForm">
                    {/* Phone */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="login-phone" className="label-md text-on-surface-variant px-1">Phone Number</label>
                      <input
                        id="login-phone"
                        type="tel"
                        required
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        placeholder="Enter your phone number"
                        className="flex-1 bg-surface-container-low border border-outline-variant rounded-md px-4 py-3 body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>

                    {/* 6-digit PIN */}
                    <div className="flex flex-col gap-2">
                      <label className="label-md text-on-surface-variant px-1">6-Digit Password</label>
                      <div className="flex justify-between gap-2" id="login-pin-container">
                        {loginPin.map((digit, i) => (
                          <input
                            key={i}
                            ref={(el) => { loginPinRefs[i].current = el; }}
                            type="text"
                            inputMode="numeric"
                            pattern="\d*"
                            maxLength={1}
                            required
                            value={digit}
                            onChange={(e) => handlePinChange(e.target.value, i, loginPin, setLoginPin, loginPinRefs)}
                            onKeyDown={(e) => handlePinKeyDown(e, i, loginPin, setLoginPin, loginPinRefs)}
                            className={pinBoxClass}
                          />
                        ))}
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-md px-4 py-3 body-md text-center">
                        {error}
                      </div>
                    )}

                    <button
                      id="login-submit"
                      type="submit"
                      disabled={isLoading}
                      className={`w-full py-4 rounded-md label-md text-white shadow-lg bg-gradient-to-r from-primary-container to-primary transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2 select-none ${
                        isLoading ? "opacity-80 cursor-not-allowed" : "hover:brightness-105 cursor-pointer"
                      }`}
                    >
                      {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Authenticating...</> : "Login"}
                    </button>

                    <div className="flex justify-between items-center pt-3 border-t border-white/5 label-md">
                      <a href="#forgot" className="text-primary hover:text-primary-fixed transition-colors">Forgot Password?</a>
                      <button type="button" onClick={() => switchMode("register")} className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                        New Player? Register
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* ── REGISTER FORM ── */}
              {mode === "register" && (
                <>
                  <header className="flex flex-col gap-1">
                    <h2 className="headline-lg text-on-surface">Join the Game!</h2>
                    <p className="body-md text-on-surface-variant">Create your account and start predicting matches.</p>
                  </header>

                  <form onSubmit={handleRegister} className="flex flex-col gap-5" id="registerForm">
                    {/* Name */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="reg-name" className="label-md text-on-surface-variant px-1">Full Name</label>
                      <input
                        id="reg-name"
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Enter your name"
                        className="bg-surface-container-low border border-outline-variant rounded-md px-4 py-3 body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="reg-phone" className="label-md text-on-surface-variant px-1">Phone Number</label>
                      <input
                        id="reg-phone"
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="Enter your phone number"
                        className="bg-surface-container-low border border-outline-variant rounded-md px-4 py-3 body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                      />
                    </div>

                    {/* 6-digit PIN */}
                    <div className="flex flex-col gap-2">
                      <label className="label-md text-on-surface-variant px-1">6-Digit Password</label>
                      <p className="label-sm text-outline px-1">Choose 6 digits you&apos;ll remember</p>
                      <div className="flex justify-between gap-2" id="reg-pin-container">
                        {regPin.map((digit, i) => (
                          <input
                            key={i}
                            ref={(el) => { regPinRefs[i].current = el; }}
                            type="text"
                            inputMode="numeric"
                            pattern="\d*"
                            maxLength={1}
                            required
                            value={digit}
                            onChange={(e) => handlePinChange(e.target.value, i, regPin, setRegPin, regPinRefs)}
                            onKeyDown={(e) => handlePinKeyDown(e, i, regPin, setRegPin, regPinRefs)}
                            className={pinBoxClass}
                          />
                        ))}
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-md px-4 py-3 body-md text-center">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="bg-secondary/10 border border-secondary/30 text-secondary rounded-md px-4 py-3 body-md text-center">
                        {success}
                      </div>
                    )}

                    <button
                      id="register-submit"
                      type="submit"
                      disabled={isLoading}
                      className={`w-full py-4 rounded-md label-md text-white shadow-lg bg-gradient-to-r from-primary-container to-primary transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2 select-none ${
                        isLoading ? "opacity-80 cursor-not-allowed" : "hover:brightness-105 cursor-pointer"
                      }`}
                    >
                      {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating Account...</> : "Create Account"}
                    </button>

                    <div className="flex justify-center pt-3 border-t border-white/5 label-md">
                      <button type="button" onClick={() => switchMode("login")} className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                        Already have an account? Login
                      </button>
                    </div>
                  </form>
                </>
              )}

            </div>
          </div>

          <p className="text-center label-sm text-outline">
            By continuing, you agree to our{" "}
            <span className="text-on-surface-variant underline cursor-pointer hover:text-on-surface transition-colors">
              Terms of Service
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
