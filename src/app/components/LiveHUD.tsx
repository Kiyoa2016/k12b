import { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import {
  Videocam, PictureInPicture, CameraAlt, CropOriginal,
  Quiz, Share, StopCircle, FiberManualRecord,
} from '@mui/icons-material';

type LayoutMode = 'teacher' | 'pip';

interface LiveHUDProps {
  onlineCount: number;
  layoutMode: LayoutMode;
  onLayoutChange: (mode: LayoutMode) => void;
  onAction: (action: 'photo' | 'screenshot' | 'quiz' | 'share' | 'stop') => void;
}

export default function LiveHUD({ onlineCount, layoutMode, onLayoutChange, onAction }: LiveHUDProps) {
  const [visible, setVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHovering = useRef(false);

  // Initial auto-show for 3s on mount, then hide
  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const show = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(true);
  }, []);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!isHovering.current) setVisible(false);
    }, 2000);
  }, []);

  const layoutOptions: { id: LayoutMode; icon: React.ReactNode; label: string }[] = [
    { id: 'teacher', icon: <Videocam fontSize="small" />, label: '板书全屏' },
    { id: 'pip', icon: <PictureInPicture fontSize="small" />, label: '画中画' },
  ];

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
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out"
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
                <IconButton size="small" onClick={() => onAction(btn.key)} aria-label={btn.label}
                  sx={{ color: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
                  {btn.icon}
                </IconButton>
              </Tooltip>
            ))}
            {/* 停止直播 */}
            <IconButton size="small" onClick={() => onAction('stop')} aria-label="停止直播"
              sx={{ color: '#ef4444', ml: 1, '&:hover': { bgcolor: 'rgba(239,68,68,0.15)' } }}>
              <StopCircle fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </>
  );
}
