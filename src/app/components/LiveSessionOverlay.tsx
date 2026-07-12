import { useState, useCallback, useEffect } from 'react';
import {
  Box, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Close, ContentCopy } from '@mui/icons-material';
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

  // 截屏模式
  const [isSelecting, setIsSelecting] = useState(false);
  const [selStart, setSelStart] = useState({ x: 0, y: 0 });
  const [selEnd, setSelEnd] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [captureResult, setCaptureResult] = useState('');
  const [captureOpen, setCaptureOpen] = useState(false);

  // 分享
  const [shareOpen, setShareOpen] = useState(false);
  const shareUrl = `https://live.example.com/classroom/${Date.now()}`;

  // 答题
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState<string[]>(['', '']);
  const [quizVotes, setQuizVotes] = useState<Record<string, number>>({});
  const [quizActive, setQuizActive] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Esc 退出截屏选择模式
  useEffect(() => {
    if (!isSelecting) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSelecting(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSelecting]);

  // 计算选区矩形
  const selRect = {
    left: Math.min(selStart.x, selEnd.x),
    top: Math.min(selStart.y, selEnd.y),
    width: Math.abs(selEnd.x - selStart.x),
    height: Math.abs(selEnd.y - selStart.y),
  };
  const hasSelection = selRect.width > 5 && selRect.height > 5;

  // 进入截屏选择模式
  const startSelectMode = useCallback(() => {
    setIsSelecting(true);
    setSelStart({ x: 0, y: 0 });
    setSelEnd({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);

  // 鼠标按下：记录起点
  const handleSelMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setSelStart({ x: e.clientX, y: e.clientY });
    setSelEnd({ x: e.clientX, y: e.clientY });
  }, []);

  // 鼠标移动：更新终点
  const handleSelMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setSelEnd({ x: e.clientX, y: e.clientY });
  }, [isDragging]);

  // 鼠标松开：模拟截取选区
  const handleSelMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const left = Math.min(selStart.x, selEnd.x);
    const top = Math.min(selStart.y, selEnd.y);
    const w = Math.abs(selEnd.x - selStart.x);
    const h = Math.abs(selEnd.y - selStart.y);
    if (w < 5 || h < 5) return;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#4f46e5');
    gradient.addColorStop(1, '#7c3aed');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.min(20, w * 0.05)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`截图选区 ${Math.round(w)}×${Math.round(h)}`, w / 2, h / 2);

    setCaptureResult(canvas.toDataURL('image/png'));
    setIsSelecting(false);
    setCaptureOpen(true);
  }, [isDragging, selStart, selEnd]);

  // 拍照：全屏截取
  const takePhoto = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#1e3a5f');
    gradient.addColorStop(1, '#2d1b69');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`全屏拍照 ${w}×${h}`, w / 2, h / 2);

    setCaptureResult(canvas.toDataURL('image/png'));
    setCaptureOpen(true);
  }, []);

  const addOption = () => { if (quizOptions.length < 6) setQuizOptions(prev => [...prev, '']); };
  const updateOption = (i: number, v: string) => setQuizOptions(prev => prev.map((o, idx) => idx === i ? v : o));
  const removeOption = (i: number) => { if (quizOptions.length > 2) setQuizOptions(prev => prev.filter((_, idx) => idx !== i)); };
  const startQuiz = () => {
    if (!quizQuestion.trim() || quizOptions.filter(o => o.trim()).length < 2) return;
    const votes: Record<string, number> = {};
    quizOptions.filter(o => o.trim()).forEach(o => { votes[o] = 0; });
    setQuizVotes(votes); setQuizActive(true); setQuizSubmitted(false);
  };
  const simulateVotes = () => {
    const nv = { ...quizVotes };
    Object.keys(nv).forEach(k => { nv[k] = Math.floor(Math.random() * 15); });
    setQuizVotes(nv); setQuizSubmitted(true);
  };
  const resetQuiz = () => { setQuizQuestion(''); setQuizOptions(['', '']); setQuizVotes({}); setQuizActive(false); setQuizSubmitted(false); };

  const handleHUDAction = (action: 'photo' | 'screenshot' | 'quiz' | 'share' | 'stop') => {
    switch (action) {
      case 'photo': takePhoto(); break;
      case 'screenshot': startSelectMode(); break;
      case 'quiz': setQuizDialogOpen(true); break;
      case 'share': setShareOpen(true); break;
      case 'stop': setStopConfirmOpen(true); break;
    }
  };

  return (
    <>
      <LivePresentation
        cameraStream={null} mediaItems={[]} activeOverlay={null}
        layoutMode={layoutMode} pipPos={null} pipRef={null as any}
        onPipMouseDown={() => {}} onPipTouchStart={() => {}}
        desktopImage={desktopImage}
      />
      <LiveHUD
        onlineCount={1} layoutMode={layoutMode}
        onLayoutChange={setLayoutMode} onAction={handleHUDAction}
      />

      {/* 截屏选区覆盖层 */}
      {isSelecting && (
        <Box
          className="fixed inset-0 z-[70] cursor-crosshair select-none"
          sx={{ bgcolor: isDragging ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.5)' }}
          onMouseDown={handleSelMouseDown}
          onMouseMove={handleSelMouseMove}
          onMouseUp={handleSelMouseUp}
        >
          {/* 提示文字 */}
          {!isDragging && (
            <Box className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-lg text-sm">
              拖拽绘制矩形区域截图，按 Esc 取消
            </Box>
          )}
          {/* 选区矩形 */}
          {hasSelection && (
            <Box
              className="absolute border-2 border-blue-400 bg-blue-500/10 pointer-events-none"
              sx={{
                left: selRect.left,
                top: selRect.top,
                width: selRect.width,
                height: selRect.height,
              }}
            >
              <Box className="absolute -top-6 left-0 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                {Math.round(selRect.width)} × {Math.round(selRect.height)}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* 截屏/拍照结果预览 */}
      <Dialog open={captureOpen} onClose={() => setCaptureOpen(false)} maxWidth="sm">
        <DialogTitle className="border-b">
          <Box className="flex items-center justify-between">
            <Typography variant="h6">截图预览</Typography>
            <IconButton onClick={() => setCaptureOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {captureResult && (
            <Box className="py-4">
              <img src={captureResult} alt="截图" className="w-full rounded-lg border border-gray-200" />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* 分享弹窗 */}
      <Dialog open={shareOpen} onClose={() => setShareOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="border-b"><Box className="flex items-center justify-between"><Typography variant="h6">分享直播</Typography><IconButton onClick={() => setShareOpen(false)} size="small"><Close /></IconButton></Box></DialogTitle>
        <DialogContent>
          <Box className="py-6 flex flex-col items-center gap-4">
            <Box className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center border"><Typography variant="caption" color="text.secondary">模拟二维码</Typography></Box>
            <Typography variant="body2" color="text.secondary">扫码观看直播</Typography>
            <Box className="w-full p-3 bg-gray-50 rounded-lg flex items-center gap-2">
              <Typography variant="body2" className="flex-1 truncate text-gray-600 font-mono text-sm">{shareUrl}</Typography>
              <Button size="small" variant="outlined" startIcon={<ContentCopy />} onClick={() => navigator.clipboard.writeText(shareUrl).catch(() => {})}>复制</Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <QuizDialog open={quizDialogOpen} onClose={() => setQuizDialogOpen(false)}
        quizQuestion={quizQuestion} quizOptions={quizOptions} quizVotes={quizVotes}
        quizActive={quizActive} quizSubmitted={quizSubmitted}
        onQuestionChange={setQuizQuestion} onOptionChange={updateOption}
        onAddOption={addOption} onRemoveOption={removeOption}
        onStartQuiz={startQuiz} onSimulateVotes={simulateVotes} onResetQuiz={resetQuiz} />

      <Dialog open={stopConfirmOpen} onClose={() => setStopConfirmOpen(false)} maxWidth="xs">
        <DialogTitle>停止投屏</DialogTitle>
        <DialogContent><Typography variant="body2">确定停止当前投屏直播？</Typography></DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setStopConfirmOpen(false)} variant="outlined">取消</Button>
          <Button onClick={() => { setStopConfirmOpen(false); onClose(); }} variant="contained" color="error">停止投屏</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
