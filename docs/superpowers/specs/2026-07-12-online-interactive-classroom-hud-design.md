# 线上互动课堂 — 全屏 HUD 模式重构

## 概述

将现有线上互动课堂的"编辑/直播一体"界面重构为"编辑 → 全屏直播"双模式。未直播时保持现有三栏布局方便准备；开始直播后自动进入 Fullscreen API 真全屏，展示干净的桌面/课件内容，所有操作通过鼠标悬停顶部浮现的 HUD 控制栏完成。

## 背景

当前 `OnlineInteractiveClassroom` 组件（~815 行）将直播画面、工具栏、成员列表整合在同一页面中。直播时所有面板始终可见，画面不够干净，不符合"直播以内容为中心"的使用直觉。

## 设计目标

1. **内容优先**：直播时桌面/课件占满整个屏幕，无任何干扰
2. **一键开播**：点击"开始直播"→ 全屏 + 自动隐藏工具栏
3. **触手可及**：鼠标移到顶部浮现 HUD，包含所有常用操作
4. **不丢失功能**：拍照、上传、截屏、答题、分享等功能在直播中以弹窗形式完整保留
5. **平稳退出**：停止直播 → 退出全屏 → 回到编辑界面

## 文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/app/components/OnlineInteractiveClassroom.tsx` | 修改 | 简化为容器，管理状态和模式切换 |
| `src/app/components/LivePresentation.tsx` | 新增 | 全屏直播画面（桌面 + PiP + 布局切换） |
| `src/app/components/LiveHUD.tsx` | 新增 | 顶部浮动控制栏 |

## 组件架构

```
OnlineInteractiveClassroom（容器）
│
├─ isLive = false → 渲染现有三栏界面
│   ├─ 左侧：课堂成员列表（含举手/语音）
│   ├─ 中间：直播画面预览区 + 布局选择器
│   └─ 右侧：拍墙上传播屏答题分享工具栏
│
├─ isLive = true → 渲染全屏直播模式
│   ├─ LivePresentation（全屏画面）
│   │   ├─ 主画面：桌面/课件（object-contain）
│   │   ├─ PiP 小窗：摄像头（可拖拽）
│   │   └─ 布局模式切换（通过 HUD 触发）
│   │
│   ├─ LiveHUD（顶部浮动控制栏）
│   │   ├─ 直播状态 + 在线人数
│   │   ├─ 布局快捷切换
│   │   └─ 操作按钮：拍照/截屏/答题/分享/停止
│   │
│   └─ 弹窗层（由容器管理，HUD 触发）
│       ├─ 拍照弹窗（现有逻辑迁移）
│       ├─ 截屏弹窗（现有逻辑迁移）
│       ├─ 答题弹窗（现有逻辑迁移）
│       └─ 分享弹窗（现有逻辑迁移）
│
└─ 共同状态（直播推流、媒体项、答题器、参与人员等）
```

## 容器组件 — OnlineInteractiveClassroom

### 角色

状态持有者 + 模式切换控制器。所有业务状态保留在此。

### 关键状态（与现有保持一致）

| 状态 | 类型 | 说明 |
|------|------|------|
| `isLive` | boolean | 直播模式开关 |
| `layoutMode` | `'teacher' \| 'pip'` | 当前布局 |
| `cameraStream` | MediaStream \| null | 摄像头流 |
| `mediaItems` | MediaItem[] | 拍照/上传/截屏的图片 |
| `activeOverlay` | string \| null | 当前叠加图片 ID |
| `quiz*` | 多项 | 答题器全部状态 |
| `participants` | Participant[] | 成员列表 |
| `pipPos` | `{top,left}` | PiP 拖拽位置 |

### 直播推流控制（toggleLive）

开始直播流程：
1. `navigator.mediaDevices.getUserMedia` 获取摄像头 + 麦克风
2. 设置 `cameraStream` 状态
3. 设置 `isLive = true`
4. `useEffect` 检测 `isLive` 变为 true → 触发 `element.requestFullscreen()`
5. 渲染 LivePresentation + LiveHUD 替代普通界面

停止直播流程：
1. 弹出确认对话框"确定停止直播？"
2. 用户确认后：停止摄像头所有 track，清空 `cameraStream`
3. 设置 `isLive = false`
4. `useEffect` 检测 `isLive` 变为 false → 调用 `document.exitFullscreen()`
5. 回到普通三栏界面

### Fullscreen 管理

```tsx
useEffect(() => {
  const el = document.documentElement;
  if (isLive) {
    if (!document.fullscreenElement) el.requestFullscreen().catch(() => {});
  } else {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }
}, [isLive]);
```

- 用户按 Esc 退出全屏 → 监听 `fullscreenchange` 事件同步 `isLive` 状态
- 退出全屏时自动停止直播

## LivePresentation 组件

### Props

```typescript
interface LivePresentationProps {
  cameraStream: MediaStream | null;
  mediaItems: MediaItem[];
  activeOverlay: string | null;
  layoutMode: LayoutMode;
  isLive: boolean;
  pipPos: { top: number; left: number } | null;
  pipRef: React.RefObject<HTMLDivElement | null>;
  onPipMouseDown: (e: React.MouseEvent) => void;
  onPipTouchStart: (e: React.TouchEvent) => void;
}
```

### 渲染逻辑

取当前布局模式，渲染对应画面结构：

**板书全屏（teacher）:**
```
┌────────────────────────────┐
│                            │
│      桌面/板书 全屏         │
│    (object-contain)        │
│                            │
│  ┌──────────────────┐      │
│  │  叠加层（右下角）  │      │
│  └──────────────────┘      │
└────────────────────────────┘
```

**画中画（pip）:**
```
┌────────────────────────────┐
│                            │
│      桌面/板书 主画面       │
│                            │
│          ┌────────┐        │
│          │ 摄像头  │        │
│          │ 可拖拽  │        │
│          └────────┘        │
└────────────────────────────┘
```

- 使用 `position: fixed` + `inset: 0` 占满视口
- 背景色 `bg-gray-900`
- 叠加层和 PiP 从现有代码直接迁移
- PiP 拖拽逻辑（鼠标 + 触摸）从容器通过 ref 传入

## LiveHUD 组件

### Props

```typescript
interface LiveHUDProps {
  isLive: boolean;
  onlineCount: number;
  layoutMode: LayoutMode;
  onLayoutChange: (mode: LayoutMode) => void;
  onAction: (action: 'photo' | 'screenshot' | 'quiz' | 'share' | 'stop') => void;
}
```

### 显隐行为

```
鼠标 Y <= 20px  ──→  开始 0.3s 滑入动画
鼠标 Y > 60px   ──→  等待 2s 后滑出

滑入: translateY(-100%) → translateY(0)
滑出: translateY(0) → translateY(-100%)
transition: transform 0.25s ease, opacity 0.2s ease
```

- 使用 `useState<boolean> hudVisible` 控制显隐
- `onMouseEnter` 在 HUD 容器上保持可见
- `onMouseLeave` 启动 2s 延时隐藏（clearTimeout 防抖）
- HUD 内部元素交互不触发隐藏
- 初始进入直播时：自动显示 HUD 3s 后收回（提示用户"鼠标移顶部显示工具栏"）

### 布局

```
┌────────────────────────────────────────────────────────────────────┐
│ ████████████████████████████████████████████████████████████████████ │
│ ░░ █ bg-black/60 backdrop-blur-sm                        ░░░░░ │
│ ░░                                                              ░░░░░ │
│ ░░ ● 直播中  8 人在线    [板书全屏] [画中画]   📷 拍照  📸 截屏  ❓ 答题  🔗 分享  ⏹ 停止 ░░░░░ │
│ ░░                                                              ░░░░░ │
│ ████████████████████████████████████████████████████████████████████ │
└────────────────────────────────────────────────────────────────────┘
```

- 左侧：绿色圆点 + "直播中" + 在线人数 Chip
- 中间：布局模式切换按钮组（小 Chip 或 IconButton）
- 右侧：操作按钮组（IconButton + tooltip）
- 毛玻璃背景：`bg-black/60 backdrop-blur-sm`

### 操作按钮 → 弹窗映射

| HUD 按钮 | 弹窗 | 弹窗内容 |
|----------|------|---------|
| 📷 拍照 | CameraDialog | 摄像头取景器 + 拍照 + 媒体缩略图列表 |
| 📸 截屏 | ScreenshotDialog | 一键截屏 + 截图预览 + 插入确认 |
| ❓ 答题 | QuizDialog | 题目编辑 / 投票进行 / 结果统计 三态 |
| 🔗 分享 | ShareDialog | 二维码 + 链接复制 |
| ⏹ 停止 | StopConfirmDialog | "确定停止直播？"确认弹窗 |

每个弹窗接收 `open` 和 `onClose` 属性，状态由容器管理。LiveHUD 通过 `onAction` 回调触发弹窗打开。

## 未直播界面（保留现有）

`isLive = false` 时，渲染当前已有的三栏布局：

- **头部**：标题栏 + 直播状态指示器 + 开始直播按钮
- **主体**：左侧成员列表 | 中间直播预览区 + 布局选择器 | 右侧工具栏（拍照上传/截屏/答题/分享）
- 功能完全保持不变

## UI 组件使用

- MUI `Box`, `Typography`, `Button`, `IconButton`, `Chip`, `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions`, `TextField`, `Divider`, `Menu`, `MenuItem`, `Alert`
- MUI Icons: `Videocam`, `CameraAlt`, `PhotoLibrary`, `ScreenShare`, `Share`, `StopCircle`, `PlayArrow`, `PictureInPicture`, `CropOriginal`, `Quiz`, `Close`, `ContentCopy`, `People`, `MoreVert`
- Tailwind CSS 现有类模式


## 测试要点

- [ ] 点击开始直播 → 进入 Fullscreen + 显示全屏桌面 + HUD 可浮现
- [ ] 鼠标移顶部 → HUD 滑入；离开 2s → 滑出
- [ ] HUD 上操作按钮 → 打开对应弹窗
- [ ] 按 Esc 退出全屏 → 自动停止直播回到编辑界面
- [ ] 点击停止直播 → 确认弹窗 → 退出全屏 → 回到编辑界面
- [ ] PiP 拖拽在直播中可用
- [ ] 拍照/上传图片后叠加层正常显示
- [ ] 答题器创建、投票、统计完整可用
- [ ] 未直播时全功能不受影响
