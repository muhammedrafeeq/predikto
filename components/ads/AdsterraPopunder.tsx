"use client";

import { useEffect, useRef } from "react";

export default function AdsterraPopunder() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const script = document.createElement("script");
    script.src = "https://pl29633838.effectivecpmnetwork.com/f5/86/32/f58632f4b198bccd9a74c623997ccf0b.js";
    document.body.appendChild(script);
  }, []);

  return null;
}
