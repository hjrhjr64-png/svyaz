"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { UI_TEXT, MAX_NAME_LENGTH } from "@/lib/utils";
import { useAudioLevel } from "@/hooks/useAudioLevel";
import { usePersistentName } from "@/hooks/usePersistentName";
import { Mic, MicOff, Video, VideoOff, ShieldCheck, UserX } from "lucide-react";

interface PreJoinProps {
  onJoin: (name: string, videoEnabled: boolean, audioEnabled: boolean) => void;
  isLoading: boolean;
  error?: string;
}

/**
 * Окно предпросмотра перед входом: mobile-first дизайн.
 * На мобильных - видео во весь экран, на десктопе - аккуратный блок.
 */
export default function PreJoin({ onJoin, isLoading, error: externalError }: PreJoinProps) {
  const { name: savedName, persistName, clearName, hasSavedName, isLoaded } = usePersistentName();
  const [name, setName] = useState("");
  const [localError, setLocalError] = useState("");
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [audioTrack, setAudioTrack] = useState<MediaStreamTrack | null>(null);

  const audioLevel = useAudioLevel(audioTrack ?? undefined);

  useEffect(() => {
    if (isLoaded && savedName) {
      setName(savedName);
    }
  }, [isLoaded, savedName]);

  useEffect(() => {
    async function setupMedia() {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (videoEnabled || audioEnabled) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: videoEnabled ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            } : false,
            audio: true,
          });
          
          if (!audioEnabled) {
            stream.getAudioTracks().forEach(t => t.enabled = false);
          }

          streamRef.current = stream;
          setAudioTrack(stream.getAudioTracks()[0] || null);

          if (videoRef.current && videoEnabled) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Camera access error:", err);
          setVideoEnabled(false);
          setAudioTrack(null);
        }
      } else {
        streamRef.current = null;
        setAudioTrack(null);
      }
    }

    setupMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoEnabled, audioEnabled]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setLocalError(UI_TEXT.enterName);
      return;
    }
    if (trimmedName.length > MAX_NAME_LENGTH) {
      setLocalError(UI_TEXT.nameTooLong);
      return;
    }
    persistName(trimmedName);
    onJoin(trimmedName, videoEnabled, audioEnabled);
  };

  const activeError = localError || externalError;

  return (
    <div className="h-screen-safe w-full bg-black relative flex flex-col overflow-hidden">
      {/* 1. Видео превью (Задний фон на мобильных) */}
      <div className="absolute inset-0 z-0 bg-[#111]">
        {videoEnabled ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover scale-x-[-1]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-white/10 ring-1 ring-white/10">
              <VideoOff size={48} />
            </div>
            <p className="text-white/30 text-xs font-bold uppercase tracking-[0.2em]">
              {UI_TEXT.cameraOff}
            </p>
          </div>
        )}
        {/* Затемнение для читаемости UI поверх видео */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-10" />
      </div>

      {/* 2. Контент поверх видео */}
      <div className="relative z-20 flex-1 flex flex-col p-6 sm:p-12">
        {/* Заголовок */}
        <div className="animate-fade-in text-center mt-4 sm:mt-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight drop-shadow-lg">
            {hasSavedName ? UI_TEXT.checkName : UI_TEXT.preJoinTitle}
          </h1>
          <p className="text-white/70 text-sm sm:text-lg mt-2 font-medium">
            {UI_TEXT.nameDescription}
          </p>
        </div>

        {/* Нижняя часть с вводом и контролами */}
        <div className="mt-auto space-y-8 animate-fade-in-up">
          {/* Контролы Mic/Cam */}
          <div className="flex justify-center gap-6">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`relative group flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 backdrop-blur-md border active:scale-95 ${
                audioEnabled 
                  ? "bg-white/15 text-white border-white/20" 
                  : "bg-danger text-white border-transparent shadow-lg shadow-danger/20"
              }`}
            >
              {audioEnabled && (
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-white/20 rounded-b-2xl transition-all duration-100 ease-out pointer-events-none"
                  style={{ height: `${Math.min(100, audioLevel * 150)}%` }}
                />
              )}
              <div className="relative z-10">
                {audioEnabled ? <Mic size={28} /> : <MicOff size={28} />}
              </div>
            </button>

            <button
              onClick={() => setVideoEnabled(!videoEnabled)}
              className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 backdrop-blur-md border active:scale-95 ${
                videoEnabled 
                  ? "bg-white/15 text-white border-white/20" 
                  : "bg-danger text-white border-transparent shadow-lg shadow-danger/20"
              }`}
            >
              {videoEnabled ? <Video size={28} /> : <VideoOff size={28} />}
            </button>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto space-y-4">
            <div className="relative group">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (localError) setLocalError("");
                }}
                placeholder={UI_TEXT.namePlaceholder}
                className="w-full h-16 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 px-6 text-xl text-center text-white outline-none transition-all placeholder:text-white/30 focus:border-white/30 focus:bg-white/20"
              />
              {hasSavedName && (
                <button
                  type="button"
                  onClick={clearName}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/30 hover:text-white/60 transition-colors"
                >
                  <UserX size={20} />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="w-full h-16 bg-accent text-white rounded-2xl text-xl font-bold shadow-xl shadow-accent/30 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {isLoading ? "Подключение…" : UI_TEXT.joinCall}
            </button>

            {/* Защита */}
            <div className="flex items-center justify-center gap-2 text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">
              <ShieldCheck size={14} className="text-success" />
              Звонок защищён
            </div>

            {activeError && (
              <div className="animate-scale-in bg-danger/20 border border-danger/30 p-3 rounded-xl text-danger text-sm font-medium text-center">
                {activeError}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
