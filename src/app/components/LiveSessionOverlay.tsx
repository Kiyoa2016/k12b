import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import { Close, CameraAlt, CropOriginal, Quiz, Share, ContentCopy } from '@mui/icons-material';
import QRCode from 'qrcode';
import LivePresentation from './LivePresentation';
import LiveHUD from './LiveHUD';
import QuizDialog from './QuizDialog';
import desktopImage from '../../../image/电脑桌面.png';

interface LiveSessionOverlayProps {
  classroomName: string;
  displayStream: MediaStream;
  onClose: () => void;
}

export default function LiveSessionOverlay({ classroomName, displayStream, onClose }: LiveSessionOverlayProps) {
  const stoppedRef = useRef(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [layoutMode, setLayoutMode] = useState<'teacher' | 'pip'>('teacher');
  const [stopConfirmOpen, setStopConfirmOpen] = useState(false);

  // 截屏
  const [screenshotDataUrl, setScreenshotDataUrl] = useState('');
  const [screenshotOpen, setScreenshotOpen] = useState(false);

  // 分享
  const [shareOpen, setShareOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const shareUrl = `https://live.example.com/classroom/${Date.now()}`;

  // 答题
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState<string[]>(['', '']);
  const [quizVotes, setQuizVotes] = useState<Record<string, number>>({});
  const [quizActive, setQuizActive] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // 生成分享二维码
  useEffect(() => {
    QRCode.toDataURL(shareUrl, { width: 192, margin: 2 }).then(setQrDataUrl);
  }, [shareUrl]);

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

  // 截屏：从 displayStream 截取一帧
  const captureScreenshot = useCallback(() => {
    const video = document.querySelector('video');
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    setScreenshotDataUrl(canvas.toDataURL('image/png'));
    setScreenshotOpen(true);
  }, []);

  // 答题器操作
  const addOption = () => { if (quizOptions.length < 6) setQuizOptions(prev => [...prev, '']); };
  const updateOption = (index: number, value: string) => setQuizOptions(prev => prev.map((o, i) => i === index ? value : o));
  const removeOption = (index: number) => { if (quizOptions.length > 2) setQuizOptions(prev => prev.filter((_, i) => i !== index)); };
  const startQuiz = () => {
    if (!quizQuestion.trim() || quizOptions.filter(o => o.trim()).length < 2) return;
    const votes: Record<string, number> = {};
    quizOptions.filter(o => o.trim()).forEach(o => { votes[o] = 0; });
    setQuizVotes(votes);
    setQuizActive(true);
    setQuizSubmitted(false);
  };
  const simulateVotes = () => {
    const newVotes = { ...quizVotes };
    Object.keys(newVotes).forEach(k => { newVotes[k] = Math.floor(Math.random() * 15); });
    setQuizVotes(newVotes);
    setQuizSubmitted(true);
  };
  const resetQuiz = () => {
    setQuizQuestion('');
    setQuizOptions(['', '']);
    setQuizVotes({});
    setQuizActive(false);
    setQuizSubmitted(false);
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
    let mounted = true;
    const handler = () => {
      if (!document.fullscreenElement && !stoppedRef.current && mounted) {
        doStop();
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => { mounted = false; document.removeEventListener('fullscreenchange', handler); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doStop = () => {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
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
    switch (action) {
      case 'photo': captureScreenshot(); break;
      case 'screenshot': captureScreenshot(); break;
      case 'quiz': setQuizDialogOpen(true); break;
      case 'share': setShareOpen(true); break;
      case 'stop': setStopConfirmOpen(true); break;
    }
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

      {/* 截屏预览弹窗 */}
      <Dialog open={screenshotOpen} onClose={() => setScreenshotOpen(false)} maxWidth="sm">
        <DialogTitle className="border-b">
          <Box className="flex items-center justify-between">
            <Typography variant="h6">截屏预览</Typography>
            <IconButton onClick={() => setScreenshotOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {screenshotDataUrl && (
            <Box className="py-4">
              <img src={screenshotDataUrl} alt="截屏" className="w-full rounded-lg border border-gray-200" />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* 分享弹窗 */}
      <Dialog open={shareOpen} onClose={() => setShareOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="border-b">
          <Box className="flex items-center justify-between">
            <Typography variant="h6">分享直播</Typography>
            <IconButton onClick={() => setShareOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box className="py-6 flex flex-col items-center gap-4">
            <Box className="w-48 h-48 bg-white rounded-xl flex items-center justify-center border border-gray-200">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-full h-full" />
              ) : (
                <Typography variant="caption" color="text.secondary">生成中...</Typography>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" className="text-center">扫码观看直播</Typography>
            <Box className="w-full p-3 bg-gray-50 rounded-lg flex items-center gap-2">
              <Typography variant="body2" className="flex-1 truncate text-gray-600 font-mono text-sm">{shareUrl}</Typography>
              <Button size="small" variant="outlined" startIcon={<ContentCopy />}
                onClick={() => navigator.clipboard.writeText(shareUrl).catch(() => {})}>
                复制
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setShareOpen(false)} variant="outlined">关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 答题弹窗 */}
      <QuizDialog
        open={quizDialogOpen}
        onClose={() => setQuizDialogOpen(false)}
        quizQuestion={quizQuestion}
        quizOptions={quizOptions}
        quizVotes={quizVotes}
        quizActive={quizActive}
        quizSubmitted={quizSubmitted}
        onQuestionChange={setQuizQuestion}
        onOptionChange={updateOption}
        onAddOption={addOption}
        onRemoveOption={removeOption}
        onStartQuiz={startQuiz}
        onSimulateVotes={simulateVotes}
        onResetQuiz={resetQuiz}
      />

      {/* 停止直播确认弹窗 */}
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
