"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellOff, X, Trophy } from "lucide-react";

interface Notification {
  id: number;
  title: string;
  body: string;
  created_at: string;
}

export default function NotificationBar() {
  const [pushSupported, setPushSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<number[]>([]);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    setPushSupported(supported);

    if (supported) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => setSubscribed(!!sub));
      });
    }

    // Fetch unread in-app notifications
    fetch("/api/notifications/unread")
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications || []))
      .catch(() => {});
  }, []);

  const subscribe = async () => {
    try {
      const keyRes = await fetch("/api/notifications/vapid-key");
      const { publicKey } = await keyRes.json();

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      setSubscribed(true);
    } catch (err) {
      console.error("Push subscribe failed:", err);
    }
  };

  const unsubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await fetch("/api/notifications/subscribe", { method: "DELETE" });
      setSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    }
  };

  const dismissNotification = async (id: number) => {
    setDismissed((prev) => [...prev, id]);
    await fetch("/api/notifications/unread", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    }).catch(() => {});
  };

  const visibleNotifications = notifications.filter((n) => !dismissed.includes(n.id));

  return (
    <>
      {/* Bell icon for header — exported as separate element via portal pattern */}
      {pushSupported && (
        <button
          onClick={subscribed ? unsubscribe : subscribe}
          className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
            subscribed
              ? "text-violet-400 bg-violet-500/10 border border-violet-500/25 hover:bg-violet-500/20"
              : "text-white/40 hover:text-white/70 hover:bg-white/5"
          }`}
          title={subscribed ? "Unsubscribe from notifications" : "Subscribe to match notifications"}
        >
          {subscribed ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </button>
      )}

      {/* In-app notification banners */}
      {visibleNotifications.length > 0 && (
        <div className="fixed top-16 left-0 right-0 z-40 flex flex-col gap-1 px-4 pt-2">
          {visibleNotifications.map((n) => (
            <div
              key={n.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/25 bg-amber-500/10 backdrop-blur-xl shadow-lg"
              style={{ animation: "slideDown 0.3s ease both" }}
            >
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-300">{n.title}</p>
                <p className="text-xs text-white/60 truncate">{n.body}</p>
              </div>
              <button
                onClick={() => dismissNotification(n.id)}
                className="text-white/30 hover:text-white/70 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
