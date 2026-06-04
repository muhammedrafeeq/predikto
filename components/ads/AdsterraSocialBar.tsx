"use client";

import { useEffect, useRef } from "react";
import { useAdEnabled } from "@/lib/AdContext";

export default function AdsterraSocialBar() {
  const enabled = useAdEnabled("ad_social_bar");
  const loaded = useRef(false);

  useEffect(() => {
    if (!enabled || loaded.current) return;
    loaded.current = true;

    const script = document.createElement("script");
    script.src = "https://pl29633910.effectivecpmnetwork.com/12/70/2e/12702e41ca6bc90800ba31517bb834b5.js";
    document.body.appendChild(script);
  }, [enabled]);

  return null;
}
