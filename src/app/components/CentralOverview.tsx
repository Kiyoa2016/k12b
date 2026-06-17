import { useState, useMemo } from 'react';
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
    return Date.now() - new Date(d.lastActive).getTime() < 86400000;
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

        {/* 操作栏（占位，后续Task实现） */}
        <Box className="mb-4" />
      </Box>
    </Box>
  );
}
