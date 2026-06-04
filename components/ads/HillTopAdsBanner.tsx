"use client";

import { useEffect, useRef } from "react";
import { useAdEnabled } from "@/lib/AdContext";

export default function HillTopAdsBanner() {
  const enabled = useAdEnabled("ad_hilltop_banner");
  const loaded = useRef(false);

  useEffect(() => {
    if (!enabled || loaded.current) return;
    loaded.current = true;

    const s = document.createElement("script");
    s.settings = {};
    s.src = "//untimely-hello.com/b/X.Vgs-dMGXlv0KYLWYcn/OebmC9pueZ/UOlCkkP/TScNxwMzDqgywKNVTpcBtfNrzbEXwcOKDxA_2GMwQq";
    s.async = true;
    s.referrerPolicy = "no-referrer-when-downgrade";
    document.body.appendChild(s);
  }, [enabled]);

  return null;
}
