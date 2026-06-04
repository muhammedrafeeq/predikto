"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type AdSettings = Record<string, boolean>;

const AdContext = createContext<AdSettings>({});

export function AdProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AdSettings>({});

  useEffect(() => {
    fetch("/api/ads")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSettings(data.settings);
      })
      .catch(() => {});
  }, []);

  return <AdContext.Provider value={settings}>{children}</AdContext.Provider>;
}

export function useAdEnabled(key: string): boolean {
  const settings = useContext(AdContext);
  // default true while loading (avoids layout shift on first render)
  return settings[key] !== false;
}
