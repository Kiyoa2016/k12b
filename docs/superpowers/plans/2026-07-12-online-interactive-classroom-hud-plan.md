# 线上互动课堂全屏 HUD 模式 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor OnlineInteractiveClassroom from single-mode to dual-mode (编辑 → 全屏直播), extracting LivePresentation and LiveHUD components.

**Architecture:** Container component holds all state and toggles between pre-live (existing UI) and live (LivePresentation + LiveHUD + dialogs). LivePresentation renders full-screen desktop + draggable PiP. LiveHUD floats at top on mouse hover, dispatching actions to container.

**Tech Stack:** React 18 + MUI 7 + Tailwind CSS 4 + Fullscreen API

## Global Constraints

- Must use MUI Box/Typography/Button/IconButton/Chip/Dialog components for consistency
- Must use existing Tailwind CSS class naming pattern
- Must use existing icon patterns from `@mui/icons-material`
- Camera access via `navigator.mediaDevices.getUserMedia`
- All state stays in container component
- Pre-live UI must remain functionally identical

---

### Task 1: Create LivePresentation component

**Files:**
- Create: `src/app/components/LivePresentation.tsx`

**Interfaces:**
- Consumes: MediaItem, MediaItem interface (duplicate from container — shared types)
- Produces: `LivePresentation` default export with props interface below

**Props:**
```typescript
interface LivePresentationProps {
  cameraStream: MediaStream | null;
  mediaItems: MediaItem[];
  activeOverlay: string | null;
  layoutMode: 'teacher' | 'pip';
  pipPos: { top: number; left: number } | null;
  pipRef: React.RefObject<HTMLDivElement | null>;
  onPipMouseDown: (e: React.MouseEvent) => void;
  onPipTouchStart: (e: React.TouchEvent) => void;
  desktopImage: string;
}
```

- [ ] **Step 1: Create LivePresentation.tsx with imports and types**

```typescript
import { Box } from '@mui/material';
import { Videocam, PictureInPicture } from '@mui/icons-material';

type LayoutMode = 'teacher' | 'pip';

interface MediaItem {
  id: string;
  src: string;
  name: string;
  type: 'photo' | 'upload' | 'screenshot';
}

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
```

- [ ] **Step 2: Add LivePresentation component with teacher view**

```typescript
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
```

- [ ] **Step 3: Add pip view with draggable PiP**

```typescript
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
```

- [ ] **Step 4: Add render switch and main return**

```typescript
  return (
    <Box className="fixed inset-0 bg-gray-900 z-50">
      {layoutMode === 'teacher' ? renderTeacherView() : renderPipView()}
    </Box>
  );
}
```

- [ ] **Step 5: Verify file compiles**

Run Vite build or HMR check — ensure no syntax errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/components/LivePresentation.tsx
git commit -m "feat: add LivePresentation component for fullscreen live view"
```

---

### Task 2: Create LiveHUD component

**Files:**
- Create: `src/app/components/LiveHUD.tsx`

**Interfaces:**
- Consumes: LayoutMode type
- Produces: `LiveHUD` default export, `onAction` callback type

- [ ] **Step 1: Create LiveHUD.tsx with imports, types, and mouse tracking logic**

```typescript
import { useState, useRef, useEffect } from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import {
  Videocam, PictureInPicture, CameraAlt, CropOriginal,
  Quiz, Share, StopCircle, FiberManualRecord,
} from '@mui/icons-material';

type LayoutMode = 'teacher' | 'pip';

interface LiveHUDProps {
  isLive: boolean;
  onlineCount: number;
  layoutMode: LayoutMode;
  onLayoutChange: (mode: LayoutMode) => void;
  onAction: (action: 'photo' | 'screenshot' | 'quiz' | 'share' | 'stop') => void;
}

export default function LiveHUD({ isLive, onlineCount, layoutMode, onLayoutChange, onAction }: LiveHUDProps) {
  const [visible, setVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHovering = useRef(false);

  // Initial auto-show for 3s on mount, then hide
  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const show = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(true);
  };

  const scheduleHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!isHovering.current) setVisible(false);
    }, 2000);
  };

  const layoutOptions: { id: LayoutMode; icon: React.ReactNode; label: string }[] = [
    { id: 'teacher', icon: <Videocam fontSize="small" />, label: '板书全屏' },
    { id: 'pip', icon: <PictureInPicture fontSize="small" />, label: '画中画' },
  ];
```

- [ ] **Step 2: Add HUD render (mouse tracking wrapper + HUD bar)**

```typescript
  return (
    <>
      {/* 透明感应区：占顶部 60px */}
      <Box
        className="fixed top-0 left-0 right-0 z-50"
        sx={{ height: 60 }}
        onMouseEnter={show}
        onMouseLeave={scheduleHide}
      />
      {/* HUD 控制栏 */}
      <Box
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-250 ease-in-out"
        sx={{
          transform: visible ? 'translateY(0)' : 'translateY(-100%)',
          opacity: visible ? 1 : 0,
        }}
        onMouseEnter={() => { isHovering.current = true; show(); }}
        onMouseLeave={() => { isHovering.current = false; scheduleHide(); }}
      >
        <Box className="mx-auto max-w-5xl px-4 py-2 flex items-center justify-between rounded-b-xl"
          sx={{ bgcolor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          {/* 左侧：状态 */}
          <Box className="flex items-center gap-2">
            <FiberManualRecord sx={{ fontSize: 12, color: '#22c55e' }} className="animate-pulse" />
            <Typography variant="caption" className="text-white font-medium">直播中</Typography>
            <Chip label={`${onlineCount} 人在线`} size="small"
              sx={{ height: 20, color: 'white', bgcolor: 'rgba(255,255,255,0.15)',
                '& .MuiChip-label': { px: 0.8, fontSize: 10 } }} />
          </Box>
          {/* 中间：布局切换 */}
          <Box className="flex items-center gap-1">
            {layoutOptions.map(opt => (
              <Chip
                key={opt.id}
                icon={opt.icon}
                label={opt.label}
                size="small"
                onClick={() => onLayoutChange(opt.id)}
                sx={{
                  color: layoutMode === opt.id ? 'white' : 'rgba(255,255,255,0.7)',
                  bgcolor: layoutMode === opt.id ? 'rgba(255,255,255,0.25)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
                  height: 28,
                }}
              />
            ))}
          </Box>
          {/* 右侧：操作按钮 */}
          <Box className="flex items-center gap-0.5">
            {([
              { key: 'photo' as const, icon: <CameraAlt fontSize="small" />, label: '拍照' },
              { key: 'screenshot' as const, icon: <CropOriginal fontSize="small" />, label: '截屏' },
              { key: 'quiz' as const, icon: <Quiz fontSize="small" />, label: '答题' },
              { key: 'share' as const, icon: <Share fontSize="small" />, label: '分享' },
            ]).map(btn => (
              <Tooltip key={btn.key} title={btn.label} arrow>
                <IconButton size="small" onClick={() => onAction(btn.key)}
                  sx={{ color: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                  {btn.icon}
                </IconButton>
              </Tooltip>
            ))}
            {/* 停止直播 */}
            <IconButton size="small" onClick={() => onAction('stop')}
              sx={{ color: '#ef4444', ml: 1, '&:hover': { bgcolor: 'rgba(239,68,68,0.15)' } }}>
              <StopCircle fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </>
  );
}
```

- [ ] **Step 3: Verify file compiles**

Run Vite build or HMR check.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/LiveHUD.tsx
git commit -m "feat: add LiveHUD component with auto-hide and action dispatch"
```

---

### Task 3: Refactor OnlineInteractiveClassroom into container

**Files:**
- Modify: `src/app/components/OnlineInteractiveClassroom.tsx`

**Interfaces:**
- Consumes: `LivePresentation` (default), `LiveHUD` (default)
- Produces: refactored container with same default export, same page integration

**Changes summary:**
1. Add imports for LivePresentation and LiveHUD
2. Add `stopConfirmOpen` state for stop confirmation dialog
3. Add `fullscreenChange` effect to sync isLive when Esc exits fullscreen
4. Replace the unconditional render with: `isLive ? <LiveMode> : <PreLiveMode>`
5. Wrap live mode in a fragment that renders LivePresentation + LiveHUD + dialogs
6. Pre-live mode renders the existing UI unchanged

- [ ] **Step 1: Add imports at the top**

After the existing imports, add:

```typescript
import LivePresentation from './LivePresentation';
import LiveHUD from './LiveHUD';
```

- [ ] **Step 2: Add stop confirmation and fullscreen state**

After `const [qrDataUrl, setQrDataUrl] = useState('');`, add:

```typescript
  // 停止直播确认弹窗
  const [stopConfirmOpen, setStopConfirmOpen] = useState(false);
```

- [ ] **Step 3: Add fullscreenchange listener**

After the `useEffect` that generates QR code, add:

```typescript
  // 监听 Fullscreen 退出（用户按 Esc）
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement && isLive) {
        // 用户按 Esc 退出全屏 → 自动停止直播
        if (cameraStream) {
          cameraStream.getTracks().forEach(t => t.stop());
          setCameraStream(null);
        }
        setIsLive(false);
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [isLive, cameraStream]);
```

- [ ] **Step 4: Update toggleLive for Fullscreen API**

Replace the `toggleLive` function (lines 284-303 in original) with:

```typescript
  // 直播推流控制
  const toggleLive = async () => {
    if (isLive) {
      setStopConfirmOpen(true);  // 改为弹出确认
    } else {
      // 开始推流
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setCameraStream(stream);
        setIsLive(true);
        // 触目全屏 API
        setTimeout(() => {
          document.documentElement.requestFullscreen().catch(() => {});
        }, 100);
      } catch {
        setCameraError('无法启动摄像头/麦克风');
      }
    }
  };

  const confirmStopLive = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setIsLive(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setStopConfirmOpen(false);
  };
```

- [ ] **Step 5: Add HUD action handler**

After `confirmStopLive`, add:

```typescript
  const handleHUDAction = (action: 'photo' | 'screenshot' | 'quiz' | 'share' | 'stop') => {
    switch (action) {
      case 'photo': setCameraDialogOpen(true); break;
      case 'screenshot': captureScreenshot(); break;
      case 'quiz': /* TODO: open quiz dialog in Task 4 */ break;
      case 'share': setShareDialogOpen(true); break;
      case 'stop': setStopConfirmOpen(true); break;
    }
  };
```

- [ ] **Step 6: Add live mode render block**

Before the main return (`return (`), add a live-mode conditional:

```typescript
  // 直播模式：全屏显示 + HUD
  if (isLive) {
    return (
      <>
        <LivePresentation
          cameraStream={cameraStream}
          mediaItems={mediaItems}
          activeOverlay={activeOverlay}
          layoutMode={layoutMode}
          pipPos={pipPos}
          pipRef={pipRef as React.RefObject<HTMLDivElement | null>}
          onPipMouseDown={handlePipMouseDown}
          onPipTouchStart={(e) => {
            // 触目拖拽逻辑（复用现有 handlePipMouseDown 的 touch 版）
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
          }}
          desktopImage={desktopImage}
        />
        <LiveHUD
          isLive={isLive}
          onlineCount={participants.filter(p => p.online).length}
          layoutMode={layoutMode}
          onLayoutChange={setLayoutMode}
          onAction={handleHUDAction}
        />

        {/* 拍照弹窗 */}
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
              {mediaItems.length > 0 && (
                <Box className="flex flex-wrap gap-2 mt-3">
                  {mediaItems.map(item => (
                    <img key={item.id} src={item.src} alt={item.name}
                      className="w-14 h-14 rounded-lg object-cover border-2 border-gray-300" />
                  ))}
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions className="px-6 pb-4 flex justify-center">
            <Button variant="contained" startIcon={<CameraAlt />} onClick={capturePhoto}>拍照</Button>
          </DialogActions>
        </Dialog>

        {/* 分享弹窗 */}
        <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle className="border-b">
            <Box className="flex items-center justify-between">
              <Typography variant="h6">分享直播</Typography>
              <IconButton onClick={() => setShareDialogOpen(false)} size="small"><Close /></IconButton>
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
                  onClick={() => navigator.clipboard.writeText(shareUrl).catch(() => setCameraError('复制失败'))}>
                  复制
                </Button>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions className="px-6 pb-4">
            <Button onClick={() => setShareDialogOpen(false)} variant="outlined">关闭</Button>
          </DialogActions>
        </Dialog>

        {/* 停止直播确认弹窗 */}
        <Dialog open={stopConfirmOpen} onClose={() => setStopConfirmOpen(false)} maxWidth="xs">
          <DialogTitle>停止直播</DialogTitle>
          <DialogContent>
            <Typography variant="body2">确定停止当前直播？画面将停止推流并退出全屏。</Typography>
          </DialogContent>
          <DialogActions className="px-6 pb-4">
            <Button onClick={() => setStopConfirmOpen(false)} variant="outlined">取消</Button>
            <Button onClick={confirmStopLive} variant="contained" color="error">停止直播</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
```

- [ ] **Step 7: Keep the existing return for pre-live mode**

The existing `return (...)` block (lines 403-814) stays completely unchanged. It only renders when `isLive === false` because the live mode returns early above.

- [ ] **Step 8: Open dev server and verify both modes**

```bash
# Check HMR picks up changes without errors
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/
```

Verify:
1. Pre-live UI renders exactly as before, all buttons work
2. Click "开始直播" → enters fullscreen, shows desktop + HUD
3. Mouse to top → HUD slides in; leave 2s → slides out
4. HUD buttons open correct dialogs
5. Click "停止直播" → confirm dialog → exits fullscreen → back to pre-live

- [ ] **Step 9: Commit**

```bash
git add src/app/components/OnlineInteractiveClassroom.tsx
git commit -m "feat: refactor classroom to container with live/pre-live modes"
```

---

### Task 4: Add QuizDialog for live mode

**Files:**
- Create: `src/app/components/QuizDialog.tsx`
- Modify: `src/app/components/OnlineInteractiveClassroom.tsx` (add import and wiring)

- [ ] **Step 1: Create QuizDialog.tsx**

```typescript
import { Box, Typography, Button, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Close, Quiz as QuizIcon } from '@mui/icons-material';

interface QuizDialogProps {
  open: boolean;
  onClose: () => void;
  quizQuestion: string;
  quizOptions: string[];
  quizVotes: Record<string, number>;
  quizActive: boolean;
  quizSubmitted: boolean;
  onQuestionChange: (q: string) => void;
  onOptionChange: (index: number, value: string) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onStartQuiz: () => void;
  onSimulateVotes: () => void;
  onResetQuiz: () => void;
}

export default function QuizDialog({
  open, onClose, quizQuestion, quizOptions, quizVotes,
  quizActive, quizSubmitted, onQuestionChange, onOptionChange,
  onAddOption, onRemoveOption, onStartQuiz, onSimulateVotes, onResetQuiz,
}: QuizDialogProps) {
  const totalVotes = Object.values(quizVotes).reduce((a, b) => a + b, 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="border-b">
        <Box className="flex items-center justify-between">
          <Typography variant="h6" className="flex items-center gap-2">
            <QuizIcon fontSize="small" /> 答题器
          </Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box className="py-4">
          {!quizActive ? (
            <Box className="flex flex-col gap-3">
              <TextField size="small" label="题目" value={quizQuestion}
                onChange={(e) => onQuestionChange(e.target.value)}
                placeholder="请输入题目" fullWidth />
              {quizOptions.map((opt, i) => (
                <Box key={i} className="flex items-center gap-1">
                  <Typography variant="caption" className="text-gray-500 w-5 shrink-0">
                    {String.fromCharCode(65 + i)}.
                  </Typography>
                  <TextField size="small" placeholder={`选项 ${String.fromCharCode(65 + i)}`}
                    value={opt} onChange={(e) => onOptionChange(i, e.target.value)} fullWidth />
                  {quizOptions.length > 2 && (
                    <IconButton size="small" onClick={() => onRemoveOption(i)}><Close fontSize="small" /></IconButton>
                  )}
                </Box>
              ))}
              <Box className="flex gap-2">
                <Button size="small" variant="text" onClick={onAddOption} disabled={quizOptions.length >= 6}>
                  + 添加选项
                </Button>
              </Box>
              <Button size="small" variant="contained" onClick={onStartQuiz}
                disabled={!quizQuestion.trim() || quizOptions.filter(o => o.trim()).length < 2}>
                发起答题
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" className="font-medium mb-3">{quizQuestion}</Typography>
              {quizSubmitted ? (
                <Box>
                  {Object.entries(quizVotes).map(([opt, count]) => {
                    const maxVotes = Math.max(...Object.values(quizVotes), 1);
                    const pct = maxVotes > 0 ? (count / maxVotes * 100) : 0;
                    return (
                      <Box key={opt} className="mb-1.5">
                        <Box className="flex justify-between text-xs mb-0.5">
                          <Typography variant="caption">{opt}</Typography>
                          <Typography variant="caption" className="font-mono">{count}票 ({totalVotes > 0 ? Math.round(count / totalVotes * 100) : 0}%)</Typography>
                        </Box>
                        <Box className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <Box className="h-full bg-blue-500 rounded-full transition-all" sx={{ width: `${pct}%` }} />
                        </Box>
                      </Box>
                    );
                  })}
                  <Typography variant="caption" color="text.secondary">共 {totalVotes} 票</Typography>
                  <Box className="flex gap-2 mt-2">
                    <Button size="small" variant="outlined" onClick={onSimulateVotes}>模拟投票</Button>
                    <Button size="small" variant="text" color="error" onClick={onResetQuiz}>重置</Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  {Object.keys(quizVotes).map((opt) => (
                    <Typography key={opt} variant="body2" color="text.secondary" className="mb-1">
                      {String.fromCharCode(65 + Object.keys(quizVotes).indexOf(opt))}. {opt}
                    </Typography>
                  ))}
                  <Button size="small" variant="outlined" onClick={onSimulateVotes} className="mt-2">结束答题并统计</Button>
                  <Button size="small" variant="text" color="error" onClick={onResetQuiz} className="mt-1">取消</Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Wire QuizDialog into container**

In `OnlineInteractiveClassroom.tsx`, after the LivePresentation/LiveHUD imports add:

```typescript
import QuizDialog from './QuizDialog';
```

Add state after `stopConfirmOpen`:

```typescript
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
```

In `handleHUDAction`, replace the quiz case:

```typescript
      case 'quiz': setQuizDialogOpen(true); break;
```

In the live mode JSX, after the share Dialog, add:

```typescript
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
```

- [ ] **Step 3: Verify and commit**

```bash
git add src/app/components/QuizDialog.tsx src/app/components/OnlineInteractiveClassroom.tsx
git commit -m "feat: add QuizDialog for live mode quiz interaction"
```

---

### Self-Review Checklist

- [ ] **Spec coverage:** All spec sections covered:
  - LivePresentation → Task 1
  - LiveHUD → Task 2
  - Container refactor (mode toggle, Fullscreen, dialogs) → Task 3
  - Quiz dialog for live mode → Task 4

- [ ] **Placeholder scan:** No TBD, TODO, or incomplete code blocks

- [ ] **Type consistency:** 
  - `LayoutMode = 'teacher' | 'pip'` consistent across all files
  - `onAction` type `'photo' | 'screenshot' | 'quiz' | 'share' | 'stop'` consistent
  - `MediaItem` interface duplicated in LivePresentation — single source kept in container

- [ ] **No missing imports:** All MUI icons and components accounted for

- [ ] **Regression check:** Pre-live UI in container's existing `return` block untouched — functionally identical
