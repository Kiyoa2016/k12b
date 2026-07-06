# 供应商管理模块 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建独立的供应商管理模块，支持供应商 CRUD、学校关联供应商、按供应商查看关联学校。

**Architecture:** 新增 `SupplierContext`（React Context + localStorage 持久化，遵循现有 PermissionContext/SchoolAuthorizationContext 模式）；新增 `SupplierManagement` 组件；改造 `SchoolManagement` 将经销商字段替换为 `supplierId` 引用；在 `App.tsx` 中接入菜单和路由。

**Tech Stack:** React + TypeScript + MUI v7 + Autocomplete

**Spec:** `docs/superpowers/specs/2026-07-06-supplier-management-design.md`

## Global Constraints

- 遵循现有 Context 模式（`createContext` + `useContext` hook + Provider + localStorage 持久化）
- 组件使用 MUI v7 组件库 + Tailwind CSS 类名
- 所有文本使用中文
- 学校数据中的 supplierId 引用 Supplier.id，非冗余存储完整信息

---

### Task 1: 创建 SupplierContext

**Files:**
- Create: `src/app/store/SupplierContext.tsx`

**Interfaces:**
- Produces: `SupplierContextType` with `{ suppliers, addSupplier, updateSupplier, deleteSupplier, getSupplier, getSupplierByName }`
- Produces: `SupplierProvider` component (wraps children)
- Produces: `useSupplier()` hook

- [ ] **Step 1: 创建 SupplierContext 文件**

```typescript
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  contactPerson: string;
  unifiedCode: string;
  contractInfo: string;
}

// 从现有 Mock 学校经销商提取的初始数据
const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: 's-1',
    name: '四川云教科技有限公司',
    phone: '028-85551234',
    address: '成都市高新区天府大道1388号',
    contactPerson: '张经理',
    unifiedCode: '91510100MA6CM*****',
    contractInfo: '2026年度框架协议',
  },
  {
    id: 's-2',
    name: '成都华育信息技术有限公司',
    phone: '028-85555678',
    address: '成都市武侯区科华北路99号',
    contactPerson: '李经理',
    unifiedCode: '91510100MA6CM*****',
    contractInfo: '2026年度框架协议',
  },
  {
    id: 's-3',
    name: '德阳博睿教育设备有限公司',
    phone: '0838-2500888',
    address: '德阳市旌阳区岷江西路一段88号',
    contactPerson: '王经理',
    unifiedCode: '91510600MA6CM*****',
    contractInfo: '2026年度框架协议',
  },
];

interface SupplierContextType {
  suppliers: Supplier[];
  addSupplier: (data: Omit<Supplier, 'id'>) => Supplier;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  getSupplier: (id: string) => Supplier | undefined;
  getSupplierByName: (name: string) => Supplier | undefined;
}

const SupplierContext = createContext<SupplierContextType | null>(null);

export function SupplierProvider({ children }: { children: ReactNode }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem('app-suppliers');
      if (saved) return JSON.parse(saved) as Supplier[];
    } catch { /* ignore */ }
    return DEFAULT_SUPPLIERS;
  });

  const persist = (next: Supplier[]) => {
    setSuppliers(next);
    localStorage.setItem('app-suppliers', JSON.stringify(next));
  };

  const addSupplier = useCallback((data: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = { id: 's-' + Date.now().toString(), ...data };
    setSuppliers((prev) => {
      const next = [...prev, newSupplier];
      localStorage.setItem('app-suppliers', JSON.stringify(next));
      return next;
    });
    return newSupplier;
  }, []);

  const updateSupplier = useCallback((id: string, data: Partial<Supplier>) => {
    setSuppliers((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...data } : s));
      localStorage.setItem('app-suppliers', JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteSupplier = useCallback((id: string) => {
    setSuppliers((prev) => {
      const next = prev.filter((s) => s.id !== id);
      localStorage.setItem('app-suppliers', JSON.stringify(next));
      return next;
    });
  }, []);

  const getSupplier = useCallback(
    (id: string) => suppliers.find((s) => s.id === id),
    [suppliers]
  );

  const getSupplierByName = useCallback(
    (name: string) => suppliers.find((s) => s.name === name),
    [suppliers]
  );

  return (
    <SupplierContext.Provider
      value={{ suppliers, addSupplier, updateSupplier, deleteSupplier, getSupplier, getSupplierByName }}
    >
      {children}
    </SupplierContext.Provider>
  );
}

export function useSupplier() {
  const ctx = useContext(SupplierContext);
  if (!ctx) throw new Error('useSupplier must be used inside SupplierProvider');
  return ctx;
}
```

- [ ] **Step 2: 校验编译**

Run: `npx tsc --noEmit` 确认无类型错误

- [ ] **Step 3: 提交**

```bash
git add src/app/store/SupplierContext.tsx
git commit -m "feat(supplier): 创建 SupplierContext 状态管理"
```

---

### Task 2: 在权限系统中注册供应商管理页面

**Files:**
- Modify: `src/app/types/permissions.ts`

**Interfaces:**
- Consumes: (none)
- Produces: ALL_PAGES 新增 `supplier` 条目

- [ ] **Step 1: 在 ALL_PAGES 数组中添加 supplier 配置**

在 `permissions.ts` 的 `ALL_PAGES` 数组中，在 `ai-image` 条目后面（或任意合适位置）追加：

```typescript
  {
    key: 'supplier',
    label: '供应商管理',
    buttons: [
      { key: 'add', label: '添加供应商' },
      { key: 'edit', label: '编辑' },
      { key: 'delete', label: '删除' },
    ],
  },
```

- [ ] **Step 2: 提交**

```bash
git add src/app/types/permissions.ts
git commit -m "feat(supplier): 注册供应商管理页面到权限系统"
```

---

### Task 3: 创建 SupplierManagement 组件

**Files:**
- Create: `src/app/components/SupplierManagement.tsx`

**Interfaces:**
- Consumes: `useSupplier()` from `SupplierContext`; `School` interface (local to SchoolManagement.tsx — need to know school list)
- Produces: `<SupplierManagement />` — 完整的供应商管理页面

**Note:** 为了显示关联学校，SupplierManagement 需要访问学校列表。由于当前学校数据是 `SchoolManagement` 的本地 state，需要将其提升或通过 context 共享。在本方案中，我们采用轻量做法：在 `SupplierManagement` 内部维护一份学校查询，通过 `supplierId` 过滤展示关联学校。学校数据通过新增的 `SchoolContext` 或将学校数据提升到顶层来实现。

**简化做法：** 直接在 `SupplierManagement` 中添加一个 `getSchoolsBySupplierId` 函数，从 `localStorage` 读取学校数据（模拟数据共享），或者直接内嵌 mock 学校数据用于展示。

考虑到这是原型设计阶段，SupplierManagement 内联引用 MOCK_SCHOOLS 中的学校数据，按 supplierId 过滤。

- [ ] **Step 1: 创建 SupplierManagement 组件结构**

```typescript
import { useState, useMemo } from 'react';
import {
  Box, Container, Typography, TextField, Button,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, InputAdornment, Paper, Divider,
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Business, Close,
  School as SchoolIcon, Phone, Person, Badge, Description,
} from '@mui/icons-material';
import { useSupplier, type Supplier } from '../store/SupplierContext';

// 学校数据接口（与 SchoolManagement 保持一致）
interface SchoolBrief {
  id: string;
  code: string;
  name: string;
  organization: string;
  supplierId: string;
}

// 从 localStorage 读取学校数据
function loadSchools(): SchoolBrief[] {
  return [
    { id: '1', code: 'SC510104A001', name: '成都市仁寿中学（双流校区）', organization: '成都市教育局', supplierId: 's-1' },
    { id: '2', code: 'SC510105B002', name: '成都市锦鑫中学', organization: '成都市教育局', supplierId: 's-2' },
    { id: '3', code: 'SC510106C003', name: '成都师资七中学（林荫校区）', organization: '成都市教育局', supplierId: 's-1' },
    { id: '4', code: 'SC510681D001', name: '广汉中学', organization: '广汉市教育局', supplierId: 's-3' },
    { id: '5', code: 'SC510781E001', name: '绵竹中学', organization: '绵竹市教育和体育局', supplierId: 's-3' },
  ];
}

export default function SupplierManagement() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useSupplier();

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '', phone: '', address: '',
    contactPerson: '', unifiedCode: '', contractInfo: '',
  });

  const allSchools = useMemo(() => loadSchools(), []);

  // 过滤供应商
  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.unifiedCode.includes(searchTerm) ||
    s.contactPerson.includes(searchTerm)
  );

  const pagedSuppliers = filteredSuppliers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // 获取供应商关联的学校数
  const getSchoolCount = (supplierId: string) =>
    allSchools.filter((s) => s.supplierId === supplierId).length;

  // 获取供应商关联的学校列表
  const getRelatedSchools = (supplierId: string) =>
    allSchools.filter((s) => s.supplierId === supplierId);

  // 添加供应商
  const handleAdd = () => {
    if (!formData.name || !formData.contactPerson) return;
    addSupplier({
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      contactPerson: formData.contactPerson,
      unifiedCode: formData.unifiedCode,
      contractInfo: formData.contractInfo,
    });
    setAddDialogOpen(false);
    setFormData({ name: '', phone: '', address: '', contactPerson: '', unifiedCode: '', contractInfo: '' });
  };

  // 编辑供应商
  const openEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone,
      address: supplier.address,
      contactPerson: supplier.contactPerson,
      unifiedCode: supplier.unifiedCode,
      contractInfo: supplier.contractInfo,
    });
    setEditDialogOpen(true);
  };

  const handleEdit = () => {
    if (!editingSupplier || !formData.name || !formData.contactPerson) return;
    updateSupplier(editingSupplier.id, formData);
    setEditDialogOpen(false);
    setFormData({ name: '', phone: '', address: '', contactPerson: '', unifiedCode: '', contractInfo: '' });
  };

  // 删除供应商
  const openDelete = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!supplierToDelete) return;
    deleteSupplier(supplierToDelete.id);
    if (selectedSupplier?.id === supplierToDelete.id) setSelectedSupplier(null);
    setDeleteDialogOpen(false);
    setSupplierToDelete(null);
  };

  // 联动学校管理（跳转）
  // 由于没有 router，这里直接通过 parent callback 处理；暂时用占位

  // ... 渲染部分将使用完整的 JSX
```

- [ ] **Step 2: 完成 SupplierManagement 完整渲染**

完整的 JSX 包括：
1. 标题栏：标题 + "添加供应商"按钮
2. 搜索框
3. 供应商表格（左侧主区域）：名称、联系人、电话、信用代码、关联学校数、操作按钮
4. 右侧详情面板（选中供应商时）：显示完整信息和关联学校列表
5. 添加/编辑对话框
6. 删除确认对话框

完整组件代码（约 300 行 JSX），我会在实现时直接写出。

- [ ] **Step 3: 构建验证**

Run: `npx tsc --noEmit` 确认无类型错误
Run: `pnpm build` 确认构建通过

- [ ] **Step 4: 提交**

```bash
git add src/app/components/SupplierManagement.tsx
git commit -m "feat(supplier): 创建供应商管理页面组件"
```

---

### Task 4: 改造 SchoolManagement 关联供应商

**Files:**
- Modify: `src/app/components/SchoolManagement.tsx`

**Interfaces:**
- Consumes: `useSupplier()` from `SupplierContext`
- Produces: 改造后的 SchoolManagement 使用 `supplierId` 替代 dealer 字段

- [ ] **Step 1: 在 SchoolManagement 中引入 useSupplier**

在文件顶部 import 中添加：
```typescript
import { useSupplier } from '../store/SupplierContext';
```

- [ ] **Step 2: 改造 School 接口**

将：
```typescript
interface School {
  // ...
  dealerName: string;
  dealerPhone: string;
  dealerAddress: string;
}
```

改为：
```typescript
interface School {
  // ...
  supplierId: string;
}
```

- [ ] **Step 3: 更新 MOCK_SCHOOLS 数据**

将每个学校的 `dealerName`, `dealerPhone`, `dealerAddress` 替换为对应的 `supplierId`：

```typescript
const MOCK_SCHOOLS: School[] = [
  {
    id: '1', code: 'SC510104A001', name: '成都市仁寿中学（双流校区）',
    // ... 其他字段
    supplierId: 's-1',
  },
  {
    id: '2', code: 'SC510105B002', name: '成都市锦鑫中学',
    // ...
    supplierId: 's-2',
  },
  // ... 其余学校
];
```

映射关系：
- 学校 1（仁寿中学）→ s-1（四川云教科技有限公司）
- 学校 2（锦鑫中学）→ s-2（成都华育信息技术有限公司）
- 学校 3（师资七中学）→ s-1（四川云教科技有限公司）
- 学校 4（广汉中学）→ s-3（德阳博睿教育设备有限公司）
- 学校 5（绵竹中学）→ s-3（德阳博睿教育设备有限公司）

- [ ] **Step 4: 在组件中获取供应商数据**

在 SchoolManagement 函数组件内：
```typescript
const { suppliers, getSupplier, addSupplier, getSupplierByName } = useSupplier();
```

- [ ] **Step 5: 替换 Autocomplete 组件的数据源**

将 Autocomplete 的 `options` 从 `DEALER_OPTIONS` 改为 `suppliers`：

```typescript
<Autocomplete
  freeSolo
  size="small"
  options={suppliers}
  getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
  value={suppliers.find(s => s.id === newSchool.supplierId) || null}
  onInputChange={(_, value) => {
    // 输入变化时置空 supplierId
    setNewSchool({ ...newSchool, supplierId: '' });
  }}
  onChange={(_, value) => {
    if (value && typeof value !== 'string') {
      setNewSchool({ ...newSchool, supplierId: value.id });
    } else if (value && typeof value === 'string') {
      // 输入全新名称 → 自动创建供应商
      const existing = getSupplierByName(value);
      if (existing) {
        setNewSchool({ ...newSchool, supplierId: existing.id });
      } else {
        const created = addSupplier({ name: value, phone: '', address: '', contactPerson: '', unifiedCode: '', contractInfo: '' });
        setNewSchool({ ...newSchool, supplierId: created.id });
      }
    }
  }}
  renderOption={(props, option) => {
    const { key, ...rest } = props;
    return (
      <Box component="li" key={key} {...rest}>
        <Box>
          <Typography variant="body2" className="font-medium">{option.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {option.contactPerson} | {option.phone}
          </Typography>
        </Box>
      </Box>
    );
  }}
  renderInput={(params) => (
    <TextField
      {...params}
      fullWidth
      placeholder="搜索或输入供应商名称"
      InputProps={{
        ...params.InputProps,
        startAdornment: (
          <InputAdornment position="start">
            <Business fontSize="small" color="action" />
          </InputAdornment>
        ),
      }}
    />
  )}
/>
```

- [ ] **Step 6: 更新添加学校的表单初始值**

将 `newSchool` 的初始 state 中 `dealerName: '', dealerPhone: '', dealerAddress: ''` 替换为 `supplierId: ''`。

- [ ] **Step 7: 更新添加学校提交处理**

在 `handleAddSchool` 中重置 `setNewSchool` 时，将 dealer 字段替换为 `supplierId: ''`。

- [ ] **Step 8: 更新表格中的经销商列**

将学校表格中的经销商列（`school.dealerName`）改为从 supplierId 查询显示：
```typescript
<TableCell>
  <Box>
    <Typography variant="body2">
      {suppliers.find(s => s.id === school.supplierId)?.name || '—'}
    </Typography>
  </Box>
</TableCell>
```

- [ ] **Step 9: 更新查看详情弹窗中的经销商信息 Tab**

在 "经销商信息" Tab（`viewTab === 1`）中，从 supplierId 查询展示：
```typescript
const supp = suppliers.find(s => s.id === selectedSchool.supplierId);
```

展示 `supp?.name`, `supp?.contactPerson`, `supp?.phone`, `supp?.address`, `supp?.unifiedCode`, `supp?.contractInfo`。

- [ ] **Step 10: 删除旧的 DEALER_OPTIONS 和 DealerOption 定义**

移除 `DEALER_OPTIONS` 常量 和 `DealerOption` 接口（不再需要）。

- [ ] **Step 11: 构建验证**

Run: `npx tsc --noEmit` 确认无类型错误

- [ ] **Step 12: 提交**

```bash
git add src/app/components/SchoolManagement.tsx
git commit -m "feat(supplier): 学校管理改用 supplierId 关联供应商"
```

---

### Task 5: 集成到 App.tsx

**Files:**
- Modify: `src/app/App.tsx`

- [ ] **Step 1: 导入 SupplierProvider 和 SupplierManagement**

在文件顶部 import 区域添加：
```typescript
import { SupplierProvider } from './store/SupplierContext';
import SupplierManagement from './components/SupplierManagement';
```

- [ ] **Step 2: 扩展 currentPage 类型**

在 `useState` 的类型联合中添加 `'supplier'`：
```typescript
const [currentPage, setCurrentPage] = useState</* ... */ | 'supplier'>('template');
```

- [ ] **Step 3: 在菜单中新增供应商管理菜单项**

在 `menuGroups` 的 "果仁云菜单" children 中，在 `school` 项之后添加：
```typescript
{ id: 'supplier', label: '供应商管理', icon: <Business />, pageId: 'supplier' },
```

同时需要 import `Business` 图标（如果尚未导入）：
```typescript
import { /* ..., */ Business } from '@mui/icons-material';
```

- [ ] **Step 4: 在条件渲染中添加 SupplierManagement**

在 `App.tsx` 的条件渲染中添加：
```typescript
) : currentPage === 'supplier' ? (
  <SupplierManagement />
) : // ...
```

位置建议：放在 `SchoolManagement` 的条件之后。

- [ ] **Step 5: 用 SupplierProvider 包裹应用**

在 `SchoolAuthorizationProvider` 外层或内层添加 SupplierProvider：
```typescript
return (
  <PermissionProvider>
  <SchoolAuthorizationProvider>
  <SupplierProvider>    {/* 新增 */}
  <Box className="min-h-screen bg-gray-50">
    {/* ... */}
  </Box>
  </SupplierProvider>   {/* 新增 */}
  </SchoolAuthorizationProvider>
  </PermissionProvider>
);
```

- [ ] **Step 6: 构建验证**

Run: `pnpm build` 确认构建通过

- [ ] **Step 7: 提交**

```bash
git add src/app/App.tsx
git commit -m "feat(supplier): 集成供应商管理模块到菜单和路由"
```

---

### Task 6: 验证完整功能

- [ ] **Step 1: 启动开发服务器**

Run: `pnpm dev` 确认无报错

- [ ] **Step 2: 手动验证功能流**

在浏览器中验证：
1. 果仁云菜单 → 供应商管理 → 显示供应商列表
2. 添加供应商 → 填写所有字段 → 保存 → 列表中显示
3. 编辑供应商 → 修改信息 → 保存
4. 删除供应商（有关联学校）→ 弹出确认框并列出学校
5. 果仁云菜单 → 学校管理 → 添加学校 → 供应商 Autocomplete 可选择/搜索供应商
6. 输入全新供应商名称 → 自动创建供应商
7. 学校详情 → 经销商信息 Tab → 显示供应商完整信息
8. 学校表格 → 供应商名称列正确显示

- [ ] **Step 3: 最终提交**

```bash
git add -A
git commit -m "feat(supplier): 完善供应商管理模块集成验证"
```
