# 听评课详情弹窗 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在听评课列表页点击"查看"按钮时，打开一个大尺寸详情弹窗，包含视频流区域（支持切换老师/学生/白板）和内容预览区域（课件/教案页签+文档预览）

**Architecture:** 新增 3 个组件（VideoStreamPanel、ContentPreview、LectureEvaluationDetail），修改 LectureEvaluation.tsx 替换原有的查看弹窗。组件采用自上而下的数据流，LectureEvaluation 传递选中的课程数据给详情弹窗。

**Tech Stack:** React 18, TypeScript, MUI v7, Tailwind CSS 4

---

### Task 1: 创建 VideoStreamPanel 组件

**Files:**
- Create: `src/app/components/VideoStreamPanel.tsx`

- [ ] **Step 1: 创建组件文件**

```tsx
import { useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Slider,
} from '@mui/material';
import {
  Videocam,
  Person,
  Group,
  Computer,
  PlayArrow,
  Pause,
  VolumeUp,
  Fullscreen,
} from '@mui/icons-material';

type StreamSource = 'teacher' | 'student' | 'whiteboard';

const streamConfig: Record<StreamSource, { label: string; icon: React.ReactNode }> = {
  teacher: { label: '老师画面', icon: <Person sx={{ fontSize: 80 }} /> },
  student: { label: '学生画面', icon: <Group sx={{ fontSize: 80 }} /> },
  whiteboard: { label: '白板画面', icon: <Computer sx={{ fontSize: 80 }} /> },
};

export default function VideoStreamPanel() {
  const [source, setSource] = useState<StreamSource>('teacher');
  const [playing, setPlaying] = useState(false);

  const config = streamConfig[source];

  return (
    <Box className="h-full flex flex-col">
      {/* 切换栏 */}
      <Box className="mb-3 flex items-center justify-between">
        <Typography variant="subtitle1" className="font-semibold">
          视频流
        </Typography>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={source}
            onChange={(e) => setSource(e.target.value as StreamSource)}
          >
            <MenuItem value="teacher">老师</MenuItem>
            <MenuItem value="student">学生</MenuItem>
            <MenuItem value="whiteboard">白板</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 播放器区域 */}
      <Box className="flex-1 bg-black rounded-xl flex flex-col overflow-hidden">
        <Box className="flex-1 flex items-center justify-center text-white">
          <Box className="text-center">
            <Box className="mb-4 text-gray-400">
              {config.icon}
            </Box>
            <Typography variant="h6" className="text-gray-300">
              {config.label}
            </Typography>
            <Typography variant="caption" className="text-gray-500 block mt-1">
              模拟视频流 — 实际部署时接入 RTMP/WebRTC
            </Typography>
          </Box>
        </Box>

        {/* 播放器控制栏 */}
        <Box className="bg-gray-900 px-4 py-2 flex items-center gap-3">
          <IconButton
            size="small"
            className="text-white"
            onClick={() => setPlaying(!playing)}
          >
            {playing ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
          </IconButton>
          <Slider
            size="small"
            defaultValue={30}
            className="flex-1 text-blue-500"
            sx={{ '& .MuiSlider-thumb': { width: 12, height: 12 } }}
          />
          <Typography variant="caption" className="text-gray-400 min-w-[70px] text-right">
            03:21 / 12:45
          </Typography>
          <IconButton size="small" className="text-white">
            <VolumeUp fontSize="small" />
          </IconButton>
          <IconButton size="small" className="text-white">
            <Fullscreen fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: 验证编译**

Run: `npx tsc --noEmit --pretty 2>&1 | head -50`
Expected: 无类型错误（或仅有未使用变量的 warning，可以忽略）

- [ ] **Step 3: Commit**

```bash
git add src/app/components/VideoStreamPanel.tsx
git commit -m "feat: add VideoStreamPanel component with stream source switching"
```

---

### Task 2: 创建 ContentPreview 组件

**Files:**
- Create: `src/app/components/ContentPreview.tsx`

- [ ] **Step 1: 创建组件文件**

```tsx
import { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import {
  Slideshow,
  Description,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';

export default function ContentPreview() {
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(1);
  const totalPages = [12, 8]; // 课件12页，教案8页

  const isCourseware = tabValue === 0;
  const currentTotal = totalPages[tabValue];

  return (
    <Box className="h-full flex flex-col">
      {/* 页签 */}
      <Tabs
        value={tabValue}
        onChange={(e, v) => { setTabValue(v); setPage(1); }}
        sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: '0.9rem', minHeight: 40 } }}
      >
        <Tab icon={<Slideshow fontSize="small" />} iconPosition="start" label="课件" />
        <Tab icon={<Description fontSize="small" />} iconPosition="start" label="教案" />
      </Tabs>

      {/* 预览区域 */}
      <Box className="flex-1 mt-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col overflow-hidden">
        <Box className="flex-1 flex items-center justify-center p-6">
          {isCourseware ? (
            <Box className="text-center">
              <Slideshow sx={{ fontSize: 80 }} className="text-blue-300 mb-4" />
              <Typography variant="h6" className="text-gray-700 font-medium">
                函数与极限.pptx
              </Typography>
              <Typography variant="body2" className="text-gray-400 mt-1">
                数学课件 — 第 {page} 页
              </Typography>
              <Box className="mt-6 w-64 h-40 mx-auto bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center">
                <Typography variant="h2" className="text-gray-200 font-bold">
                  {page}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box className="text-center">
              <Description sx={{ fontSize: 80 }} className="text-green-300 mb-4" />
              <Typography variant="h6" className="text-gray-700 font-medium">
                函数与极限_教案.docx
              </Typography>
              <Typography variant="body2" className="text-gray-400 mt-1">
                数学教案 — 第 {page} 页
              </Typography>
              <Box className="mt-6 w-64 h-40 mx-auto bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center">
                <Typography variant="h2" className="text-gray-200 font-bold">
                  {page}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* 翻页控制 */}
        <Box className="border-t border-gray-200 px-4 py-2 flex items-center justify-between bg-white">
          <Typography variant="caption" className="text-gray-500">
            {currentTotal} 页
          </Typography>
          <Box className="flex items-center gap-1">
            <IconButton
              size="small"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft fontSize="small" />
            </IconButton>
            <Typography variant="caption" className="min-w-[40px] text-center">
              {page} / {currentTotal}
            </Typography>
            <IconButton
              size="small"
              disabled={page >= currentTotal}
              onClick={() => setPage((p) => Math.min(currentTotal, p + 1))}
            >
              <ChevronRight fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: 验证编译**

Run: `npx tsc --noEmit --pretty 2>&1 | head -50`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
git add src/app/components/ContentPreview.tsx
git commit -m "feat: add ContentPreview component with courseware/lesson plan tabs"
```

---

### Task 3: 创建 LectureEvaluationDetail 组件

**Files:**
- Create: `src/app/components/LectureEvaluationDetail.tsx`

- [ ] **Step 1: 创建组件文件**

```tsx
import { Box, Dialog, DialogTitle, IconButton, Typography, Divider } from '@mui/material';
import { Close } from '@mui/icons-material';
import VideoStreamPanel from './VideoStreamPanel';
import ContentPreview from './ContentPreview';
import type { Lecture } from './LectureEvaluation';

interface Props {
  open: boolean;
  lecture: Lecture | null;
  onClose: () => void;
}

export default function LectureEvaluationDetail({ open, lecture, onClose }: Props) {
  if (!lecture) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        className: "rounded-2xl",
        sx: { height: '85vh', maxHeight: '85vh' },
      }}
    >
      {/* 头部 */}
      <DialogTitle className="border-b border-gray-200 py-3 px-6">
        <Box className="flex items-center justify-between">
          <Typography variant="h6" className="font-bold">
            听评课详情 — {lecture.courseName}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* 主体内容 */}
      <Box className="flex-1 flex overflow-hidden" sx={{ height: 'calc(100% - 64px)' }}>
        {/* 左侧视频流 */}
        <Box className="w-[60%] p-5 overflow-auto">
          <VideoStreamPanel />
        </Box>

        {/* 分隔线 */}
        <Divider orientation="vertical" flexItem />

        {/* 右侧内容预览 */}
        <Box className="flex-1 p-5 overflow-auto">
          <ContentPreview />
        </Box>
      </Box>
    </Dialog>
  );
}
```

- [ ] **Step 2: 验证编译**

Run: `npx tsc --noEmit --pretty 2>&1 | head -50`
Expected: 无类型错误（Lecture 类型导出可能需要后续调整，可接受暂时 warning）

- [ ] **Step 3: Commit**

```bash
git add src/app/components/LectureEvaluationDetail.tsx
git commit -m "feat: add LectureEvaluationDetail dialog component"
```

---

### Task 4: 修改 LectureEvaluation 组件

**Files:**
- Modify: `src/app/components/LectureEvaluation.tsx`

- [ ] **Step 1: 导出 Lecture 接口并替换查看弹窗**

在 `LectureEvaluation.tsx` 顶部**添加导出**：
```tsx
export interface Lecture {
```

找到 `viewDialogOpen` 和 `setViewDialogOpen` 的 useState：
```tsx
const [viewDialogOpen, setViewDialogOpen] = useState(false);
const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
```
→ 替换为：
```tsx
const [detailOpen, setDetailOpen] = useState(false);
const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
```

找到 `handleView` 函数，修改为打开新弹窗：
```tsx
const handleView = (lecture: Lecture) => {
  setSelectedLecture(lecture);
  setDetailOpen(true);
};
```

在文件顶部添加导入：
```tsx
import LectureEvaluationDetail from './LectureEvaluationDetail';
```

- [ ] **Step 2: 替换原有的查看弹窗（Dialog）**

找到文件中现有的查看弹窗：
```tsx
      {/* 查看/评价弹窗 */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        ...
      </Dialog>
```

替换为新的详情弹窗：
```tsx
      {/* 听评课详情弹窗 */}
      <LectureEvaluationDetail
        open={detailOpen}
        lecture={selectedLecture}
        onClose={() => setDetailOpen(false)}
      />
```

注意：原有的 `viewDialogOpen` 引用全部替换为 `detailOpen`，`setViewDialogOpen` 替换为 `setDetailOpen`。

- [ ] **Step 3: 验证编译**

Run: `npx tsc --noEmit --pretty 2>&1 | head -50`
Expected: 无类型错误

- [ ] **Step 4: 验证效果**

Run: `npm run dev` 启动开发服务器，打开浏览器确认：
1. 进入听评课页面
2. 点击任意一行的"查看"按钮
3. 大弹窗打开，左侧显示视频流（默认老师画面）
4. 下拉切换为学生/白板，视频区域内容对应变化
5. 右侧显示课件/教案页签，点击切换，翻页控件正常工作
6. 关闭弹窗正常

- [ ] **Step 5: Commit**

```bash
git add src/app/components/LectureEvaluation.tsx src/app/components/LectureEvaluationDetail.tsx
git commit -m "feat: wire up lecture evaluation detail dialog to view button"
```
