"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const pinRefs = [
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
  ];

  // Particle Field Logic inside useEffect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
    }[] = [];

    const initCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      const particleCount = Math.min(40, Math.floor((canvas.width * canvas.height) / 30000));
      for (let i = 0; i < particleCount; i++) {
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

    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(animateParticles);
    };

    window.addEventListener("resize", initCanvas);
    initCanvas();
    animateParticles();

    return () => {
      window.removeEventListener("resize", initCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Handle PIN values changes with focus advancing
  const handlePinChange = (value: string, index: number) => {
    // Only accept numeric inputs
    const numericValue = value.replace(/\D/g, "");
    if (!numericValue && value !== "") return;

    const newPin = [...pin];
    newPin[index] = numericValue.substring(numericValue.length - 1);
    setPin(newPin);

    // Auto-advance if digit is entered
    if (newPin[index] && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
  };

  // Handle backspace back-tracking
  const handlePinKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!pin[index] && index > 0) {
        // Current index is empty, clear previous index and focus it
        const newPin = [...pin];
        newPin[index - 1] = "";
        setPin(newPin);
        pinRefs[index - 1].current?.focus();
      } else if (pin[index]) {
        // Clear current index only
        const newPin = [...pin];
        newPin[index] = "";
        setPin(newPin);
      }
    }
  };

  const [error, setError] = useState("");

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const fullPin = pin.join("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), pin: fullPin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Please check your credentials.");
        setIsLoading(false);
        return;
      }

      // Redirect based on role
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

  return (
    <div className="relative min-h-screen bg-base-bg text-on-surface selection:bg-primary-container selection:text-on-primary-container overflow-hidden">
      {/* Dynamic Background Particle Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />

      {/* Glow Ambient Filter */}
      <div className="fixed bottom-0 right-0 opacity-10 pointer-events-none z-0 w-full h-full">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,var(--color-primary),transparent_60%)]" />
      </div>

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-[440px] flex flex-col gap-8">
          
          {/* Logo Brand Headers */}
          <div className="flex flex-col items-center animate-fade-in">
            <div className="flex items-center gap-2">
              <svg className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              <h1 className="headline-md font-extrabold tracking-tighter text-on-surface select-none">
                PREDIK<span className="text-primary">TO</span>
              </h1>
            </div>
          </div>

          {/* Core Login Glass Container Card */}
          <div className="surface-glass-1 rounded-lg p-6 md:p-8 flex flex-col gap-6 shadow-2xl">
            <header className="flex flex-col gap-1 text-left">
              <h2 className="headline-lg text-on-surface">Who&apos;s winning tonight?</h2>
              <p className="body-md text-on-surface-variant">
                Enter your credentials to join the match center.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6" id="loginForm">
              
              {/* Phone entry field */}
              <div className="flex flex-col gap-2">
                <label className="label-md text-on-surface-variant px-1 text-left">Phone Number</label>
                <div className="flex gap-2">
                  <div className="w-20 bg-surface-container-low border border-outline-variant rounded-md flex items-center justify-center body-md text-on-surface select-none">
                    +1
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="000-000-0000"
                    className="flex-1 bg-surface-container-low border border-outline-variant rounded-md px-4 py-3 body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Secure 4-digit PIN entries */}
              <div className="flex flex-col gap-2">
                <label className="label-md text-on-surface-variant px-1 text-left">Secure PIN</label>
                <div className="flex justify-between gap-3" id="pin-container">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        pinRefs[index].current = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={1}
                      required
                      value={digit}
                      onChange={(e) => handlePinChange(e.target.value, index)}
                      onKeyDown={(e) => handlePinKeyDown(e, index)}
                      className="w-16 h-16 md:w-20 md:h-20 bg-surface-container-low border border-outline-variant rounded-md text-center headline-md text-primary transition-all duration-200 focus:outline-none focus:border-primary focus:scale-[1.05] focus:ring-1 focus:ring-primary/20"
                    />
                  ))}
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-md px-4 py-3 body-sm text-center">
                  {error}
                </div>
              )}

              {/* Interactive Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-md font-headline-md text-headline-md text-white shadow-lg bg-gradient-to-r from-primary-container to-primary transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2 select-none ${
                  isLoading ? "opacity-80 cursor-not-allowed" : "hover:shadow-primary/20 hover:brightness-105 cursor-pointer"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Login"
                )}
              </button>

              {/* Card Footer Links */}
              <div className="flex justify-between items-center mt-2 pt-4 border-t border-white/5 label-md">
                <a href="#forgot" className="text-primary hover:text-primary-fixed transition-colors">
                  Forgot PIN?
                </a>
                <a href="#register" className="text-on-surface-variant hover:text-on-surface transition-colors">
                  New Player? Register
                </a>
              </div>
            </form>
          </div>

          {/* Secondary Terms/Help Notes */}
          <p className="text-center label-sm text-outline">
            By logging in, you agree to our{" "}
            <span className="text-on-surface-variant underline cursor-pointer hover:text-on-surface transition-colors">
              Terms of Service
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
