"use client";

import { useState } from "react";
import { UI_TEXT } from "@/lib/utils";
import { X, Copy, Check, Send, MessageCircle, Share2, Globe } from "lucide-react";

interface ShareModalProps {
  roomId: string;
  onClose: () => void;
}

/**
 * Окно «Поделиться ссылкой».
 * На мобильных - это Bottom Sheet, на десктопе - центрированная модалка.
 */
export default function ShareModal({ roomId, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const roomLink = typeof window !== "undefined" ? `${window.location.origin}/room/${roomId}` : "";

  const formattedRoomId = roomId.match(/.{1,4}/g)?.join(" ") || roomId;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Copy error:", err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Присоединяйся к звонку в Связи",
          text: "Нажми на ссылку, чтобы войти в видеозвонок:",
          url: roomLink,
        });
      } catch (err) {
        console.error("Native share error:", err);
      }
    }
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(roomLink)}&text=${encodeURIComponent("Присоединяйся к звонку!")}`, "_blank");
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent("Присоединяйся к звонку: " + roomLink)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center animate-fade-in group">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Sheet / Modal Content */}
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-t-[2.5rem] sm:rounded-[2.5rem] bg-[#1c1c1e] p-8 sm:p-10 text-center text-white shadow-[0_-20px_60px_rgba(0,0,0,0.5)] sm:shadow-2xl animate-fade-in-up sm:animate-scale-in"
      >
        {/* Handle for Bottom Sheet on Mobile */}
        <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-white/10 sm:hidden" />

        <button 
          onClick={onClose}
          className="absolute right-6 top-8 sm:top-8 p-1 text-white/40 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <header className="mb-10 text-center sm:text-left">
           <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            {UI_TEXT.shareTitle}
          </h3>
          <p className="text-white/40 text-sm sm:text-base font-medium">
            Отправьте ссылку тем, кого хотите видеть в звонке
          </p>
        </header>

        {/* Copy Area */}
        <div className="relative group mb-8">
           <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4 pl-6 transition-all group-hover:bg-white/10">
              <div className="flex-1 truncate text-left text-white/60 font-mono text-sm">
                {roomLink}
              </div>
              <button
                onClick={handleCopy}
                className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 active:scale-90 ${
                  copied ? "bg-success text-white" : "bg-accent text-white hover:bg-accent-hover"
                }`}
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
           </div>
           {copied && (
             <p className="absolute -bottom-6 left-0 right-0 text-xs font-bold text-success uppercase tracking-widest animate-fade-in">
               {UI_TEXT.shareLinkCopied}
             </p>
           )}
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <ShareButton 
            onClick={shareTelegram} 
            icon={<Send size={24} />} 
            label="Telegram" 
          />
          <ShareButton 
            onClick={shareWhatsApp} 
            icon={<MessageCircle size={24} />} 
            label="WhatsApp" 
          />
          <ShareButton 
            onClick={handleNativeShare} 
            icon={<Share2 size={24} />} 
            label="Поделиться" 
            disabled={typeof navigator !== 'undefined' && !navigator.share}
          />
          <ShareButton 
            onClick={onClose} 
            icon={<Globe size={24} />} 
            label="Браузер" 
          />
        </div>

        {/* Room Info Footer */}
        <footer className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-center gap-4 text-white/30">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest">Код комнаты</span>
            <span className="text-sm font-mono font-bold text-white/60 tracking-wider">
               {formattedRoomId}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ShareButton({ 
  onClick, 
  icon, 
  label, 
  disabled = false 
}: { 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  disabled?: boolean;
}) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/5 text-white/80 hover:bg-white/10 transition-all active:scale-[0.9] disabled:opacity-20 disabled:grayscale"
    >
      <div className="text-accent">{icon}</div>
      <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">{label}</span>
    </button>
  );
}
