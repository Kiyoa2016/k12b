# 时事转播功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在集控管理下新增"时事转播"页面，支持新闻网页/视频转播、定时/周循环、定向发布、执行结果查看和巡视水印配置

**Architecture:** 单文件组件 NewsBroadcast.tsx（遵循现有代码模式），内联子组件和 mock 数据，全局水印 localStorage 持久化

**Tech Stack:** React 18 + TypeScript + MUI v7 + Tailwind CSS 4

**设计文档:** `docs/superpowers/specs/2026-06-17-news-broadcast-design.md`

---

### Task 1: 类型定义、mock 数据和 WatermarkDialog

**Files:**
- Create: `src/app/components/NewsBroadcast.tsx`

- [ ] **Step 1: 创建文件，添加类型定义和 mock 数据**

```typescript
import { useState, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Button, IconButton,
  TextField, InputAdornment, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination,
  Select, MenuItem, FormControl, InputLabel,
  Paper, Switch, Tooltip,
} from '@mui/material';
import {
  Add, Settings, Search, Edit, Delete, PlayArrow, Stop,
  Visibility, Close, Videocam, Language, Schedule,
  Computer, CheckCircle, Cancel, Warning,
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

// ─── Mock 数据生成 ───

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

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
      weekDays: [5], // 每周五
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
      weekDays: [1, 3, 5], // 周一、三、五
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
        endTime: plan.status === 'running' ? undefined : plan.endTime,
        status: plan.status === 'error' ? 'failed' : plan.status === 'running' ? 'running' : 'success',
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

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${M}/${D} ${h}:${m}`;
}

// ===== 占位导出 =====
export default function NewsBroadcast() {
  return <Box>待实现</Box>;
}
```

- [ ] **Step 2: 添加 WatermarkDialog 组件**

在 `getDefaultWatermark` 之后、`export default` 之前添加：

```typescript
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

  // 同步外部数据
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
          {/* 预览 */}
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
```

注意需要在 import 中添加 `useRef`。

- [ ] **Step 3: 编译检查**

Run: `cd "E:\Document\04 奇意\01 果仁白板\01 原型设计\模板维护管理界面" && npx vite build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/app/components/NewsBroadcast.tsx
git commit -m "feat(news-broadcast): add types, mock data, and watermark dialog"
```

---

### Task 2: CreatePlanDialog

- [ ] **Step 1: 添加 CreatePlanDialog 组件**

在 WatermarkDialog 之后添加：

```typescript
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

  const cycleLabel =
    form.cycleMode === 'immediate' ? '立即执行' :
    form.cycleMode === 'scheduled' ? '定时执行' : '周循环';

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
```

- [ ] **Step 2: 编译检查**

Run: `npx vite build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/components/NewsBroadcast.tsx
git commit -m "feat(news-broadcast): add create/edit plan dialog"
```

---

### Task 3: PlanDetailDialog

- [ ] **Step 1: 添加 PlanDetailDialog 组件**

在 CreatePlanDialog 之后添加：

```typescript
// ─── 计划详情弹窗 ───
function PlanDetailDialog({
  plan, open, onClose, histories,
}: {
  plan: BroadcastPlan | null;
  open: boolean;
  onClose: () => void;
  histories: BroadcastHistory[];
}) {
  if (!plan) return null;

  const planHistories = histories.filter((h) => h.planId === plan.id);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb', pb: 2 }}>
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <Computer className="text-blue-600" />
            <Typography variant="h6">{plan.name}</Typography>
            <StatusChip status={plan.status} />
          </Box>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        {/* 基本信息 */}
        <Typography variant="subtitle2" className="font-bold mb-3">基本信息</Typography>
        <Box className="grid grid-cols-2 gap-x-6 gap-y-3 mb-6">
          <Box>
            <Typography variant="caption" color="text.secondary">转播方式</Typography>
            <Typography variant="body2" className="font-medium">
              {plan.method === 'webpage' ? '🌐 新闻网页' : '🎬 视频文件'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">内容地址</Typography>
            <Typography variant="body2" className="font-medium" sx={{ wordBreak: 'break-all' }}>{plan.contentUrl}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">循环模式</Typography>
            <Typography variant="body2" className="font-medium">{getCycleLabel(plan)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">目标设备</Typography>
            <Typography variant="body2" className="font-medium">{plan.deviceIds.length} 台</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">创建时间</Typography>
            <Typography variant="body2" className="font-medium">{new Date(plan.createdAt).toLocaleString('zh-CN')}</Typography>
          </Box>
        </Box>

        {/* 关联设备 */}
        <Typography variant="subtitle2" className="font-bold mb-3">关联设备</Typography>
        <Box className="flex flex-wrap gap-2 mb-6">
          {plan.deviceIds.map((id) => (
            <Chip key={id} label={DEVICE_NAMES[parseInt(id) % DEVICE_NAMES.length]}
              size="small" icon={<Computer />} variant="outlined" />
          ))}
        </Box>

        {/* 执行历史 */}
        <Typography variant="subtitle2" className="font-bold mb-3">执行历史</Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 600 }}>时间</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>设备</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>状态</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>信息</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {planHistories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">暂无执行记录</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                planHistories.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell><Typography variant="caption">{formatDateTime(h.startTime)}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{h.deviceName}</Typography></TableCell>
                    <TableCell><ExecStatusChip status={h.status} /></TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{h.errorMsg || '-'}</Typography></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
}

// ─── 辅助组件 ───
function StatusChip({ status }: { status: BroadcastStatus }) {
  const map: Record<BroadcastStatus, { label: string; bg: string; color: string }> = {
    running: { label: '运行中', bg: '#dcfce7', color: '#16a34a' },
    pending: { label: '待执行', bg: '#fef9c3', color: '#ca8a04' },
    stopped: { label: '已停止', bg: '#f3f4f6', color: '#6b7280' },
    error: { label: '异常', bg: '#fee2e2', color: '#dc2626' },
  };
  const m = map[status];
  return <Chip label={m.label} size="small" sx={{ backgroundColor: m.bg, color: m.color, fontWeight: 600, height: 22, fontSize: 11 }} />;
}

function ExecStatusChip({ status }: { status: ExecStatus }) {
  const map: Record<ExecStatus, { label: string; bg: string; color: string }> = {
    success: { label: '成功', bg: '#dcfce7', color: '#16a34a' },
    failed: { label: '失败', bg: '#fee2e2', color: '#dc2626' },
    running: { label: '执行中', bg: '#dbeafe', color: '#2563eb' },
  };
  const m = map[status];
  return <Chip label={m.label} size="small" sx={{ backgroundColor: m.bg, color: m.color, fontWeight: 600, height: 22, fontSize: 11 }} />;
}

function getCycleLabel(plan: BroadcastPlan): string {
  if (plan.cycleMode === 'immediate') return '⏺ 立即执行';
  const start = formatDateTime(plan.startTime);
  const end = formatDateTime(plan.endTime);
  if (plan.cycleMode === 'weekly') {
    const days = (plan.weekDays || []).map((d) => WEEKDAY_LABELS[d]).join('、');
    return `🔄 每周 ${days} ${start}-${end}`;
  }
  return `📅 ${start}-${end}`;
}
```

将 `StatusChip`, `ExecStatusChip`, `getCycleLabel` 放在 PlanDetailDialog 之前（它们是 PlanDetailDialog 依赖的辅助组件）。

- [ ] **Step 2: 编译检查**

Run: `npx vite build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/components/NewsBroadcast.tsx
git commit -m "feat(news-broadcast): add plan detail dialog with execution history"
```

---

### Task 4: 主组件 NewsBroadcast（计划列表 + 执行结果 Tab）

- [ ] **Step 1: 替换占位导出为完整主组件**

删除 `export default function NewsBroadcast() { return <Box>待实现</Box>; }`，替换为：

```typescript
export default function NewsBroadcast() {
  const [tab, setTab] = useState(0);
  const [plans, setPlans] = useState<BroadcastPlan[]>(generateMockPlans);
  const histories = useMemo(() => generateMockHistory(plans), [plans]);
  const [watermark, setWatermark] = useState<WatermarkConfig>(getDefaultWatermark);
  const [watermarkOpen, setWatermarkOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailPlan, setDetailPlan] = useState<BroadcastPlan | null>(null);
  const [editPlan, setEditPlan] = useState<BroadcastPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BroadcastStatus>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | BroadcastMethod>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [execPage, setExecPage] = useState(0);
  const [execRowsPerPage, setExecRowsPerPage] = useState(10);
  const [execPlanFilter, setExecPlanFilter] = useState('all');

  // 筛选
  const filteredPlans = plans.filter((p) => {
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (methodFilter !== 'all' && p.method !== methodFilter) return false;
    return true;
  });

  const pagedPlans = filteredPlans.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const filteredExec = histories.filter((h) => {
    if (execPlanFilter !== 'all' && h.planId !== execPlanFilter) return false;
    return true;
  });
  const pagedExec = filteredExec.slice(execPage * execRowsPerPage, execPage * execRowsPerPage + execRowsPerPage);

  // CRUD
  const handleCreatePlan = (plan: BroadcastPlan) => {
    setPlans((prev) => [...prev, plan]);
  };

  const handleUpdatePlan = (plan: BroadcastPlan) => {
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? plan : p)));
  };

  const handleDeletePlan = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  const handleToggleStatus = (plan: BroadcastPlan) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === plan.id
          ? { ...p, status: p.status === 'running' ? 'stopped' : 'running' as BroadcastStatus }
          : p
      )
    );
  };

  // 编辑
  const openEdit = (plan: BroadcastPlan) => {
    setEditPlan(plan);
    setCreateOpen(true);
  };

  const allDeviceNames = DEVICE_NAMES;

  return (
    <Box className="overflow-auto h-[calc(100vh-64px)] bg-gray-50">
      <Box className="p-4 sm:p-6">
        {/* 标题行 */}
        <Box className="mb-4 flex items-center justify-between">
          <Box>
            <Typography variant="h5" className="font-bold">📡 时事转播</Typography>
            <Typography variant="body2" color="text.secondary" className="mt-1">
              管理和发布新闻转播到各教室终端
            </Typography>
          </Box>
          <Box className="flex gap-2">
            <Button variant="outlined" size="small"
              startIcon={<Settings />}
              onClick={() => setWatermarkOpen(true)}>
              水印设置
            </Button>
            <Button variant="contained" size="small"
              startIcon={<Add />}
              onClick={() => { setEditPlan(null); setCreateOpen(true); }}>
              新建计划
            </Button>
          </Box>
        </Box>

        {/* Tab 切换 */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="计划列表" />
          <Tab label="执行结果" />
        </Tabs>

        {/* ====== Tab 0: 计划列表 ====== */}
        {tab === 0 && (
          <>
            {/* 筛选栏 */}
            <Box className="mb-4 flex flex-wrap items-center gap-3">
              <TextField size="small" placeholder="搜索计划名称..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                sx={{ minWidth: 240 }}
              />
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(0); }}>
                  <MenuItem value="all">全部状态</MenuItem>
                  <MenuItem value="running">运行中</MenuItem>
                  <MenuItem value="pending">待执行</MenuItem>
                  <MenuItem value="stopped">已停止</MenuItem>
                  <MenuItem value="error">异常</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <Select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value as any); setPage(0); }}>
                  <MenuItem value="all">全部方式</MenuItem>
                  <MenuItem value="webpage">新闻网页</MenuItem>
                  <MenuItem value="video">视频文件</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">共 {filteredPlans.length} 条计划</Typography>
            </Box>

            {/* 表格 */}
            <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                      <TableCell sx={{ fontWeight: 600, width: 50 }}>序号</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>计划名称</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 90 }}>方式</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>循环</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 80 }}>设备</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 80 }}>状态</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 140 }}>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedPlans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                          <Typography variant="body2" color="text.secondary">未找到匹配的计划</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedPlans.map((plan, index) => (
                        <TableRow key={plan.id} hover>
                          <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" className="font-medium">{plan.name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={plan.method === 'webpage' ? '网页' : '视频'}
                              size="small"
                              icon={plan.method === 'webpage' ? <Language /> : <Videocam />}
                              variant="outlined"
                              sx={{ fontSize: 11, height: 22 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">{getCycleLabel(plan)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">{plan.deviceIds.length} 台</Typography>
                          </TableCell>
                          <TableCell><StatusChip status={plan.status} /></TableCell>
                          <TableCell>
                            <Box className="flex gap-1">
                              <Tooltip title="查看详情"><IconButton size="small" onClick={() => setDetailPlan(plan)}><Visibility sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                              <Tooltip title="编辑"><IconButton size="small" onClick={() => openEdit(plan)}><Edit sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                              <Tooltip title={plan.status === 'running' ? '停止' : '启动'}>
                                <IconButton size="small" onClick={() => handleToggleStatus(plan)}>
                                  {plan.status === 'running' ? <Stop sx={{ fontSize: 16 }} /> : <PlayArrow sx={{ fontSize: 16 }} />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="删除"><IconButton size="small" onClick={() => handleDeletePlan(plan.id)}><Delete sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div" count={filteredPlans.length}
                page={page} onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 20, 50]}
                labelRowsPerPage="每页：" labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共 ${count}`}
              />
            </Card>
          </>
        )}

        {/* ====== Tab 1: 执行结果 ====== */}
        {tab === 1 && (
          <>
            <Box className="mb-4 flex items-center gap-3">
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select value={execPlanFilter} onChange={(e) => { setExecPlanFilter(e.target.value); setExecPage(0); }}>
                  <MenuItem value="all">全部计划</MenuItem>
                  {plans.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">共 {filteredExec.length} 条记录</Typography>
            </Box>
            <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                      <TableCell sx={{ fontWeight: 600 }}>时间</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>计划名称</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>设备</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 80 }}>状态</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>信息</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedExec.length === 0 ? (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        <Typography variant="body2" color="text.secondary">暂无执行记录</Typography>
                      </TableCell></TableRow>
                    ) : (
                      pagedExec.map((h) => (
                        <TableRow key={h.id} hover>
                          <TableCell><Typography variant="caption">{formatDateTime(h.startTime)}</Typography></TableCell>
                          <TableCell><Typography variant="body2" className="font-medium">{h.planName}</Typography></TableCell>
                          <TableCell><Typography variant="body2">{h.deviceName}</Typography></TableCell>
                          <TableCell><ExecStatusChip status={h.status} /></TableCell>
                          <TableCell><Typography variant="caption" color="text.secondary">{h.errorMsg || '-'}</Typography></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div" count={filteredExec.length}
                page={execPage} onPageChange={(_, p) => setExecPage(p)}
                rowsPerPage={execRowsPerPage}
                onRowsPerPageChange={(e) => { setExecRowsPerPage(parseInt(e.target.value, 10)); setExecPage(0); }}
                rowsPerPageOptions={[10, 20, 50]}
                labelRowsPerPage="每页：" labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共 ${count}`}
              />
            </Card>
          </>
        )}

        {/* 弹窗 */}
        <WatermarkDialog open={watermarkOpen} onClose={() => setWatermarkOpen(false)}
          config={watermark}
          onSave={(c) => { setWatermark(c); localStorage.setItem('news-broadcast-watermark', JSON.stringify(c)); }}
        />
        <CreatePlanDialog open={createOpen} onClose={() => { setCreateOpen(false); setEditPlan(null); }}
          onSave={(plan) => { editPlan ? handleUpdatePlan(plan) : handleCreatePlan(plan); }}
          editPlan={editPlan} allDevices={allDeviceNames}
        />
        <PlanDetailDialog plan={detailPlan} open={Boolean(detailPlan)}
          onClose={() => setDetailPlan(null)} histories={histories}
        />
      </Box>
    </Box>
  );
}
```

注意：需要同时将 `formatDateTime` 函数改为工具函数（如果之前是内联在其他组件中），或者直接使用上面定义的版本。

确保 `formatDateTime` 函数已存在（可能在 mock 数据部分已经定义了）。

- [ ] **Step 2: 编译检查**

Run: `npx vite build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/components/NewsBroadcast.tsx
git commit -m "feat(news-broadcast): add main component with plan list and execution results"
```

---

### Task 5: App.tsx 菜单路由 + permissions.ts 配置

- [ ] **Step 1: 修改 permissions.ts 添加页面按钮配置**

打开 `src/app/types/permissions.ts`，在 `ALL_PAGES` 数组中（即在 `operation-log` 之后或其他合适位置）添加：

```typescript
  {
    key: 'news-broadcast',
    label: '时事转播',
    buttons: [
      { key: 'create', label: '新建计划' },
      { key: 'edit', label: '编辑' },
      { key: 'delete', label: '删除' },
      { key: 'toggle-status', label: '启停' },
      { key: 'config-watermark', label: '水印设置' },
    ],
  },
```

- [ ] **Step 2: 修改 App.tsx 添加导入、菜单项和路由**

打开 `src/app/App.tsx`：

**2a.** 在 import 区域添加：

```typescript
import NewsBroadcast from './components/NewsBroadcast';
```

**2b.** 在 `currentPage` 的联合类型中添加 `'news-broadcast'`：

找到 `currentPage` 的 useState 类型（约第 98 行），在联合类型中添加 `'news-broadcast'`。

**2c.** 在 `menuGroups` 的 `school-level` → `central` 的 children 数组中添加菜单项（插在 `central-overview` 和 `classroom` 之间或其他合适位置）：

```typescript
{ id: 'news-broadcast', label: '时事转播', pageId: 'news-broadcast' },
```

**2d.** 在路由条件渲染中添加（与 `central-overview` 等并列，约第 397 行附近）：

```typescript
      ) : currentPage === 'news-broadcast' ? (
        <NewsBroadcast />
      ) : currentPage === 'central-overview' ? (
```

- [ ] **Step 3: 编译检查**

Run: `npx vite build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/app/App.tsx src/app/types/permissions.ts
git commit -m "feat(news-broadcast): integrate into app menu, routing, and permissions"
```

---

### Task 6: 最终验证

- [ ] **Step 1: 完整构建**

Run: `npx vite build`
Expected: Build succeeds with no errors

- [ ] **Step 2: 最终提交**

```bash
git add -A
git commit -m "chore: final build verification for news broadcast feature"
```
