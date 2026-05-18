import { useState } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  FormControl, InputLabel, Select,
} from '@mui/material';
import {
  Add, Search, Edit, Delete, CloudUpload, Close, Videocam,
} from '@mui/icons-material';
import type { TrainingVideo } from './TrainingVideo';

const moduleOptions = ['模板管理', '教师管理', '学校管理', '校本资源', '听评课', '云课堂', '集控管理'];

// 从 localStorage 或使用默认数据
function loadVideos(): TrainingVideo[] {
  try {
    const saved = localStorage.getItem('training-videos');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [
    { id: '1', title: '模板管理功能介绍', description: '了解如何使用模板管理功能。', module: '模板管理', duration: '5:30', uploadDate: '2026-05-15', status: 'published' },
    { id: '2', title: '听评课功能使用指南', description: '学习如何创建听评课。', module: '听评课', duration: '8:15', uploadDate: '2026-05-14', status: 'published' },
    { id: '3', title: '云课堂操作说明', description: '掌握云课堂全流程操作。', module: '云课堂', duration: '12:00', uploadDate: '2026-05-13', status: 'published' },
    { id: '4', title: '集控管理使用教程', description: '学习教室管理实时流功能。', module: '集控管理', duration: '6:45', uploadDate: '2026-05-12', status: 'published' },
    { id: '5', title: '教师管理功能介绍', description: '了解如何管理教师账号信息。', module: '教师管理', duration: '4:20', uploadDate: '2026-05-11', status: 'draft' },
  ];
}

function saveVideos(videos: TrainingVideo[]) {
  localStorage.setItem('training-videos', JSON.stringify(videos));
}

export default function TrainingVideoManagement() {
  const [videos, setVideos] = useState<TrainingVideo[]>(loadVideos);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<TrainingVideo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrainingVideo | null>(null);
  const [form, setForm] = useState({ title: '', module: '', description: '' });

  const filtered = videos.filter((v) =>
    v.title.includes(searchTerm) || v.module.includes(searchTerm)
  );

  const resetForm = () => setForm({ title: '', module: '', description: '' });

  const openUpload = () => {
    setEditingVideo(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (video: TrainingVideo) => {
    setEditingVideo(video);
    setForm({ title: video.title, module: video.module, description: video.description });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title || !form.module) return;
    const now = new Date().toISOString().split('T')[0];
    if (editingVideo) {
      setVideos((prev) => {
        const next = prev.map((v) =>
          v.id === editingVideo.id
            ? { ...v, title: form.title, module: form.module, description: form.description }
            : v
        );
        saveVideos(next);
        return next;
      });
    } else {
      const newVideo: TrainingVideo = {
        id: Date.now().toString(),
        title: form.title,
        description: form.description,
        module: form.module,
        duration: '00:00',
        uploadDate: now,
        status: 'draft',
      };
      setVideos((prev) => {
        const next = [newVideo, ...prev];
        saveVideos(next);
        return next;
      });
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setVideos((prev) => {
      const next = prev.filter((v) => v.id !== deleteTarget.id);
      saveVideos(next);
      return next;
    });
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  const toggleStatus = (video: TrainingVideo) => {
    setVideos((prev) => {
      const next = prev.map((v) =>
        v.id === video.id
          ? { ...v, status: v.status === 'published' ? 'draft' : 'published' }
          : v
      );
      saveVideos(next);
      return next;
    });
  };

  return (
    <Box className="p-6">
      {/* 标题栏 */}
      <Box className="mb-6 flex items-center justify-between">
        <Box>
          <Typography variant="h5" className="font-bold">培训视频管理</Typography>
          <Typography variant="body2" color="text.secondary" className="mt-1">
            管理平台培训视频的上传、发布和下架
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openUpload}>
          上传视频
        </Button>
      </Box>

      {/* 搜索 */}
      <Box className="mb-4">
        <TextField
          size="small" placeholder="搜索视频标题..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <Search fontSize="small" className="mr-1 text-gray-400" /> }}
          className="w-full md:w-80"
        />
      </Box>

      {/* 视频表格 */}
      <TableContainer component={Paper} variant="outlined" className="rounded-xl">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>标题</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>所属模块</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>状态</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>上传时间</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((video) => (
              <TableRow key={video.id} hover>
                <TableCell>
                  <Box className="flex items-center gap-2">
                    <Videocam fontSize="small" className="text-gray-400" />
                    <Typography variant="body2" className="font-medium">{video.title}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={video.module} size="small" variant="outlined" color="primary"
                    sx={{ height: 20, '& .MuiChip-label': { px: 0.6, fontSize: 10 } }} />
                </TableCell>
                <TableCell>
                  <Chip
                    label={video.status === 'published' ? '已上架' : '已下架'}
                    size="small"
                    color={video.status === 'published' ? 'success' : 'default'}
                    variant="outlined"
                    sx={{ height: 20, '& .MuiChip-label': { px: 0.6, fontSize: 10 } }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">{video.uploadDate}</Typography>
                </TableCell>
                <TableCell>
                  <Box className="flex gap-1">
                    <IconButton size="small" onClick={() => openEdit(video)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => { setDeleteTarget(video); setDeleteConfirmOpen(true); }}>
                      <Delete fontSize="small" className="text-red-500" />
                    </IconButton>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => toggleStatus(video)}
                      sx={{ fontSize: 11, minWidth: 'auto', px: 1 }}
                    >
                      {video.status === 'published' ? '下架' : '上架'}
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">暂无数据</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 上传/编辑弹窗 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="border-b">
          <Box className="flex items-center justify-between">
            <Typography variant="h6">{editingVideo ? '编辑培训视频' : '上传培训视频'}</Typography>
            <IconButton onClick={() => setDialogOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box className="py-4 flex flex-col gap-4">
            <TextField fullWidth size="small" label="视频标题" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="请输入视频标题" />
            <FormControl fullWidth size="small">
              <InputLabel>所属模块</InputLabel>
              <Select value={form.module} label="所属模块"
                onChange={(e) => setForm({ ...form, module: e.target.value })}>
                {moduleOptions.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField fullWidth size="small" label="视频描述" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="请输入视频描述" multiline rows={3} />
            {!editingVideo && (
              <Button variant="outlined" component="label" startIcon={<CloudUpload />}
                className="h-12 justify-start px-4" sx={{ textTransform: 'none', borderStyle: 'dashed' }}>
                <Typography variant="body2" color="text.secondary">选择视频文件</Typography>
                <input type="file" hidden accept="video/*" />
              </Button>
            )}
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setDialogOpen(false)} variant="outlined">取消</Button>
          <Button onClick={handleSave} variant="contained" disabled={!form.title || !form.module}>
            {editingVideo ? '保存修改' : '确定上传'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            确定要删除「{deleteTarget?.title}」吗？此操作不可撤销。
          </Typography>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setDeleteConfirmOpen(false)} variant="outlined">取消</Button>
          <Button onClick={handleDelete} variant="contained" color="error">删除</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
