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

// ─── Tab 2: 文件迁移 ───
function FileMigrationPanel() {
  const allDevices = DEVICE_NAMES;
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [sourceDisk, setSourceDisk] = useState('C:');
  const [targetDisk, setTargetDisk] = useState('D:');
  const [types, setTypes] = useState({ video: true, image: true, music: true, document: false });
  const [createShortcut, setCreateShortcut] = useState(false);
  const [onlyOldFiles, setOnlyOldFiles] = useState(false);
  const [results, setResults] = useState<MigrationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const fileTypes = [
    { key: 'video' as const, label: '视频文件', icon: <VideoFile />, exts: '.mp4, .avi, .mov', size: '1.2 GB' },
    { key: 'image' as const, label: '图片文件', icon: <Image />, exts: '.jpg, .png, .bmp', size: '256 MB' },
    { key: 'music' as const, label: '音乐文件', icon: <MusicNote />, exts: '.mp3, .wav, .flac', size: '512 MB' },
    { key: 'document' as const, label: '文档文件', icon: <Description />, exts: '.doc, .pdf, .xls', size: '180 MB' },
  ];

  const handleExecute = () => {
    if (selectedDevices.length === 0) return;
    setIsRunning(true);
    const initial = selectedDevices.map((id) => ({
      deviceId: id, deviceName: allDevices[parseInt(id, 10)], status: 'running' as const,
    }));
    setResults(initial);
    setTimeout(() => {
      setResults(initial.map((r) => ({
        ...r, status: (Math.random() > 0.1 ? 'success' : 'failed') as 'success' | 'failed',
        fileCount: rand(50, 300), dataSize: formatSize(rand(500, 3000)),
      })));
      setIsRunning(false);
    }, 2000);
  };

  return (
    <Box>
      <DeviceSelector selected={selectedDevices} onChange={setSelectedDevices} allDevices={allDevices} />

      <Box className="mb-4">
        <Typography variant="body2" className="font-medium mb-2">磁盘选择</Typography>
        <Box className="flex gap-3 items-center">
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <Select value={sourceDisk} onChange={(e) => setSourceDisk(e.target.value)}>
              {DISK_LABELS.map((d) => <MenuItem key={d} value={d}>{d}\</MenuItem>)}
            </Select>
          </FormControl>
          <Typography variant="body2">→</Typography>
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <Select value={targetDisk} onChange={(e) => setTargetDisk(e.target.value)}>
              {DISK_LABELS.filter((d) => d !== sourceDisk).map((d) => <MenuItem key={d} value={d}>{d}\</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box className="mb-4">
        <Typography variant="body2" className="font-medium mb-2">迁移文件类型</Typography>
        <Box className="space-y-2">
          {fileTypes.map((ft) => (
            <FormControlLabel key={ft.key}
              control={<Checkbox size="small" checked={types[ft.key]} onChange={(e) => setTypes({ ...types, [ft.key]: e.target.checked })} />}
              label={<Box className="flex items-center gap-2">{ft.icon}<Typography variant="body2">{ft.label}</Typography><Typography variant="caption" color="text.secondary">({ft.exts}) 预估：{ft.size}</Typography></Box>}
            />
          ))}
        </Box>
      </Box>

      <Box className="mb-4">
        <FormControlLabel control={<Switch checked={createShortcut} onChange={(e) => setCreateShortcut(e.target.checked)} />}
          label={<Typography variant="body2">迁移完成后在源目录创建快捷方式</Typography>} />
        <FormControlLabel control={<Switch checked={onlyOldFiles} onChange={(e) => setOnlyOldFiles(e.target.checked)} />}
          label={<Typography variant="body2">仅迁移 30 天前的文件</Typography>} />
      </Box>

      <Box className="flex items-center gap-3 mb-4">
        <Button variant="outlined" size="small" startIcon={<Preview />} disabled={selectedDevices.length === 0}>预览</Button>
        <Button variant="contained" size="small" startIcon={<FolderOpen />}
          disabled={selectedDevices.length === 0 || isRunning} onClick={handleExecute}>
          {isRunning ? '迁移中...' : '开始迁移'}
        </Button>
        {isRunning && <LinearProgress sx={{ flex: 1, maxWidth: 200 }} />}
      </Box>

      <MigrationResultTable results={results} />
    </Box>
  );
}

// ─── Tab 3: 磁盘格式化 ───
function DiskFormatPanel() {
  const allDevices = DEVICE_NAMES;
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [targetDisk, setTargetDisk] = useState('D:');
  const [fileSystem, setFileSystem] = useState('NTFS');
  const [volumeLabel, setVolumeLabel] = useState('DATA');
  const [confirm1, setConfirm1] = useState(false);
  const [confirm2, setConfirm2] = useState(false);
  const [results, setResults] = useState<FormatResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleExecute = () => {
    setConfirmDialogOpen(false);
    if (selectedDevices.length === 0) return;
    setIsRunning(true);
    const initial = selectedDevices.map((id) => ({
      deviceId: id, deviceName: allDevices[parseInt(id, 10)], status: 'running' as const,
    }));
    setResults(initial);
    setTimeout(() => {
      setResults(initial.map((r) => ({
        ...r, status: (Math.random() > 0.2 ? 'success' : 'failed') as 'success' | 'failed',
        detail: Math.random() > 0.2 ? '格式化完成' : '设备离线',
      })));
      setIsRunning(false);
    }, 2000);
  };

  const canExecute = selectedDevices.length > 0 && confirm1 && confirm2 && !isRunning;

  return (
    <Box>
      <DeviceSelector selected={selectedDevices} onChange={setSelectedDevices} allDevices={allDevices} />

      <Box className="mb-4">
        <Typography variant="body2" className="font-medium mb-2">
          目标磁盘 <Typography variant="caption" color="warning">（仅显示非系统盘）</Typography>
        </Typography>
        <Box className="flex gap-2 items-center mb-3">
          {DISK_LABELS.filter((d) => d !== 'C:').map((disk) => (
            <Chip key={disk} label={`${disk}\\`}
              onClick={() => setTargetDisk(disk)}
              color={targetDisk === disk ? 'error' : 'default'}
              variant={targetDisk === disk ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
        <Box className="flex gap-3">
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select value={fileSystem} onChange={(e) => setFileSystem(e.target.value)}>
              <MenuItem value="NTFS">NTFS</MenuItem>
              <MenuItem value="FAT32">FAT32</MenuItem>
              <MenuItem value="exFAT">exFAT</MenuItem>
            </Select>
          </FormControl>
          <TextField size="small" label="卷标" value={volumeLabel} onChange={(e) => setVolumeLabel(e.target.value)} sx={{ width: 120 }} />
        </Box>
      </Box>

      <Alert severity="warning" className="mb-4" icon={<Warning />}>
        <Typography variant="body2" className="font-medium">警告：格式化将清除该磁盘上所有数据，操作不可逆！</Typography>
      </Alert>

      <Box className="mb-4">
        <FormControlLabel control={<Checkbox checked={confirm1} onChange={(e) => setConfirm1(e.target.checked)} />}
          label={<Typography variant="body2">我已确认以上风险，并已备份重要数据</Typography>} />
        <FormControlLabel control={<Checkbox checked={confirm2} onChange={(e) => setConfirm2(e.target.checked)} />}
          label={<Typography variant="body2">我了解此操作会清除选中设备指定磁盘的全部数据</Typography>} />
      </Box>

      <Box className="flex items-center gap-3 mb-4">
        <Button variant="outlined" size="small" startIcon={<Preview />} disabled={selectedDevices.length === 0}>预览</Button>
        <Button variant="contained" size="small" color="error" startIcon={<Warning />}
          disabled={!canExecute} onClick={() => setConfirmDialogOpen(true)}>
          {isRunning ? '格式化中...' : '执行格式化'}
        </Button>
        {isRunning && <LinearProgress sx={{ flex: 1, maxWidth: 200 }} />}
      </Box>

      <FormatResultTable results={results} />

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>确认格式化</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            即将对 {selectedDevices.length} 台设备的 {targetDisk}\ 磁盘执行格式化操作，此操作不可逆。确定继续？
          </Typography>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setConfirmDialogOpen(false)} variant="outlined">取消</Button>
          <Button onClick={handleExecute} variant="contained" color="error">确认格式化</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Tab 4: 音频转文字 ───
function AudioTranscribePanel() {
  const [videoFile, setVideoFile] = useState<{ name: string; size: string } | null>(null);
  const [transcribeStatus, setTranscribeStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);

  const handleFileSelect = () => {
    setVideoFile({ name: '数学课_函数讲解.mp4', size: '156 MB' });
    setTranscribeStatus('idle');
    setSegments([]);
  };

  const handleTranscribe = () => {
    if (!videoFile) return;
    setTranscribeStatus('processing');
    setTimeout(() => {
      setSegments([
        { id: 'seg-1', startTime: 0, endTime: 15, text: '今天我们来讲解数学函数的基本概念', deleted: false },
        { id: 'seg-2', startTime: 15, endTime: 32, text: '函数的定义域是指所有可能的输入值的集合', deleted: false },
        { id: 'seg-3', startTime: 32, endTime: 48, text: '接下来我们看一下具体的例题', deleted: false },
        { id: 'seg-4', startTime: 48, endTime: 65, text: '这个例题展示了如何求解函数的定义域', deleted: false },
        { id: 'seg-5', startTime: 65, endTime: 80, text: '我们需要注意定义域的几种特殊情况', deleted: false },
        { id: 'seg-6', startTime: 80, endTime: 95, text: '定义域不能包含使函数无意义的取值', deleted: false },
        { id: 'seg-7', startTime: 95, endTime: 110, text: '比如分母不能为零，根号下不能为负数', deleted: false },
      ]);
      setTranscribeStatus('done');
    }, 2000);
  };

  const handleToggleDelete = (id: string) => {
    setSegments((prev) => prev.map((s) => s.id === id ? { ...s, deleted: !s.deleted } : s));
  };

  const handleTextChange = (id: string, text: string) => {
    setSegments((prev) => prev.map((s) => s.id === id ? { ...s, text } : s));
  };

  const handleConfirmDelete = () => {
    setSegments((prev) => prev.filter((s) => !s.deleted));
  };

  const markedCount = segments.filter((s) => s.deleted).length;
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <Box>
      <Box className="mb-4">
        <Typography variant="body2" className="font-medium mb-2">选择视频文件</Typography>
        <Box className="flex items-center gap-3">
          <Button variant="outlined" size="small" startIcon={<Upload />} onClick={handleFileSelect}>
            选择视频
          </Button>
          <Button variant="outlined" size="small" startIcon={<VideoFile />}
            onClick={() => { setVideoFile(null); setTranscribeStatus('idle'); setSegments([]); }}
            disabled={!videoFile}>
            重新选择
          </Button>
          {videoFile && (
            <Box className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
              <VideoFile sx={{ fontSize: 18, color: '#3b82f6' }} />
              <Typography variant="body2">{videoFile.name}</Typography>
              <Typography variant="caption" color="text.secondary">({videoFile.size})</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {videoFile && (
        <Box className="mb-4 p-6 bg-gray-900 rounded-lg text-white text-center">
          <Box sx={{ fontSize: 48, mb: 1, opacity: 0.7 }}>▶</Box>
          <Typography variant="body2">{videoFile.name}</Typography>
          <Typography variant="caption" color="text.secondary">模拟视频播放器区域</Typography>
        </Box>
      )}

      {videoFile && transcribeStatus !== 'done' && (
        <Box className="mb-4">
          <Button variant="contained" startIcon={<Mic />}
            onClick={handleTranscribe} disabled={transcribeStatus === 'processing'}>
            {transcribeStatus === 'processing' ? '正在提取转写...' : '提取音频并转文字'}
          </Button>
          {transcribeStatus === 'processing' && <LinearProgress className="mt-2" />}
        </Box>
      )}

      {transcribeStatus === 'done' && segments.length > 0 && (
        <Box>
          <Box className="flex items-center justify-between mb-3">
            <Typography variant="subtitle2" className="font-bold">转写结果</Typography>
            <Box className="flex gap-2">
              {markedCount > 0 && (
                <Button variant="contained" size="small" color="error" onClick={handleConfirmDelete}>
                  确认删除片段 ({markedCount})
                </Button>
              )}
              <Button variant="outlined" size="small" startIcon={<Download />}>导出文字</Button>
            </Box>
          </Box>
          <Paper variant="outlined" sx={{ borderRadius: 2 }}>
            {segments.map((seg) => (
              <Box key={seg.id}
                className={`flex items-start gap-3 p-3 border-b border-gray-100 last:border-b-0 transition-colors ${seg.deleted ? 'bg-red-50 line-through opacity-60' : 'hover:bg-gray-50'}`}
              >
                <Typography variant="caption" className="font-mono text-gray-500 min-w-[70px] pt-1">
                  {formatTime(seg.startTime)} - {formatTime(seg.endTime)}
                </Typography>
                <TextField
                  size="small" variant="standard" fullWidth multiline
                  value={seg.text}
                  onChange={(e) => handleTextChange(seg.id, e.target.value)}
                  sx={{ '& .MuiInput-root:before': { borderBottom: 'none' } }}
                  disabled={seg.deleted}
                />
                <Tooltip title={seg.deleted ? '撤销删除' : '标记删除'}>
                  <IconButton size="small" onClick={() => handleToggleDelete(seg.id)}
                    color={seg.deleted ? 'primary' : 'default'}>
                    {seg.deleted ? <CheckCircle fontSize="small" /> : <Close fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Paper>
        </Box>
      )}
    </Box>
  );
}

export default function SecurityPolicy() {
  const [tab, setTab] = useState(0);

  return (
    <Box className="overflow-auto h-[calc(100vh-64px)] bg-gray-50">
      <Box className="p-4 sm:p-6">
        <Box className="mb-6">
          <Typography variant="h5" className="font-bold">🔒 安全策略</Typography>
          <Typography variant="body2" color="text.secondary" className="mt-1">
            配置和管理教室终端的安全策略与维护操作
          </Typography>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="🧹 磁盘清理" />
          <Tab label="📂 文件迁移" />
          <Tab label="⚠️ 磁盘格式化" />
          <Tab label="🎙️ 音频转文字" />
        </Tabs>

        {tab === 0 && <DiskCleanupPanel />}
        {tab === 1 && <FileMigrationPanel />}
        {tab === 2 && <DiskFormatPanel />}
        {tab === 3 && <AudioTranscribePanel />}
      </Box>
    </Box>
  );
}
