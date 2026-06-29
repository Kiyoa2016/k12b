import { useState, useEffect, useRef } from 'react';
import {
  Box, Container, Typography, TextField, Button,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, InputAdornment, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Grid, Popover, Chip, Tabs, Tab,
  FormControl, Select, MenuItem, Switch, FormControlLabel,
  Tooltip,
} from '@mui/material';
import { Search, Add, Close, School, CheckCircle, Business } from '@mui/icons-material';
import { useSchoolAuthorization } from '../store/SchoolAuthorizationContext';
import { ALL_PAGES } from '../types/permissions';
import Autocomplete from '@mui/material/Autocomplete';

// ─── 类型定义 ───

interface School {
  id: string;
  code: string;
  name: string;
  organization: string;
  province: string;
  city: string;
  district: string;
  type: string;
  level: string;
  phone: string;
  address: string;
  dealerName: string;
  dealerPhone: string;
  dealerAddress: string;
}

// ─── Mock 数据 ───

const MOCK_SCHOOLS: School[] = [
  {
    id: '1', code: 'SC510104A001', name: '成都市仁寿中学（双流校区）',
    organization: '成都市教育局', province: '四川省', city: '成都市',
    district: '青羊区', type: '公办普通高中', level: '高中',
    phone: '028-86110278', address: '成都市青羊区文翁路街道1号',
    dealerName: '四川云教科技有限公司', dealerPhone: '028-85551234',
    dealerAddress: '成都市高新区天府大道1388号',
  },
  {
    id: '2', code: 'SC510105B002', name: '成都市锦鑫中学',
    organization: '成都市教育局', province: '四川省', city: '成都市',
    district: '武侯区', type: '公办普通高中', level: '高中',
    phone: '028-85010222', address: '成都市武侯区石羊街道锦鑫路8号',
    dealerName: '成都华育信息技术有限公司', dealerPhone: '028-85555678',
    dealerAddress: '成都市武侯区科华北路99号',
  },
  {
    id: '3', code: 'SC510106C003', name: '成都师资七中学（林荫校区）',
    organization: '成都市教育局', province: '四川省', city: '成都市',
    district: '武侯区', type: '公办普通高中', level: '高中',
    phone: '028-85454007', address: '成都市武侯区林荫街道1号',
    dealerName: '四川云教科技有限公司', dealerPhone: '028-85551234',
    dealerAddress: '成都市高新区天府大道1388号',
  },
  {
    id: '4', code: 'SC510681D001', name: '广汉中学',
    organization: '广汉市教育局', province: '四川省', city: '德阳市',
    district: '广汉市', type: '公办普通高中', level: '高中',
    phone: '0838-5222333', address: '广汉市中山大道一段368号37号',
    dealerName: '德阳博睿教育设备有限公司', dealerPhone: '0838-2500888',
    dealerAddress: '德阳市旌阳区岷江西路一段88号',
  },
  {
    id: '5', code: 'SC510781E001', name: '绵竹中学',
    organization: '绵竹市教育和体育局', province: '四川省', city: '德阳市',
    district: '绵竹市', type: '公办普通高中', level: '高中',
    phone: '0816-2366400', address: '绵竹市华山区四川路紫岩街30号',
    dealerName: '德阳博睿教育设备有限公司', dealerPhone: '0838-2500888',
    dealerAddress: '德阳市旌阳区岷江西路一段88号',
  },
];

// ─── 唯一经销商列表（为 Autocomplete 提供选项） ───

interface DealerOption {
  name: string;
  phone: string;
  address: string;
}

const DEALER_OPTIONS: DealerOption[] = Array.from(
  new Map(MOCK_SCHOOLS.map((s) => [s.dealerName, { name: s.dealerName, phone: s.dealerPhone, address: s.dealerAddress }])).values()
);

// ─── 模块授权弹窗 ───

function ModuleAuthDialog({
  open, onClose, schoolId, schoolName,
}: {
  open: boolean;
  onClose: () => void;
  schoolId: string;
  schoolName: string;
}) {
  const { getSchoolAuth, updateSchoolAuth } = useSchoolAuthorization();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const prevOpenRef = useRef(open);

  // 弹窗打开时（从 false → true）同步外部数据，打开后不再重置
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      const currentAuth = getSchoolAuth(schoolId);
      setSelectedKeys(currentAuth?.authorizedPageKeys ?? []);
    }
    prevOpenRef.current = open;
  }, [open]);

  const togglePage = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = () => {
    updateSchoolAuth(schoolId, selectedKeys);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb', pb: 2 }}>
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <School className="text-blue-600" />
            <Typography variant="h6">{schoolName} — 模块授权</Typography>
          </Box>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Box className="flex items-center gap-2 mb-4">
          <Typography variant="body2" className="font-medium">快捷操作：</Typography>
          <Button size="small" variant="outlined" onClick={() => setSelectedKeys(ALL_PAGES.map((p) => p.key))}>
            全选
          </Button>
          <Button size="small" variant="outlined" onClick={() => setSelectedKeys([])}>
            清空
          </Button>
          <Typography variant="caption" color="text.secondary">
            已选 {selectedKeys.length} / {ALL_PAGES.length} 个模块
          </Typography>
        </Box>

        <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {ALL_PAGES.map((page) => (
            <Box
              key={page.key}
              onClick={() => togglePage(page.key)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors border ${
                selectedKeys.includes(page.key)
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
              }`}
            >
              <Typography variant="body2" className="font-medium">{page.label}</Typography>
              {selectedKeys.includes(page.key) && (
                <CheckCircle sx={{ fontSize: 18, color: '#3b82f6' }} />
              )}
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions className="px-6 pb-4 border-t">
        <Button onClick={onClose} variant="outlined">取消</Button>
        <Button onClick={handleSave} variant="contained">保存</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── 主组件 ───

export default function SchoolManagement() {
  const { schoolAuths, setCurrentSchoolId } = useSchoolAuthorization();

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [viewTab, setViewTab] = useState(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [deactivateAnchor, setDeactivateAnchor] = useState<null | HTMLElement>(null);
  const [schoolToDeactivate, setSchoolToDeactivate] = useState<School | null>(null);

  const [newSchool, setNewSchool] = useState({
    name: '', code: '', accountName: '', accountPassword: '',
    phone: '', organization: '', type: '', level: '',
    location: '', address: '', description: '',
    dealerName: '', dealerPhone: '', dealerAddress: '',
  });

  const [schools] = useState<School[]>(MOCK_SCHOOLS);

  const handleViewSchool = (school: School) => {
    setSelectedSchool(school);
    setCurrentSchoolId(school.id);
    setViewTab(0);
    setViewDialogOpen(true);
  };

  const handleDeactivateClick = (e: React.MouseEvent<HTMLElement>, school: School) => {
    setDeactivateAnchor(e.currentTarget);
    setSchoolToDeactivate(school);
  };

  const handleConfirmDeactivate = () => {
    setDeactivateAnchor(null);
    setSchoolToDeactivate(null);
  };

  const handleAddSchool = () => {
    setAddDialogOpen(false);
    setNewSchool({
      name: '', code: '', accountName: '', accountPassword: '',
      phone: '', organization: '', type: '', level: '',
      location: '', address: '', description: '',
      dealerName: '', dealerPhone: '', dealerAddress: '',
    });
  };

  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.code.includes(searchTerm) ||
    school.dealerName.includes(searchTerm)
  );

  const pagedSchools = filteredSchools.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box className="min-h-screen bg-gray-50">
      <Container maxWidth="xl" className="py-6">
        {/* 标题栏 */}
        <Box className="mb-6 flex items-center justify-between">
          <Typography variant="h5" className="font-bold flex items-center gap-2">
            🏫 学校管理
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setAddDialogOpen(true)}>
            添加学校
          </Button>
        </Box>

        {/* 搜索栏 */}
        <Box className="mb-4">
          <TextField
            size="small" placeholder="搜索学校名称、编号或经销商..."
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

        {/* 表格 */}
        <Box className="bg-white rounded-lg">
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell sx={{ fontWeight: 600 }}>编号</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>学校名称</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>所属机构</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>经销商</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>联系电话</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>授权模块</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedSchools.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Box className="text-center text-gray-400">
                        <School sx={{ fontSize: 48 }} className="mb-2" />
                        <Typography variant="body2">未找到匹配的学校</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedSchools.map((school, index) => {
                    const auth = schoolAuths.find((a) => a.schoolId === school.id);
                    const count = auth?.authorizedPageKeys.length ?? 0;
                    return (
                      <TableRow key={school.id} hover>
                        <TableCell>{school.code}</TableCell>
                        <TableCell>
                          <Typography variant="body2" className="font-medium">{school.name}</Typography>
                        </TableCell>
                        <TableCell>{school.organization}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{school.dealerName}</Typography>
                            <Typography variant="caption" color="text.secondary">{school.dealerPhone}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{school.phone}</TableCell>
                        <TableCell>
                          <Chip label={`${count}/${ALL_PAGES.length}`} size="small" color={count > 0 ? 'primary' : 'default'} variant="outlined" sx={{ fontSize: 11, height: 22 }} />
                        </TableCell>
                        <TableCell>
                          <Box className="flex gap-1">
                            <Button size="small" sx={{ fontSize: 12, minWidth: 'auto' }} onClick={() => handleViewSchool(school)}>
                              查看
                            </Button>
                            <Button size="small" color="error" sx={{ fontSize: 12, minWidth: 'auto' }} onClick={(e) => handleDeactivateClick(e, school)}>
                              停用
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div" count={filteredSchools.length}
            page={page} onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            labelRowsPerPage="每页行数："
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count}`}
          />
        </Box>

        {/* ====== 学校详情弹窗（查看） ====== */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ borderBottom: '1px solid #e5e7eb' }}>
            <Box className="flex items-center justify-between">
              <Typography variant="h6">学校详细信息</Typography>
              <IconButton onClick={() => setViewDialogOpen(false)} size="small"><Close /></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: '16px !important' }}>
            {selectedSchool && (
              <Box>
                {/* 学校名称 */}
                <Typography variant="h6" className="font-bold text-blue-600 mb-3">
                  {selectedSchool.name}
                </Typography>

                <Tabs value={viewTab} onChange={(_, v) => setViewTab(v)} sx={{ mb: 2, borderBottom: '1px solid #e5e7eb' }}>
                  <Tab label="基本信息" />
                  <Tab label="经销商信息" />
                  <Tab label="模块授权" />
                </Tabs>

                {/* Tab 0: 基本信息 */}
                {viewTab === 0 && (
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary" className="mb-1">学校编码</Typography>
                      <Typography variant="body1">{selectedSchool.code}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary" className="mb-1">所属机构</Typography>
                      <Typography variant="body1">{selectedSchool.organization}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary" className="mb-1">省份</Typography>
                      <Typography variant="body1">{selectedSchool.province}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary" className="mb-1">城市</Typography>
                      <Typography variant="body1">{selectedSchool.city}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary" className="mb-1">区县</Typography>
                      <Typography variant="body1">{selectedSchool.district}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary" className="mb-1">学校类型</Typography>
                      <Typography variant="body1">{selectedSchool.type}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary" className="mb-1">学段</Typography>
                      <Typography variant="body1">{selectedSchool.level}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary" className="mb-1">联系电话</Typography>
                      <Typography variant="body1">{selectedSchool.phone}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" className="mb-1">详细地址</Typography>
                      <Typography variant="body1">{selectedSchool.address}</Typography>
                    </Grid>
                  </Grid>
                )}

                {/* Tab 1: 经销商信息 */}
                {viewTab === 1 && (
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary" className="mb-1">经销商名称</Typography>
                      <Typography variant="body1" className="font-medium">{selectedSchool.dealerName}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary" className="mb-1">经销商电话</Typography>
                      <Typography variant="body1">{selectedSchool.dealerPhone}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" className="mb-1">经销商地址</Typography>
                      <Typography variant="body1">{selectedSchool.dealerAddress}</Typography>
                    </Grid>
                  </Grid>
                )}

                {/* Tab 2: 模块授权 */}
                {viewTab === 2 && (
                  <Box>
                    <Box className="mb-3 flex items-center gap-2">
                      <Typography variant="body2" color="text.secondary">
                        为 {selectedSchool.name} 配置可使用的功能模块，共 {ALL_PAGES.length} 个模块
                      </Typography>
                      <Button size="small" variant="outlined" sx={{ fontSize: 11, ml: 'auto' }}
                        onClick={() => setAuthDialogOpen(true)}>
                        编辑授权
                      </Button>
                    </Box>
                    <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {ALL_PAGES.map((page) => {
                        const auth = schoolAuths.find((a) => a.schoolId === selectedSchool.id);
                        const hasAuth = auth?.authorizedPageKeys.includes(page.key);
                        return (
                          <Box key={page.key}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                              hasAuth ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-gray-50'
                            }`}
                          >
                            <Typography variant="body2" className={hasAuth ? 'font-medium' : 'text-gray-400'}>
                              {page.label}
                            </Typography>
                            {hasAuth && <CheckCircle sx={{ fontSize: 16, color: '#3b82f6' }} />}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions className="px-6 pb-4 border-t">
            <Button onClick={() => setViewDialogOpen(false)} variant="contained">关闭</Button>
          </DialogActions>
        </Dialog>

        {/* ====== 模块授权弹窗 ====== */}
        {selectedSchool && (
          <ModuleAuthDialog
            open={authDialogOpen}
            onClose={() => setAuthDialogOpen(false)}
            schoolId={selectedSchool.id}
            schoolName={selectedSchool.name}
          />
        )}

        {/* ====== 添加学校弹窗 ====== */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle className="border-b">
            <Box className="flex items-center justify-between">
              <Typography variant="h6">添加学校</Typography>
              <IconButton onClick={() => setAddDialogOpen(false)} size="small"><Close /></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box className="py-4">
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '16px 12px' }}>
                <tbody>
                  {/* 第1行：学校名称、联系电话 */}
                  <tr>
                    <td style={{ width: '50%' }}>
                      <Box>
                        <Typography variant="body2" className="mb-2">
                          <span className="text-red-600">* </span>学校名称:
                        </Typography>
                        <TextField fullWidth size="small" value={newSchool.name}
                          onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                          placeholder="请输入学校名称" />
                      </Box>
                    </td>
                    <td style={{ width: '50%' }}>
                      <Box>
                        <Typography variant="body2" className="mb-2">
                          <span className="text-red-600">* </span>联系电话:
                        </Typography>
                        <TextField fullWidth size="small" value={newSchool.phone}
                          onChange={(e) => setNewSchool({ ...newSchool, phone: e.target.value })}
                          placeholder="请输入联系电话" />
                      </Box>
                    </td>
                  </tr>

                  {/* 第2行：学校编码、所属机构 */}
                  <tr>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">
                          <span className="text-red-600">* </span>学校编码:
                        </Typography>
                        <TextField fullWidth size="small" value={newSchool.code} disabled
                          placeholder="学校编码自动生成"
                          sx={{ '& .MuiInputBase-root': { backgroundColor: '#f5f5f5' } }} />
                      </Box>
                    </td>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">所属机构:</Typography>
                        <TextField fullWidth size="small" value={newSchool.organization}
                          onChange={(e) => setNewSchool({ ...newSchool, organization: e.target.value })}
                          placeholder="请输入所属机构" />
                      </Box>
                    </td>
                  </tr>

                  {/* 第3行：管理账号、账号密码 */}
                  <tr>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">
                          <span className="text-red-600">* </span>管理账号:
                        </Typography>
                        <TextField fullWidth size="small" value={newSchool.accountName}
                          onChange={(e) => setNewSchool({ ...newSchool, accountName: e.target.value })}
                          placeholder="请输入学校管理账号" />
                      </Box>
                    </td>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">
                          <span className="text-red-600">* </span>账号密码:
                        </Typography>
                        <TextField fullWidth size="small" type="password" value={newSchool.accountPassword}
                          onChange={(e) => setNewSchool({ ...newSchool, accountPassword: e.target.value })}
                          placeholder="请输入管理账号登录密码" />
                      </Box>
                    </td>
                  </tr>

                  {/* 第4行：学校类型、学段 */}
                  <tr>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">学校类型:</Typography>
                        <FormControl fullWidth size="small">
                          <Select value={newSchool.type}
                            onChange={(e) => setNewSchool({ ...newSchool, type: e.target.value })} displayEmpty>
                            <MenuItem value="">公立</MenuItem>
                            <MenuItem value="公办">公办</MenuItem>
                            <MenuItem value="民办">民办</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </td>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">学段:</Typography>
                        <FormControl fullWidth size="small">
                          <Select value={newSchool.level}
                            onChange={(e) => setNewSchool({ ...newSchool, level: e.target.value })} displayEmpty>
                            <MenuItem value="">小学</MenuItem>
                            <MenuItem value="学前">学前</MenuItem>
                            <MenuItem value="小学">小学</MenuItem>
                            <MenuItem value="中学">中学</MenuItem>
                            <MenuItem value="高中">高中</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </td>
                  </tr>

                  {/* 第5行：地理位置 */}
                  <tr>
                    <td colSpan={2}>
                      <Box>
                        <Typography variant="body2" className="mb-2">地理位置:</Typography>
                        <FormControl fullWidth size="small">
                          <Select value={newSchool.location}
                            onChange={(e) => setNewSchool({ ...newSchool, location: e.target.value })} displayEmpty>
                            <MenuItem value=""><span className="text-gray-400">选择选项</span></MenuItem>
                            <MenuItem value="四川省成都市">四川省成都市</MenuItem>
                            <MenuItem value="四川省德阳市">四川省德阳市</MenuItem>
                            <MenuItem value="重庆市">重庆市</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </td>
                  </tr>

                  {/* 第6行：详细地址 */}
                  <tr>
                    <td colSpan={2}>
                      <Box>
                        <Typography variant="body2" className="mb-2">详细地址:</Typography>
                        <TextField fullWidth size="small" value={newSchool.address}
                          onChange={(e) => setNewSchool({ ...newSchool, address: e.target.value })}
                          placeholder="请输入详细地址" />
                      </Box>
                    </td>
                  </tr>

                  {/* 第7行：经销商信息 */}
                  <tr>
                    <td colSpan={2}>
                      <Typography variant="subtitle2" className="font-bold text-gray-700 mb-2">经销商信息</Typography>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">经销商名称:</Typography>
                        <Autocomplete
                          freeSolo
                          size="small"
                          options={DEALER_OPTIONS}
                          getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                          value={newSchool.dealerName || null}
                          onInputChange={(_, value) => {
                            setNewSchool({ ...newSchool, dealerName: value });
                            // 输入变化时不自动填充
                          }}
                          onChange={(_, value) => {
                            if (value && typeof value !== 'string') {
                              setNewSchool({
                                ...newSchool,
                                dealerName: value.name,
                                dealerPhone: value.phone,
                                dealerAddress: value.address,
                              });
                            }
                          }}
                          renderOption={(props, option) => {
                            const { key, ...rest } = props;
                            return (
                              <Box component="li" key={key} {...rest}>
                                <Box>
                                  <Typography variant="body2" className="font-medium">{option.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">{option.phone}</Typography>
                                </Box>
                              </Box>
                            );
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              fullWidth
                              placeholder="搜索或输入经销商名称"
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
                      </Box>
                    </td>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">经销商电话:</Typography>
                        <TextField fullWidth size="small" value={newSchool.dealerPhone}
                          onChange={(e) => setNewSchool({ ...newSchool, dealerPhone: e.target.value })}
                          placeholder="请输入经销商电话" />
                      </Box>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <Box>
                        <Typography variant="body2" className="mb-2">经销商地址:</Typography>
                        <TextField fullWidth size="small" value={newSchool.dealerAddress}
                          onChange={(e) => setNewSchool({ ...newSchool, dealerAddress: e.target.value })}
                          placeholder="请输入经销商地址" />
                      </Box>
                    </td>
                  </tr>

                  {/* 第8行：学校描述 */}
                  <tr>
                    <td colSpan={2}>
                      <Box>
                        <Typography variant="body2" className="mb-2">学校描述:</Typography>
                        <TextField fullWidth size="small" multiline rows={4} value={newSchool.description}
                          onChange={(e) => setNewSchool({ ...newSchool, description: e.target.value })}
                          placeholder="输入内容" />
                      </Box>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Box>
          </DialogContent>
          <DialogActions className="px-6 pb-4">
            <Button onClick={() => setAddDialogOpen(false)} variant="outlined">取消</Button>
            <Button onClick={handleAddSchool} variant="contained"
              disabled={!newSchool.name || !newSchool.phone || !newSchool.accountName || !newSchool.accountPassword}>
              确定
            </Button>
          </DialogActions>
        </Dialog>

        {/* 停用确认 */}
        <Popover open={Boolean(deactivateAnchor)} anchorEl={deactivateAnchor}
          onClose={() => setDeactivateAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Box className="p-4 max-w-xs">
            <Typography variant="body2" className="mb-3">确认停用该学校？</Typography>
            <Box className="flex gap-2 justify-end">
              <Button size="small" variant="outlined" onClick={() => setDeactivateAnchor(null)}>取消</Button>
              <Button size="small" variant="contained" color="error" onClick={handleConfirmDeactivate}>确定</Button>
            </Box>
          </Box>
        </Popover>
      </Container>
    </Box>
  );
}
