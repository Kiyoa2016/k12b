import { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, IconButton,
  TextField, InputAdornment, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination,
  Select, MenuItem, FormControl,
  Paper,
} from '@mui/material';
import {
  Devices, CheckCircle, Cancel, Download, Settings,
  Search, Computer, Router, Security, Speed,
  MonitorHeart, BarChart, Timeline, Close,
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
  networkRate: number;
  hardwareRate: number;
  smoothnessRate: number;
  securityRate: number;
}

type DeviceStatus = 'all' | 'online' | 'offline' | 'abnormal';
type ComplianceFilter = 'all' | 'all-pass' | 'has-fail';

const DEFAULT_THRESHOLDS: Thresholds = {
  usageRate: 60,
  networkRate: 90,
  hardwareRate: 90,
  smoothnessRate: 85,
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

// ─── 概览数据聚合 ───
function computeOverviewStats(devices: Device[], thresholds: Thresholds) {
  const total = devices.length;
  const activeRecent = devices.filter((d) => {
    if (d.status === 'offline') return false;
    return Date.now() - new Date(d.lastActive).getTime() < 604800000; // 7 days
  }).length;
  const usageRate = Math.round((activeRecent / total) * 100);
  const networkRate = Math.round((devices.filter((d) => d.networkOk).length / total) * 100);
  const hardwareRate = Math.round((devices.filter((d) => d.hardwareOk).length / total) * 100);
  const smoothnessRate = Math.round((devices.filter((d) => d.smoothnessOk).length / total) * 100);
  const securityRate = Math.round((devices.filter((d) => d.securityOk).length / total) * 100);

  const rateColor = (rate: number, threshold: number): string => {
    if (rate >= threshold) return '#22c55e';
    if (rate >= threshold * 0.9) return '#f59e0b';
    return '#ef4444';
  };

  return {
    total, activeRecent,
    usageRate, networkRate, hardwareRate, smoothnessRate, securityRate,
    usageColor: rateColor(usageRate, thresholds.usageRate),
    networkColor: rateColor(networkRate, thresholds.networkRate),
    hardwareColor: rateColor(hardwareRate, thresholds.hardwareRate),
    smoothnessColor: rateColor(smoothnessRate, thresholds.smoothnessRate),
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
    { key: 'networkRate', label: '网络达标率阈值', desc: '低于此值标记为网络不达标' },
    { key: 'hardwareRate', label: '硬件达标率阈值', desc: '低于此值标记为硬件不达标' },
    { key: 'smoothnessRate', label: '流畅度达标率阈值', desc: '低于此值标记为流畅度不达标' },
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
    '网络达标', '硬件达标', '流畅度达标', '安全达标',
  ];
  const rows = devices.map((d) => [
    escapeCSV(d.name), escapeCSV(d.code), escapeCSV(d.room),
    d.status === 'online' ? '在线' : d.status === 'offline' ? '离线' : '异常',
    d.lastActive,
    String(d.uploadSpeed), String(d.downloadSpeed), String(d.inboundTraffic), String(d.outboundTraffic),
    d.networkOk ? '是' : '否', d.hardwareOk ? '是' : '否',
    d.smoothnessOk ? '是' : '否', d.securityOk ? '是' : '否',
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

  const stats = useMemo(() => computeOverviewStats(devices, thresholds), [devices, thresholds]);

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
      icon: <Router sx={{ fontSize: 32 }} />, title: '网络达标率',
      value: stats.networkRate, unit: '%',
      numerator: devices.filter(d => d.networkOk).length,
      denominator: stats.total,
      color: stats.networkColor, bgClass: 'bg-blue-50',
    },
    {
      icon: <Computer sx={{ fontSize: 32 }} />, title: '硬件达标率',
      value: stats.hardwareRate, unit: '%',
      numerator: devices.filter(d => d.hardwareOk).length,
      denominator: stats.total,
      color: stats.hardwareColor, bgClass: 'bg-purple-50',
    },
    {
      icon: <Speed sx={{ fontSize: 32 }} />, title: '流畅度达标率',
      value: stats.smoothnessRate, unit: '%',
      numerator: devices.filter(d => d.smoothnessOk).length,
      denominator: stats.total,
      color: stats.smoothnessColor, bgClass: 'bg-orange-50',
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
        {/* 标题区 */}
        <Box className="mb-6">
          <Typography variant="h5" className="font-bold">
            集控总览
          </Typography>
          <Typography variant="body2" color="text.secondary" className="mt-1">
            设备盘点与运行状态监控
          </Typography>
        </Box>

        {/* 概览卡片 */}
        <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {cardData.map((item) => (
            <StatCard key={item.title} {...item} />
          ))}
        </Box>

        {/* 操作栏 */}
        <Box className="mb-4 flex items-center gap-3">
          <Button
            variant="outlined"
            size="small"
            startIcon={<Settings />}
            onClick={() => setThresholdDialogOpen(true)}
          >
            阈值设置
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download />}
            onClick={() => exportToCSV(devices, '设备数据.csv')}
          >
            导出数据
          </Button>
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
        <Box className="mb-4 flex flex-wrap items-center gap-3">
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
                  <TableCell sx={{ fontWeight: 600, width: 72 }}>网络</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 72 }}>硬件</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 72 }}>流畅度</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 72 }}>安全</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 90 }}>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 8 }}>
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
                      <TableCell align="center">
                        {device.networkOk
                          ? <CheckCircle sx={{ fontSize: 18, color: '#22c55e' }} />
                          : <Cancel sx={{ fontSize: 18, color: '#ef4444' }} />
                        }
                      </TableCell>
                      <TableCell align="center">
                        {device.hardwareOk
                          ? <CheckCircle sx={{ fontSize: 18, color: '#22c55e' }} />
                          : <Cancel sx={{ fontSize: 18, color: '#ef4444' }} />
                        }
                      </TableCell>
                      <TableCell align="center">
                        {device.smoothnessOk
                          ? <CheckCircle sx={{ fontSize: 18, color: '#22c55e' }} />
                          : <Cancel sx={{ fontSize: 18, color: '#ef4444' }} />
                        }
                      </TableCell>
                      <TableCell align="center">
                        {device.securityOk
                          ? <CheckCircle sx={{ fontSize: 18, color: '#22c55e' }} />
                          : <Cancel sx={{ fontSize: 18, color: '#ef4444' }} />
                        }
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
      </Box>
    </Box>
  );
}
