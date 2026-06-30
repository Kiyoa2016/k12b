# 发送信息弹窗（SendMessageDialog）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在设备巡视弹窗中点击"发送信息"按钮时，打开一个独立的左右分栏的消息发送弹窗

**Architecture:** 创建独立组件 `SendMessageDialog.tsx`，在 `PatrolDialog` 中通过状态控制显隐。"发送信息"按钮从原来的 snackbar 提示改为打开新弹窗，发送完成后回调显示 snackbar

**Tech Stack:** React + TypeScript + MUI v7 + Tailwind CSS

## 全局约束

- 消息内容 ≤ 150 字
- 字体大小三档：小=16px，中=24px，大=36px
- 预设六色：`#ffffff` `#ff4444` `#ffbb00` `#44ff44` `#44bbff` `#ff88ff`
- 播放次数仅跑马灯模式显示，范围 1~99，默认 3
- 使用 MUI 组件（Dialog, TextField, Select, Radio, Chip 等）
- 遵循现有 `DevicePatrol.tsx` 的代码风格（MUI sx + Tailwind class 混用）

---

### Task 1: 创建 SendMessageDialog 组件 — 状态与结构

**Files:**
- Create: `src/app/components/SendMessageDialog.tsx`
- Modify: (无)

**Interfaces:**
- Consumes: `Classroom` 类型（来自 DevicePatrol.tsx）
- Produces: `SendMessageDialog` 组件 props: `{ classroom: Classroom | null; open: boolean; onClose: () => void; onSend: (payload: SendMessagePayload) => void }`

- [ ] **Step 1: 在 DevicePatrol.tsx 顶部导出 Classroom 类型**

当前 `Classroom` 接口定义在 `DevicePatrol.tsx` 第 26-39 行。添加 `export` 关键字使其可被其他文件导入：

```typescript
// DevicePatrol.tsx 第 26 行
export interface Classroom {
```

- [ ] **Step 2: 创建 SendMessageDialog.tsx 骨架**

创建文件 `src/app/components/SendMessageDialog.tsx`，写入 imports、类型定义和组件骨架：

```typescript
import { useState, useMemo } from 'react';
import {
  Box, Typography, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, IconButton, TextField, Radio,
  RadioGroup, FormControlLabel, FormControl, FormLabel,
  Select, MenuItem, Chip, InputAdornment,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import type { Classroom } from './DevicePatrol';

export interface SendMessagePayload {
  classroomId: string;
  content: string;
  fontSize: 'small' | 'medium' | 'large';
  fontColor: string;
  playMode: 'marquee' | 'popup';
  playCount: number;
  templateId?: string;
}

// 预设模板
const MESSAGE_TEMPLATES = [
  { id: 'class-start', category: '通用通知', text: '请同学们回到座位，准备上课' },
  { id: 'class-end', category: '通用通知', text: '下课时间到，请老师有序组织学生离开教室' },
  { id: 'exam-silence', category: '考试/自习', text: '考试进行中，请保持考场安静' },
  { id: 'self-study', category: '考试/自习', text: '自习时间，请同学们保持安静，认真学习' },
  { id: 'fire-drill', category: '安全/应急', text: '消防演练开始，请全体师生有序撤离' },
  { id: 'emergency', category: '安全/应急', text: '紧急情况，请保持冷静，听从指挥' },
];

const TEMPLATE_CATEGORIES = ['通用通知', '考试/自习', '安全/应急'] as const;

const FONT_SIZE_OPTIONS = [
  { value: 'small' as const, label: '小', px: 16 },
  { value: 'medium' as const, label: '中', px: 24 },
  { value: 'large' as const, label: '大', px: 36 },
];

const FONT_COLORS = ['#ffffff', '#ff4444', '#ffbb00', '#44ff44', '#44bbff', '#ff88ff'];

interface SendMessageDialogProps {
  classroom: Classroom | null;
  open: boolean;
  onClose: () => void;
  onSend: (payload: SendMessagePayload) => void;
}

export default function SendMessageDialog({ classroom, open, onClose, onSend }: SendMessageDialogProps) {
  const [content, setContent] = useState('');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [fontColor, setFontColor] = useState('#ffffff');
  const [playMode, setPlayMode] = useState<'marquee' | 'popup'>('marquee');
  const [playCount, setPlayCount] = useState(3);
  const [touched, setTouched] = useState(false);

  // 关闭时重置状态
  const handleClose = () => {
    setContent('');
    setFontSize('medium');
    setFontColor('#ffffff');
    setPlayMode('marquee');
    setPlayCount(3);
    setTouched(false);
    onClose();
  };

  // 选择模板
  const handleTemplateSelect = (templateId: string) => {
    const tmpl = MESSAGE_TEMPLATES.find(t => t.id === templateId);
    if (tmpl) setContent(tmpl.text);
  };

  // 校验
  const isValid = content.trim().length > 0 && content.length <= 150;

  // 发送
  const handleSend = () => {
    setTouched(true);
    if (!isValid || !classroom) return;
    onSend({
      classroomId: classroom.id,
      content: content.trim(),
      fontSize,
      fontColor,
      playMode,
      playCount: playMode === 'marquee' ? playCount : 1,
    });
    handleClose();
  };

  if (!classroom) return null;

  const fontPx = FONT_SIZE_OPTIONS.find(o => o.value === fontSize)?.px ?? 24;
  const previewWidth = 340;
  const previewHeight = Math.round(previewWidth * 10 / 16);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb', py: 1.5 }}>
        <Box className="flex items-center justify-between">
          <Typography variant="h6" className="font-bold">发送信息 — {classroom.name}</Typography>
          <IconButton onClick={handleClose} size="small"><Close /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        <Box className="flex gap-3" sx={{ height: 480 }}>
          {/* 左栏：预览 */}
          <Box className="flex-1 flex items-center justify-center" sx={{ backgroundColor: '#f8fafc', borderRadius: 2 }}>
            {content.trim() ? (
              <Box
                className="rounded-lg overflow-hidden relative"
                sx={{ width: previewWidth, height: previewHeight, background: '#0f172a', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}
              >
                {/* 顶部信息条 */}
                <Box className="absolute top-0 left-0 right-0 flex items-center px-2 z-10" sx={{ height: 24, background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)' }}>
                  <Typography variant="caption" sx={{ fontSize: 10, color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>
                    {classroom.room}教室
                  </Typography>
                  <Chip label="在线" size="small" sx={{ ml: 'auto', height: 16, fontSize: 9, backgroundColor: 'rgba(22,163,74,0.7)', color: '#fff', '& .MuiChip-label': { px: 0.5 } }} />
                </Box>

                {/* 消息内容 */}
                {playMode === 'popup' ? (
                  /* 全局弹窗模式 */
                  <Box className="absolute inset-0 flex items-center justify-center" sx={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <Box sx={{ maxWidth: '80%', p: 3, borderRadius: 2, backgroundColor: 'rgba(15,23,42,0.92)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', textAlign: 'center' }}>
                      <Typography sx={{ fontSize: fontPx, color: fontColor, fontWeight: 600, lineHeight: 1.5, wordBreak: 'break-word' }}>
                        {content}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  /* 跑马灯模式 — 只有输入内容时才显示 */
                  <Box className="absolute bottom-0 left-0 right-0" sx={{ height: 48, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <Box
                      className="whitespace-nowrap"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        height: '100%',
                        px: 2,
                        animation: content.trim() ? 'marquee 8s linear infinite' : 'none',
                        '@keyframes marquee': {
                          '0%': { transform: 'translateX(100%)' },
                          '100%': { transform: 'translateX(-100%)' },
                        },
                      }}
                    >
                      <Typography sx={{ fontSize: fontPx, color: fontColor, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {content}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* 底部任务栏 */}
                <Box className="absolute bottom-0 left-0 right-0 flex items-center px-2" sx={{ height: 20, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <Typography variant="caption" sx={{ fontSize: 8, color: 'rgba(255,255,255,0.7)' }}>
                    {classroom.deviceCode}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', ml: 'auto' }}>
                    {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>输入消息后此处将显示预览效果</Typography>
            )}
          </Box>

          {/* 右栏：配置 */}
          <Box className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-auto">
            {/* 消息内容 */}
            <Box>
              <Box className="flex items-center justify-between mb-1">
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151', fontSize: 11 }}>消息内容</Typography>
                <Typography variant="caption" sx={{ fontSize: 10, color: content.length > 150 ? '#ef4444' : '#9ca3af' }}>
                  {content.length}/150
                </Typography>
              </Box>
              <TextField
                fullWidth
                multiline
                minRows={3}
                maxRows={5}
                placeholder="请输入消息内容..."
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 150))}
                error={touched && (content.trim().length === 0 || content.length > 150)}
                helperText={touched && content.trim().length === 0 ? '消息内容不能为空' : ''}
                size="small"
              />
            </Box>

            {/* 字体大小 */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151', fontSize: 11, mb: 0.5, display: 'block' }}>字体大小</Typography>
              <Box className="flex gap-1">
                {FONT_SIZE_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    label={`${opt.label} (${opt.px}px)`}
                    size="small"
                    variant={fontSize === opt.value ? 'filled' : 'outlined'}
                    color={fontSize === opt.value ? 'primary' : 'default'}
                    onClick={() => setFontSize(opt.value)}
                    sx={{ flex: 1, cursor: 'pointer', fontWeight: 600 }}
                  />
                ))}
              </Box>
            </Box>

            {/* 字体颜色 */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151', fontSize: 11, mb: 0.5, display: 'block' }}>字体颜色</Typography>
              <Box className="flex gap-2">
                {FONT_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setFontColor(color)}
                    sx={{
                      width: 28, height: 28, borderRadius: '50%',
                      backgroundColor: color,
                      border: fontColor === color ? '2px solid #3b82f6' : '2px solid transparent',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: color === '#ffffff' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : 'none',
                      '&:hover': { transform: 'scale(1.15)', transition: 'transform 0.15s' },
                    }}
                  >
                    {fontColor === color && (
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color === '#ffffff' ? '#3b82f6' : '#fff', opacity: 0.9 }} />
                    )}
                  </Box>
                ))}
              </Box>
            </Box>

            {/* 快捷模板 */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151', fontSize: 11, mb: 0.5, display: 'block' }}>快捷模板</Typography>
              <FormControl fullWidth size="small">
                <Select
                  value=""
                  displayEmpty
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  renderValue={() => <Typography variant="body2" sx={{ color: '#9ca3af' }}>选择模板...</Typography>}
                >
                  {TEMPLATE_CATEGORIES.map((cat) => [
                    <MenuItem key={cat} disabled sx={{ opacity: 0.6, fontSize: 11, fontWeight: 700 }}>
                      {cat}
                    </MenuItem>,
                    ...MESSAGE_TEMPLATES
                      .filter(t => t.category === cat)
                      .map(t => (
                        <MenuItem key={t.id} value={t.id} sx={{ pl: 3, fontSize: 13 }}>
                          {t.text}
                        </MenuItem>
                      )),
                  ])}
                </Select>
              </FormControl>
            </Box>

            {/* 播放方式 */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151', fontSize: 11, mb: 0.5, display: 'block' }}>播放方式</Typography>
              <RadioGroup row value={playMode} onChange={(e) => setPlayMode(e.target.value as 'marquee' | 'popup')}>
                <FormControlLabel value="marquee" control={<Radio size="small" />} label={<Typography variant="body2">跑马灯</Typography>} />
                <FormControlLabel value="popup" control={<Radio size="small" />} label={<Typography variant="body2">全局弹窗</Typography>} />
              </RadioGroup>
            </Box>

            {/* 播放次数（仅跑马灯） */}
            {playMode === 'marquee' && (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151', fontSize: 11, mb: 0.5, display: 'block' }}>播放次数</Typography>
                <Box className="flex items-center gap-2">
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{ minWidth: 32, height: 32, p: 0, fontSize: 16, fontWeight: 700 }}
                    onClick={() => setPlayCount(Math.max(1, playCount - 1))}
                    disabled={playCount <= 1}
                  >
                    -
                  </Button>
                  <Typography variant="body1" sx={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{playCount}</Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{ minWidth: 32, height: 32, p: 0, fontSize: 16, fontWeight: 700 }}
                    onClick={() => setPlayCount(Math.min(99, playCount + 1))}
                    disabled={playCount >= 99}
                  >
                    +
                  </Button>
                  <Typography variant="caption" sx={{ color: '#9ca3af' }}>次</Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid #e5e7eb', px: 3, py: 1.5 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit">取消</Button>
        <Button onClick={handleSend} variant="contained" disabled={touched && !isValid}>
          发送指令
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

- [ ] **Step 3: Verify the file compiles**

Run: `npx tsc --noEmit src/app/components/SendMessageDialog.tsx --jsx react-jsx --esModuleInterop --moduleResolution bundler`
Expected: No type errors

---

### Task 2: 集成 SendMessageDialog 到 PatrolDialog

**Files:**
- Modify: `src/app/components/DevicePatrol.tsx`

**Interfaces:**
- Consumes: `SendMessageDialog` 组件和 `SendMessagePayload` 类型
- Produces: 点击"发送信息"时打开 SendMessageDialog，发送后显示 Snackbar

- [ ] **Step 1: 添加导入**

在 `DevicePatrol.tsx` 头部 imports 区域添加：

```typescript
import SendMessageDialog, { type SendMessagePayload } from './SendMessageDialog';
```

- [ ] **Step 2: 在 PatrolDialog 中添加 sendMessageOpen 状态**

在 `PatrolDialog` 函数内，`snackbar` 状态后面添加：

```typescript
const [sendMessageOpen, setSendMessageOpen] = useState(false);
```

- [ ] **Step 3: 修改 handleRemoteCommand 分离"发送信息"逻辑**

将原来的 `handleRemoteCommand` 函数改为：如果命令是"发送信息"则打开弹窗，否则保持原有 snackbar 行为：

```typescript
const handleRemoteCommand = (cmd: typeof remoteCommands[0]) => {
  if (!classroom) return;
  if (cmd.label === '发送信息') {
    setSendMessageOpen(true);
    return;
  }
  setSnackbar({ open: true, message: cmd.message(classroom.name) });
  // TODO: 调用实际 API
};
```

- [ ] **Step 4: 添加 handleSendMessage 回调**

在 `handleRemoteCommand` 后面添加：

```typescript
const handleSendMessage = (payload: SendMessagePayload) => {
  setSnackbar({ open: true, message: `已发送信息至 ${classroom.name}` });
  // TODO: 调用实际 API — payload 包含完整消息配置
};
```

- [ ] **Step 5: 在 PatrolDialog 的 DialogContent 底部（Snackbar 之后）添加 SendMessageDialog**

在 `</DialogContent>` 之前，`<Snackbar>` 组件之后添加：

```typescript
{/* 发送信息弹窗 */}
<SendMessageDialog
  classroom={classroom}
  open={sendMessageOpen}
  onClose={() => setSendMessageOpen(false)}
  onSend={handleSendMessage}
/>
```

- [ ] **Step 6: 验证集成**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 7: Commit**

```bash
git add src/app/components/SendMessageDialog.tsx src/app/components/DevicePatrol.tsx
git commit -m "feat(device-patrol): 添加发送信息弹窗SendMessageDialog

- 支持消息内容编辑，150字限制，字体大小/颜色设置
- 支持快捷消息模板选择（三类六条）
- 支持跑马灯/全局弹窗两种播放方式
- 跑马灯模式下支持播放次数设置
- 左栏实时预览消息在设备屏幕上的效果"
```
