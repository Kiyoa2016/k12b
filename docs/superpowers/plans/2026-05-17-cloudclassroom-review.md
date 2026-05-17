# 云课堂审核页面 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add "云课堂审核" secondary menu under 云课堂 for admin video review (approve/reject).

**Architecture:** New CloudClassroomReview component with independent mock data, integrated into App.tsx via the existing secondary-menu pattern (like 集控管理).

**Tech Stack:** React 18 + TypeScript + MUI v7 + Tailwind CSS

---

### Task 1: Export review types from CloudClassroom.tsx

**Files:**
- Modify: `src/app/components/CloudClassroom.tsx:13-22`

Add `ReviewStatus` type and `ReviewVideo` interface after the existing `CloudVideo` export.

- [ ] **Add type exports after CloudVideo interface**

```typescript
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewVideo {
  id: string;
  title: string;
  subject: string;
  grade: string;
  teacher: string;
  duration: string;
  uploadDate: string;
  status: ReviewStatus;
  reviewNote?: string;
  description?: string;
}
```

---

### Task 2: Create CloudClassroomReview component

**Files:**
- Create: `src/app/components/CloudClassroomReview.tsx`

The review page component with:
- Tab filtering (全部/待审核/已通过/已驳回)
- Table listing with status and actions
- Approve action (instant)
- Reject dialog with reason input
- Revoke/re-review actions

- [ ] **Create component with mock data and state**

```tsx
import { useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Tab, Tabs, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
} from '@mui/material';
import { CheckCircle, Cancel, Undo } from '@mui/icons-material';
import type { ReviewVideo, ReviewStatus } from './CloudClassroom';

const mockVideos: ReviewVideo[] = [
  { id: 'r1', title: '函数与极限', subject: '数学', grade: '高一', teacher: '张老师', duration: '45:00', uploadDate: '2026-05-10', status: 'pending', description: '函数基本概念' },
  { id: 'r2', title: '古诗词鉴赏', subject: '语文', grade: '高一', teacher: '李老师', duration: '40:00', uploadDate: '2026-05-11', status: 'pending', description: '古诗词赏析' },
  { id: 'r3', title: '语法基础', subject: '英语', grade: '高二', teacher: '王老师', duration: '45:00', uploadDate: '2026-05-12', status: 'approved' },
  { id: 'r4', title: '力学实验', subject: '物理', grade: '高二', teacher: '陈老师', duration: '50:00', uploadDate: '2026-05-13', status: 'rejected', reviewNote: '视频画面不清晰，请重新录制' },
  { id: 'r5', title: '元素周期表', subject: '化学', grade: '高一', teacher: '刘老师', duration: '45:00', uploadDate: '2026-05-14', status: 'pending' },
  { id: 'r6', title: '细胞结构', subject: '生物', grade: '初一', teacher: '赵老师', duration: '40:00', uploadDate: '2026-05-15', status: 'approved' },
  { id: 'r7', title: '辛亥革命', subject: '历史', grade: '初二', teacher: '周老师', duration: '45:00', uploadDate: '2026-05-16', status: 'rejected', reviewNote: '内容与课程大纲不符' },
  { id: 'r8', title: '大气环流', subject: '地理', grade: '高二', teacher: '吴老师', duration: '45:00', uploadDate: '2026-05-17', status: 'pending' },
];

const statusConfig: Record<ReviewStatus, { label: string; color: 'warning' | 'success' | 'error' }> = {
  pending: { label: '待审核', color: 'warning' },
  approved: { label: '已通过', color: 'success' },
  rejected: { label: '已驳回', color: 'error' },
};

export default function CloudClassroomReview() {
  const [videos, setVideos] = useState(mockVideos);
  const [tabIndex, setTabIndex] = useState(0);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<ReviewVideo | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const tabs = ['全部', '待审核', '已通过', '已驳回'];
  const tabStatusMap: (ReviewStatus | 'all')[] = ['all', 'pending', 'approved', 'rejected'];

  const filteredVideos = tabIndex === 0
    ? videos
    : videos.filter((v) => v.status === tabStatusMap[tabIndex]);

  const handleApprove = (video: ReviewVideo) => {
    setVideos((prev) => prev.map((v) =>
      v.id === video.id ? { ...v, status: 'approved' as const, reviewNote: undefined } : v
    ));
  };

  const handleRejectOpen = (video: ReviewVideo) => {
    setRejectTarget(video);
    setRejectReason('');
    setRejectOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectTarget) return;
    setVideos((prev) => prev.map((v) =>
      v.id === rejectTarget.id ? { ...v, status: 'rejected' as const, reviewNote: rejectReason } : v
    ));
    setRejectOpen(false);
    setRejectTarget(null);
  };

  const handleReset = (video: ReviewVideo) => {
    setVideos((prev) => prev.map((v) =>
      v.id === video.id ? { ...v, status: 'pending' as const, reviewNote: undefined } : v
    ));
  };

  return (
    <Box className="p-6">
      <Box className="mb-6">
        <Typography variant="h5" className="font-bold">云课堂审核</Typography>
        <Typography variant="body2" color="text.secondary" className="mt-1">
          审核教师上传的视频内容
        </Typography>
      </Box>

      <Tabs value={tabIndex} onChange={(_, i) => setTabIndex(i)} className="mb-4 border-b border-gray-200">
        {tabs.map((t) => <Tab key={t} label={t} />)}
      </Tabs>

      {filteredVideos.length === 0 ? (
        <Box className="text-center py-16">
          <Typography variant="h6" color="text.secondary">暂无审核记录</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>视频标题</TableCell>
                <TableCell width={100}>学科</TableCell>
                <TableCell width={100}>年级</TableCell>
                <TableCell width={120}>授课教师</TableCell>
                <TableCell width={120}>上传时间</TableCell>
                <TableCell width={100}>状态</TableCell>
                <TableCell width={220}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVideos.map((video) => (
                <TableRow key={video.id} hover>
                  <TableCell>
                    <Typography variant="body2" className="font-medium">{video.title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={video.subject} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label={video.grade} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{video.teacher}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{video.uploadDate}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusConfig[video.status].label}
                      size="small"
                      color={statusConfig[video.status].color}
                    />
                  </TableCell>
                  <TableCell>
                    <Box className="flex gap-1">
                      {video.status === 'pending' && (
                        <>
                          <Button size="small" variant="contained" color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => handleApprove(video)}>通过</Button>
                          <Button size="small" variant="outlined" color="error"
                            startIcon={<Cancel />}
                            onClick={() => handleRejectOpen(video)}>驳回</Button>
                        </>
                      )}
                      {video.status === 'approved' && (
                        <Button size="small" variant="outlined"
                          startIcon={<Undo />}
                          onClick={() => handleReset(video)}>撤销审核</Button>
                      )}
                      {video.status === 'rejected' && (
                        <Button size="small" variant="outlined"
                          startIcon={<Undo />}
                          onClick={() => handleReset(video)}>重新审核</Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 驳回原因弹窗 */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>驳回视频</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" className="mb-3">
            确定驳回视频「{rejectTarget?.title}」？请填写驳回原因。
          </Typography>
          <TextField
            fullWidth multiline rows={3}
            placeholder="请输入驳回原因..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setRejectOpen(false)} variant="outlined">取消</Button>
          <Button onClick={handleRejectConfirm} variant="contained" color="error"
            disabled={!rejectReason.trim()}>确认驳回</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
```

---

### Task 3: Modify App.tsx — menu, routing, and rendering

**Files:**
- Modify: `src/app/App.tsx`

Changes:
1. Import CloudClassroomReview
2. Add `'cloudclassroom-review'` to currentPage type union
3. Change `cloudclassroom` menu item to parent with children
4. Change `centralMenuAnchor` to a generic `menuAnchors` record for multiple dropdowns
5. Add conditional rendering for `cloudclassroom-review` page
6. Update type assertions in nav click handlers

#### Step 1: Add import

After line 62 (`import CloudClassroomPlay from './components/CloudClassroomPlay';`):
```typescript
import CloudClassroomReview from './components/CloudClassroomReview';
```

#### Step 2: Change currentPage type

Line 76: Add `'cloudclassroom-review'` to the union type.

#### Step 3: Restructure menu items

Replace lines 224-228 (cloudclassroom flat item + central children):
```typescript
{ id: 'cloudclassroom-parent', label: '云课堂', icon: <Videocam />, children: [
  { id: 'cloudclassroom', label: '云课堂' },
  { id: 'cloudclassroom-review', label: '云课堂审核' },
]},
{ id: 'central', label: '集控管理', icon: <MenuIcon />, children: [
  { id: 'classroom', label: '教室管理', icon: <People /> },
  { id: 'livestream', label: '实时流', icon: <Videocam /> },
]},
```

#### Step 4: Replace single centralMenuAnchor with generic menu anchor state

Replace:
```typescript
const [centralMenuAnchor, setCentralMenuAnchor] = useState<null | HTMLElement>(null);
```
With:
```typescript
const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
```

#### Step 5: Update nav bar rendering

In the children menu rendering (lines 248-282):

Replace:
```tsx
onClick={(e) => setCentralMenuAnchor(e.currentTarget)}
...
variant={currentPage === 'classroom' || currentPage === 'livestream' ? 'contained' : 'text'}
...
anchorEl={centralMenuAnchor}
open={Boolean(centralMenuAnchor)}
onClose={() => setCentralMenuAnchor(null)}
...
onClick={() => {
  setCurrentPage(child.id as 'classroom' | 'livestream');
  setCentralMenuAnchor(null);
}}
```

With:
```tsx
onClick={(e) => { setMenuAnchorEl(e.currentTarget); setActiveMenuId(item.id); }}
...
variant={item.children?.some(c => currentPage === c.id) ? 'contained' : 'text'}
...
anchorEl={menuAnchorEl}
open={Boolean(menuAnchorEl) && activeMenuId === item.id}
onClose={() => { setMenuAnchorEl(null); setActiveMenuId(null); }}
...
onClick={() => {
  setCurrentPage(child.id as 'classroom' | 'livestream' | 'cloudclassroom' | 'cloudclassroom-review');
  setMenuAnchorEl(null);
  setActiveMenuId(null);
}}
```

#### Step 6: Update drawer rendering

In the drawer (lines 325-343), update the child click handler type assertion:
```typescript
setCurrentPage(child.id as 'classroom' | 'livestream' | 'cloudclassroom' | 'cloudclassroom-review');
```

#### Step 7: Add conditional rendering

Before the `cloudclassroom` branch:
```tsx
) : currentPage === 'cloudclassroom-review' ? (
  <CloudClassroomReview />
) : currentPage === 'cloudclassroom' ? (
```

#### Step 8: Update flat menu button click type assertion

Line 287: Add `'cloudclassroom-review'` to the type assertion union:
```typescript
onClick={() => setCurrentPage(item.id as 'template' | 'teacher' | 'school' | 'questionbank' | 'classroom' | 'livestream' | 'cloudclassroom' | 'cloudclassroom-review')}
```

#### Step 9: Update drawer flat menu item click type assertion

Line 348: Add `'cloudclassroom-review'` to the type assertion union:
```typescript
setCurrentPage(item.id as 'template' | 'teacher' | 'school' | 'questionbank' | 'classroom' | 'livestream' | 'cloudclassroom' | 'cloudclassroom-review');
```

---

### Task 4: Build and verify

- [ ] **Run build to verify**

```bash
cd "e:\Document\04 奇意\01 果仁白板\01 原型设计\模板维护管理界面" && npx vite build
```
