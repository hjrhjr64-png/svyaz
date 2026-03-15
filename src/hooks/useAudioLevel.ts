"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Хук для отслеживания уровня громкости аудио-трека.
 * Возвращает значение от 0 до 1.
 */
export function useAudioLevel(track: MediaStreamTrack | undefined) {
  const [level, setLevel] = useState(0);
  const animationFrameRef = useRef<number>(null);
  const analyzerRef = useRef<AnalyserNode>(null);
  const audioContextRef = useRef<AudioContext>(null);

  useEffect(() => {
    if (!track || track.kind !== "audio" || track.readyState !== "live") {
      setLevel(0);
      return;
    }

    let isMonitorActive = true;

    async function startMonitoring() {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        const analyzer = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(new MediaStream([track].filter(Boolean) as MediaStreamTrack[]));
        
        analyzer.fftSize = 256;
        source.connect(analyzer);
        
        audioContextRef.current = audioContext;
        analyzerRef.current = analyzer;

        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
          if (!isMonitorActive) return;

          analyzer.getByteFrequencyData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          
          const average = sum / bufferLength;
          // Нормализуем значение (примерно до 1.0, 128 - это половина шкалы в ByteFrequencyData)
          // Уменьшаем делитель для повышения чувствительности (было 64)
          const normalized = Math.min(1, average / 48); 
          
          setLevel(normalized);
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };

        updateLevel();
      } catch (err) {
        console.error("Error monitoring audio level:", err);
      }
    }

    startMonitoring();

    return () => {
      isMonitorActive = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, [track]);

  return level;
}
