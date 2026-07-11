import { useState, useMemo } from 'react';
import {
  Box, Typography, Button, IconButton, Chip, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Paper, Divider,
} from '@mui/material';
import {
  Add, Search, Edit, Delete, Close, Videocam, School, People,
} from '@mui/icons-material';

interface Classroom {
  id: string;
  name: string;
  teacher: string;
  subject: string;
  grade: string;
  createdAt: string;
  status: 'live' | 'ended' | 'scheduled';
  studentCount: number;
}

const subjectOptions = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];
const gradeOptions = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '高一', '高二', '高三'];

function generateMockData(): Classroom[] {
  const teachers = ['张老师', '李老师', '王老师', '陈老师', '刘老师', '赵老师'];
  const names = [
    '函数与极限', '古诗词鉴赏', '语法基础', '力学实验', '元素周期表',
    '细胞结构', '辛亥革命', '大气环流', '三角函数', '文言文阅读',
    '现在完成时', '牛顿定律', '氧化还原反应', '生态系统', '电路分析',
    '立体几何', '散文阅读', '被动语态', '电磁感应', '有机化学',
  ];
  const statuses: Classroom['status'][] = ['live', 'ended', 'scheduled'];

  return Array.from({ length: 35 }, (_, i) => ({
    id: `c${i + 1}`,
    name: names[i % names.length],
    teacher: teachers[i % teachers.length],
    subject: subjectOptions[i % subjectOptions.length],
    grade: gradeOptions[i % gradeOptions.length],
    createdAt: new Date(2026, 4, 1 + i).toISOString().split('T')[0],
    status: statuses[i % statuses.length],
    studentCount: 10 + Math.floor(Math.random() * 35),
  }));
}

export default function InteractiveClassroomManagement() {
  const [classrooms] = useState(generateMockData);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', teacher: '', subject: '', grade: '' });

  const statusLabel: Record<Classroom['status'], string> = { live: '直播中', ended: '已结束', scheduled: '待开始' };
  const statusColor: Record<Classroom['status'], 'success' | 'default' | 'warning'> = { live: 'success', ended: 'default', scheduled: 'warning' };

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return classrooms;
    const q = searchTerm.toLowerCase();
    return classrooms.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.teacher.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q)
    );
  }, [classrooms, searchTerm]);

  const displayedRows = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleCreate = () => {
    if (!createForm.name || !createForm.teacher || !createForm.subject || !createForm.grade) return;
    setCreateForm({ name: '', teacher: '', subject: '', grade: '' });
    setCreateOpen(false);
  };

  return (
    <Box className="p-6">
      {/* 标题栏 */}
      <Box className="mb-6 flex items-center justify-between">
        <Box>
          <Typography variant="h5" className="font-bold">互动课堂管理</Typography>
          <Typography variant="body2" color="text.secondary" className="mt-1">
            管理所有互动课堂的创建、查看和检索
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
          创建课堂
        </Button>
      </Box>

      {/* 搜索栏 */}
      <Box className="mb-4">
        <TextField
          size="small" placeholder="搜索课堂名称、教师、学科..." value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" className="text-gray-400" /></InputAdornment> }}
          className="w-full md:w-80"
        />
      </Box>

      {/* 表格 */}
      <TableContainer component={Paper} className="rounded-xl shadow-sm border border-gray-200">
        <Table>
          <TableHead>
            <TableRow className="bg-gray-50">
              <TableCell className="font-semibold text-gray-600">课堂名称</TableCell>
              <TableCell className="font-semibold text-gray-600">授课教师</TableCell>
              <TableCell className="font-semibold text-gray-600">学科</TableCell>
              <TableCell className="font-semibold text-gray-600">年级</TableCell>
              <TableCell className="font-semibold text-gray-600">创建日期</TableCell>
              <TableCell className="font-semibold text-gray-600">状态</TableCell>
              <TableCell className="font-semibold text-gray-600">学生人数</TableCell>
              <TableCell className="font-semibold text-gray-600" align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                  <Videocam className="text-4xl mb-2" />
                  <Typography variant="body2">暂无课堂数据</Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayedRows.map((c) => (
                <TableRow key={c.id} className="hover:bg-gray-50">
                  <TableCell>
                    <Box className="flex items-center gap-2">
                      <Videocam fontSize="small" className="text-blue-500" />
                      <Typography variant="body2" className="font-medium">{c.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box className="flex items-center gap-1">
                      <School fontSize="small" className="text-gray-400" />
                      {c.teacher}
                    </Box>
                  </TableCell>
                  <TableCell>{c.subject}</TableCell>
                  <TableCell>{c.grade}</TableCell>
                  <TableCell>{c.createdAt}</TableCell>
                  <TableCell>
                    <Chip label={statusLabel[c.status]} size="small" color={statusColor[c.status]}
                      variant="filled" sx={{ height: 22, '& .MuiChip-label': { px: 0.8, fontSize: 11 } }} />
                  </TableCell>
                  <TableCell>
                    <Box className="flex items-center gap-1">
                      <People fontSize="small" className="text-gray-400" /> {c.studentCount}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" className="text-gray-400"><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" className="text-gray-400"><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 分页 */}
      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        labelRowsPerPage="每页行数："
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共 ${count}`}
        className="border-t border-gray-200"
      />

      {/* 创建课堂弹窗 */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="border-b">
          <Box className="flex items-center justify-between">
            <Typography variant="h6">创建互动课堂</Typography>
            <IconButton onClick={() => setCreateOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box className="py-4 flex flex-col gap-4">
            <TextField fullWidth size="small" label="课堂名称" value={createForm.name}
              onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="请输入课堂名称" />
            <TextField fullWidth size="small" label="授课教师" value={createForm.teacher}
              onChange={(e) => setCreateForm(f => ({ ...f, teacher: e.target.value }))} placeholder="请输入教师姓名" />
            <Box className="flex gap-3">
              <FormControl fullWidth size="small">
                <InputLabel>学科</InputLabel>
                <Select value={createForm.subject} label="学科"
                  onChange={(e) => setCreateForm(f => ({ ...f, subject: e.target.value }))}>
                  {subjectOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>年级</InputLabel>
                <Select value={createForm.grade} label="年级"
                  onChange={(e) => setCreateForm(f => ({ ...f, grade: e.target.value }))}>
                  {gradeOptions.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setCreateOpen(false)} variant="outlined">取消</Button>
          <Button onClick={handleCreate} variant="contained"
            disabled={!createForm.name || !createForm.teacher || !createForm.subject || !createForm.grade}>
            创建
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
