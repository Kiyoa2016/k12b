# 云课堂审核页面设计

**Goal:** 在云课堂菜单下新增二级菜单"云课堂审核"，管理员可审核教师上传的视频（通过/驳回）。

**Architecture:** 复用现有 App.tsx 二级菜单模式（与集控管理一致），新增独立审核页面组件，数据与前台云课堂视频库各自独立维护。

**Tech Stack:** React 18 + TypeScript + MUI v7 + Tailwind CSS

---

## 菜单结构

将云课堂从单级按钮改为二级下拉菜单：

```
云课堂 ▼
  ├── 云课堂 (cloudclassroom)
  └── 云课堂审核 (cloudclassroom-review)
```

与现有"集控管理"二级菜单实现方式一致，使用 `children` 属性。父项 id 改为 `cloudclassroom-parent`，避免与第一个子项 id 冲突。

## 数据模型

在 `CloudClassroom.tsx` 中新增导出类型：

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
  reviewNote?: string;     // 驳回原因
  description?: string;
}
```

审核视频库独立于 CloudClassroom 的 `videos` 状态，在审核组件内部通过 `useState` 管理 mock 数据（~10条，涵盖三种状态）。

## 页面布局

### 顶部状态筛选 Tabs

四个筛选 Tab：`全部 | 待审核 | 已通过 | 已驳回`

默认选中"全部"，数据按上传时间倒序排列。

### 表格列定义

| 列 | 内容 | 说明 |
|----|------|------|
| 视频标题 | 标题文字 | 可截断 |
| 学科 | Chip 标签 | 蓝色主色 |
| 年级 | Chip 标签 | 按学段着色 |
| 授课教师 | 教师姓名 | — |
| 上传时间 | 日期 | 格式 YYYY-MM-DD |
| 状态 | 彩色 Chip | 待审核=橙色/警告, 已通过=绿色/成功, 已驳回=红色/错误 |
| 操作 | 按钮组 | 根据状态显示不同操作项 |

### 操作逻辑

| 当前状态 | 可用操作 |
|---------|---------|
| 待审核 | 通过、驳回 |
| 已通过 | 撤销审核（回到待审核） |
| 已驳回 | 重新审核（回到待审核） |

- **通过:** 直接切换状态为 `approved`，无需额外输入
- **驳回:** 弹出 Dialog，包含驳回原因文本输入框 + 确定/取消按钮。确认后将状态设为 `rejected`，保存驳回原因
- **撤销审核 / 重新审核:** 将状态切回 `pending`，清除驳回原因

### 空状态

- 无待审核数据时显示对应提示
- 全部 Tab 下无数据时显示"暂无审核记录"

## 文件修改清单

### 新建文件
- `src/app/components/CloudClassroomReview.tsx` — 审核页面组件

### 修改文件
- `src/app/App.tsx` — 菜单结构调整、新增路由类型和条件渲染
- `src/app/components/CloudClassroom.tsx` — 导出 `ReviewVideo` 和 `ReviewStatus` 类型

## 路由集成

在 App.tsx 中：

1. `currentPage` 类型增加 `'cloudclassroom-review'`
2. 菜单项修改：
   ```typescript
   { id: 'cloudclassroom-parent', label: '云课堂', icon: <Videocam />, children: [
     { id: 'cloudclassroom', label: '云课堂' },
     { id: 'cloudclassroom-review', label: '云课堂审核' },
   ]}
   ```
3. 导航栏按钮渲染逻辑适配（带 children 的按钮点击展开 Menu 而不是切换页面）
4. 侧边栏 Drawer 适配二级菜单
5. 条件渲染增加 `cloudclassroom-review` 分支

## 与已有模式对比

- **集控管理:** parent id = `central`, children = `classroom`, `livestream`
- **云课堂:** parent id = `cloudclassroom-parent`, children = `cloudclassroom`, `cloudclassroom-review`

两个二级菜单使用完全一致的模式，App.tsx 的路由分发无需特殊处理。
