# 供应商管理模块设计

## 1. 背景与目标

在果仁云菜单中增加"供应商管理"业务模块。当前学校管理中的"经销商"信息以扁平字段（`dealerName`, `dealerPhone`, `dealerAddress`）直接存储在学校数据中，缺乏独立管理能力。目标是将其升级为独立实体，支持供应商的增删改查，并在学校管理中建立关联。

核心需求：
- 供应商作为独立主数据维护
- 创建/编辑学校时可选择或搜索供应商
- 通过供应商可查看其下所有关联学校

## 2. 数据模型

### 2.1 Supplier 接口

```typescript
interface Supplier {
  id: string;
  name: string;           // 供应商名称
  phone: string;          // 联系电话
  address: string;        // 地址
  contactPerson: string;  // 联系人（新增）
  unifiedCode: string;    // 统一社会信用代码（新增）
  contractInfo: string;   // 合同信息（新增）
}
```

### 2.2 School 接口改造

将现有三个经销商字段替换为 `supplierId`：

```typescript
// 改造前
interface School {
  // ... 其他字段
  dealerName: string;
  dealerPhone: string;
  dealerAddress: string;
}

// 改造后
interface School {
  // ... 其他字段
  supplierId: string;  // 关联 Supplier.id
}
```

展示供应商信息时通过 `supplierId` 从 `SupplierContext` 获取完整信息。

## 3. 状态管理

新建 `SupplierContext`（遵循现有 `SchoolAuthorizationContext` / `PermissionContext` 模式）：

```typescript
interface SupplierContextType {
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Supplier;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  getSupplier: (id: string) => Supplier | undefined;
  getSupplierByName: (name: string) => Supplier | undefined;
}
```

- 数据持久化到 `localStorage`（键名：`app-suppliers`）
- 默认初始数据从现有 Mock 学校中的经销商提取去重后生成
- 添加学校时若输入全新供应商名称则自动创建供应商

## 4. 组件设计

### 4.1 SupplierManagement（主页面）

布局：左侧供应商列表，右侧详情/关联学校

**列表区域：**
- 表格列：供应商名称、联系人、电话、统一社会信用代码、关联学校数
- 顶部搜索框（名称/信用代码模糊搜索）
- "添加供应商"按钮
- 每行操作：编辑、删除

**详情区域：**
- 点击供应商行 → 右侧展示详情
- 详情 Tab：基本信息（全部字段）、关联学校列表（从学校列表中筛选 `supplierId === id`）
- 关联学校列表展示学校名称、编码、授权模块数

**添加/编辑对话框：**
- 名称*（必填）、联系人*、联系电话、地址、统一社会信用代码、合同信息
- 编辑时预填充现有数据

**删除确认：**
- 弹出确认框，若有关联学校则列出学校名称并警告"删除后关联将断开"

### 4.2 SchoolManagement 改造

**添加学校弹窗：**
- "经销商信息"行改为从 SupplierContext 的 Autocomplete 选择
- 数据源：`suppliers` 列表
- 支持输入新名称模糊匹配（`freeSolo`），输入新名称 → 自动创建供应商
- 选择已有供应商后自动填充联系人、电话、地址
- 存储时只写入 `supplierId`

**学校详情弹窗：**
- "经销商信息" Tab 从 `supplierId` 查询展示完整供应商信息
- 增加"查看供应商"按钮（跳转至供应商管理页高亮该供应商）

**学校表格：**
- "经销商"列改为展示供应商名称（从 SupplierContext 查询）

## 5. 菜单和路由

### 5.1 菜单配置

在 `menuGroups` 的"果仁云菜单"下新增子菜单项：

```typescript
{
  id: 'guorenyun',
  label: '果仁云菜单',
  children: [
    { id: 'school', label: '学校管理', pageId: 'school' },
    { id: 'supplier', label: '供应商管理', pageId: 'supplier' },  // ← 新增
    // ... 其余不变
  ],
}
```

### 5.2 路由

`currentPage` 类型扩展 `'supplier'`：

```typescript
const [currentPage, setCurrentPage] = useState<
  // ... 现有类型 | 'supplier'
>('template');
```

`App.tsx` 条件渲染增加：

```typescript
) : currentPage === 'supplier' ? (
  <SupplierManagement />
) : // ...
```

## 6. 权限集成

在 `ALL_PAGES` 中注册新页面：

```typescript
{
  key: 'supplier',
  label: '供应商管理',
  buttons: [
    { key: 'add', label: '添加供应商' },
    { key: 'edit', label: '编辑' },
    { key: 'delete', label: '删除' },
  ],
}
```

## 7. 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/app/components/SupplierManagement.tsx` | **新建** | 供应商列表/CRUD/关联学校查看 |
| `src/app/store/SupplierContext.tsx` | **新建** | 供应商状态管理 Context |
| `src/app/types/permissions.ts` | 修改 | ALL_PAGES 添加 supplier 配置 |
| `src/app/components/SchoolManagement.tsx` | 修改 | Supplier 选择/展示改造 |
| `src/app/App.tsx` | 修改 | 菜单、路由、import |

## 8. 边界情况处理

- **删除有学校的供应商**：弹窗列出学校名称，确认后删除，学校的 `supplierId` 置空
- **供应商名称变更**：学校中自动反映（通过 `supplierId` 引用，非冗余存储）
- **空状态**：无供应商时显示引导提示"添加第一个供应商"
- **搜索无结果**：显示"未找到匹配的供应商"
- **学校关联的供应商被删除**：学校展示"供应商已删除"，可重新选择
