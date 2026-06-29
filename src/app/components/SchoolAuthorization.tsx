import { useState, useMemo } from 'react';
import {
  Box, Typography, Button, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination,
  Switch, FormControlLabel, TextField, InputAdornment,
  Card, Tooltip,
} from '@mui/material';
import {
  Settings, Close, Search, School, CheckCircle,
} from '@mui/icons-material';
import { useSchoolAuthorization } from '../store/SchoolAuthorizationContext';
import { ALL_PAGES } from '../types/permissions';

// ─── 学校数据（与 SchoolManagement 保持一致） ───

interface SchoolInfo {
  id: string;
  name: string;
}

const SCHOOLS: SchoolInfo[] = [
  { id: '1', name: '成都市仁寿中学（双流校区）' },
  { id: '2', name: '成都市锦鑫中学' },
  { id: '3', name: '成都师资七中学（林荫校区）' },
];

// ─── 配置弹窗 ───

function AuthDialog({
  open, onClose, schoolId, schoolName,
}: {
  open: boolean;
  onClose: () => void;
  schoolId: string;
  schoolName: string;
}) {
  const { getSchoolAuth, updateSchoolAuth } = useSchoolAuthorization();
  const auth = getSchoolAuth(schoolId);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(
    auth?.authorizedPageKeys ?? []
  );

  // 同步外部数据
  const prevOpenRef = useMemo(() => ({ current: open }), [open]);
  if (open !== prevOpenRef.current) {
    prevOpenRef.current = open;
    if (open) {
      const currentAuth = getSchoolAuth(schoolId);
      setSelectedKeys(currentAuth?.authorizedPageKeys ?? []);
    }
  }

  const togglePage = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = () => {
    updateSchoolAuth(schoolId, selectedKeys);
    onClose();
  };

  // 只显示校级菜单的模块（过滤掉云平台级的）
  const schoolPages = ALL_PAGES;

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
        {/* 快捷操作 */}
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

        {/* 模块列表 */}
        <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {schoolPages.map((page) => (
            <Box
              key={page.key}
              onClick={() => togglePage(page.key)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors border ${
                selectedKeys.includes(page.key)
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
              }`}
            >
              <Typography variant="body2" className="font-medium">
                {page.label}
              </Typography>
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

export default function SchoolAuthorization() {
  const { schoolAuths } = useSchoolAuthorization();
  const [searchTerm, setSearchTerm] = useState('');
  const [configSchool, setConfigSchool] = useState<{ id: string; name: string } | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredSchools = useMemo(() => {
    if (!searchTerm) return SCHOOLS;
    const term = searchTerm.toLowerCase();
    return SCHOOLS.filter((s) => s.name.toLowerCase().includes(term));
  }, [searchTerm]);

  const pagedSchools = filteredSchools.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box className="overflow-auto h-[calc(100vh-64px)] bg-gray-50">
      <Box className="p-4 sm:p-6">
        {/* 标题区 */}
        <Box className="mb-4">
          <Typography variant="h5" className="font-bold">🏫 学校授权</Typography>
          <Typography variant="body2" color="text.secondary" className="mt-1">
            配置各学校可使用的功能模块，学校内的角色权限受限于此配置
          </Typography>
        </Box>

        {/* 筛选 */}
        <Box className="mb-4">
          <TextField
            size="small"
            placeholder="搜索学校名称..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 260 }}
          />
        </Box>

        {/* 表格 */}
        <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 600, width: 50 }}>序号</TableCell>
                  <TableCell sx={{ fontWeight: 600, minWidth: 220 }}>学校名称</TableCell>
                  <TableCell sx={{ fontWeight: 600, minWidth: 300 }}>已授权模块</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 100 }}>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedSchools.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                      <Box className="text-center">
                        <School className="text-5xl text-gray-300 mb-2" />
                        <Typography variant="body2" color="text.secondary">未找到匹配的学校</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedSchools.map((school, index) => {
                    const auth = schoolAuths.find((a) => a.schoolId === school.id);
                    const count = auth?.authorizedPageKeys.length ?? 0;
                    return (
                      <TableRow key={school.id} hover>
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" className="font-medium">{school.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box className="flex gap-1 flex-wrap">
                            {count === 0 ? (
                              <Typography variant="caption" color="text.secondary">未授权任何模块</Typography>
                            ) : count <= 4 ? (
                              auth?.authorizedPageKeys.map((k) => {
                                const pageDef = ALL_PAGES.find((p) => p.key === k);
                                return pageDef ? (
                                  <Chip key={k} label={pageDef.label} size="small" variant="outlined" sx={{ fontSize: 11, height: 22 }} />
                                ) : null;
                              })
                            ) : (
                              <>
                                {auth?.authorizedPageKeys.slice(0, 4).map((k) => {
                                  const pageDef = ALL_PAGES.find((p) => p.key === k);
                                  return pageDef ? (
                                    <Chip key={k} label={pageDef.label} size="small" variant="outlined" sx={{ fontSize: 11, height: 22 }} />
                                  ) : null;
                                })}
                                <Chip label={`+${count - 4}`} size="small" color="primary" variant="outlined" sx={{ fontSize: 11, height: 22 }} />
                              </>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<Settings />}
                            onClick={() => setConfigSchool({ id: school.id, name: school.name })}
                            sx={{ fontSize: 12 }}
                          >
                            配置
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredSchools.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage="每页："
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共 ${count}`}
          />
        </Card>

        {/* 配置弹窗 */}
        {configSchool && (
          <AuthDialog
            open={Boolean(configSchool)}
            onClose={() => setConfigSchool(null)}
            schoolId={configSchool.id}
            schoolName={configSchool.name}
          />
        )}
      </Box>
    </Box>
  );
}
