# 设备巡视弹窗 — 远程控制指令按钮 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 DevicePatrol PatrolDialog 的视频画面下方增加远程控制指令按钮（开机、关机、远程喊话、发送信息）

**Architecture:** 单文件修改，在 `DevicePatrol.tsx` 的 `PatrolDialog` 组件左侧视频区域下方增加一行操作按钮栏。每个按钮点击后弹出 Snackbar 提示已发送指令。

**Tech Stack:** React + TypeScript + MUI (Material-UI)

---

### Task 1: 在 PatrolDialog 中添加远程控制按钮和 Snackbar 提示

**Files:**
- Modify: `src/app/components/DevicePatrol.tsx` (PatrolDialog 组件)

**Interfaces:**
- Consumes: `PatrolDialog` 现有的 `classroom: Classroom | null`, `open: boolean`, `onClose: () => void` props
- Produces: PatrolDialog 左侧视频画面下方增加一行按钮，按钮点击弹出 Snackbar

- [ ] **Step 1: 在 DevicePatrol.tsx 中补充 MUI 导入**

在文件顶部 import 中添加缺失的组件：
- `Snackbar` — 用于显示操作提示
- `Alert` — Snackbar 内部的提示样式
- `PowerSettingsNew` — 开机图标
- `PowerOff` — 关机图标  
- `Campaign` — 远程喊话图标
- `Send` — 发送信息图标

编辑第 2-13 行的 import 区块：

```tsx
import {
  Box, Typography, Card, CardContent, Button, IconButton,
  TextField, InputAdornment, Chip, Tooltip,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper,
  MenuItem, FormControl, Select,
  Dialog, DialogTitle, DialogContent,
  Snackbar, Alert, Divider,
} from '@mui/material';
import {
  ChevronRight, ExpandMore, Search, ViewList, ViewModule,
  Business, LocationOn, Visibility, Close, Videocam, Monitor,
  PowerSettingsNew, PowerOff, Campaign, Send,
} from '@mui/icons-material';
```

- [ ] **Step 2: 在 PatrolDialog 组件中添加按钮数据和 Snackbar 状态**

在 `PatrolDialog` 函数内部，`const [activeChannel, setActiveChannel] = useState(0);` 之后，添加 Snackbar 状态和按钮配置：

```tsx
const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

const remoteCommands = [
  { label: '开机', icon: <PowerSettingsNew sx={{ fontSize: 16 }} />, color: '#16a34a', message: (name: string) => `已发送开机指令至 ${name}` },
  { label: '关机', icon: <PowerOff sx={{ fontSize: 16 }} />, color: '#ef4444', message: (name: string) => `已发送关机指令至 ${name}` },
  { label: '远程喊话', icon: <Campaign sx={{ fontSize: 16 }} />, color: '#3b82f6', message: (name: string) => `已向 ${name} 发起远程喊话` },
  { label: '发送信息', icon: <Send sx={{ fontSize: 16 }} />, color: '#3b82f6', message: (name: string) => `已发送信息至 ${name}` },
];

const handleRemoteCommand = (cmd: typeof remoteCommands[0]) => {
  setSnackbar({ open: true, message: cmd.message(classroom.name) });
  // TODO: 调用实际 API
};
```

- [ ] **Step 3: 在视频区域下方添加按钮栏和 Snackbar**

在 `PatrolDialog` 的 JSX 中，找到左侧视频区域的结束位置（`</Box>` 闭合标签），在其后、右侧频道列表之前，插入按钮栏和 Snackbar。

当前结构（约第 387-479 行）：
```tsx
<Box className="flex gap-3" sx={{ height: 480 }}>
  {/* 左：视频流 */}
  <Box className="flex-1 rounded-lg overflow-hidden relative" sx={{ backgroundColor: '#0f172a' }}>
    ...
  </Box>

  {/* 右：视频流切换列表 */}
  <Box className="w-56 flex-shrink-0 flex flex-col gap-1.5">
    ...
  </Box>
</Box>
```

修改为：

```tsx
<Box className="flex gap-3" sx={{ height: 480 }}>
  {/* 左：视频流 + 控制按钮 */}
  <Box className="flex-1 flex flex-col gap-0">
    <Box className="flex-1 rounded-lg overflow-hidden relative" sx={{ backgroundColor: '#0f172a' }}>
      ...原有视频内容不变...
    </Box>

    {/* 远程控制按钮栏 */}
    <Box className="flex items-center gap-3 px-3" sx={{ height: 48, borderTop: '1px solid #e5e7eb', backgroundColor: '#fafafa', borderRadius: '0 0 8px 8px' }}>
      <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap', fontSize: 12 }}>
        远程控制：
      </Typography>
      {remoteCommands.map((cmd) => (
        <Tooltip key={cmd.label} title={!current ? '当前无视频连接' : ''}>
          <span>
            <Button
              size="small"
              variant="text"
              disabled={!current}
              startIcon={cmd.icon}
              onClick={() => handleRemoteCommand(cmd)}
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: cmd.color,
                minWidth: 'auto',
                px: 1,
                '&:hover': { backgroundColor: `${cmd.color}10` },
                '&.Mui-disabled': { opacity: 0.4 },
              }}
            >
              {cmd.label}
            </Button>
          </span>
        </Tooltip>
      ))}
    </Box>
  </Box>

  {/* 右：视频流切换列表 */}
  <Box className="w-56 flex-shrink-0 flex flex-col gap-1.5">
    ...原有频道列表内容不变...
  </Box>
</Box>

{/* Snackbar 提示 */}
<Snackbar
  open={snackbar.open}
  autoHideDuration={3000}
  onClose={() => setSnackbar({ open: false, message: '' })}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
>
  <Alert severity="success" variant="filled" sx={{ width: '100%' }}>
    {snackbar.message}
  </Alert>
</Snackbar>
```

注意：左侧 Box 的高度需要去掉写死的 `sx={{ height: 480 }}`，让内容自适应。

修改外层 Box：
```tsx
<Box className="flex gap-3" sx={{ height: 480 }}>
```
改为：
```tsx
<Box className="flex gap-3" sx={{ height: 528 }}>
```
（增加 48px 给按钮栏）

- [ ] **Step 4: 验证修改**

运行项目确认：
1. 打开设备巡视页面，点击任意教室卡片或"巡视"按钮打开 PatrolDialog
2. 确认视频画面下方出现"远程控制："标签和四个按钮（开机、关机、远程喊话、发送信息）
3. 有视频源时按钮可点击，点击后底部弹出绿色 Snackbar 提示
4. 无可用的视频源时（极低概率），按钮处于禁用状态

- [ ] **Step 5: 提交**

```bash
git add src/app/components/DevicePatrol.tsx
git commit -m "feat(device-patrol): 巡视弹窗增加远程控制指令按钮（开机/关机/远程喊话/发送信息）"
```
