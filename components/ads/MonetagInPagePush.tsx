"use client";

import { useEffect, useRef } from "react";

export default function MonetagInPagePush() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const s = document.createElement("script");
    s.dataset.zone = "11100933";
    s.src = "https://nap5k.com/tag.min.js";
    document.body.appendChild(s);
  }, []);

  return null;
}
