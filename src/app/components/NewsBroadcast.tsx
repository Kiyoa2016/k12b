import { useState, useMemo, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Button, IconButton,
  TextField, InputAdornment, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination,
  Select, MenuItem, FormControl,
  Paper, Switch, Tooltip,
} from '@mui/material';
import {
  Add, Settings, Search, Edit, Delete, PlayArrow, Stop,
  Visibility, Close, Videocam, Language,
  Computer, CheckCircle, Cancel,
} from '@mui/icons-material';

// ─── 类型定义 ───

export type BroadcastMethod = 'webpage' | 'video';
export type CycleMode = 'immediate' | 'scheduled' | 'weekly';
export type BroadcastStatus = 'running' | 'pending' | 'stopped' | 'error';
export type ExecStatus = 'success' | 'failed' | 'running';

export interface BroadcastPlan {
  id: string;
  name: string;
  method: BroadcastMethod;
  contentUrl: string;
  cycleMode: CycleMode;
  startTime: string;
  endTime: string;
  weekDays?: number[];
  deviceIds: string[];
  status: BroadcastStatus;
  createdAt: string;
}

export interface BroadcastHistory {
  id: string;
  planId: string;
  planName: string;
  deviceId: string;
  deviceName: string;
  startTime: string;
  endTime?: string;
  status: ExecStatus;
  errorMsg?: string;
}

export interface WatermarkConfig {
  text: string;
  showPatrolInspector: boolean;
  showIP: boolean;
  showPlanName: boolean;
  color: string;
  filterCamera: boolean;
  filterMicrophone: boolean;
}

// ─── 默认值 ───

const DEFAULT_WATERMARK: WatermarkConfig = {
  text: '课堂巡视记录',
  showPatrolInspector: true,
  showIP: true,
  showPlanName: true,
  color: 'rgba(255, 0, 0, 0.6)',
  filterCamera: false,
  filterMicrophone: false,
};

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// ─── 工具函数 ───

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatDateTime(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${M}/${D} ${h}:${m}`;
}

// ─── Mock 数据 ───

const DEVICE_NAMES = [
  '东教学楼101教室终端', '东教学楼102教室终端', '东教学楼103教室终端',
  '东教学楼201教室终端', '东教学楼202教室终端', '东教学楼301教室终端',
  '西教学楼101教室终端', '西教学楼102教室终端',
  '西教学楼201教室终端', '西教学楼202教室终端', '西教学楼203教室终端',
  '综合楼101教室终端', '综合楼102教室终端', '综合楼103教室终端',
  '综合楼104教室终端', '综合楼201教室终端', '综合楼202教室终端',
];

function generateMockPlans(): BroadcastPlan[] {
  const now = new Date();
  return [
    {
      id: 'plan-1', name: '午间新闻转播', method: 'webpage',
      contentUrl: 'https://news.example.com/live',
      cycleMode: 'scheduled',
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0).toISOString(),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 30).toISOString(),
      deviceIds: ['0', '1', '2'], status: 'running',
      createdAt: new Date(now.getTime() - 86400000 * 3).toISOString(),
    },
    {
      id: 'plan-2', name: '安全应急演练通知', method: 'video',
      contentUrl: 'https://videos.example.com/emergency.mp4',
      cycleMode: 'immediate',
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0).toISOString(),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 30).toISOString(),
      deviceIds: DEVICE_NAMES.map((_, i) => String(i)), status: 'pending',
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
    },
    {
      id: 'plan-3', name: '每周时事周刊', method: 'webpage',
      contentUrl: 'https://news.example.com/weekly',
      cycleMode: 'weekly',
      startTime: '2026-06-19T14:00:00.000Z',
      endTime: '2026-06-19T15:00:00.000Z',
      weekDays: [5],
      deviceIds: ['3', '4', '5', '6', '7'], status: 'stopped',
      createdAt: new Date(now.getTime() - 86400000 * 7).toISOString(),
    },
    {
      id: 'plan-4', name: '晨间早报', method: 'webpage',
      contentUrl: 'https://news.example.com/morning',
      cycleMode: 'scheduled',
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0).toISOString(),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 15).toISOString(),
      deviceIds: ['0', '1', '2', '3', '4', '5'], status: 'running',
      createdAt: new Date(now.getTime() - 86400000 * 5).toISOString(),
    },
    {
      id: 'plan-5', name: '防疫知识宣传', method: 'video',
      contentUrl: 'https://videos.example.com/防疫.mp4',
      cycleMode: 'weekly',
      startTime: '2026-06-18T10:00:00.000Z',
      endTime: '2026-06-18T10:10:00.000Z',
      weekDays: [1, 3, 5],
      deviceIds: DEVICE_NAMES.map((_, i) => String(i)), status: 'pending',
      createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
    },
    {
      id: 'plan-6', name: '校园电视台直播', method: 'video',
      contentUrl: 'https://live.example.com/campus',
      cycleMode: 'scheduled',
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0).toISOString(),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0).toISOString(),
      deviceIds: ['8', '9', '10'], status: 'error',
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
    },
  ];
}

function generateMockHistory(plans: BroadcastPlan[]): BroadcastHistory[] {
  const history: BroadcastHistory[] = [];
  plans.forEach((plan) => {
    plan.deviceIds.forEach((did, i) => {
      history.push({
        id: `hist-${plan.id}-${i}`,
        planId: plan.id,
        planName: plan.name,
        deviceId: did,
        deviceName: DEVICE_NAMES[parseInt(did) % DEVICE_NAMES.length],
        startTime: plan.startTime,
        endTime: plan.status === 'error' ? undefined : plan.endTime,
        status: plan.status === 'error' ? 'failed' as ExecStatus : plan.status === 'running' ? 'running' as ExecStatus : 'success' as ExecStatus,
        errorMsg: plan.status === 'error' ? '设备连接超时' : undefined,
      });
    });
  });
  return history;
}

function getDefaultWatermark(): WatermarkConfig {
  try {
    const saved = localStorage.getItem('news-broadcast-watermark');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return DEFAULT_WATERMARK;
}

// ─── 巡视水印设置弹窗 ───
function WatermarkDialog({
  open, onClose, config, onSave,
}: {
  open: boolean;
  onClose: () => void;
  config: WatermarkConfig;
  onSave: (c: WatermarkConfig) => void;
}) {
  const [local, setLocal] = useState<WatermarkConfig>(config);

  const prevOpenRef = useRef(open);
  if (open !== prevOpenRef.current) {
    prevOpenRef.current = open;
    if (open) setLocal(config);
  }

  const presetColors = [
    { label: '红色', value: 'rgba(255, 0, 0, 0.6)' },
    { label: '黑色', value: 'rgba(0, 0, 0, 0.5)' },
    { label: '白色', value: 'rgba(255, 255, 255, 0.8)' },
    { label: '蓝色', value: 'rgba(59, 130, 246, 0.6)' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box className="flex items-center gap-2">
          <Settings className="text-blue-600" />
          <Typography variant="h6">巡视水印配置</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box className="py-4 flex flex-col gap-4">
          <TextField
            fullWidth size="small" label="水印文本"
            value={local.text}
            onChange={(e) => setLocal({ ...local, text: e.target.value })}
          />
          <Box className="flex flex-wrap gap-3">
            <Box className="flex items-center gap-1">
              <Switch size="small" checked={local.showPatrolInspector}
                onChange={(e) => setLocal({ ...local, showPatrolInspector: e.target.checked })} />
              <Typography variant="body2">显示巡视人</Typography>
            </Box>
            <Box className="flex items-center gap-1">
              <Switch size="small" checked={local.showIP}
                onChange={(e) => setLocal({ ...local, showIP: e.target.checked })} />
              <Typography variant="body2">自动获取IP信息</Typography>
            </Box>
            <Box className="flex items-center gap-1">
              <Switch size="small" checked={local.showPlanName}
                onChange={(e) => setLocal({ ...local, showPlanName: e.target.checked })} />
              <Typography variant="body2">显示计划名称</Typography>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" className="mb-2 font-medium">水印颜色</Typography>
            <Box className="flex gap-2 items-center">
              {presetColors.map((c) => (
                <Box key={c.value}
                  onClick={() => setLocal({ ...local, color: c.value })}
                  sx={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: c.value, cursor: 'pointer',
                    border: local.color === c.value ? '3px solid #3b82f6' : '2px solid transparent',
                  }}
                />
              ))}
              <TextField size="small" value={local.color}
                onChange={(e) => setLocal({ ...local, color: e.target.value })}
                sx={{ width: 140, '& input': { fontSize: 13 } }}
                InputProps={{ startAdornment: <InputAdornment position="start">🎨</InputAdornment> }}
              />
            </Box>
          </Box>
          <Box className="flex gap-4">
            <Box className="flex items-center gap-1">
              <Switch size="small" checked={local.filterCamera}
                onChange={(e) => setLocal({ ...local, filterCamera: e.target.checked })} />
              <Typography variant="body2">过滤摄像头</Typography>
            </Box>
            <Box className="flex items-center gap-1">
              <Switch size="small" checked={local.filterMicrophone}
                onChange={(e) => setLocal({ ...local, filterMicrophone: e.target.checked })} />
              <Typography variant="body2">过滤麦克风</Typography>
            </Box>
          </Box>
          <Box className="mt-2 p-4 bg-gray-900 rounded-lg text-white text-center min-h-[100px] relative flex items-center justify-center">
            <Typography variant="caption">转播画面预览</Typography>
            <Box sx={{ position: 'absolute', bottom: 8, left: 8, color: local.color, fontSize: 11, lineHeight: 1.8, textAlign: 'left' }}>
              {local.text || '水印文本'}<br />
              {local.showPatrolInspector && <>巡视人：彭浩<br /></>}
              {local.showIP && <>IP：192.168.1.101<br /></>}
              {local.showPlanName && <>计划：午间新闻转播</>}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions className="px-6 pb-4" sx={{ justifyContent: 'space-between' }}>
        <Button onClick={() => setLocal(DEFAULT_WATERMARK)} variant="text" color="inherit" size="small">恢复默认</Button>
        <Box className="flex gap-2">
          <Button onClick={onClose} variant="outlined">取消</Button>
          <Button onClick={() => { onSave(local); onClose(); }} variant="contained">保存</Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

// ===== 占位导出 =====
export default function NewsBroadcast() {
  return <Box>待实现</Box>;
}
