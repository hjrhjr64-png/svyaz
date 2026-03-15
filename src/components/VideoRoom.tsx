"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useTracks,
  useRoomContext,
  useConnectionState,
} from "@livekit/components-react";
import { Track, ConnectionState, ConnectionQuality } from "livekit-client";
import ControlBar from "./ControlBar";
import ParticipantTile from "./ParticipantTile";
import ShareModal from "./ShareModal";
import { UI_TEXT } from "@/lib/utils";
import { useActiveSpeaker } from "@/hooks/useActiveSpeaker";
import StatusIndicator, { StatusLayout, StatusType } from "./StatusIndicator";
import { Users, ShieldCheck } from "lucide-react";

interface VideoRoomProps {
  token: string;
  roomId: string;
  serverUrl: string;
  onDisconnect: () => void;
  videoEnabled?: boolean;
  audioEnabled?: boolean;
}

export default function VideoRoom({
  token,
  roomId,
  serverUrl,
  onDisconnect,
  videoEnabled = true,
  audioEnabled = true,
}: VideoRoomProps) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      video={videoEnabled}
      audio={audioEnabled}
      // Убираем автоматический onDisconnected, чтобы при ошибке подключения 
      // мы могли увидеть экран ошибки, а не вылетать на главную.
      data-lk-theme="default"
      className="flex h-screen-safe w-full flex-col bg-black overflow-hidden"
    >
      <RoomContent roomId={roomId} onDisconnect={onDisconnect} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function RoomContent({
  roomId,
  onDisconnect,
}: {
  roomId: string;
  onDisconnect: () => void;
}) {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const { 
    localParticipant, 
    isScreenShareEnabled, 
    lastMicrophoneError, 
    lastCameraError 
  } = useLocalParticipant();
  
  const [showShareModal, setShowShareModal] = useState(false);
  const [isUiVisible, setIsUiVisible] = useState(true);
  const [toast, setToast] = useState<{ title: string; type: StatusType } | null>(null);
  const [isEnded, setIsEnded] = useState(false);
  const [hadParticipants, setHadParticipants] = useState(false);
  
  const uiTimeoutRef = useRef<NodeJS.Timeout|null>(null);

  // Камера и экран
  const cameraTracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const participantCount = cameraTracks.length;

  // Логика автоскрытия UI
  const resetUiTimeout = useCallback(() => {
    setIsUiVisible(true);
    if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    uiTimeoutRef.current = setTimeout(() => {
      // Скрываем только если звонок активен и нет открытых модалок
      if (connectionState === ConnectionState.Connected && !showShareModal && participantCount > 1) {
        setIsUiVisible(false);
      }
    }, 4000);
  }, [connectionState, showShareModal, participantCount]);

  useEffect(() => {
    resetUiTimeout();
    return () => { if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current); };
  }, [resetUiTimeout]);

  // Следим за участниками
  useEffect(() => {
    if (cameraTracks.length > 1) setHadParticipants(true);
  }, [cameraTracks.length]);

  // Тосты
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Активный спикер
  const { focusId, pinnedId, togglePin } = useActiveSpeaker({
    tracks: cameraTracks,
    localParticipantId: localParticipant.identity,
  });

  // Авто-показ модалки при входе в пустую комнату
  useEffect(() => {
    if (connectionState === ConnectionState.Connected && participantCount === 1) {
      setShowShareModal(true);
    }
  }, [connectionState, participantCount]);

  const toggleMic = useCallback(() => {
    const newState = !localParticipant.isMicrophoneEnabled;
    localParticipant.setMicrophoneEnabled(newState);
    setToast({ title: newState ? UI_TEXT.micOn : UI_TEXT.micOff, type: "info" });
    resetUiTimeout();
  }, [localParticipant, resetUiTimeout]);

  const toggleCamera = useCallback(() => {
    const newState = !localParticipant.isCameraEnabled;
    localParticipant.setCameraEnabled(newState);
    setToast({ title: newState ? UI_TEXT.cameraOn : UI_TEXT.cameraOff, type: "info" });
    resetUiTimeout();
  }, [localParticipant, resetUiTimeout]);

  const handleDisconnect = useCallback(() => {
    room.disconnect();
    setIsEnded(true);
  }, [room]);

  const renderStatus = () => {
    if (isEnded) return (
      <StatusIndicator
        layout="card"
        type="info"
        title={UI_TEXT.callFinished}
        subtitle={UI_TEXT.callFinishedSubtitle}
        primaryAction={{ label: UI_TEXT.createRoom, onClick: () => window.location.href = "/" }}
      />
    );
    if (connectionState === ConnectionState.Connecting) return (
      <StatusIndicator layout="card" type="info" title={UI_TEXT.connecting} subtitle={UI_TEXT.connectingSubtitle} />
    );
    if (lastCameraError) return (
      <StatusIndicator
        layout="card" type="error" title={UI_TEXT.noCameraAccess} subtitle={UI_TEXT.noCameraAccessSubtitle}
        primaryAction={{ label: UI_TEXT.retry, onClick: () => window.location.reload() }}
      />
    );
    if (connectionState === ConnectionState.Reconnecting) return (
      <StatusIndicator layout="card" type="warning" title={UI_TEXT.reconnecting} subtitle={UI_TEXT.reconnectingSubtitle} />
    );
    if (connectionState === ConnectionState.Disconnected) return (
      <StatusIndicator
        layout="card" type="error" title={UI_TEXT.connectError} subtitle={UI_TEXT.connectErrorSubtitle}
        primaryAction={{ label: UI_TEXT.retry, onClick: () => window.location.reload() }}
      />
    );
    if (participantCount === 1) {
      const isWaiting = !hadParticipants;
      return (
        <StatusIndicator
          layout="banner" type="info"
          title={isWaiting ? UI_TEXT.waitingForOthers : UI_TEXT.onlyYou}
          subtitle={isWaiting ? UI_TEXT.waitingSubtitle : UI_TEXT.onlyYouSubtitle}
          primaryAction={{ label: UI_TEXT.invite, onClick: () => setShowShareModal(true) }}
        />
      );
    }
    return null;
  };

  const currentFocusTrack = cameraTracks.find(t => t.participant.identity === (pinnedId || focusId)) || cameraTracks[0];
  const otherTracks = cameraTracks.filter(t => t.participant.identity !== currentFocusTrack?.participant.identity);
  const localTrack = cameraTracks.find(t => t.participant.identity === localParticipant.identity);

  return (
    <div 
      className="relative flex h-full w-full flex-col overflow-hidden bg-black"
      onClick={resetUiTimeout}
    >
      {/* 1. Главное видео (Speaker Focus) */}
      <div className="flex-1 relative overflow-hidden">
        {currentFocusTrack && (
          <div className="absolute inset-0 transition-all duration-700 ease-in-out">
            <ParticipantTile
              trackRef={currentFocusTrack}
              isLocal={currentFocusTrack.participant.identity === localParticipant.identity}
              isPinned={!!pinnedId}
            />
          </div>
        )}

        {/* 2. Плавающее свое видео (только если есть другие и не в фокусе) */}
        {participantCount > 1 && localTrack && currentFocusTrack?.participant.identity !== localParticipant.identity && (
          <div className="absolute right-4 top-20 z-30 w-28 sm:w-40 aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 transition-all active:scale-95 duration-500">
            <ParticipantTile trackRef={localTrack} isLocal={true} />
          </div>
        )}

        {/* 3. Горизонтальная лента других участников (снизу) */}
        {participantCount > 2 && (
          <div className={`absolute bottom-24 left-0 right-0 z-20 flex justify-center gap-2 overflow-x-auto px-4 pb-4 transition-all duration-500 ${isUiVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
            {otherTracks.filter(t => t.participant.identity !== localParticipant.identity).map((trackRef) => (
              <div 
                key={trackRef.participant.identity}
                className="h-24 w-18 flex-shrink-0 overflow-hidden rounded-xl shadow-lg ring-1 ring-white/10"
                onClick={(e) => { e.stopPropagation(); togglePin(trackRef.participant.identity); }}
              >
                <ParticipantTile trackRef={trackRef} isLocal={false} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Навигация (Header) */}
      <header className={`absolute top-0 left-0 right-0 z-40 flex items-center justify-between p-4 px-6 transition-all duration-500 bg-gradient-to-b from-black/60 to-transparent ${isUiVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-lg">
             <ShieldCheck size={18} className="text-white" />
           </div>
           <h1 className="text-lg font-bold text-white tracking-tight">Связь</h1>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
          <Users size={14} className="text-white/60" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">{participantCount}</span>
        </div>
      </header>

      {/* 5. Контролы (Bottom) */}
      <div className={`absolute bottom-0 left-0 right-0 z-40 transition-all duration-500 ${isUiVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="pb-safe pt-8 bg-gradient-to-t from-black/80 to-transparent">
          <ControlBar
            isMicEnabled={localParticipant.isMicrophoneEnabled}
            isCameraEnabled={localParticipant.isCameraEnabled}
            isScreenShareEnabled={isScreenShareEnabled}
            layoutMode="speaker" // Всегда спикер на мобилках
            onToggleMic={toggleMic}
            onToggleCamera={toggleCamera}
            onToggleScreenShare={() => localParticipant.setScreenShareEnabled(!isScreenShareEnabled)}
            onToggleLayout={() => {}} // Убрали из мобилки
            onDisconnect={handleDisconnect}
            onShowShare={() => setShowShareModal(true)}
          />
        </div>
      </div>

      {/* Индикаторы и модалки */}
      {renderStatus()}
      {toast && <StatusIndicator layout="toast" type={toast.type} title={toast.title} onHide={() => setToast(null)} />}
      
      {showShareModal && (
        <ShareModal 
          roomId={roomId} 
          onClose={() => setShowShareModal(false)} 
        />
      )}
    </div>
  );
}
