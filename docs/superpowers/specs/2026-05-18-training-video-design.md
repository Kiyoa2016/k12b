# 培训视频功能设计

## 概述

在教学管理系统中增加"培训视频"功能模块，用于展示和点播平台功能介绍视频。包含前端展示和管理端两个子系统。

## 数据模型

```typescript
interface TrainingVideo {
  id: string;
  title: string;          // 视频标题
  description: string;    // 视频描述
  module: string;         // 所属系统模块，如"模板管理"、"云课堂"等
  duration: string;       // 视频时长 (mm:ss)
  uploadDate: string;     // 上传日期
  status: 'published' | 'draft';  // 上架/下架状态
  videoUrl?: string;      // 视频文件地址
}
```

## 页面设计

### 1. 前端视频列表页 — TrainingVideo.tsx

- **导航入口**：一级菜单"培训视频"
- **布局**：顶部标题栏 + 搜索框 + 视频卡片网格（3列）
- **视频卡片**：渐变色缩略图区域 + 播放按钮悬浮层 + 时长角标 + 标题 + 描述摘要
- **交互**：点击卡片进入播放页
- **空状态**：居中图标 + "暂无培训视频"

### 2. 视频播放页 — TrainingVideoPlay.tsx

- **布局**：顶部返回按钮 + 视频标题 | 视频播放器（16:9） | 视频信息区
- **视频信息**：模块标签、时长、上传日期、文字描述
- **交互**：点击返回回到列表页
- 无相关视频侧边栏（与云课堂区分，培训视频为独立点播）

### 3. 管理端页面 — TrainingVideoManagement.tsx

- **布局**：标题栏 + "上传视频"按钮 | 搜索框 | 视频表格
- **表格列**：标题 | 所属模块 | 状态（已上架/已下架） | 上传时间 | 操作（编辑/删除/上架或下架）
- **上传弹窗**：视频标题输入 + 所属模块下拉选择 + 视频描述多行输入 + 视频文件拖拽/选择上传 + 取消/确定上传按钮
- **编辑弹窗**：复用上传弹窗，预填已有数据
- **删除确认**：删除前弹出确认对话框

### 4. 菜单集成

在 App.tsx 的 `menuItems` 数组中新增两个独立的一级菜单项：

```typescript
{ id: 'training-video', label: '培训视频', icon: <Videocam /> }
{ id: 'training-video-mgmt', label: '培训视频管理', icon: <Videocam /> }
```

两个菜单项平级排列，分别对应前端展示页和管理端页面。

## 状态管理

三个组件均为独立状态管理，无需全局 store：
- 管理端使用 `useState` 维护视频列表数据
- 前端列表通过 props 或直接引用数据源
- 播放页接收当前视频对象作为 props

## 与现有功能的复用

- **不**复用 CloudClassroomPlay 播放器，保持独立避免耦合
- 前端列表页布局参考 CloudClassroom 的卡片网格风格，保持系统 UI 一致
- 管理端上传弹窗参考 CloudClassroom 的上传对话框模式

## 文件清单

```
src/app/components/
  TrainingVideo.tsx             // 前端视频列表页
  TrainingVideoPlay.tsx         // 前端视频播放页
  TrainingVideoManagement.tsx   // 管理端页面
```

## 导航类型扩展

在 App.tsx 的 `currentPage` 类型中新增：
```
'training-video' | 'training-video-play'
```
