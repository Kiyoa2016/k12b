import { useState, useEffect, useMemo } from 'react';
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

// ─── 学校数据接口（与 SchoolManagement 保持一致） ───

interface SchoolBrief {
  id: string;
  code: string;
  name: string;
  organization: string;
  supplierId: string;
}

// ─── Mock 学校数据（关联供应商） ───

function loadSchools(): SchoolBrief[] {
  return [
    { id: '1', code: 'SC510104A001', name: '成都市仁寿中学（双流校区）', organization: '成都市教育局', supplierId: 's-1' },
    { id: '2', code: 'SC510105B002', name: '成都市锦鑫中学', organization: '成都市教育局', supplierId: 's-2' },
    { id: '3', code: 'SC510106C003', name: '成都师资七中学（林荫校区）', organization: '成都市教育局', supplierId: 's-1' },
    { id: '4', code: 'SC510681D001', name: '广汉中学', organization: '广汉市教育局', supplierId: 's-3' },
    { id: '5', code: 'SC510781E001', name: '绵竹中学', organization: '绵竹市教育和体育局', supplierId: 's-3' },
  ];
}

// ─── 主组件 ───

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
    name: '',
    phone: '',
    address: '',
    contactPerson: '',
    unifiedCode: '',
    contractInfo: '',
  });

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

  // ─── 添加供应商 ───

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
      contractInfo: supplier.contractInfo,
    });
    setEditDialogOpen(true);
  };

  const handleEdit = () => {
    if (!editingSupplier || !formData.name || !formData.contactPerson) return;
    updateSupplier(editingSupplier.id, formData);
    setEditDialogOpen(false);
    // 同步更新右侧详情面板
    if (selectedSupplier?.id === editingSupplier.id) {
      setSelectedSupplier({ ...editingSupplier, ...formData });
    }
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
    if (selectedSupplier?.id === supplierToDelete.id) setSelectedSupplier(null);
    setDeleteDialogOpen(false);
    setSupplierToDelete(null);
  };

  // ─── 工具函数 ───

  const resetForm = () => {
    setFormData({ name: '', phone: '', address: '', contactPerson: '', unifiedCode: '', contractInfo: '' });
    setEditingSupplier(null);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openAddDialog = () => {
    resetForm();
    setAddDialogOpen(true);
  };

  const selectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
  };

  const closeDetail = () => {
    setSelectedSupplier(null);
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

        {/* 左右分栏布局 */}
        <Box className="flex gap-6">
          {/* 左侧：供应商表格 (60%) */}
          <Box className="w-[60%]">
            <Paper className="rounded-lg overflow-hidden">
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow className="bg-gray-50">
                      <TableCell sx={{ fontWeight: 600 }}>供应商名称</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>联系人</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>联系电话</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>统一社会信用代码</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>关联学校数</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pagedSuppliers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                          <Box className="text-center text-gray-400">
                            <Business sx={{ fontSize: 48 }} className="mb-2" />
                            <Typography variant="body2">暂无供应商，点击「添加供应商」创建</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedSuppliers.map((supplier) => (
                        <TableRow
                          key={supplier.id}
                          hover
                          onClick={() => selectSupplier(supplier)}
                          className={`cursor-pointer ${
                            selectedSupplier?.id === supplier.id ? 'bg-blue-50' : ''
                          }`}
                        >
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
                          <TableCell>{getSchoolCount(supplier.id)}</TableCell>
                          <TableCell>
                            <Box className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => openEdit(supplier)}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => openDelete(supplier)}
                              >
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
          </Box>

          {/* 右侧：供应商详情面板 (40%) */}
          <Box className="w-[40%]">
            {selectedSupplier ? (
              <Paper className="rounded-lg p-6">
                {/* 头部 */}
                <Box className="flex items-center justify-between mb-4">
                  <Box className="flex items-center gap-2">
                    <Business className="text-blue-600" />
                    <Typography variant="h6" className="font-bold">
                      {selectedSupplier.name}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={closeDetail}>
                    <Close />
                  </IconButton>
                </Box>

                <Divider className="mb-4" />

                {/* 基本信息 */}
                <Typography variant="subtitle2" className="font-bold text-gray-700 mb-3">
                  基本信息
                </Typography>

                <Box className="space-y-3">
                  {/* 联系人 */}
                  <Box className="flex items-center gap-2">
                    <Person fontSize="small" className="text-gray-400" />
                    <Typography variant="body2" color="text.secondary" className="w-24 shrink-0">
                      联系人
                    </Typography>
                    <Typography variant="body2" className="font-medium">
                      {selectedSupplier.contactPerson}
                    </Typography>
                  </Box>

                  {/* 联系电话 */}
                  <Box className="flex items-center gap-2">
                    <Phone fontSize="small" className="text-gray-400" />
                    <Typography variant="body2" color="text.secondary" className="w-24 shrink-0">
                      联系电话
                    </Typography>
                    <Typography variant="body2">
                      {selectedSupplier.phone}
                    </Typography>
                  </Box>

                  {/* 地址 */}
                  <Box className="flex items-center gap-2">
                    <Business fontSize="small" className="text-gray-400" />
                    <Typography variant="body2" color="text.secondary" className="w-24 shrink-0">
                      地址
                    </Typography>
                    <Typography variant="body2">
                      {selectedSupplier.address}
                    </Typography>
                  </Box>

                  {/* 统一社会信用代码 */}
                  <Box className="flex items-center gap-2">
                    <Badge fontSize="small" className="text-gray-400" />
                    <Typography variant="body2" color="text.secondary" className="w-24 shrink-0">
                      信用代码
                    </Typography>
                    <Typography variant="body2" className="font-mono text-xs">
                      {selectedSupplier.unifiedCode}
                    </Typography>
                  </Box>

                  {/* 合同信息 */}
                  <Box className="flex items-center gap-2">
                    <Description fontSize="small" className="text-gray-400" />
                    <Typography variant="body2" color="text.secondary" className="w-24 shrink-0">
                      合同信息
                    </Typography>
                    <Typography variant="body2">
                      {selectedSupplier.contractInfo}
                    </Typography>
                  </Box>
                </Box>

                <Divider className="my-4" />

                {/* 关联学校 */}
                <Box className="mb-3">
                  <Typography variant="subtitle2" className="font-bold text-gray-700 mb-3">
                    关联学校 ({getSchoolCount(selectedSupplier.id)})
                  </Typography>

                  {getRelatedSchools(selectedSupplier.id).length === 0 ? (
                    <Box className="text-center py-6 text-gray-400">
                      <SchoolIcon sx={{ fontSize: 36 }} className="mb-2" />
                      <Typography variant="body2">暂无关联学校</Typography>
                    </Box>
                  ) : (
                    <Box className="space-y-2">
                      {getRelatedSchools(selectedSupplier.id).map((school) => (
                        <Paper
                          key={school.id}
                          variant="outlined"
                          className="p-3 rounded-lg"
                        >
                          <Box className="flex items-start gap-2">
                            <SchoolIcon fontSize="small" className="text-blue-500 mt-0.5" />
                            <Box>
                              <Typography variant="body2" className="font-medium">
                                {school.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" className="block">
                                {school.code}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {school.organization}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Box>
              </Paper>
            ) : (
              /* 未选择供应商时的占位提示 */
              <Paper className="rounded-lg p-6 flex flex-col items-center justify-center min-h-[400px] text-gray-400">
                <Business sx={{ fontSize: 64 }} className="mb-4 opacity-30" />
                <Typography variant="body1" className="text-gray-400">
                  请从左侧选择供应商查看详情
                </Typography>
              </Paper>
            )}
          </Box>
        </Box>

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
                  {/* 第3行：统一社会信用代码、合同信息 */}
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
                        <Typography variant="body2" className="mb-2">合同信息:</Typography>
                        <TextField
                          fullWidth size="small"
                          value={formData.contractInfo}
                          onChange={(e) => handleFormChange('contractInfo', e.target.value)}
                          placeholder="请输入合同信息"
                        />
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
                  {/* 第3行：统一社会信用代码、合同信息 */}
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
                        <Typography variant="body2" className="mb-2">合同信息:</Typography>
                        <TextField
                          fullWidth size="small"
                          value={formData.contractInfo}
                          onChange={(e) => handleFormChange('contractInfo', e.target.value)}
                          placeholder="请输入合同信息"
                        />
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
      </Container>
    </Box>
  );
}
