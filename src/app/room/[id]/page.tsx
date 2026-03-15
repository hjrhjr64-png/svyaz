"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import PreJoin from "@/components/PreJoin";
import { UI_TEXT } from "@/lib/utils";

// Lazy-load VideoRoom для уменьшения initial bundle
const VideoRoom = dynamic(() => import("@/components/VideoRoom"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-muted">Загрузка…</p>
      </div>
    </div>
  ),
});

/**
 * Страница комнаты — /room/[id]
 *
 * Поток:
 * 1. JoinForm → пользователь вводит имя
 * 2. Запрос токена → POST /api/token
 * 3. VideoRoom → подключение к LiveKit
 */
export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialMedia, setInitialMedia] = useState({ video: true, audio: true });

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";

  // Получить токен и подключиться
  const handleJoin = useCallback(
    async (name: string, video: boolean, audio: boolean) => {
      setIsLoading(true);
      setError("");
      setInitialMedia({ video, audio });

      try {
        const res = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            participantName: name,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Ошибка сервера");
        }

        const data = await res.json();
        setToken(data.token);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : UI_TEXT.connectError
        );
      } finally {
        setIsLoading(false);
      }
    },
    [roomId]
  );

  // Отключение → возврат на главную
  const handleDisconnect = useCallback(() => {
    setToken(null);
    router.push("/");
  }, [router]);

  // Если нет токена — показываем форму ввода имени
  if (!token) {
    return (
      <PreJoin onJoin={handleJoin} isLoading={isLoading} error={error} />
    );
  }

  // Если нет URL сервера — показываем ошибку
  if (!serverUrl) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <p className="mb-4 text-lg font-medium text-danger">
            {UI_TEXT.connectError}
          </p>
          <p className="text-sm text-muted">
            NEXT_PUBLIC_LIVEKIT_URL не настроен
          </p>
          <button
            onClick={() => setToken(null)}
            className="mt-6 cursor-pointer rounded-2xl bg-accent px-6 py-3 text-white transition-all hover:bg-accent-hover active:scale-[0.98]"
          >
            {UI_TEXT.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <VideoRoom
      token={token}
      roomId={roomId}
      serverUrl={serverUrl}
      onDisconnect={handleDisconnect}
      videoEnabled={initialMedia.video}
      audioEnabled={initialMedia.audio}
    />
  );
}
