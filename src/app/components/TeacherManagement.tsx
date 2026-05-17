import { useState } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  Select,
  MenuItem,
  FormControl,
  Menu,
  MenuItem as MenuItemComponent,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Tabs,
  Tab,
  TablePagination,
  Checkbox,
  Popover,
} from '@mui/material';
import {
  Search,
  Download,
  PersonAdd,
  Upload,
  MoreVert,
  Add,
  Info,
  HelpOutline,
  ArrowBack,
  Close,
} from '@mui/icons-material';

interface Teacher {
  id: string;
  name: string;
  phone: string;
  grade: string;
  subject: string;
  role: string;
  roleDetail?: string;
}

interface NewTeacherRow {
  id: number;
  name: string;
  phone: string;
  grade: string;
  department: string;
  role: string;
}

interface Department {
  id: string;
  name: string;
  count: number;
  children?: Department[];
}

interface ReviewRequest {
  id: string;
  applicant: string;
  applyTime: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function TeacherManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSchool, setSelectedSchool] = useState('绵阳锦鑫培训学校');
  const [addTeacherDialogOpen, setAddTeacherDialogOpen] = useState(false);
  const [editTeacherDialogOpen, setEditTeacherDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [addDepartmentDialogOpen, setAddDepartmentDialogOpen] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('root');
  const [expandedItems, setExpandedItems] = useState<string[]>(['root']);
  const [departmentMenuAnchor, setDepartmentMenuAnchor] = useState<null | HTMLElement>(null);
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
  const [isEditingDepartment, setIsEditingDepartment] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewTab, setReviewTab] = useState(0);
  const [reviewPage, setReviewPage] = useState(0);
  const [reviewRowsPerPage, setReviewRowsPerPage] = useState(10);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [batchConfirmAnchor, setBatchConfirmAnchor] = useState<null | HTMLElement>(null);

  const [reviewRequests, setReviewRequests] = useState<ReviewRequest[]>([
    {
      id: '1',
      applicant: '张三',
      applyTime: '2026-05-08 10:30:00',
      status: 'pending',
    },
    {
      id: '2',
      applicant: '李四',
      applyTime: '2026-05-08 11:15:00',
      status: 'pending',
    },
    {
      id: '3',
      applicant: '王五',
      applyTime: '2026-05-08 14:20:00',
      status: 'pending',
    },
    {
      id: '4',
      applicant: '赵六',
      applyTime: '2026-05-08 15:45:00',
      status: 'pending',
    },
    {
      id: '5',
      applicant: '刘七',
      applyTime: '2026-05-08 16:30:00',
      status: 'pending',
    },
  ]);
  const [departments, setDepartments] = useState<Department[]>([
    {
      id: 'root',
      name: '绵阳锦鑫培训学校',
      count: 6,
      children: [],
    },
  ]);
  const [newTeacherRows, setNewTeacherRows] = useState<NewTeacherRow[]>(
    Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      name: '',
      phone: '',
      grade: '',
      department: '',
      role: '',
    }))
  );

  const validTeachersCount = newTeacherRows.filter(
    (row) => row.name.trim() !== '' && row.phone.trim() !== ''
  ).length;

  const handleNewTeacherChange = (id: number, field: keyof NewTeacherRow, value: string) => {
    setNewTeacherRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleImportTeachers = () => {
    const validTeachers = newTeacherRows.filter(
      (row) => row.name.trim() !== '' && row.phone.trim() !== ''
    );
    // 这里可以添加导入逻辑
    console.log('导入教师:', validTeachers);
    setAddTeacherDialogOpen(false);
    // 重置表单
    setNewTeacherRows(
      Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        name: '',
        phone: '',
        grade: '',
        department: '',
        role: '',
      }))
    );
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher({ ...teacher });
    setEditTeacherDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingTeacher) {
      setTeachers((prev) =>
        prev.map((t) => (t.id === editingTeacher.id ? editingTeacher : t))
      );
    }
    setEditTeacherDialogOpen(false);
    setEditingTeacher(null);
  };

  const handleDeleteTeacher = () => {
    if (editingTeacher) {
      setTeachers((prev) => prev.filter((t) => t.id !== editingTeacher.id));
    }
    setEditTeacherDialogOpen(false);
    setEditingTeacher(null);
  };

  const handleAddDepartment = () => {
    if (newDepartmentName.trim() === '') return;

    if (isEditingDepartment) {
      // 修改部门名称
      const renameDepartmentInTree = (depts: Department[], deptId: string): Department[] => {
        return depts.map((dept) => {
          if (dept.id === deptId) {
            return {
              ...dept,
              name: newDepartmentName,
            };
          } else if (dept.children) {
            return {
              ...dept,
              children: renameDepartmentInTree(dept.children, deptId),
            };
          }
          return dept;
        });
      };

      setDepartments((prev) => renameDepartmentInTree(prev, selectedDepartmentId));
    } else {
      // 添加新部门
      const newDeptId = `dept-${Date.now()}`;

      const addDepartmentToTree = (depts: Department[], parentId: string): Department[] => {
        return depts.map((dept) => {
          if (dept.id === parentId) {
            const newDept: Department = {
              id: newDeptId,
              name: newDepartmentName,
              count: 0,
              children: [],
            };
            return {
              ...dept,
              children: [...(dept.children || []), newDept],
            };
          } else if (dept.children) {
            return {
              ...dept,
              children: addDepartmentToTree(dept.children, parentId),
            };
          }
          return dept;
        });
      };

      setDepartments((prev) => addDepartmentToTree(prev, selectedDepartmentId));

      // 自动展开父节点
      if (!expandedItems.includes(selectedDepartmentId)) {
        setExpandedItems((prev) => [...prev, selectedDepartmentId]);
      }
    }

    setAddDepartmentDialogOpen(false);
    setNewDepartmentName('');
    setIsEditingDepartment(false);
  };

  const handleDepartmentMenuOpen = (event: React.MouseEvent<HTMLElement>, dept: Department) => {
    event.stopPropagation();
    setDepartmentMenuAnchor(event.currentTarget);
    setCurrentDepartment(dept);
  };

  const handleDepartmentMenuClose = () => {
    setDepartmentMenuAnchor(null);
    setCurrentDepartment(null);
  };

  const handleAddSubDepartment = () => {
    if (currentDepartment) {
      setSelectedDepartmentId(currentDepartment.id);
      setIsEditingDepartment(false);
      setNewDepartmentName('');
      setAddDepartmentDialogOpen(true);
    }
    handleDepartmentMenuClose();
  };

  const handleRenameDepartment = () => {
    if (currentDepartment) {
      setSelectedDepartmentId(currentDepartment.id);
      setNewDepartmentName(currentDepartment.name);
      setIsEditingDepartment(true);
      setAddDepartmentDialogOpen(true);
    }
    handleDepartmentMenuClose();
  };

  const handleDeleteDepartment = () => {
    if (!currentDepartment || currentDepartment.id === 'root') return;

    const deleteDepartmentFromTree = (depts: Department[], idToDelete: string): Department[] => {
      return depts
        .filter((dept) => dept.id !== idToDelete)
        .map((dept) => {
          if (dept.children) {
            return {
              ...dept,
              children: deleteDepartmentFromTree(dept.children, idToDelete),
            };
          }
          return dept;
        });
    };

    setDepartments((prev) => deleteDepartmentFromTree(prev, currentDepartment.id));
    handleDepartmentMenuClose();
  };

  const handleBatchModeToggle = () => {
    setBatchMode(!batchMode);
    setSelectedReviews([]);
  };

  const handleSelectReview = (id: string) => {
    setSelectedReviews((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const currentPageIds = reviewRequests
        .filter((req) => {
          if (reviewTab === 0) return req.status === 'pending';
          if (reviewTab === 1) return req.status === 'approved';
          if (reviewTab === 2) return req.status === 'rejected';
          return true;
        })
        .slice(reviewPage * reviewRowsPerPage, reviewPage * reviewRowsPerPage + reviewRowsPerPage)
        .map((r) => r.id);
      setSelectedReviews(currentPageIds);
    } else {
      setSelectedReviews([]);
    }
  };

  const handleBatchApprove = (event: React.MouseEvent<HTMLElement>) => {
    if (selectedReviews.length === 0) return;
    setBatchConfirmAnchor(event.currentTarget);
  };

  const handleConfirmBatchApprove = () => {
    setReviewRequests((prev) =>
      prev.map((req) =>
        selectedReviews.includes(req.id) ? { ...req, status: 'approved' as const } : req
      )
    );
    setBatchConfirmAnchor(null);
    setBatchMode(false);
    setSelectedReviews([]);
  };

  const handleApproveRequest = (id: string) => {
    setReviewRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: 'approved' as const } : req))
    );
  };

  const handleRejectRequest = (id: string) => {
    setReviewRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: 'rejected' as const } : req))
    );
  };

  const currentPageReviews = reviewRequests.filter((req) => {
    if (reviewTab === 0) return req.status === 'pending';
    if (reviewTab === 1) return req.status === 'approved';
    if (reviewTab === 2) return req.status === 'rejected';
    return true;
  });

  const renderTree = (dept: Department) => (
    <TreeItem
      key={dept.id}
      itemId={dept.id}
      label={
        <Box className="flex items-center justify-between py-1 group min-w-0">
          <Typography
            variant="body2"
            className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
            title={dept.name}
          >
            {dept.name}
          </Typography>
          <Box className="flex items-center gap-1 flex-shrink-0">
            <Chip label={dept.count} size="small" />
            <IconButton
              size="small"
              onClick={(e) => handleDepartmentMenuOpen(e, dept)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      }
    >
      {dept.children?.map((child) => renderTree(child))}
    </TreeItem>
  );

  const [teachers, setTeachers] = useState<Teacher[]>([
    {
      id: '1',
      name: '彭浩',
      phone: '152****1265',
      grade: '小学',
      subject: '数学',
      role: '管理员',
      roleDetail: '信鸽管理员',
    },
    {
      id: '2',
      name: '王剑川',
      phone: '158****6235',
      grade: '初中',
      subject: '英语',
      role: '管理员',
      roleDetail: '信鸽管理员/教务...',
    },
    {
      id: '3',
      name: '汪鑫',
      phone: '181****6520',
      grade: '小学',
      subject: '语文',
      role: '管理员',
      roleDetail: '校长',
    },
    {
      id: '4',
      name: '王显平',
      phone: '181****9006',
      grade: '小学',
      subject: '数学',
      role: '管理员',
      roleDetail: '校长',
    },
    {
      id: '5',
      name: '郭叮洪',
      phone: '153****6781',
      grade: '初中',
      subject: '化学',
      role: '普通教师',
    },
    {
      id: '6',
      name: '石如飞',
      phone: '199****5060',
      grade: '未设置',
      subject: '',
      role: '普通教师',
    },
  ]);

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.phone.includes(searchTerm);
    const matchesRole = selectedRole === 'all' || teacher.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box className="min-h-screen bg-gray-50">
      <Container maxWidth="xl" className="py-6">
        {/* 标题和操作栏 */}
        <Box className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <Typography variant="h5" className="font-bold">
            教师管理
          </Typography>
          <Box className="flex gap-2 flex-wrap items-center">
            {searchExpanded ? (
              <TextField
                size="small"
                placeholder="搜索教师姓名或手机号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="w-64"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchExpanded(false)}>
                        <Close fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            ) : (
              <IconButton
                className="border border-gray-300"
                onClick={() => setSearchExpanded(true)}
              >
                <Search />
              </IconButton>
            )}
            <Button
              variant="outlined"
              className="border-gray-300 text-gray-700"
              onClick={() => setReviewDialogOpen(true)}
            >
              待审核({reviewRequests.filter(r => r.status === 'pending').length})
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => setAddTeacherDialogOpen(true)}
            >
              新增老师
            </Button>
          </Box>
        </Box>

        <Box className="flex gap-6">
          {/* 左侧学校列表 */}
          <Card className="w-64 h-fit hidden lg:block">
            <CardContent className="p-0">
              <Box className="p-2">
                <SimpleTreeView
                  selectedItems={selectedDepartmentId}
                  expandedItems={expandedItems}
                  onSelectedItemsChange={(event, itemId) => {
                    if (typeof itemId === 'string') {
                      setSelectedDepartmentId(itemId);
                    }
                  }}
                  onExpandedItemsChange={(event, itemIds) => {
                    setExpandedItems(itemIds);
                  }}
                >
                  {departments.map((dept) => renderTree(dept))}
                </SimpleTreeView>
              </Box>
            </CardContent>
          </Card>

          {/* 主内容区域 */}
          <Box className="flex-1">
            {/* 教师列表 */}
            <Card>
              <CardContent>
                <Box className="flex items-center justify-between mb-4">
                  <Typography variant="h6" className="font-medium">
                    {selectedSchool}
                  </Typography>
                  <FormControl size="small" className="w-32">
                    <Select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <MenuItem value="all">全部角色</MenuItem>
                      <MenuItem value="管理员">管理员</MenuItem>
                      <MenuItem value="普通教师">普通教师</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow className="bg-gray-50">
                        <TableCell>姓名</TableCell>
                        <TableCell>手机号</TableCell>
                        <TableCell>学段 / 学科</TableCell>
                        <TableCell>状态 / 权限</TableCell>
                        <TableCell align="right">操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredTeachers.map((teacher) => (
                        <TableRow key={teacher.id} hover>
                          <TableCell>
                            <Box className="flex items-center gap-2">
                              <Avatar className="bg-blue-100 text-blue-600 w-8 h-8">
                                👤
                              </Avatar>
                              <Typography variant="body2">{teacher.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{teacher.phone}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {teacher.grade} / {teacher.subject || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" className="font-medium">
                                {teacher.role}
                              </Typography>
                              {teacher.roleDetail && (
                                <Typography variant="caption" color="text.secondary">
                                  ({teacher.roleDetail})
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              className="text-blue-600"
                              onClick={() => handleEditTeacher(teacher)}
                            >
                              编辑
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* 部门操作菜单 */}
        <Menu
          anchorEl={departmentMenuAnchor}
          open={Boolean(departmentMenuAnchor)}
          onClose={handleDepartmentMenuClose}
        >
          {currentDepartment?.id === 'root' ? (
            <MenuItemComponent key="add-subdept" onClick={handleAddSubDepartment}>
              <ListItemText>添加子部门</ListItemText>
            </MenuItemComponent>
          ) : (
            <>
              <MenuItemComponent key="rename" onClick={handleRenameDepartment}>
                <ListItemText>修改部门名称</ListItemText>
              </MenuItemComponent>
              <MenuItemComponent key="add-subdept" onClick={handleAddSubDepartment}>
                <ListItemText>添加子部门</ListItemText>
              </MenuItemComponent>
              <MenuItemComponent key="delete" onClick={handleDeleteDepartment}>
                <ListItemText className="text-red-600">删除部门</ListItemText>
              </MenuItemComponent>
            </>
          )}
        </Menu>

        {/* 新增教师弹窗 */}
        <Dialog
          open={addTeacherDialogOpen}
          onClose={() => setAddTeacherDialogOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            className: "rounded-lg",
          }}
        >
          <DialogTitle className="border-b">
            <Box className="flex items-center justify-between">
              <Button
                startIcon={<ArrowBack />}
                onClick={() => setAddTeacherDialogOpen(false)}
                className="text-gray-600"
              >
                退出
              </Button>
              <Typography variant="h6" className="flex-1 text-center">
                <span className="text-blue-600">{validTeachersCount}</span> 位教师有效信息
              </Typography>
              <Box className="w-24"></Box>
            </Box>
          </DialogTitle>
          <DialogContent className="p-0">
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow className="bg-gray-50">
                    <TableCell width="80">序号</TableCell>
                    <TableCell>姓名</TableCell>
                    <TableCell>手机号</TableCell>
                    <TableCell>
                      <Box className="flex items-center gap-1">
                        学段
                        <IconButton size="small">
                          <HelpOutline fontSize="small" className="text-gray-400" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box className="flex items-center gap-1">
                        学科
                        <IconButton size="small">
                          <HelpOutline fontSize="small" className="text-gray-400" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box className="flex items-center gap-1">
                        角色
                        <IconButton size="small">
                          <HelpOutline fontSize="small" className="text-gray-400" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {newTeacherRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-center">{row.id}</TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          variant="outlined"
                          value={row.name}
                          onChange={(e) => handleNewTeacherChange(row.id, 'name', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          variant="outlined"
                          value={row.phone}
                          onChange={(e) => handleNewTeacherChange(row.id, 'phone', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={row.grade}
                            onChange={(e) => handleNewTeacherChange(row.id, 'grade', e.target.value)}
                            displayEmpty
                          >
                            <MenuItem value="">
                              <Typography variant="body2" color="text.secondary">
                                请选择学段
                              </Typography>
                            </MenuItem>
                            <MenuItem value="学前">学前</MenuItem>
                            <MenuItem value="小学">小学</MenuItem>
                            <MenuItem value="中学">中学</MenuItem>
                            <MenuItem value="高中">高中</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={row.department}
                            onChange={(e) => handleNewTeacherChange(row.id, 'department', e.target.value)}
                            displayEmpty
                          >
                            <MenuItem value="">
                              <Typography variant="body2" color="text.secondary">
                                请选择学科
                              </Typography>
                            </MenuItem>
                            <MenuItem value="语文">语文</MenuItem>
                            <MenuItem value="数学">数学</MenuItem>
                            <MenuItem value="英语">英语</MenuItem>
                            <MenuItem value="物理">物理</MenuItem>
                            <MenuItem value="化学">化学</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        {row.name.trim() === '' || row.phone.trim() === '' ? (
                          <Typography variant="body2" color="text.secondary" className="text-sm">
                            请先添加姓名、手机号
                          </Typography>
                        ) : (
                          <FormControl fullWidth size="small">
                            <Select
                              value={row.role}
                              onChange={(e) => handleNewTeacherChange(row.id, 'role', e.target.value)}
                              displayEmpty
                            >
                              <MenuItem value="">
                                <Typography variant="body2" color="text.secondary">
                                  请选择角色
                                </Typography>
                              </MenuItem>
                              <MenuItem value="普通教师">普通教师</MenuItem>
                              <MenuItem value="管理员">管理员</MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions className="border-t p-4 flex justify-between">
            <Box>
              <Typography variant="caption" color="text.secondary">
                提示：支持复制Excel内容，粘贴至表格中。
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={handleImportTeachers}
              disabled={validTeachersCount === 0}
              className="px-8"
            >
              保存
            </Button>
          </DialogActions>
        </Dialog>

        {/* 编辑教师弹窗 */}
        <Dialog
          open={editTeacherDialogOpen}
          onClose={() => setEditTeacherDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box className="flex items-center justify-between">
              <Typography variant="h6">编辑教师信息</Typography>
              <IconButton onClick={() => setEditTeacherDialogOpen(false)} size="small">
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box className="py-2 space-y-4">
              {/* 姓名 */}
              <Box className="flex items-center gap-4">
                <Typography className="w-24 text-right">姓名：</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={editingTeacher?.name || ''}
                  onChange={(e) =>
                    setEditingTeacher((prev) => (prev ? { ...prev, name: e.target.value } : null))
                  }
                />
              </Box>

              {/* 手机号 */}
              <Box className="flex items-center gap-4">
                <Typography className="w-24 text-right">手机号：</Typography>
                <Typography variant="body2" color="text.secondary">
                  {editingTeacher?.phone}
                </Typography>
              </Box>

              {/* 学段/学科 */}
              <Box className="flex items-center gap-4">
                <Typography className="w-24 text-right">学段/学科：</Typography>
                <Box className="flex gap-2 flex-1">
                  <FormControl size="small" className="flex-1">
                    <Select
                      value={editingTeacher?.grade || ''}
                      onChange={(e) =>
                        setEditingTeacher((prev) =>
                          prev ? { ...prev, grade: e.target.value } : null
                        )
                      }
                    >
                      <MenuItem value="学前">学前</MenuItem>
                      <MenuItem value="小学">小学</MenuItem>
                      <MenuItem value="中学">中学</MenuItem>
                      <MenuItem value="高中">高中</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" className="flex-1">
                    <Select
                      value={editingTeacher?.subject || ''}
                      onChange={(e) =>
                        setEditingTeacher((prev) =>
                          prev ? { ...prev, subject: e.target.value } : null
                        )
                      }
                    >
                      <MenuItem value="数学">数学</MenuItem>
                      <MenuItem value="语文">语文</MenuItem>
                      <MenuItem value="英语">英语</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {/* 部门 */}
              <Box className="flex items-center gap-4">
                <Typography className="w-24 text-right">部门：</Typography>
                <FormControl size="small" fullWidth>
                  <Select value="" displayEmpty>
                    <MenuItem value="">
                      <Typography variant="body2" color="text.secondary">
                        请选择部门
                      </Typography>
                    </MenuItem>
                    <MenuItem value="教务处">教务处</MenuItem>
                    <MenuItem value="综合部">综合部</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* 角色 */}
              <Box className="flex items-center gap-4">
                <Typography className="w-24 text-right">角色：</Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    value={editingTeacher?.role || ''}
                    onChange={(e) =>
                      setEditingTeacher((prev) =>
                        prev ? { ...prev, role: e.target.value } : null
                      )
                    }
                    displayEmpty
                  >
                    <MenuItem value="">
                      <Typography variant="body2" color="text.secondary">
                        请选择角色
                      </Typography>
                    </MenuItem>
                    <MenuItem value="管理员">管理员</MenuItem>
                    <MenuItem value="普通教师">普通教师</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions className="px-6 pb-4 flex justify-between">
            <Button onClick={handleDeleteTeacher} className="text-red-600">
              删除
            </Button>
            <Box className="flex gap-2">
              <Button onClick={() => setEditTeacherDialogOpen(false)} variant="outlined">
                取消
              </Button>
              <Button onClick={handleSaveEdit} variant="contained">
                确定
              </Button>
            </Box>
          </DialogActions>
        </Dialog>

        {/* 添加/修改子部门弹窗 */}
        <Dialog
          open={addDepartmentDialogOpen}
          onClose={() => {
            setAddDepartmentDialogOpen(false);
            setNewDepartmentName('');
            setIsEditingDepartment(false);
          }}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>
            <Box className="flex items-center justify-between">
              <Typography variant="h6">{isEditingDepartment ? '修改部门名称' : '添加子部门'}</Typography>
              <IconButton
                onClick={() => {
                  setAddDepartmentDialogOpen(false);
                  setNewDepartmentName('');
                  setIsEditingDepartment(false);
                }}
                size="small"
              >
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box className="py-2 space-y-4">
              {/* 上级部门 - 仅在添加子部门时显示 */}
              {!isEditingDepartment && (
                <Box className="flex items-center gap-4">
                  <Typography className="w-24">上级部门</Typography>
                  <Typography variant="body2">
                    {(() => {
                      const findDepartment = (depts: Department[], id: string): string => {
                        for (const dept of depts) {
                          if (dept.id === id) return dept.name;
                          if (dept.children) {
                            const found = findDepartment(dept.children, id);
                            if (found) return found;
                          }
                        }
                        return '';
                      };
                      return findDepartment(departments, selectedDepartmentId);
                    })()}
                  </Typography>
                </Box>
              )}

              {/* 新增/修改部门 */}
              <Box className="flex items-center gap-4">
                <Typography className="w-24">{isEditingDepartment ? '部门名称' : '新增部门'}</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  placeholder="请输入部门名称"
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions className="px-6 pb-4">
            <Button
              onClick={() => {
                setAddDepartmentDialogOpen(false);
                setNewDepartmentName('');
                setIsEditingDepartment(false);
              }}
              variant="outlined"
            >
              取消
            </Button>
            <Button
              onClick={handleAddDepartment}
              variant="contained"
              disabled={newDepartmentName.trim() === ''}
            >
              确定
            </Button>
          </DialogActions>
        </Dialog>

        {/* 审核数据弹窗 */}
        <Dialog
          open={reviewDialogOpen}
          onClose={() => setReviewDialogOpen(false)}
          maxWidth="xl"
          fullWidth
          PaperProps={{
            className: "rounded-lg",
            style: {
              height: '85vh',
              maxHeight: '85vh',
            },
          }}
        >
          <DialogTitle>
            <Box className="flex items-center justify-between">
              <Typography variant="h6">审核数据</Typography>
              <IconButton onClick={() => setReviewDialogOpen(false)} size="small">
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent className="flex flex-col" style={{ overflow: 'hidden' }}>
            {/* 标签页 */}
            <Box className="border-b mb-4 flex items-center justify-between">
              <Tabs value={reviewTab} onChange={(e, newValue) => setReviewTab(newValue)}>
                <Tab label={`待审核(${reviewRequests.filter(r => r.status === 'pending').length})`} />
                <Tab label={`已通过(${reviewRequests.filter(r => r.status === 'approved').length})`} />
                <Tab label={`已拒绝(${reviewRequests.filter(r => r.status === 'rejected').length})`} />
              </Tabs>
              <Box className="flex gap-2">
                {batchMode && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleBatchModeToggle}
                  >
                    取消
                  </Button>
                )}
                <Button
                  variant="contained"
                  size="small"
                  onClick={batchMode ? handleBatchApprove : handleBatchModeToggle}
                  disabled={batchMode && selectedReviews.length === 0}
                >
                  {batchMode ? '批量通过' : '批量操作'}
                </Button>
              </Box>
            </Box>

            {/* 表格 */}
            <TableContainer style={{ flex: 1, overflow: 'auto' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow className="bg-gray-50">
                    {batchMode && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={
                            selectedReviews.length > 0 &&
                            selectedReviews.length < currentPageReviews.slice(reviewPage * reviewRowsPerPage, reviewPage * reviewRowsPerPage + reviewRowsPerPage).length
                          }
                          checked={
                            currentPageReviews.slice(reviewPage * reviewRowsPerPage, reviewPage * reviewRowsPerPage + reviewRowsPerPage).length > 0 &&
                            selectedReviews.length === currentPageReviews.slice(reviewPage * reviewRowsPerPage, reviewPage * reviewRowsPerPage + reviewRowsPerPage).length
                          }
                          onChange={handleSelectAll}
                        />
                      </TableCell>
                    )}
                    <TableCell>申请人</TableCell>
                    <TableCell>申请时间</TableCell>
                    <TableCell align="right">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentPageReviews
                    .slice(reviewPage * reviewRowsPerPage, reviewPage * reviewRowsPerPage + reviewRowsPerPage)
                    .map((request) => (
                      <TableRow key={request.id} hover>
                        {batchMode && (
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedReviews.includes(request.id)}
                              onChange={() => handleSelectReview(request.id)}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <Box className="flex items-center gap-2">
                            <Avatar className="bg-blue-100 text-blue-600 w-8 h-8">
                              {request.applicant.charAt(0)}
                            </Avatar>
                            <Typography variant="body2">{request.applicant}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{request.applyTime}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          {request.status === 'pending' ? (
                            <Box className="flex gap-2 justify-end">
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleRejectRequest(request.id)}
                              >
                                拒绝
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleApproveRequest(request.id)}
                              >
                                通过
                              </Button>
                            </Box>
                          ) : (
                            <Chip
                              label={request.status === 'approved' ? '已通过' : '已拒绝'}
                              color={request.status === 'approved' ? 'success' : 'error'}
                              size="small"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  {currentPageReviews.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={batchMode ? 4 : 3}>
                        <Box className="flex flex-col items-center justify-center py-16">
                          <Box className="text-8xl text-gray-200 mb-4">📁</Box>
                          <Typography variant="body2" color="text.secondary">
                            暂无数据
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* 分页 */}
            <TablePagination
              component="div"
              count={currentPageReviews.length}
              page={reviewPage}
              onPageChange={(event, newPage) => setReviewPage(newPage)}
              rowsPerPage={reviewRowsPerPage}
              onRowsPerPageChange={(event) => {
                setReviewRowsPerPage(parseInt(event.target.value, 10));
                setReviewPage(0);
              }}
              labelRowsPerPage="每页行数："
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count}`}
            />
          </DialogContent>

          {/* 批量操作确认气泡 */}
          <Popover
            open={Boolean(batchConfirmAnchor)}
            anchorEl={batchConfirmAnchor}
            onClose={() => setBatchConfirmAnchor(null)}
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
                是否批量通过选中的教师？
              </Typography>
              <Box className="flex gap-2 justify-end">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setBatchConfirmAnchor(null)}
                >
                  取消
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleConfirmBatchApprove}
                >
                  确定
                </Button>
              </Box>
            </Box>
          </Popover>
        </Dialog>
      </Container>
    </Box>
  );
}
