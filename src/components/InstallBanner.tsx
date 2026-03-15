"use client";

import { useState, useEffect } from "react";
import { UI_TEXT } from "@/lib/utils";

/**
 * Баннер установки приложения.
 * Показывается мягко, если приложение еще не установлено.
 */
export default function InstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    // Проверяем, не установлено ли уже приложение
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    
    // Проверяем, не закрывал ли пользователь баннер недавно
    const isDismissed = localStorage.getItem("install-banner-dismissed");
    
    if (isStandalone || isDismissed) return;

    // Слушаем событие установки (Android/Desktop)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Показываем баннер через 5 секунд после загрузки, чтобы не спамить
      setTimeout(() => setIsVisible(true), 5000);
    };

    // Определение iOS
    const isIosDevice = /iPhone|iPad|iPod/.test(navigator.userAgent);
    setIsIos(isIosDevice);

    if (isIosDevice) {
       // Для iOS показываем баннер через 10 секунд (более мягко)
       setTimeout(() => setIsVisible(true), 10000);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (isIos) {
      setShowIosInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Запоминаем отказ на 7 дней
    localStorage.setItem("install-banner-dismissed", Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-6 right-6 z-[150] flex flex-col items-center sm:left-auto sm:right-10 sm:w-80">
      <div className="w-full overflow-hidden rounded-[2rem] bg-black/60 p-6 text-white shadow-2xl backdrop-blur-3xl ring-1 ring-white/10 animate-fade-in-up">
        {showIosInstructions ? (
          <div className="space-y-4 animate-fade-in">
             <div className="flex justify-between items-start">
               <h3 className="text-lg font-bold">{UI_TEXT.installTitle}</h3>
               <button onClick={handleDismiss} className="text-white/40 hover:text-white">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                 </svg>
               </button>
             </div>
             <div className="space-y-3 py-2 text-sm text-white/80">
               <div className="flex items-center gap-3">
                 <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold">1</div>
                 <p>{UI_TEXT.installIosStep1}</p>
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                 </svg>
               </div>
               <div className="flex items-center gap-3">
                 <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold">2</div>
                 <p>{UI_TEXT.installIosStep2}</p>
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                 </svg>
               </div>
             </div>
             <button 
              onClick={handleDismiss}
              className="w-full rounded-2xl bg-white/10 py-3 text-sm font-bold transition-all hover:bg-white/20"
            >
              {UI_TEXT.complete}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#007aff] shadow-lg shadow-accent/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold leading-tight">{UI_TEXT.installTitle}</h3>
                <p className="text-xs text-white/50">{UI_TEXT.installSubtitle}</p>
              </div>
            </div>

            <div className="flex gap-2 text-sm font-bold">
              <button 
                onClick={handleInstall}
                className="flex-1 rounded-2xl bg-accent py-3 shadow-lg shadow-accent/20 transition-all hover:bg-accent-hover hover:scale-[1.02] active:scale-95"
              >
                {UI_TEXT.installAdd}
              </button>
              <button 
                onClick={handleDismiss}
                className="rounded-2xl bg-white/5 px-4 py-3 text-white/40 transition-all hover:bg-white/10 active:scale-95"
              >
                {UI_TEXT.installNotNow}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
