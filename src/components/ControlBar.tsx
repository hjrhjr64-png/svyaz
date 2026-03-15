import { useCallback } from "react";
import { UI_TEXT } from "@/lib/utils";
import { useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useAudioLevel } from "@/hooks/useAudioLevel";
import { Mic, MicOff, Video, VideoOff, ScreenShare, UserPlus, Phone, LayoutGrid, LayoutList } from "lucide-react";

interface ControlBarProps {
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isScreenShareEnabled: boolean;
  layoutMode: "grid" | "speaker";
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleLayout: () => void;
  onDisconnect: () => void;
  onShowShare: () => void;
}

/**
 * Панель управления звонком: мобильный дизайн.
 * Парящая капсула с крупными зонами нажатия.
 */
export default function ControlBar({
  isMicEnabled,
  isCameraEnabled,
  isScreenShareEnabled,
  layoutMode,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleLayout,
  onDisconnect,
  onShowShare,
}: ControlBarProps) {
  const { localParticipant } = useLocalParticipant();
  const audioTrack = localParticipant.getTrackPublication(Track.Source.Microphone)?.track?.mediaStreamTrack;
  const audioLevel = useAudioLevel(audioTrack);

  return (
    <div className="flex flex-col items-center w-full px-6 pb-6">
      <div 
        className="flex items-center gap-1 sm:gap-2 rounded-[2.5rem] bg-black/40 p-2 sm:p-3 backdrop-blur-3xl ring-1 ring-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        {/* Микрофон */}
        <ControlButton
          active={isMicEnabled}
          onClick={onToggleMic}
          icon={isMicEnabled ? <Mic size={24} /> : <MicOff size={24} />}
          level={isMicEnabled ? audioLevel : 0}
          label={isMicEnabled ? UI_TEXT.micOn : UI_TEXT.micOff}
        />

        {/* Камера */}
        <ControlButton
          active={isCameraEnabled}
          onClick={onToggleCamera}
          icon={isCameraEnabled ? <Video size={24} /> : <VideoOff size={24} />}
          label={isCameraEnabled ? UI_TEXT.cameraOn : UI_TEXT.cameraOff}
        />

        {/* Пригласить */}
        <ControlButton
          active={true}
          onClick={onShowShare}
          icon={<UserPlus size={24} />}
          label={UI_TEXT.invite}
        />

        {/* Сетка/Спикер (Видно только на больших экранах или если нужно) */}
        <div className="hidden sm:block">
          <ControlButton
            active={true}
            onClick={onToggleLayout}
            icon={layoutMode === "grid" ? <LayoutList size={24} /> : <LayoutGrid size={24} />}
            label="Вид"
          />
        </div>

        {/* Экран (Скрыто на мобилках, если не поддерживается/неудобно) */}
        <div className="hidden md:block">
        <div className="hidden md:block">
          <ControlButton
            active={true} // Всегда активная кнопка (инструмент)
            onClick={onToggleScreenShare}
            icon={
              <div className={isScreenShareEnabled ? "text-accent" : "text-white"}>
                <ScreenShare size={24} />
              </div>
            }
            label="Экран"
          />
        </div>
        </div>

        <div className="mx-2 h-8 w-[1px] bg-white/10" />

        {/* Завершить */}
        <button
          onClick={onDisconnect}
          className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-danger text-white transition-all duration-300 hover:bg-danger-hover active:scale-95 shadow-lg shadow-danger/20"
        >
          <Phone size={28} className="rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
}

function ControlButton({
  active,
  onClick,
  icon,
  level = 0,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  level?: number;
  label?: string;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full transition-all duration-300 active:scale-[0.85] overflow-hidden ${
        active 
          ? "bg-white/10 text-white hover:bg-white/15" 
          : "bg-white/5 text-white/20 ring-1 ring-white/5"
      }`}
      aria-label={label}
    >
      {active && level > 0 && (
        <div 
          className="absolute bottom-0 left-0 right-0 bg-white/15 transition-all duration-100 ease-out pointer-events-none"
          style={{ height: `${Math.min(100, level * 150)}%` }}
        />
      )}
      <div className="relative z-10">
        {icon}
      </div>
    </button>
  );
}
