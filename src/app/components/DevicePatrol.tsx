import { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, IconButton,
  TextField, InputAdornment, Chip, Tooltip,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper,
  MenuItem, FormControl, Select,
  Dialog, DialogTitle, DialogContent,
  Snackbar, Alert, Divider,
} from '@mui/material';
import {
  ChevronRight, ExpandMore, Search, ViewList, ViewModule,
  Business, LocationOn, Visibility, Close, Videocam, Monitor,
  PowerSettingsNew, PowerOff, Campaign, Send,
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

// ─── 远程命令常量 ───

const remoteCommands = [
  { label: '开机', icon: <PowerSettingsNew sx={{ fontSize: 16 }} />, color: '#16a34a', message: (name: string) => `已发送开机指令至 ${name}` },
  { label: '关机', icon: <PowerOff sx={{ fontSize: 16 }} />, color: '#ef4444', message: (name: string) => `已发送关机指令至 ${name}` },
  { label: '远程喊话', icon: <Campaign sx={{ fontSize: 16 }} />, color: '#3b82f6', message: (name: string) => `已向 ${name} 发起远程喊话` },
  { label: '发送信息', icon: <Send sx={{ fontSize: 16 }} />, color: '#3b82f6', message: (name: string) => `已发送信息至 ${name}` },
];

function PatrolDialog({ classroom, open, onClose }: { classroom: Classroom | null; open: boolean; onClose: () => void }) {
  const channels = useMemo(() => (classroom ? generateChannels(classroom.room) : []), [classroom]);
  const [activeChannel, setActiveChannel] = useState(2); // 默认选中板书
  // 教室切换时重置到板书（板书索引为2，若通道数不足则取最后一个）
  useEffect(() => {
    setActiveChannel(Math.min(2, channels.length - 1));
  }, [channels.length]);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const handleRemoteCommand = (cmd: typeof remoteCommands[0]) => {
    if (!classroom) return;
    setSnackbar({ open: true, message: cmd.message(classroom.name) });
    // TODO: 调用实际 API
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
            {current ? (
              <>
                {/* 模拟视频画面 */}
                <Box
                  className="absolute inset-0 flex items-center justify-center"
                  sx={{
                    background: current.id === 'board'
                      ? 'linear-gradient(135deg, #1e293b 0%, #334155 30%, #0f172a 60%, #334155 100%)'
                      : 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 30%, #1e3a5f 60%, #2d5a87 100%)',
                  }}
                >
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
                  {/* 视频底部叠加信息 */}
                  <Box className="absolute bottom-0 left-0 right-0 px-3 py-1.5 flex items-center gap-3" sx={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                    <Typography variant="caption" sx={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
                      {classroom.name}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                      {classroom.room}教室
                    </Typography>
                    <Box className="flex items-center gap-1 ml-auto">
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: current.online ? '#22c55e' : '#ef4444' }} />
                      <Typography variant="caption" sx={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>
                        {current.online ? 'LIVE' : 'OFFLINE'}
                      </Typography>
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
            <Box className="flex items-center gap-3 px-3" sx={{ height: 48, borderTop: '1px solid #e5e7eb', backgroundColor: '#fafafa', borderRadius: '0 0 8px 8px' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap', fontSize: 12 }}>
                远程控制：
              </Typography>
              {remoteCommands.map((cmd) => (
                <Tooltip key={cmd.label} title={classroom.status === 'offline' ? '设备已离线，无法执行此操作' : ''}>
                  <span>
                    <Button
                      size="small"
                      variant="text"
                      disabled={classroom.status === 'offline'}
                      startIcon={cmd.icon}
                      onClick={() => handleRemoteCommand(cmd)}
                      sx={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: cmd.color,
                        minWidth: 'auto',
                        px: 1,
                        '&:hover': { backgroundColor: `${cmd.color}10` },
                        '&.Mui-disabled': { opacity: 0.4 },
                      }}
                    >
                      {cmd.label}
                    </Button>
                  </span>
                </Tooltip>
              ))}
            </Box>
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

// ─── 主组件 ───

export default function DevicePatrol() {
  const [classrooms] = useState<Classroom[]>(generateClassrooms);
  const [treeData] = useState<TreeNode[]>(buildTreeData);
  const [selectedKey, setSelectedKey] = useState<string | null>('b-东教学楼');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(['b-东教学楼']));
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [patrolTarget, setPatrolTarget] = useState<Classroom | null>(null);
  const [patrolOpen, setPatrolOpen] = useState(false);

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
    if (!selectedKey) return { building: null, floor: null };
    if (selectedKey.startsWith('b-')) {
      return { building: selectedKey.replace('b-', ''), floor: null };
    }
    if (selectedKey.startsWith('f-')) {
      const parts = selectedKey.replace('f-', '').split('-');
      return { building: parts[0], floor: parts.slice(1).join('-') };
    }
    return { building: null, floor: null };
  }, [selectedKey]);

  // 过滤教室
  const filteredClassrooms = useMemo(() => {
    return classrooms.filter((c) => {
      if (filterCriteria.building && c.building !== filterCriteria.building) return false;
      if (filterCriteria.floor && c.floor !== filterCriteria.floor) return false;
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
    if (selectedKey.startsWith('b-')) return selectedKey.replace('b-', '');
    if (selectedKey.startsWith('f-')) return selectedKey.replace('f-', '').replace('-', ' ');
    return '';
  }, [selectedKey]);

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
              <Typography variant="subtitle2" className="font-bold text-gray-700">教室分布</Typography>
            </Box>
            <Box className="p-2 overflow-auto" sx={{ maxHeight: 'calc(100% - 52px)' }}>
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
            </Box>
          </Paper>

          {/* ─── 右栏：教室列表 ─── */}
          <Box className="flex-1 min-w-0 flex flex-col gap-3">
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
          </Box>
        </Box>
      </Box>
      {/* 视频巡视弹窗 */}
      <PatrolDialog classroom={patrolTarget} open={patrolOpen} onClose={() => setPatrolOpen(false)} />
    </Box>
  );
}
