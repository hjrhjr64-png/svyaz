"use client";

import { useState, useEffect } from "react";
import { UI_TEXT } from "@/lib/utils";

/**
 * Экран «Нет интернета».
 * Показывается автоматически, когда браузер сообщает об отсутствии сети.
 */
export default function OfflineStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Начальная проверка
    if (!navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background p-6 animate-fade-in">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-danger/10 text-danger mb-8">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold mb-3 text-center">
        {UI_TEXT.offlineTitle}
      </h2>
      <p className="text-white/50 text-center max-w-xs mb-10">
        {UI_TEXT.offlineSubtitle}
      </p>

      <button 
        onClick={() => window.location.reload()}
        className="rounded-full bg-accent px-8 py-4 font-bold text-white transition-all hover:bg-accent-hover active:scale-95"
      >
        {UI_TEXT.retry}
      </button>
    </div>
  );
}
