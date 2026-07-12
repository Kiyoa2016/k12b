import type { LayoutMode, MediaItem } from '@/types/classroom';
import { Box } from '@mui/material';
import { Videocam } from '@mui/icons-material';

interface LivePresentationProps {
  cameraStream: MediaStream | null;
  mediaItems: MediaItem[];
  activeOverlay: string | null;
  layoutMode: LayoutMode;
  pipPos: { top: number; left: number } | null;
  pipRef: React.RefObject<HTMLDivElement | null>;
  onPipMouseDown: (e: React.MouseEvent) => void;
  onPipTouchStart: (e: React.TouchEvent) => void;
  desktopImage: string;
}

export default function LivePresentation({
  cameraStream, mediaItems, activeOverlay, layoutMode,
  pipPos, pipRef, onPipMouseDown, onPipTouchStart, desktopImage,
}: LivePresentationProps) {

  const activeMedia = activeOverlay
    ? mediaItems.find(m => m.id === activeOverlay)
    : null;

  const renderTeacherView = () => (
    <Box className="w-full h-full flex items-center justify-center">
      <img src={desktopImage} alt="电脑桌面" className="w-full h-full object-contain" />
      {activeMedia && (
        <Box className="absolute bottom-3 right-3 w-32 h-24 rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <img src={activeMedia.src} alt="overlay" className="w-full h-full object-cover" />
        </Box>
      )}
    </Box>
  );

  const renderPipView = () => (
    <Box className="relative w-full h-full">
      <Box className="w-full h-full flex items-center justify-center">
        <img src={desktopImage} alt="电脑桌面" className="w-full h-full object-contain" />
      </Box>
      {/* PiP 小窗：教师摄像头 — 可拖拽 */}
      <Box
        ref={pipRef}
        onMouseDown={onPipMouseDown}
        onTouchStart={onPipTouchStart}
        className="absolute w-44 h-32 rounded-lg overflow-hidden border-2 border-white shadow-lg bg-gray-800 cursor-grab active:cursor-grabbing select-none"
        sx={pipPos ? { top: pipPos.top, left: pipPos.left } : { bottom: 16, right: 16 }}
      >
        {cameraStream ? (
          <video ref={(el) => { if (el) el.srcObject = cameraStream; }} autoPlay playsInline muted
            className="w-full h-full object-cover pointer-events-none" />
        ) : (
          <Box className="w-full h-full flex items-center justify-center text-gray-500">
            <Videocam fontSize="small" />
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <Box className="fixed inset-0 bg-gray-900 z-50">
      {layoutMode === 'teacher' ? renderTeacherView() : renderPipView()}
    </Box>
  );
}
