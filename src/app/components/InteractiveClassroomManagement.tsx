import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, IconButton, Chip, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Paper,
} from '@mui/material';
import {
  Add, Search, Edit, Delete, Close, Videocam, School, People, Share, ContentCopy, OpenInNew, PlayArrow, Cast,
} from '@mui/icons-material';
import QRCode from 'qrcode';
import LiveSessionOverlay from './LiveSessionOverlay';

interface Classroom {
  id: string;
  name: string;
  teacher: string;
  subject: string;
  grade: string;
  createdAt: string;
  status: 'live' | 'ended' | 'scheduled';
  studentCount: number;
}

const subjectOptions = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];
const gradeOptions = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '高一', '高二', '高三'];

function generateMockData(): Classroom[] {
  const teachers = ['张老师', '李老师', '王老师', '陈老师', '刘老师', '赵老师'];
  const names = [
    '函数与极限', '古诗词鉴赏', '语法基础', '力学实验', '元素周期表',
    '细胞结构', '辛亥革命', '大气环流', '三角函数', '文言文阅读',
    '现在完成时', '牛顿定律', '氧化还原反应', '生态系统', '电路分析',
    '立体几何', '散文阅读', '被动语态', '电磁感应', '有机化学',
  ];
  const statuses: Classroom['status'][] = ['live', 'ended', 'scheduled'];

  return Array.from({ length: 35 }, (_, i) => ({
    id: `c${i + 1}`,
    name: names[i % names.length],
    teacher: teachers[i % teachers.length],
    subject: subjectOptions[i % subjectOptions.length],
    grade: gradeOptions[i % gradeOptions.length],
    createdAt: new Date(2026, 4, 1 + i).toISOString().split('T')[0],
    status: statuses[i % statuses.length],
    studentCount: 10 + Math.floor(Math.random() * 35),
  }));
}

export default function InteractiveClassroomManagement() {
  const [classrooms] = useState(generateMockData);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', teacher: '', subject: '', grade: '' });
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareClassroom, setShareClassroom] = useState<Classroom | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [startCastClassroom, setStartCastClassroom] = useState<Classroom | null>(null);
  const [liveSession, setLiveSession] = useState<{ name: string; videoDeviceId?: string } | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);

  const stopPreview = () => {
    if (previewStreamRef.current) {
      previewStreamRef.current.getTracks().forEach(t => t.stop());
      previewStreamRef.current = null;
    }
  };

  const startPreview = async (deviceId: string) => {
    stopPreview();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });
      previewStreamRef.current = stream;
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
      }
    } catch {
      // 无法启动预览
    }
  };

  // 打开投屏弹窗时枚举视频设备
  useEffect(() => {
    if (!startCastClassroom) {
      stopPreview();
      return;
    }
    // 先请求一次权限才能获取设备标签
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      stream.getTracks().forEach(t => t.stop());
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const vids = devices.filter(d => d.kind === 'videoinput');
        setVideoDevices(vids);
        if (vids.length > 0) {
          setSelectedVideoDevice(vids[0].deviceId);
          startPreview(vids[0].deviceId);
        }
      });
    }).catch(() => {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const vids = devices.filter(d => d.kind === 'videoinput');
        setVideoDevices(vids);
        if (vids.length > 0) {
          setSelectedVideoDevice(vids[0].deviceId);
          startPreview(vids[0].deviceId);
        }
      });
    });
  }, [startCastClassroom]);

  // 切换选中的视频源时更新预览
  useEffect(() => {
    if (selectedVideoDevice && startCastClassroom) {
      startPreview(selectedVideoDevice);
    }
  }, [selectedVideoDevice]);

  useEffect(() => {
    if (shareClassroom) {
      const url = `https://live.example.com/classroom/${shareClassroom.id}`;
      QRCode.toDataURL(url, { width: 192, margin: 2 }).then(setQrDataUrl);
    }
  }, [shareClassroom]);

  const statusLabel: Record<Classroom['status'], string> = { live: '直播中', ended: '已结束', scheduled: '待开始' };
  const statusColor: Record<Classroom['status'], 'success' | 'default' | 'warning'> = { live: 'success', ended: 'default', scheduled: 'warning' };

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return classrooms;
    const q = searchTerm.toLowerCase();
    return classrooms.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.teacher.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q)
    );
  }, [classrooms, searchTerm]);

  const displayedRows = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getShareUrl = (c: Classroom) => `https://live.example.com/classroom/${c.id}`;

  const handleCopyLink = (c: Classroom) => {
    navigator.clipboard.writeText(getShareUrl(c)).catch(() => {});
  };

  const handleCreate = () => {
    if (!createForm.name || !createForm.teacher || !createForm.subject || !createForm.grade) return;
    setCreateForm({ name: '', teacher: '', subject: '', grade: '' });
    setCreateOpen(false);
  };

  return (
    <Box className="p-6">
      {/* 标题栏 */}
      <Box className="mb-6 flex items-center justify-between">
        <Box>
          <Typography variant="h5" className="font-bold">互动课堂管理</Typography>
          <Typography variant="body2" color="text.secondary" className="mt-1">
            管理所有互动课堂的创建、查看和检索
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
          创建课堂
        </Button>
      </Box>

      {/* 搜索栏 */}
      <Box className="mb-4">
        <TextField
          size="small" placeholder="搜索课堂名称、教师、学科..." value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" className="text-gray-400" /></InputAdornment> }}
          className="w-full md:w-80"
        />
      </Box>

      {/* 表格 */}
      <TableContainer component={Paper} className="rounded-xl shadow-sm border border-gray-200">
        <Table>
          <TableHead>
            <TableRow className="bg-gray-50">
              <TableCell className="font-semibold text-gray-600">课堂名称</TableCell>
              <TableCell className="font-semibold text-gray-600">授课教师</TableCell>
              <TableCell className="font-semibold text-gray-600">学科</TableCell>
              <TableCell className="font-semibold text-gray-600">年级</TableCell>
              <TableCell className="font-semibold text-gray-600">创建日期</TableCell>
              <TableCell className="font-semibold text-gray-600">状态</TableCell>
              <TableCell className="font-semibold text-gray-600">学生人数</TableCell>
              <TableCell className="font-semibold text-gray-600" align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                  <Videocam className="text-4xl mb-2" />
                  <Typography variant="body2">暂无课堂数据</Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayedRows.map((c) => (
                <TableRow key={c.id} className="hover:bg-gray-50">
                  <TableCell>
                    <Box className="flex items-center gap-2">
                      <Videocam fontSize="small" className="text-blue-500" />
                      <Typography variant="body2" className="font-medium">{c.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box className="flex items-center gap-1">
                      <School fontSize="small" className="text-gray-400" />
                      {c.teacher}
                    </Box>
                  </TableCell>
                  <TableCell>{c.subject}</TableCell>
                  <TableCell>{c.grade}</TableCell>
                  <TableCell>{c.createdAt}</TableCell>
                  <TableCell>
                    <Chip label={statusLabel[c.status]} size="small" color={statusColor[c.status]}
                      variant="filled" sx={{ height: 22, '& .MuiChip-label': { px: 0.8, fontSize: 11 } }} />
                  </TableCell>
                  <TableCell>
                    <Box className="flex items-center gap-1">
                      <People fontSize="small" className="text-gray-400" /> {c.studentCount}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {c.status === 'scheduled' && (
                      <Button size="small" variant="contained" color="success"
                        startIcon={<PlayArrow />}
                        onClick={() => setStartCastClassroom(c)}
                        sx={{ mr: 1, height: 28, fontSize: 12 }}>
                        开始直播
                      </Button>
                    )}
                    <IconButton size="small" className="text-gray-400" title="分享"
                      onClick={() => { setShareClassroom(c); setShareDialogOpen(true); }}>
                      <Share fontSize="small" />
                    </IconButton>
                    <IconButton size="small" className="text-gray-400" title="编辑"><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" className="text-gray-400" title="删除"><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 分页 */}
      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        labelRowsPerPage="每页行数："
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共 ${count}`}
        className="border-t border-gray-200"
      />

      {/* 投屏确认弹窗 */}
      <Dialog open={Boolean(startCastClassroom)} onClose={() => setStartCastClassroom(null)} maxWidth="sm" fullWidth>
        <DialogTitle className="border-b">
          <Box className="flex items-center justify-between">
            <Typography variant="h6">准备投屏直播</Typography>
            <IconButton onClick={() => setStartCastClassroom(null)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {startCastClassroom && (
            <Box className="py-6 flex flex-col items-center gap-4">
              <Box className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                <Cast className="text-blue-600" sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="h6" className="font-semibold">{startCastClassroom.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {startCastClassroom.teacher} · {startCastClassroom.subject} · {startCastClassroom.grade}
              </Typography>

              {/* 视频源选择 */}
              <Box className="w-full">
                <Typography variant="subtitle2" className="font-semibold mb-2">
                  选择视频源
                </Typography>

                {/* 实时预览 */}
                {videoDevices.length > 0 && (
                  <Box className="relative bg-black rounded-lg overflow-hidden mb-3" sx={{ aspectRatio: '16/9' }}>
                    <video ref={previewVideoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
                    {!previewStreamRef.current && (
                      <Box className="absolute inset-0 flex items-center justify-center text-gray-500">
                        <Videocam sx={{ fontSize: 40 }} />
                      </Box>
                    )}
                  </Box>
                )}

                <Box className="flex flex-col gap-2">
                  {videoDevices.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" className="text-center py-3">
                      未检测到摄像头设备
                    </Typography>
                  ) : (
                    videoDevices.map((device, index) => (
                      <Box
                        key={device.deviceId}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedVideoDevice === device.deviceId
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => setSelectedVideoDevice(device.deviceId)}
                      >
                        <Box className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedVideoDevice === device.deviceId
                            ? 'border-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedVideoDevice === device.deviceId && (
                            <Box className="w-3 h-3 rounded-full bg-blue-500" />
                          )}
                        </Box>
                        <Videocam fontSize="small" className="text-gray-400 shrink-0" />
                        <Box>
                          <Typography variant="body2" className="font-medium">
                            {device.label || `摄像头 ${index + 1}`}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" className="text-center">
                即将开始直播投屏，画面将显示电脑桌面内容。
              </Typography>
              <Button variant="contained" size="large" fullWidth
                startIcon={<Cast />}
                onClick={() => {
                  const session: { name: string; videoDeviceId?: string } = { name: startCastClassroom.name };
                  if (selectedVideoDevice) session.videoDeviceId = selectedVideoDevice;
                  // 先关闭弹窗停止预览，再启动直播
                  setStartCastClassroom(null);
                  setTimeout(() => setLiveSession(session), 300);
                }}
                sx={{ py: 1.5, borderRadius: 2, fontSize: 16 }}>
                开始投屏
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* 分享弹窗 */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="border-b">
          <Box className="flex items-center justify-between">
            <Typography variant="h6">分享课堂</Typography>
            <IconButton onClick={() => setShareDialogOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {shareClassroom && (
            <Box className="py-6 flex flex-col items-center gap-4">
              <Typography variant="subtitle1" className="font-semibold">{shareClassroom.name}</Typography>
              <Typography variant="body2" color="text.secondary">{shareClassroom.teacher} · {shareClassroom.subject}</Typography>
              {/* 二维码 */}
              <Box className="w-48 h-48 bg-white rounded-xl flex items-center justify-center border border-gray-200">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-full h-full" />
                ) : (
                  <Typography variant="caption" color="text.secondary">生成中...</Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" className="text-center">
                扫码加入互动课堂
              </Typography>
              {/* 链接 */}
              <Box className="w-full p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                <Typography variant="body2" className="flex-1 truncate text-gray-600 font-mono text-sm">
                  {getShareUrl(shareClassroom)}
                </Typography>
                <Button size="small" variant="outlined" startIcon={<ContentCopy />}
                  onClick={() => handleCopyLink(shareClassroom)}>
                  复制
                </Button>
              </Box>
              <Button variant="contained" startIcon={<OpenInNew />} fullWidth
                onClick={() => { setShareDialogOpen(false); }}>
                进入课堂
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setShareDialogOpen(false)} variant="outlined">关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 创建课堂弹窗 */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="border-b">
          <Box className="flex items-center justify-between">
            <Typography variant="h6">创建互动课堂</Typography>
            <IconButton onClick={() => setCreateOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box className="py-4 flex flex-col gap-4">
            <TextField fullWidth size="small" label="课堂名称" value={createForm.name}
              onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="请输入课堂名称" />
            <TextField fullWidth size="small" label="授课教师" value={createForm.teacher}
              onChange={(e) => setCreateForm(f => ({ ...f, teacher: e.target.value }))} placeholder="请输入教师姓名" />
            <Box className="flex gap-3">
              <FormControl fullWidth size="small">
                <InputLabel>学科</InputLabel>
                <Select value={createForm.subject} label="学科"
                  onChange={(e) => setCreateForm(f => ({ ...f, subject: e.target.value }))}>
                  {subjectOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>年级</InputLabel>
                <Select value={createForm.grade} label="年级"
                  onChange={(e) => setCreateForm(f => ({ ...f, grade: e.target.value }))}>
                  {gradeOptions.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setCreateOpen(false)} variant="outlined">取消</Button>
          <Button onClick={handleCreate} variant="contained"
            disabled={!createForm.name || !createForm.teacher || !createForm.subject || !createForm.grade}>
            创建
          </Button>
        </DialogActions>
      </Dialog>

      {liveSession && (
        <LiveSessionOverlay
          classroomName={liveSession.name}
          videoDeviceId={liveSession.videoDeviceId}
          onClose={() => setLiveSession(null)}
        />
      )}
    </Box>
  );
}
