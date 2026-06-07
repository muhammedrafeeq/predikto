"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import CardReveal from "@/components/cards/CardReveal";
import { PlayerCardData } from "@/lib/cardDrop";

interface RevealPageClientProps {
  cards: PlayerCardData[];
}

export default function RevealPageClient({ cards }: RevealPageClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  const handleComplete = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push("/collection");
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center justify-center">
      <div className="text-center mb-6">
        <span className="text-[10px] bg-indigo-950 border border-indigo-900 text-indigo-400 px-3 py-1 rounded-full font-black tracking-widest uppercase">
          Card Reward {currentIndex + 1} of {cards.length}
        </span>
        <h1 className="text-2xl font-black text-white mt-2">
          Click the card to reveal your player!
        </h1>
      </div>

      <CardReveal
        card={cards[currentIndex]}
        onComplete={handleComplete}
      />
    </div>
  );
}
