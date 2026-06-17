import { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, IconButton,
  TextField, InputAdornment, Chip, Tooltip,
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
  Cell,
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
  return `2026-${M}-${D} ${h}:${m}`;
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
          return {
            time: formatDate(t),
            type: pick(ANOMALY_TYPES),
            desc: `${pick(ANOMALY_TYPES)}异常`,
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

export default function CentralOverview() {
  return <Box>待实现</Box>;
}
