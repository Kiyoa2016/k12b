# 层级权限控制 - 学校授权实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans

**Goal:** 实现两级权限继承：云平台为学校授权模块 → 学校内角色权限配置受限于学校授权。

**Architecture:** SchoolAuthorizationContext 管理学校→模块映射，PermissionConfig 读取映射过滤页面列表，SchoolAuthorization 页面供云平台管理员配置。

**Tech Stack:** React 18 + TypeScript, MUI v7, Tailwind CSS v4

## 全局约束

- 与现有 PermissionContext / RoleManagement 完全兼容（不破坏已有功能）
- Mock 数据三所学校各有不同授权，仿真真实场景
- localStorage 持久化学校授权配置
- ALL_PAGES 在权限配置中按学校授权过滤

---

### Task 1: permissions.ts — 新增 SchoolAuth 类型

**Files:**
- Modify: `src/app/types/permissions.ts`

在现有类型定义区域（Role 定义附近）添加：

```typescript
// 学校授权：云平台分配给学校的模块权限
export interface SchoolAuth {
  schoolId: string;
  schoolName: string;
  authorizedPageKeys: string[];
}
```

### Task 2: 新增 SchoolAuthorizationContext.tsx

**Files:**
- Create: `src/app/store/SchoolAuthorizationContext.tsx`

完整代码包含：类型导入、默认 mock 数据（3 所学校各有不同授权）、Context Provider、useSchoolAuthorization hook、持久化到 localStorage。

```typescript
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { SchoolAuth } from '../types/permissions';

// 默认模拟数据：三所学校各有不同的模块授权
const DEFAULT_SCHOOL_AUTHS: SchoolAuth[] = [
  {
    schoolId: '1',
    schoolName: '成都市仁寿中学（双流校区）',
    authorizedPageKeys: [
      'template', 'teacher', 'questionbank', 'lecture',
      'role-mgmt', 'voice-mgmt', 'cloudclassroom', 'cloudclassroom-review',
      'classroom', 'device-mgmt', 'livestream', 'info-publish',
      'security-policy', 'operation-log', 'news-broadcast', 'central-overview',
      'training-video', 'training-video-mgmt',
    ],
  },
  {
    schoolId: '2',
    schoolName: '成都市锦鑫中学',
    authorizedPageKeys: [
      'template', 'teacher', 'questionbank', 'lecture',
      'role-mgmt', 'voice-mgmt', 'classroom', 'device-mgmt',
    ],
  },
  {
    schoolId: '3',
    schoolName: '成都师资七中学（林荫校区）',
    authorizedPageKeys: [
      'template', 'teacher', 'questionbank', 'lecture',
      'role-mgmt', 'voice-mgmt', 'cloudclassroom', 'classroom',
      'device-mgmt', 'security-policy', 'operation-log', 'news-broadcast',
    ],
  },
];

interface SchoolAuthorizationContextType {
  schoolAuths: SchoolAuth[];
  currentSchoolId: string;
  setCurrentSchoolId: (id: string) => void;
  updateSchoolAuth: (schoolId: string, authorizedPageKeys: string[]) => void;
  getSchoolAuth: (schoolId: string) => SchoolAuth | undefined;
}
```

Provider 逻辑同 PermissionContext 模式：从 localStorage 读取/写入。

### Task 3: 新增 SchoolAuthorization.tsx

**Files:**
- Create: `src/app/components/SchoolAuthorization.tsx`

表格列出所有学校 → 每行显示已授权模块数/总数 → 点击"配置"打开 Dialog 勾选模块。

关键 UI 元素：
- 表格列：学校名称、已授权模块（显示为 Chip 列表）、操作（配置按钮）
- 配置弹窗：ALL_PAGES 的完整列表，用 Switch 控制开关，有全选/清空快捷操作
- 使用 SchoolManagement 中的相同学校 mock 数据（复用以确保一致）
- 设计空状态、筛选逻辑

### Task 4: 修改 PermissionConfig.tsx

**Files:**
- Modify: `src/app/components/PermissionConfig.tsx`

关键改动点：
- import useSchoolAuthorization
- 在组件中获取 currentSchoolId 和对应的学校授权
- 将 `ALL_PAGES.map(...)` 改为 `availablePages.map(...)` 
- 添加提示文字："当前学校已授权 X/Y 个模块"

```typescript
const { getSchoolAuth, currentSchoolId } = useSchoolAuthorization();
const schoolAuth = getSchoolAuth(currentSchoolId);
const availablePages = ALL_PAGES.filter(
  p => schoolAuth?.authorizedPageKeys.includes(p.key)
);
```

### Task 5: 修改 RoleManagement.tsx

**Files:**
- Modify: `src/app/components/RoleManagement.tsx`

在页面顶部添加当前学校信息 Banner。

### Task 6: 修改 App.tsx

**Files:**
- Modify: `src/app/App.tsx`

- import SchoolAuthorizationProvider + SchoolAuthorization
- 用 SchoolAuthorizationProvider 包裹现有内容
- 菜单：在 guorenyun 组中添加 `school-auth` 路由
- 路由：添加 `currentPage === 'school-auth'` 条件渲染
- 类型：添加 `'school-auth'` 到 currentPage 联合类型
