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
  const [roomError, setRoomError] = useState<Error | null>(null);

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      video={videoEnabled}
      audio={audioEnabled}
      onError={(err) => setRoomError(err)}
      data-lk-theme="default"
      className="flex h-screen-safe w-full flex-col bg-black overflow-hidden"
    >
      <RoomContent roomId={roomId} onDisconnect={onDisconnect} externalError={roomError} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function RoomContent({
  roomId,
  onDisconnect,
  externalError,
}: {
  roomId: string;
  onDisconnect: () => void;
  externalError: Error | null;
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
  const [layoutMode, setLayoutMode] = useState<"grid" | "speaker">("speaker");
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [timeoutError, setTimeoutError] = useState<string | null>(null);
  
  const uiTimeoutRef = useRef<NodeJS.Timeout|null>(null);

  const cameraTracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const participantCount = cameraTracks.length;

  const resetUiTimeout = useCallback(() => {
    setIsUiVisible(true);
    if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    uiTimeoutRef.current = setTimeout(() => {
      if (connectionState === ConnectionState.Connected && !showShareModal && participantCount > 1) {
        setIsUiVisible(false);
      }
    }, 4000);
  }, [connectionState, showShareModal, participantCount]);

  useEffect(() => {
    resetUiTimeout();
    return () => { if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current); };
  }, [resetUiTimeout]);

  useEffect(() => {
    if (cameraTracks.length > 1) setHadParticipants(true);
  }, [cameraTracks.length]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Логика фокуса и пина
  const { focusId } = useActiveSpeaker({
    tracks: cameraTracks,
    localParticipantId: localParticipant.identity,
  });

  const togglePin = useCallback((identity: string) => {
    setPinnedId(prev => {
      const next = prev === identity ? null : identity;
      if (next) setLayoutMode("speaker");
      return next;
    });
  }, []);

  const toggleLayout = useCallback(() => {
    setLayoutMode(prev => prev === "grid" ? "speaker" : "grid");
    setPinnedId(null);
  }, []);

  useEffect(() => {
    if (connectionState === ConnectionState.Connected) setTimeoutError(null);
  }, [connectionState]);

  useEffect(() => {
    if (connectionState === ConnectionState.Connecting) {
      const timer = setTimeout(() => {
        if (connectionState === ConnectionState.Connecting) {
          setTimeoutError("Превышено время ожидания.");
        }
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [connectionState]);

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

  const handleDisconnect = () => {
    room.disconnect();
    setIsEnded(true);
  };

  const renderStatus = () => {
    if (isEnded) return (
      <StatusIndicator layout="card" type="info" title={UI_TEXT.callFinished} subtitle={UI_TEXT.callFinishedSubtitle}
        primaryAction={{ label: UI_TEXT.createRoom, onClick: () => window.location.href = "/" }}
      />
    );
    if (externalError || timeoutError) return (
      <StatusIndicator layout="card" type="error" title={UI_TEXT.connectError} 
        subtitle={`${UI_TEXT.connectErrorSubtitle}: ${externalError?.message || timeoutError}`}
        primaryAction={{ label: UI_TEXT.retry, onClick: () => window.location.reload() }}
      />
    );
    if (connectionState === ConnectionState.Connecting) return (
      <StatusIndicator layout="card" type="info" title={UI_TEXT.connecting} subtitle={UI_TEXT.connectingSubtitle} />
    );
    if (lastCameraError) return (
      <StatusIndicator layout="card" type="error" title={UI_TEXT.noCameraAccess} subtitle={UI_TEXT.noCameraAccessSubtitle}
        primaryAction={{ label: UI_TEXT.retry, onClick: () => window.location.reload() }}
      />
    );
    if (connectionState === ConnectionState.Disconnected) return (
      <StatusIndicator layout="card" type="error" title={UI_TEXT.connectError} subtitle={UI_TEXT.connectErrorSubtitle}
        primaryAction={{ label: UI_TEXT.retry, onClick: () => window.location.reload() }}
      />
    );
    if (participantCount === 1) {
      const isWaiting = !hadParticipants;
      return (
        <StatusIndicator layout="banner" type="info"
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
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-black" onClick={resetUiTimeout}>
      
      {/* 1. Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {layoutMode === "grid" ? (
          /* GRID LAYOUT */
          <div className="absolute inset-0 p-4 pb-28 grid gap-4 overflow-y-auto content-center grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cameraTracks.map((trackRef) => (
              <div key={`${trackRef.participant.identity}-${trackRef.source}`} className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 group">
                <ParticipantTile
                  trackRef={trackRef}
                  isLocal={trackRef.participant.identity === localParticipant.identity}
                />
                <button 
                  className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 flex items-center justify-center"
                  onClick={(e) => { e.stopPropagation(); togglePin(trackRef.participant.identity); }}
                >
                  <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-white ring-1 ring-white/20 uppercase tracking-widest">
                    Закрепить
                  </div>
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* SPEAKER LAYOUT */
          <div className="absolute inset-0">
            {currentFocusTrack && (
              <div className="absolute inset-0 transition-all duration-700 ease-in-out">
                <ParticipantTile
                  trackRef={currentFocusTrack}
                  isLocal={currentFocusTrack.participant.identity === localParticipant.identity}
                  isPinned={!!pinnedId}
                />
              </div>
            )}

            {/* My small floating video (always show if others exist and I'm not the only one in focus) */}
            {participantCount > 1 && localTrack && (currentFocusTrack !== localTrack || participantCount > 1) && (
              <div className={`absolute right-4 top-20 z-30 w-28 sm:w-40 aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 transition-all active:scale-95 duration-500 ${currentFocusTrack === localTrack ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                <ParticipantTile trackRef={localTrack} isLocal={true} />
              </div>
            )}

            {/* Horizontal list of others (everyone remote who is not in focus) */}
            {cameraTracks.some(t => t.participant.identity !== localParticipant.identity && t !== currentFocusTrack) && (
              <div className={`absolute bottom-24 left-0 right-0 z-30 flex justify-center gap-2 overflow-x-auto px-4 pb-4 transition-all duration-500 ${isUiVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
                {cameraTracks
                  .filter(t => t.participant.identity !== localParticipant.identity && t !== currentFocusTrack)
                  .map((trackRef) => (
                    <div 
                      key={`${trackRef.participant.identity}-${trackRef.source}`}
                      className="h-24 w-18 flex-shrink-0 overflow-hidden rounded-xl shadow-lg ring-1 ring-white/10 cursor-pointer hover:ring-accent transition-all bg-black/40"
                      onClick={(e) => { e.stopPropagation(); togglePin(trackRef.participant.identity); }}
                    >
                      <ParticipantTile trackRef={trackRef} isLocal={false} />
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Header (Shield + Participant Count) */}
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

      {/* 3. Controls (ControlBar) */}
      <div className={`absolute bottom-0 left-0 right-0 z-50 transition-all duration-500 ${isUiVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="pb-safe pt-8 bg-gradient-to-t from-black/80 to-transparent">
          <ControlBar
            isMicEnabled={localParticipant.isMicrophoneEnabled}
            isCameraEnabled={localParticipant.isCameraEnabled}
            isScreenShareEnabled={isScreenShareEnabled}
            layoutMode={layoutMode}
            onToggleMic={toggleMic}
            onToggleCamera={toggleCamera}
            onToggleScreenShare={() => localParticipant.setScreenShareEnabled(!isScreenShareEnabled)}
            onToggleLayout={toggleLayout}
            onDisconnect={handleDisconnect}
            onShowShare={() => setShowShareModal(true)}
          />
        </div>
      </div>

      {/* Overlays */}
      {renderStatus()}
      {toast && <StatusIndicator layout="toast" type={toast.type} title={toast.title} onHide={() => setToast(null)} />}
      {showShareModal && <ShareModal roomId={roomId} onClose={() => setShowShareModal(false)} />}
    </div>
  );
}
