import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Close, ContentCopy } from '@mui/icons-material';
import QRCode from 'qrcode';
import LivePresentation from './LivePresentation';
import LiveHUD from './LiveHUD';
import QuizDialog from './QuizDialog';
import desktopImage from '../../../image/电脑桌面.png';

interface LiveSessionOverlayProps {
  classroomName: string;
  onClose: () => void;
}

export default function LiveSessionOverlay({ classroomName, onClose }: LiveSessionOverlayProps) {
  const [layoutMode, setLayoutMode] = useState<'teacher' | 'pip'>('teacher');
  const [stopConfirmOpen, setStopConfirmOpen] = useState(false);

  // 截屏（模拟）
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

  useEffect(() => {
    QRCode.toDataURL(shareUrl, { width: 192, margin: 2 }).then(setQrDataUrl);
  }, [shareUrl]);

  // 进入全屏（模拟，不调真实 API）
  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  }, []);

  // 监听 Esc 退出全屏
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) {
        onClose();
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [onClose]);

  // 模拟截屏：在画布上画一张占位图
  const captureScreenshot = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('课堂截图', 320, 240);
    setScreenshotDataUrl(canvas.toDataURL('image/png'));
    setScreenshotOpen(true);
  };

  // 答题操作
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

  const handleHUDAction = (action: 'photo' | 'screenshot' | 'quiz' | 'share' | 'stop') => {
    switch (action) {
      case 'photo': captureScreenshot(); break;
      case 'screenshot': captureScreenshot(); break;
      case 'quiz': setQuizDialogOpen(true); break;
      case 'share': setShareOpen(true); break;
      case 'stop': setStopConfirmOpen(true); break;
    }
  };

  const handleStop = () => {
    setStopConfirmOpen(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    onClose();
  };

  return (
    <>
      <LivePresentation
        cameraStream={null}
        mediaItems={[]}
        activeOverlay={null}
        layoutMode={layoutMode}
        pipPos={null}
        pipRef={null as any}
        onPipMouseDown={() => {}}
        onPipTouchStart={() => {}}
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

      {/* 停止确认弹窗 */}
      <Dialog open={stopConfirmOpen} onClose={() => setStopConfirmOpen(false)} maxWidth="xs">
        <DialogTitle>停止投屏</DialogTitle>
        <DialogContent>
          <Typography variant="body2">确定停止当前投屏直播？</Typography>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setStopConfirmOpen(false)} variant="outlined">取消</Button>
          <Button onClick={handleStop} variant="contained" color="error">停止投屏</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
