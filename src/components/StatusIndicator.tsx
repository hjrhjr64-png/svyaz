"use client";

import { useEffect, useState } from "react";
import { UI_TEXT } from "@/lib/utils";

export type StatusType = "info" | "warning" | "error";
export type StatusLayout = "card" | "banner" | "toast";

interface StatusIndicatorProps {
  type?: StatusType;
  layout?: StatusLayout;
  title: string;
  subtitle?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  autoHideMs?: number;
  onHide?: () => void;
}

/**
 * Продвинутый индикатор состояния звонка.
 * Поддерживает три формата: Карточка (Card), Плашка (Banner) и Уведомление (Toast).
 */
export default function StatusIndicator({
  type = "info",
  layout = "card",
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  autoHideMs,
  onHide,
}: StatusIndicatorProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHideMs) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onHide?.();
      }, autoHideMs);
      return () => clearTimeout(timer);
    }
  }, [autoHideMs, onHide]);

  if (!isVisible) return null;

  // Визуальные темы
  const themes = {
    info: {
      bg: "bg-white/95", // Solid light background
      text: "text-neutral-900", // Dark text
      accent: "bg-accent",
      shadow: "shadow-2xl shadow-accent/10",
      border: "border-neutral-200",
    },
    warning: {
      bg: "bg-[#FFF9F2]/98",
      text: "text-[#8A5100]", // Darker gold/brown text for better contrast
      accent: "bg-[#FF9500]",
      shadow: "shadow-2xl shadow-[#FF9500]/10",
      border: "border-[#FF9500]/30",
    },
    error: {
      bg: "bg-[#FFF2F2]/98",
      text: "text-[#991B1B]", // Darker red text
      accent: "bg-[#FF3B30]",
      shadow: "shadow-2xl shadow-[#FF3B30]/10",
      border: "border-[#FF3B30]/30",
    },
  };

  const theme = themes[type];

  // Рендерим в зависимости от лейаута
  if (layout === "toast") {
    return (
      <div className="fixed top-8 left-1/2 z-[100] w-auto max-w-[90vw] -translate-x-1/2 animate-scale-in">
        <div className={`flex items-center gap-3 px-6 py-3.5 rounded-full border ${theme.bg} ${theme.text} ${theme.border} ${theme.shadow} backdrop-blur-xl`}>
          <div className={`h-2 w-2 rounded-full ${theme.accent} animate-pulse`} />
          <span className="text-sm font-medium tracking-tight whitespace-nowrap">{title}</span>
        </div>
      </div>
    );
  }

  if (layout === "banner") {
    return (
      <div className="fixed top-20 left-1/2 z-[90] w-auto max-w-[90vw] -translate-x-1/2 animate-slide-down">
        <div className={`flex flex-col items-center gap-1.5 px-8 py-4 rounded-[2rem] border ${theme.bg} ${theme.text} ${theme.border} ${theme.shadow} backdrop-blur-xl`}>
          <h3 className="text-base font-semibold text-center">{title}</h3>
          {subtitle && <p className="text-xs opacity-70 text-center max-w-[280px] leading-relaxed">{subtitle}</p>}
          {primaryAction && (
            <button 
              onClick={primaryAction.onClick}
              className={`mt-2 px-5 py-2 rounded-full text-xs font-bold transition-transform active:scale-95 ${theme.accent} text-white`}
            >
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>
    );
  }

  // default: layout === "card"
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-md p-6 animate-fade-in">
      <div className={`w-full max-w-sm overflow-hidden rounded-[3rem] p-10 text-center border ${theme.bg} ${theme.text} ${theme.border} ${theme.shadow} backdrop-blur-2xl animate-scale-in`}>
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
           {/* Декоративный элемент в зависимости от типа */}
           <div className={`h-4 w-4 rounded-full ${theme.accent} ${type === 'info' ? 'animate-pulse' : ''}`} />
        </div>
        
        <h2 className="mb-3 text-2xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="mb-8 text-sm leading-relaxed opacity-70">{subtitle}</p>}
        
        <div className="flex flex-col gap-3">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className={`h-14 w-full rounded-2xl text-base font-bold transition-all active:scale-95 ${theme.accent} text-white shadow-lg`}
            >
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="h-14 w-full rounded-2xl text-base font-medium transition-all hover:bg-white/5 active:scale-95"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
