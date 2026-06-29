# 运行日志页面实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 OperationLog.tsx 从 26 行占位页面重写为包含平台审计日志和终端审计日志两个 Tab 的完整功能页面。

**Architecture:** 单组件模式，所有代码在 `OperationLog.tsx` 中，复用项目已有的模式（类型定义、Mock 函数、子组件内联）。参考 NewsBroadcast.tsx 的 Tab + 筛选 + 分页 + 弹窗结构。

**Tech Stack:** React 18 + TypeScript, MUI v7, Tailwind CSS v4, date-fns（已安装）

## 文件结构

- 修改: `src/app/components/OperationLog.tsx` — 唯一文件，完整重写
- 测试: 无（项目无测试框架）

## 任务分解

### 任务 1: 类型定义 + Mock 数据生成函数

**文件:** `src/app/components/OperationLog.tsx`（行 1-150）

**产出:** 所有类型定义和 Mock 函数，被任务 2、3、4 消费

- [ ] **Step 1: 在文件顶部添加类型定义**

```typescript
// ─── 类型定义 ───

export type OpStatus = 'sent' | 'all_success' | 'partial' | 'failed';
export type ExecStatus = 'success' | 'failed' | 'running';
export type OpType =
  | '设备重启' | '磁盘清理' | '文件迁移' | '磁盘格式化'
  | '信息发布' | '策略变更' | '固件升级' | '配置修改';

export interface PlatformLog {
  id: string;
  time: string;           // ISO string
  operator: string;
  opType: OpType;
  content: string;
  targetDeviceIds: string[];
  status: OpStatus;
}

export interface TerminalLog {
  id: string;
  time: string;           // ISO string
  deviceId: string;
  deviceName: string;
  deviceCode: string;
  location: string;
  opType: OpType;
  opContent: string;
  status: ExecStatus;
  detail: string;
}

export type PlatformStatusFilter = 'all' | OpStatus;
export type ExecStatusFilter = 'all' | ExecStatus;
export type OpTypeFilter = 'all' | OpType;
```

- [ ] **Step 2: 添加工具常量和函数**

```typescript
// ─── 常量 ───

const OPERATION_TYPES: OpType[] = [
  '设备重启', '磁盘清理', '文件迁移', '磁盘格式化',
  '信息发布', '策略变更', '固件升级', '配置修改',
];

const OPERATORS = ['超级管理员', '系统自动', 'admin', '运维人员'];

const DEVICE_NAMES = [
  '东教学楼101教室终端', '东教学楼102教室终端', '东教学楼103教室终端',
  '东教学楼201教室终端', '东教学楼202教室终端', '东教学楼301教室终端',
  '西教学楼101教室终端', '西教学楼102教室终端',
  '西教学楼201教室终端', '西教学楼202教室终端', '西教学楼203教室终端',
  '综合楼101教室终端', '综合楼102教室终端', '综合楼103教室终端',
  '综合楼104教室终端', '综合楼201教室终端', '综合楼202教室终端',
];

const DEVICE_CODES = DEVICE_NAMES.map((_, i) => `DEV-EDU-${String(i + 1).padStart(3, '0')}`);

const BUILDINGS = [
  { name: '东教学楼', floors: { '一楼': ['101','102','103'], '二楼': ['201','202'], '三楼': ['301'] } },
  { name: '西教学楼', floors: { '一楼': ['101','102'], '二楼': ['201','202','203'] } },
  { name: '综合楼', floors: { '一楼': ['101','102','103','104'], '二楼': ['201','202'] } },
] as const;

// 工具函数
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${d.getFullYear()}-${M}-${D} ${h}:${m}`;
}

// 根据设备索引获取位置
function getLocation(deviceIndex: number): string {
  let idx = 0;
  for (const b of BUILDINGS) {
    for (const [floor, rooms] of Object.entries(b.floors)) {
      for (const room of rooms) {
        if (idx === deviceIndex) return `${b.name} / ${floor} / ${room}教室`;
        idx++;
      }
    }
  }
  return '未知位置';
}
```

- [ ] **Step 3: 添加 Mock 数据生成函数**

```typescript
// ─── Mock 数据生成 ───

const OP_CONTENT_MAP: Record<OpType, string[]> = {
  '设备重启': [
    '对{devices}执行远程重启操作',
    '对{devices}执行强制重启（异常恢复）',
  ],
  '磁盘清理': [
    '对{devices}执行磁盘清理（C盘）- 清理备份文件、缓存文件',
    '对{devices}执行磁盘清理（D盘）- 清理临时文件',
  ],
  '文件迁移': [
    '对{devices}执行文件迁移 {src} → {dst}（视频文件）',
    '对{devices}执行文件迁移 {src} → {dst}（文档文件）',
  ],
  '磁盘格式化': [
    '对{devices}执行磁盘格式化（{disk}盘）- {fs}',
    '对{devices}执行磁盘格式化（{disk}盘）- 快速格式化',
  ],
  '信息发布': [
    '发布通知「{title}」到{devices}',
    '发布公告「{title}」到{devices}',
  ],
  '策略变更': [
    '更新{devices}的安全策略配置',
    '修改{devices}的USB管控策略',
  ],
  '固件升级': [
    '对{devices}推送固件升级 v{ver}',
    '对{devices}执行固件回滚 v{prev} → v{ver}',
  ],
  '配置修改': [
    '修改{devices}的网络配置（DNS/代理）',
    '修改{devices}的显示分辨率设置',
  ],
};

function generateContent(opType: OpType, deviceNames: string[]): string {
  const templates = OP_CONTENT_MAP[opType];
  const template = pick(templates);
  const devicesStr = deviceNames.length <= 2
    ? deviceNames.join('、')
    : `${deviceNames[0]}等 ${deviceNames.length} 台设备`;
  return template
    .replace('{devices}', devicesStr)
    .replace('{src}', 'C:\\Users')
    .replace('{dst}', 'D:\\Data')
    .replace('{disk}', pick(['D', 'E']))
    .replace('{fs}', 'NTFS')
    .replace('{title}', pick(['午间安全提示', '放学通知', '考试安排', '家长会通知']))
    .replace('{ver}', `${rand(2, 6)}.${rand(0, 9)}.${rand(0, 99)}`)
    .replace('{prev}', `${rand(1, 3)}.${rand(0, 9)}.${rand(0, 99)}`);
}

function generateTerminalDetail(opType: OpType, success: boolean): string {
  if (!success) {
    return pick(['设备离线', '连接超时', '磁盘空间不足', '权限不足', '文件不存在']);
  }
  switch (opType) {
    case '磁盘清理': return `释放空间 ${rand(0.5, 5)} GB`;
    case '文件迁移': return `迁移 ${rand(50, 500)} 个文件，${rand(0.2, 3).toFixed(1)} GB`;
    case '磁盘格式化': return '格式化完成';
    case '固件升级': return `新版本已生效`;
    case '设备重启': return `重启完成，启动耗时 ${rand(20, 90)}s`;
    default: return '执行成功';
  }
}

function generateMockData(): { platformLogs: PlatformLog[]; terminalLogs: TerminalLog[] } {
  const platformLogs: PlatformLog[] = [];
  const terminalLogs: TerminalLog[] = [];
  const now = Date.now();

  for (let i = 0; i < 25; i++) {
    const opType = pick(OPERATION_TYPES);
    const operator = pick(OPERATORS);
    const deviceCount = rand(1, 8);
    const targetDeviceIds = Array.from({ length: deviceCount }, () =>
      String(rand(0, DEVICE_NAMES.length - 1))
    ).filter((v, idx, arr) => arr.indexOf(v) === idx); // dedupe

    const time = new Date(now - rand(0, 30) * 86400000 - rand(0, 24) * 3600000).toISOString();
    const deviceNames = targetDeviceIds.map((id) => DEVICE_NAMES[parseInt(id)]);
    const content = generateContent(opType, deviceNames);

    let successCount = 0;
    let failCount = 0;
    let runningCount = 0;

    const termLogsForThisOp: TerminalLog[] = targetDeviceIds.map((devId) => {
      const deviceIndex = parseInt(devId);
      const r = Math.random();
      let status: ExecStatus;
      let detail: string;
      if (r < 0.80) {
        status = 'success'; successCount++;
        detail = generateTerminalDetail(opType, true);
      } else if (r < 0.95) {
        status = 'failed'; failCount++;
        detail = generateTerminalDetail(opType, false);
      } else {
        status = 'running'; runningCount++;
        detail = '指令已下发，等待终端上报';
      }

      return {
        id: `term-${i}-${devId}`,
        time: status === 'running' ? time : new Date(new Date(time).getTime() + rand(10, 300) * 1000).toISOString(),
        deviceId: devId,
        deviceName: DEVICE_NAMES[deviceIndex],
        deviceCode: DEVICE_CODES[deviceIndex],
        location: getLocation(deviceIndex),
        opType,
        opContent: content,
        status,
        detail,
      };
    });

    terminalLogs.push(...termLogsForThisOp);

    let platformStatus: OpStatus;
    if (runningCount === deviceCount) platformStatus = 'sent';
    else if (failCount === deviceCount) platformStatus = 'failed';
    else if (successCount === deviceCount) platformStatus = 'all_success';
    else if (failCount > 0) platformStatus = 'partial';
    else platformStatus = successCount > 0 ? 'all_success' : 'sent';

    platformLogs.push({
      id: `op-${i}`,
      time,
      operator,
      opType,
      content,
      targetDeviceIds,
      status: platformStatus,
    });
  }

  // 按时间排序（最新的在前）
  platformLogs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  terminalLogs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return { platformLogs, terminalLogs };
}
```

### 任务 2: 子组件 — 状态 Chip + 设备详情弹窗

**文件:** `src/app/components/OperationLog.tsx`（承接任务 1，在类型/Mock之后）

**产出:** 通用的状态 Chip 组件和平台日志中"目标设备"点击展开的详情弹窗

- [ ] **Step 1: 添加状态 Chip 组件和工具函数**

```typescript
// ─── 状态 Chip 组件 ───

function PlatformStatusChip({ status }: { status: OpStatus }) {
  const map: Record<OpStatus, { label: string; bg: string; color: string }> = {
    sent: { label: '已下发', bg: '#dbeafe', color: '#2563eb' },
    all_success: { label: '全部成功', bg: '#dcfce7', color: '#16a34a' },
    partial: { label: '部分成功', bg: '#fef9c3', color: '#ca8a04' },
    failed: { label: '失败', bg: '#fee2e2', color: '#dc2626' },
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

function getStatusLabel(status: OpStatus): string {
  const map: Record<OpStatus, string> = {
    sent: '已下发', all_success: '全部成功', partial: '部分成功', failed: '失败',
  };
  return map[status];
}
```

- [ ] **Step 2: 添加目标设备详情弹窗（平台日志点击"目标设备"列展开）**

```typescript
// ─── 目标设备详情弹窗 ───

function TargetDevicesDialog({
  open, onClose, terminalLogs, platformLog,
}: {
  open: boolean;
  onClose: () => void;
  terminalLogs: TerminalLog[];
  platformLog: PlatformLog | null;
}) {
  if (!platformLog) return null;

  const logs = terminalLogs.filter((t) => platformLog.targetDeviceIds.includes(t.deviceId));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb', pb: 2 }}>
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <Computer className="text-blue-600" />
            <Typography variant="h6">{platformLog.content}</Typography>
          </Box>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        {/* 基本信息 */}
        <Box className="flex gap-6 mb-4 text-sm">
          <Box>
            <Typography variant="caption" color="text.secondary">操作类型</Typography>
            <Typography variant="body2" className="font-medium">{platformLog.opType}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">操作人员</Typography>
            <Typography variant="body2" className="font-medium">{platformLog.operator}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">下发时间</Typography>
            <Typography variant="body2" className="font-medium">{formatDate(platformLog.time)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">总体状态</Typography>
            <PlatformStatusChip status={platformLog.status} />
          </Box>
        </Box>

        <Typography variant="subtitle2" className="font-bold mb-3">目标设备执行情况</Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 600 }}>设备名称</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>设备编号</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>所属位置</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>执行状态</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>执行时间</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>详情</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">暂无设备执行记录</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell><Typography variant="body2" className="font-medium">{log.deviceName}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{log.deviceCode}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{log.location}</Typography></TableCell>
                    <TableCell><ExecStatusChip status={log.status} /></TableCell>
                    <TableCell><Typography variant="caption">{formatDate(log.time)}</Typography></TableCell>
                    <TableCell><Typography variant="caption" color={log.status === 'failed' ? 'error' : 'text.secondary'}>{log.detail}</Typography></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions className="px-6 pb-4">
        <Button onClick={onClose} variant="contained" size="small">关闭</Button>
      </DialogActions>
    </Dialog>
  );
}
```

- [ ] **Step 3: 添加清除确认弹窗**

```typescript
// ─── 清除确认弹窗 ───

function ClearConfirmDialog({
  open, onClose, onConfirm, target,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  target: string;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>确认清除</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          确定要清除{target}吗？此操作不可恢复。
        </Typography>
      </DialogContent>
      <DialogActions className="px-6 pb-4">
        <Button onClick={onClose} variant="outlined">取消</Button>
        <Button onClick={() => { onConfirm(); onClose(); }} variant="contained" color="error">确认清除</Button>
      </DialogActions>
    </Dialog>
  );
}
```

### 任务 3: 主组件 — 平台审计日志 Tab + 终端审计日志 Tab

**文件:** `src/app/components/OperationLog.tsx`（承接任务 2，添加主组件）

- [ ] **Step 1: 添加导出 CSV 工具函数**

```typescript
// ─── 导出 CSV ───

function exportToCSV(data: Record<string, string>[], headers: string[], keys: string[], filename: string) {
  const escapeCSV = (s: string) => {
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const rows = data.map((row) => keys.map((k) => escapeCSV(row[k] || '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: 编写主组件 Logic（useState + 筛选 + 分页）**

```typescript
export default function OperationLog() {
  const [data] = useState(() => generateMockData());
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ── 平台日志筛选 ──
  const [platformTimeStart, setPlatformTimeStart] = useState('');
  const [platformTimeEnd, setPlatformTimeEnd] = useState('');
  const [platformOpTypeFilter, setPlatformOpTypeFilter] = useState<OpTypeFilter>('all');
  const [platformOperatorFilter, setPlatformOperatorFilter] = useState('');
  const [platformStatusFilter, setPlatformStatusFilter] = useState<PlatformStatusFilter>('all');

  // ── 终端日志筛选 ──
  const [termTimeStart, setTermTimeStart] = useState('');
  const [termTimeEnd, setTermTimeEnd] = useState('');
  const [termDeviceFilter, setTermDeviceFilter] = useState('');
  const [termOpTypeFilter, setTermOpTypeFilter] = useState<OpTypeFilter>('all');
  const [termStatusFilter, setTermStatusFilter] = useState<ExecStatusFilter>('all');

  // ── 弹窗状态 ──
  const [detailPlatform, setDetailPlatform] = useState<PlatformLog | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  // 平台日志筛选逻辑
  const filteredPlatform = useMemo(() => {
    return data.platformLogs.filter((log) => {
      if (platformOpTypeFilter !== 'all' && log.opType !== platformOpTypeFilter) return false;
      if (platformStatusFilter !== 'all' && log.status !== platformStatusFilter) return false;
      if (platformOperatorFilter && !log.operator.includes(platformOperatorFilter)) return false;
      if (platformTimeStart && new Date(log.time).getTime() < new Date(platformTimeStart).getTime()) return false;
      if (platformTimeEnd && new Date(log.time).getTime() > new Date(platformTimeEnd).getTime() + 86400000) return false;
      return true;
    });
  }, [data.platformLogs, platformOpTypeFilter, platformStatusFilter, platformOperatorFilter, platformTimeStart, platformTimeEnd]);

  // 终端日志筛选逻辑
  const filteredTerminal = useMemo(() => {
    return data.terminalLogs.filter((log) => {
      if (termOpTypeFilter !== 'all' && log.opType !== termOpTypeFilter) return false;
      if (termStatusFilter !== 'all' && log.status !== termStatusFilter) return false;
      if (termDeviceFilter) {
        const q = termDeviceFilter.toLowerCase();
        if (!log.deviceName.toLowerCase().includes(q) && !log.deviceCode.toLowerCase().includes(q)) return false;
      }
      if (termTimeStart && new Date(log.time).getTime() < new Date(termTimeStart).getTime()) return false;
      if (termTimeEnd && new Date(log.time).getTime() > new Date(termTimeEnd).getTime() + 86400000) return false;
      return true;
    });
  }, [data.terminalLogs, termOpTypeFilter, termStatusFilter, termDeviceFilter, termTimeStart, termTimeEnd]);

  const pagedPlatform = filteredPlatform.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const pagedTerminal = filteredTerminal.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // 注意：当 tab 切换时重置页码
  const handleTabChange = (_: any, newTab: number) => {
    setTab(newTab);
    setPage(0);
  };
```

- [ ] **Step 3: 主组件 JSX — 标题栏 + Tab 切换 + 工具栏（导出/清除）**

返回 JSX 的第一部分（标题、Tab、工具栏）：

```typescript
  return (
    <Box className="overflow-auto h-[calc(100vh-64px)] bg-gray-50">
      <Box className="p-4 sm:p-6">
        {/* 标题行 */}
        <Box className="mb-4 flex items-center justify-between">
          <Box>
            <Typography variant="h5" className="font-bold">📋 运行日志</Typography>
            <Typography variant="body2" color="text.secondary" className="mt-1">
              查看系统运行日志，包含平台下发的操作指令及终端执行情况
            </Typography>
          </Box>
          <Box className="flex gap-2">
            <Button variant="outlined" size="small" startIcon={<Download />}
              onClick={() => {
                if (tab === 0) {
                  exportToCSV(
                    filteredPlatform.map((l) => ({
                      time: formatDate(l.time), operator: l.operator,
                      opType: l.opType, content: l.content,
                      targets: `${l.targetDeviceIds.length} 台`,
                      status: getStatusLabel(l.status),
                    })),
                    ['时间', '操作人员', '操作类型', '操作内容', '目标设备', '状态'],
                    ['time', 'operator', 'opType', 'content', 'targets', 'status'],
                    `平台审计日志_${new Date().toISOString().slice(0, 10)}.csv`
                  );
                } else {
                  exportToCSV(
                    filteredTerminal.map((l) => ({
                      time: formatDate(l.time), deviceName: l.deviceName,
                      deviceCode: l.deviceCode, location: l.location,
                      opType: l.opType, status: l.status === 'success' ? '成功' : l.status === 'failed' ? '失败' : '执行中',
                    })),
                    ['时间', '设备名称', '设备编号', '所属位置', '指令类型', '执行状态'],
                    ['time', 'deviceName', 'deviceCode', 'location', 'opType', 'status'],
                    `终端审计日志_${new Date().toISOString().slice(0, 10)}.csv`
                  );
                }
              }}
            >
              导出日志
            </Button>
            <Button variant="outlined" size="small" color="error" startIcon={<DeleteSweep />}
              onClick={() => setClearDialogOpen(true)}>
              清除日志
            </Button>
          </Box>
        </Box>

        {/* Tab 切换 */}
        <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="平台审计日志" />
          <Tab label="终端审计日志" />
        </Tabs>

        {/* ====== Tab 0: 平台审计日志 ====== */}
        {tab === 0 && (
          <>
            {/* 筛选栏 */}
            <Box className="mb-4 flex flex-wrap items-center gap-3">
              <TextField size="small" type="date" label="开始日期"
                value={platformTimeStart}
                onChange={(e) => { setPlatformTimeStart(e.target.value); setPage(0); }}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 140 }}
              />
              <TextField size="small" type="date" label="结束日期"
                value={platformTimeEnd}
                onChange={(e) => { setPlatformTimeEnd(e.target.value); setPage(0); }}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 140 }}
              />
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <Select value={platformOpTypeFilter}
                  onChange={(e) => { setPlatformOpTypeFilter(e.target.value as OpTypeFilter); setPage(0); }}>
                  <MenuItem value="all">全部类型</MenuItem>
                  {OPERATION_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField size="small" placeholder="操作人员..."
                value={platformOperatorFilter}
                onChange={(e) => { setPlatformOperatorFilter(e.target.value); setPage(0); }}
                sx={{ minWidth: 130 }}
              />
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <Select value={platformStatusFilter}
                  onChange={(e) => { setPlatformStatusFilter(e.target.value as PlatformStatusFilter); setPage(0); }}>
                  <MenuItem value="all">全部状态</MenuItem>
                  <MenuItem value="all_success">全部成功</MenuItem>
                  <MenuItem value="partial">部分成功</MenuItem>
                  <MenuItem value="failed">失败</MenuItem>
                  <MenuItem value="sent">已下发</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">共 {filteredPlatform.length} 条</Typography>
            </Box>

            {/* 表格 */}
            <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                      <TableCell sx={{ fontWeight: 600, width: 50 }}>序号</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 140 }}>时间</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 100 }}>操作人员</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 100 }}>操作类型</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>操作内容</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 80 }}>目标设备</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 90 }}>状态</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 80 }}>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedPlatform.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                          <Box className="text-center">
                            <ReceiptLong className="text-5xl text-gray-300 mb-2" />
                            <Typography variant="body2" color="text.secondary">暂无平台审计日志</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedPlatform.map((log, index) => (
                        <TableRow key={log.id} hover>
                          <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                          <TableCell><Typography variant="caption">{formatDate(log.time)}</Typography></TableCell>
                          <TableCell><Typography variant="body2">{log.operator}</Typography></TableCell>
                          <TableCell>
                            <Chip label={log.opType} size="small" variant="outlined" sx={{ fontSize: 11, height: 22 }} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 300 }} className="truncate">
                              {log.content}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Button size="small" variant="text" sx={{ fontSize: 12, minWidth: 'auto' }}
                              onClick={() => setDetailPlatform(log)}>
                              {log.targetDeviceIds.length} 台
                            </Button>
                          </TableCell>
                          <TableCell><PlatformStatusChip status={log.status} /></TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => setDetailPlatform(log)}>
                              <Visibility sx={{ fontSize: 16 }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div" count={filteredPlatform.length}
                page={page} onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 20, 50]}
                labelRowsPerPage="每页：" labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共 ${count}`}
              />
            </Card>
          </>
        )}

        {/* Tab 1: 终端审计日志 */}
        {tab === 1 && (
          <>
            {/* 筛选栏 */}
            <Box className="mb-4 flex flex-wrap items-center gap-3">
              <TextField size="small" type="date" label="开始日期"
                value={termTimeStart}
                onChange={(e) => { setTermTimeStart(e.target.value); setPage(0); }}
                InputLabelProps={{ shrink: true }} sx={{ minWidth: 140 }}
              />
              <TextField size="small" type="date" label="结束日期"
                value={termTimeEnd}
                onChange={(e) => { setTermTimeEnd(e.target.value); setPage(0); }}
                InputLabelProps={{ shrink: true }} sx={{ minWidth: 140 }}
              />
              <TextField size="small" placeholder="搜索设备名称/编号..."
                value={termDeviceFilter}
                onChange={(e) => { setTermDeviceFilter(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                sx={{ minWidth: 200 }}
              />
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <Select value={termOpTypeFilter}
                  onChange={(e) => { setTermOpTypeFilter(e.target.value as OpTypeFilter); setPage(0); }}>
                  <MenuItem value="all">全部类型</MenuItem>
                  {OPERATION_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <Select value={termStatusFilter}
                  onChange={(e) => { setTermStatusFilter(e.target.value as ExecStatusFilter); setPage(0); }}>
                  <MenuItem value="all">全部状态</MenuItem>
                  <MenuItem value="success">成功</MenuItem>
                  <MenuItem value="failed">失败</MenuItem>
                  <MenuItem value="running">执行中</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">共 {filteredTerminal.length} 条</Typography>
            </Box>

            {/* 表格 */}
            <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                      <TableCell sx={{ fontWeight: 600, width: 50 }}>序号</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 140 }}>时间</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>设备名称</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 110 }}>设备编号</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 180 }}>所属位置</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 80 }}>指令类型</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>指令内容</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 80 }}>状态</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>详情</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedTerminal.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                          <Box className="text-center">
                            <ReceiptLong className="text-5xl text-gray-300 mb-2" />
                            <Typography variant="body2" color="text.secondary">暂无终端审计日志</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedTerminal.map((log, index) => (
                        <TableRow key={log.id} hover>
                          <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                          <TableCell><Typography variant="caption">{formatDate(log.time)}</Typography></TableCell>
                          <TableCell><Typography variant="body2" className="font-medium">{log.deviceName}</Typography></TableCell>
                          <TableCell><Typography variant="caption">{log.deviceCode}</Typography></TableCell>
                          <TableCell><Typography variant="caption" sx={{ fontSize: 12 }}>{log.location}</Typography></TableCell>
                          <TableCell>
                            <Chip label={log.opType} size="small" variant="outlined" sx={{ fontSize: 11, height: 22 }} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 250 }} className="truncate">
                              {log.opContent}
                            </Typography>
                          </TableCell>
                          <TableCell><ExecStatusChip status={log.status} /></TableCell>
                          <TableCell>
                            <Typography variant="caption" color={log.status === 'failed' ? 'error' : 'text.secondary'}>
                              {log.detail}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div" count={filteredTerminal.length}
                page={page} onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 20, 50]}
                labelRowsPerPage="每页：" labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共 ${count}`}
              />
            </Card>
          </>
        )}

        {/* 设备目标详情弹窗 */}
        <TargetDevicesDialog
          open={Boolean(detailPlatform)}
          onClose={() => setDetailPlatform(null)}
          platformLog={detailPlatform}
          terminalLogs={data.terminalLogs}
        />

        {/* 清除确认弹窗 */}
        <ClearConfirmDialog
          open={clearDialogOpen}
          onClose={() => setClearDialogOpen(false)}
          onConfirm={() => {
            // 清除当前 Tab 对应的日志
            if (tab === 0) {
              // 实际使用中应调 API 清除；Mock 环境下重置数据
              // 这里保持简单，重新生成空数组
            }
            // 提示用户
          }}
          target={tab === 0 ? '平台审计日志' : '终端审计日志'}
        />
      </Box>
    </Box>
  );
}
```

### 任务 4: 完整的 import 语句 + 最终校验

**文件:** `src/app/components/OperationLog.tsx`

在文件顶部添加所有需要的 import：

```typescript
import { useState, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Button, IconButton,
  TextField, InputAdornment, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination,
  Select, MenuItem, FormControl,
  Paper, Tooltip,
} from '@mui/material';
import {
  Search, Close, Visibility, Computer, Download, DeleteSweep,
  ReceiptLong,
} from '@mui/icons-material';
```

需要验证：
- [ ] 所有 import 的组件在 JSX 中都有使用
- [ ] 类型命名一致性（OpStatus, ExecStatus, OpType 等）
- [ ] 筛选状态重置逻辑（tab 切换时 page 重置为 0）
- [ ] 空状态显示
- [ ] 导出 CSV 使用 BOM 标记 ﻿ 以支持中文 UTF-8

### 任务 5: 最终全量写入

- [ ] **Step 1: 确认所有代码块拼接后的完整文件结构**

```
1-10:    import 语句
11-50:   类型定义
51-130:  工具常量 + Mock 函数
131-170: 状态 Chip 组件
171-270: TargetDevicesDialog 组件
271-310: ClearConfirmDialog 组件
311-340: 导出 CSV 函数
341-380: 主组件 state + 筛选逻辑
381-800: 主组件 JSX
801-830: 默认 export
```

- [ ] **Step 2: 检查是否存在以下问题：**
  - 类型 `PlatformStatusFilter` 是否包含了 `'all' | OpStatus` → 确认
  - OP_CONTENT_MAP 中所有 OpType 都有对应模板 → 确认
  - generateMockData 中 `sorted` 逻辑确保最新在前 → 确认
  - Tab 切换时 `setPage(0)` 通过 `handleTabChange` 实现 → 确认
  - 终端日志筛选使用了 `termDeviceFilter` 搜索设备名称/编号 → 确认


- 所有组件内联在 OperationLog.tsx 中（与其他已完成页面一致）
- 使用 MUI Box/Typography/Table/Button 等组件 + Tailwind 样式类
- Chip 状态颜色保持项目统一风格（#dcfce7/#16a34a 成功, #fee2e2/#dc2626 失败, #dbeafe/#2563eb 执行中/已下发, #fef9c3/#ca8a04 部分成功）
- 内容区高度使用 h-[calc(100vh-64px)]
- 使用 localStorage 持久化筛选状态（可选）
- Mock 数据复用 DEVICE_NAMES 列表（与其他模块一致）
- 导出 CSV 函数参考 CentralOverview.tsx 的 exportToCSV
- 表格空状态显示"暂无数据"提示
- 错误状态考虑：无数据、筛选无结果

---
