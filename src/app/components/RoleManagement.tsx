import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Checkbox,
} from '@mui/material';
import {
  MoreVert,
  Add,
  Delete,
  Edit,
  Search,
  Close,
  Security,
  School,
} from '@mui/icons-material';
import { usePermission } from '../store/PermissionContext';
import { useSchoolAuthorization } from '../store/SchoolAuthorizationContext';
import type { Role } from '../types/permissions';

// 教师mock数据（与TeacherManagement保持一致）
interface TeacherInfo {
  id: string;
  name: string;
  phone: string;
  grade: string;
  subject: string;
}

const MOCK_TEACHERS: TeacherInfo[] = [
  { id: '1', name: '彭浩', phone: '152****1265', grade: '小学', subject: '数学' },
  { id: '2', name: '王剑川', phone: '158****6235', grade: '初中', subject: '英语' },
  { id: '3', name: '汪鑫', phone: '181****6520', grade: '小学', subject: '语文' },
  { id: '4', name: '王显平', phone: '181****9006', grade: '小学', subject: '数学' },
  { id: '5', name: '郭叮洪', phone: '153****6781', grade: '初中', subject: '化学' },
  { id: '6', name: '石如飞', phone: '199****5060', grade: '未设置', subject: '' },
  { id: '7', name: '张三', phone: '138****1234', grade: '小学', subject: '英语' },
  { id: '8', name: '李四', phone: '139****5678', grade: '初中', subject: '物理' },
  { id: '9', name: '王五', phone: '137****9012', grade: '高中', subject: '数学' },
  { id: '10', name: '赵六', phone: '136****3456', grade: '小学', subject: '语文' },
];

interface Props {
  onEditPermissions: (role: Role) => void;
}

// ─── 学校上下文信息 ───

function SchoolInfo() {
  const { getSchoolAuth, currentSchoolId } = useSchoolAuthorization();
  const auth = getSchoolAuth(currentSchoolId);

  return (
    <Box className="mt-2 flex items-center gap-1.5 bg-blue-50 rounded-lg px-2.5 py-1.5">
      <School sx={{ fontSize: 14, color: '#3b82f6' }} />
      <Typography variant="caption" color="text.secondary" className="font-medium" noWrap>
        {auth?.schoolName || '未知学校'}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        · {auth?.authorizedPageKeys.length ?? 0} 模块
      </Typography>
    </Box>
  );
}

export default function RoleManagement({ onEditPermissions }: Props) {
  const {
    roles,
    addRole,
    deleteRole,
    addMembersToRole,
    removeMemberFromRole,
  } = usePermission();

  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    roles[0]?.id ?? ''
  );
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRole, setMenuRole] = useState<Role | null>(null);
  const [addRoleDialogOpen, setAddRoleDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [selectedNewMembers, setSelectedNewMembers] = useState<string[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  // 角色排序：超级管理员始终在最前
  const sortedRoles = useMemo(
    () => [...roles].sort((a, b) => (a.isSystem ? -1 : b.isSystem ? 1 : 0)),
    [roles]
  );

  // 当前角色的成员列表
  const memberList = useMemo(() => {
    if (!selectedRole) return [];
    return MOCK_TEACHERS.filter((t) => selectedRole.memberIds.includes(t.id));
  }, [selectedRole]);

  // 过滤后的成员
  const filteredMembers = useMemo(() => {
    if (!memberSearchTerm) return memberList;
    const term = memberSearchTerm.toLowerCase();
    return memberList.filter(
      (t) => t.name.toLowerCase().includes(term) || t.phone.includes(term)
    );
  }, [memberList, memberSearchTerm]);

  // 可以添加的教师（不在当前角色中的）
  const availableTeachers = useMemo(() => {
    if (!selectedRole) return [];
    return MOCK_TEACHERS.filter(
      (t) => !selectedRole.memberIds.includes(t.id)
    );
  }, [selectedRole]);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, role: Role) => {
    setMenuAnchorEl(e.currentTarget);
    setMenuRole(role);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuRole(null);
  };

  const handleAddRole = () => {
    if (!newRoleName.trim()) return;
    addRole(newRoleName.trim());
    setNewRoleName('');
    setAddRoleDialogOpen(false);
  };

  const handleDeleteRole = () => {
    if (menuRole && !menuRole.isSystem) {
      deleteRole(menuRole.id);
      if (selectedRoleId === menuRole.id) {
        const remaining = roles.filter((r) => r.id !== menuRole.id);
        setSelectedRoleId(remaining[0]?.id ?? '');
      }
    }
    handleMenuClose();
  };

  const handleEditPermissions = () => {
    if (menuRole) {
      onEditPermissions(menuRole);
    }
    handleMenuClose();
  };

  const handleAddMembers = () => {
    if (!selectedRole || selectedNewMembers.length === 0) return;
    addMembersToRole(selectedRole.id, selectedNewMembers);
    setSelectedNewMembers([]);
    setAddMemberDialogOpen(false);
  };

  const toggleNewMember = (id: string) => {
    setSelectedNewMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (!selectedRole) {
    return (
      <Box className="p-6 text-center text-gray-400">
        暂无角色数据，请先添加角色
      </Box>
    );
  }

  return (
    <Box className="flex h-[calc(100vh-64px)] bg-gray-50">
      {/* ====== 左侧角色列表 ====== */}
      <Box className="w-72 bg-white border-r border-gray-200 flex flex-col overflow-hidden shrink-0">
        <Box className="p-4 border-b border-gray-100">
          <Typography variant="h6" className="font-bold">
            角色管理
          </Typography>
          <SchoolInfo />
        </Box>
        <Box className="flex-1 overflow-auto p-3 space-y-1">
          {sortedRoles.map((role) => (
            <Box
              key={role.id}
              onClick={() => setSelectedRoleId(role.id)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                selectedRoleId === role.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              <Box className="flex items-center gap-2 min-w-0">
                <Security
                  fontSize="small"
                  className={
                    selectedRoleId === role.id
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }
                />
                <Typography variant="body2" className="font-medium truncate">
                  {role.name}
                </Typography>
                {role.isSystem && (
                  <Chip
                    label="内置"
                    size="small"
                    sx={{ height: 18, fontSize: 10 }}
                  />
                )}
              </Box>
              <Box className="flex items-center gap-1 shrink-0">
                <Typography variant="caption" color="text.secondary">
                  {role.memberIds.length}人
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, role)}
                  sx={{ padding: '2px' }}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
        <Box className="p-3 border-t border-gray-100">
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setAddRoleDialogOpen(true)}
            size="small"
          >
            添加角色
          </Button>
        </Box>
      </Box>

      {/* ====== 右侧成员列表 ====== */}
      <Box className="flex-1 overflow-auto p-6">
        {/* 标题行 */}
        <Box className="mb-4 flex items-center justify-between">
          <Box>
            <Typography variant="h6" className="font-bold">
              {selectedRole.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              共 {memberList.length} 名成员
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            size="small"
            onClick={() => {
              setSelectedNewMembers([]);
              setAddMemberDialogOpen(true);
            }}
          >
            添加成员
          </Button>
        </Box>

        {/* 搜索 */}
        <Box className="mb-4">
          <TextField
            size="small"
            placeholder="搜索成员姓名或手机号..."
            value={memberSearchTerm}
            onChange={(e) => setMemberSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            className="w-80"
          />
        </Box>

        {/* 成员表格 */}
        <TableContainer component={Paper} variant="outlined" className="rounded-xl">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: 70 }}>
                  序号
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>姓名</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>手机号</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>学段/学科</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 100 }}>
                  操作
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      {memberSearchTerm
                        ? '未找到匹配的成员'
                        : '暂无成员，点击"添加成员"按钮添加'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((teacher, index) => (
                  <TableRow key={teacher.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Box className="flex items-center gap-2">
                        <Avatar
                          className="bg-blue-100 text-blue-600"
                          sx={{ width: 28, height: 28, fontSize: 14 }}
                        >
                          {teacher.name.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" className="font-medium">
                          {teacher.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {teacher.phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {teacher.grade}
                        {teacher.subject ? ` / ${teacher.subject}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        color="error"
                        onClick={() =>
                          removeMemberFromRole(selectedRole.id, teacher.id)
                        }
                        sx={{ fontSize: 12 }}
                      >
                        移除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* ====== 角色操作菜单 ====== */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditPermissions}>
          <Edit fontSize="small" className="mr-2" />
          编辑权限
        </MenuItem>
        {menuRole && !menuRole.isSystem && (
          <MenuItem onClick={handleDeleteRole} className="text-red-600">
            <Delete fontSize="small" className="mr-2" />
            删除角色
          </MenuItem>
        )}
      </Menu>

      {/* ====== 添加角色弹窗 ====== */}
      <Dialog
        open={addRoleDialogOpen}
        onClose={() => setAddRoleDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box className="flex items-center justify-between">
            <Typography variant="h6">添加角色</Typography>
            <IconButton
              onClick={() => setAddRoleDialogOpen(false)}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box className="pt-2">
            <TextField
              fullWidth
              size="small"
              label="角色名称"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="请输入角色名称"
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button
            onClick={() => setAddRoleDialogOpen(false)}
            variant="outlined"
          >
            取消
          </Button>
          <Button
            onClick={handleAddRole}
            variant="contained"
            disabled={!newRoleName.trim()}
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>

      {/* ====== 添加成员弹窗 ====== */}
      <Dialog
        open={addMemberDialogOpen}
        onClose={() => setAddMemberDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box className="flex items-center justify-between">
            <Typography variant="h6">添加成员</Typography>
            <IconButton
              onClick={() => setAddMemberDialogOpen(false)}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box className="pt-2">
            {availableTeachers.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                className="text-center py-4"
              >
                所有教师已添加到此角色
              </Typography>
            ) : (
              <List dense>
                {availableTeachers.map((teacher) => (
                  <ListItem
                    key={teacher.id}
                    button
                    onClick={() => toggleNewMember(teacher.id)}
                    selected={selectedNewMembers.includes(teacher.id)}
                  >
                    <Checkbox
                      edge="start"
                      checked={selectedNewMembers.includes(teacher.id)}
                      size="small"
                    />
                    <ListItemAvatar>
                      <Avatar
                        className="bg-blue-100 text-blue-600"
                        sx={{ width: 32, height: 32, fontSize: 14 }}
                      >
                        {teacher.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={teacher.name}
                      secondary={`${teacher.phone} · ${teacher.grade}${
                        teacher.subject ? ` / ${teacher.subject}` : ''
                      }`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button
            onClick={() => setAddMemberDialogOpen(false)}
            variant="outlined"
          >
            取消
          </Button>
          <Button
            onClick={handleAddMembers}
            variant="contained"
            disabled={selectedNewMembers.length === 0}
          >
            添加 ({selectedNewMembers.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
