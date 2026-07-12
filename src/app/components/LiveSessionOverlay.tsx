import { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import LivePresentation from './LivePresentation';
import LiveHUD from './LiveHUD';
import desktopImage from '../../../image/电脑桌面.png';

interface LiveSessionOverlayProps {
  classroomName: string;
  displayStream: MediaStream;
  onClose: () => void;
}

export default function LiveSessionOverlay({ classroomName, displayStream, onClose }: LiveSessionOverlayProps) {
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [layoutMode, setLayoutMode] = useState<'teacher' | 'pip'>('teacher');
  const [stopConfirmOpen, setStopConfirmOpen] = useState(false);

  // PiP 拖拽
  const [pipPos, setPipPos] = useState<{ top: number; left: number } | null>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, top: 0, left: 0 });
  const pipRef = useRef<HTMLDivElement>(null);

  const handlePipMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = pipRef.current?.getBoundingClientRect();
    if (!rect) return;
    const currentTop = pipPos?.top ?? rect.top;
    const currentLeft = pipPos?.left ?? rect.left;
    setPipPos({ top: currentTop, left: currentLeft });
    dragStart.current = { x: e.clientX, y: e.clientY, top: currentTop, left: currentLeft };
    isDragging.current = true;
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      setPipPos({
        top: dragStart.current.top + ev.clientY - dragStart.current.y,
        left: dragStart.current.left + ev.clientX - dragStart.current.x,
      });
    };
    const onUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handlePipTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = pipRef.current?.getBoundingClientRect();
    if (!rect) return;
    const currentTop = pipPos?.top ?? rect.top;
    const currentLeft = pipPos?.left ?? rect.left;
    setPipPos({ top: currentTop, left: currentLeft });
    dragStart.current = { x: touch.clientX, y: touch.clientY, top: currentTop, left: currentLeft };
    isDragging.current = true;
    const onMove = (ev: TouchEvent) => {
      if (!isDragging.current) return;
      ev.preventDefault();
      const t = ev.touches[0];
      setPipPos({
        top: dragStart.current.top + t.clientY - dragStart.current.y,
        left: dragStart.current.left + t.clientX - dragStart.current.x,
      });
    };
    const onEnd = () => {
      isDragging.current = false;
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  };

  // 启动摄像头作为 PiP，同时进入全屏
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      setCameraStream(stream);
    }).catch(() => {
      // 无摄像头也能正常投屏
    });
    setTimeout(() => {
      document.documentElement.requestFullscreen().catch(() => {});
    }, 100);
  }, []);

  // 监听 Esc 退出全屏
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) {
        doStop();
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doStop = () => {
    displayStream.getTracks().forEach(t => t.stop());
    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    onClose();
  };

  const handleStop = () => {
    setStopConfirmOpen(false);
    doStop();
  };

  const handleHUDAction = (action: 'photo' | 'screenshot' | 'quiz' | 'share' | 'stop') => {
    if (action === 'stop') setStopConfirmOpen(true);
  };

  return (
    <>
      <LivePresentation
        cameraStream={cameraStream}
        displayStream={displayStream}
        mediaItems={[]}
        activeOverlay={null}
        layoutMode={layoutMode}
        pipPos={pipPos}
        pipRef={pipRef as React.RefObject<HTMLDivElement | null>}
        onPipMouseDown={handlePipMouseDown}
        onPipTouchStart={handlePipTouchStart}
        desktopImage={desktopImage}
      />
      <LiveHUD
        onlineCount={1}
        layoutMode={layoutMode}
        onLayoutChange={setLayoutMode}
        onAction={handleHUDAction}
      />

      <Dialog open={stopConfirmOpen} onClose={() => setStopConfirmOpen(false)} maxWidth="xs">
        <DialogTitle>停止直播</DialogTitle>
        <DialogContent>
          <Typography variant="body2">确定停止当前投屏直播？画面将停止共享并退出全屏。</Typography>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setStopConfirmOpen(false)} variant="outlined">取消</Button>
          <Button onClick={handleStop} variant="contained" color="error">停止投屏</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
