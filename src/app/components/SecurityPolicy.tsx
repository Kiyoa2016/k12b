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

// ─── 设备选择器 ───
function DeviceSelector({
  selected, onChange, allDevices,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  allDevices: string[];
}) {
  const [open, setOpen] = useState(false);

  const toggleDevice = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  return (
    <Box className="mb-4">
      <Box className="flex items-center gap-2 mb-2">
        <Typography variant="body2" className="font-medium">目标设备：</Typography>
        <Button variant="outlined" size="small" onClick={() => setOpen(true)}>
          {selected.length > 0 ? `已选 ${selected.length} 台` : '选择设备'}
        </Button>
        {selected.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            {selected.slice(0, 3).map((id) => allDevices[parseInt(id, 10)]).join('、')}
            {selected.length > 3 && ` 等 ${selected.length} 台`}
          </Typography>
        )}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box className="flex items-center justify-between">
            <Typography variant="h6">选择目标设备</Typography>
            <IconButton onClick={() => setOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box className="pt-2 space-y-1 max-h-72 overflow-auto">
            <Box
              onClick={() => onChange(allDevices.map((_, i) => String(i)))}
              className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 mb-2"
            >
              <Checkbox size="small" checked={selected.length === allDevices.length}
                indeterminate={selected.length > 0 && selected.length < allDevices.length} />
              <Typography variant="body2" className="font-medium">全选</Typography>
            </Box>
            {allDevices.map((name, i) => (
              <Box key={String(i)}
                onClick={() => toggleDevice(String(i))}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${selected.includes(String(i)) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <Checkbox size="small" checked={selected.includes(String(i))} />
                <Computer sx={{ fontSize: 18, color: selected.includes(String(i)) ? '#3b82f6' : '#9ca3af' }} />
                <Typography variant="body2">{name}</Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setOpen(false)} variant="contained" size="small">确定</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Tab 1: 磁盘清理 ───
function DiskCleanupPanel() {
  const allDevices = DEVICE_NAMES;
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedDisk, setSelectedDisk] = useState('C:');
  const [cleanBackup, setCleanBackup] = useState(true);
  const [cleanCache, setCleanCache] = useState(true);
  const [cleanLog, setCleanLog] = useState(false);
  const [customPaths, setCustomPaths] = useState<string[]>([]);
  const [newPath, setNewPath] = useState('');
  const [results, setResults] = useState<CleanupResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const estimatedFreed = useMemo(() => {
    let total = 0;
    if (cleanBackup) total += 2300;
    if (cleanCache) total += 1100;
    if (cleanLog) total += 512;
    customPaths.forEach(() => { total += rand(100, 500); });
    return total;
  }, [cleanBackup, cleanCache, cleanLog, customPaths.length]);

  const handleAddPath = () => {
    if (newPath.trim()) { setCustomPaths((p) => [...p, newPath.trim()]); setNewPath(''); }
  };

  const handleExecute = () => {
    if (selectedDevices.length === 0) return;
    setIsRunning(true);
    const initial = selectedDevices.map((id) => ({
      deviceId: id, deviceName: allDevices[parseInt(id, 10)],
      status: 'running' as const, beforeSpace: '120 GB',
    }));
    setResults(initial);
    setTimeout(() => {
      setResults(initial.map((r) => ({
        ...r,
        status: Math.random() > 0.15 ? 'success' as const : 'failed' as const,
        afterSpace: '118.5 GB',
        freedSpace: '1.5 GB',
        detail: Math.random() > 0.15 ? undefined : '磁盘正在使用中',
      })));
      setIsRunning(false);
    }, 2000);
  };

  return (
    <Box>
      <DeviceSelector selected={selectedDevices} onChange={setSelectedDevices} allDevices={allDevices} />

      <Box className="mb-4">
        <Typography variant="body2" className="font-medium mb-2">目标磁盘</Typography>
        <Box className="flex gap-2">
          {DISK_LABELS.map((disk) => (
            <Chip key={disk} label={`${disk}\\`}
              onClick={() => setSelectedDisk(disk)}
              color={selectedDisk === disk ? 'primary' : 'default'}
              variant={selectedDisk === disk ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Box>

      <Box className="mb-4">
        <Typography variant="body2" className="font-medium mb-2">清理项目</Typography>
        <Box className="space-y-2">
          <FormControlLabel control={<Checkbox size="small" checked={cleanBackup} onChange={(e) => setCleanBackup(e.target.checked)} />}
            label={<Box><Typography variant="body2">清理备份文件</Typography><Typography variant="caption" color="text.secondary">预计释放：约 2.3 GB</Typography></Box>} />
          <FormControlLabel control={<Checkbox size="small" checked={cleanCache} onChange={(e) => setCleanCache(e.target.checked)} />}
            label={<Box><Typography variant="body2">清理缓存文件</Typography><Typography variant="caption" color="text.secondary">预计释放：约 1.1 GB</Typography></Box>} />
          <FormControlLabel control={<Checkbox size="small" checked={cleanLog} onChange={(e) => setCleanLog(e.target.checked)} />}
            label={<Box><Typography variant="body2">清理日志文件</Typography><Typography variant="caption" color="text.secondary">预计释放：约 512 MB</Typography></Box>} />
        </Box>
      </Box>

      <Box className="mb-4">
        <Typography variant="body2" className="font-medium mb-2">自定义文件夹</Typography>
        <Box className="flex gap-2 mb-2">
          <TextField size="small" placeholder="输入文件夹路径，如 C:\Temp" value={newPath}
            onChange={(e) => setNewPath(e.target.value)} sx={{ flex: 1 }}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPath()} />
          <Button variant="outlined" size="small" onClick={handleAddPath}>添加路径</Button>
        </Box>
        {customPaths.map((path, i) => (
          <Box key={i} className="flex items-center gap-2 mb-1 px-2 py-1 bg-gray-50 rounded">
            <FolderOpen sx={{ fontSize: 16, color: '#6b7280' }} />
            <Typography variant="body2" className="flex-1">{path}</Typography>
            <IconButton size="small" onClick={() => setCustomPaths((p) => p.filter((_, j) => j !== i))}><Close fontSize="small" /></IconButton>
          </Box>
        ))}
      </Box>

      <Box className="flex items-center gap-3 mb-4">
        <Button variant="outlined" size="small" startIcon={<Preview />} disabled={selectedDevices.length === 0}>
          预览
        </Button>
        <Button variant="contained" size="small" startIcon={<CleaningServices />}
          disabled={selectedDevices.length === 0 || isRunning}
          onClick={handleExecute}>
          {isRunning ? '清理中...' : '开始清理'}
        </Button>
        <Typography variant="caption" color="text.secondary">
          预计可释放：{formatSize(estimatedFreed)}
        </Typography>
        {isRunning && <LinearProgress sx={{ flex: 1, maxWidth: 200 }} />}
      </Box>

      <CleanupResultTable results={results} />
    </Box>
  );
}

// ===== 占位导出 =====
export default function SecurityPolicy() {
  return <Box>待实现</Box>;
}
