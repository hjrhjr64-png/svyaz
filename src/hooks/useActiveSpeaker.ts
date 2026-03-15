"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TrackReferenceOrPlaceholder } from "@livekit/components-react";

interface UseActiveSpeakerProps {
  tracks: TrackReferenceOrPlaceholder[];
  localParticipantId: string;
}

/**
 * Хук для определения активного участника с защитой от быстрого переключения (джитера).
 * Реализует логику:
 * - Задержка переключения (debounce): 600ms
 * - Минимальное время удержания: 2.5s
 * - Ручное закрепление (pin)
 */
export function useActiveSpeaker({ tracks, localParticipantId }: UseActiveSpeakerProps) {
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  
  const lastSwitchTime = useRef<number>(0);
  const switchTimeout = useRef<NodeJS.Timeout | null>(null);
  const currentSpeakerRef = useRef<string | null>(null);

  const getParticipantId = (track: TrackReferenceOrPlaceholder) => track.participant.identity;

  const switchSpeaker = useCallback((id: string) => {
    const now = Date.now();
    const timeSinceLastSwitch = now - lastSwitchTime.current;
    
    // Если прошло меньше 2.5с с последнего переключения — не дергаем (Hold Time)
    if (timeSinceLastSwitch < 2500 && activeSpeakerId !== null) {
      return;
    }

    setActiveSpeakerId(id);
    currentSpeakerRef.current = id;
    lastSwitchTime.current = now;
  }, [activeSpeakerId]);

  useEffect(() => {
    // Если один участник — он всегда активный
    if (tracks.length === 1) {
      const id = getParticipantId(tracks[0]);
      if (activeSpeakerId !== id) {
        setActiveSpeakerId(id);
      }
      return;
    }

    // Ищем говорящего (исключаем локального, если есть другие)
    const remoteSpeakers = tracks.filter(
      (t) => t.participant.isSpeaking && t.participant.identity !== localParticipantId
    );

    const speakerCandidate = remoteSpeakers.length > 0 
      ? getParticipantId(remoteSpeakers[0]) 
      : null;

    if (speakerCandidate && speakerCandidate !== currentSpeakerRef.current) {
      // Очищаем старый таймаут (debounce)
      if (switchTimeout.current) clearTimeout(switchTimeout.current);

      // Ждем 600мс перед переключением (Debounce)
      switchTimeout.current = setTimeout(() => {
        switchSpeaker(speakerCandidate);
      }, 600);
    }

    return () => {
      if (switchTimeout.current) clearTimeout(switchTimeout.current);
    };
  }, [tracks, localParticipantId, switchSpeaker, activeSpeakerId]);

  // Возвращаем итогового "главного" участника
  const focusId = pinnedId || activeSpeakerId || (tracks.length > 0 ? getParticipantId(tracks[0]) : null);

  return {
    focusId,
    pinnedId,
    setPinnedId,
    togglePin: (id: string) => setPinnedId(current => current === id ? null : id)
  };
}
