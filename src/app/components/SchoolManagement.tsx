import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  Popover,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Search, Add, Close } from '@mui/icons-material';

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
}

export default function SchoolManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deactivateAnchor, setDeactivateAnchor] = useState<null | HTMLElement>(null);
  const [schoolToDeactivate, setSchoolToDeactivate] = useState<School | null>(null);

  const [newSchool, setNewSchool] = useState({
    name: '',
    code: '',
    accountName: '',
    accountPassword: '',
    phone: '',
    organization: '',
    type: '',
    level: '',
    location: '',
    address: '',
    description: '',
  });

  const [schools] = useState<School[]>([
    {
      id: '1',
      code: 'SC510104A001',
      name: '成都市仁寿中学（双流校区）',
      organization: '成都市教育局',
      province: '四川省',
      city: '成都市',
      district: '青羊区',
      type: '公办普通高中',
      level: '高中',
      phone: '028-86110278',
      address: '成都市青羊区文翁路街道1号',
    },
    {
      id: '2',
      code: 'SC510105B002',
      name: '成都市锦鑫中学',
      organization: '成都市教育局',
      province: '四川省',
      city: '成都市',
      district: '武侯区',
      type: '公办普通高中',
      level: '高中',
      phone: '028-85010222',
      address: '成都市武侯区石羊街道锦鑫路8号',
    },
    {
      id: '3',
      code: 'SC510106C003',
      name: '成都师资七中学（林荫校区）',
      organization: '成都市教育局',
      province: '四川省',
      city: '成都市',
      district: '武侯区',
      type: '公办普通高中',
      level: '高中',
      phone: '028-85454007',
      address: '成都市武侯区林荫街道1号',
    },
    {
      id: '4',
      code: 'SC510681D001',
      name: '广汉中学',
      organization: '广汉市教育局',
      province: '四川省',
      city: '德阳市',
      district: '广汉市',
      type: '公办普通高中',
      level: '高中',
      phone: '0838-5222333',
      address: '广汉市中山大道一段368号37号',
    },
    {
      id: '5',
      code: 'SC510781E001',
      name: '绵竹中学',
      organization: '绵竹市教育和体育局',
      province: '四川省',
      city: '德阳市',
      district: '绵竹市',
      type: '公办普通高中',
      level: '高中',
      phone: '0816-2366400',
      address: '绵竹市华山区四川路紫岩街30号',
    },
  ]);

  const handleViewSchool = (school: School) => {
    setSelectedSchool(school);
    setViewDialogOpen(true);
  };

  const handleDeactivateClick = (event: React.MouseEvent<HTMLElement>, school: School) => {
    setDeactivateAnchor(event.currentTarget);
    setSchoolToDeactivate(school);
  };

  const handleConfirmDeactivate = () => {
    console.log('停用学校:', schoolToDeactivate);
    setDeactivateAnchor(null);
    setSchoolToDeactivate(null);
  };

  const handleAddSchool = () => {
    console.log('添加学校:', newSchool);
    setAddDialogOpen(false);
    setNewSchool({
      name: '',
      code: '',
      accountName: '',
      accountPassword: '',
      phone: '',
      organization: '',
      type: '',
      level: '',
      location: '',
      address: '',
      description: '',
    });
  };

  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.code.includes(searchTerm) ||
    school.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box className="min-h-screen bg-gray-50">
      <Container maxWidth="xl" className="py-6">
        {/* 标题栏 */}
        <Box className="mb-6 flex items-center justify-between">
          <Typography variant="h5" className="font-bold flex items-center gap-2">
            🏫 学校管理
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddDialogOpen(true)}
          >
            添加学校
          </Button>
        </Box>

        {/* 搜索栏 */}
        <Box className="mb-4">
          <TextField
            size="small"
            placeholder="输入搜索关键词"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
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
                  <TableCell>编号</TableCell>
                  <TableCell>学校名称</TableCell>
                  <TableCell>所属机构</TableCell>
                  <TableCell>省份</TableCell>
                  <TableCell>城市</TableCell>
                  <TableCell>区县</TableCell>
                  <TableCell>学校类型</TableCell>
                  <TableCell>学段</TableCell>
                  <TableCell>联系电话</TableCell>
                  <TableCell>详细地址</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSchools
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((school) => (
                    <TableRow key={school.id} hover>
                      <TableCell>{school.code}</TableCell>
                      <TableCell>{school.name}</TableCell>
                      <TableCell>{school.organization}</TableCell>
                      <TableCell>{school.province}</TableCell>
                      <TableCell>{school.city}</TableCell>
                      <TableCell>{school.district}</TableCell>
                      <TableCell>{school.type}</TableCell>
                      <TableCell>{school.level}</TableCell>
                      <TableCell>{school.phone}</TableCell>
                      <TableCell>{school.address}</TableCell>
                      <TableCell>
                        <Box className="flex gap-2">
                          <Button
                            size="small"
                            className="text-blue-600"
                            onClick={() => handleViewSchool(school)}
                          >
                            查看
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={(e) => handleDeactivateClick(e, school)}
                          >
                            停用
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 分页 */}
          <TablePagination
            component="div"
            count={filteredSchools.length}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="每页行数："
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count}`}
          />
        </Box>

        {/* 学校详情弹窗 */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box className="flex items-center justify-between">
              <Typography variant="h6">学校详细信息</Typography>
              <IconButton onClick={() => setViewDialogOpen(false)} size="small">
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedSchool && (
              <Box className="py-2">
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box className="border-b pb-2 mb-3">
                      <Typography variant="h6" className="font-bold text-blue-600">
                        {selectedSchool.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        编号：{selectedSchool.code}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" className="mb-1">
                      所属机构
                    </Typography>
                    <Typography variant="body1">{selectedSchool.organization}</Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" className="mb-1">
                      学校类型
                    </Typography>
                    <Typography variant="body1">{selectedSchool.type}</Typography>
                  </Grid>

                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary" className="mb-1">
                      省份
                    </Typography>
                    <Typography variant="body1">{selectedSchool.province}</Typography>
                  </Grid>

                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary" className="mb-1">
                      城市
                    </Typography>
                    <Typography variant="body1">{selectedSchool.city}</Typography>
                  </Grid>

                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary" className="mb-1">
                      区县
                    </Typography>
                    <Typography variant="body1">{selectedSchool.district}</Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" className="mb-1">
                      学段
                    </Typography>
                    <Typography variant="body1">{selectedSchool.level}</Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" className="mb-1">
                      联系电话
                    </Typography>
                    <Typography variant="body1">{selectedSchool.phone}</Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" className="mb-1">
                      详细地址
                    </Typography>
                    <Typography variant="body1">{selectedSchool.address}</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* 添加学校弹窗 */}
        <Dialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle className="border-b">
            <Box className="flex items-center justify-between">
              <Typography variant="h6">添加学校</Typography>
              <IconButton onClick={() => setAddDialogOpen(false)} size="small">
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box className="py-4">
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '16px 12px' }}>
                <tbody>
                  {/* 第1行：学校名称(1-1)、联系电话(1-2) */}
                  <tr>
                    <td style={{ width: '50%' }}>
                      <Box>
                        <Typography variant="body2" className="mb-2">
                          <span className="text-red-600">* </span>学校名称:
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={newSchool.name}
                          onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                          placeholder="请输入姓名"
                        />
                      </Box>
                    </td>
                    <td style={{ width: '50%' }}>
                      <Box>
                        <Typography variant="body2" className="mb-2">
                          <span className="text-red-600">* </span>联系电话:
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={newSchool.phone}
                          onChange={(e) => setNewSchool({ ...newSchool, phone: e.target.value })}
                          placeholder="请输入姓名"
                        />
                      </Box>
                    </td>
                  </tr>

                  {/* 第2行：学校编码(2-1)、所属机构(2-2) */}
                  <tr>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">
                          <span className="text-red-600">* </span>学校编码:
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={newSchool.code}
                          disabled
                          placeholder="学校编码自动生成或无法修改"
                          sx={{
                            '& .MuiInputBase-root': {
                              backgroundColor: '#f5f5f5',
                            },
                          }}
                        />
                      </Box>
                    </td>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">
                          所属机构:
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={newSchool.organization}
                          onChange={(e) => setNewSchool({ ...newSchool, organization: e.target.value })}
                          placeholder="请输入姓名"
                        />
                      </Box>
                    </td>
                  </tr>

                  {/* 第3行：管理账号(3-1)、账号密码(3-2) */}
                  <tr>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">
                          <span className="text-red-600">* </span>管理账号:
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={newSchool.accountName}
                          onChange={(e) => setNewSchool({ ...newSchool, accountName: e.target.value })}
                          placeholder="请输入学校管理账号"
                        />
                      </Box>
                    </td>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">
                          <span className="text-red-600">* </span>账号密码:
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          type="password"
                          value={newSchool.accountPassword}
                          onChange={(e) => setNewSchool({ ...newSchool, accountPassword: e.target.value })}
                          placeholder="请输入管理账号登录密码"
                        />
                      </Box>
                    </td>
                  </tr>

                  {/* 第4行：学校类型(4-1)、学段(4-2) */}
                  <tr>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">
                          学校类型:
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                            value={newSchool.type}
                            onChange={(e) => setNewSchool({ ...newSchool, type: e.target.value })}
                            displayEmpty
                          >
                            <MenuItem value="">公立</MenuItem>
                            <MenuItem value="公办">公办</MenuItem>
                            <MenuItem value="民办">民办</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </td>
                    <td>
                      <Box>
                        <Typography variant="body2" className="mb-2">
                          学段:
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                            value={newSchool.level}
                            onChange={(e) => setNewSchool({ ...newSchool, level: e.target.value })}
                            displayEmpty
                          >
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

                  {/* 第5行：地理位置(跨2列) */}
                  <tr>
                    <td colSpan={2}>
                      <Box>
                        <Typography variant="body2" className="mb-2">
                          地理位置:
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                            value={newSchool.location}
                            onChange={(e) => setNewSchool({ ...newSchool, location: e.target.value })}
                            displayEmpty
                          >
                            <MenuItem value="">
                              <span className="text-gray-400">选择选项</span>
                            </MenuItem>
                            <MenuItem value="四川省成都市">四川省成都市</MenuItem>
                            <MenuItem value="四川省德阳市">四川省德阳市</MenuItem>
                            <MenuItem value="重庆市">重庆市</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </td>
                  </tr>

                  {/* 第6行：详细地址(跨2列) */}
                  <tr>
                    <td colSpan={2}>
                      <Box>
                        <Typography variant="body2" className="mb-2">
                          详细地址:
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={newSchool.address}
                          onChange={(e) => setNewSchool({ ...newSchool, address: e.target.value })}
                          placeholder="请输入邮箱地址"
                        />
                      </Box>
                    </td>
                  </tr>

                  {/* 第7行：学校描述(跨2列) */}
                  <tr>
                    <td colSpan={2}>
                      <Box>
                        <Typography variant="body2" className="mb-2">
                          学校描述:
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          multiline
                          rows={4}
                          value={newSchool.description}
                          onChange={(e) => setNewSchool({ ...newSchool, description: e.target.value })}
                          placeholder="输入内容"
                        />
                      </Box>
                    </td>
                  </tr>
                </tbody>
              </table>

            </Box>
          </DialogContent>
          <DialogActions className="px-6 pb-4">
            <Button onClick={() => setAddDialogOpen(false)} variant="outlined">
              取消
            </Button>
            <Button
              onClick={handleAddSchool}
              variant="contained"
              disabled={
                !newSchool.name ||
                !newSchool.phone ||
                !newSchool.accountName ||
                !newSchool.accountPassword
              }
            >
              确定
            </Button>
          </DialogActions>
        </Dialog>

        {/* 停用确认气泡 */}
        <Popover
          open={Boolean(deactivateAnchor)}
          anchorEl={deactivateAnchor}
          onClose={() => setDeactivateAnchor(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
        >
          <Box className="p-4 max-w-xs">
            <Typography variant="body2" className="mb-3">
              确认停用该学校？
            </Typography>
            <Box className="flex gap-2 justify-end">
              <Button
                size="small"
                variant="outlined"
                onClick={() => setDeactivateAnchor(null)}
              >
                取消
              </Button>
              <Button
                size="small"
                variant="contained"
                color="error"
                onClick={handleConfirmDeactivate}
              >
                确定
              </Button>
            </Box>
          </Box>
        </Popover>
      </Container>
    </Box>
  );
}
