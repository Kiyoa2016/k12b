import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Button, IconButton,
  TextField, InputAdornment, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination,
  Select, MenuItem, FormControl, FormControlLabel,
  Checkbox, Switch, Tooltip, Menu,
  Paper, CircularProgress,
} from '@mui/material';
import {
  Devices, CheckCircle, Cancel, Warning, PowerOff,
  Search, RestartAlt, Lock, LockOpen, Screenshot, CleaningServices,
  Notifications, VolumeUp, VolumeDown, FileUpload, FileDownload,
  OpenInNew, Close, Message, Computer, Settings, SystemUpdate,
  GridView, TableView, KeyboardArrowDown, ChevronRight,
  Refresh, ArrowBack, CloudUpload, Send,
} from '@mui/icons-material';

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

// ─── 远程指令定义 ───

const COMMANDS: Record<string, RemoteCommand> = {
  powerOn: { id: 'powerOn', label: '开机', category: 'system', icon: 'PowerSettingsNew', supportBatch: true, requireConfirm: false },
  powerOff: { id: 'powerOff', label: '关机', category: 'system', icon: 'PowerOff', supportBatch: true, requireConfirm: true },
  reboot: { id: 'reboot', label: '重启', category: 'system', icon: 'RestartAlt', supportBatch: true, requireConfirm: true },
  lockScreen: { id: 'lockScreen', label: '锁屏', category: 'screen', icon: 'Lock', supportBatch: true, requireConfirm: false },
  unlockScreen: { id: 'unlockScreen', label: '解锁', category: 'screen', icon: 'LockOpen', supportBatch: false, requireConfirm: false },
  screenshot: { id: 'screenshot', label: '截屏', category: 'screen', icon: 'Screenshot', supportBatch: true, requireConfirm: false },
  cleanLock: { id: 'cleanLock', label: '清洁屏锁', category: 'screen', icon: 'CleaningServices', supportBatch: true, requireConfirm: false },
  ringBell: { id: 'ringBell', label: '打铃', category: 'audio', icon: 'Notifications', supportBatch: true, requireConfirm: false },
  volUp: { id: 'volUp', label: '音量增大', category: 'audio', icon: 'VolumeUp', supportBatch: true, requireConfirm: false },
  volDown: { id: 'volDown', label: '音量减小', category: 'audio', icon: 'VolumeDown', supportBatch: true, requireConfirm: false },
  fileDist: { id: 'fileDist', label: '文件分发', category: 'file', icon: 'FileUpload', supportBatch: true, requireConfirm: true },
  fileCollect: { id: 'fileCollect', label: '文件收集', category: 'file', icon: 'FileDownload', supportBatch: true, requireConfirm: true },
  openApp: { id: 'openApp', label: '打开应用', category: 'app', icon: 'OpenInNew', supportBatch: true, requireConfirm: false },
  closeApp: { id: 'closeApp', label: '关闭应用', category: 'app', icon: 'Close', supportBatch: true, requireConfirm: true },
  sendMsg: { id: 'sendMsg', label: '发送消息', category: 'message', icon: 'Message', supportBatch: true, requireConfirm: false },
  remoteDesktop: { id: 'remoteDesktop', label: '远程桌面', category: 'tool', icon: 'Computer', supportBatch: false, requireConfirm: false },
  remoteSettings: { id: 'remoteSettings', label: '远程设置', category: 'tool', icon: 'Settings', supportBatch: true, requireConfirm: false },
  sysUpdate: { id: 'sysUpdate', label: '系统更新', category: 'tool', icon: 'SystemUpdate', supportBatch: true, requireConfirm: true },
};

const COMMAND_CATEGORIES: { key: RemoteCommandCategory; label: string; icon: string }[] = [
  { key: 'system', label: '系统控制', icon: 'PowerSettingsNew' },
  { key: 'screen', label: '屏幕控制', icon: 'Lock' },
  { key: 'audio', label: '音频控制', icon: 'Notifications' },
  { key: 'file', label: '文件操作', icon: 'FileUpload' },
  { key: 'app', label: '应用管理', icon: 'OpenInNew' },
  { key: 'message', label: '消息通知', icon: 'Message' },
  { key: 'tool', label: '系统工具', icon: 'Settings' },
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
            <Box sx={{ color: s.color }}>{s.icon({ sx: { fontSize: 32 } })}</Box>
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
  osFilter: string;
  onOsChange: (v: string) => void;
  durationFilter: string;
  onDurationChange: (v: string) => void;
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
  osFilter, onOsChange,
  durationFilter, onDurationChange,
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
      <FormControl size="small" sx={{ minWidth: 110 }}>
        <Select value={osFilter} onChange={e => onOsChange(e.target.value)} displayEmpty>
          <MenuItem value="all">操作系统</MenuItem>
          <MenuItem value="Windows 10">Windows 10</MenuItem>
          <MenuItem value="Windows 11">Windows 11</MenuItem>
          <MenuItem value="HarmonyOS">HarmonyOS</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 100 }}>
        <Select value={durationFilter} onChange={e => onDurationChange(e.target.value)} displayEmpty>
          <MenuItem value="all">在线时长</MenuItem>
          <MenuItem value="lt1">＜1小时</MenuItem>
          <MenuItem value="1-6">1-6小时</MenuItem>
          <MenuItem value="gt6">＞6小时</MenuItem>
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
            <Tooltip title="截屏">
              <IconButton size="small" sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.4)' }}
                onClick={e => { e.stopPropagation(); onAction(device, e.currentTarget); }}>
                <Screenshot />
              </IconButton>
            </Tooltip>
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

// ─── 单设备操作菜单 ───
function ActionMenu({
  anchorEl, device, onClose, onCommand,
}: {
  anchorEl: HTMLElement | null;
  device: DeviceMgmtDevice | null;
  onClose: () => void;
  onCommand: (commandId: string) => void;
}) {
  const [subMenu, setSubMenu] = useState<string | null>(null);

  const handleCommand = (cmdId: string) => {
    onClose();
    onCommand(cmdId);
  };

  const getCategoryCommands = (category: RemoteCommandCategory) =>
    Object.values(COMMANDS).filter(c => c.category === category);

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl) && Boolean(device)}
      onClose={onClose}
      onMouseLeave={() => setSubMenu(null)}
    >
      <Typography variant="caption" color="text.secondary" sx={{ px: 2, pt: 1, pb: 0.5, display: 'block', fontWeight: 600, fontSize: 11 }}>
        {device?.name}
      </Typography>
      {device && COMMAND_CATEGORIES.map(cat => {
        const cmds = getCategoryCommands(cat.key);
        if (cmds.length === 0) return null;
        if (cmds.length <= 3 || cat.key === 'file') {
          return cmds.map(cmd => (
            <MenuItem key={cmd.id} onClick={() => handleCommand(cmd.id)} sx={{ pl: 2, py: 0.6 }}>
              <Typography variant="body2">{cmd.label}</Typography>
            </MenuItem>
          ));
        }
        return (
          <Box key={cat.key}
            onMouseEnter={() => setSubMenu(cat.key)}
            onMouseLeave={() => setSubMenu(null)}
          >
            <MenuItem sx={{ pl: 2, py: 0.6, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">{cat.label}</Typography>
              <ChevronRight fontSize="small" />
            </MenuItem>
            <Menu
              open={subMenu === cat.key}
              anchorEl={anchorEl}
              onClose={() => setSubMenu(null)}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              {cmds.map(cmd => (
                <MenuItem key={cmd.id} onClick={() => handleCommand(cmd.id)} sx={{ py: 0.6 }}>
                  <Typography variant="body2">{cmd.label}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        );
      })}
    </Menu>
  );
}

// ─── 批量操作栏 ───
function BatchActionBar({
  selectedCount, onClear, onCommand,
}: {
  selectedCount: number;
  onClear: () => void;
  onCommand: (commandId: string) => void;
}) {
  if (selectedCount === 0) return null;

  const quickCommands: { id: string; label: string }[] = [
    { id: 'powerOff', label: '关机' },
    { id: 'reboot', label: '重启' },
    { id: 'lockScreen', label: '锁屏' },
    { id: 'ringBell', label: '打铃' },
    { id: 'screenshot', label: '截屏' },
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

// ─── 远程桌面对话框 ───
function RemoteDesktopDialog({
  device, open, onClose,
}: {
  device: DeviceMgmtDevice | null;
  open: boolean;
  onClose: () => void;
}) {
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
            <Box className={`rounded-xl overflow-hidden ${device.screenThumbnail} h-96 flex items-center justify-center`}>
              <Box className="grid grid-cols-4 gap-4 p-8 opacity-60">
                {['📁', '📄', '⚙️', '🖥️', '📊', '🌐', '🎬', '📝'].map((icon, i) => (
                  <Box key={i} className="flex items-center justify-center" style={{ fontSize: 32 }}>{icon}</Box>
                ))}
              </Box>
            </Box>
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
                  { cmd: 'screenshot', label: '截屏', icon: Screenshot },
                  { cmd: 'powerOff', label: '关机', icon: PowerOff },
                  { cmd: 'reboot', label: '重启', icon: RestartAlt },
                  { cmd: 'ringBell', label: '打铃', icon: Notifications },
                  { cmd: 'sendMsg', label: '消息', icon: Message },
                ].map(({ cmd, label, icon: Icon }) => (
                  <Button key={cmd} size="small" variant="outlined"
                    onClick={() => handleCommand(cmd)}
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
  const [files, setFiles] = useState<FileItem[]>([]);
  const [targetPath, setTargetPath] = useState('C:\\Users\\Public\\Documents\\教学资源\\');
  const [autoOpen, setAutoOpen] = useState(true);
  const [overwrite, setOverwrite] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(f => {
        setFiles(prev => [...prev, { name: f.name, size: f.size }]);
      });
    }
  };

  const removeFile = (name: string) => setFiles(prev => prev.filter(f => f.name !== name));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      Array.from(e.dataTransfer.files).forEach(f => {
        setFiles(prev => [...prev, { name: f.name, size: f.size }]);
      });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const startTransfer = () => {
    if (files.length === 0) return;
    setTransferring(true);
    devices.forEach(d => {
      const interval = setInterval(() => {
        setProgress(prev => {
          const current = prev[d.id] || 0;
          if (current >= 100) { clearInterval(interval); return { ...prev, [d.id]: 100 }; }
          return { ...prev, [d.id]: Math.min(100, current + Math.floor(Math.random() * 16) + 5) };
        });
      }, 400);
    });
  };

  const allComplete = devices.length > 0 && devices.every(d => (progress[d.id] || 0) >= 100);

  return (
    <Dialog open={open} onClose={transferring ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box className="flex items-center gap-2">
          <FileUpload className="text-blue-600" />
          <Typography variant="h6">文件分发</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" className="mb-3">
          目标设备：{devices.map(d => d.name).join(' / ')}（共 {devices.length} 台）
        </Typography>
        <Box
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center mb-3 cursor-pointer hover:border-blue-400"
          onClick={() => document.getElementById('file-dist-input')?.click()}
        >
          <CloudUpload className="text-gray-400" style={{ fontSize: 32 }} />
          <Typography variant="body2" color="text.secondary">点击选择文件或拖拽到此处</Typography>
          <input id="file-dist-input" type="file" multiple hidden onChange={handleFileSelect} />
        </Box>
        {files.length > 0 && (
          <Box className="mb-3 space-y-1">
            {files.map(f => (
              <Box key={f.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <Typography variant="body2">{f.name}</Typography>
                <Box className="flex items-center gap-2">
                  <Typography variant="caption" color="text.secondary">{formatSize(f.size)}</Typography>
                  <IconButton size="small" onClick={() => removeFile(f.name)} disabled={transferring}>
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        )}
        <TextField size="small" fullWidth label="目标路径" value={targetPath}
          onChange={e => setTargetPath(e.target.value)} disabled={transferring} className="mb-3" />
        <Box className="flex gap-4 mb-3">
          <FormControlLabel control={<Checkbox size="small" checked={autoOpen} onChange={(_, v) => setAutoOpen(v)} disabled={transferring} />}
            label={<Typography variant="caption">接收后自动打开</Typography>} />
          <FormControlLabel control={<Checkbox size="small" checked={overwrite} onChange={(_, v) => setOverwrite(v)} disabled={transferring} />}
            label={<Typography variant="caption">覆盖已有文件</Typography>} />
        </Box>
        {transferring && (
          <Box className="space-y-2">
            {devices.map(d => {
              const pct = progress[d.id] || 0;
              return (
                <Box key={d.id}>
                  <Box className="flex justify-between">
                    <Typography variant="caption">{d.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {pct >= 100 ? '✅ 完成' : `${pct}%`}
                    </Typography>
                  </Box>
                  <Box className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <Box className="h-full rounded-full bg-blue-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={transferring}>取消</Button>
        <Button onClick={startTransfer} variant="contained" disabled={files.length === 0 || transferring}>
          {transferring ? '传输中...' : '开始传输'}
        </Button>
        {allComplete && <Button onClick={onClose} variant="contained" color="success">完成</Button>}
      </DialogActions>
    </Dialog>
  );
}

// ─── 发送消息弹窗 ───
function SendMessageDialog({
  open, devices, onClose,
}: {
  open: boolean;
  devices: DeviceMgmtDevice[];
  onClose: () => void;
}) {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    setSent(true);
    setTimeout(onClose, 1500);
  };

  if (sent) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent className="text-center py-8">
          <CheckCircle sx={{ fontSize: 48, color: '#22c55e' }} className="mb-2" />
          <Typography variant="h6">消息已发送</Typography>
          <Typography variant="body2" color="text.secondary">
            已向 {devices.length} 台设备发送消息
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box className="flex items-center gap-2">
          <Message className="text-blue-600" />
          <Typography variant="h6">发送消息</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" className="mb-3">
          目标设备：{devices.length > 3
            ? `${devices.slice(0, 3).map(d => d.name).join('、')} 等 ${devices.length} 台`
            : devices.map(d => d.name).join('、')}
        </Typography>
        <TextField autoFocus multiline rows={4} fullWidth placeholder="请输入要发送的消息内容..."
          value={message} onChange={e => setMessage(e.target.value)} variant="outlined" size="small" />
        <Box className="flex items-center gap-2 mt-2">
          <Checkbox size="small" defaultChecked />
          <Typography variant="caption" color="text.secondary">以弹窗形式在设备屏幕中央显示</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSend} variant="contained" disabled={!message.trim()}>发送</Button>
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
  osFilter: string,
  durationFilter: string,
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
    if (osFilter !== 'all' && d.os !== osFilter) return false;
    if (durationFilter !== 'all') {
      if (d.status !== 'online') return false;
      const hours = d.onlineDuration / 60;
      if (durationFilter === 'lt1' && hours >= 1) return false;
      if (durationFilter === '1-6' && (hours < 1 || hours > 6)) return false;
      if (durationFilter === 'gt6' && hours <= 6) return false;
    }
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
  const [osFilter, setOsFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');
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
  const [showSendMsg, setShowSendMsg] = useState(false);
  const [showCommandResult, setShowCommandResult] = useState(false);
  const [commandResults, setCommandResults] = useState<CommandResult[]>([]);

  // ── 衍生数据 ──
  const buildings = useMemo(() => [...new Set(devices.map(d => d.building))], [devices]);
  const floors = useMemo(() => [...new Set(devices.map(d => d.floor))], [devices]);
  const filteredDevices = useMemo(
    () => filterDevices(devices, searchTerm, statusFilter, buildingFilter, floorFilter, osFilter, durationFilter),
    [devices, searchTerm, statusFilter, buildingFilter, floorFilter, osFilter, durationFilter],
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
    setOsFilter('all');
    setDurationFilter('all');
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

  const handleCommand = (commandId: string) => {
    const cmd = COMMANDS[commandId];
    const targets = selected.size >= 2 ? selectedDevices : (menuDevice ? [menuDevice] : []);
    if (targets.length === 0) return;

    // Special commands that open their own dialogs
    if (commandId === 'sendMsg') { setShowSendMsg(true); return; }
    if (commandId === 'fileDist') { setShowFileDist(true); return; }

    // Simulate command execution
    const results: CommandResult[] = targets.map(d => ({
      deviceId: d.id,
      deviceName: d.name,
      commandLabel: cmd.label,
      status: 'pending' as const,
    }));
    setCommandResults(results);
    setShowCommandResult(true);

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
    handleCommand(commandId);
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
        osFilter={osFilter}
        onOsChange={v => { setOsFilter(v); setPage(0); }}
        durationFilter={durationFilter}
        onDurationChange={v => { setDurationFilter(v); setPage(0); }}
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
      />

      {/* 文件分发弹窗 */}
      <FileDistributeDialog
        open={showFileDist}
        devices={selectedDevices}
        onClose={() => setShowFileDist(false)}
      />

      {/* 发送消息弹窗 */}
      <SendMessageDialog
        open={showSendMsg}
        devices={selectedDevices}
        onClose={() => setShowSendMsg(false)}
      />

      {/* 指令执行结果 */}
      <CommandResultDialog
        open={showCommandResult}
        results={commandResults}
        onClose={() => setShowCommandResult(false)}
      />
    </Box>
  );
}
