import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, IconButton,
  TextField, InputAdornment, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination,
  Select, MenuItem, FormControl, FormControlLabel,
  Checkbox, Switch, Tooltip, Menu, Tabs, Tab,
  Paper, CircularProgress, Divider, RadioGroup, Radio,
  Snackbar, Alert,
} from '@mui/material';
import {
  Devices, CheckCircle, Cancel, Warning, PowerOff,
  Search, RestartAlt, Lock, LockOpen,
  Notifications, VolumeUp, FileUpload,
  OpenInNew, Close, Message, Computer, Settings, SystemUpdate,
  GridView, TableView, KeyboardArrowDown, ChevronRight,
  Refresh, ArrowBack, CloudUpload, Send,
} from '@mui/icons-material';
import SendMessageDialog, { type MessageTarget, type SendMessagePayload } from './SendMessageDialog';

// ─── 类型定义 ───

type DeviceStatus = 'online' | 'offline' | 'abnormal';
type ViewMode = 'table' | 'grid';

interface DeviceMgmtDevice {
  id: string;
  name: string;
  code: string;
  ip: string;
  building: string;
  floor: string;
  room: string;
  status: DeviceStatus;
  os: string;
  cpuUsage: number;
  memoryUsage: number;
  lastActive: string;
  onlineDuration: number; // 分钟
  volume: number; // 0-100
  screenThumbnail: string; // CSS 渐变类名用于模拟桌面
  offlineReason?: string;
}

interface RemoteCommand {
  id: string;
  label: string;
  category: RemoteCommandCategory;
  icon: string;
  supportBatch: boolean;
  requireConfirm: boolean;
}

type RemoteCommandCategory =
  | 'system'
  | 'screen'
  | 'audio'
  | 'file'
  | 'app'
  | 'message'
  | 'tool';

interface FileItem {
  name: string;
  size: number;
}

interface CommandResult {
  deviceId: string;
  deviceName: string;
  commandLabel: string;
  status: 'pending' | 'success' | 'fail';
  message?: string;
}

interface CountdownParams {
  enabled: boolean;
  eventName: string;
  targetDate: string;
}

// ─── 远程指令定义 ───

const COMMANDS: Record<string, RemoteCommand> = {
  powerOff: { id: 'powerOff', label: '关机', category: 'system', icon: 'PowerOff', supportBatch: true, requireConfirm: true },
  reboot: { id: 'reboot', label: '重启', category: 'system', icon: 'RestartAlt', supportBatch: true, requireConfirm: true },
  lockScreen: { id: 'lockScreen', label: '锁屏', category: 'screen', icon: 'Lock', supportBatch: true, requireConfirm: false },
  unlockScreen: { id: 'unlockScreen', label: '解锁', category: 'screen', icon: 'LockOpen', supportBatch: false, requireConfirm: false },
  ringBell: { id: 'ringBell', label: '打铃', category: 'audio', icon: 'Notifications', supportBatch: true, requireConfirm: false },
  volControl: { id: 'volControl', label: '音量控制', category: 'audio', icon: 'VolumeUp', supportBatch: true, requireConfirm: false },
  fileDist: { id: 'fileDist', label: '文件传输', category: 'file', icon: 'FileUpload', supportBatch: true, requireConfirm: true },
  openApp: { id: 'openApp', label: '打开应用', category: 'app', icon: 'OpenInNew', supportBatch: true, requireConfirm: false },
  closeApp: { id: 'closeApp', label: '关闭应用', category: 'app', icon: 'Close', supportBatch: true, requireConfirm: true },
  sendMsg: { id: 'sendMsg', label: '发送消息', category: 'message', icon: 'Message', supportBatch: true, requireConfirm: false },
  countdown: { id: 'countdown', label: '倒计日', category: 'message', icon: 'CalendarMonth', supportBatch: true, requireConfirm: false },
  remoteDesktop: { id: 'remoteDesktop', label: '远程桌面', category: 'tool', icon: 'Computer', supportBatch: false, requireConfirm: false },
  remoteSettings: { id: 'remoteSettings', label: '远程设置', category: 'tool', icon: 'Settings', supportBatch: true, requireConfirm: false },
  sysUpdate: { id: 'sysUpdate', label: '系统更新', category: 'tool', icon: 'SystemUpdate', supportBatch: true, requireConfirm: true },
};

const COMMAND_CATEGORIES: { key: RemoteCommandCategory; label: string; icon: string }[] = [
  { key: 'system', label: '系统控制', icon: 'PowerSettingsNew' },
  { key: 'screen', label: '屏幕控制', icon: 'Lock' },
  { key: 'audio', label: '音频控制', icon: 'Notifications' },
  { key: 'file', label: '文件操作', icon: 'FileUpload' },
  { key: 'message', label: '消息通知', icon: 'Message' },
];

// ─── Mock 数据 ───

const BUILDINGS = ['教学楼A栋', '教学楼B栋', '实验楼C栋', '综合楼D栋'];
const FLOORS = ['1F', '2F', '3F', '4F'];
const OS_LIST = ['Windows 10', 'Windows 11', 'HarmonyOS'];

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatDate(d: Date): string {
  return d.toLocaleString('zh-CN', { hour12: false });
}

const THUMBNAIL_GRADIENTS = [
  'bg-gradient-to-br from-blue-400 to-blue-600',
  'bg-gradient-to-br from-green-400 to-teal-600',
  'bg-gradient-to-br from-purple-400 to-indigo-600',
  'bg-gradient-to-br from-orange-400 to-red-500',
  'bg-gradient-to-br from-cyan-400 to-blue-500',
];

function generateMockDevices(): DeviceMgmtDevice[] {
  const devices: DeviceMgmtDevice[] = [];
  let idx = 0;
  for (const building of BUILDINGS) {
    for (const floor of FLOORS) {
      const roomCount = rand(1, 2);
      for (let r = 0; r < roomCount; r++) {
        idx++;
        const roomNum = 101 + (FLOORS.indexOf(floor) * 100) + r;
        const isOnline = Math.random() < 0.78;
        const isAbnormal = !isOnline && Math.random() < 0.4;
        const status: DeviceStatus = isOnline ? 'online' : isAbnormal ? 'abnormal' : 'offline';
        const lastActive = new Date(Date.now() - rand(0, 72) * 3600000);
        const cpuUsage = rand(10, 95);
        const memUsage = rand(15, 92);

        devices.push({
          id: `dev-${idx}`,
          name: `${building.replace('栋', '')}${roomNum}教室终端`,
          code: `DEV-EDU-${String(idx).padStart(3, '0')}`,
          ip: `192.168.${rand(1, 10)}.${idx + 10}`,
          building,
          floor,
          room: `${building} / ${floor} / ${roomNum}教室`,
          status,
          os: pick(OS_LIST),
          cpuUsage,
          memoryUsage: memUsage,
          lastActive: formatDate(lastActive),
          onlineDuration: isOnline ? rand(30, 480) : 0,
          volume: rand(30, 100),
          screenThumbnail: pick(THUMBNAIL_GRADIENTS),
          offlineReason: status === 'offline' ? '设备已关机' : status === 'abnormal' ? 'CPU 温度过高' : undefined,
        });
      }
    }
  }
  return devices;
}

// ─── 模拟指令执行 ───

function simulateCommand(
  devices: DeviceMgmtDevice[],
  commandId: string,
  onResult: (result: CommandResult) => void,
  onComplete: () => void,
): () => void {
  const command = COMMANDS[commandId];
  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  devices.forEach((d, i) => {
    const delay = rand(500, 3000);
    const timer = setTimeout(() => {
      if (cancelled) return;
      const success = d.status === 'online' ? Math.random() < 0.85 : Math.random() < 0.1;
      onResult({
        deviceId: d.id,
        deviceName: d.name,
        commandLabel: command.label,
        status: success ? 'success' : 'fail',
        message: success ? '指令已执行' : d.status !== 'online' ? '设备离线，发送失败' : '执行超时',
      });
      if (i === devices.length - 1) {
        setTimeout(onComplete, 500);
      }
    }, delay);
    timers.push(timer);
  });

  return () => {
    cancelled = true;
    timers.forEach(clearTimeout);
  };
}

// ─── 顶部统计卡片 ───
function StatCardsRow({ devices }: { devices: DeviceMgmtDevice[] }) {
  const stats = [
    { label: '总设备数', value: devices.length, icon: Devices, color: '#3b82f6', bg: 'bg-blue-50' },
    { label: '在线', value: devices.filter(d => d.status === 'online').length, icon: CheckCircle, color: '#22c55e', bg: 'bg-green-50' },
    { label: '离线', value: devices.filter(d => d.status === 'offline').length, icon: Cancel, color: '#6b7280', bg: 'bg-gray-50' },
    { label: '异常', value: devices.filter(d => d.status === 'abnormal').length, icon: Warning, color: '#ef4444', bg: 'bg-red-50' },
  ];

  return (
    <Box className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {stats.map(s => (
        <Card key={s.label} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 3 }}>
          <CardContent className={`${s.bg} flex items-center gap-4`}>
            <Box sx={{ color: s.color }}><s.icon sx={{ fontSize: 32 }} /></Box>
            <Box>
              <Typography variant="h4" className="font-bold" sx={{ color: s.color }}>{s.value}</Typography>
              <Typography variant="body2" color="text.secondary">{s.label}</Typography>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

// ─── 搜索筛选栏 ───
interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  buildingFilter: string;
  onBuildingChange: (v: string) => void;
  floorFilter: string;
  onFloorChange: (v: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  buildings: string[];
  floors: string[];
  onReset: () => void;
}

function SearchFilterBar({
  searchTerm, onSearchChange,
  statusFilter, onStatusChange,
  buildingFilter, onBuildingChange,
  floorFilter, onFloorChange,
  viewMode, onViewModeChange,
  buildings, floors,
  onReset,
}: FilterBarProps) {
  return (
    <Box className="mb-4 flex flex-wrap items-center gap-3 w-full">
      <TextField
        size="small"
        placeholder="搜索设备名称/编号/IP..."
        value={searchTerm}
        onChange={e => onSearchChange(e.target.value)}
        slotProps={{
          input: {
            startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
          },
        }}
        sx={{ minWidth: 260 }}
      />
      <FormControl size="small" sx={{ minWidth: 90 }}>
        <Select value={statusFilter} onChange={e => onStatusChange(e.target.value)} displayEmpty>
          <MenuItem value="all">全部状态</MenuItem>
          <MenuItem value="online">在线</MenuItem>
          <MenuItem value="offline">离线</MenuItem>
          <MenuItem value="abnormal">异常</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 100 }}>
        <Select value={buildingFilter} onChange={e => onBuildingChange(e.target.value)} displayEmpty>
          <MenuItem value="all">全部楼栋</MenuItem>
          {buildings.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 90 }}>
        <Select value={floorFilter} onChange={e => onFloorChange(e.target.value)} displayEmpty>
          <MenuItem value="all">全部楼层</MenuItem>
          {floors.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
        </Select>
      </FormControl>
      <Button size="small" onClick={onReset} startIcon={<RestartAlt />}>重置</Button>
      <Box className="ml-auto flex gap-1">
        <IconButton size="small" color={viewMode === 'table' ? 'primary' : 'default'} onClick={() => onViewModeChange('table')}>
          <TableView />
        </IconButton>
        <IconButton size="small" color={viewMode === 'grid' ? 'primary' : 'default'} onClick={() => onViewModeChange('grid')}>
          <GridView />
        </IconButton>
      </Box>
    </Box>
  );
}

// ─── 桌面缩略图 ───
function ScreenThumbnail({
  device, size = 'sm', onClick,
}: {
  device: DeviceMgmtDevice; size?: 'sm' | 'lg'; onClick?: () => void;
}) {
  const isOnline = device.status === 'online';
  const cls = size === 'sm' ? 'w-24 h-16 text-xs' : 'w-full h-40 text-sm';

  return (
    <Box
      onClick={onClick}
      className={`relative ${cls} rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105 shrink-0 ${
        isOnline ? device.screenThumbnail : 'bg-gray-300'
      }`}
    >
      {isOnline && (
        <Box className="absolute inset-0 grid grid-cols-3 gap-1 p-2 opacity-70">
          {['📁', '📄', '⚙️', '🖥️', '📊', '🌐'].slice(0, size === 'sm' ? 4 : 6).map((icon, i) => (
            <Box key={i} className="flex items-center justify-center text-white text-opacity-80"
              style={{ fontSize: size === 'sm' ? 10 : 16 }}
            >{icon}</Box>
          ))}
        </Box>
      )}
      {!isOnline && (
        <Box className="absolute inset-0 flex items-center justify-center">
          <PowerOff sx={{ fontSize: size === 'sm' ? 20 : 40, color: 'rgba(255,255,255,0.6)' }} />
        </Box>
      )}
      <Box className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-white ${
        device.status === 'online' ? 'bg-green-500' : device.status === 'offline' ? 'bg-gray-400' : 'bg-red-500'
      }`} />
    </Box>
  );
}

// ─── 表格行 ───
function DeviceTableRow({
  device, selected, onToggleSelect, onAction, onViewDesktop,
}: {
  device: DeviceMgmtDevice;
  selected: boolean;
  onToggleSelect: () => void;
  onAction: (device: DeviceMgmtDevice, anchor: HTMLElement) => void;
  onViewDesktop: (device: DeviceMgmtDevice) => void;
}) {
  const statusColor = device.status === 'online' ? '#16a34a' : device.status === 'offline' ? '#6b7280' : '#dc2626';
  const statusBg = device.status === 'online' ? '#dcfce7' : device.status === 'offline' ? '#f3f4f6' : '#fee2e2';

  return (
    <TableRow hover selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onChange={onToggleSelect} size="small" />
      </TableCell>
      <TableCell sx={{ width: 120 }}>
        <ScreenThumbnail device={device} size="sm" onClick={() => onViewDesktop(device)} />
      </TableCell>
      <TableCell>
        <Typography variant="body2" className="font-medium">{device.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          {device.status !== 'online' && device.offlineReason ? device.offlineReason : device.code}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{device.room}</Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={device.status === 'online' ? '在线' : device.status === 'offline' ? '离线' : '异常'}
          size="small"
          sx={{ backgroundColor: statusBg, color: statusColor, fontWeight: 600, height: 22, fontSize: 11 }}
        />
      </TableCell>
      <TableCell sx={{ maxWidth: 130 }}>
        {device.status === 'online' ? (
          <>
            <Typography variant="caption" display="block">{device.os}</Typography>
            <Box className="flex items-center gap-1 mt-0.5">
              <Box className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <Box className="h-full rounded-full bg-blue-500" style={{ width: `${device.cpuUsage}%` }} />
              </Box>
              <Typography variant="caption" className="text-gray-400" style={{ fontSize: 10 }}>CPU {device.cpuUsage}%</Typography>
            </Box>
            <Box className="flex items-center gap-1 mt-0.5">
              <Box className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <Box className="h-full rounded-full bg-green-500" style={{ width: `${device.memoryUsage}%` }} />
              </Box>
              <Typography variant="caption" className="text-gray-400" style={{ fontSize: 10 }}>MEM {device.memoryUsage}%</Typography>
            </Box>
          </>
        ) : (
          <Typography variant="caption" color="text.secondary">—</Typography>
        )}
      </TableCell>
      <TableCell>
        <Button
          size="small" variant="text"
          onClick={e => onAction(device, e.currentTarget)}
          endIcon={<KeyboardArrowDown />}
          sx={{ fontSize: 12, whiteSpace: 'nowrap', minWidth: 'auto' }}
        >
          操作
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ─── 表格视图 ───
function DeviceTableView({
  devices, selected, onToggleSelect, onSelectAll, onAction, onViewDesktop,
  page, rowsPerPage, onPageChange, onRowsPerPageChange,
}: {
  devices: DeviceMgmtDevice[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onAction: (device: DeviceMgmtDevice, anchor: HTMLElement) => void;
  onViewDesktop: (device: DeviceMgmtDevice) => void;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rpp: number) => void;
}) {
  const paged = devices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const allSelected = paged.length > 0 && paged.every(d => selected.has(d.id));

  return (
    <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f9fafb' }}>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allSelected}
                  indeterminate={!allSelected && paged.some(d => selected.has(d.id))}
                  onChange={onSelectAll}
                  size="small"
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 600, width: 120 }}>桌面</TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 180 }}>设备名称/编号</TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>所属位置</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 70 }}>状态</TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 130 }}>系统 / 资源</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 70 }}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">暂无匹配设备</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paged.map(d => (
                <DeviceTableRow
                  key={d.id} device={d}
                  selected={selected.has(d.id)}
                  onToggleSelect={() => onToggleSelect(d.id)}
                  onAction={onAction}
                  onViewDesktop={onViewDesktop}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={devices.length}
        page={page}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={e => onRowsPerPageChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[10, 15, 25]}
        labelRowsPerPage="每页"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共 ${count}`}
      />
    </Card>
  );
}
// ─── 设备卡片（网格模式） ───
function DeviceCard({
  device, selected, onToggleSelect, onAction, onViewDesktop,
}: {
  device: DeviceMgmtDevice;
  selected: boolean;
  onToggleSelect: () => void;
  onAction: (device: DeviceMgmtDevice, anchor: HTMLElement) => void;
  onViewDesktop: (device: DeviceMgmtDevice) => void;
}) {
  const [hover, setHover] = useState(false);
  const statusColor = device.status === 'online' ? '#16a34a' : device.status === 'offline' ? '#6b7280' : '#dc2626';
  const statusBg = device.status === 'online' ? '#dcfce7' : device.status === 'offline' ? '#f3f4f6' : '#fee2e2';

  return (
    <Card
      elevation={0}
      sx={{
        border: selected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
        borderRadius: 3,
      }}
    >
      <Box className="relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <ScreenThumbnail device={device} size="lg" onClick={() => onViewDesktop(device)} />
        <Checkbox
          checked={selected}
          onChange={onToggleSelect}
          size="small"
          sx={{ position: 'absolute', top: 2, left: 2, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 1 }}
        />
        {hover && device.status === 'online' && (
          <Box className="absolute inset-0 bg-black/30 flex items-center justify-center gap-2 rounded-lg">
            <Tooltip title="锁屏">
              <IconButton size="small" sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.4)' }}
                onClick={e => { e.stopPropagation(); }}>
                <Lock />
              </IconButton>
            </Tooltip>
            <Tooltip title="远程桌面">
              <IconButton size="small" sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.4)' }}
                onClick={() => onViewDesktop(device)}>
                <Computer />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
      <CardContent sx={{ px: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="body2" className="font-medium truncate">{device.name}</Typography>
        <Box className="flex items-center gap-2 mt-1">
          <Chip
            label={device.status === 'online' ? '在线' : device.status === 'offline' ? '离线' : '异常'}
            size="small"
            sx={{ backgroundColor: statusBg, color: statusColor, fontWeight: 600, height: 20, fontSize: 10 }}
          />
          <Typography variant="caption" color="text.secondary">{device.os}</Typography>
        </Box>
        {device.status === 'online' && (
          <Box className="mt-1.5">
            <Box className="flex items-center gap-1">
              <Box className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <Box className="h-full rounded-full bg-blue-500" style={{ width: `${device.cpuUsage}%` }} />
              </Box>
              <Typography variant="caption" className="text-gray-400" style={{ fontSize: 9 }}>CPU</Typography>
            </Box>
          </Box>
        )}
        <Button
          size="small" variant="text" fullWidth
          onClick={e => onAction(device, e.currentTarget)}
          endIcon={<KeyboardArrowDown />}
          sx={{ mt: 0.5, fontSize: 11 }}
        >
          操作
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── 卡片网格视图 ───
function DeviceGridView({
  devices, selected, onToggleSelect, onAction, onViewDesktop,
  page, rowsPerPage, onPageChange, onRowsPerPageChange,
}: {
  devices: DeviceMgmtDevice[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onAction: (device: DeviceMgmtDevice, anchor: HTMLElement) => void;
  onViewDesktop: (device: DeviceMgmtDevice) => void;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rpp: number) => void;
}) {
  const paged = devices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paged.length === 0 ? (
          <Box className="col-span-full text-center py-16">
            <Devices className="text-5xl text-gray-300 mb-3" />
            <Typography variant="h6" color="text.secondary">暂无匹配设备</Typography>
          </Box>
        ) : (
          paged.map(d => (
            <DeviceCard
              key={d.id} device={d}
              selected={selected.has(d.id)}
              onToggleSelect={() => onToggleSelect(d.id)}
              onAction={onAction}
              onViewDesktop={onViewDesktop}
            />
          ))
        )}
      </Box>
      <Box className="flex justify-center mt-4">
        <TablePagination
          component="div"
          count={devices.length}
          page={page}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => onRowsPerPageChange(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[10, 15, 25]}
          labelRowsPerPage="每页"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共 ${count}`}
        />
      </Box>
    </>
  );
}

// ─── 单设备操作菜单（全分类二级菜单） ───
function ActionMenu({
  anchorEl, device, onClose, onCommand,
}: {
  anchorEl: HTMLElement | null;
  device: DeviceMgmtDevice | null;
  onClose: () => void;
  onCommand: (commandId: string) => void;
}) {
  const [subMenu, setSubMenu] = useState<string | null>(null);
  const [subPos, setSubPos] = useState<{ top: number; left: number } | null>(null);
  const subTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => { if (subTimer.current) clearTimeout(subTimer.current); };
  }, []);

  const handleCommand = useCallback((cmdId: string) => {
    onClose();
    onCommand(cmdId);
  }, [onClose, onCommand]);

  const handleCategoryEnter = useCallback((e: React.MouseEvent<HTMLElement>, catKey: string) => {
    if (subTimer.current) clearTimeout(subTimer.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setSubPos({ top: rect.top, left: rect.right + 4 });
    setSubMenu(catKey);
  }, []);

  const handleCategoryLeave = useCallback(() => {
    subTimer.current = setTimeout(() => {
      setSubMenu(null);
      setSubPos(null);
    }, 200);
  }, []);

  const handleSubEnter = useCallback(() => {
    if (subTimer.current) clearTimeout(subTimer.current);
  }, []);

  const getCategoryCommands = (category: RemoteCommandCategory) =>
    Object.values(COMMANDS).filter(c => c.category === category);

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl) && Boolean(device)}
      onClose={onClose}
    >
      <Typography variant="caption" color="text.secondary" sx={{ px: 2, pt: 1, pb: 0.5, display: 'block', fontWeight: 600, fontSize: 11 }}>
        {device?.name}
      </Typography>
      {device && COMMAND_CATEGORIES.map(cat => {
        const cmds = getCategoryCommands(cat.key);
        if (cmds.length === 0) return null;
        return (
          <Box key={cat.key}
            onMouseEnter={(e) => handleCategoryEnter(e, cat.key)}
            onMouseLeave={handleCategoryLeave}
          >
            <MenuItem sx={{ pl: 2, py: 0.6, display: 'flex', justifyContent: 'space-between' }}>
              <Box className="flex items-center gap-2">
                <CategoryIcon category={cat.key} />
                <Typography variant="body2">{cat.label}</Typography>
              </Box>
              <ChevronRight fontSize="small" />
            </MenuItem>
            {subMenu === cat.key && subPos && (
              <Menu
                open
                anchorReference="anchorPosition"
                anchorPosition={subPos}
                onClose={() => { setSubMenu(null); setSubPos(null); }}
                slotProps={{
                  paper: {
                    onMouseEnter: handleSubEnter,
                    onMouseLeave: handleCategoryLeave,
                  } as any,
                }}
              >
                {cmds.map(cmd => (
                  <MenuItem key={cmd.id} onClick={() => handleCommand(cmd.id)} sx={{ py: 0.6 }}>
                    <Typography variant="body2">{cmd.label}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            )}
          </Box>
        );
      })}
    </Menu>
  );
}

function CategoryIcon({ category }: { category: RemoteCommandCategory }) {
  const icon =
    category === 'system' ? '⚡' :
    category === 'screen' ? '🔒' :
    category === 'audio' ? '🔊' :
    category === 'file' ? '📁' :
    category === 'app' ? '📱' :
    category === 'message' ? '💬' :
    '🛠️';
  return <Typography variant="body2" sx={{ lineHeight: 1 }}>{icon}</Typography>;
}

// ─── 批量操作栏 ───
function BatchActionBar({
  selectedCount, onClear, onCommand, onOpenMore,
}: {
  selectedCount: number;
  onClear: () => void;
  onCommand: (commandId: string) => void;
  onOpenMore?: () => void;
}) {
  if (selectedCount === 0) return null;

  const quickCommands: { id: string; label: string }[] = [
    { id: 'powerOff', label: '关机' },
    { id: 'reboot', label: '重启' },
    { id: 'lockScreen', label: '锁屏' },
    { id: 'ringBell', label: '打铃' },
    { id: 'sendMsg', label: '消息' },
  ];

  return (
    <Box className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 flex-wrap">
      <Typography variant="body2" className="font-medium text-blue-700 mr-2">
        已选中 {selectedCount} 台设备
      </Typography>
      {quickCommands.map(cmd => (
        <Button key={cmd.id} size="small" variant="outlined"
          onClick={() => onCommand(cmd.id)}
          sx={{ fontSize: 11, whiteSpace: 'nowrap' }}
        >
          {cmd.label}
        </Button>
      ))}
      <Button size="small" variant="outlined"
        onClick={() => onCommand('fileDist')}
        sx={{ fontSize: 11, whiteSpace: 'nowrap' }}
        endIcon={<KeyboardArrowDown />}
      >
        文件分发
      </Button>
      <Button size="small" variant="outlined"
        onClick={onOpenMore}
        sx={{ fontSize: 11, whiteSpace: 'nowrap' }}
      >
        更多指令 ▸
      </Button>
      <Button size="small" variant="text"
        onClick={onClear}
        sx={{ fontSize: 11, ml: 'auto', color: '#6b7280' }}
      >
        取消选择
      </Button>
    </Box>
  );
}

// ─── 指令执行结果弹窗 ───
function CommandResultDialog({
  open, results, onClose,
}: {
  open: boolean;
  results: CommandResult[];
  onClose: () => void;
}) {
  const successCount = results.filter(r => r.status === 'success').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const pendingCount = results.filter(r => r.status === 'pending').length;
  const commandLabel = results[0]?.commandLabel || '';
  const isComplete = pendingCount === 0;

  return (
    <Dialog open={open} onClose={isComplete ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box className="flex items-center gap-2">
          <Send className="text-blue-600" />
          <Typography variant="h6">指令执行结果</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" className="mb-3 font-medium">正在执行：{commandLabel}</Typography>
        <Box className="space-y-2">
          {results.map(r => (
            <Box key={r.deviceId} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              {r.status === 'pending' ? (
                <CircularProgress size={16} />
              ) : r.status === 'success' ? (
                <CheckCircle sx={{ fontSize: 18, color: '#22c55e' }} />
              ) : (
                <Cancel sx={{ fontSize: 18, color: '#ef4444' }} />
              )}
              <Typography variant="body2" className="flex-1">{r.deviceName}</Typography>
              <Typography variant="caption" color={r.status === 'fail' ? 'error' : 'text.secondary'}>
                {r.status === 'pending' ? '等待中...' : r.message}
              </Typography>
            </Box>
          ))}
        </Box>
        <Box className="mt-3 p-2 bg-gray-100 rounded-lg text-center">
          <Typography variant="caption" color="text.secondary">
            成功 {successCount} / 失败 {failCount}{pendingCount > 0 ? ` / 等待中 ${pendingCount}` : ''}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" disabled={!isComplete}>我知道了</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── 视频流类型 ───
type StreamType = 'teacher' | 'student' | 'blackboard';

interface StreamOption {
  key: StreamType;
  label: string;
  icon: string;
}

const STREAM_OPTIONS: StreamOption[] = [
  { key: 'teacher', label: '老师', icon: '👨‍🏫' },
  { key: 'student', label: '学生', icon: '👩‍🎓' },
  { key: 'blackboard', label: '板书', icon: '📝' },
];

function StreamPreview({ streamType, device }: { streamType: StreamType; device: DeviceMgmtDevice }) {
  const previews: Record<StreamType, { gradient: string; icons: string[]; label: string }> = {
    teacher: {
      gradient: 'bg-gradient-to-br from-blue-500 to-indigo-700',
      icons: ['👨‍🏫', '📖', '🎯', '💡'],
      label: '老师画面',
    },
    student: {
      gradient: 'bg-gradient-to-br from-green-400 to-emerald-600',
      icons: ['👩‍🎓', '📝', '✋', '📚'],
      label: '学生画面',
    },
    blackboard: {
      gradient: 'bg-gradient-to-br from-slate-600 to-slate-900',
      icons: ['📝', '📐', '📏', '🔢'],
      label: '板书画面',
    },
  };

  const p = previews[streamType];

  return (
    <Box className={`rounded-xl overflow-hidden ${p.gradient} h-80 flex flex-col items-center justify-center relative`}>
      <Box className="grid grid-cols-2 gap-6 p-8 opacity-60">
        {p.icons.map((icon, i) => (
          <Box key={i} className="flex items-center justify-center" style={{ fontSize: 48 }}>{icon}</Box>
        ))}
      </Box>
      <Typography variant="caption" className="absolute bottom-3 text-white/60">
        {p.label} · {device.name}
      </Typography>
    </Box>
  );
}

// ─── 远程桌面对话框 ───
function RemoteDesktopDialog({
  device, open, onClose, onOpenSendMessage,
}: {
  device: DeviceMgmtDevice | null;
  open: boolean;
  onClose: () => void;
  onOpenSendMessage?: (device: DeviceMgmtDevice) => void;
}) {
  const [streamType, setStreamType] = useState<StreamType>('teacher');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!autoRefresh || !open) return;
    const timer = setInterval(() => setLastRefresh(new Date()), 5000);
    return () => clearInterval(timer);
  }, [autoRefresh, open]);

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-9), msg]);

  const handleCommand = (cmdId: string) => {
    if (!device) return;
    const cmd = COMMANDS[cmdId];
    addLog(`${new Date().toLocaleTimeString()} 已发送${cmd.label}指令`);
    setTimeout(() => addLog(`${new Date().toLocaleTimeString()} ${cmd.label}指令已执行完成`), 1500);
  };

  if (!device) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb' }}>
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <ArrowBack onClick={onClose} sx={{ cursor: 'pointer', fontSize: 20 }} />
            <Computer className="text-blue-600" />
            <Typography variant="h6">{device.name} — 远程桌面</Typography>
          </Box>
          <Box className="flex items-center gap-2">
            <Button size="small" variant="outlined" onClick={() => setLastRefresh(new Date())} startIcon={<Refresh />}>刷新</Button>
            <IconButton size="small" onClick={onClose}><Close /></IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Box className="flex gap-4">
          <Box className="flex-1">
            {/* 视频流切换 */}
            <Box className="flex items-center gap-1 mb-3 p-1 bg-gray-100 rounded-lg w-fit">
              {STREAM_OPTIONS.map(opt => (
                <Button
                  key={opt.key}
                  size="small"
                  variant={streamType === opt.key ? 'contained' : 'text'}
                  onClick={() => {
                    setStreamType(opt.key);
                    addLog(`${new Date().toLocaleTimeString()} 切换到${opt.label}画面`);
                  }}
                  sx={{
                    fontSize: 12,
                    px: 2,
                    minWidth: 'auto',
                    borderRadius: '6px',
                    ...(streamType === opt.key
                      ? {}
                      : { color: 'text.secondary' }),
                  }}
                  startIcon={<Typography variant="body2" sx={{ lineHeight: 1 }}>{opt.icon}</Typography>}
                >
                  {opt.label}
                </Button>
              ))}
            </Box>

            {/* 视频流画面 */}
            <StreamPreview streamType={streamType} device={device} />

            <Box className="flex items-center justify-between mt-2">
              <Typography variant="caption" color="text.secondary">
                最后刷新: {lastRefresh.toLocaleString('zh-CN', { hour12: false })}
              </Typography>
              <FormControlLabel
                control={<Switch size="small" checked={autoRefresh} onChange={(_, v) => setAutoRefresh(v)} />}
                label={<Typography variant="caption">自动刷新</Typography>}
              />
            </Box>
          </Box>
          <Box sx={{ width: 220 }} className="shrink-0">
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
              <Typography variant="subtitle2" className="font-bold mb-2">设备信息</Typography>
              <Box className="space-y-1.5">
                <InfoRow label="名称" value={device.name} />
                <InfoRow label="编号" value={device.code} />
                <InfoRow label="IP" value={device.ip} />
                <InfoRow label="位置" value={device.room} />
                <InfoRow label="状态" value={device.status === 'online' ? '在线' : device.status === 'offline' ? '离线' : '异常'} />
                <InfoRow label="系统" value={device.os} />
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" className="font-bold mb-2">快捷指令</Typography>
              <Box className="grid grid-cols-2 gap-2">
                {[
                  { cmd: 'lockScreen', label: '锁屏', icon: Lock },
                  { cmd: 'powerOff', label: '关机', icon: PowerOff },
                  { cmd: 'reboot', label: '重启', icon: RestartAlt },
                  { cmd: 'ringBell', label: '打铃', icon: Notifications },
                  { cmd: 'sendMsg', label: '消息', icon: Message },
                ].map(({ cmd, label, icon: Icon }) => (
                  <Button key={cmd} size="small" variant="outlined"
                    onClick={() => {
                      if (cmd === 'sendMsg' && onOpenSendMessage && device) {
                        onOpenSendMessage(device);
                      } else {
                        handleCommand(cmd);
                      }
                    }}
                    startIcon={<Icon />}
                    sx={{ fontSize: 10, justifyContent: 'flex-start' }}
                  >
                    {label}
                  </Button>
                ))}
              </Box>
            </Paper>
          </Box>
        </Box>
        {logs.length > 0 && (
          <Box className="mt-4 p-2 bg-gray-50 rounded-lg">
            <Typography variant="caption" className="font-medium">操作记录</Typography>
            {logs.map((log, i) => (
              <Typography key={i} variant="caption" color="text.secondary" display="block">{log}</Typography>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── 关机参数弹窗 ───
interface PowerOffParams {
  forceShutdown: boolean;
  scheduleType: 'once' | 'weekly';
  weeklyDays: number[];   // 1=周一 ... 7=周日
  shutdownTime: string;   // HH:mm 格式
}

const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function PowerOffDialog({
  open, deviceCount, onClose, onConfirm,
}: {
  open: boolean;
  deviceCount: number;
  onClose: () => void;
  onConfirm: (params: PowerOffParams) => void;
}) {
  const [forceShutdown, setForceShutdown] = useState(false);
  const [scheduleType, setScheduleType] = useState<'once' | 'weekly'>('once');
  const [weeklyDays, setWeeklyDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [shutdownTime, setShutdownTime] = useState('22:00');

  const toggleDay = (day: number) => {
    setWeeklyDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handleConfirm = () => {
    onConfirm({ forceShutdown, scheduleType, weeklyDays, shutdownTime });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb' }}>
        <Box className="flex items-center gap-2">
          <PowerOff sx={{ color: '#ef4444' }} />
          <Typography variant="h6">关机参数设置</Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: '20px !important' }}>
        <Typography variant="body2" color="text.secondary" className="mb-4">
          目标设备：<strong>{deviceCount}</strong> 台
        </Typography>

        {/* 强制关机 */}
        <Box className="mb-5">
          <Box className="flex items-center justify-between">
            <Box>
              <Typography variant="body2" className="font-medium">强制关机</Typography>
              <Typography variant="caption" color="text.secondary">强制关闭正在运行的应用，不保存未完成的工作</Typography>
            </Box>
            <Switch checked={forceShutdown} onChange={(_, v) => setForceShutdown(v)} />
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* 执行方式 */}
        <Typography variant="body2" className="font-medium mb-3">执行方式</Typography>
        <RadioGroup value={scheduleType} onChange={(e) => setScheduleType(e.target.value as 'once' | 'weekly')}>
          <Box className="mb-3">
            <FormControlLabel value="once" control={<Radio />} label={
              <Box>
                <Typography variant="body2" className="font-medium">单次执行</Typography>
                <Typography variant="caption" color="text.secondary">立即向目标设备发送关机指令</Typography>
              </Box>
            } />
          </Box>
          <Box>
            <FormControlLabel value="weekly" control={<Radio />} label={
              <Box>
                <Typography variant="body2" className="font-medium">每周定时执行</Typography>
                <Typography variant="caption" color="text.secondary">按设定的星期和时间循环执行关机指令</Typography>
              </Box>
            } />
            {scheduleType === 'weekly' && (
              <Box className="ml-8 mt-3 space-y-3">
                {/* 星期选择 */}
                <Box>
                  <Typography variant="caption" className="font-medium mb-1.5 block" color="text.secondary">选择星期</Typography>
                  <Box className="flex gap-1.5">
                    {WEEKDAY_LABELS.map((label, idx) => {
                      const day = idx + 1;
                      const selected = weeklyDays.includes(day);
                      return (
                        <Chip
                          key={day}
                          label={label}
                          size="small"
                          variant={selected ? 'filled' : 'outlined'}
                          color={selected ? 'primary' : 'default'}
                          onClick={() => toggleDay(day)}
                          sx={{ flex: 1, cursor: 'pointer', fontWeight: 600 }}
                        />
                      );
                    })}
                  </Box>
                </Box>
                {/* 时间选择 */}
                <Box className="flex items-center gap-2">
                  <Typography variant="caption" color="text.secondary">关机时间</Typography>
                  <TextField
                    size="small"
                    type="time"
                    value={shutdownTime}
                    onChange={(e) => setShutdownTime(e.target.value)}
                    sx={{ width: 140 }}
                    slotProps={{ htmlInput: { style: { fontSize: 14, textAlign: 'center' } } }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </RadioGroup>
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid #e5e7eb', px: 3, py: 1.5 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">取消</Button>
        <Button onClick={handleConfirm} variant="contained" color="error" startIcon={<PowerOff />}>
          确认关机
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── 重启参数弹窗 ───
interface RebootParams {
  forceReboot: boolean;
}

function RebootDialog({
  open, deviceCount, onClose, onConfirm,
}: {
  open: boolean;
  deviceCount: number;
  onClose: () => void;
  onConfirm: (params: RebootParams) => void;
}) {
  const [forceReboot, setForceReboot] = useState(false);

  const handleConfirm = () => {
    onConfirm({ forceReboot });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb' }}>
        <Box className="flex items-center gap-2">
          <RestartAlt sx={{ color: '#f59e0b' }} />
          <Typography variant="h6">重启参数设置</Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: '20px !important' }}>
        <Typography variant="body2" color="text.secondary" className="mb-4">
          目标设备：<strong>{deviceCount}</strong> 台
        </Typography>

        {/* 强制重启 */}
        <Box className="mb-2">
          <Box className="flex items-center justify-between">
            <Box>
              <Typography variant="body2" className="font-medium">强制重启</Typography>
              <Typography variant="caption" color="text.secondary">强制关闭正在运行的应用后重启系统，不保存未完成的工作</Typography>
            </Box>
            <Switch checked={forceReboot} onChange={(_, v) => setForceReboot(v)} />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid #e5e7eb', px: 3, py: 1.5 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">取消</Button>
        <Button onClick={handleConfirm} variant="contained" startIcon={<RestartAlt />}
          sx={{ backgroundColor: '#f59e0b', '&:hover': { backgroundColor: '#d97706' } }}>
          确认重启
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── 打铃参数弹窗 ───
const RINGTONE_OPTIONS = [
  { id: 'bell-classic', label: '经典铃声', desc: '传统上下课铃声' },
  { id: 'bell-gentle', label: '轻柔提示音', desc: '柔和舒缓的提示音' },
  { id: 'bell-urgent', label: '紧急集合音', desc: '短促有力的紧急铃声' },
  { id: 'bell-alarm', label: '警报音', desc: '持续警报声' },
  { id: 'bell-custom', label: '自定义铃声', desc: '上传或选择自定义音频文件' },
];

interface RingBellParams {
  ringtoneId: string;
  durationSeconds: number;
}

function RingBellDialog({
  open, deviceCount, onClose, onConfirm,
}: {
  open: boolean;
  deviceCount: number;
  onClose: () => void;
  onConfirm: (params: RingBellParams) => void;
}) {
  const [ringtoneId, setRingtoneId] = useState('bell-classic');
  const [durationSeconds, setDurationSeconds] = useState(10);
  const [customFile, setCustomFile] = useState<{ name: string; size: number } | null>(null);

  const handleConfirm = () => {
    onConfirm({ ringtoneId, durationSeconds });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb' }}>
        <Box className="flex items-center gap-2">
          <Notifications sx={{ color: '#3b82f6' }} />
          <Typography variant="h6">打铃参数设置</Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: '20px !important' }}>
        <Typography variant="body2" color="text.secondary" className="mb-4">
          目标设备：<strong>{deviceCount}</strong> 台
        </Typography>

        {/* 铃音选择 */}
        <Typography variant="body2" className="font-medium mb-2">选择铃音</Typography>
        <FormControl fullWidth size="small" className="mb-5">
          <Select
            value={ringtoneId}
            onChange={(e) => setRingtoneId(e.target.value)}
            renderValue={(val) => {
              const opt = RINGTONE_OPTIONS.find(r => r.id === val);
              return opt ? `${opt.label} — ${opt.desc}` : '';
            }}
          >
            {RINGTONE_OPTIONS.map(opt => (
              <MenuItem key={opt.id} value={opt.id}>
                <Box>
                  <Typography variant="body2" className="font-medium">{opt.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{opt.desc}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {ringtoneId === 'bell-custom' && (
          <Box className="mb-5">
            <Box
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('audio/')) {
                  setCustomFile({ name: file.name, size: file.size });
                }
              }}
              onClick={() => document.getElementById('ringtone-upload-input')?.click()}
              sx={{
                border: '2px dashed',
                borderColor: customFile ? '#3b82f6' : '#d1d5db',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: customFile ? '#eff6ff' : 'transparent',
                transition: 'all 0.15s',
                '&:hover': { borderColor: '#93c5fd', backgroundColor: '#f8fafc' },
              }}
            >
              {customFile ? (
                <Box>
                  <Typography variant="body2" className="font-medium text-blue-600">{customFile.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(customFile.size / 1024 / 1024).toFixed(1)} MB · 点击或拖拽更换文件
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: 28, mb: 0.5 }}>🎵</Typography>
                  <Typography variant="body2" color="text.secondary">点击选择或拖拽音频文件到此处</Typography>
                  <Typography variant="caption" color="text.secondary">支持 MP3 / WAV / AAC 格式</Typography>
                </Box>
              )}
            </Box>
            <input id="ringtone-upload-input" type="file" accept="audio/*" hidden
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) setCustomFile({ name: file.name, size: file.size });
              }}
            />
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* 响铃时长 */}
        <Typography variant="body2" className="font-medium mb-2">响铃时长</Typography>
        <Box className="flex items-center gap-2">
          <Button
            size="small"
            variant="outlined"
            sx={{ minWidth: 32, height: 32, p: 0, fontSize: 16, fontWeight: 700 }}
            onClick={() => setDurationSeconds(Math.max(1, durationSeconds - 5))}
            disabled={durationSeconds <= 1}
          >
            -
          </Button>
          <TextField
            size="small"
            type="number"
            value={durationSeconds}
            onChange={(e) => setDurationSeconds(Math.max(1, Math.min(300, parseInt(e.target.value) || 1)))}
            sx={{ width: 80 }}
            slotProps={{ htmlInput: { min: 1, max: 300, style: { textAlign: 'center' } } }}
          />
          <Button
            size="small"
            variant="outlined"
            sx={{ minWidth: 32, height: 32, p: 0, fontSize: 16, fontWeight: 700 }}
            onClick={() => setDurationSeconds(Math.min(300, durationSeconds + 5))}
            disabled={durationSeconds >= 300}
          >
            +
          </Button>
          <Typography variant="body2" color="text.secondary">秒</Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid #e5e7eb', px: 3, py: 1.5 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">取消</Button>
        <Button onClick={handleConfirm} variant="contained" startIcon={<Notifications />}>
          确认打铃
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── 音量控制弹窗 ───
interface VolumeControlParams {
  mode: 'increase' | 'decrease';
  volume: number;
}

function VolumeControlDialog({
  open, deviceCount, onClose, onConfirm,
}: {
  open: boolean;
  deviceCount: number;
  onClose: () => void;
  onConfirm: (params: VolumeControlParams) => void;
}) {
  const [mode, setMode] = useState<'increase' | 'decrease'>('increase');
  const [volume, setVolume] = useState(50);

  const handleConfirm = () => {
    onConfirm({ mode, volume });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb' }}>
        <Box className="flex items-center gap-2">
          <VolumeUp sx={{ color: '#3b82f6' }} />
          <Typography variant="h6">音量控制设置</Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: '20px !important' }}>
        <Typography variant="body2" color="text.secondary" className="mb-4">
          目标设备：<strong>{deviceCount}</strong> 台
        </Typography>

        {/* 音量调整模式 */}
        <Typography variant="body2" className="font-medium mb-2">调整模式</Typography>
        <RadioGroup row value={mode} onChange={(e) => setMode(e.target.value as 'increase' | 'decrease')} className="mb-5">
          <FormControlLabel value="increase" control={<Radio />} label={
            <Box className="flex items-center gap-1">
              <VolumeUp sx={{ fontSize: 18, color: '#22c55e' }} />
              <Typography variant="body2">增加</Typography>
            </Box>
          } sx={{ mr: 3 }} />
          <FormControlLabel value="decrease" control={<Radio />} label={
            <Box className="flex items-center gap-1">
              <VolumeUp sx={{ fontSize: 18, color: '#ef4444', transform: 'scaleX(-1)' }} />
              <Typography variant="body2">减小</Typography>
            </Box>
          } />
        </RadioGroup>

        <Divider sx={{ mb: 3 }} />

        {/* 音量大小 */}
        <Typography variant="body2" className="font-medium mb-2">音量大小：{volume}%</Typography>
        <Box className="flex items-center gap-3">
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 20, textAlign: 'right' }}>0</Typography>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            style={{ flex: 1, accentColor: mode === 'increase' ? '#22c55e' : '#ef4444' }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 20 }}>100</Typography>
        </Box>
        <Box className="flex items-center justify-center gap-2 mt-1">
          <TextField
            size="small"
            type="number"
            value={volume}
            onChange={(e) => setVolume(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
            sx={{ width: 80 }}
            slotProps={{ htmlInput: { min: 0, max: 100, style: { textAlign: 'center' } } }}
          />
          <Typography variant="body2" color="text.secondary">%</Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid #e5e7eb', px: 3, py: 1.5 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">取消</Button>
        <Button onClick={handleConfirm} variant="contained" startIcon={<VolumeUp />}>
          确认{ mode === 'increase' ? '增加' : '减小' }
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── 信息行（远程桌面侧边栏用） ───
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box className="flex justify-between">
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="caption" className="font-medium">{value}</Typography>
    </Box>
  );
}

// ─── 文件分发弹窗 ───
function FileDistributeDialog({
  open, devices, onClose,
}: {
  open: boolean;
  devices: DeviceMgmtDevice[];
  onClose: () => void;
}) {
  const [files, setFiles] = useState<(FileItem & { uploadProgress: number })[]>([]);
  const [targetPath, setTargetPath] = useState('C:\\Users\\Public\\Documents\\教学资源\\');
  const [overwrite, setOverwrite] = useState(false);
  const [sending, setSending] = useState(false);

  const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // 清理上传定时器
  useEffect(() => {
    if (!open) {
      intervalsRef.current.forEach(interval => clearInterval(interval));
      intervalsRef.current.clear();
      setFiles([]);
      setSending(false);
    }
  }, [open]);

  // 开始自动上传文件
  const startUpload = (newFiles: FileItem[]) => {
    const entries = newFiles.map(f => ({ ...f, uploadProgress: 0 }));
    setFiles(prev => {
      const merged = [...prev, ...entries];
      // 为新文件启动上传进度模拟
      entries.forEach(file => {
        const interval = setInterval(() => {
          setFiles(prevFiles =>
            prevFiles.map(pf =>
              pf.name === file.name && pf.uploadProgress < 100
                ? { ...pf, uploadProgress: Math.min(100, pf.uploadProgress + Math.floor(Math.random() * 8) + 2) }
                : pf
            )
          );
          // 检查是否完成
          setFiles(prevFiles => {
            const f = prevFiles.find(pf => pf.name === file.name);
            if (f && f.uploadProgress >= 100) {
              clearInterval(interval);
              intervalsRef.current.delete(file.name);
            }
            return prevFiles;
          });
        }, 200 + Math.floor(Math.random() * 200));
        intervalsRef.current.set(file.name, interval);
      });
      return merged;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: FileItem[] = Array.from(e.target.files).map(f => ({ name: f.name, size: f.size }));
      startUpload(newFiles);
    }
  };

  const removeFile = (name: string) => {
    const interval = intervalsRef.current.get(name);
    if (interval) { clearInterval(interval); intervalsRef.current.delete(name); }
    setFiles(prev => prev.filter(f => f.name !== name));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const newFiles: FileItem[] = Array.from(e.dataTransfer.files).map(f => ({ name: f.name, size: f.size }));
      startUpload(newFiles);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const allUploaded = files.length > 0 && files.every(f => f.uploadProgress >= 100);

  const handleSendCommand = () => {
    setSending(true);
    // 模拟指令下发，短暂延迟后关闭
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <Dialog open={open} onClose={sending ? undefined : onClose} maxWidth="sm" fullWidth>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      <DialogTitle>
        <Box className="flex items-center gap-2">
          <FileUpload className="text-blue-600" />
          <Typography variant="h6">文件分发</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {sending ? (
          /* 指令下发成功提示 */
          <Box className="py-8 text-center">
            <Box sx={{ fontSize: 48, mb: 2 }}>✅</Box>
            <Typography variant="h6" className="font-bold text-green-600 mb-1">指令已下发</Typography>
            <Typography variant="body2" color="text.secondary">
              文件分发指令已成功发送至 {devices.length} 台设备
            </Typography>
          </Box>
        ) : (
        <>
        <Typography variant="body2" color="text.secondary" className="mb-3">
          目标设备：{devices.map(d => d.name).join(' / ')}（共 {devices.length} 台）
        </Typography>

        <Box
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed rounded-xl p-4 text-center mb-3 cursor-pointer hover:border-blue-400"
          onClick={() => document.getElementById('file-dist-input')?.click()}
        >
          <CloudUpload className="text-gray-400" style={{ fontSize: 32 }} />
          <Typography variant="body2" color="text.secondary">点击选择文件或拖拽到此处</Typography>
          <input id="file-dist-input" type="file" multiple hidden onChange={handleFileSelect} />
        </Box>

        {/* 文件列表 + 上传进度条 */}
        {files.length > 0 && (
          <Box className="mb-3 space-y-2">
            {files.map(f => {
              const isUploaded = f.uploadProgress >= 100;
              return (
                <Box key={f.name}>
                  <Box className="flex items-center justify-between">
                    <Box className="flex items-center gap-2 min-w-0 flex-1">
                      <Box component="span" sx={{ fontSize: 16, flexShrink: 0 }}>📄</Box>
                      <Typography variant="body2" className="truncate">{f.name}</Typography>
                    </Box>
                    <Box className="flex items-center gap-2 shrink-0">
                      {isUploaded ? (
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#16a34a' }}>✅ 已上传</Typography>
                      ) : (
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#3b82f6' }}>{f.uploadProgress}%</Typography>
                      )}
                      <IconButton size="small" onClick={() => removeFile(f.name)}>
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  {/* 上传进度条 */}
                  <Box className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1 relative">
                    <Box
                      className={`h-full rounded-full transition-all duration-300 ${isUploaded ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${f.uploadProgress}%` }}
                    />
                    {!isUploaded && (
                      <Box
                        className="absolute inset-0 h-full rounded-full"
                        sx={{
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                          animation: 'shimmer 1.2s ease-in-out infinite',
                        }}
                      />
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        <TextField size="small" fullWidth label="目标路径" value={targetPath}
          onChange={e => setTargetPath(e.target.value)} sx={{ mb: 3 }} />
        <Box className="flex mb-3">
          <FormControlLabel control={<Checkbox size="small" checked={overwrite} onChange={(_, v) => setOverwrite(v)} />}
            label={<Typography variant="caption">覆盖已有文件</Typography>} />
        </Box>
        </>
        )}
      </DialogContent>
      <DialogActions>
        {sending ? null : (
          <>
            <Button onClick={onClose}>取消</Button>
            <Button
              onClick={handleSendCommand}
              variant="contained"
              disabled={!allUploaded}
            >
              {files.length === 0 ? '请选择文件' : allUploaded ? '开始传输' : `上传中 ${files.filter(f => f.uploadProgress < 100).length} 个...`}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}


// ─── 批量指令选择弹窗 ───
function BatchCommandDialog({
  open, onClose, onCommand, deviceCount,
}: {
  open: boolean;
  onClose: () => void;
  onCommand: (commandId: string) => void;
  deviceCount: number;
}) {
  const [activeCat, setActiveCat] = useState<RemoteCommandCategory>('system');

  const getCategoryCommands = (category: RemoteCommandCategory) =>
    Object.values(COMMANDS).filter(c => c.category === category);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb', pb: 2 }}>
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <Send className="text-blue-600" />
            <Typography variant="h6">批量远程操作</Typography>
          </Box>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Typography variant="body2" color="text.secondary" className="mb-4">
          已选择 <strong>{deviceCount}</strong> 台设备，请选择要执行的指令
        </Typography>

        {/* 分类 Tab */}
        <Tabs
          value={activeCat}
          onChange={(_, v) => setActiveCat(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3, minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5 } }}
        >
          {COMMAND_CATEGORIES.map(cat => (
            <Tab key={cat.key} value={cat.key} label={cat.label} />
          ))}
        </Tabs>

        {/* 当前分类下的指令按钮网格 */}
        <Box className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {getCategoryCommands(activeCat).map(cmd => (
            <Card
              key={cmd.id}
              elevation={0}
              sx={{
                border: '1px solid #e5e7eb',
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.15s',
                '&:hover': { borderColor: '#3b82f6', bgcolor: '#eff6ff' },
              }}
              onClick={() => { onCommand(cmd.id); onClose(); }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, textAlign: 'center' }}>
                <Typography variant="body2" className="font-medium">{cmd.label}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </DialogContent>
      <DialogActions className="px-6 pb-4">
        <Button onClick={onClose} variant="outlined">取消</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── 主组件 ───

function filterDevices(
  devices: DeviceMgmtDevice[],
  searchTerm: string,
  statusFilter: string,
  buildingFilter: string,
  floorFilter: string,
): DeviceMgmtDevice[] {
  return devices.filter(d => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!d.name.toLowerCase().includes(term) && !d.code.toLowerCase().includes(term) && !d.ip.toLowerCase().includes(term)) {
        return false;
      }
    }
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (buildingFilter !== 'all' && d.building !== buildingFilter) return false;
    if (floorFilter !== 'all' && d.floor !== floorFilter) return false;
    return true;
  });
}

export default function DeviceManagement() {
  // ── 数据状态 ──
  const [devices] = useState<DeviceMgmtDevice[]>(generateMockDevices);

  // ── 筛选状态 ──
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // ── 选择状态 ──
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── 分页状态 ──
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // ── 操作菜单状态 ──
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [menuDevice, setMenuDevice] = useState<DeviceMgmtDevice | null>(null);

  // ── 弹窗状态 ──
  const [desktopDevice, setDesktopDevice] = useState<DeviceMgmtDevice | null>(null);
  const [showFileDist, setShowFileDist] = useState(false);
  const [messageTarget, setMessageTarget] = useState<DeviceMgmtDevice | null>(null);
  const [showSendMsg, setShowSendMsg] = useState(false);
  const [showPowerOff, setShowPowerOff] = useState(false);
  const [powerOffTargets, setPowerOffTargets] = useState<DeviceMgmtDevice[]>([]);
  const [showReboot, setShowReboot] = useState(false);
  const [showRingBell, setShowRingBell] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownTargets, setCountdownTargets] = useState<DeviceMgmtDevice[]>([]);
  const [showBatchCmd, setShowBatchCmd] = useState(false);
  const [showCommandResult, setShowCommandResult] = useState(false);
  const [commandResults, setCommandResults] = useState<CommandResult[]>([]);
  const [cmdSnackbar, setCmdSnackbar] = useState<{ open: boolean; message: string; severity?: 'success' | 'info' | 'warning' | 'error' }>({ open: false, message: '' });

  // ── 衍生数据 ──
  const buildings = useMemo(() => [...new Set(devices.map(d => d.building))], [devices]);
  const floors = useMemo(() => [...new Set(devices.map(d => d.floor))], [devices]);
  const filteredDevices = useMemo(
    () => filterDevices(devices, searchTerm, statusFilter, buildingFilter, floorFilter),
    [devices, searchTerm, statusFilter, buildingFilter, floorFilter],
  );
  const selectedDevices = useMemo(
    () => devices.filter(d => selected.has(d.id)),
    [devices, selected],
  );

  // ── 事件处理 ──
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setBuildingFilter('all');
    setFloorFilter('all');
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const paged = filteredDevices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    if (paged.length > 0 && paged.every(d => selected.has(d.id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paged.map(d => d.id)));
    }
  };

  const clearSelection = () => setSelected(new Set());

  const openActionMenu = (device: DeviceMgmtDevice, anchor: HTMLElement) => {
    setMenuDevice(device);
    setMenuAnchorEl(anchor);
  };

  const closeActionMenu = () => {
    setMenuAnchorEl(null);
    setMenuDevice(null);
  };

  const handleCommand = (commandId: string, explicitTargets?: DeviceMgmtDevice[]) => {
    const cmd = COMMANDS[commandId];
    // explicitTargets 来自单设备操作菜单，不受批量选择影响
    const targets = explicitTargets || (selected.size >= 2 ? selectedDevices : (menuDevice ? [menuDevice] : []));
    if (targets.length === 0) return;

    // Special commands that open their own dialogs
    if (commandId === 'sendMsg') {
      const target = targets[0];
      if (target) {
        setMessageTarget(target);
        setShowSendMsg(true);
        setMenuAnchorEl(null);
      }
      return;
    }
    if (commandId === 'fileDist') { setShowFileDist(true); return; }
    if (commandId === 'powerOff') {
      setPowerOffTargets(targets);
      setShowPowerOff(true);
      return;
    }
    if (commandId === 'reboot') {
      setPowerOffTargets(targets);
      setShowReboot(true);
      return;
    }
    if (commandId === 'ringBell') {
      setPowerOffTargets(targets);
      setShowRingBell(true);
      return;
    }
    if (commandId === 'volControl') {
      setPowerOffTargets(targets);
      setShowVolumeControl(true);
      return;
    }
    if (commandId === 'countdown') {
      setCountdownTargets(targets);
      setShowCountdown(true);
      return;
    }

    // Simulate command execution
    const results: CommandResult[] = targets.map(d => ({
      deviceId: d.id,
      deviceName: d.name,
      commandLabel: cmd.label,
      status: 'pending' as const,
    }));
    setCommandResults(results);
    setShowCommandResult(true);
    setCmdSnackbar({ open: true, message: `${cmd.label}指令已下发至 ${targets.length} 台设备`, severity: 'info' });

    let completed = 0;
    targets.forEach((d, i) => {
      const delay = Math.floor(Math.random() * 2500) + 500;
      setTimeout(() => {
        const success = d.status === 'online' ? Math.random() < 0.85 : Math.random() < 0.1;
        setCommandResults(prev => prev.map((r, j) =>
          j === i ? {
            ...r,
            status: success ? 'success' as const : 'fail' as const,
            message: success ? '指令已执行' : d.status !== 'online' ? '设备离线，发送失败' : '执行超时',
          } : r
        ));
        completed++;
      }, delay);
    });
  };

  const handleActionMenuCommand = (commandId: string) => {
    closeActionMenu();
    // 单设备操作：显式传入 menuDevice，不受批量选择影响
    if (menuDevice) {
      handleCommand(commandId, [menuDevice]);
    }
  };

  const handleOpenSendMessage = (device: DeviceMgmtDevice) => {
    setMessageTarget(device);
    setShowSendMsg(true);
  };

  const handleSendMessage = (_payload: SendMessagePayload) => {
    setCmdSnackbar({ open: true, message: '消息指令已下发', severity: 'success' });
  };

  const handlePowerOffConfirm = (params: PowerOffParams) => {
    const targets = powerOffTargets;
    if (targets.length === 0) return;
    const cmd = COMMANDS['powerOff'];

    // 构建参数描述
    const scheduleDesc = params.scheduleType === 'weekly'
      ? `每周${params.weeklyDays.map(d => WEEKDAY_LABELS[d - 1]).join('、')} ${params.shutdownTime}`
      : '单次执行';
    const paramDesc = [
      params.forceShutdown ? '强制关机' : '正常关机',
      scheduleDesc,
    ].join(' · ');

    const results: CommandResult[] = targets.map(d => ({
      deviceId: d.id,
      deviceName: d.name,
      commandLabel: `${cmd.label} (${paramDesc})`,
      status: 'pending' as const,
    }));
    setCommandResults(results);
    setShowCommandResult(true);
    setCmdSnackbar({ open: true, message: `${cmd.label}指令已下发至 ${targets.length} 台设备`, severity: 'info' });

    targets.forEach((d, i) => {
      const delay = Math.floor(Math.random() * 2500) + 500;
      setTimeout(() => {
        const success = d.status === 'online' ? Math.random() < 0.85 : Math.random() < 0.1;
        setCommandResults(prev => prev.map((r, j) =>
          j === i ? {
            ...r,
            status: success ? 'success' as const : 'fail' as const,
            message: success ? '指令已执行' : d.status !== 'online' ? '设备离线，发送失败' : '执行超时',
          } : r
        ));
      }, delay);
    });
  };

  const handleRebootConfirm = (params: RebootParams) => {
    const targets = powerOffTargets;
    if (targets.length === 0) return;
    const cmd = COMMANDS['reboot'];

    const paramDesc = params.forceReboot ? '强制重启' : '正常重启';
    const results: CommandResult[] = targets.map(d => ({
      deviceId: d.id,
      deviceName: d.name,
      commandLabel: `${cmd.label} (${paramDesc})`,
      status: 'pending' as const,
    }));
    setCommandResults(results);
    setShowCommandResult(true);
    setCmdSnackbar({ open: true, message: `${cmd.label}指令已下发至 ${targets.length} 台设备`, severity: 'info' });

    targets.forEach((d, i) => {
      const delay = Math.floor(Math.random() * 2500) + 500;
      setTimeout(() => {
        const success = d.status === 'online' ? Math.random() < 0.85 : Math.random() < 0.1;
        setCommandResults(prev => prev.map((r, j) =>
          j === i ? {
            ...r,
            status: success ? 'success' as const : 'fail' as const,
            message: success ? '指令已执行' : d.status !== 'online' ? '设备离线，发送失败' : '执行超时',
          } : r
        ));
      }, delay);
    });
  };

  const handleRingBellConfirm = (params: RingBellParams) => {
    const targets = powerOffTargets;
    if (targets.length === 0) return;
    const ringtone = RINGTONE_OPTIONS.find(r => r.id === params.ringtoneId);
    const cmd = COMMANDS['ringBell'];

    const paramDesc = `${ringtone?.label || '经典铃声'} · ${params.durationSeconds}秒`;
    const results: CommandResult[] = targets.map(d => ({
      deviceId: d.id,
      deviceName: d.name,
      commandLabel: `${cmd.label} (${paramDesc})`,
      status: 'pending' as const,
    }));
    setCommandResults(results);
    setShowCommandResult(true);
    setCmdSnackbar({ open: true, message: `${cmd.label}指令已下发至 ${targets.length} 台设备`, severity: 'info' });

    targets.forEach((d, i) => {
      const delay = Math.floor(Math.random() * 2500) + 500;
      setTimeout(() => {
        const success = d.status === 'online' ? Math.random() < 0.85 : Math.random() < 0.1;
        setCommandResults(prev => prev.map((r, j) =>
          j === i ? {
            ...r,
            status: success ? 'success' as const : 'fail' as const,
            message: success ? '指令已执行' : d.status !== 'online' ? '设备离线，发送失败' : '执行超时',
          } : r
        ));
      }, delay);
    });
  };

  const handleVolumeControlConfirm = (params: VolumeControlParams) => {
    const targets = powerOffTargets;
    if (targets.length === 0) return;
    const cmd = COMMANDS['volControl'];
    const modeLabel = params.mode === 'increase' ? '增加' : '减小';

    const paramDesc = `${modeLabel} · 音量设为 ${params.volume}%`;
    const results: CommandResult[] = targets.map(d => ({
      deviceId: d.id,
      deviceName: d.name,
      commandLabel: `${cmd.label} (${paramDesc})`,
      status: 'pending' as const,
    }));
    setCommandResults(results);
    setShowCommandResult(true);
    setCmdSnackbar({ open: true, message: `${cmd.label}指令已下发至 ${targets.length} 台设备`, severity: 'info' });

    targets.forEach((d, i) => {
      const delay = Math.floor(Math.random() * 2500) + 500;
      setTimeout(() => {
        const success = d.status === 'online' ? Math.random() < 0.85 : Math.random() < 0.1;
        setCommandResults(prev => prev.map((r, j) =>
          j === i ? {
            ...r,
            status: success ? 'success' as const : 'fail' as const,
            message: success ? '指令已执行' : d.status !== 'online' ? '设备离线，发送失败' : '执行超时',
          } : r
        ));
      }, delay);
    });
  };

  const handleCountdownConfirm = (params: CountdownParams) => {
    const targets = countdownTargets;
    if (targets.length === 0) return;
    const cmd = COMMANDS['countdown'];
    const statusText = params.enabled ? '已开启' : '已关闭';
    const paramDesc = `${statusText} · ${params.eventName} · 目标 ${params.targetDate}`;
    const results: CommandResult[] = targets.map(d => ({
      deviceId: d.id,
      deviceName: d.name,
      commandLabel: `${cmd.label} (${paramDesc})`,
      status: 'pending' as const,
    }));
    setCommandResults(results);
    setShowCommandResult(true);
    setCmdSnackbar({ open: true, message: `${cmd.label}指令已下发至 ${targets.length} 台设备`, severity: 'info' });

    targets.forEach((d, i) => {
      const delay = Math.floor(Math.random() * 2500) + 500;
      setTimeout(() => {
        const success = d.status === 'online' ? Math.random() < 0.85 : Math.random() < 0.1;
        setCommandResults(prev => prev.map((r, j) =>
          j === i ? {
            ...r,
            status: success ? 'success' as const : 'fail' as const,
            message: success ? '倒计日已下发至设备' : d.status !== 'online' ? '设备离线，发送失败' : '执行超时',
          } : r
        ));
      }, delay);
    });
  };

  return (
    <Box className="p-4 sm:p-6">
      {/* 标题 */}
      <Box className="mb-6">
        <Typography variant="h5" className="font-bold">设备管理</Typography>
        <Typography variant="body2" color="text.secondary" className="mt-1">
          管理所有教室终端设备，查看设备状态和远程操作
        </Typography>
      </Box>

      {/* 统计卡片 */}
      <StatCardsRow devices={filteredDevices} />

      {/* 批量操作栏 */}
      <BatchActionBar
        selectedCount={selected.size}
        onClear={clearSelection}
        onCommand={handleCommand}
        onOpenMore={() => setShowBatchCmd(true)}
      />

      {/* 搜索筛选 */}
      <SearchFilterBar
        searchTerm={searchTerm}
        onSearchChange={v => { setSearchTerm(v); setPage(0); }}
        statusFilter={statusFilter}
        onStatusChange={v => { setStatusFilter(v); setPage(0); }}
        buildingFilter={buildingFilter}
        onBuildingChange={v => { setBuildingFilter(v); setPage(0); }}
        floorFilter={floorFilter}
        onFloorChange={v => { setFloorFilter(v); setPage(0); }}
        viewMode={viewMode}
        onViewModeChange={v => { setViewMode(v); setPage(0); }}
        buildings={buildings}
        floors={floors}
        onReset={resetFilters}
      />

      {/* 设备列表 */}
      {filteredDevices.length === 0 ? (
        <Box className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Devices className="text-5xl text-gray-300 mb-3" />
          <Typography variant="h6" color="text.secondary">暂无匹配设备</Typography>
          <Typography variant="body2" color="text.secondary" className="mt-1">尝试调整筛选条件</Typography>
        </Box>
      ) : viewMode === 'table' ? (
        <DeviceTableView
          devices={filteredDevices}
          selected={selected}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
          onAction={openActionMenu}
          onViewDesktop={setDesktopDevice}
          onCommand={handleCommand}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
        />
      ) : (
        <DeviceGridView
          devices={filteredDevices}
          selected={selected}
          onToggleSelect={toggleSelect}
          onAction={openActionMenu}
          onViewDesktop={setDesktopDevice}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
        />
      )}

      {/* 单设备操作菜单 */}
      <ActionMenu
        anchorEl={menuAnchorEl}
        device={menuDevice}
        onClose={closeActionMenu}
        onCommand={handleActionMenuCommand}
      />

      {/* 远程桌面对话框 */}
      <RemoteDesktopDialog
        device={desktopDevice}
        open={Boolean(desktopDevice)}
        onClose={() => setDesktopDevice(null)}
        onOpenSendMessage={handleOpenSendMessage}
      />

      {/* 文件分发弹窗 */}
      <FileDistributeDialog
        open={showFileDist}
        devices={selectedDevices}
        onClose={() => setShowFileDist(false)}
      />

      {/* 发送消息弹窗 */}
      <SendMessageDialog
        target={messageTarget ? { id: messageTarget.id, name: messageTarget.name, room: messageTarget.room, deviceCode: messageTarget.code } : null}
        open={showSendMsg}
        onClose={() => { setShowSendMsg(false); setMessageTarget(null); }}
        onSend={handleSendMessage}
      />

      {/* 指令执行结果 */}
      <CommandResultDialog
        open={showCommandResult}
        results={commandResults}
        onClose={() => setShowCommandResult(false)}
      />

      {/* 批量指令选择弹窗 */}
      <BatchCommandDialog
        open={showBatchCmd}
        onClose={() => setShowBatchCmd(false)}
        onCommand={(cmdId) => { handleCommand(cmdId); }}
        deviceCount={selectedDevices.length}
      />

      {/* 关机参数设置弹窗 */}
      <PowerOffDialog
        open={showPowerOff}
        deviceCount={powerOffTargets.length}
        onClose={() => setShowPowerOff(false)}
        onConfirm={handlePowerOffConfirm}
      />

      {/* 重启参数设置弹窗 */}
      <RebootDialog
        open={showReboot}
        deviceCount={powerOffTargets.length}
        onClose={() => setShowReboot(false)}
        onConfirm={handleRebootConfirm}
      />

      {/* 打铃参数设置弹窗 */}
      <RingBellDialog
        open={showRingBell}
        deviceCount={powerOffTargets.length}
        onClose={() => setShowRingBell(false)}
        onConfirm={handleRingBellConfirm}
      />

      {/* 音量控制设置弹窗 */}
      <VolumeControlDialog
        open={showVolumeControl}
        deviceCount={powerOffTargets.length}
        onClose={() => setShowVolumeControl(false)}
        onConfirm={handleVolumeControlConfirm}
      />

      {/* 倒计日设置弹窗 */}
      <CountdownSetting
        open={showCountdown}
        deviceCount={countdownTargets.length}
        onClose={() => setShowCountdown(false)}
        onConfirm={handleCountdownConfirm}
      />

      {/* 指令下发通知 */}
      <Snackbar
        open={cmdSnackbar.open}
        autoHideDuration={2000}
        onClose={() => setCmdSnackbar({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={cmdSnackbar.severity || 'success'} variant="filled" sx={{ width: '100%' }}>
          {cmdSnackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// ─── 倒计日设置弹窗 ───

interface CountdownSettingProps {
  open: boolean;
  deviceCount: number;
  onClose: () => void;
  onConfirm: (params: CountdownParams) => void;
}

function CountdownSetting({ open, deviceCount, onClose, onConfirm }: CountdownSettingProps) {
  const [enabled, setEnabled] = useState(true);
  const [eventName, setEventName] = useState('高考');
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });

  const calcDays = (): number => {
    if (!targetDate) return 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : 0;
  };

  const days = calcDays();

  const handleConfirm = () => {
    onConfirm({ enabled, eventName, targetDate });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb' }}>
        <Box className="flex items-center gap-2">
          <Typography variant="h6">倒计日设置</Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: '20px !important' }}>
        <Typography variant="body2" color="text.secondary" className="mb-4">
          目标设备：<strong>{deviceCount}</strong> 台
        </Typography>

        {/* 开启/关闭开关 */}
        <Box className="flex items-center justify-between mb-5">
          <Box>
            <Typography variant="body2" className="font-medium">启用倒计日</Typography>
            <Typography variant="caption" color="text.secondary">开启后将在设备桌面右上角常驻显示倒计时</Typography>
          </Box>
          <Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        </Box>

        <Divider className="mb-4" />

        {/* 事件名称 */}
        <Typography variant="body2" className="font-medium mb-2">事件名称</Typography>
        <TextField
          fullWidth
          size="small"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="请输入事件名称，如：高考、期末考试等"
          sx={{ mb: 4 }}
        />

        {/* 目标日期 */}
        <Typography variant="body2" className="font-medium mb-2">目标日期</Typography>
        <TextField
          fullWidth
          size="small"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: new Date().toISOString().split('T')[0] }}
          sx={{ mb: 4 }}
        />

        {/* 预览效果 */}
        <Typography variant="body2" className="font-medium mb-2">预览效果</Typography>
        <Box
          sx={{
            borderRadius: 3,
            border: '2px solid',
            borderColor: enabled ? '#3b82f6' : '#e5e7eb',
            p: 3,
            textAlign: 'center',
            backgroundColor: enabled ? '#eff6ff' : '#f9fafb',
            opacity: enabled ? 1 : 0.5,
            transition: 'all 0.2s',
          }}
        >
          <Typography variant="body2" sx={{ color: enabled ? '#2563eb' : '#9ca3af', fontWeight: 500, mb: 1 }}>
            距离 {eventName || '未命名事件'}
          </Typography>
          <Box className="flex items-center justify-center gap-2 mb-1">
            <Typography variant="h4" className="font-bold" sx={{ color: enabled ? '#1e40af' : '#9ca3af', fontFamily: 'monospace', fontSize: 42, lineHeight: 1 }}>
              {days}
            </Typography>
            <Typography variant="body1" sx={{ color: enabled ? '#3b82f6' : '#9ca3af', fontWeight: 600 }}>天</Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, display: 'block' }}>
            目标日期：{targetDate || '未设置'}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions className="px-6 pb-4">
        <Button onClick={onClose} variant="outlined">取消</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!eventName.trim() || !targetDate}>
          下发至设备
        </Button>
      </DialogActions>
    </Dialog>
  );
}
