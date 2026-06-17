import { useState, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Button, IconButton,
  TextField, InputAdornment, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination,
  Select, MenuItem, FormControl, FormControlLabel,
  Checkbox, Switch, LinearProgress, Alert,
  Paper, Tooltip,
} from '@mui/material';
import {
  Delete, CleaningServices, FolderOpen, Warning, Mic,
  Computer, CheckCircle, Cancel, Search, Close,
  Storage, VideoFile, Image, MusicNote, Description,
  PlayArrow, Download, Upload, Preview,
} from '@mui/icons-material';

// ─── 类型定义 ───

export type SecurityTab = 'disk-cleanup' | 'file-migration' | 'disk-format' | 'audio-transcribe';

interface DeviceActionResult {
  deviceId: string;
  deviceName: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  detail?: string;
}

interface CleanupResult extends DeviceActionResult {
  beforeSpace?: string;
  afterSpace?: string;
  freedSpace?: string;
}

interface MigrationResult extends DeviceActionResult {
  fileCount?: number;
  dataSize?: string;
}

interface FormatResult extends DeviceActionResult {}

interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  deleted: boolean;
}

// ─── Mock 数据 ───

const DEVICE_NAMES = [
  '东教学楼101教室终端', '东教学楼102教室终端', '东教学楼103教室终端',
  '东教学楼201教室终端', '东教学楼202教室终端', '东教学楼301教室终端',
  '西教学楼101教室终端', '西教学楼102教室终端', '西教学楼201教室终端',
  '综合楼101教室终端', '综合楼102教室终端',
];

const DISK_LABELS = ['C:', 'D:', 'E:', 'F:'];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatSize(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}

// ─── 结果表格组件 ───

function CleanupResultTable({ results }: { results: CleanupResult[] }) {
  if (results.length === 0) return null;
  return (
    <Box className="mt-4">
      <Typography variant="subtitle2" className="font-bold mb-2">执行结果</Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f9fafb' }}>
              <TableCell sx={{ fontWeight: 600 }}>设备</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>清理前</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>清理后</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>释放空间</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 90 }}>状态</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((r) => (
              <TableRow key={r.deviceId}>
                <TableCell>{r.deviceName}</TableCell>
                <TableCell>{r.beforeSpace || '-'}</TableCell>
                <TableCell>{r.afterSpace || '-'}</TableCell>
                <TableCell>{r.freedSpace || '-'}</TableCell>
                <TableCell>
                  <Chip label={r.status === 'success' ? '成功' : r.status === 'failed' ? '失败' : r.status === 'running' ? '执行中' : '等待'}
                    size="small" sx={{
                      backgroundColor: r.status === 'success' ? '#dcfce7' : r.status === 'failed' ? '#fee2e2' : '#fef9c3',
                      color: r.status === 'success' ? '#16a34a' : r.status === 'failed' ? '#dc2626' : '#ca8a04',
                      fontWeight: 600, height: 22, fontSize: 11,
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function MigrationResultTable({ results }: { results: MigrationResult[] }) {
  if (results.length === 0) return null;
  return (
    <Box className="mt-4">
      <Typography variant="subtitle2" className="font-bold mb-2">迁移结果</Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f9fafb' }}>
              <TableCell sx={{ fontWeight: 600 }}>设备</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>文件数</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>迁移数据量</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 90 }}>状态</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>详情</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((r) => (
              <TableRow key={r.deviceId}>
                <TableCell>{r.deviceName}</TableCell>
                <TableCell>{r.fileCount ?? '-'}</TableCell>
                <TableCell>{r.dataSize || '-'}</TableCell>
                <TableCell>
                  <Chip label={r.status === 'success' ? '成功' : r.status === 'failed' ? '失败' : r.status === 'running' ? '执行中' : '等待'}
                    size="small" sx={{
                      backgroundColor: r.status === 'success' ? '#dcfce7' : r.status === 'failed' ? '#fee2e2' : '#fef9c3',
                      color: r.status === 'success' ? '#16a34a' : r.status === 'failed' ? '#dc2626' : '#ca8a04',
                      fontWeight: 600, height: 22, fontSize: 11,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Button size="small" sx={{ fontSize: 11 }}>查看列表</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function FormatResultTable({ results }: { results: FormatResult[] }) {
  if (results.length === 0) return null;
  return (
    <Box className="mt-4">
      <Typography variant="subtitle2" className="font-bold mb-2">格式化结果</Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f9fafb' }}>
              <TableCell sx={{ fontWeight: 600 }}>设备</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 90 }}>状态</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>说明</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((r) => (
              <TableRow key={r.deviceId}>
                <TableCell>{r.deviceName}</TableCell>
                <TableCell>
                  <Chip label={r.status === 'success' ? '成功' : r.status === 'failed' ? '失败' : r.status === 'running' ? '执行中' : '等待'}
                    size="small" sx={{
                      backgroundColor: r.status === 'success' ? '#dcfce7' : r.status === 'failed' ? '#fee2e2' : '#fef9c3',
                      color: r.status === 'success' ? '#16a34a' : r.status === 'failed' ? '#dc2626' : '#ca8a04',
                      fontWeight: 600, height: 22, fontSize: 11,
                    }}
                  />
                </TableCell>
                <TableCell><Typography variant="caption">{r.detail || '-'}</Typography></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ===== 占位导出 =====
export default function SecurityPolicy() {
  return <Box>待实现</Box>;
}
