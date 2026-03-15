"use client";

import { useRef, useEffect } from "react";
import { Track } from "livekit-client";
import {
  useLocalParticipant,
  useTracks,
  VideoTrack,
  AudioTrack,
} from "@livekit/components-react";
import { UI_TEXT } from "@/lib/utils";
import { MicOff } from "lucide-react";

/**
 * Плитка одного участника.
 * Показывает видео (если есть) или аватар с инициалом.
 */
export default function ParticipantTile({
  trackRef,
  isLocal = false,
  isPinned = false,
  onTogglePin,
}: {
  trackRef: {
    participant: {
      identity: string;
      name?: string;
      isSpeaking: boolean;
      isMicrophoneEnabled: boolean;
      isCameraEnabled: boolean;
    };
    source: Track.Source;
    publication?: any;
  };
  isLocal?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
}) {
  const participant = trackRef.participant;
  const isScreenShare = trackRef.source === Track.Source.ScreenShare;
  const displayName = participant.name || participant.identity;
  const initial = displayName.charAt(0).toUpperCase();
  
  // Видео есть, если включена камера (для обычного видео) или это поток экрана
  const hasVideo = isScreenShare || participant.isCameraEnabled;
  const hasMic = participant.isMicrophoneEnabled;

  return (
    <div
      className={`animate-scale-in group relative flex items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl bg-[#111] transition-all duration-500 ease-in-out ${
        participant.isSpeaking && !isScreenShare ? "ring-2 ring-accent shadow-[0_0_20px_rgba(0,122,255,0.4)]" : "ring-1 ring-white/10"
      }`}
      style={{
        width: "100%",
        height: "100%",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
      }}
    >
      {/* Видео */}
      {hasVideo ? (
        <VideoTrack
          trackRef={trackRef as any}
          className={`absolute inset-0 h-full w-full ${isScreenShare ? "object-contain" : "object-cover scale-x-[-1]"}`}
        />
      ) : (
        /* Аватар */
        <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-white/5 to-white/[0.02]">
          <div
            className="flex h-16 w-16 sm:h-24 sm:w-24 items-center justify-center rounded-full text-2xl sm:text-4xl font-bold text-white shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #007aff 0%, #5856d6 100%)",
            }}
          >
            {initial}
          </div>
        </div>
      )}

      {/* Индикаторы (Сверху) */}
      <div className="absolute top-2 right-2 flex gap-1.5">
          {onTogglePin && (
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
              className={`flex h-8 w-8 items-center justify-center rounded-xl bg-black/40 text-white backdrop-blur-md transition-all active:scale-90 ${
                isPinned ? "opacity-100 ring-1 ring-white/20" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5">
                <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
              </svg>
            </button>
          )}
      </div>

      {/* Инфо (Снизу) */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-3 pt-8">
        <div className="flex items-center gap-2">
          {isScreenShare && (
            <div className="bg-accent px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white">
              Экран
            </div>
          )}
          
          <span className="text-[13px] sm:text-sm font-bold text-white truncate drop-shadow-md">
            {displayName} {isLocal && <span className="opacity-60 font-medium">({UI_TEXT.you})</span>}
          </span>

          {!hasMic && (
            <MicOff size={14} className="text-danger flex-shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
}
