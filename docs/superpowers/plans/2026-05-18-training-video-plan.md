# 培训视频功能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在教学管理系统中增加培训视频模块，包含前端点播列表页、视频播放页、管理端CRUD页

**Architecture:** 三个独立组件 + App.tsx 菜单/路由集成。沿用现有的 CloudClassroom 卡片网格和弹窗交互模式，管理端采用表格 + 弹窗的 CRUD 布局。

**Tech Stack:** React + MUI + Tailwind CSS

---

### Task 1: 创建数据模型和 TrainingVideo 组件

**Files:**
- Create: `src/app/components/TrainingVideo.tsx`
- Modify: `src/app/App.tsx:77`

#### Step 1: 创建 TrainingVideo.tsx — 前端视频列表页

在 `src/app/components/TrainingVideo.tsx` 创建前端培训视频列表组件：

```typescript
import { useState } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, Chip,
  TextField,
} from '@mui/material';
import {
  Videocam, Search, PlayArrow, AccessTime,
} from '@mui/icons-material';

export interface TrainingVideo {
  id: string;
  title: string;
  description: string;
  module: string;
  duration: string;
  uploadDate: string;
  status: 'published' | 'draft';
  videoUrl?: string;
}

const moduleGradients: Record<string, string> = {
  '模板管理': 'from-blue-100 to-blue-50',
  '教师管理': 'from-green-100 to-green-50',
  '学校管理': 'from-purple-100 to-purple-50',
  '校本资源': 'from-yellow-100 to-yellow-50',
  '听评课': 'from-pink-100 to-pink-50',
  '云课堂': 'from-cyan-100 to-cyan-50',
  '集控管理': 'from-orange-100 to-orange-50',
};

const defaultVideos: TrainingVideo[] = [
  {
    id: '1',
    title: '模板管理功能介绍',
    description: '了解如何使用模板管理功能上传和管理课件、教案、评分表模板。',
    module: '模板管理',
    duration: '5:30',
    uploadDate: '2026-05-15',
    status: 'published',
  },
  {
    id: '2',
    title: '听评课功能使用指南',
    description: '学习如何创建听评课、进行课堂评价、查看评分记录。',
    module: '听评课',
    duration: '8:15',
    uploadDate: '2026-05-14',
    status: 'published',
  },
  {
    id: '3',
    title: '云课堂操作说明',
    description: '掌握云课堂的视频上传、审核和点播全流程操作。',
    module: '云课堂',
    duration: '12:00',
    uploadDate: '2026-05-13',
    status: 'published',
  },
  {
    id: '4',
    title: '集控管理使用教程',
    description: '学习使用教室管理和实时流功能进行集中控制。',
    module: '集控管理',
    duration: '6:45',
    uploadDate: '2026-05-12',
    status: 'published',
  },
  {
    id: '5',
    title: '教师管理功能介绍',
    description: '了解如何添加、编辑和管理教师账号信息。',
    module: '教师管理',
    duration: '4:20',
    uploadDate: '2026-05-11',
    status: 'draft',
  },
];

interface Props {
  onOpenPlay: (video: TrainingVideo) => void;
}

export default function TrainingVideo({ onOpenPlay }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  // 只显示已上架的视频
  const [videos] = useState(defaultVideos);

  const filtered = videos.filter((v) => {
    if (v.status !== 'published') return false;
    if (searchTerm && !v.title.includes(searchTerm) && !v.description.includes(searchTerm)) return false;
    return true;
  });

  return (
    <Box className="p-6">
      {/* 标题栏 */}
      <Box className="mb-6">
        <Typography variant="h5" className="font-bold">培训视频</Typography>
        <Typography variant="body2" color="text.secondary" className="mt-1">
          平台功能介绍教学视频
        </Typography>
      </Box>

      {/* 搜索框 */}
      <Box className="mb-6">
        <TextField
          size="small"
          placeholder="搜索培训视频..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search fontSize="small" className="mr-1 text-gray-400" />,
          }}
          className="w-full md:w-96"
        />
      </Box>

      {/* 视频网格 */}
      {filtered.length === 0 ? (
        <Box className="text-center py-16">
          <Videocam className="text-6xl text-gray-300 mb-4" />
          <Typography variant="h6" color="text.secondary">暂无培训视频</Typography>
          <Typography variant="body2" color="text.secondary" className="mt-2">
            暂无已发布的培训视频
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filtered.map((video) => (
            <Grid item xs={12} sm={6} md={4} key={video.id}>
              <Card
                className="h-full hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => onOpenPlay(video)}
              >
                <Box
                  className={`h-36 bg-gradient-to-br ${moduleGradients[video.module] || 'from-gray-100 to-gray-50'} flex items-center justify-center relative`}
                >
                  <Box className="text-center">
                    <Videocam className="text-4xl opacity-30" />
                  </Box>
                  {/* 播放按钮悬浮层 */}
                  <Box className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                    <Box className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayArrow className="text-gray-800 ml-0.5" />
                    </Box>
                  </Box>
                  <Chip
                    label={video.duration}
                    size="small"
                    icon={<AccessTime fontSize="small" />}
                    className="absolute bottom-2 right-2 bg-black/60 text-white"
                    sx={{ height: 22, '& .MuiChip-label': { px: 0.8, fontSize: 11 }, '& .MuiChip-icon': { fontSize: 12, color: 'white' } }}
                  />
                </Box>
                <CardContent className="p-3">
                  <Typography variant="subtitle2" className="font-semibold truncate mb-1">
                    {video.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" className="line-clamp-2 block mb-2">
                    {video.description}
                  </Typography>
                  <Box className="flex items-center gap-1.5">
                    <Chip label={video.module} size="small" variant="outlined" color="primary"
                      sx={{ height: 20, '& .MuiChip-label': { px: 0.6, fontSize: 10 } }} />
                    <Typography variant="caption" color="text.secondary">{video.uploadDate}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
```

#### Step 2: 验证编译

Run: `npx vite build`
Expected: Build succeeds without errors

#### Step 3: Commit

```bash
git add src/app/components/TrainingVideo.tsx
git commit -m "feat: add TrainingVideo component with video list page"
```

---

### Task 2: 创建 TrainingVideoPlay 组件

**Files:**
- Create: `src/app/components/TrainingVideoPlay.tsx`

#### Step 1: 创建 TrainingVideoPlay.tsx — 视频播放页

```typescript
import { useState } from 'react';
import {
  Box, Typography, IconButton, Chip, PlayArrow, Pause,
} from '@mui/material';
import {
  ArrowBack, VolumeUp, Fullscreen,
} from '@mui/icons-material';
import type { TrainingVideo } from './TrainingVideo';

interface Props {
  video: TrainingVideo;
  onBack: () => void;
}

export default function TrainingVideoPlay({ video, onBack }: Props) {
  const [playing, setPlaying] = useState(false);

  return (
    <Box className="flex flex-col bg-white" sx={{ height: 'calc(100vh - 57px)' }}>
      {/* 头部 */}
      <Box className="border-b border-gray-200 py-3 px-6 flex items-center gap-3 bg-white shrink-0">
        <IconButton onClick={onBack} size="small" className="text-gray-600">
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" className="font-bold truncate">
          {video.title}
        </Typography>
        <Chip label={video.module} size="small" color="primary" variant="outlined" />
      </Box>

      {/* 主体 */}
      <Box className="flex-1 overflow-auto p-6">
        {/* 视频播放器 */}
        <Box className="max-w-4xl mx-auto">
          <Box className="bg-black rounded-xl overflow-hidden mb-6">
            <Box className="aspect-video flex items-center justify-center text-white">
              <Box className="text-center">
                <Box className="mb-3 text-gray-500 text-8xl flex justify-center">
                  <PlayArrow fontSize="inherit" />
                </Box>
                <Typography variant="h6" className="text-gray-400">
                  {video.title}
                </Typography>
                <Typography variant="body2" className="text-gray-600 mt-1">
                  视频播放区域
                </Typography>
              </Box>
            </Box>
            {/* 控制栏 */}
            <Box className="bg-gray-900 px-4 py-2 flex items-center gap-3">
              <IconButton size="small" className="text-white" onClick={() => setPlaying(!playing)}>
                {playing ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
              </IconButton>
              <Box className="flex-1 h-1 bg-gray-700 rounded-full relative">
                <Box className="h-full w-0 bg-blue-500 rounded-full" />
              </Box>
              <Typography variant="caption" className="text-gray-400 min-w-[80px] text-right font-mono">
                00:00 / {video.duration}
              </Typography>
              <IconButton size="small" className="text-white"><VolumeUp fontSize="small" /></IconButton>
              <IconButton size="small" className="text-white"><Fullscreen fontSize="small" /></IconButton>
            </Box>
          </Box>

          {/* 视频信息 */}
          <Box>
            <Typography variant="h5" className="font-bold mb-2">{video.title}</Typography>
            <Box className="flex items-center gap-2 mb-3 flex-wrap">
              <Chip label={video.module} size="small" color="primary" variant="outlined" />
              <Typography variant="caption" color="text.secondary">
                时长：{video.duration}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                上传：{video.uploadDate}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" className="leading-relaxed">
              {video.description}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
```

#### Step 2: 验证编译

Run: `npx vite build`
Expected: Build succeeds

#### Step 3: Commit

```bash
git add src/app/components/TrainingVideoPlay.tsx
git commit -m "feat: add TrainingVideoPlay component for video playback"
```

---

### Task 3: 创建 TrainingVideoManagement 组件

**Files:**
- Create: `src/app/components/TrainingVideoManagement.tsx`

#### Step 1: 创建 TrainingVideoManagement.tsx — 管理端 CRUD 页

```typescript
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
```

#### Step 2: 验证编译

Run: `npx vite build`
Expected: Build succeeds

#### Step 3: Commit

```bash
git add src/app/components/TrainingVideoManagement.tsx
git commit -m "feat: add TrainingVideoManagement with CRUD and publish/draft toggle"
```

---

### Task 4: 集成到 App.tsx — 菜单和路由

**Files:**
- Modify: `src/app/App.tsx`

#### Step 1: 添加导入和新页面状态

在 `App.tsx` 顶部导入区域添加：

```typescript
import TrainingVideo from './components/TrainingVideo';
import TrainingVideoPlay from './components/TrainingVideoPlay';
import TrainingVideoManagement from './components/TrainingVideoManagement';
```

在 `currentPage` 的类型联合中添加：
```typescript
'training-video' | 'training-video-play' | 'training-video-mgmt'
```

在 `menuItems` 数组中添加两个一级菜单项（在"云课堂"和"集控管理"之间）：
```typescript
{ id: 'training-video', label: '培训视频', icon: <Videocam /> },
{ id: 'training-video-mgmt', label: '培训视频管理', icon: <Videocam /> },
```

添加 state：
```typescript
const [trainingVideoDetail, setTrainingVideoDetail] = useState<TrainingVideo | null>(null);
```

添加事件处理函数：
```typescript
const handleOpenTrainingPlay = (video: TrainingVideo) => {
  setTrainingVideoDetail(video);
  setCurrentPage('training-video-play');
};
```

在渲染区域的条件分支中添加三个新的页面路由分支（放在 livestream 和 template 之间）：
```typescript
) : currentPage === 'training-video' ? (
  <TrainingVideo onOpenPlay={handleOpenTrainingPlay} />
) : currentPage === 'training-video-play' && trainingVideoDetail ? (
  <TrainingVideoPlay
    video={trainingVideoDetail}
    onBack={() => setCurrentPage('training-video')}
  />
) : currentPage === 'training-video-mgmt' ? (
  <TrainingVideoManagement />
) :
```

#### Step 2: 验证编译

Run: `npx vite build`
Expected: Build succeeds

#### Step 3: Commit

```bash
git add src/app/App.tsx
git commit -m "feat: integrate training video pages into navigation and routing"
```

---

### Task 5: 功能验证

#### Step 1: 启动开发服务器并验证

Run: `npx vite build`
Expected: 编译成功

#### Step 2: 验证点

- 导航栏显示"培训视频"和"培训视频管理"两个一级菜单项
- 点击"培训视频"显示视频卡片网格，可搜索
- 点击视频卡片进入播放页，播放页可返回
- 点击"培训视频管理"显示表格，可上传/编辑/删除/上下架
- 管理端的上下架操作直接影响前端列表的可见性
