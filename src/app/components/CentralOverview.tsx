import { useState, useMemo, useEffect } from 'react';
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
  Devices, CheckCircle, Cancel, Download, Settings,
  Search, Computer, Router, Security, Speed,
  MonitorHeart, BarChart, Timeline, Close, HelpOutline,
  PowerSettingsNew, Warning,
} from '@mui/icons-material';
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
} from 'recharts';

// ─── 类型定义 ───

interface HardwareParams {
  cpuModel: string;
  cpuUsage: number;          // %
  cpuTemp: number;           // °C
  memorySize: number;        // GB
  memoryUsage: number;       // %
  systemDiskSize: number;    // GB
  systemDiskUsage: number;   // %
  dataDiskSize: number;      // GB
  dataDiskUsage: number;     // %
  os: string;
  resolution: string;
  touchScreen: boolean;
  speakerOk: boolean;
  microphoneOk: boolean;
  cameraOk: boolean;
}

interface SecurityCheck {
  name: string;
  ok: boolean;
  detail: string;
}

interface AnomalyRecord {
  time: string;
  type: string;
  desc: string;
  status: 'resolved' | 'unresolved' | 'processing';
}

interface SoftwareUsage {
  name: string;
  duration: number;   // 分钟
  opens: number;
}

interface Device {
  id: string;
  name: string;
  code: string;
  building: string;
  floor: string;
  room: string;
  status: 'online' | 'offline' | 'abnormal';
  lastActive: string;
  networkOk: boolean;
  hardwareOk: boolean;
  smoothnessOk: boolean;
  securityOk: boolean;
  uploadSpeed: number;
  downloadSpeed: number;
  inboundTraffic: number;   // MB
  outboundTraffic: number;  // MB
  hardware: HardwareParams;
  security: SecurityCheck[];
  usageTimeSlots: { time: string; count: number }[];
  softwareUsage: SoftwareUsage[];
  teacherUsage: { name: string; time: string }[];
  anomalies: AnomalyRecord[];
}

interface Thresholds {
  usageRate: number;
  securityRate: number;
}

type DeviceStatus = 'all' | 'online' | 'offline' | 'abnormal';
type ComplianceFilter = 'all' | 'all-pass' | 'has-fail';

// ─── 时间范围类型 ───
type TimeRangePreset = 'today' | 'yesterday' | 'last3' | 'last7' | 'custom';

interface TimeRange {
  preset: TimeRangePreset;
  customStart?: string;  // ISO date string
  customEnd?: string;    // ISO date string
}

const DEFAULT_THRESHOLDS: Thresholds = {
  usageRate: 60,
  securityRate: 95,
};

// ─── 工具函数 ───
function rand(min: number, max: number): number {
  return Math.round(Math.random() * (max - min) + min);
}

function randFloat(min: number, max: number, fixed = 1): number {
  return +(Math.random() * (max - min) + min).toFixed(fixed);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatDate(d: Date): string {
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${d.getFullYear()}-${M}-${D} ${h}:${m}`;
}

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

const CPU_MODELS = ['Intel Core i5-10400', 'Intel Core i7-10700', 'Intel Core i5-12400', 'Intel Core i3-10100', 'AMD Ryzen 5 5600G', 'Intel Celeron N5095'];
const OS_LIST = ['Windows 10 Pro', 'Windows 11 Pro', 'Ubuntu 22.04 LTS'];
const RESOLUTIONS = ['1920×1080', '3840×2160', '2560×1440'];
const ANOMALY_TYPES = ['网络断开', 'CPU 过热', '内存不足', '磁盘空间不足', '系统崩溃', '外设异常', '进程无响应'];
const SOFTWARE_NAMES = ['电子白板', '教学助手', '课堂互动', '作业系统', '资源平台', '考试系统', 'Office 办公套件', '浏览器'];
const TEACHER_NAMES = ['彭浩', '王剑川', '汪鑫', '王显平', '郭叮洪', '石如飞', '张三', '李四'];

function generateDevices(): Device[] {
  const devices: Device[] = [];
  let idx = 0;
  for (const building of BUILDINGS) {
    for (const floor of building.floors) {
      for (const room of floor.rooms) {
        idx++;
        const isOnline = Math.random() < 0.8;
        const isAbnormal = !isOnline && Math.random() < 0.5;
        const status: Device['status'] = isOnline ? 'online' : isAbnormal ? 'abnormal' : 'offline';
        const lastActive = new Date(Date.now() - rand(0, 72) * 3600000);
        const networkOk = Math.random() < 0.88;
        const hardwareOk = Math.random() < 0.90;
        const smoothnessOk = Math.random() < 0.85;
        const securityOk = Math.random() < 0.92;
        const cpuUsage = rand(10, 95);
        const cpuTemp = rand(35, 90);
        const memUsage = rand(20, 92);
        const sysDiskUsage = rand(15, 95);
        const dataDiskUsage = rand(5, 90);
        const timeSlots = Array.from({ length: 12 }, (_, i) => ({
          time: `${i * 2}-${(i + 1) * 2}时`,
          count: i >= 3 && i <= 9 ? rand(5, 50) : rand(0, 8),
        }));
        const softwareUsage = SOFTWARE_NAMES.map((name) => ({
          name, duration: rand(20, 300), opens: rand(1, 20),
        })).sort((a, b) => b.duration - a.duration);
        const teacherUsage = status === 'online'
          ? [{ name: pick(TEACHER_NAMES), time: formatDate(new Date(Date.now() - rand(0, 24) * 3600000)) }]
          : [];
        const anomalyCount = isOnline ? rand(0, 2) : rand(1, 4);
        const anomalies: AnomalyRecord[] = Array.from({ length: anomalyCount }, () => {
          const t = new Date(Date.now() - rand(1, 30) * 86400000);
          const statusRand = Math.random();
          const anomalyType = pick(ANOMALY_TYPES);
          return {
            time: formatDate(t),
            type: anomalyType,
            desc: anomalyType,
            status: statusRand < 0.7 ? 'resolved' : statusRand < 0.85 ? 'processing' : 'unresolved',
          };
        });
        devices.push({
          id: `dev-${idx}`, name: `${building.name}${room}教室终端`, code: `DEV-EDU-${String(idx).padStart(3, '0')}`,
          building: building.name, floor: floor.name, room: `${building.name} / ${floor.name} / ${room}教室`,
          status, lastActive: isOnline ? formatDate(lastActive) : formatDate(new Date(lastActive.getTime() - 86400000)),
          networkOk, hardwareOk, smoothnessOk, securityOk,
          uploadSpeed: randFloat(0.5, 5), downloadSpeed: randFloat(5, 100),
          inboundTraffic: randFloat(50, 500), outboundTraffic: randFloat(10, 200),
          hardware: {
            cpuModel: pick(CPU_MODELS), cpuUsage, cpuTemp, memorySize: pick([4, 8, 16]),
            memoryUsage: memUsage, systemDiskSize: pick([128, 256]), systemDiskUsage: sysDiskUsage,
            dataDiskSize: pick([256, 512]), dataDiskUsage, os: pick(OS_LIST), resolution: pick(RESOLUTIONS),
            touchScreen: Math.random() < 0.9, speakerOk: Math.random() < 0.95,
            microphoneOk: Math.random() < 0.90, cameraOk: Math.random() < 0.85,
          },
          security: [
            { name: '系统补丁', ok: Math.random() < 0.92, detail: Math.random() < 0.92 ? '已更新至最新' : '有 3 个待更新补丁' },
            { name: '杀毒软件', ok: Math.random() < 0.95, detail: Math.random() < 0.95 ? '运行中' : '已关闭' },
            { name: '防火墙', ok: Math.random() < 0.93, detail: Math.random() < 0.93 ? '已开启' : '未开启' },
            { name: '违规软件', ok: Math.random() < 0.96, detail: Math.random() < 0.96 ? '未发现' : '发现 1 个可疑程序' },
            { name: 'USB 管控', ok: Math.random() < 0.94, detail: Math.random() < 0.94 ? '合规' : '违规使用' },
          ],
          usageTimeSlots: timeSlots, softwareUsage, teacherUsage, anomalies,
        });
      }
    }
  }
  return devices;
}

function getDefaultThresholds(): Thresholds {
  try {
    const saved = localStorage.getItem('central-overview-thresholds');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return DEFAULT_THRESHOLDS;
}

// ─── 时间范围工具函数 ───
function getDateRangeBounds(range: TimeRange): { start: Date; end: Date } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86400000); // 明天 00:00

  switch (range.preset) {
    case 'today':
      return { start: startOfToday, end: endOfToday };
    case 'yesterday': {
      const start = new Date(startOfToday.getTime() - 86400000);
      return { start, end: startOfToday };
    }
    case 'last3': {
      const start = new Date(startOfToday.getTime() - 3 * 86400000);
      return { start, end: endOfToday };
    }
    case 'last7':
    default: {
      const start = new Date(startOfToday.getTime() - 7 * 86400000);
      return { start, end: endOfToday };
    }
    case 'custom': {
      const start = range.customStart ? new Date(range.customStart) : startOfToday;
      const end = range.customEnd ? new Date(range.customEnd + 'T23:59:59') : endOfToday;
      return { start, end };
    }
  }
}

function isDeviceInRange(device: Device, range: TimeRange): boolean {
  const { start, end } = getDateRangeBounds(range);
  const lastActive = new Date(device.lastActive);
  return lastActive >= start && lastActive < end;
}

function formatPresetLabel(preset: TimeRangePreset): string {
  switch (preset) {
    case 'today': return '今天';
    case 'yesterday': return '昨天';
    case 'last3': return '近 3 天';
    case 'last7': return '近 7 天';
    case 'custom': return '自定义';
  }
}

// ─── InfoRow 组件 ───
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" className="block mb-0.5">{label}</Typography>
      <Typography variant="body2" className="font-medium">
        {typeof value === 'string' ? value : value}
      </Typography>
    </Box>
  );
}

// ─── 设备信息标签页 ───
function DeviceInfoTab({ device }: { device: Device }) {
  return (
    <Box className="py-2">
      <Box className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
        <InfoRow label="设备名称" value={device.name} />
        <InfoRow label="设备编号" value={device.code} />
        <InfoRow label="状态" value={
          <Chip label={device.status === 'online' ? '在线' : device.status === 'offline' ? '离线' : '异常'}
            size="small"
            sx={{
              backgroundColor: device.status === 'online' ? '#dcfce7' : device.status === 'offline' ? '#f3f4f6' : '#fee2e2',
              color: device.status === 'online' ? '#16a34a' : device.status === 'offline' ? '#6b7280' : '#dc2626',
              fontWeight: 600, height: 22, fontSize: 11,
            }}
          />
        } />
        <InfoRow label="所属位置" value={device.room} />
        <InfoRow label="最近活跃" value={device.lastActive} />
      </Box>

      <Typography variant="subtitle2" className="font-bold text-gray-700 mb-3 flex items-center gap-1">
        <Router sx={{ fontSize: 16 }} /> 网络信息
      </Typography>
      <Box className="grid grid-cols-2 gap-x-6 gap-y-3">
        <InfoRow label="上行网速" value={`${device.uploadSpeed} Mbps`} />
        <InfoRow label="下行网速" value={`${device.downloadSpeed} Mbps`} />
        <InfoRow label="流入流量" value={`${device.inboundTraffic} MB`} />
        <InfoRow label="流出流量" value={`${device.outboundTraffic} MB`} />
        <InfoRow label="网络达标" value={device.networkOk ? '✅ 达标' : '❌ 不达标'} />
      </Box>
    </Box>
  );
}

// ─── 硬件参数标签页 ───
function HardwareTab({ device }: { device: Device }) {
  const items: { label: string; value: string; ok: boolean | null }[] = [
    { label: 'CPU 型号', value: device.hardware.cpuModel, ok: null },
    { label: 'CPU 使用率', value: `${device.hardware.cpuUsage}%`, ok: device.hardware.cpuUsage <= 80 },
    { label: 'CPU 平均温度', value: `${device.hardware.cpuTemp}°C`, ok: device.hardware.cpuTemp <= 75 },
    { label: '内存大小', value: `${device.hardware.memorySize} GB`, ok: device.hardware.memorySize >= 4 },
    { label: '内存使用率', value: `${device.hardware.memoryUsage}%`, ok: device.hardware.memoryUsage <= 80 },
    { label: '系统盘容量', value: `${device.hardware.systemDiskSize} GB`, ok: null },
    { label: '系统盘使用率', value: `${device.hardware.systemDiskUsage}%`, ok: device.hardware.systemDiskUsage <= 85 },
    { label: '数据盘容量', value: `${device.hardware.dataDiskSize} GB`, ok: null },
    { label: '数据盘使用率', value: `${device.hardware.dataDiskUsage}%`, ok: device.hardware.dataDiskUsage <= 85 },
    { label: '操作系统', value: device.hardware.os, ok: null },
    { label: '屏幕分辨率', value: device.hardware.resolution, ok: null },
    { label: '触摸屏', value: device.hardware.touchScreen ? '支持' : '不支持', ok: null },
    { label: '音响状态', value: device.hardware.speakerOk ? '正常' : '异常', ok: device.hardware.speakerOk },
    { label: '麦克风状态', value: device.hardware.microphoneOk ? '正常' : '异常', ok: device.hardware.microphoneOk },
    { label: '摄像头状态', value: device.hardware.cameraOk ? '正常' : '异常', ok: device.hardware.cameraOk },
  ];

  return (
    <Box className="py-2">
      <Box className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
        {items.map((item) => (
          <Box key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50">
            <Typography variant="body2" color="text.secondary">{item.label}</Typography>
            <Box className="flex items-center gap-1.5">
              <Typography variant="body2" className="font-medium">{item.value}</Typography>
              {item.ok !== null && (
                item.ok
                  ? <CheckCircle sx={{ fontSize: 16, color: '#22c55e' }} />
                  : <Cancel sx={{ fontSize: 16, color: '#ef4444' }} />
              )}
            </Box>
          </Box>
        ))}
      </Box>
      <Box className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
        <Typography variant="body2" className="font-medium">硬件达标：</Typography>
        {device.hardwareOk
          ? <Chip label="达标" size="small" sx={{ backgroundColor: '#dcfce7', color: '#16a34a', fontWeight: 600 }} />
          : <Chip label="不达标" size="small" sx={{ backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 600 }} />
        }
      </Box>
    </Box>
  );
}

// ─── 安全情况标签页 ───
function SecurityTab({ device }: { device: Device }) {
  return (
    <Box className="py-2">
      <Box className="space-y-3 mb-4">
        {device.security.map((item) => (
          <Box key={item.name} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
            <Box className="flex items-center gap-2">
              {item.ok
                ? <CheckCircle sx={{ fontSize: 18, color: '#22c55e' }} />
                : <Cancel sx={{ fontSize: 18, color: '#ef4444' }} />
              }
              <Box>
                <Typography variant="body2" className="font-medium">{item.name}</Typography>
                <Typography variant="caption" color="text.secondary">{item.detail}</Typography>
              </Box>
            </Box>
            <Chip
              label={item.ok ? '正常' : '异常'}
              size="small"
              sx={{
                backgroundColor: item.ok ? '#dcfce7' : '#fee2e2',
                color: item.ok ? '#16a34a' : '#dc2626',
                fontWeight: 600, height: 22, fontSize: 11,
              }}
            />
          </Box>
        ))}
      </Box>
      <Box className="p-4 rounded-lg border"
        sx={{ borderColor: device.securityOk ? '#bbf7d0' : '#fecaca', backgroundColor: device.securityOk ? '#f0fdf4' : '#fef2f2' }}
      >
        <Box className="flex items-center gap-2">
          {device.securityOk
            ? <CheckCircle sx={{ fontSize: 24, color: '#22c55e' }} />
            : <Cancel sx={{ fontSize: 24, color: '#ef4444' }} />
          }
          <Box>
            <Typography variant="body2" className="font-bold">
              安全达标：{device.securityOk ? '达标' : '不达标'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {device.securityOk ? '该设备所有安全检查项均通过' : '该设备存在安全风险，请及时处理'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ─── 图表工具提示 ───
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <Box className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <Typography variant="caption" className="font-medium text-gray-600 block">{label}</Typography>
      {payload.map((entry: any, i: number) => (
        <Typography key={i} variant="caption" sx={{ color: entry.color }}>
          {entry.name}：{entry.value}
        </Typography>
      ))}
    </Box>
  );
}

// ─── 使用分析标签页 ───
function UsageTab({ device }: { device: Device }) {
  return (
    <Box className="py-2 space-y-6">
      <Box>
        <Typography variant="subtitle2" className="font-bold text-gray-700 mb-3 flex items-center gap-1">
          <Timeline sx={{ fontSize: 16 }} /> 设备使用时间段分布
        </Typography>
        <ResponsiveContainer width="100%" height={180}>
          <ReBarChart data={device.usageTimeSlots} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <ReTooltip content={<ChartTooltip />} />
            <Bar dataKey="count" name="活跃次数" radius={[4, 4, 0, 0]} fill="#3b82f6" />
          </ReBarChart>
        </ResponsiveContainer>
      </Box>

      <Box>
        <Typography variant="subtitle2" className="font-bold text-gray-700 mb-3 flex items-center gap-1">
          <BarChart sx={{ fontSize: 16 }} /> 软件使用时长排行
        </Typography>
        <Box className="space-y-2">
          {device.softwareUsage.slice(0, 5).map((sw, i) => (
            <Box key={sw.name} className="flex items-center gap-3">
              <Typography variant="caption" className="w-4 font-bold text-gray-400">{i + 1}</Typography>
              <Typography variant="body2" className="flex-1">{sw.name}</Typography>
              <Box className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <Box className="h-full rounded-full bg-blue-500"
                  sx={{ width: `${Math.min(100, (sw.duration / device.softwareUsage[0].duration) * 100)}%` }}
                />
              </Box>
              <Typography variant="caption" className="font-medium min-w-[50px] text-right">
                {sw.duration > 60 ? `${(sw.duration / 60).toFixed(1)}h` : `${sw.duration}min`}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box>
        <Typography variant="subtitle2" className="font-bold text-gray-700 mb-3">软件使用列表</Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 600 }}>软件名称</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>使用时长</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>打开次数</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {device.softwareUsage.map((sw) => (
                <TableRow key={sw.name}>
                  <TableCell>{sw.name}</TableCell>
                  <TableCell>{sw.duration > 60 ? `${(sw.duration / 60).toFixed(1)} 小时` : `${sw.duration} 分钟`}</TableCell>
                  <TableCell>{sw.opens} 次</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {device.teacherUsage.length > 0 && (
        <Box>
          <Typography variant="subtitle2" className="font-bold text-gray-700 mb-3">老师使用情况</Typography>
          {device.teacherUsage.map((t, i) => (
            <Box key={i} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Typography variant="body2" className="font-medium">{t.name}</Typography>
              <Typography variant="caption" color="text.secondary">最近使用：{t.time}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ─── 异常记录标签页 ───
function AnomalyTab({ device }: { device: Device }) {
  return (
    <Box className="py-2">
      {device.anomalies.length === 0 ? (
        <Box className="text-center py-12">
          <CheckCircle sx={{ fontSize: 48, color: '#22c55e' }} />
          <Typography variant="body1" className="mt-2 font-medium text-green-600">暂无异常记录</Typography>
          <Typography variant="body2" color="text.secondary">该设备运行正常</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 600, width: 140 }}>时间</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 100 }}>异常类型</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>描述</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 90 }}>状态</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {device.anomalies.map((item, i) => (
                <TableRow key={i}>
                  <TableCell><Typography variant="caption">{item.time}</Typography></TableCell>
                  <TableCell>
                    <Chip label={item.type} size="small" variant="outlined" sx={{ fontSize: 11, height: 22 }} />
                  </TableCell>
                  <TableCell><Typography variant="body2">{item.desc}</Typography></TableCell>
                  <TableCell>
                    <Chip
                      label={item.status === 'resolved' ? '已恢复' : item.status === 'processing' ? '处理中' : '未恢复'}
                      size="small"
                      sx={{
                        backgroundColor: item.status === 'resolved' ? '#dcfce7' : item.status === 'processing' ? '#fef9c3' : '#fee2e2',
                        color: item.status === 'resolved' ? '#16a34a' : item.status === 'processing' ? '#ca8a04' : '#dc2626',
                        fontWeight: 600, height: 22, fontSize: 11,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

// ─── 设备详情弹窗 ───
function DeviceDetailDialog({
  device, open, onClose, tab, onTabChange,
}: {
  device: Device | null;
  open: boolean;
  onClose: () => void;
  tab: number;
  onTabChange: (t: number) => void;
}) {
  if (!device) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb', pb: 2 }}>
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <Computer className="text-blue-600" />
            <Typography variant="h6">{device.name}</Typography>
            <Chip
              label={device.status === 'online' ? '在线' : device.status === 'offline' ? '离线' : '异常'}
              size="small"
              sx={{
                backgroundColor: device.status === 'online' ? '#dcfce7' : device.status === 'offline' ? '#f3f4f6' : '#fee2e2',
                color: device.status === 'online' ? '#16a34a' : device.status === 'offline' ? '#6b7280' : '#dc2626',
                fontWeight: 600, height: 22, fontSize: 11,
              }}
            />
          </Box>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Tabs value={tab} onChange={(_, v) => onTabChange(v)} sx={{ mb: 2, borderBottom: '1px solid #e5e7eb' }}>
          <Tab label="设备信息" />
          <Tab label="硬件参数" />
          <Tab label="安全情况" />
          <Tab label="使用分析" />
          <Tab label="异常记录" />
        </Tabs>
        {tab === 0 && <DeviceInfoTab device={device} />}
        {tab === 1 && <HardwareTab device={device} />}
        {tab === 2 && <SecurityTab device={device} />}
        {tab === 3 && <UsageTab device={device} />}
        {tab === 4 && <AnomalyTab device={device} />}
      </DialogContent>
    </Dialog>
  );
}

// ─── StatCard 组件 ───
function StatCard({
  icon, title, value, unit, numerator, denominator, color, bgClass,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  unit?: string;
  numerator?: number;
  denominator?: number;
  color: string;
  bgClass: string;
}) {
  return (
    <Card className="flex-1 min-w-[180px]" elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
      <CardContent className="p-5">
        <Box className="flex items-center gap-3">
          <Box className={`${bgClass} rounded-2xl p-3 flex-shrink-0`}>
            <Box sx={{ color }}>{icon}</Box>
          </Box>
          <Box className="min-w-0">
            <Typography variant="caption" color="text.secondary" className="whitespace-nowrap">
              {title}
            </Typography>
            <Box className="flex items-baseline gap-1">
              <Typography variant="h4" className="font-bold" sx={{ color, lineHeight: 1.2 }}>
                {value}
                {unit && (
                  <Typography component="span" variant="body2" color="text.secondary" className="ml-0.5 font-normal">
                    {unit}
                  </Typography>
                )}
              </Typography>
            </Box>
            {numerator !== undefined && denominator !== undefined && (
              <Typography variant="caption" color="text.secondary">
                {numerator}/{denominator}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── 时间范围选择器组件 ───
function TimeRangeSelector({
  value, onChange,
}: {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}) {
  const presets: { key: TimeRangePreset; label: string }[] = [
    { key: 'today', label: '今天' },
    { key: 'yesterday', label: '昨天' },
    { key: 'last3', label: '近 3 天' },
    { key: 'last7', label: '近 7 天' },
    { key: 'custom', label: '自定义' },
  ];

  const handleCustomStartChange = (val: string) => {
    onChange({ ...value, customStart: val || undefined });
  };
  const handleCustomEndChange = (val: string) => {
    onChange({ ...value, customEnd: val || undefined });
  };

  return (
    <Box className="flex items-center gap-2 flex-wrap">
      <Typography variant="caption" color="text.secondary" className="whitespace-nowrap font-medium">
        统计时间：
      </Typography>
      <Box className="flex gap-0.5">
        {presets.map((p) => (
          <Button
            key={p.key}
            size="small"
            variant={value.preset === p.key ? 'contained' : 'text'}
            onClick={() => onChange({ preset: p.key, customStart: value.customStart, customEnd: value.customEnd })}
            sx={{
              minWidth: 56,
              px: 1.2,
              fontSize: 12,
              fontWeight: value.preset === p.key ? 600 : 400,
              borderRadius: 2,
              color: value.preset === p.key ? '#fff' : 'text.secondary',
              backgroundColor: value.preset === p.key ? '#3b82f6' : 'transparent',
              '&:hover': value.preset === p.key ? { backgroundColor: '#2563eb' } : { backgroundColor: '#f3f4f6' },
            }}
          >
            {p.label}
          </Button>
        ))}
      </Box>
      {value.preset === 'custom' && (
        <Box className="flex items-center gap-2 ml-1">
          <TextField
            type="date"
            size="small"
            label="开始日期"
            value={value.customStart || ''}
            onChange={(e) => handleCustomStartChange(e.target.value)}
            slotProps={{ inputLabel: { shrink: true, sx: { fontSize: 12 } } }}
            sx={{ '& input': { fontSize: 13, width: 120 } }}
          />
          <Typography variant="caption" color="text.secondary">至</Typography>
          <TextField
            type="date"
            size="small"
            label="结束日期"
            value={value.customEnd || ''}
            onChange={(e) => handleCustomEndChange(e.target.value)}
            slotProps={{ inputLabel: { shrink: true, sx: { fontSize: 12 } } }}
            sx={{ '& input': { fontSize: 13, width: 120 } }}
          />
        </Box>
      )}
    </Box>
  );
}

// ─── 概览数据聚合 ───
function computeOverviewStats(devices: Device[], thresholds: Thresholds, timeRange: TimeRange) {
  const total = devices.length;
  const inRangeDevices = devices.filter((d) => isDeviceInRange(d, timeRange));
  const activeCount = inRangeDevices.filter((d) => d.status === 'online').length;
  const abnormalCount = inRangeDevices.filter((d) => d.status === 'abnormal').length;
  const activeRecent = inRangeDevices.filter((d) => {
    if (d.status === 'offline') return false;
    return Date.now() - new Date(d.lastActive).getTime() < 604800000; // 7 days
  }).length;
  const usageRate = Math.round((activeRecent / total) * 100);
  const securityRate = Math.round((devices.filter((d) => d.securityOk).length / total) * 100);

  const rateColor = (rate: number, threshold: number): string => {
    if (rate >= threshold) return '#22c55e';
    if (rate >= threshold * 0.9) return '#f59e0b';
    return '#ef4444';
  };

  return {
    total, activeRecent,
    activeCount, abnormalCount,
    usageRate, securityRate,
    usageColor: rateColor(usageRate, thresholds.usageRate),
    securityColor: rateColor(securityRate, thresholds.securityRate),
  };
}

// ─── 阈值设置弹窗 ───
function ThresholdDialog({
  open, onClose, thresholds, onSave,
}: {
  open: boolean;
  onClose: () => void;
  thresholds: Thresholds;
  onSave: (t: Thresholds) => void;
}) {
  const [local, setLocal] = useState<Thresholds>(thresholds);

  useEffect(() => {
    if (open) setLocal(thresholds);
  }, [open, thresholds]);

  const fields: { key: keyof Thresholds; label: string; desc: string }[] = [
    { key: 'usageRate', label: '设备使用率阈值', desc: '低于此值视为使用率偏低' },
    { key: 'securityRate', label: '安全达标率阈值', desc: '低于此值标记为安全不达标' },
  ];

  const handleChange = (key: keyof Thresholds, value: number) => {
    setLocal((prev) => ({ ...prev, [key]: Math.max(0, Math.min(100, value)) }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box className="flex items-center gap-2">
          <Settings className="text-blue-600" />
          <Typography variant="h6">阈值设置</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box className="py-4 flex flex-col gap-5">
          {fields.map(({ key, label, desc }) => (
            <Box key={key}>
              <Box className="flex items-center justify-between mb-1">
                <Typography variant="body2" className="font-medium">{label}</Typography>
                <Box className="flex items-center gap-1">
                  <IconButton
                    size="small"
                    onClick={() => handleChange(key, local[key] - 1)}
                    sx={{ border: '1px solid #e0e0e0', borderRadius: 1, width: 28, height: 28 }}
                  >
                    <Typography variant="body2">−</Typography>
                  </IconButton>
                  <TextField
                    size="small"
                    value={local[key]}
                    onChange={(e) => handleChange(key, parseInt(e.target.value) || 0)}
                    sx={{ width: 70, '& input': { textAlign: 'center', fontSize: 14 } }}
                    InputProps={{ endAdornment: <Typography variant="caption" sx={{ ml: 0.5 }}>%</Typography> }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleChange(key, local[key] + 1)}
                    sx={{ border: '1px solid #e0e0e0', borderRadius: 1, width: 28, height: 28 }}
                  >
                    <Typography variant="body2">+</Typography>
                  </IconButton>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">{desc}</Typography>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions className="px-6 pb-4" sx={{ justifyContent: 'space-between' }}>
        <Button
          onClick={() => { setLocal(DEFAULT_THRESHOLDS); }}
          variant="text"
          color="inherit"
          size="small"
        >
          恢复默认
        </Button>
        <Box className="flex gap-2">
          <Button onClick={onClose} variant="outlined">取消</Button>
          <Button onClick={() => { onSave(local); onClose(); }} variant="contained">保存</Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

// ─── 导出 CSV ───
function exportToCSV(devices: Device[], filename: string) {
  const escapeCSV = (s: string) => {
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const headers = [
    '设备名称', '设备编号', '位置', '状态', '最近活跃',
    '上行网速(Mbps)', '下行网速(Mbps)', '流入流量(MB)', '流出流量(MB)',
    '安全达标',
  ];
  const rows = devices.map((d) => [
    escapeCSV(d.name), escapeCSV(d.code), escapeCSV(d.room),
    d.status === 'online' ? '在线' : d.status === 'offline' ? '离线' : '异常',
    d.lastActive,
    String(d.uploadSpeed), String(d.downloadSpeed), String(d.inboundTraffic), String(d.outboundTraffic),
    d.securityOk ? '是' : '否',
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
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

// ─── 页面说明浮窗 ───
function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb' }}>
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <HelpOutline className="text-blue-600" />
            <Typography variant="h6">集控总览 — 页面说明</Typography>
          </Box>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Box className="space-y-6 text-sm">

          {/* ── 指标计算规则 ── */}
          <section>
            <Typography variant="subtitle1" className="font-bold text-blue-700 mb-2">📊 指标计算规则</Typography>
            <Box className="bg-blue-50 rounded-lg p-4 space-y-2">
              <MetricRule label="监管设备数" rule="系统管理所有教室终端设备的总数量，合计 17 台。" />
              <MetricRule label="开机设备数" rule="当前处于开机/在线状态的设备数量。设备与服务器保持连接并按周期上报心跳即为开机状态。" />
              <MetricRule label="异常设备数" rule="设备在线但存在异常状态（如 CPU 过热、磁盘空间不足、进程无响应等）的数量，需及时处理。" />
              <MetricRule label="设备使用率" rule="所选时间范围内有活跃记录的设备数 ÷ 总设备数 × 100%。活跃记录指设备在统计周期内有在线状态变更或心跳上报。" />
              <MetricRule label="安全达标率" rule="系统补丁、杀毒软件、防火墙、违规软件检测、USB 管控五项安全检查全部通过的设备数 ÷ 总设备数 × 100%。" />
            </Box>
          </section>

          {/* ── 达标颜色规则 ── */}
          <section>
            <Typography variant="subtitle1" className="font-bold text-blue-700 mb-2">🎨 达标颜色规则</Typography>
            <Typography variant="body2" color="text.secondary" className="mb-2">
              适用于「设备使用率」和「安全达标率」两项百分比指标的阈值颜色判断：
            </Typography>
            <Box className="bg-gray-50 rounded-lg p-4">
              <Box className="grid grid-cols-3 gap-4">
                <Box className="text-center p-3 bg-white rounded-lg border border-green-200">
                  <Box className="w-6 h-6 rounded-full bg-green-500 mx-auto mb-1" />
                  <Typography variant="body2" className="font-medium">≥ 阈值</Typography>
                  <Typography variant="caption" color="text.secondary">达标，显示绿色</Typography>
                </Box>
                <Box className="text-center p-3 bg-white rounded-lg border border-yellow-200">
                  <Box className="w-6 h-6 rounded-full bg-yellow-500 mx-auto mb-1" />
                  <Typography variant="body2" className="font-medium">≥ 阈值 × 90%</Typography>
                  <Typography variant="caption" color="text.secondary">临界，显示黄色</Typography>
                </Box>
                <Box className="text-center p-3 bg-white rounded-lg border border-red-200">
                  <Box className="w-6 h-6 rounded-full bg-red-500 mx-auto mb-1" />
                  <Typography variant="body2" className="font-medium">&lt; 阈值 × 90%</Typography>
                  <Typography variant="caption" color="text.secondary">不达标，显示红色</Typography>
                </Box>
              </Box>
            </Box>
          </section>

          {/* ── 时间范围统计说明 ── */}
          <section>
            <Typography variant="subtitle1" className="font-bold text-blue-700 mb-2">⏱️ 时间范围统计</Typography>
            <Box className="bg-gray-50 rounded-lg p-4 space-y-3">
              <Typography variant="body2" color="text.secondary">
                页面顶部的时间范围选择器支持按不同时段筛选数据，影响概览卡片中的统计结果和设备列表的显示范围：
              </Typography>
              <Box className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: '今天', desc: '当日 00:00 至当前时间范围内有活跃记录的设备数据' },
                  { label: '昨天', desc: '昨日 00:00 至今日 00:00 范围内有活跃记录的设备数据' },
                  { label: '近 3 天', desc: '从 3 天前 00:00 至今的统计范围' },
                  { label: '近 7 天', desc: '从 7 天前 00:00 至今的统计范围' },
                  { label: '自定义', desc: '手动选择起始和结束日期，灵活查看任意时间段的统计' },
                ].map(({ label, desc }) => (
                  <Box key={label} className="bg-white rounded-lg border border-gray-200 p-3">
                    <Typography variant="body2" className="font-medium text-blue-700 mb-0.5">{label}</Typography>
                    <Typography variant="caption" color="text.secondary">{desc}</Typography>
                  </Box>
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary" className="mt-1">
                <strong>统计口径说明：</strong>设备是否计入统计范围由其「最近活跃时间」决定。如果设备的最近活跃时间落在所选时间范围内，则该设备的数据纳入统计。设备列表会同步过滤，只显示所选时间范围内有活跃记录的设备。
              </Typography>
              <Typography variant="caption" color="text.secondary" className="block p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                ⚠️ 当前为 Mock 模拟数据，设备的最近活跃时间在生成时固定在最近 72 小时内随机分布。切换时间范围时，活跃时间不在范围内的设备将被过滤。
              </Typography>
            </Box>
          </section>

          {/* ── 阈值默认值 ── */}
          <section>
            <Typography variant="subtitle1" className="font-bold text-blue-700 mb-2">⚙️ 阈值默认值与设置</Typography>
            <Typography variant="body2" color="text.secondary" className="mb-2">
              当前只有「设备使用率」和「安全达标率」涉及阈值判断，开机设备数和异常设备数为数量型指标，不适用百分比阈值。
            </Typography>
            <Box className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2 font-medium">指标</th>
                    <th className="text-left p-2 font-medium">默认阈值</th>
                    <th className="text-left p-2 font-medium">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['设备使用率', '60%', '低于此值视为使用率偏低'],
                    ['安全达标率', '95%', '低于此值标记为安全不达标'],
                  ].map(([label, def, desc]) => (
                    <tr key={label} className="border-t border-gray-200">
                      <td className="p-2 font-medium">{label}</td>
                      <td className="p-2">{def}</td>
                      <td className="p-2 text-gray-500">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
            <Typography variant="caption" color="text.secondary" className="mt-1 block">
              阈值可在页面顶部的「阈值设置」弹窗中自定义修改，修改后实时生效并自动保存至浏览器本地存储。
            </Typography>
          </section>

          {/* ── 状态说明 ── */}
          <section>
            <Typography variant="subtitle1" className="font-bold text-blue-700 mb-2">💡 设备状态说明</Typography>
            <Box className="bg-gray-50 rounded-lg p-4 space-y-2">
              <Box className="flex items-center gap-3">
                <Chip label="在线" size="small" sx={{ backgroundColor: '#dcfce7', color: '#16a34a', fontWeight: 600 }} />
                <Typography variant="body2">设备正常运行，与服务器保持连接，可远程管理和控制。</Typography>
              </Box>
              <Box className="flex items-center gap-3">
                <Chip label="离线" size="small" sx={{ backgroundColor: '#f3f4f6', color: '#6b7280', fontWeight: 600 }} />
                <Typography variant="body2">设备未连接到网络或已关机，无法进行远程操作。</Typography>
              </Box>
              <Box className="flex items-center gap-3">
                <Chip label="异常" size="small" sx={{ backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 600 }} />
                <Typography variant="body2">设备在线但存在异常状态（如 CPU 过热、磁盘空间不足等），需及时处理。</Typography>
              </Box>
            </Box>
          </section>

          {/* ── 达标列统计说明 ── */}
          <section>
            <Typography variant="subtitle1" className="font-bold text-blue-700 mb-2">✅ 设备列表达标列说明</Typography>
            <Typography variant="body2" color="text.secondary" className="mb-2">
              设备列表中的「网络」「硬件」「流畅度」「安全」四列显示每台设备各项是否达标，
              绿色 ✓ 表示达标，红色 ✗ 表示不达标。这些为设备级的细粒度标志，与顶部概览卡片中的汇总指标（如安全达标率）对应。各列的统计口径如下：
            </Typography>
            <Box className="space-y-3">
              <Box className="bg-white border border-green-200 rounded-lg p-3">
                <Typography variant="body2" className="font-bold text-green-700 mb-1">🌐 网络达标 <code className="text-xs font-mono">(networkOk)</code></Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>统计口径：</strong>基于设备最近一次上报的网络连通性检测结果。如果设备与服务器的心跳/探活检测通过，则为达标。
                </Typography>
                <Typography variant="caption" color="text.secondary" className="block mt-1">
                  ⚠️ 当前代码为随机 Mock（88% 概率达标），未对接真实网络检测逻辑。
                </Typography>
              </Box>
              <Box className="bg-white border border-purple-200 rounded-lg p-3">
                <Typography variant="body2" className="font-bold text-purple-700 mb-1">💻 硬件达标 <code className="text-xs font-mono">(hardwareOk)</code></Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>统计口径：</strong>以下 9 项指标<strong>全部</strong>满足条件方为达标：
                </Typography>
                <Box className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm">
                  {[
                    'CPU 使用率 ≤ 80%',
                    'CPU 平均温度 ≤ 75°C',
                    '内存大小 ≥ 4 GB',
                    '内存使用率 ≤ 80%',
                    '系统盘使用率 ≤ 85%',
                    '数据盘使用率 ≤ 85%',
                    '音响正常',
                    '麦克风正常',
                    '摄像头正常',
                  ].map((rule) => (
                    <Typography key={rule} variant="caption" color="text.secondary">• {rule}</Typography>
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary" className="block mt-1">
                  ⚠️ 当前代码为随机 Mock（90% 概率达标），未按上述规则做真实逐项判定。
                </Typography>
              </Box>
              <Box className="bg-white border border-orange-200 rounded-lg p-3">
                <Typography variant="body2" className="font-bold text-orange-700 mb-1">⚡ 流畅度达标 <code className="text-xs font-mono">(smoothnessOk)</code></Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>统计口径：</strong>反映设备系统资源占用是否在合理范围内，综合评估设备运行流畅程度。
                  当前未定义具体量化指标，后续可根据 CPU + 内存综合使用率或系统响应延迟来定义阈值。
                </Typography>
                <Typography variant="body2" color="text.secondary" className="mt-1">
                  <strong>建议实现方式：</strong>例如 CPU 使用率 ≤ 70% 且 内存使用率 ≤ 75% 判定为流畅达标，
                  或引入帧率/响应时间等前端性能指标。
                </Typography>
                <Typography variant="caption" color="text.secondary" className="block mt-1">
                  ⚠️ 当前代码为随机 Mock（85% 概率达标），无真实计算逻辑。
                </Typography>
              </Box>
              <Box className="bg-white border border-red-200 rounded-lg p-3">
                <Typography variant="body2" className="font-bold text-red-700 mb-1">🔒 安全达标 <code className="text-xs font-mono">(securityOk)</code></Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>统计口径：</strong>以下 5 项安全检查<strong>全部</strong>通过方为达标：
                </Typography>
                <Box className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm">
                  {[
                    '系统补丁 — 已更新至最新',
                    '杀毒软件 — 运行中',
                    '防火墙 — 已开启',
                    '违规软件检测 — 未发现可疑程序',
                    'USB 管控 — 合规',
                  ].map((rule) => (
                    <Typography key={rule} variant="caption" color="text.secondary">• {rule}</Typography>
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary" className="block mt-1">
                  ⚠️ 当前代码为随机 Mock（92% 概率达标），未对接真实安全检测数据。
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              ⚠️ <strong>声明：</strong>目前设备列表中的网络、硬件、流畅度三列数据均为前端 Mock 随机生成，未按上述统计口径做真实计算。
              安全达标列已按规则实现逐项判定（Mock 概率模式）。开发人员如需对接真实数据，应按上述规则实现各维度的判定函数。
            </Typography>
          </section>

          {/* ── 使用分析说明 ── */}
          <section>
            <Typography variant="subtitle1" className="font-bold text-blue-700 mb-2">📈 使用分析说明</Typography>
            <Box className="bg-gray-50 rounded-lg p-4 space-y-3">
              <Box>
                <Typography variant="body2" className="font-medium mb-1">设备使用时间段分布 — 活跃次数</Typography>
                <Typography variant="body2" color="text.secondary">
                  X 轴将一天 24 小时分为 12 个时间段（每 2 小时一段，如 0-2时、2-4时……22-24时）。
                  Y 轴（活跃次数）为每个时间段内设备被使用的次数。
                </Typography>
                <Typography variant="body2" color="text.secondary" className="mt-1">
                  <strong>当前为 Mock 模拟数据</strong>：高峰时段（6:00~20:00）生成 5~50 次随机数，
                  非高峰时段（20:00~次日 6:00）生成 0~8 次随机数，无真实业务事件对应。
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="font-medium mb-1">"设备使用"的常见定义范围</Typography>
                <Typography variant="body2" color="text.secondary" className="mb-1">
                  在真实的教务管理系统中，"设备活跃/使用"通常包含以下范围：
                </Typography>
                <Box className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left p-2 font-medium">事件类型</th>
                        <th className="text-left p-2 font-medium">举例</th>
                        <th className="text-left p-2 font-medium">常见度</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['设备开机 / 在线', '终端通电启动、网络心跳上报', '✅ 最基础'],
                        ['用户登录', '教师/学生身份认证登录设备', '✅ 常见'],
                        ['打开教学应用', '启动白板软件、教学资源平台', '✅ 常见'],
                        ['教学系统操作', '进入云课堂、打开课件、录播等', '✅ 常见'],
                      ].map(([type, example, freq]) => (
                        <tr key={type} className="border-t border-gray-200">
                          <td className="p-2 font-medium">{type}</td>
                          <td className="p-2 text-gray-500">{example}</td>
                          <td className="p-2">{freq}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
                <Typography variant="body2" color="text.secondary" className="mt-1">
                  目前页面为纯前端演示，活跃次数仅为随机模拟值，暂未对接真实业务事件统计。
                </Typography>
              </Box>
            </Box>
          </section>

        </Box>
      </DialogContent>
      <DialogActions className="px-6 pb-4">
        <Button onClick={onClose} variant="contained">我知道了</Button>
      </DialogActions>
    </Dialog>
  );
}

function MetricRule({ label, rule }: { label: string; rule: string }) {
  return (
    <Box className="flex items-start gap-2">
      <Typography variant="body2" className="font-medium min-w-[88px] shrink-0">{label}：</Typography>
      <Typography variant="body2" color="text.secondary">{rule}</Typography>
    </Box>
  );
}

export default function CentralOverview() {
  const [devices] = useState<Device[]>(generateDevices);
  const [thresholds, setThresholds] = useState<Thresholds>(getDefaultThresholds);
  const [thresholdDialogOpen, setThresholdDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus>('all');
  const [complianceFilter, setComplianceFilter] = useState<ComplianceFilter>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [detailDevice, setDetailDevice] = useState<Device | null>(null);
  const [detailTab, setDetailTab] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>({ preset: 'today' });

  const stats = useMemo(() => computeOverviewStats(devices, thresholds, timeRange), [devices, thresholds, timeRange]);

  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!d.name.toLowerCase().includes(term) && !d.code.toLowerCase().includes(term)) {
          return false;
        }
      }
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (complianceFilter === 'all-pass' && (!d.networkOk || !d.hardwareOk || !d.smoothnessOk || !d.securityOk)) return false;
      if (complianceFilter === 'has-fail' && d.networkOk && d.hardwareOk && d.smoothnessOk && d.securityOk) return false;
      return true;
    });
  }, [devices, searchTerm, statusFilter, complianceFilter]);

  const pagedDevices = filteredDevices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const cardData = useMemo(() => [
    {
      icon: <Devices sx={{ fontSize: 32 }} />, title: '监管设备数',
      value: stats.total, unit: '台',
      color: '#3b82f6', bgClass: 'bg-blue-50',
    },
    {
      icon: <MonitorHeart sx={{ fontSize: 32 }} />, title: '设备使用率',
      value: stats.usageRate, unit: '%',
      numerator: stats.activeRecent,
      denominator: stats.total,
      color: stats.usageColor, bgClass: 'bg-green-50',
    },
    {
      icon: <PowerSettingsNew sx={{ fontSize: 32 }} />, title: '开机设备数',
      value: stats.activeCount, unit: '台',
      numerator: stats.activeCount,
      denominator: stats.total,
      color: '#22c55e', bgClass: 'bg-green-50',
    },
    {
      icon: <Warning sx={{ fontSize: 32 }} />, title: '异常设备数',
      value: stats.abnormalCount, unit: '台',
      numerator: stats.abnormalCount,
      denominator: stats.total,
      color: '#ef4444', bgClass: 'bg-red-50',
    },
    {
      icon: <Security sx={{ fontSize: 32 }} />, title: '安全达标率',
      value: stats.securityRate, unit: '%',
      numerator: devices.filter(d => d.securityOk).length,
      denominator: stats.total,
      color: stats.securityColor, bgClass: 'bg-red-50',
    },
  ], [stats, devices]);

  return (
    <Box className="overflow-auto h-[calc(100vh-64px)] bg-gray-50">
      <Box className="p-4 sm:p-6">
        {/* 标题区 + 操作按钮 */}
        <Box className="mb-6 flex justify-between items-start">
          <Box>
            <Typography variant="h5" className="font-bold">
              集控总览
            </Typography>
            <Typography variant="body2" color="text.secondary" className="mt-1">
              设备数量、开机状态、异常监控与安全达标概览
            </Typography>
          </Box>
          <Box className="flex items-center gap-3 shrink-0">
            <Button
              variant="outlined"
              size="small"
              startIcon={<Settings />}
              onClick={() => setThresholdDialogOpen(true)}
            >
              阈值设置
            </Button>
          </Box>
        </Box>

        {/* 时间范围选择 */}
        <Box className="mb-4">
          <TimeRangeSelector value={timeRange} onChange={(r) => { setTimeRange(r); setPage(0); }} />
        </Box>

        {/* 概览卡片 */}
        <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          {cardData.map((item) => (
            <StatCard key={item.title} {...item} />
          ))}
        </Box>

        {/* 阈值设置弹窗 */}
        <ThresholdDialog
          open={thresholdDialogOpen}
          onClose={() => setThresholdDialogOpen(false)}
          thresholds={thresholds}
          onSave={(t) => {
            setThresholds(t);
            localStorage.setItem('central-overview-thresholds', JSON.stringify(t));
          }}
        />

        {/* 筛选栏 */}
        <Box className="mb-4 flex flex-wrap items-center gap-3 w-full">
          <TextField
            size="small"
            placeholder="搜索设备名称或编号..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
              ),
            }}
            sx={{ minWidth: 260 }}
          />
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as DeviceStatus); setPage(0); }}
              displayEmpty
            >
              <MenuItem value="all">全部状态</MenuItem>
              <MenuItem value="online">在线</MenuItem>
              <MenuItem value="offline">离线</MenuItem>
              <MenuItem value="abnormal">异常</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select
              value={complianceFilter}
              onChange={(e) => { setComplianceFilter(e.target.value as ComplianceFilter); setPage(0); }}
              displayEmpty
            >
              <MenuItem value="all">全部达标状态</MenuItem>
              <MenuItem value="all-pass">全部达标</MenuItem>
              <MenuItem value="has-fail">存在不达标</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary">
            共 {filteredDevices.length} 台设备
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download />}
            onClick={() => exportToCSV(devices, '设备数据.csv')}
            className="ml-auto"
          >
            导出数据
          </Button>
        </Box>

        {/* 设备表格 */}
        <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 600, width: 50 }}>序号</TableCell>
                  <TableCell sx={{ fontWeight: 600, minWidth: 160 }}>设备名称</TableCell>
                  <TableCell sx={{ fontWeight: 600, minWidth: 110 }}>设备编号</TableCell>
                  <TableCell sx={{ fontWeight: 600, minWidth: 180 }}>所属位置</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 70 }}>状态</TableCell>
                  <TableCell sx={{ fontWeight: 600, minWidth: 130 }}>最近活跃</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 90 }}>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">未找到匹配的设备</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedDevices.map((device, index) => (
                    <TableRow key={device.id} hover>
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" className="font-medium">{device.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{device.code}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: 13 }}>{device.room}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={device.status === 'online' ? '在线' : device.status === 'offline' ? '离线' : '异常'}
                          size="small"
                          sx={{
                            height: 22, fontSize: 11,
                            backgroundColor: device.status === 'online' ? '#dcfce7' : device.status === 'offline' ? '#f3f4f6' : '#fee2e2',
                            color: device.status === 'online' ? '#16a34a' : device.status === 'offline' ? '#6b7280' : '#dc2626',
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{device.lastActive}</Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => { setDetailDevice(device); setDetailTab(0); }}
                          sx={{ fontSize: 12, whiteSpace: 'nowrap', minWidth: 'auto' }}
                        >
                          查看详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredDevices.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage="每页："
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共 ${count}`}
          />
        </Card>
        {/* 设备详情弹窗 */}
        <DeviceDetailDialog
          device={detailDevice}
          open={Boolean(detailDevice)}
          onClose={() => setDetailDevice(null)}
          tab={detailTab}
          onTabChange={setDetailTab}
        />

        {/* 浮窗帮助按钮 */}
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
          <Tooltip title="页面说明" placement="left">
            <IconButton
              onClick={() => setHelpOpen(true)}
              sx={{
                width: 48, height: 48,
                backgroundColor: '#3b82f6',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
                '&:hover': { backgroundColor: '#2563eb' },
              }}
            >
              <HelpOutline />
            </IconButton>
          </Tooltip>
        </Box>

        <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      </Box>
    </Box>
  );
}
