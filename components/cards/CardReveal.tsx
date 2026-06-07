"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import PlayerCard from "./PlayerCard";
import { PlayerCardData } from "@/lib/cardDrop";

interface CardRevealProps {
  card: PlayerCardData;
  onComplete?: () => void;
  detailsUrl?: string; // Optional URL for details page
}

export default function CardReveal({ card, onComplete, detailsUrl }: CardRevealProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [countedStats, setCountedStats] = useState({
    pace: 0,
    shooting: 0,
    passing: 0,
    defending: 0,
  });
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);

  const isLegendary = card.rarity === "legendary";

  // Generate floating gold particles for Legendary reveal
  useEffect(() => {
    if (isLegendary) {
      const generated = Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100 - 50, // relative to center
        y: Math.random() * 100 - 30, // relative to center
        size: Math.random() * 6 + 2,
        delay: Math.random() * 2,
      }));
      setParticles(generated);
    }
  }, [isLegendary]);

  // Handle Card Flip
  const handleFlip = () => {
    if (isFlipped) return;
    setIsFlipped(true);

    // After card flips face-up, count up stats
    setTimeout(() => {
      setShowStats(true);
      animateStats();
    }, 800);
  };

  const animateStats = () => {
    const targetStats = {
      pace: card.stats?.pace || 50,
      shooting: card.stats?.shooting || 50,
      passing: card.stats?.passing || 50,
      defending: card.stats?.defending || 50,
    };

    const duration = 1200; // ms for full count up
    const steps = 30;
    const stepTime = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      setCountedStats({
        pace: Math.min(Math.round((targetStats.pace / steps) * currentStep), targetStats.pace),
        shooting: Math.min(Math.round((targetStats.shooting / steps) * currentStep), targetStats.shooting),
        passing: Math.min(Math.round((targetStats.passing / steps) * currentStep), targetStats.passing),
        defending: Math.min(Math.round((targetStats.defending / steps) * currentStep), targetStats.defending),
      });

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepTime);
  };

  // Override card stats inside PlayerCard with our animated counting stats
  const cardWithAnimatedStats: PlayerCardData = {
    ...card,
    stats: {
      pace: countedStats.pace,
      shooting: countedStats.shooting,
      passing: countedStats.passing,
      defending: countedStats.defending,
    },
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[500px]">
      {/* 3D Scene Wrapper */}
      <div 
        className="w-64 h-96 [perspective:1000px] cursor-pointer"
        onClick={handleFlip}
      >
        {/* Card Rotator */}
        <div
          className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${
            isFlipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* FACE DOWN (Card Back) */}
          <div className="absolute inset-0 w-full h-full rounded-2xl border-2 border-neutral-700 bg-gradient-to-br from-neutral-900 via-indigo-950 to-neutral-950 p-6 flex flex-col justify-between items-center [backface-visibility:hidden]">
            {/* Design elements for the back of the card */}
            <div className="w-full flex justify-between text-[10px] tracking-widest text-indigo-400 font-bold uppercase">
              <span>FIFA 2026</span>
              <span>Skorio Cards</span>
            </div>
            
            {/* Center Logo Area */}
            <div className="w-28 h-28 rounded-full border-4 border-dashed border-indigo-500/30 flex items-center justify-center relative bg-indigo-950/20 shadow-[0_0_30px_rgba(79,70,229,0.1)]">
              {/* Shimmering Center Crown/Sphere */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 animate-pulse flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                <span className="text-4xl font-black italic tracking-tighter text-white select-none">
                  S
                </span>
              </div>
            </div>

            <div className="text-center">
              <span className="text-xs font-semibold tracking-wider text-indigo-400/80 animate-pulse uppercase">
                Tap to Reveal
              </span>
              <p className="text-[9px] text-zinc-500 mt-1">Unlock World Cup 2026 Player</p>
            </div>
          </div>

          {/* FACE UP (Card Front) */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <PlayerCard card={cardWithAnimatedStats} showStats={showStats} size="md" />

            {/* Particle Effects for Legendary card */}
            {isFlipped && isLegendary && (
              <div className="absolute inset-0 pointer-events-none overflow-visible">
                {particles.map((p) => (
                  <div
                    key={p.id}
                    className="absolute rounded-full bg-gradient-to-t from-amber-400 to-yellow-200 animate-float-particle opacity-80"
                    style={{
                      left: `calc(50% + ${p.x}px)`,
                      top: `calc(50% + ${p.y}px)`,
                      width: `${p.size}px`,
                      height: `${p.size}px`,
                      animationDelay: `${p.delay}s`,
                      boxShadow: "0 0 10px rgba(251,191,36,0.8)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action CTA appears after flip */}
      {isFlipped && (
        <div className="mt-12 flex gap-4">
          {detailsUrl ? (
            <>
              <button
                onClick={onComplete}
                className="px-8 py-3 rounded-full font-bold bg-neutral-800 hover:bg-neutral-700 text-white transition-all duration-300 shadow-[0_4px_20px_rgba(255,255,255,0.1)] cursor-pointer"
              >
                Close
              </button>
              <Link
                href={detailsUrl}
                className="px-8 py-3 rounded-full font-bold bg-white text-stone-950 hover:bg-neutral-200 transition-all duration-300 shadow-[0_4px_20px_rgba(255,255,255,0.2)] cursor-pointer text-center flex items-center justify-center"
              >
                View Details
              </Link>
            </>
          ) : (
            <button
              onClick={onComplete}
              className="px-8 py-3 rounded-full font-bold bg-white text-stone-950 hover:bg-neutral-200 transition-all duration-300 shadow-[0_4px_20px_rgba(255,255,255,0.2)] cursor-pointer"
            >
              {isLegendary ? "Claim Legendary!" : "Continue"}
            </button>
          )}
        </div>
      )}

      {/* Insert keyframe style tag for animations */}
      <style jsx global>{`
        @keyframes shine {
          0% { background-position: -200% -200%; }
          100% { background-position: 200% 200%; }
        }
        @keyframes float-particle {
          0% {
            transform: translateY(0) scale(1) rotate(0deg);
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-120px) scale(0.2) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-float-particle {
          animation: float-particle 2.5s infinite linear;
        }
      `}</style>
    </div>
  );
}
