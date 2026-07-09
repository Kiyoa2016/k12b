import { useState, useMemo, useEffect } from 'react';
import studentImage from '../../../image/学生.jpeg';
import boardImage from '../../../image/板书.jpg';
import {
  Box, Typography, Card, CardContent, Button, IconButton,
  TextField, InputAdornment, Chip, Tooltip,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper,
  MenuItem, FormControl, Select,
  Dialog, DialogTitle, DialogContent,
  Snackbar, Alert, Divider,
} from '@mui/material';
import SendMessageDialog, { type MessageTarget, type SendMessagePayload } from './SendMessageDialog';
import ScoringDialog from './ScoringDialog';
import {
  ChevronRight, ExpandMore, Search, ViewList, ViewModule,
  Business, LocationOn, Visibility, Close, Videocam, Monitor,
  PowerSettingsNew, PowerOff, Campaign, Send, StopCircle,
  Lock, EditNote, LockOpen,
} from '@mui/icons-material';

// ─── 类型定义 ───

interface DesktopIcon {
  left: number;
  top: number;
  color: string;
  label: string;
}

export interface Classroom {
  id: string;
  name: string;
  building: string;
  floor: string;
  room: string;
  deviceCode: string;
  status: 'online' | 'offline';
  grade: string;
  classLabel: string;
  screenBg: string;
  screenIcons: DesktopIcon[];
  screenApp?: { left: number; top: number; width: number; height: number; color: string; label: string };
}

interface TreeNode {
  key: string;
  label: string;
  children?: TreeNode[];
  roomCount: number;
}

// ─── 常量数据 ───

const BUILDINGS = [
  { name: '东教学楼', floors: [
      { name: '一楼', rooms: ['101', '102', '103'] },
      { name: '二楼', rooms: ['201', '202'] },
      { name: '三楼', rooms: ['301'] },
    ] },
  { name: '西教学楼', floors: [
      { name: '一楼', rooms: ['101', '102'] },
      { name: '二楼', rooms: ['201', '202', '203'] },
    ] },
  { name: '综合楼', floors: [
      { name: '一楼', rooms: ['101', '102', '103', '104'] },
      { name: '二楼', rooms: ['201', '202'] },
    ] },
];

const SCREEN_BGS = [
  'linear-gradient(135deg, #0ea5e9, #06b6d4)',
  'linear-gradient(135deg, #8b5cf6, #6366f1)',
  'linear-gradient(135deg, #f43f5e, #ec4899)',
  'linear-gradient(135deg, #10b981, #34d399)',
  'linear-gradient(135deg, #f59e0b, #f97316)',
  'linear-gradient(135deg, #1e293b, #334155)',
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #14b8a6, #0d9488)',
  'linear-gradient(180deg, #1e3a5f, #2d5a87)',
  'linear-gradient(135deg, #7c3aed, #a855f7)',
];

const DESKTOP_APPS = [
  { label: '白板', color: '#3b82f6' },
  { label: '浏览器', color: '#f59e0b' },
  { label: '课件', color: '#10b981' },
  { label: '作业', color: '#8b5cf6' },
  { label: '资源', color: '#06b6d4' },
  { label: '设置', color: '#6b7280' },
  { label: '考试', color: '#ef4444' },
  { label: 'Office', color: '#2563eb' },
];

function rand(min: number, max: number): number {
  return Math.round(Math.random() * (max - min) + min);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── 生成教室数据 ───

function generateClassrooms(): Classroom[] {
  const list: Classroom[] = [];
  let idx = 0;
  for (const building of BUILDINGS) {
    for (const floor of building.floors) {
      for (const room of floor.rooms) {
        idx++;
        const status: Classroom['status'] = Math.random() < 0.8 ? 'online' : 'offline';

        // 随机桌面图标位置（3~5个图标）
        const iconCount = rand(3, 5);
        const usedPositions = new Set<string>();
        const screenIcons: DesktopIcon[] = [];
        for (let i = 0; i < iconCount; i++) {
          let left: number, top: number, key: string;
          do {
            left = rand(4, 76);
            top = rand(4, 60);
            key = `${left}-${top}`;
          } while (usedPositions.has(key));
          usedPositions.add(key);
          screenIcons.push({
            left, top, color: pick(DESKTOP_APPS).color,
            label: pick(DESKTOP_APPS).label,
          });
        }

        // 随机打开的应用窗口（60% 概率）
        const hasOpenApp = Math.random() < 0.6;
        const screenApp = hasOpenApp ? {
          left: rand(8, 20),
          top: rand(10, 18),
          width: rand(50, 70),
          height: rand(40, 55),
          color: pick(DESKTOP_APPS).color,
          label: pick(DESKTOP_APPS).label,
        } : undefined;

        // 年级/班级映射：一楼→一年级，二楼→二年级… 房间号末位→（1）班/（2）班…
        const GRADE_MAP: Record<string, string> = { '一楼': '一年级', '二楼': '二年级', '三楼': '三年级', '四楼': '四年级' };
        const grade = GRADE_MAP[floor.name] || '一年级';
        const classNum = room.slice(-1);
        const classLabel = `（${classNum}）班`;

        list.push({
          id: `cr-${idx}`,
          name: `${building.name}${room}教室`,
          building: building.name,
          floor: floor.name,
          room,
          deviceCode: `DEV-EDU-${String(idx).padStart(3, '0')}`,
          status,
          grade,
          classLabel,
          screenBg: pick(SCREEN_BGS),
          screenIcons,
          screenApp,
        });
      }
    }
  }
  return list;
}

// ─── 生成树数据 ───

function buildTreeData(): TreeNode[] {
  return BUILDINGS.map((b) => ({
    key: `b-${b.name}`,
    label: b.name,
    roomCount: b.floors.reduce((sum, f) => sum + f.rooms.length, 0),
    children: b.floors.map((f) => ({
      key: `f-${b.name}-${f.name}`,
      label: f.name,
      roomCount: f.rooms.length,
    })),
  }));
}

// ─── 树节点组件 ───

function TreeItem({
  node, depth, selectedKey, onSelect, expandedKeys, onToggle,
}: {
  node: TreeNode;
  depth: number;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
}) {
  const isExpanded = expandedKeys.has(node.key);
  const isSelected = selectedKey === node.key;
  const hasChildren = node.children && node.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      // 楼栋节点：点击切换展开/收起，同时选中
      onToggle(node.key);
      onSelect(node.key);
    } else {
      // 楼层节点：点击只选中
      onSelect(node.key);
    }
  };

  return (
    <Box>
      <Box
        className={`flex items-center gap-1.5 py-1.5 cursor-pointer rounded-lg transition-colors text-sm ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
        sx={{ px: 1.5, pl: depth === 0 ? 1.5 : undefined }}
        onClick={handleClick}
      >
        {depth > 0 && <Box sx={{ width: depth * 20, flexShrink: 0 }} />}
        {hasChildren ? (
          <IconButton size="small" sx={{ p: 0, minWidth: 20, height: 20 }} onClick={(e) => { e.stopPropagation(); onToggle(node.key); }}>
            {isExpanded ? <ExpandMore sx={{ fontSize: 18 }} /> : <ChevronRight sx={{ fontSize: 18 }} />}
          </IconButton>
        ) : (
          <Box sx={{ width: 20, flexShrink: 0 }} />
        )}
        <Typography variant="body2" className={`truncate ${isSelected ? 'font-medium' : ''}`}>
          {node.label}
        </Typography>
        <Typography variant="caption" color="text.secondary" className="ml-auto shrink-0">
          {node.roomCount}间
        </Typography>
      </Box>
      {hasChildren && isExpanded && (
        <Box>
          {node.children!.map((child) => (
            <TreeItem
              key={child.key}
              node={child}
              depth={depth + 1}
              selectedKey={selectedKey}
              onSelect={onSelect}
              expandedKeys={expandedKeys}
              onToggle={onToggle}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

// ─── 桌面预览组件 ───

function DesktopPreview({ classroom }: { classroom: Classroom }) {
  return (
    <Box
      className="rounded-lg overflow-hidden relative"
      sx={{
        width: '100%',
        aspectRatio: '16 / 10',
        background: classroom.screenBg,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)',
      }}
    >
      {/* 顶部浮窗：位置信息 */}
      <Box
        className="absolute top-0 left-0 right-0 flex items-center px-2 z-10"
        sx={{ height: 24, background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0))' }}
      >
        <Typography variant="caption" sx={{ fontSize: 10, color: 'rgba(255,255,255,0.95)', fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
          {classroom.room}教室 — {classroom.grade}{classroom.classLabel}
        </Typography>
        <Chip
          label={classroom.status === 'online' ? '在线' : '离线'}
          size="small"
          sx={{ ml: 'auto', height: 16, fontSize: 9, fontWeight: 600, backgroundColor: classroom.status === 'online' ? 'rgba(22,163,74,0.7)' : 'rgba(156,163,175,0.7)', color: '#fff', '& .MuiChip-label': { px: 0.5 } }}
        />
      </Box>

      {/* 桌面图标 */}
      {classroom.screenIcons.map((icon, i) => (
        <Box
          key={i}
          className="absolute flex flex-col items-center gap-0.5"
          sx={{ left: `${icon.left}%`, top: `${icon.top}%`, transform: 'translate(-50%, 0)' }}
        >
          <Box sx={{ width: 20, height: 20, borderRadius: 0.5, backgroundColor: icon.color, opacity: 0.85 }} />
          <Typography variant="caption" sx={{ fontSize: 8, color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 2px rgba(0,0,0,0.5)', lineHeight: 1.1 }}>
            {icon.label}
          </Typography>
        </Box>
      ))}

      {/* 打开的应用窗口 */}
      {classroom.screenApp && (
        <Box
          className="absolute rounded-lg overflow-hidden"
          sx={{
            left: `${classroom.screenApp.left}%`,
            top: `${classroom.screenApp.top}%`,
            width: `${classroom.screenApp.width}%`,
            height: `${classroom.screenApp.height}%`,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          <Box sx={{ height: 18, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', px: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: classroom.screenApp.color, mr: 0.5 }} />
            <Typography variant="caption" sx={{ fontSize: 8, color: 'rgba(255,255,255,0.8)' }}>
              {classroom.screenApp.label}
            </Typography>
          </Box>
          <Box
            sx={{ flex: 1, m: 1, borderRadius: 0.5, backgroundColor: 'rgba(255,255,255,0.05)', height: 'calc(100% - 26px)' }}
          />
        </Box>
      )}

      {/* 任务栏 */}
      <Box
        className="absolute bottom-0 left-0 right-0 flex items-center px-2"
        sx={{ height: 20, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      >
        <Box sx={{ width: 12, height: 12, borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.5)' }} />
        </Box>
        <Typography variant="caption" sx={{ fontSize: 8, color: 'rgba(255,255,255,0.7)', ml: 1 }}>
          {classroom.deviceCode}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', ml: 'auto' }}>
          {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── 视频巡视弹窗 ───

const CHANNELS = [
  { id: 'teacher', label: '老师', icon: <Videocam sx={{ fontSize: 16 }} /> },
  { id: 'student', label: '学生', icon: <Visibility sx={{ fontSize: 16 }} /> },
  { id: 'board', label: '板书', icon: <Monitor sx={{ fontSize: 16 }} /> },
];

function generateChannels(room: string) {
  return CHANNELS.map((ch) => ({
    ...ch,
    online: Math.random() < 0.95,
  }));
}

function PatrolDialog({ classroom, open, onClose }: { classroom: Classroom | null; open: boolean; onClose: () => void }) {
  const channels = useMemo(() => (classroom ? generateChannels(classroom.room) : []), [classroom]);
  const [activeChannel, setActiveChannel] = useState(2); // 默认选中板书
  // 教室切换时重置到板书（板书索引为2，若通道数不足则取最后一个）
  useEffect(() => {
    setActiveChannel(Math.min(2, channels.length - 1));
  }, [channels.length]);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [sendMessageOpen, setSendMessageOpen] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [quality, setQuality] = useState<'sd' | 'hd' | 'uhd'>('hd');
  const [lockscreen, setLockscreen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [scoringOpen, setScoringOpen] = useState(false);

  const qualityConfig = {
    sd: { label: '标清', shortLabel: 'SD', resolution: '640×360', bitrate: '800Kbps' },
    hd: { label: '高清', shortLabel: 'HD', resolution: '1280×720', bitrate: '2Mbps' },
    uhd: { label: '超清', shortLabel: 'UHD', resolution: '1920×1080', bitrate: '4Mbps' },
  };

  const handleBroadcastToggle = () => {
    if (!classroom) return;
    if (broadcasting) {
      setBroadcasting(false);
      setSnackbar({ open: true, message: `已停止对 ${classroom.name} 的远程喊话` });
      // TODO: 调用停止喊话 API
    } else {
      setBroadcasting(true);
      setSnackbar({ open: true, message: `已向 ${classroom.name} 发起远程喊话，请对着麦克风说话` });
      // TODO: 调用开始喊话 API
    }
  };

  const handleSendMessage = (payload: SendMessagePayload) => {
    setSnackbar({ open: true, message: `已发送信息至 ${classroom!.name}` });
    // TODO: 调用实际 API — payload 包含完整消息配置
  };

  if (!classroom) return null;
  const current = channels[activeChannel];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb', py: 1.5 }}>
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <Typography variant="h6" className="font-bold">{classroom.name}</Typography>
            <Chip label={`${classroom.grade}${classroom.classLabel}`} size="small" sx={{ height: 20, fontSize: 10, backgroundColor: '#dbeafe', color: '#2563eb', fontWeight: 600 }} />
          </Box>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        <Box className="flex gap-3" sx={{ height: 528 }}>
          {/* 左：视频流 + 控制按钮 */}
          <Box className="flex-1 flex flex-col gap-0">
            <Box className="flex-1 rounded-lg overflow-hidden relative" sx={{ backgroundColor: '#0f172a' }}>
            {broadcasting && (
              <Box className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center gap-2" sx={{ height: 32, backgroundColor: 'rgba(239,68,68,0.9)' }}>
                <Campaign sx={{ fontSize: 14, color: '#fff' }} />
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, fontSize: 11 }}>
                  远程喊话中 — 正在对 {classroom.name} 进行喊话
                </Typography>
              </Box>
            )}
            {current ? (
              <>
                {/* 模拟视频画面 */}
                <Box
                  className="absolute inset-0 flex items-center justify-center"
                  sx={{
                    background: current.id === 'board' || current.id === 'student'
                      ? '#000'
                      : 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 30%, #1e3a5f 60%, #2d5a87 100%)',
                  }}
                >
                  {current.id === 'student' ? (
                    <Box
                      component="img"
                      src={studentImage}
                      alt="学生画面"
                      sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : current.id === 'board' ? (
                    <Box
                      component="img"
                      src={boardImage}
                      alt="板书画面"
                      sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                  <>
                  {/* 视频画面中的模拟元素 */}
                  <Box className="absolute inset-0" sx={{ opacity: 0.15 }}>
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </Box>
                  {/* 视频中央提示 */}
                  <Box className="text-center z-10">
                    {current.icon && (
                      <Box sx={{ fontSize: 48, color: 'rgba(255,255,255,0.2)', mb: 1 }}>
                        {current.icon}
                      </Box>
                    )}
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 0.5 }}>
                      {current.label} — 实时画面
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                      {current.online ? '● 视频流正常' : '○ 视频流断开'}
                    </Typography>
                  </Box>
                  </>)}
                  {/* 视频底部叠加信息 */}
                  <Box className="absolute bottom-0 left-0 right-0 px-3 py-1.5" sx={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                    <Box className="flex items-center gap-3">
                      <Typography variant="caption" sx={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
                        {classroom.name}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                        {classroom.room}教室
                      </Typography>
                      {/* 清晰度切换 */}
                      <Box className="flex items-center gap-0.5 ml-auto mr-2">
                        {(['sd', 'hd', 'uhd'] as const).map((q) => (
                          <Tooltip key={q} title={`${qualityConfig[q].label} · ${qualityConfig[q].resolution} · ${qualityConfig[q].bitrate}`}>
                            <Box
                              className="cursor-pointer select-none"
                              onClick={(e) => { e.stopPropagation(); setQuality(q); }}
                              sx={{
                                px: 0.6, py: 0.15, borderRadius: '2px',
                                fontSize: 9, fontWeight: quality === q ? 700 : 500,
                                color: quality === q ? '#fff' : 'rgba(255,255,255,0.6)',
                                backgroundColor: quality === q ? 'rgba(59,130,246,0.85)' : 'transparent',
                                transition: 'all 0.15s',
                                '&:hover': { backgroundColor: quality === q ? 'rgba(59,130,246,0.85)' : 'rgba(255,255,255,0.1)' },
                              }}
                            >
                              {qualityConfig[q].shortLabel}
                            </Box>
                          </Tooltip>
                        ))}
                      </Box>
                      <Box className="flex items-center gap-2">
                        <Typography variant="caption" sx={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
                          {qualityConfig[quality].resolution}
                        </Typography>
                        <Box className="flex items-center gap-1">
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: current.online ? '#22c55e' : '#ef4444' }} />
                          <Typography variant="caption" sx={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>
                            {current.online ? 'LIVE' : 'OFFLINE'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </>
            ) : (
              <Box className="absolute inset-0 flex items-center justify-center">
                <Typography variant="body2" color="text.secondary">暂无可用视频流</Typography>
              </Box>
            )}
          </Box>

            {/* 远程控制按钮栏 */}
            <div className="flex items-center gap-3 px-3 py-2 flex-wrap min-h-[48px] border-t border-gray-200 bg-[#fafafa] rounded-b-lg">
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap', fontSize: 12 }}>
                远程控制：
              </Typography>

              {/* 开机 — 离线时可用，在线时禁用 */}
              <Tooltip title={classroom.status === 'online' ? '设备已处于开机状态' : ''}>
                <span>
                  <Button
                    size="small"
                    variant="text"
                    disabled={classroom.status === 'online'}
                    startIcon={<PowerSettingsNew sx={{ fontSize: 16 }} />}
                    onClick={() => {
                      setSnackbar({ open: true, message: `已发送开机指令至 ${classroom.name}` });
                      // TODO: 调用开机 API
                    }}
                    sx={{ fontSize: 12, fontWeight: 600, color: '#16a34a', minWidth: 'auto', px: 1, '&:hover': { backgroundColor: '#16a34a10' }, '&.Mui-disabled': { opacity: 0.4 } }}
                  >
                    开机
                  </Button>
                </span>
              </Tooltip>

              {/* 关机 — 在线时可用 */}
              <Tooltip title={classroom.status === 'offline' ? '设备已离线，无法执行此操作' : ''}>
                <span>
                  <Button
                    size="small"
                    variant="text"
                    disabled={classroom.status === 'offline'}
                    startIcon={<PowerOff sx={{ fontSize: 16 }} />}
                    onClick={() => {
                      setSnackbar({ open: true, message: `已发送关机指令至 ${classroom.name}` });
                      // TODO: 调用关机 API
                    }}
                    sx={{ fontSize: 12, fontWeight: 600, color: '#ef4444', minWidth: 'auto', px: 1, '&:hover': { backgroundColor: '#ef444410' }, '&.Mui-disabled': { opacity: 0.4 } }}
                  >
                    关机
                  </Button>
                </span>
              </Tooltip>

              {/* 远程喊话 — 在线时可用，点击后切换为停止喊话 */}
              <Tooltip title={classroom.status === 'offline' ? '设备已离线，无法执行此操作' : (broadcasting ? '点击停止喊话' : '点击开始远程喊话')}>
                <span>
                  <Button
                    size="small"
                    variant={broadcasting ? 'contained' : 'text'}
                    disabled={classroom.status === 'offline'}
                    startIcon={broadcasting ? <StopCircle sx={{ fontSize: 16 }} /> : <Campaign sx={{ fontSize: 16 }} />}
                    onClick={handleBroadcastToggle}
                    sx={{
                      fontSize: 12, fontWeight: 700, minWidth: 'auto', px: 1,
                      ...(broadcasting
                        ? { backgroundColor: '#ef4444', color: '#fff', '&:hover': { backgroundColor: '#dc2626' } }
                        : { color: '#3b82f6', '&:hover': { backgroundColor: '#3b82f610' } }
                      ),
                      '&.Mui-disabled': { opacity: 0.4 },
                    }}
                  >
                    {broadcasting ? '停止喊话' : '喊话'}
                  </Button>
                </span>
              </Tooltip>

              {/* 发送信息 — 在线时可用 */}
              <Tooltip title={classroom.status === 'offline' ? '设备已离线，无法执行此操作' : ''}>
                <span>
                  <Button
                    size="small"
                    variant="text"
                    disabled={classroom.status === 'offline'}
                    startIcon={<Send sx={{ fontSize: 16 }} />}
                    onClick={() => setSendMessageOpen(true)}
                    sx={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', minWidth: 'auto', px: 1, '&:hover': { backgroundColor: '#3b82f610' }, '&.Mui-disabled': { opacity: 0.4 } }}
                  >
                    发信息
                  </Button>
                </span>
              </Tooltip>

              {/* 分隔符 */}
              <div className="w-px h-5 bg-gray-200 shrink-0" />

              {/* 巡视备注 — 始终可用 */}
              <Tooltip title="添加巡视备注">
                <span>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<EditNote sx={{ fontSize: 16 }} />}
                    onClick={() => setNotesOpen(true)}
                    sx={{ fontSize: 12, fontWeight: 600, color: '#8b5cf6', minWidth: 'auto', px: 1, '&:hover': { backgroundColor: '#8b5cf610' } }}
                  >
                    备注
                  </Button>
                </span>
              </Tooltip>

              {/* 教学评价 — 始终可用 */}
              <Tooltip title="教学评价">
                <span>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<span style={{ fontSize: 16 }}>📋</span>}
                    onClick={() => setScoringOpen(true)}
                    sx={{ fontSize: 12, fontWeight: 600, color: '#059669', minWidth: 'auto', px: 1, '&:hover': { backgroundColor: '#05966910' } }}
                  >
                    教学评价
                  </Button>
                </span>
              </Tooltip>

              {/* 分隔符 */}
              <div className="w-px h-5 bg-gray-200 shrink-0" />

              {/* 锁屏 — 在线时可用 */}
              <Tooltip title={classroom.status === 'offline' ? '设备已离线，无法执行此操作' : (lockscreen ? '设备已锁屏，点击解锁' : '锁定设备屏幕')}>
                <span>
                  <Button
                    size="small"
                    variant={lockscreen ? 'contained' : 'text'}
                    disabled={classroom.status === 'offline'}
                    startIcon={lockscreen ? <Lock sx={{ fontSize: 16 }} /> : <LockOpen sx={{ fontSize: 16 }} />}
                    onClick={() => {
                      const next = !lockscreen;
                      setLockscreen(next);
                      setSnackbar({ open: true, message: next ? `已锁定 ${classroom.name} 屏幕` : `已解锁 ${classroom.name} 屏幕` });
                      // TODO: 调用锁屏/解锁 API
                    }}
                    sx={{
                      fontSize: 12, fontWeight: 700, minWidth: 'auto', px: 1,
                      ...(lockscreen
                        ? { backgroundColor: '#f59e0b', color: '#fff', '&:hover': { backgroundColor: '#d97706' } }
                        : { color: '#f59e0b', '&:hover': { backgroundColor: '#f59e0b10' } }
                      ),
                      '&.Mui-disabled': { opacity: 0.4 },
                    }}
                  >
                    {lockscreen ? '已锁屏' : '锁屏'}
                  </Button>
                </span>
              </Tooltip>
            </div>
          </Box>

          {/* 右：设备信息 + 视频流切换列表 */}
          <Box className="w-56 flex-shrink-0 flex flex-col gap-2">
            {/* 设备信息 */}
            <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid #e5e7eb', backgroundColor: '#fafafa' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151', fontSize: 11, mb: 1, display: 'block' }}>
                设备信息
              </Typography>
              <Box className="flex flex-col gap-1">
                <Box className="flex justify-between">
                  <Typography variant="caption" sx={{ fontSize: 10, color: '#9ca3af' }}>设备编号</Typography>
                  <Typography variant="caption" sx={{ fontSize: 10, color: '#374151', fontWeight: 600 }}>{classroom.deviceCode}</Typography>
                </Box>
                <Box className="flex justify-between">
                  <Typography variant="caption" sx={{ fontSize: 10, color: '#9ca3af' }}>所在位置</Typography>
                  <Typography variant="caption" sx={{ fontSize: 10, color: '#374151', fontWeight: 600 }}>{classroom.building} {classroom.room}</Typography>
                </Box>
                <Box className="flex justify-between">
                  <Typography variant="caption" sx={{ fontSize: 10, color: '#9ca3af' }}>年级班级</Typography>
                  <Typography variant="caption" sx={{ fontSize: 10, color: '#374151', fontWeight: 600 }}>{classroom.grade}{classroom.classLabel}</Typography>
                </Box>
                <Box className="flex justify-between items-center">
                  <Typography variant="caption" sx={{ fontSize: 10, color: '#9ca3af' }}>设备状态</Typography>
                  <Chip
                    label={classroom.status === 'online' ? '在线' : '离线'}
                    size="small"
                    sx={{ height: 16, fontSize: 9, fontWeight: 600, backgroundColor: classroom.status === 'online' ? '#dcfce7' : '#f3f4f6', color: classroom.status === 'online' ? '#16a34a' : '#6b7280', '& .MuiChip-label': { px: 0.5 } }}
                  />
                </Box>
              </Box>
            </Box>

            {/* 视频源列表 */}
            <Typography variant="subtitle2" className="font-bold text-gray-700">视频源列表</Typography>
            {channels.map((ch, i) => {
              const isActive = i === activeChannel;
              return (
                <Box
                  key={ch.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
                  onClick={() => setActiveChannel(i)}
                >
                  <Box sx={{ color: isActive ? '#3b82f6' : '#9ca3af' }}>
                    {ch.icon}
                  </Box>
                  <Box className="flex-1 min-w-0">
                    <Box className="flex items-center gap-1">
                      <Typography variant="body2" className={`${isActive ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                        {ch.label}
                      </Typography>
                      {isActive && (
                        <Typography variant="caption" sx={{ fontSize: 10, color: '#3b82f6', fontWeight: 600 }}>
                          当前
                        </Typography>
                      )}
                    </Box>
                    <Box className="flex items-center gap-1">
                      <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: ch.online ? '#22c55e' : '#ef4444' }} />
                      <Typography variant="caption" color="text.secondary">{ch.online ? '在线' : '离线'}</Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Snackbar 提示 */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ open: false, message: '' })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" variant="filled" sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* 发送信息弹窗 */}
        <SendMessageDialog
          target={classroom ? { id: classroom.id, name: classroom.name, room: classroom.room, deviceCode: classroom.deviceCode } : null}
          open={sendMessageOpen}
          onClose={() => setSendMessageOpen(false)}
          onSend={handleSendMessage}
        />

        {/* 巡视备注弹窗 */}
        <Dialog open={notesOpen} onClose={() => setNotesOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb', py: 1.5 }}>
            <Box className="flex items-center justify-between">
              <Box className="flex items-center gap-2">
                <EditNote sx={{ fontSize: 20, color: '#8b5cf6' }} />
                <Typography variant="h6" className="font-bold">巡视备注</Typography>
              </Box>
              <IconButton onClick={() => setNotesOpen(false)} size="small"><Close /></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 2 }}>
            <Box className="flex flex-col gap-3">
              <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid #e5e7eb', backgroundColor: '#fafafa' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', fontSize: 11, mb: 1, display: 'block' }}>
                  当前设备
                </Typography>
                <Box className="flex items-center gap-2">
                  <Monitor sx={{ fontSize: 16, color: '#6b7280' }} />
                  <Typography variant="body2" className="font-medium">{classroom.name}</Typography>
                  <Chip label={`${classroom.grade}${classroom.classLabel}`} size="small" sx={{ height: 18, fontSize: 9, backgroundColor: '#dbeafe', color: '#2563eb', fontWeight: 600 }} />
                  <Chip label={classroom.deviceCode} size="small" sx={{ height: 18, fontSize: 9, backgroundColor: '#f3f4f6', color: '#6b7280', fontWeight: 500 }} />
                </Box>
              </Box>
              <TextField
                label="备注内容"
                multiline
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="请输入巡视备注，如设备运行情况、异常记录等..."
                fullWidth
              />
              <Box className="flex justify-end gap-2">
                <Button variant="outlined" size="small" onClick={() => { setNotes(''); setNotesOpen(false); }}>
                  取消
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  disabled={!notes.trim()}
                  sx={{ backgroundColor: '#8b5cf6', '&:hover': { backgroundColor: '#7c3aed' } }}
                  onClick={() => {
                    setSnackbar({ open: true, message: `已保存 ${classroom.name} 的巡视备注` });
                    setNotesOpen(false);
                    // TODO: 调用保存备注 API
                  }}
                >
                  保存备注
                </Button>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>

        {/* 教学评价弹窗 */}
        <ScoringDialog
          open={scoringOpen}
          lecture={{
            id: classroom.id,
            courseName: `${classroom.name} 课堂教学`,
            teacher: '--',
            className: classroom.name,
            date: new Date().toISOString().split('T')[0],
            time: '--:--',
            classroom: classroom.name,
            grade: classroom.grade,
            subject: '--',
            evaluationForm: '课堂评价',
            evaluator: '当前用户',
            observers: [],
            status: '待评',
          }}
          onClose={() => setScoringOpen(false)}
          onSubmit={(lectureId, scores) => {
            setSnackbar({ open: true, message: `已提交 ${classroom.name} 的教学评价（评分 ${Object.values(scores).reduce((a, b) => a + b, 0)} 分）` });
            setScoringOpen(false);
            // TODO: 调用教学评价提交 API
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

// ─── 教室卡片组件 ───

function ClassroomCard({ classroom, onPatrol }: { classroom: Classroom; onPatrol: (c: Classroom) => void }) {
  return (
    <Card
      elevation={0}
      sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden', cursor: 'pointer', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.12)' } }}
      onClick={() => onPatrol(classroom)}
    >
      <DesktopPreview classroom={classroom} />
    </Card>
  );
}

// ─── 生成班级树数据 ───

function buildClassTreeData(classrooms: Classroom[]): TreeNode[] {
  const gradeMap = new Map<string, Map<string, Classroom[]>>();
  for (const cr of classrooms) {
    if (!gradeMap.has(cr.grade)) {
      gradeMap.set(cr.grade, new Map());
    }
    const classMap = gradeMap.get(cr.grade)!;
    if (!classMap.has(cr.classLabel)) {
      classMap.set(cr.classLabel, []);
    }
    classMap.get(cr.classLabel)!.push(cr);
  }
  return Array.from(gradeMap.entries()).map(([grade, classMap]) => ({
    key: `g-${grade}`,
    label: grade,
    roomCount: Array.from(classMap.values()).reduce((sum, crs) => sum + crs.length, 0),
    children: Array.from(classMap.entries()).map(([classLabel, crs]) => ({
      key: `c-${grade}-${classLabel}`,
      label: classLabel,
      roomCount: crs.length,
    })),
  }));
}

// ─── 巡视记录类型 ───

interface PatrolRecord {
  id: string;
  classroomId: string;
  classroomName: string;
  building: string;
  room: string;
  deviceCode: string;
  status: 'online' | 'offline';
  grade: string;
  classLabel: string;
  note: string;
  patrolTime: Date;
}

const PATROL_NOTE_TEMPLATES = [
  '设备运行正常，屏幕显示清晰',
  '设备运行正常，系统流畅',
  '设备黑屏，重启后恢复',
  '网络连接不稳定，画面卡顿',
  '投影画面模糊，需要调整焦距',
  '设备运行正常，无异常',
  '音频输出异常，已报修',
  '触控不灵敏，建议校准',
];

function generatePatrolRecords(classrooms: Classroom[]): PatrolRecord[] {
  const records: PatrolRecord[] = [];
  const now = Date.now();
  const DAY = 86400000;
  for (let i = 0; i < 30; i++) {
    const cr = classrooms[rand(0, classrooms.length - 1)];
    const time = new Date(now - rand(0, 14) * DAY + rand(0, 12) * 3600000);
    records.push({
      id: `pr-${i}`,
      classroomId: cr.id,
      classroomName: cr.name,
      building: cr.building,
      room: cr.room,
      deviceCode: cr.deviceCode,
      status: Math.random() < 0.85 ? 'online' : 'offline',
      grade: cr.grade,
      classLabel: cr.classLabel,
      note: PATROL_NOTE_TEMPLATES[rand(0, PATROL_NOTE_TEMPLATES.length - 1)],
      patrolTime: time,
    });
  }
  return records.sort((a, b) => b.patrolTime.getTime() - a.patrolTime.getTime());
}

// ─── 主组件 ───

export default function DevicePatrol() {
  const [classrooms] = useState<Classroom[]>(generateClassrooms);
  const [buildingTreeData] = useState<TreeNode[]>(buildTreeData);
  const [treeMode, setTreeMode] = useState<'building' | 'class'>('building');
  const [selectedKey, setSelectedKey] = useState<string | null>('b-东教学楼');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(['b-东教学楼']));
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [patrolTarget, setPatrolTarget] = useState<Classroom | null>(null);
  const [patrolOpen, setPatrolOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<'classroom' | 'record' | 'task'>('classroom');
  const [records] = useState<PatrolRecord[]>(() => generatePatrolRecords(classrooms));
  const [recordDetail, setRecordDetail] = useState<PatrolRecord | null>(null);

  const classTreeData = useMemo(() => buildClassTreeData(classrooms), [classrooms]);
  const treeData = treeMode === 'building' ? buildingTreeData : classTreeData;

  const handleTreeModeChange = (mode: 'building' | 'class') => {
    setTreeMode(mode);
    if (mode === 'building') {
      setSelectedKey('b-东教学楼');
      setExpandedKeys(new Set(['b-东教学楼']));
    } else {
      const firstKey = classTreeData[0]?.key;
      setSelectedKey(firstKey ?? null);
      setExpandedKeys(firstKey ? new Set([firstKey]) : new Set());
    }
  };

  const handlePatrol = (c: Classroom) => {
    setPatrolTarget(c);
    setPatrolOpen(true);
  };

  // 展开/收起树节点
  const handleToggle = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // 从选中节点获取过滤条件
  const filterCriteria = useMemo(() => {
    if (!selectedKey) return { building: null as string | null, floor: null as string | null, grade: null as string | null, classLabel: null as string | null };
    if (treeMode === 'building') {
      if (selectedKey.startsWith('b-')) {
        return { building: selectedKey.replace('b-', ''), floor: null, grade: null, classLabel: null };
      }
      if (selectedKey.startsWith('f-')) {
        const parts = selectedKey.replace('f-', '').split('-');
        return { building: parts[0], floor: parts.slice(1).join('-'), grade: null, classLabel: null };
      }
    } else {
      if (selectedKey.startsWith('g-')) {
        return { grade: selectedKey.replace('g-', ''), classLabel: null, building: null, floor: null };
      }
      if (selectedKey.startsWith('c-')) {
        const parts = selectedKey.replace('c-', '').split('-');
        return { grade: parts[0], classLabel: parts.slice(1).join('-'), building: null, floor: null };
      }
    }
    return { building: null, floor: null, grade: null, classLabel: null };
  }, [selectedKey, treeMode]);

  // 过滤教室
  const filteredClassrooms = useMemo(() => {
    return classrooms.filter((c) => {
      if (filterCriteria.building && c.building !== filterCriteria.building) return false;
      if (filterCriteria.floor && c.floor !== filterCriteria.floor) return false;
      if (filterCriteria.grade && c.grade !== filterCriteria.grade) return false;
      if (filterCriteria.classLabel && c.classLabel !== filterCriteria.classLabel) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!c.name.toLowerCase().includes(term) && !c.deviceCode.toLowerCase().includes(term)) return false;
      }
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      return true;
    });
  }, [classrooms, filterCriteria, searchTerm, statusFilter]);

  const selectedLabel = useMemo(() => {
    if (!selectedKey) return '全部';
    if (treeMode === 'building') {
      if (selectedKey.startsWith('b-')) return selectedKey.replace('b-', '');
      if (selectedKey.startsWith('f-')) return selectedKey.replace('f-', '').replace('-', ' ');
    } else {
      if (selectedKey.startsWith('g-')) return selectedKey.replace('g-', '');
      if (selectedKey.startsWith('c-')) return selectedKey.replace('c-', '');
    }
    return '';
  }, [selectedKey, treeMode]);

  const statusConfig = {
    online: { label: '在线', color: '#16a34a', bg: '#dcfce7' },
    offline: { label: '离线', color: '#6b7280', bg: '#f3f4f6' },
  };

  return (
    <Box className="overflow-auto h-[calc(100vh-64px)] bg-gray-50">
      <Box className="p-4 sm:p-6 h-full">
        {/* 标题 */}
        <Box className="mb-4">
          <Typography variant="h5" className="font-bold">设备巡视</Typography>
          <Typography variant="body2" color="text.secondary" className="mt-1">
            按教学楼和楼层查看教室分布，执行巡视任务
          </Typography>
        </Box>

        <Box className="flex gap-4 h-[calc(100%-64px)]">
          {/* ─── 左栏：树结构 ─── */}
          <Paper elevation={0} sx={{ width: 260, flexShrink: 0, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <Box className="p-3 border-b border-gray-100">
              <Typography variant="subtitle2" className="font-bold text-gray-700 mb-2">教室分布</Typography>
              {/* 按建筑 / 按班级 切换 */}
              <Box className="flex border border-gray-200 rounded-lg overflow-hidden" sx={{ width: '100%' }}>
                <Box
                  className={`flex-1 text-center py-1 cursor-pointer text-xs font-medium transition-colors ${treeMode === 'building' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  onClick={() => handleTreeModeChange('building')}
                >
                  按建筑
                </Box>
                <Box
                  className={`flex-1 text-center py-1 cursor-pointer text-xs font-medium transition-colors ${treeMode === 'class' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  onClick={() => handleTreeModeChange('class')}
                >
                  按班级
                </Box>
              </Box>
            </Box>
            <Box className="p-2 overflow-auto" sx={{ maxHeight: 'calc(100% - 96px)' }}>
              {treeData.map((node) => (
                <TreeItem
                  key={node.key}
                  node={node}
                  depth={0}
                  selectedKey={selectedKey}
                  onSelect={setSelectedKey}
                  expandedKeys={expandedKeys}
                  onToggle={handleToggle}
                />
              ))}
              {treeData.length === 0 && (
                <Typography variant="caption" color="text.secondary" className="p-2 block text-center">
                  暂无数据
                </Typography>
              )}
            </Box>
          </Paper>

          {/* ─── 右栏 ─── */}
          <Box className="flex-1 min-w-0 flex flex-col gap-3">
            {/* 标签切换 */}
            <Box className="flex items-center gap-0 border-b border-gray-200">
              <Box
                className={`px-4 py-2 cursor-pointer text-sm font-medium transition-colors border-b-2 -mb-px ${panelTab === 'classroom' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setPanelTab('classroom')}
              >
                教室列表
              </Box>
              <Box
                className={`px-4 py-2 cursor-pointer text-sm font-medium transition-colors border-b-2 -mb-px ${panelTab === 'record' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setPanelTab('record')}
              >
                巡视记录
              </Box>
              <Box
                className={`px-4 py-2 cursor-pointer text-sm font-medium transition-colors border-b-2 -mb-px ${panelTab === 'task' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setPanelTab('task')}
              >
                自动巡视任务
              </Box>
            </Box>

            {panelTab === 'classroom' ? (
              <>
                {/* 操作栏 */}
                <Box className="flex items-center gap-3 flex-wrap">
                  <Typography variant="subtitle1" className="font-bold whitespace-nowrap">
                    {selectedLabel}
                    <Typography component="span" variant="body2" color="text.secondary" className="ml-2">
                      {filteredClassrooms.length} 间教室
                    </Typography>
                  </Typography>
                  <Box className="flex-1" />
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      displayEmpty
                    >
                      <MenuItem value="all">全部状态</MenuItem>
                      <MenuItem value="online">在线</MenuItem>
                      <MenuItem value="offline">离线</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    placeholder="搜索教室或设备编号..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                    }}
                    sx={{ minWidth: 200 }}
                  />
                  <Box className="flex border border-gray-200 rounded-lg overflow-hidden">
                    <Tooltip title="卡片视图">
                      <IconButton
                        size="small"
                        onClick={() => setViewMode('card')}
                        sx={{ borderRadius: 0, backgroundColor: viewMode === 'card' ? '#3b82f6' : 'transparent', color: viewMode === 'card' ? '#fff' : '#6b7280', '&:hover': { backgroundColor: viewMode === 'card' ? '#2563eb' : '#f3f4f6' } }}
                      >
                        <ViewModule sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="表格视图">
                      <IconButton
                        size="small"
                        onClick={() => setViewMode('table')}
                        sx={{ borderRadius: 0, backgroundColor: viewMode === 'table' ? '#3b82f6' : 'transparent', color: viewMode === 'table' ? '#fff' : '#6b7280', '&:hover': { backgroundColor: viewMode === 'table' ? '#2563eb' : '#f3f4f6' } }}
                      >
                        <ViewList sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* 教室列表内容 */}
                {filteredClassrooms.length === 0 ? (
                  <Box className="flex-1 flex items-center justify-center">
                    <Box className="text-center">
                      <Typography variant="body1" color="text.secondary" className="mb-1">未找到匹配的教室</Typography>
                      <Typography variant="caption" color="text.secondary">请尝试调整筛选条件</Typography>
                    </Box>
                  </Box>
                ) : viewMode === 'card' ? (
                  /* 卡片视图 */
                  <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 overflow-auto" sx={{ maxHeight: 'calc(100% - 48px)' }}>
                    {filteredClassrooms.map((cr) => (
                      <ClassroomCard key={cr.id} classroom={cr} onPatrol={handlePatrol} />
                    ))}
                  </Box>
                ) : (
                  /* 表格视图 */
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'auto', maxHeight: 'calc(100% - 48px)' }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                          <TableCell sx={{ fontWeight: 600, width: 50 }}>序号</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 140 }}>教室名称</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 80 }}>所属楼栋</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 60 }}>楼层</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>设备编号</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: 80 }}>状态</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 160 }}>操作界面回显</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: 80 }}>操作</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredClassrooms.map((cr, index) => {
                          const cfg = statusConfig[cr.status];
                          return (
                            <TableRow key={cr.id} hover>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <Typography variant="body2" className="font-medium">{cr.name}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary">{cr.building}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary">{cr.floor}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary">{cr.deviceCode}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={cfg.label} size="small" sx={{ backgroundColor: cfg.bg, color: cfg.color, fontWeight: 600, height: 22, fontSize: 11 }} />
                              </TableCell>
                              <TableCell sx={{ maxWidth: 200 }}>
                                <Box sx={{ width: 160 }}>
                                  <DesktopPreview classroom={cr} />
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Button size="small" variant="text" sx={{ fontSize: 12, whiteSpace: 'nowrap', minWidth: 'auto' }} onClick={() => handlePatrol(cr)}>
                                  巡视
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            ) : panelTab === 'record' ? (
              /* ─── 巡视记录 ─── */
              <>
                <Box className="flex items-center gap-3">
                  <Typography variant="subtitle1" className="font-bold whitespace-nowrap">
                    巡视记录
                    <Typography component="span" variant="body2" color="text.secondary" className="ml-2">
                      {records.length} 条记录
                    </Typography>
                  </Typography>
                  <Box className="flex-1" />
                  <TextField
                    size="small"
                    placeholder="搜索教室..."
                    onChange={(e) => {/* TODO: filter */}}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                    }}
                    sx={{ minWidth: 200 }}
                  />
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'auto', maxHeight: 'calc(100% - 48px)' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                        <TableCell sx={{ fontWeight: 600, minWidth: 140 }}>巡视时间</TableCell>
                        <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>教室</TableCell>
                        <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>设备编号</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 70 }}>状态</TableCell>
                        <TableCell sx={{ fontWeight: 600, minWidth: 180 }}>备注摘要</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 70 }}>操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {records.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                            <Typography variant="body2" color="text.secondary">暂无巡视记录</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        records.map((r) => {
                          const isOnline = r.status === 'online';
                          return (
                            <TableRow key={r.id} hover>
                              <TableCell>
                                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                  {r.patrolTime.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1, fontSize: 10 }}>
                                  {r.patrolTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" className="font-medium">{r.classroomName}</Typography>
                                <Typography variant="caption" color="text.secondary">{r.building} {r.room}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary">{r.deviceCode}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={isOnline ? '在线' : '离线'}
                                  size="small"
                                  sx={{ height: 20, fontSize: 10, fontWeight: 600, backgroundColor: isOnline ? '#dcfce7' : '#f3f4f6', color: isOnline ? '#16a34a' : '#6b7280' }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary" sx={{
                                  display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                }}>
                                  {r.note}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Button size="small" variant="text" sx={{ fontSize: 12, minWidth: 'auto' }} onClick={() => setRecordDetail(r)}>
                                  查看
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              /* ─── 自动巡视任务 ─── */
              <>
                <Box className="flex items-center gap-3">
                  <Typography variant="subtitle1" className="font-bold whitespace-nowrap">
                    自动巡视任务
                  </Typography>
                  <Box className="flex-1" />
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' }, fontSize: 12, fontWeight: 600 }}
                    onClick={() => {/* TODO: 新建自动巡视任务 */}}
                  >
                    + 新建任务
                  </Button>
                </Box>

                <Box className="flex flex-col gap-3">
                  {/* 巡视任务卡片示例 — 后续将接入真实数据 */}
                  <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, p: 2.5 }}>
                    <Box className="flex items-start justify-between">
                      <Box className="flex items-center gap-3">
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                          <Box component="span" sx={{ fontSize: 18 }}>🔄</Box>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" className="font-semibold">每日上午常规巡视</Typography>
                          <Box className="flex items-center gap-3 mt-0.5">
                            <Typography variant="caption" color="text.secondary">⏰ 每天 09:00</Typography>
                            <Typography variant="caption" color="text.secondary">🏫 东教学楼 · 12 间教室</Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Chip label="启用" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 600, backgroundColor: '#dcfce7', color: '#16a34a' }} />
                    </Box>
                  </Paper>

                  <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, p: 2.5 }}>
                    <Box className="flex items-start justify-between">
                      <Box className="flex items-center gap-3">
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                          <Box component="span" sx={{ fontSize: 18 }}>🔄</Box>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" className="font-semibold">每周设备巡检</Typography>
                          <Box className="flex items-center gap-3 mt-0.5">
                            <Typography variant="caption" color="text.secondary">⏰ 每周一 14:00</Typography>
                            <Typography variant="caption" color="text.secondary">🏫 全校 · 48 间教室</Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Chip label="启用" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 600, backgroundColor: '#dcfce7', color: '#16a34a' }} />
                    </Box>
                  </Paper>

                  <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, p: 2.5 }}>
                    <Box className="flex items-start justify-between">
                      <Box className="flex items-center gap-3">
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                          <Box component="span" sx={{ fontSize: 18 }}>🔄</Box>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" className="font-semibold text-gray-400">晚间设备关机检查</Typography>
                          <Box className="flex items-center gap-3 mt-0.5">
                            <Typography variant="caption" color="text.secondary">⏰ 每天 21:00</Typography>
                            <Typography variant="caption" color="text.secondary">🏫 西教学楼 · 8 间教室</Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Chip label="已停用" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 600, backgroundColor: '#f3f4f6', color: '#9ca3af' }} />
                    </Box>
                  </Paper>
                </Box>
              </>
            )}

            {/* 巡视记录详情弹窗 */}
            <Dialog open={!!recordDetail} onClose={() => setRecordDetail(null)} maxWidth="sm" fullWidth>
              {recordDetail && (
                <>
                  <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb', py: 1.5 }}>
                    <Box className="flex items-center justify-between">
                      <Typography variant="h6" className="font-bold">巡视记录详情</Typography>
                      <IconButton onClick={() => setRecordDetail(null)} size="small"><Close /></IconButton>
                    </Box>
                  </DialogTitle>
                  <DialogContent sx={{ p: 2 }}>
                    <Box className="flex flex-col gap-3">
                      {/* 设备信息 */}
                      <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid #e5e7eb', backgroundColor: '#fafafa' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151', fontSize: 11, mb: 1, display: 'block' }}>
                          设备信息
                        </Typography>
                        <Box className="flex flex-col gap-1.5">
                          <Box className="flex justify-between">
                            <Typography variant="caption" sx={{ fontSize: 10, color: '#9ca3af' }}>教室</Typography>
                            <Typography variant="caption" sx={{ fontSize: 10, color: '#374151', fontWeight: 600 }}>{recordDetail.classroomName}</Typography>
                          </Box>
                          <Box className="flex justify-between">
                            <Typography variant="caption" sx={{ fontSize: 10, color: '#9ca3af' }}>位置</Typography>
                            <Typography variant="caption" sx={{ fontSize: 10, color: '#374151', fontWeight: 600 }}>{recordDetail.building} {recordDetail.room}</Typography>
                          </Box>
                          <Box className="flex justify-between">
                            <Typography variant="caption" sx={{ fontSize: 10, color: '#9ca3af' }}>设备编号</Typography>
                            <Typography variant="caption" sx={{ fontSize: 10, color: '#374151', fontWeight: 600 }}>{recordDetail.deviceCode}</Typography>
                          </Box>
                          <Box className="flex justify-between">
                            <Typography variant="caption" sx={{ fontSize: 10, color: '#9ca3af' }}>巡视时间</Typography>
                            <Typography variant="caption" sx={{ fontSize: 10, color: '#374151', fontWeight: 600 }}>
                              {recordDetail.patrolTime.toLocaleDateString('zh-CN')} {recordDetail.patrolTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </Box>
                          <Box className="flex justify-between items-center">
                            <Typography variant="caption" sx={{ fontSize: 10, color: '#9ca3af' }}>设备状态</Typography>
                            <Chip
                              label={recordDetail.status === 'online' ? '在线' : '离线'}
                              size="small"
                              sx={{ height: 18, fontSize: 9, fontWeight: 600, backgroundColor: recordDetail.status === 'online' ? '#dcfce7' : '#f3f4f6', color: recordDetail.status === 'online' ? '#16a34a' : '#6b7280' }}
                            />
                          </Box>
                        </Box>
                      </Box>

                      {/* 备注详情 */}
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151', fontSize: 11, mb: 1, display: 'block' }}>
                          巡视备注
                        </Typography>
                        <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            {recordDetail.note}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </DialogContent>
                </>
              )}
            </Dialog>
          </Box>
        </Box>
      </Box>
      {/* 视频巡视弹窗 */}
      <PatrolDialog classroom={patrolTarget} open={patrolOpen} onClose={() => setPatrolOpen(false)} />
    </Box>
  );
}
