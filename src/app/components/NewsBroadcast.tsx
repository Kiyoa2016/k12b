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

// ─── 创建/编辑计划弹窗 ───
function CreatePlanDialog({
  open, onClose, onSave, editPlan, allDevices,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (plan: BroadcastPlan) => void;
  editPlan?: BroadcastPlan | null;
  allDevices: string[];
}) {
  const emptyForm = {
    name: '', method: 'webpage' as BroadcastMethod,
    contentUrl: '', cycleMode: 'immediate' as CycleMode,
    startTime: '', endTime: '',
    weekDays: [] as number[],
    deviceIds: [] as string[],
  };

  const [form, setForm] = useState(emptyForm);
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);

  const prevOpenRef = useRef(open);
  if (open !== prevOpenRef.current) {
    prevOpenRef.current = open;
    if (open) {
      if (editPlan) {
        setForm({
          name: editPlan.name, method: editPlan.method,
          contentUrl: editPlan.contentUrl, cycleMode: editPlan.cycleMode,
          startTime: editPlan.startTime, endTime: editPlan.endTime,
          weekDays: editPlan.weekDays || [],
          deviceIds: editPlan.deviceIds,
        });
      } else {
        setForm(emptyForm);
      }
    }
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.contentUrl.trim()) return;
    const now = new Date().toISOString();
    onSave({
      id: editPlan?.id || 'plan-' + Date.now(),
      name: form.name, method: form.method, contentUrl: form.contentUrl,
      cycleMode: form.cycleMode,
      startTime: form.startTime || now,
      endTime: form.endTime || now,
      weekDays: form.cycleMode === 'weekly' ? form.weekDays : undefined,
      deviceIds: form.deviceIds,
      status: editPlan?.status || 'pending',
      createdAt: editPlan?.createdAt || now,
    });
    onClose();
  };

  const toggleDevice = (id: string) => {
    setForm((f) => ({
      ...f,
      deviceIds: f.deviceIds.includes(id)
        ? f.deviceIds.filter((x) => x !== id)
        : [...f.deviceIds, id],
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box className="flex items-center gap-2">
          <Add className="text-blue-600" />
          <Typography variant="h6">{editPlan ? '编辑计划' : '新建转播计划'}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box className="py-4 flex flex-col gap-4">
          {/* 计划名称 */}
          <TextField fullWidth size="small" label="计划名称"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="例如：午间新闻转播" />

          {/* 转播方式 */}
          <Box>
            <Typography variant="body2" className="mb-2 font-medium">转播方式</Typography>
            <Box className="flex gap-3">
              <Card
                className={`flex-1 cursor-pointer ${form.method === 'webpage' ? 'border-2 border-blue-500 bg-blue-50' : 'border border-gray-300'}`}
                onClick={() => setForm({ ...form, method: 'webpage' })}
                sx={{ borderRadius: 2 }}
              >
                <CardContent className="text-center py-3">
                  <Language className={form.method === 'webpage' ? 'text-blue-600' : 'text-gray-400'} sx={{ fontSize: 28 }} />
                  <Typography variant="body2" className="font-medium mt-1">新闻网页</Typography>
                </CardContent>
              </Card>
              <Card
                className={`flex-1 cursor-pointer ${form.method === 'video' ? 'border-2 border-blue-500 bg-blue-50' : 'border border-gray-300'}`}
                onClick={() => setForm({ ...form, method: 'video' })}
                sx={{ borderRadius: 2 }}
              >
                <CardContent className="text-center py-3">
                  <Videocam className={form.method === 'video' ? 'text-blue-600' : 'text-gray-400'} sx={{ fontSize: 28 }} />
                  <Typography variant="body2" className="font-medium mt-1">视频文件</Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* 内容地址 */}
          <TextField fullWidth size="small" label="内容地址"
            value={form.contentUrl}
            onChange={(e) => setForm({ ...form, contentUrl: e.target.value })}
            placeholder={form.method === 'webpage' ? 'https://news.example.com/live' : 'https://videos.example.com/file.mp4'} />

          {/* 循环模式 */}
          <Box>
            <Typography variant="body2" className="mb-2 font-medium">循环模式</Typography>
            <Box className="flex gap-2 mb-3">
              {(['immediate', 'scheduled', 'weekly'] as CycleMode[]).map((mode) => (
                <Chip key={mode}
                  label={mode === 'immediate' ? '⏺ 立即' : mode === 'scheduled' ? '📅 定时' : '🔄 周循环'}
                  onClick={() => setForm({ ...form, cycleMode: mode, startTime: '', endTime: '' })}
                  color={form.cycleMode === mode ? 'primary' : 'default'}
                  variant={form.cycleMode === mode ? 'filled' : 'outlined'}
                  sx={{ px: 1 }}
                />
              ))}
            </Box>
            {form.cycleMode !== 'immediate' && (
              <Box className="flex gap-3">
                <TextField fullWidth size="small" label="开始时间" type="datetime-local"
                  value={form.startTime ? form.startTime.slice(0, 16) : ''}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                  InputLabelProps={{ shrink: true }} />
                <TextField fullWidth size="small" label="结束时间" type="datetime-local"
                  value={form.endTime ? form.endTime.slice(0, 16) : ''}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                  InputLabelProps={{ shrink: true }} />
              </Box>
            )}
            {form.cycleMode === 'weekly' && (
              <Box className="flex gap-1 mt-2">
                {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                  <Chip key={d} label={WEEKDAY_LABELS[d]}
                    onClick={() => setForm((f) => ({
                      ...f,
                      weekDays: f.weekDays.includes(d) ? f.weekDays.filter((x) => x !== d) : [...f.weekDays, d],
                    }))}
                    color={form.weekDays.includes(d) ? 'primary' : 'default'}
                    variant={form.weekDays.includes(d) ? 'filled' : 'outlined'}
                    size="small" />
                ))}
              </Box>
            )}
          </Box>

          {/* 目标设备 */}
          <Box>
            <Typography variant="body2" className="mb-2 font-medium">目标设备</Typography>
            <Box className="flex items-center gap-2">
              <Button variant="outlined" size="small" onClick={() => setDeviceDialogOpen(true)}>
                选择设备 ({form.deviceIds.length})
              </Button>
              {form.deviceIds.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {form.deviceIds.slice(0, 3).map((id) => DEVICE_NAMES[parseInt(id)]).join('、')}
                  {form.deviceIds.length > 3 && ` 等 ${form.deviceIds.length} 台`}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions className="px-6 pb-4">
        <Button onClick={onClose} variant="outlined">取消</Button>
        <Button onClick={handleSave} variant="contained"
          disabled={!form.name.trim() || !form.contentUrl.trim()}>
          {editPlan ? '保存' : '创建'}
        </Button>
      </DialogActions>

      {/* 设备选择子弹窗 */}
      <Dialog open={deviceDialogOpen} onClose={() => setDeviceDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box className="flex items-center justify-between">
            <Typography variant="h6">选择设备</Typography>
            <IconButton onClick={() => setDeviceDialogOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box className="pt-2 max-h-80 overflow-auto space-y-1">
            {allDevices.map((name, i) => (
              <Box key={String(i)}
                onClick={() => toggleDevice(String(i))}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
                  form.deviceIds.includes(String(i)) ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                <Computer sx={{ fontSize: 18 }} />
                <Typography variant="body2">{name}</Typography>
                {form.deviceIds.includes(String(i)) && <CheckCircle sx={{ fontSize: 16, color: '#3b82f6', ml: 'auto' }} />}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setDeviceDialogOpen(false)} variant="contained" size="small">确定</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

// ===== 占位导出 =====
export default function NewsBroadcast() {
  return <Box>待实现</Box>;
}
