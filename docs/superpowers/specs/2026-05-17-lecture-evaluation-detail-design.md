# 听评课详情页面设计

## 概述

在现有听评课列表页中，点击"查看"按钮打开一个大尺寸弹窗，展示课程的视频流和内容预览。

## 界面布局

### 弹窗容器
- 类型：MUI `<Dialog>`
- 尺寸：`maxWidth="xl"`，`fullWidth`，约占视口 90%
- 头部标题：`听评课详情 — {课程名称}`，右侧关闭按钮

### 左右分栏
- **左侧（60%）**：视频流区域
- **右侧（40%）**：内容预览区域
- 中间 16px 间距

## 视频流区域

- 顶部下拉选择器，选项：`老师`（默认）、`学生`、`白板`
- 主区域展示模拟视频播放器界面：
  - 深色背景
  - 摄像头图标
  - 当前画面标签（如"老师画面"）
  - 播放器控制栏（播放/暂停、进度条等示意元素）
- 切换源时：标签文本和图标对应变化

## 内容预览区域

- 两个页签：`课件` | `教案`
- 每个页签下展示文档预览区（模拟预览）：
  - 课件：显示 PPTX 风格的预览框（浅蓝主题色 + 幻灯片图标）
  - 教案：显示 DOCX 风格的预览框（浅绿主题色 + 文档图标）
- 预览区包含翻页/滚动示意控件

## 实现方案

### 文件变更
- **修改** `LectureEvaluation.tsx`：将"查看"弹窗替换为新的详情弹窗
- **新增** `LectureEvaluationDetail.tsx`：详情弹窗组件
- **新增** `VideoStreamPanel.tsx`：视频流面板组件
- **新增** `ContentPreview.tsx`：内容预览组件

### 组件结构

```
LectureEvaluation.tsx
  └─ LectureEvaluationDetail.tsx (大弹窗)
       ├─ VideoStreamPanel.tsx (左侧视频)
       │    └─ 下拉选择器 + 视频播放器界面
       └─ ContentPreview.tsx (右侧内容)
            └─ Tabs(课件/教案) + 文档预览框
```

### 数据流
- `LectureEvaluation` 维护 `detailOpen` 状态和 `selectedLecture` 数据
- 点击"查看" → `setSelectedLecture(lecture)` + `setDetailOpen(true)`
- 将 `selectedLecture` 作为 props 传递给 `LectureEvaluationDetail`
- 视频流和内容预览使用 mock 数据/占位

### 模拟数据
- 视频流：无真实流，使用占位 UI
- 课件预览：`{courseName}.pptx` 占位
- 教案预览：`{courseName}.docx` 占位
