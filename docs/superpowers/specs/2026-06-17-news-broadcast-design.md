# 时事转播功能设计文档

## 概述

在"集控管理"下新增"时事转播"功能，支持新闻网页地址和纯视频文件两种转播方式，支持立即/定时/周循环三种循环模式，支持指定设备定向发布，支持查看执行结果和计划列表，以及全局巡视水印配置。

## 范围

**新增文件：**
- `src/app/components/NewsBroadcast.tsx` — 主组件（计划列表 + 执行结果 + 创建计划 + 水印设置）

**修改文件：**
- `src/app/App.tsx` — 添加路由和菜单项
- `src/app/types/permissions.ts` — 添加页面按钮配置

**不受影响：**
- 集控管理下其他页面（总览、教室管理、设备管理、实时流、信息发布、安全策略、运行日志）

## 页面结构

```
集控管理
  ├── 总览
  ├── 教室管理
  ├── 设备管理
  ├── 实时流
  ├── 时事转播 ← 新增
  ├── 信息发布
  ├── 安全策略
  └── 运行日志
```

## 布局方案（列表+弹窗）

页面采用上下结构，主区域用 Tab 切换：

```
┌──────────────────────────────────────────────────────────┐
│  📡 时事转播                          [水印设置] [+ 新建] │
│  标题区                                                  │
├──────────────────────────────────────────────────────────┤
│  [计划列表]  [执行结果]   ← Tab 切换                       │
├──────────────────────────────────────────────────────────┤
│  🔍 搜索框  [状态筛选▼]  [方式筛选▼]                       │
│  ┌────────────────────────────────────────────────┐      │
│  │ 计划名称 | 方式 | 循环 | 目标设备 | 状态 | 操作  │      │
│  │ 午间新闻转播  网页  12:00-12:30  3台  运行中  查看│      │
│  │ 应急演练通知  视频  立即 15:00  全部  待执行  查看│      │
│  │ 每周时事周刊  网页  每周五 14:00 5台  已停止  查看│      │
│  └────────────────────────────────────────────────┘      │
│  共 X 条记录                                              │
└──────────────────────────────────────────────────────────┘
```

## 核心类型定义

```typescript
type BroadcastMethod = 'webpage' | 'video';
type CycleMode = 'immediate' | 'scheduled' | 'weekly';
type BroadcastStatus = 'running' | 'pending' | 'stopped' | 'error';

interface BroadcastPlan {
  id: string;
  name: string;
  method: BroadcastMethod;
  contentUrl: string;
  cycleMode: CycleMode;
  startTime: string;   // ISO datetime
  endTime: string;     // ISO datetime
  weekDays?: number[]; // 0=周日, 1-6 周循环时有效
  deviceIds: string[];
  status: BroadcastStatus;
  createdAt: string;
}

interface BroadcastHistory {
  id: string;
  planId: string;
  planName: string;
  deviceId: string;
  deviceName: string;
  startTime: string;
  endTime?: string;
  status: 'success' | 'failed' | 'running';
  errorMsg?: string;
}

interface WatermarkConfig {
  text: string;
  showPatrolInspector: boolean;
  showIP: boolean;
  showPlanName: boolean;
  color: string;        // hex或rgba
  filterCamera: boolean;
  filterMicrophone: boolean;
}
```

## 各部分设计

### 1. 计划列表（默认 Tab）

- 表格列：序号、计划名称、转播方式（网页/视频标签）、循环模式（显示详情）、目标设备数、状态（运行中/待执行/已停止/异常）、操作（查看/编辑/删除/启停）
- 搜索框 + 状态下拉筛选 + 方式下拉筛选
- 分页（每页 10 条）
- Mock 数据：6-10 条仿真计划

### 2. 执行结果 Tab

- 展示每条计划的每次执行记录
- 表格列：时间、计划名称、设备名称、执行状态（成功/失败/运行中）、错误信息
- 支持按计划和设备筛选

### 3. 创建/编辑计划弹窗

字段：
- **计划名称**：文本输入
- **转播方式**：两个卡片按钮（新闻网页 / 视频文件），互斥选择
- **内容地址**：文本输入，根据转播方式显示 placeholder（URL 或文件路径）
- **循环模式**：三个按钮（立即 / 定时 / 周循环）
  - 立即：无时间设置，创建后立即执行一次
  - 定时：显示开始时间和结束时间选择器（日期+时间）
  - 周循环：显示开始时间、结束时间 + 星期多选（周一至周日）
- **目标设备**：点击弹出设备选择器（从设备列表选择，支持多选）
- 底部「取消」「创建/保存」按钮

### 4. 巡视水印设置弹窗

全局统一配置，不绑定单个计划。

字段：
- **水印文本**：文本输入，默认"课堂巡视记录"
- **显示巡视人**：开关/勾选框
- **自动获取IP信息**：开关/勾选框
- **显示计划名称**：开关/勾选框
- **水印颜色**：预设颜色选择器（红/黑/白/蓝 + 自定义） + 透明度
- **过滤摄像头**：勾选框
- **过滤麦克风**：勾选框
- 底部「恢复默认」「取消」「保存」
- 预览区域：模拟转播画面显示水印效果

### 5. 计划详情查看

点击「查看」可查看计划完整信息，包括基本信息、关联设备列表、执行历史。

## 数据与状态管理

- 所有数据为前端仿真 mock 数据
- 水印配置存储于 `localStorage`（key: `news-broadcast-watermark`）
- 计划数据存储于组件内 `useState`

## 技术实现

### 组件结构

```
NewsBroadcast.tsx
├── 标题区
├── Tab 切换（计划列表 / 执行结果）
├── 计划列表表格
│   ├── 搜索+筛选
│   ├── 表格+分页
│   └── 操作菜单
├── 执行结果表格
│   ├── 筛选
│   └── 表格+分页
├── CreatePlanDialog（创建/编辑计划弹窗）
│   ├── 基本信息
│   ├── 方式选择
│   ├── 循环模式+时间配置
│   └── 设备选择
├── WatermarkDialog（巡视水印设置弹窗）
│   ├── 字段配置
│   └── 预览区域
└── PlanDetailDialog（计划详情弹窗）
    ├── 基本信息
    ├── 关联设备
    └── 执行历史
```

### 依赖

无新增依赖。使用现有 MUI 组件（Dialog、Table、Tabs、Chip、Button 等）。

## 菜单与路由

**App.tsx 修改：**
- 在 `menuGroups` 的 `school-level` → `central` 子菜单中新增：
  ```
  { id: 'news-broadcast', label: '时事转播', pageId: 'news-broadcast' }
  ```
- 引入 `NewsBroadcast` 组件
- 在路由条件渲染中添加：`currentPage === 'news-broadcast' ? <NewsBroadcast /> :`
- 扩展 `currentPage` 联合类型

**permissions.ts 修改：**
- 在 `ALL_PAGES` 新增 `news-broadcast` 页面配置：

```typescript
{
  key: 'news-broadcast',
  label: '时事转播',
  buttons: [
    { key: 'create', label: '新建计划' },
    { key: 'edit', label: '编辑' },
    { key: 'delete', label: '删除' },
    { key: 'toggle-status', label: '启停' },
    { key: 'config-watermark', label: '水印设置' },
  ],
},
```
