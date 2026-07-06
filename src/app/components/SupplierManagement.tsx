import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box, Container, Typography, TextField, Button,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, InputAdornment, Paper,
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Business, Close,
  Upload, Description, PictureAsPdf, Image as ImageIcon,
  Download,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useSupplier, type Supplier, type ContractFile } from '../store/SupplierContext';

// ─── 工具：判断文件是否为图片 ───

function isImageType(mime: string) {
  return ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp'].includes(mime);
}

function isPdfType(mime: string) {
  return mime === 'application/pdf';
}

// ─── 工具：格式化文件大小 ───

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── 学校数据接口（与 SchoolManagement 保持一致） ───

interface SchoolBrief {
  id: string;
  code: string;
  name: string;
  organization: string;
  supplierId: string;
  opsDeviceCount: number;
}

// ─── Mock 学校数据（关联供应商） ───

function loadSchools(): SchoolBrief[] {
  return [
    { id: '1', code: 'SC510104A001', name: '成都市仁寿中学（双流校区）', organization: '成都市教育局', supplierId: 's-1', opsDeviceCount: 48 },
    { id: '2', code: 'SC510105B002', name: '成都市锦鑫中学', organization: '成都市教育局', supplierId: 's-2', opsDeviceCount: 32 },
    { id: '3', code: 'SC510106C003', name: '成都师资七中学（林荫校区）', organization: '成都市教育局', supplierId: 's-1', opsDeviceCount: 56 },
    { id: '4', code: 'SC510681D001', name: '广汉中学', organization: '广汉市教育局', supplierId: 's-3', opsDeviceCount: 24 },
    { id: '5', code: 'SC510781E001', name: '绵竹中学', organization: '绵竹市教育和体育局', supplierId: 's-3', opsDeviceCount: 36 },
  ];
}

// ─── 主组件 ───

export default function SupplierManagement() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useSupplier();

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [schoolDialogSupplier, setSchoolDialogSupplier] = useState<Supplier | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    contactPerson: '',
    unifiedCode: '',
    contractFile: null as ContractFile | null,
  });

  // ─── 预览对话框状态 ───
  const [previewSupplier, setPreviewSupplier] = useState<Supplier | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const allSchools = useMemo(() => loadSchools(), []);

  // ─── 过滤供应商 ───

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.unifiedCode.includes(searchTerm) ||
    s.contactPerson.includes(searchTerm)
  );

  const pagedSuppliers = filteredSuppliers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // 搜索时重置页码
  useEffect(() => { setPage(0); }, [searchTerm]);

  // ─── 供应商关联学校数 ───

  const getSchoolCount = (supplierId: string) =>
    allSchools.filter((s) => s.supplierId === supplierId).length;

  const getRelatedSchools = (supplierId: string) =>
    allSchools.filter((s) => s.supplierId === supplierId);

  // ─── 供应商 OPS 设备总数 ───

  const getOPSDeviceTotal = (supplierId: string) =>
    allSchools
      .filter((s) => s.supplierId === supplierId)
      .reduce((sum, s) => sum + s.opsDeviceCount, 0);

  // ─── 添加供应商 ───

  const handleAdd = () => {
    if (!formData.name || !formData.contactPerson) return;
    addSupplier({
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      contactPerson: formData.contactPerson,
      unifiedCode: formData.unifiedCode,
      contractFile: formData.contractFile,
    });
    setAddDialogOpen(false);
    resetForm();
  };

  // ─── 编辑供应商 ───

  const openEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone,
      address: supplier.address,
      contactPerson: supplier.contactPerson,
      unifiedCode: supplier.unifiedCode,
      contractFile: supplier.contractFile,
    });
    setEditDialogOpen(true);
  };

  const handleEdit = () => {
    if (!editingSupplier || !formData.name || !formData.contactPerson) return;
    updateSupplier(editingSupplier.id, formData);
    setEditDialogOpen(false);
    resetForm();
  };

  // ─── 删除供应商 ───

  const openDelete = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!supplierToDelete) return;
    deleteSupplier(supplierToDelete.id);
    setDeleteDialogOpen(false);
    setSupplierToDelete(null);
  };

  // ─── 工具函数 ───

  const resetForm = () => {
    setFormData({ name: '', phone: '', address: '', contactPerson: '', unifiedCode: '', contractFile: null });
    setEditingSupplier(null);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ─── 合同文件上传处理 ───

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      // data:application/pdf;base64,...  → 去掉 data:... 前缀
      const base64 = data.split(',')[1];
      setFormData((prev) => ({
        ...prev,
        contractFile: {
          name: file.name,
          data: base64,
          type: file.type,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileRemove = () => {
    setFormData((prev) => ({ ...prev, contractFile: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  /** 获取文件对应的图标组件 */
  const getFileIcon = (file: ContractFile) => {
    if (isImageType(file.type)) return <ImageIcon className="text-green-500" />;
    if (isPdfType(file.type)) return <PictureAsPdf className="text-red-500" />;
    return <Description className="text-blue-500" />;
  };

  const openAddDialog = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  const openSchoolDialog = (supplier: Supplier) => {
    setSchoolDialogSupplier(supplier);
  };

  const closeSchoolDialog = () => {
    setSchoolDialogSupplier(null);
  };

  // ─── 渲染 ───

  return (
    <Box className="min-h-screen bg-gray-50">
      <Container maxWidth="xl" className="py-6">
        {/* 标题栏 */}
        <Box className="mb-6 flex items-center justify-between">
          <Typography variant="h5" className="font-bold flex items-center gap-2">
            <Business className="text-blue-600" />
            供应商管理
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={openAddDialog}>
            添加供应商
          </Button>
        </Box>

        {/* 搜索栏 */}
        <Box className="mb-4">
          <TextField
            size="small"
            placeholder="搜索供应商名称、联系人或信用代码..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
              ),
            }}
            className="w-96"
          />
        </Box>

        {/* 供应商表格 */}
        <Paper className="rounded-lg overflow-hidden">
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell sx={{ fontWeight: 600 }}>供应商名称</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>联系人</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>联系电话</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>统一社会信用代码</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>合同附件</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>关联学校数</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>OPS设备总数</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Box className="text-center text-gray-400">
                        <Business sx={{ fontSize: 48 }} className="mb-2" />
                        <Typography variant="body2">
                        {suppliers.length === 0 ? '暂无供应商，点击「添加供应商」创建' : '未找到匹配的供应商'}
                      </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedSuppliers.map((supplier) => (
                    <TableRow key={supplier.id} hover>
                      <TableCell>
                        <Typography variant="body2" className="font-medium">
                          {supplier.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{supplier.contactPerson}</TableCell>
                      <TableCell>{supplier.phone}</TableCell>
                      <TableCell>
                        <Typography variant="body2" className="font-mono text-xs">
                          {supplier.unifiedCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {supplier.contractFile ? (
                          <Box className="flex items-center gap-1">
                            {getFileIcon(supplier.contractFile)}
                            <span
                              className="text-blue-600 underline underline-offset-2 cursor-pointer hover:text-blue-800 text-sm truncate max-w-[120px] inline-block"
                              title={supplier.contractFile.name}
                              onClick={() => setPreviewSupplier(supplier)}
                            >
                              {supplier.contractFile.name}
                            </span>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-blue-600 underline underline-offset-2 cursor-pointer hover:text-blue-800"
                          onClick={() => openSchoolDialog(supplier)}
                        >
                          {getSchoolCount(supplier.id)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" className="font-semibold text-blue-600">
                          {getOPSDeviceTotal(supplier.id)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box className="flex gap-1">
                          <IconButton size="small" color="primary" onClick={() => openEdit(supplier)}>
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => openDelete(supplier)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredSuppliers.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="每页行数："
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count}`}
          />
        </Paper>

        {/* ====== 添加供应商对话框 ====== */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb', pb: 2 }}>
            <Box className="flex items-center justify-between">
              <Box className="flex items-center gap-2">
                <Business className="text-blue-600" />
                <Typography variant="h6">添加供应商</Typography>
              </Box>
              <IconButton onClick={() => setAddDialogOpen(false)} size="small"><Close /></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: '16px !important' }}>
            <Box className="py-2">
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '16px 12px' }}>
                <tbody>
                  {/* 第1行：供应商名称、联系人 */}
                  <tr>
                    <td style={{ width: '50%' }}>
                      <Box>
                        <Typography variant="body2" className="mb-2">
                          <span className="text-red-600">* </span>供应商名称:
                        </Typography>
                        <TextField
                          fullWidth size="small"
                          value={formData.name}
                          onChange={(e) => handleFormChange('name', e.target.value)}
                          placeholder="请输入供应商名称"
                        />
                      </Box>
                    </td>
                    <td style={{ width: '50%' }}>
                      <Box>
                        <Typography variant="body2" className="mb-2">
                          <span className="text-red-600">* </span>联系人:
                        </Typography>
                        <TextField
                          fullWidth size="small"
                          value={formData.contactPerson}
                          onChange={(e) => handleFormChange('contactPerson', e.target.value)}
                          placeholder="请输入联系人"
                        />
                      </Box>
                    </td>
                  </tr>
                  {/* 第2行：联系电话、地址 */}
                  <tr>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">联系电话:</Typography>
                        <TextField
                          fullWidth size="small"
                          value={formData.phone}
                          onChange={(e) => handleFormChange('phone', e.target.value)}
                          placeholder="请输入联系电话"
                        />
                      </Box>
                    </td>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">地址:</Typography>
                        <TextField
                          fullWidth size="small"
                          value={formData.address}
                          onChange={(e) => handleFormChange('address', e.target.value)}
                          placeholder="请输入地址"
                        />
                      </Box>
                    </td>
                  </tr>
                  {/* 第3行：统一社会信用代码、合同附件 */}
                  <tr>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">统一社会信用代码:</Typography>
                        <TextField
                          fullWidth size="small"
                          value={formData.unifiedCode}
                          onChange={(e) => handleFormChange('unifiedCode', e.target.value)}
                          placeholder="请输入信用代码"
                        />
                      </Box>
                    </td>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">合同附件:</Typography>
                        <Box className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50">
                          {formData.contractFile ? (
                            <Box className="flex items-center justify-between gap-2">
                              <Box className="flex items-center gap-2 flex-1 min-w-0">
                                {getFileIcon(formData.contractFile)}
                                <Typography variant="body2" className="truncate" title={formData.contractFile.name}>
                                  {formData.contractFile.name}
                                </Typography>
                              </Box>
                              <IconButton size="small" color="error" onClick={handleFileRemove} title="移除文件">
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          ) : (
                            <Box className="flex items-center justify-center">
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Upload />}
                                component="label"
                              >
                                选择文件
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  hidden
                                  accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx"
                                  onChange={(e) => {
                                    handleFileSelect(e.target.files?.[0] ?? null);
                                    e.target.value = '';
                                  }}
                                />
                              </Button>
                              <Typography variant="caption" color="text.disabled" className="ml-2">
                                支持 PDF、图片、Word 文档
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Box>
          </DialogContent>
          <DialogActions className="px-6 pb-4 border-t">
            <Button onClick={() => setAddDialogOpen(false)} variant="outlined">取消</Button>
            <Button
              onClick={handleAdd}
              variant="contained"
              disabled={!formData.name || !formData.contactPerson}
            >
              确定
            </Button>
          </DialogActions>
        </Dialog>

        {/* ====== 编辑供应商对话框 ====== */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb', pb: 2 }}>
            <Box className="flex items-center justify-between">
              <Box className="flex items-center gap-2">
                <Business className="text-blue-600" />
                <Typography variant="h6">编辑供应商</Typography>
              </Box>
              <IconButton onClick={() => setEditDialogOpen(false)} size="small"><Close /></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: '16px !important' }}>
            <Box className="py-2">
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '16px 12px' }}>
                <tbody>
                  {/* 第1行：供应商名称、联系人 */}
                  <tr>
                    <td style={{ width: '50%' }}>
                      <Box>
                        <Typography variant="body2" className="mb-2">
                          <span className="text-red-600">* </span>供应商名称:
                        </Typography>
                        <TextField
                          fullWidth size="small"
                          value={formData.name}
                          onChange={(e) => handleFormChange('name', e.target.value)}
                          placeholder="请输入供应商名称"
                        />
                      </Box>
                    </td>
                    <td style={{ width: '50%' }}>
                      <Box>
                        <Typography variant="body2" className="mb-2">
                          <span className="text-red-600">* </span>联系人:
                        </Typography>
                        <TextField
                          fullWidth size="small"
                          value={formData.contactPerson}
                          onChange={(e) => handleFormChange('contactPerson', e.target.value)}
                          placeholder="请输入联系人"
                        />
                      </Box>
                    </td>
                  </tr>
                  {/* 第2行：联系电话、地址 */}
                  <tr>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">联系电话:</Typography>
                        <TextField
                          fullWidth size="small"
                          value={formData.phone}
                          onChange={(e) => handleFormChange('phone', e.target.value)}
                          placeholder="请输入联系电话"
                        />
                      </Box>
                    </td>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">地址:</Typography>
                        <TextField
                          fullWidth size="small"
                          value={formData.address}
                          onChange={(e) => handleFormChange('address', e.target.value)}
                          placeholder="请输入地址"
                        />
                      </Box>
                    </td>
                  </tr>
                  {/* 第3行：统一社会信用代码、合同附件 */}
                  <tr>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">统一社会信用代码:</Typography>
                        <TextField
                          fullWidth size="small"
                          value={formData.unifiedCode}
                          onChange={(e) => handleFormChange('unifiedCode', e.target.value)}
                          placeholder="请输入信用代码"
                        />
                      </Box>
                    </td>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">合同附件:</Typography>
                        <Box className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50">
                          {formData.contractFile ? (
                            <Box className="flex items-center justify-between gap-2">
                              <Box className="flex items-center gap-2 flex-1 min-w-0">
                                {getFileIcon(formData.contractFile)}
                                <Typography variant="body2" className="truncate" title={formData.contractFile.name}>
                                  {formData.contractFile.name}
                                </Typography>
                              </Box>
                              <IconButton size="small" color="error" onClick={handleFileRemove} title="移除文件">
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          ) : (
                            <Box className="flex items-center justify-center">
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Upload />}
                                component="label"
                              >
                                选择文件
                                <input
                                  ref={editFileInputRef}
                                  type="file"
                                  hidden
                                  accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx"
                                  onChange={(e) => {
                                    handleFileSelect(e.target.files?.[0] ?? null);
                                    e.target.value = '';
                                  }}
                                />
                              </Button>
                              <Typography variant="caption" color="text.disabled" className="ml-2">
                                支持 PDF、图片、Word 文档
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Box>
          </DialogContent>
          <DialogActions className="px-6 pb-4 border-t">
            <Button onClick={() => setEditDialogOpen(false)} variant="outlined">取消</Button>
            <Button
              onClick={handleEdit}
              variant="contained"
              disabled={!formData.name || !formData.contactPerson}
            >
              确定
            </Button>
          </DialogActions>
        </Dialog>

        {/* ====== 关联学校弹窗 ====== */}
        <Dialog open={Boolean(schoolDialogSupplier)} onClose={closeSchoolDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb', pb: 2 }}>
            <Box className="flex items-center justify-between">
              <Box className="flex items-center gap-2">
                <SchoolIcon className="text-blue-600" />
                <Typography variant="h6">
                  {schoolDialogSupplier?.name} — 关联学校
                </Typography>
              </Box>
              <IconButton onClick={closeSchoolDialog} size="small"><Close /></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: '16px !important' }}>
            {schoolDialogSupplier && (() => {
              const schools = getRelatedSchools(schoolDialogSupplier.id);
              return schools.length === 0 ? (
                <Box className="text-center py-10 text-gray-400">
                  <SchoolIcon sx={{ fontSize: 48 }} className="mb-2" />
                  <Typography variant="body2">暂无关联学校</Typography>
                </Box>
              ) : (
                <Box className="py-2 space-y-3">
                  {schools.map((school) => (
                    <Paper key={school.id} variant="outlined" className="p-4 rounded-lg">
                      <Box className="flex items-start gap-3">
                        <SchoolIcon className="text-blue-500 mt-0.5" />
                        <Box className="flex-1">
                          <Typography variant="body1" className="font-medium">
                            {school.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" className="block mt-1">
                            {school.code}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" className="block">
                            {school.organization}
                          </Typography>
                          <Box className="mt-2 flex items-center gap-1">
                            <Typography variant="caption" className="text-blue-600 font-semibold">
                              OPS设备总数: {school.opsDeviceCount}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              );
            })()}
          </DialogContent>
          <DialogActions className="px-6 pb-4 border-t">
            <Button onClick={closeSchoolDialog} variant="contained">关闭</Button>
          </DialogActions>
        </Dialog>

        {/* ====== 删除确认对话框 ====== */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb', pb: 2 }}>
            <Box className="flex items-center gap-2">
              <Delete className="text-red-600" />
              <Typography variant="h6">确认删除</Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: '16px !important' }}>
            {supplierToDelete && (
              <Box className="py-2">
                <Typography variant="body1" className="mb-3">
                  确定要删除供应商「{supplierToDelete.name}」吗？
                </Typography>
                {getSchoolCount(supplierToDelete.id) > 0 && (
                  <>
                    <Typography variant="body2" color="error" className="mb-3">
                      该供应商下有 {getSchoolCount(supplierToDelete.id)} 所关联学校，删除后关联将断开。
                    </Typography>
                    <Box className="bg-gray-50 rounded-lg p-3 space-y-1">
                      {getRelatedSchools(supplierToDelete.id).map((school) => (
                        <Box key={school.id} className="flex items-center gap-2">
                          <SchoolIcon fontSize="small" className="text-gray-400" />
                          <Typography variant="body2">{school.name}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions className="px-6 pb-4 border-t">
            <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined">取消</Button>
            <Button onClick={handleDelete} variant="contained" color="error">确定</Button>
          </DialogActions>
        </Dialog>

        {/* ====== 合同附件预览对话框 ====== */}
        <Dialog
          open={Boolean(previewSupplier?.contractFile)}
          onClose={() => setPreviewSupplier(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb', pb: 2 }}>
            <Box className="flex items-center justify-between">
              <Box className="flex items-center gap-2">
                {previewSupplier?.contractFile && getFileIcon(previewSupplier.contractFile)}
                <Typography variant="h6" className="truncate max-w-md">
                  {previewSupplier?.contractFile?.name || '合同附件'}
                </Typography>
              </Box>
              <IconButton onClick={() => setPreviewSupplier(null)} size="small"><Close /></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: '16px !important', minHeight: 400 }}>
            {previewSupplier?.contractFile && (() => {
              const file = previewSupplier.contractFile;
              const dataUrl = `data:${file.type};base64,${file.data}`;

              if (isImageType(file.type)) {
                return (
                  <Box className="flex items-center justify-center py-4">
                    <img
                      src={dataUrl}
                      alt={file.name}
                      className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm"
                    />
                  </Box>
                );
              }

              if (isPdfType(file.type) && file.data) {
                return (
                  <Box className="w-full py-2" sx={{ height: '70vh' }}>
                    <iframe
                      src={dataUrl}
                      title={file.name}
                      width="100%"
                      height="100%"
                      className="rounded-lg border border-gray-200"
                    />
                  </Box>
                );
              }

              // 其他文件类型：显示文件信息
              return (
                <Box className="py-10 text-center">
                  <Description sx={{ fontSize: 72 }} className="text-gray-300 mb-4" />
                  <Typography variant="h6" className="text-gray-700 mb-2">
                    {file.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" className="mb-1">
                    文件类型：{file.type}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" className="mb-6">
                    此类型暂不支持在线预览，请下载查看
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    href={dataUrl}
                    download={file.name}
                  >
                    下载文件
                  </Button>
                </Box>
              );
            })()}
          </DialogContent>
          <DialogActions className="px-6 pb-4 border-t">
            {previewSupplier?.contractFile && (() => {
              const file = previewSupplier.contractFile;
              const dataUrl = `data:${file.type};base64,${file.data}`;
              return (
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  href={dataUrl}
                  download={file.name}
                >
                  下载
                </Button>
              );
            })()}
            <Button onClick={() => setPreviewSupplier(null)} variant="outlined">关闭</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
