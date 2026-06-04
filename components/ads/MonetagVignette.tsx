"use client";

import { useEffect, useRef } from "react";

export default function MonetagVignette() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const s = document.createElement("script");
    s.dataset.zone = "11100935";
    s.src = "https://n6wxm.com/vignette.min.js";
    document.body.appendChild(s);
  }, []);

  return null;
}
