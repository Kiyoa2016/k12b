# 层级权限控制 - 学校授权功能设计文档

## 概述

实现两级权限继承体系：果仁云平台 → 学校授权（新增）→ 角色权限（已有）。云平台管理员通过"学校授权"页面配置每个学校可使用的功能模块，学校内的角色管理只能配置已被授权的模块。

## 范围

**新增文件：**
- `src/app/store/SchoolAuthorizationContext.tsx` — 学校授权数据 Context
- `src/app/components/SchoolAuthorization.tsx` — 学校授权配置页面

**修改文件：**
- `src/app/components/PermissionConfig.tsx` — 角色权限配置只显示学校已授权模块
- `src/app/components/RoleManagement.tsx` — 显示当前学校上下文
- `src/app/App.tsx` — 菜单、路由、Provider 包裹
- `src/app/types/permissions.ts` — 新增类型定义

## 架构

```
SchoolAuthorizationProvider (新增 Context)
  │
  ├── 存储: schoolId → SchoolAuth (授权页面 key 列表)
  ├── 当前选中学校 ID
  │
  ├── SchoolAuthorization.tsx (新增)
  │   └── 表格列出所有学校 → 点击"配置"弹窗授权模块
  │
  ├── RoleManagement.tsx (修改)
  │   └── 显示当前学校名称
  │
  └── PermissionConfig.tsx (修改)
      └── ALL_PAGES → 过滤为学校已授权页面 → 渲染开关
```

## 菜单结构

```
果仁云菜单
  ├── 学校管理
  ├── 培训视频
  │     ├── 培训视频
  │     └── 培训视频管理
  ├── AI 模块
  │     └── AI 图片处理
  └── 学校授权 ← 新增
```

## 数据模型

```typescript
interface SchoolAuth {
  schoolId: string;
  schoolName: string;
  authorizedPageKeys: string[];
}
```

## SchoolAuthorization 页面布局

```
┌──────────────────────────────────────────────────────────────┐
│  🏫 学校授权                                                   │
│  配置各学校可使用的功能模块，学校内的角色权限受限于此配置       │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 学校名称         | 已授权模块  | 上次修改 | 操作    │    │
│  │ 仁寿中学(双流)    17/20 个    06-25    [配置]       │    │
│  │ 锦鑫中学          8/20 个     06-24    [配置]       │    │
│  │ 师资七中(林荫)    12/20 个    06-20    [配置]       │    │
│  └──────────────────────────────────────────────────────┘    │
│  分页                                                         │
└──────────────────────────────────────────────────────────────┘
```

### 配置弹窗

点击"配置"弹出 Dialog，显示所有校级菜单可用的模块列表，用 Switch/Chip 开关选择。

## 权限继承效果

```
云平台 → 学校授权页面
  └── 锦鑫中学 → 授权 8 个模块
        └── 角色管理 → 编辑角色权限
              └── 权限配置弹窗只显示 8 个模块
                    └── 老师角色只能获得这 8 个模块的权限
```

## 涉及修改的文件

### SchoolAuthorizationContext.tsx
- createContext + Provider + useSchoolAuthorization hook
- localStorage 持久化
- 默认授权：3 所 mock 学校各有不同的授权页面列表
- 暴露方法：updateSchoolAuth, getSchoolAuth, setCurrentSchoolId

### SchoolAuthorization.tsx
- 从 SchoolManagement 复用 mock 学校数据（保持数据一致）
- 表格展示 + 配置弹窗
- 操作类型 Chip 显示各模块名称
- 空状态：无学校时提示

### PermissionConfig.tsx
- import useSchoolAuthorization
- 获取当前学校授权列表
- ALL_PAGES.map 改为 availablePages.map
- 显示"当前学校仅授权了 X 个模块"的提示

### RoleManagement.tsx
- 顶部显示当前学校名称 Banner

### App.tsx
- import SchoolAuthorizationProvider + SchoolAuthorization
- 用 Provider 包裹子组件
- 菜单项 + 路由条件渲染

## Mock 数据

三所学校，授权模块各不相同，用于演示层级权限效果。
