"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UI_TEXT } from "@/lib/utils";
import { Phone } from "lucide-react";

/**
 * Главная страница — «Связь».
 * Оптимизирована для мобильных устройств.
 */
export default function HomePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinInput, setJoinInput] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setIsCreating(true);
    setError("");
    try {
      const res = await fetch("/api/room", { method: "POST" });
      const data = await res.json();
      if (data.roomId) {
        router.push(`/room/${data.roomId}`);
      } else {
        setError("Не удалось создать комнату");
      }
    } catch {
      setError(UI_TEXT.connectError);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = () => {
    setError("");
    const input = joinInput.trim();
    if (!input) return;

    let roomId = input;
    try {
      const url = new URL(input);
      const parts = url.pathname.split("/");
      const roomIndex = parts.indexOf("room");
      if (roomIndex !== -1 && parts[roomIndex + 1]) {
        roomId = parts[roomIndex + 1];
      }
    } catch {
      // Not a URL
    }

    if (roomId.length < 4) {
      setError("Неверный код комнаты");
      return;
    }

    router.push(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen-safe bg-background flex flex-col items-center justify-center p-6 sm:p-8">
      <div className="w-full max-w-md flex flex-col items-center text-center">
        {/* Логотип и Заголовок */}
        <div className="animate-fade-in flex flex-col items-center mb-12 sm:mb-16">
          <div 
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-[22px] flex items-center justify-center shadow-lg mb-6 sm:mb-8"
            style={{
              background: "linear-gradient(135deg, #007aff 0%, #5856d6 100%)",
              boxShadow: "0 8px 32px rgba(0, 122, 255, 0.25)",
            }}
          >
            <Phone className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
            {UI_TEXT.appName}
          </h1>
          <p className="text-lg sm:text-xl text-muted/80 max-w-[280px] sm:max-w-none">
            {UI_TEXT.appTagline}
          </p>
        </div>

        {/* Главные действия */}
        <div className="w-full space-y-4 animate-fade-in animate-delay-200">
          {!showJoin ? (
            <>
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full py-5 px-8 bg-accent text-white rounded-2xl text-lg font-semibold shadow-md active:scale-[0.98] transition-all hover:bg-accent-hover flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {isCreating ? "Создание…" : UI_TEXT.createRoom}
              </button>
              
              <button
                onClick={() => setShowJoin(true)}
                className="w-full py-5 px-8 bg-surface text-foreground rounded-2xl text-lg font-semibold active:scale-[0.98] transition-all hover:bg-border/50 flex items-center justify-center gap-3"
              >
                {UI_TEXT.joinRoom}
              </button>
            </>
          ) : (
            <div className="animate-scale-in w-full space-y-4">
              <input
                type="text"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder={UI_TEXT.joinRoomPlaceholder}
                autoFocus
                className="w-full rounded-2xl border border-border bg-surface px-6 py-5 text-lg text-foreground outline-none transition-all placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowJoin(false)}
                  className="flex-1 py-5 px-4 bg-surface text-foreground rounded-2xl font-semibold active:scale-[0.98] transition-all"
                >
                  Отмена
                </button>
                <button
                  onClick={handleJoin}
                  disabled={!joinInput.trim()}
                  className="flex-[2] py-5 px-4 bg-foreground text-white rounded-2xl font-semibold active:scale-[0.98] transition-all disabled:opacity-40"
                >
                  Войти
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Ошибка */}
        {error && (
          <p className="animate-fade-in mt-6 text-sm text-danger font-medium leading-relaxed">
            {error}
          </p>
        )}

        {/* Подвал */}
        <div className="relative animate-fade-in animate-delay-300 mt-20 sm:mt-24 flex h-8 items-center justify-center select-none cursor-default group">
          <p className="absolute pointer-events-none transition-all duration-500 ease-in-out group-hover:opacity-0 group-active:opacity-0 text-sm text-muted/60 whitespace-nowrap">
            Без регистрации · Без паролей
          </p>
          <a 
            href="https://artemk.pro/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="absolute opacity-0 transition-all duration-500 ease-in-out group-hover:opacity-100 group-active:opacity-100 text-sm font-semibold text-accent whitespace-nowrap tracking-wide cursor-pointer hover:underline p-2"
          >
            Артём К
          </a>
        </div>
      </div>
    </div>
  );
}
