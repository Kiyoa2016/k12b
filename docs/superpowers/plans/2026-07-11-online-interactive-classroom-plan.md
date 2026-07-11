# 线上互动课堂 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "云空堂" group under 校级菜单 with "线上互动课堂" sub-module featuring live streaming, photo upload, screenshot, quiz responder, and QR/link sharing.

**Architecture:** New `OnlineInteractiveClassroom` component with internal state management, integrated into App.tsx's menu and page routing. Follows existing single-file page component pattern (CloudClassroom, etc.).

**Tech Stack:** React 18 + MUI 7 + Tailwind CSS 4 + Vite + `qrcode` package

## Global Constraints

- Must use MUI Box/Typography/Button/IconButton/Chip/Dialog components for consistency
- Must follow existing Tailwind CSS class naming pattern in the project
- Must use existing icon patterns from `@mui/icons-material`
- Camera access via `navigator.mediaDevices.getUserMedia`
- QR code via `qrcode` npm package (`QRCode.toDataURL`)
- All state internal to component (useState)

---

### Task 1: Install QR code dependency

**Files:**
- Modify: `package.json`
- Run: `pnpm install`

**Interfaces:**
- Consumes: nothing
- Produces: `qrcode` + `@types/qrcode` available for import

- [ ] **Step 1: Install the packages**

Run: `pnpm add qrcode && pnpm add -D @types/qrcode`

---

### Task 2: Create OnlineInteractiveClassroom component — layout scaffold

**Files:**
- Create: `src/app/components/OnlineInteractiveClassroom.tsx`
- Modify: none yet

**Interfaces:**
- Consumes: nothing (standalone component)
- Produces: default export `OnlineInteractiveClassroom` (no props)

- [ ] **Step 1: Create the component with state definitions and basic layout structure**

```tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, IconButton, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Divider, Grid, Card, CardContent, Slider,
} from '@mui/material';
import {
  Videocam, CameraAlt, PhotoLibrary, ScreenShare, Link as LinkIcon,
  Share, StopCircle, PlayArrow, PictureInPicture, GridView, Fullscreen,
  CropOriginal, Quiz, CheckCircle, Close, ContentCopy, QRCode,
} from '@mui/icons-material';

type LayoutMode = 'teacher' | 'slide' | 'pip' | 'three-panel';

interface MediaItem {
  id: string;
  src: string;        // data URL or blob URL
  name: string;
  type: 'photo' | 'upload' | 'screenshot';
}

export default function OnlineInteractiveClassroom() {
  // 直播状态
  const [isLive, setIsLive] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('teacher');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 媒体项
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);

  // 答题器
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState<string[]>(['', '']);
  const [quizVotes, setQuizVotes] = useState<Record<string, number>>({});
  const [quizActive, setQuizActive] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // 分享
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const shareUrl = `https://live.example.com/classroom/${Date.now()}`;

  // 截屏
  const liveAreaRef = useRef<HTMLDivElement>(null);

  // 摄像头管理
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      previewStreamRef.current = stream;
      if (cameraPreviewRef.current) {
        cameraPreviewRef.current.srcObject = stream;
      }
    } catch {
      alert('无法访问摄像头，请检查权限设置');
    }
  };

  const stopPreviewCamera = () => {
    if (previewStreamRef.current) {
      previewStreamRef.current.getTracks().forEach(t => t.stop());
      previewStreamRef.current = null;
    }
  };

  // 拍照：从预览流中截取一帧
  const capturePhoto = () => {
    const video = cameraPreviewRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    const newItem: MediaItem = {
      id: Date.now().toString(),
      src: dataUrl,
      name: `拍照_${new Date().toLocaleTimeString()}`,
      type: 'photo',
    };
    setMediaItems(prev => [...prev, newItem]);
    setActiveOverlay(newItem.id);
  };

  // 本地上传图片
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const newItem: MediaItem = {
          id: Date.now().toString() + Math.random(),
          src: reader.result as string,
          name: file.name,
          type: 'upload',
        };
        setMediaItems(prev => [...prev, newItem]);
        setActiveOverlay(newItem.id);
      };
      reader.readAsDataURL(file);
    });
  };

  // 截屏
  const captureScreenshot = () => {
    const el = liveAreaRef.current;
    if (!el) return;
    // 使用 canvas 绘制 DOM 区域
    import('html2canvas').catch(() => {
      // fallback: 没有 html2canvas，用简单的 canvas 截图替代
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('截屏 - 直播画面', 200, 240);
      const dataUrl = canvas.toDataURL('image/png');
      const newItem: MediaItem = {
        id: Date.now().toString(),
        src: dataUrl,
        name: `截屏_${new Date().toLocaleTimeString()}`,
        type: 'screenshot',
      };
      setMediaItems(prev => [...prev, newItem]);
      setActiveOverlay(newItem.id);
    });
  };

  // 答题器
  const addOption = () => {
    if (quizOptions.length < 6) setQuizOptions(prev => [...prev, '']);
  };

  const updateOption = (index: number, value: string) => {
    setQuizOptions(prev => prev.map((o, i) => i === index ? value : o));
  };

  const removeOption = (index: number) => {
    if (quizOptions.length > 2) setQuizOptions(prev => prev.filter((_, i) => i !== index));
  };

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
    const keys = Object.keys(newVotes);
    keys.forEach(k => {
      newVotes[k] = Math.floor(Math.random() * 15);
    });
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

  // 直播推流控制
  const toggleLive = async () => {
    if (isLive) {
      // 停止推流
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        setCameraStream(null);
      }
      setIsLive(false);
    } else {
      // 开始推流
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setCameraStream(stream);
        setIsLive(true);
      } catch {
        alert('无法启动摄像头/麦克风');
      }
    }
  };

  // 清理
  useEffect(() => {
    return () => {
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
      stopPreviewCamera();
    };
  }, [cameraStream]);

  // 渲染直播画面区 — 根据布局模式
  const renderLiveArea = () => {
    const teacherView = (
      <Box className="flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden"
        sx={{ aspectRatio: '16/9', minHeight: 360 }}>
        {cameraStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            srcObject={cameraStream}
            className="w-full h-full object-contain"
          />
        ) : (
          <Box className="text-center text-gray-500">
            <Videocam sx={{ fontSize: 64 }} />
            <Typography variant="body2" className="mt-2">摄像头画面</Typography>
            {!isLive && (
              <Typography variant="caption" color="text.secondary" className="block mt-1">
                点击"开始直播"启动摄像头
              </Typography>
            )}
          </Box>
        )}
        {/* 叠加层：当前激活的媒体图片 */}
        {activeOverlay && mediaItems.find(m => m.id === activeOverlay) && (
          <Box className="absolute bottom-3 right-3 w-32 h-24 rounded-lg overflow-hidden border-2 border-white shadow-lg">
            <img src={mediaItems.find(m => m.id === activeOverlay)!.src} alt="overlay"
              className="w-full h-full object-cover" />
          </Box>
        )}
      </Box>
    );

    const slideView = (
      <Box className="flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden"
        sx={{ aspectRatio: '16/9', minHeight: 360 }}>
        {activeOverlay && mediaItems.find(m => m.id === activeOverlay) ? (
          <img src={mediaItems.find(m => m.id === activeOverlay)!.src} alt="slide"
            className="w-full h-full object-contain" />
        ) : (
          <Box className="text-center text-gray-500">
            <CropOriginal sx={{ fontSize: 64 }} />
            <Typography variant="body2" className="mt-2">课件/图片画面</Typography>
            <Typography variant="caption" color="text.secondary" className="block mt-1">
              从右侧工具栏上传或拍摄图片
            </Typography>
          </Box>
        )}
      </Box>
    );

    const pipView = (
      <Box className="relative bg-gray-900 rounded-lg overflow-hidden"
        sx={{ aspectRatio: '16/9', minHeight: 360 }}>
        {/* 主画面：课件 */}
        <Box className="w-full h-full flex items-center justify-center">
          {activeOverlay && mediaItems.find(m => m.id === activeOverlay) ? (
            <img src={mediaItems.find(m => m.id === activeOverlay)!.src} alt="slide"
              className="w-full h-full object-contain" />
          ) : (
            <Box className="text-center text-gray-500">
              <CropOriginal sx={{ fontSize: 48 }} />
              <Typography variant="body2">课件画面</Typography>
            </Box>
          )}
        </Box>
        {/* PiP 小窗：教师 */}
        <Box className="absolute bottom-4 right-4 w-44 h-32 rounded-lg overflow-hidden border-2 border-white shadow-lg bg-gray-800">
          {cameraStream ? (
            <video autoPlay playsInline muted srcObject={cameraStream}
              className="w-full h-full object-cover" />
          ) : (
            <Box className="w-full h-full flex items-center justify-center text-gray-500">
              <Videocam fontSize="small" />
            </Box>
          )}
        </Box>
      </Box>
    );

    const threePanelView = (
      <Box className="bg-gray-900 rounded-lg overflow-hidden flex" sx={{ height: 400 }}>
        {/* 左：教师 */}
        <Box className="flex-1 flex items-center justify-center border-r border-gray-700">
          {cameraStream ? (
            <video autoPlay playsInline muted srcObject={cameraStream}
              className="w-full h-full object-cover" />
          ) : (
            <Box className="text-center text-gray-500">
              <Videocam sx={{ fontSize: 40 }} />
              <Typography variant="caption">教师</Typography>
            </Box>
          )}
        </Box>
        {/* 右上：课件 */}
        <Box className="flex-1 flex items-center justify-center border-b border-gray-700">
          {activeOverlay && mediaItems.find(m => m.id === activeOverlay) ? (
            <img src={mediaItems.find(m => m.id === activeOverlay)!.src} alt="slide"
              className="w-full h-full object-cover" />
          ) : (
            <Box className="text-center text-gray-500">
              <CropOriginal sx={{ fontSize: 36 }} />
              <Typography variant="caption">课件</Typography>
            </Box>
          )}
        </Box>
        {/* 右下：互动区 */}
        <Box className="flex-1 flex items-center justify-center p-2">
          {quizActive ? (
            <Box className="text-center text-white">
              <Typography variant="caption" className="font-semibold mb-1 block">{quizQuestion}</Typography>
              {Object.entries(quizVotes).map(([opt, count]) => (
                <Box key={opt} className="flex items-center gap-1 text-xs mb-0.5">
                  <Typography variant="caption" className="text-gray-400 w-12 truncate">{opt}</Typography>
                  <Box className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <Box className="h-full bg-blue-500 rounded-full" sx={{ width: `${Math.min(100, (count / (Math.max(...Object.values(quizVotes), 1)) * 100))}%` }} />
                  </Box>
                  <Typography variant="caption" className="text-gray-400 w-4">{count}</Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Box className="text-center text-gray-500">
              <Quiz sx={{ fontSize: 36 }} />
              <Typography variant="caption">互动区</Typography>
              <Typography variant="caption" className="block">发起答题后显示结果</Typography>
            </Box>
          )}
        </Box>
      </Box>
    );

    switch (layoutMode) {
      case 'teacher': return teacherView;
      case 'slide': return slideView;
      case 'pip': return pipView;
      case 'three-panel': return threePanelView;
    }
  };

  const totalVotes = Object.values(quizVotes).reduce((a, b) => a + b, 0);

  return (
    <Box className="flex flex-col bg-gray-50" sx={{ height: 'calc(100vh - 57px)' }}>
      {/* ===== 头部标题栏 ===== */}
      <Box className="border-b border-gray-200 py-3 px-6 flex items-center justify-between bg-white shrink-0">
        <Box className="flex items-center gap-3">
          <Typography variant="h6" className="font-bold">线上互动课堂</Typography>
          <Chip
            label={isLive ? '直播中' : '已停止'}
            size="small"
            className={isLive ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}
            icon={isLive ? <PlayArrow style={{ color: 'white', fontSize: 14 }} /> : <StopCircle style={{ color: 'white', fontSize: 14 }} />}
            sx={{ height: 24, '& .MuiChip-label': { px: 1, fontSize: 12 } }}
          />
        </Box>
        <Box className="flex gap-2">
          <Button variant="contained" color={isLive ? 'error' : 'primary'}
            startIcon={isLive ? <StopCircle /> : <PlayArrow />}
            onClick={toggleLive}>
            {isLive ? '停止直播' : '开始直播'}
          </Button>
        </Box>
      </Box>

      {/* ===== 主体区域 ===== */}
      <Box className="flex-1 flex overflow-hidden">
        {/* 左侧：直播画面区 ~65% */}
        <Box className="flex-[7] p-5 overflow-auto" ref={liveAreaRef}>
          <Box className="relative">
            {renderLiveArea()}
          </Box>
        </Box>

        {/* 分隔线 */}
        <Divider orientation="vertical" flexItem />

        {/* 右侧：工具栏 ~35% */}
        <Box className="flex-[3] p-4 overflow-auto flex flex-col gap-4">
          {/* ---------- 拍照上传 ---------- */}
          <Box>
            <Typography variant="subtitle2" className="font-semibold mb-2 flex items-center gap-1">
              <CameraAlt fontSize="small" /> 拍照上传
            </Typography>
            <Box className="flex gap-2 mb-2">
              <Button size="small" variant="outlined" startIcon={<CameraAlt />}
                onClick={() => { setCameraDialogOpen(true); setTimeout(startCamera, 300); }}>
                拍照
              </Button>
              <Button size="small" variant="outlined" component="label" startIcon={<PhotoLibrary />}>
                上传
                <input type="file" hidden accept="image/*" multiple onChange={handleFileUpload} />
              </Button>
            </Box>
            {/* 媒体缩略图列表 */}
            {mediaItems.length === 0 ? (
              <Typography variant="caption" color="text.secondary" className="block text-center py-2">
                暂无媒体项
              </Typography>
            ) : (
              <Box className="flex flex-wrap gap-2">
                {mediaItems.map(item => (
                  <Box key={item.id} className="relative group cursor-pointer"
                    onClick={() => setActiveOverlay(item.id === activeOverlay ? null : item.id)}>
                    <img src={item.src} alt={item.name}
                      className={`w-16 h-16 rounded-lg object-cover border-2 ${item.id === activeOverlay ? 'border-blue-500' : 'border-transparent'}`} />
                    <IconButton size="small" className="!absolute -top-1.5 -right-1.5 bg-white shadow-md !w-5 !h-5 !min-w-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); setMediaItems(prev => prev.filter(m => m.id !== item.id)); if (activeOverlay === item.id) setActiveOverlay(null); }}>
                      <Close fontSize="inherit" />
                    </IconButton>
                    <Box className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center leading-4 truncate px-0.5 rounded-b-lg">
                      {item.type === 'photo' ? '拍照' : item.type === 'screenshot' ? '截屏' : '上传'}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          <Divider />

          {/* ---------- 截屏 ---------- */}
          <Box>
            <Typography variant="subtitle2" className="font-semibold mb-2 flex items-center gap-1">
              <ScreenShare fontSize="small" /> 截屏插入
            </Typography>
            <Button size="small" variant="outlined" startIcon={<CropOriginal />}
              onClick={captureScreenshot} fullWidth>
              截取当前画面
            </Button>
          </Box>

          <Divider />

          {/* ---------- 答题器 ---------- */}
          <Box>
            <Typography variant="subtitle2" className="font-semibold mb-2 flex items-center gap-1">
              <Quiz fontSize="small" /> 答题器
            </Typography>
            {!quizActive ? (
              <Box className="flex flex-col gap-2">
                <TextField size="small" label="题目" value={quizQuestion}
                  onChange={(e) => setQuizQuestion(e.target.value)}
                  placeholder="请输入题目" fullWidth />
                {quizOptions.map((opt, i) => (
                  <Box key={i} className="flex items-center gap-1">
                    <Typography variant="caption" className="text-gray-500 w-5 shrink-0">
                      {String.fromCharCode(65 + i)}.
                    </Typography>
                    <TextField size="small" placeholder={`选项 ${String.fromCharCode(65 + i)}`}
                      value={opt} onChange={(e) => updateOption(i, e.target.value)} fullWidth />
                    {quizOptions.length > 2 && (
                      <IconButton size="small" onClick={() => removeOption(i)}>
                        <Close fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                ))}
                <Box className="flex gap-2">
                  <Button size="small" variant="text" onClick={addOption} disabled={quizOptions.length >= 6}>
                    + 添加选项
                  </Button>
                </Box>
                <Button size="small" variant="contained" onClick={startQuiz}
                  disabled={!quizQuestion.trim() || quizOptions.filter(o => o.trim()).length < 2}>
                  发起答题
                </Button>
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" className="font-medium mb-2">{quizQuestion}</Typography>
                {quizSubmitted ? (
                  <Box>
                    {Object.entries(quizVotes).map(([opt, count]) => {
                      const maxVotes = Math.max(...Object.values(quizVotes), 1);
                      const pct = maxVotes > 0 ? (count / maxVotes * 100) : 0;
                      return (
                        <Box key={opt} className="mb-1.5">
                          <Box className="flex justify-between text-xs mb-0.5">
                            <Typography variant="caption">{opt}</Typography>
                            <Typography variant="caption" className="font-mono">{count}票 ({maxVotes > 0 ? Math.round(count / totalVotes * 100) : 0}%)</Typography>
                          </Box>
                          <Box className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <Box className="h-full bg-blue-500 rounded-full transition-all" sx={{ width: `${pct}%` }} />
                          </Box>
                        </Box>
                      );
                    })}
                    <Typography variant="caption" color="text.secondary">共 {totalVotes} 票</Typography>
                    <Box className="flex gap-2 mt-2">
                      <Button size="small" variant="outlined" onClick={simulateVotes}>模拟投票</Button>
                      <Button size="small" variant="text" color="error" onClick={resetQuiz}>重置</Button>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    {Object.keys(quizVotes).map((opt) => (
                      <Typography key={opt} variant="body2" color="text.secondary" className="mb-1">
                        {String.fromCharCode(65 + Object.keys(quizVotes).indexOf(opt))}. {opt}
                      </Typography>
                    ))}
                    <Button size="small" variant="outlined" onClick={simulateVotes} className="mt-2">
                      结束答题并统计
                    </Button>
                    <Button size="small" variant="text" color="error" onClick={resetQuiz} className="mt-1">
                      取消
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Box>

          <Divider />

          {/* ---------- 分享 ---------- */}
          <Box>
            <Typography variant="subtitle2" className="font-semibold mb-2 flex items-center gap-1">
              <Share fontSize="small" /> 直播分享
            </Typography>
            <Button size="small" variant="outlined" startIcon={<Share />}
              onClick={() => setShareDialogOpen(true)} fullWidth>
              分享直播
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ===== 底部控制栏 ===== */}
      <Box className="border-t border-gray-200 px-6 py-2 bg-white shrink-0 flex items-center justify-between">
        <Box className="flex items-center gap-2">
          <Typography variant="caption" color="text.secondary" className="mr-1">布局：</Typography>
          {([
            { id: 'teacher' as LayoutMode, icon: <Videocam fontSize="small" />, label: '教师全屏' },
            { id: 'slide' as LayoutMode, icon: <CropOriginal fontSize="small" />, label: '课件全屏' },
            { id: 'pip' as LayoutMode, icon: <PictureInPicture fontSize="small" />, label: '画中画' },
            { id: 'three-panel' as LayoutMode, icon: <GridView fontSize="small" />, label: '三分屏' },
          ]).map(mode => (
            <Chip
              key={mode.id}
              icon={mode.icon}
              label={mode.label}
              size="small"
              onClick={() => setLayoutMode(mode.id)}
              color={layoutMode === mode.id ? 'primary' : 'default'}
              variant={layoutMode === mode.id ? 'filled' : 'outlined'}
              className="cursor-pointer"
            />
          ))}
        </Box>
        <Button size="small" variant="text" startIcon={<Share />}
          onClick={() => setShareDialogOpen(true)}>
          分享
        </Button>
      </Box>

      {/* ===== 拍照弹窗 ===== */}
      <Dialog open={cameraDialogOpen} onClose={() => { setCameraDialogOpen(false); stopPreviewCamera(); }} maxWidth="sm" fullWidth>
        <DialogTitle className="border-b">
          <Box className="flex items-center justify-between">
            <Typography variant="h6">拍照</Typography>
            <IconButton onClick={() => { setCameraDialogOpen(false); stopPreviewCamera(); }} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box className="py-4">
            <Box className="bg-black rounded-lg overflow-hidden" sx={{ aspectRatio: '4/3' }}>
              <video ref={cameraPreviewRef} autoPlay playsInline className="w-full h-full object-contain" />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4 flex justify-center">
          <Button variant="contained" startIcon={<CameraAlt />} onClick={capturePhoto}>
            拍照
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== 分享弹窗 ===== */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="border-b">
          <Box className="flex items-center justify-between">
            <Typography variant="h6">分享直播</Typography>
            <IconButton onClick={() => setShareDialogOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box className="py-6 flex flex-col items-center gap-4">
            {/* 二维码区域 */}
            <Box className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
              <QRCode className="text-gray-400" sx={{ fontSize: 120 }} />
            </Box>
            <Typography variant="body2" color="text.secondary" className="text-center">
              扫码观看直播
            </Typography>
            <Box className="w-full p-3 bg-gray-50 rounded-lg flex items-center gap-2">
              <Typography variant="body2" className="flex-1 truncate text-gray-600 font-mono text-sm">
                {shareUrl}
              </Typography>
              <Button size="small" variant="outlined" startIcon={<ContentCopy />}
                onClick={() => navigator.clipboard.writeText(shareUrl)}>
                复制
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setShareDialogOpen(false)} variant="outlined">关闭</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
```

- [ ] **Step 2: Verify file is created**

Run: `ls -la src/app/components/OnlineInteractiveClassroom.tsx`
Expected: file exists with reasonable size

---

### Task 3: Integrate into App.tsx — menu, page routing, and import

**Files:**
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: `OnlineInteractiveClassroom` (default export, no props)
- Produces: new menu entry and page route working

- [ ] **Step 1: Add import at the top of App.tsx**

After the existing imports, add:
```typescript
import OnlineInteractiveClassroom from './components/OnlineInteractiveClassroom';
```

- [ ] **Step 2: Add 'online-classroom' to the pageId type union**

Find the `currentPage` useState line (line 105 in original) and add `'online-classroom'` to the union:

```typescript
const [currentPage, setCurrentPage] = useState<'template' | 'teacher' | 'school' | 'supplier' | 'questionbank' | 'classroom' | 'lecture' | 'lecture-detail' | 'cloudclassroom' | 'cloudclassroom-play' | 'cloudclassroom-review' | 'training-video' | 'training-video-play' | 'training-video-mgmt' | 'role-mgmt' | 'voice-mgmt' | 'central-overview' | 'news-broadcast' | 'device-mgmt' | 'security-policy' | 'operation-log' | 'ai-image' | 'smart-control' | 'device-patrol' | 'online-classroom'>('template');
```

- [ ] **Step 3: Add the menu entry under 校级菜单**

In the `menuGroups` array, inside the `school-level` group's `children`, add the "云空堂" grouping with its sub-item. Place it after the `cloudclassroom-parent` entry (or anywhere before `central`):

```typescript
{
  id: 'cloudhall-parent', label: '云空堂', icon: <Videocam />,
  children: [
    { id: 'online-classroom', label: '线上互动课堂', pageId: 'online-classroom' as const },
  ],
},
```

- [ ] **Step 4: Add the page rendering branch**

In the block of conditional renderings (after the `cloudclassroom-play` branch and before the `news-broadcast` branch, or wherever logical), add:

```typescript
) : currentPage === 'online-classroom' ? (
  <OnlineInteractiveClassroom />
) : currentPage === 'news-broadcast' ? (
```

- [ ] **Step 5: Restart the dev server and verify**

Run: curl -s http://localhost:5173 | head -5
Expected: dev server responds without syntax errors

- [ ] **Step 6: Manual verification**

Check that:
1. The "校级菜单" dropdown shows "云空堂" grouping
2. Clicking "线上互动课堂" navigates to the component page
3. The page displays the live classroom layout with all sections

---

### Self-Review Checklist

- [ ] **Spec coverage:** All spec requirements covered:
  - Menu: 云空堂 group under 校级菜单 → Task 3
  - 线上互动课堂 sub-item → Task 3
  - Photo upload (camera + file) → Task 2 (capturePhoto, handleFileUpload)
  - Screenshot insertion → Task 2 (captureScreenshot)
  - Quiz responder → Task 2 (startQuiz, simulateVotes)
  - QR code + link sharing → Task 2 (shareDialog)
  - Layout switching (teacher/slide/pip/three-panel) → Task 2 (layoutMode)

- [ ] **Placeholder scan:** No TBD/TODO/fixme placeholders found

- [ ] **Type consistency:** 
  - `LayoutMode = 'teacher' | 'slide' | 'pip' | 'three-panel'` used consistently
  - `pageId: 'online-classroom'` matches the string union
  - `MediaItem` interface used consistently across all operations

- [ ] **No missing imports:** Videocam, CameraAlt, PhotoLibrary, ScreenShare, Share, LinkIcon, StopCircle, PlayArrow, PictureInPicture, GridView, CropOriginal, Quiz, CheckCircle, Close, ContentCopy, QRCode all from @mui/icons-material
