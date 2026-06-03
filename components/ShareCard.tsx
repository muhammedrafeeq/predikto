"use client";

import React, { useRef, useState } from "react";
import { Share2, Loader2 } from "lucide-react";

interface ShareCardProps {
  cardRef: React.RefObject<HTMLDivElement | null>;
  whatsappText: string;
  label?: string;
  className?: string;
}

export default function ShareCard({ cardRef, whatsappText, label, className }: ShareCardProps) {
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!cardRef.current || sharing) return;
    setSharing(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0a0a0f",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png", 0.95)
      );
      const file = new File([blob], "predikto-share.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: whatsappText });
      } else {
        // Fallback: open WhatsApp with text only
        window.open(
          `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
          "_blank"
        );
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        // Last resort: WhatsApp text-only
        window.open(
          `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
          "_blank"
        );
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      className={className ?? "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#25D366]/15 border border-[#25D366]/30 hover:bg-[#25D366]/25 transition-all active:scale-95 disabled:opacity-50"}
    >
      {sharing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Share2 className="w-4 h-4 text-[#25D366]" />
      )}
      {label ?? "Share"}
    </button>
  );
}
