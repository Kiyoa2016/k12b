import { useState } from 'react';
import {
  Box,
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
  Select,
  MenuItem,
  Collapse,
  List,
} from '@mui/material';
import ClassroomControl from './ClassroomControl';
import { Search, Add, Close, Edit, ExpandMore, ChevronRight, Business } from '@mui/icons-material';

interface Floor {
  id: string;
  name: string;
}

interface Building {
  id: string;
  name: string;
  floors: Floor[];
}

interface Classroom {
  id: string;
  code: string;
  name: string;
  school: string;
  grade: string;
  studentCount: number;
  location: string;
  status: string;
  buildingId: string;
  floorId: string;
  teacherVideoUrl?: string;
  studentVideoUrl?: string;
  whiteboardVideoUrl?: string;
}

export default function ClassroomManagement() {
  const [buildings, setBuildings] = useState<Building[]>([
    {
      id: 'east',
      name: '东教学楼',
      floors: [
        { id: 'east-1', name: '一楼' },
        { id: 'east-2', name: '二楼' },
        { id: 'east-3', name: '三楼' },
      ],
    },
    {
      id: 'west',
      name: '西教学楼',
      floors: [
        { id: 'west-1', name: '一楼' },
        { id: 'west-2', name: '二楼' },
        { id: 'west-3', name: '三楼' },
      ],
    },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    school: '',
    grade: '',
    type: '',
    location: '',
    description: '',
    teacherVideoUrl: '',
    studentVideoUrl: '',
    whiteboardVideoUrl: '',
  });
  const [controlDialogOpen, setControlDialogOpen] = useState(false);
  const [controllingClassroom, setControllingClassroom] = useState<Classroom | null>(null);

  // 左侧楼栋选择状态
  const [expandedBuilding, setExpandedBuilding] = useState<string>('east');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('east-1');

  // 添加楼栋/楼层
  const [addBuildingDialogOpen, setAddBuildingDialogOpen] = useState(false);
  const [addFloorDialogOpen, setAddFloorDialogOpen] = useState(false);
  const [addFloorTargetBuilding, setAddFloorTargetBuilding] = useState<string>('');
  const [newBuildingName, setNewBuildingName] = useState('');
  const [newFloorName, setNewFloorName] = useState('');

  const defaultSchool = '成都市仁寿中学（双流校区）';

  const [newClassroom, setNewClassroom] = useState({
    name: '',
    code: '',
    school: defaultSchool,
    grade: '',
    type: '',
    location: '',
    description: '',
    teacherVideoUrl: '',
    studentVideoUrl: '',
    whiteboardVideoUrl: '',
  });

  const [classrooms, setClassrooms] = useState<Classroom[]>([
    {
      id: '1', code: 'ROOM001', name: '一年级1班', school: '成都市仁寿中学（双流校区）',
      grade: '一年级', studentCount: 45, location: '东教学楼一楼101', status: '在线',
      buildingId: 'east', floorId: 'east-1',
    },
    {
      id: '2', code: 'ROOM002', name: '一年级2班', school: '成都市仁寿中学（双流校区）',
      grade: '一年级', studentCount: 42, location: '东教学楼一楼102', status: '在线',
      buildingId: 'east', floorId: 'east-1',
    },
    {
      id: '3', code: 'ROOM003', name: '二年级1班', school: '成都市仁寿中学（双流校区）',
      grade: '二年级', studentCount: 38, location: '东教学楼二楼201', status: '在线',
      buildingId: 'east', floorId: 'east-2',
    },
    {
      id: '4', code: 'ROOM004', name: '二年级2班', school: '成都市仁寿中学（双流校区）',
      grade: '二年级', studentCount: 40, location: '东教学楼二楼202', status: '在线',
      buildingId: 'east', floorId: 'east-2',
    },
    {
      id: '5', code: 'ROOM005', name: '三年级1班', school: '成都市仁寿中学（双流校区）',
      grade: '三年级', studentCount: 50, location: '东教学楼三楼301', status: '离线',
      buildingId: 'east', floorId: 'east-3',
    },
    {
      id: '6', code: 'ROOM006', name: '一年级3班', school: '成都市锦鑫中学',
      grade: '一年级', studentCount: 36, location: '西教学楼一楼101', status: '在线',
      buildingId: 'west', floorId: 'west-1',
    },
    {
      id: '7', code: 'ROOM007', name: '二年级3班', school: '成都市锦鑫中学',
      grade: '二年级', studentCount: 34, location: '西教学楼二楼201', status: '在线',
      buildingId: 'west', floorId: 'west-2',
    },
    {
      id: '8', code: 'ROOM008', name: '三年级2班', school: '成都师资七中学（林荫校区）',
      grade: '三年级', studentCount: 48, location: '西教学楼三楼301', status: '在线',
      buildingId: 'west', floorId: 'west-3',
    },
  ]);

  // 根据选中的楼层过滤教室
  const classroomsByFloor = classrooms.filter((c) => c.floorId === selectedFloorId);

  const filteredClassrooms = classroomsByFloor.filter((classroom) =>
    classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classroom.code.includes(searchTerm)
  );

  const handleViewClassroom = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setViewDialogOpen(true);
  };

  const handleAddClassroom = () => {
    console.log('添加教室:', newClassroom);
    setAddDialogOpen(false);
    setNewClassroom({
      name: '', code: '', school: defaultSchool, grade: '', type: '', location: '', description: '',
      teacherVideoUrl: '', studentVideoUrl: '', whiteboardVideoUrl: '',
    });
  };

  const handleEditClassroom = (classroom: Classroom) => {
    setEditingClassroom(classroom);
    setEditForm({
      name: classroom.name, school: classroom.school,
      grade: classroom.grade, type: (classroom as any).type || '', location: classroom.location, description: '',
      teacherVideoUrl: classroom.teacherVideoUrl || '',
      studentVideoUrl: classroom.studentVideoUrl || '',
      whiteboardVideoUrl: classroom.whiteboardVideoUrl || '',
    });
    setEditDialogOpen(true);
  };

  const handleControlClassroom = (classroom: Classroom) => {
    setControllingClassroom(classroom);
    setControlDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingClassroom) return;
    setClassrooms((prev) =>
      prev.map((c) =>
        c.id === editingClassroom.id
          ? {
              ...c, name: editForm.name, school: editForm.school, grade: editForm.grade,
              location: editForm.location, description: editForm.description,
              type: editForm.type,
              teacherVideoUrl: editForm.teacherVideoUrl,
              studentVideoUrl: editForm.studentVideoUrl,
              whiteboardVideoUrl: editForm.whiteboardVideoUrl,
            }
          : c
      )
    );
    setEditDialogOpen(false);
    setEditingClassroom(null);
  };

  const toggleBuilding = (buildingId: string) => {
    setExpandedBuilding(expandedBuilding === buildingId ? '' : buildingId);
  };

  const handleAddBuilding = () => {
    if (!newBuildingName.trim()) return;
    const id = 'bld-' + Date.now().toString();
    setBuildings((prev) => [...prev, { id, name: newBuildingName.trim(), floors: [] }]);
    setNewBuildingName('');
    setAddBuildingDialogOpen(false);
  };

  const handleAddFloor = () => {
    if (!newFloorName.trim() || !addFloorTargetBuilding) return;
    const id = addFloorTargetBuilding + '-' + Date.now().toString();
    setBuildings((prev) =>
      prev.map((b) =>
        b.id === addFloorTargetBuilding
          ? { ...b, floors: [...b.floors, { id, name: newFloorName.trim() }] }
          : b
      )
    );
    setNewFloorName('');
    setAddFloorDialogOpen(false);
    setAddFloorTargetBuilding('');
  };

  const selectedBuilding = buildings.find((b) => b.floors.some((f) => f.id === selectedFloorId));
  const selectedFloor = buildings.flatMap((b) => b.floors).find((f) => f.id === selectedFloorId);

  return (
    <Box className="h-[calc(100vh-64px)] bg-gray-50 flex">
      {/* 左侧楼栋导航 */}
      <Box className="w-56 bg-white border-r border-gray-200 flex-shrink-0 overflow-auto">
        <Box className="p-4">
          <Box className="flex items-center justify-between mb-3">
            <Typography variant="subtitle1" className="font-bold text-gray-700">
              教学楼
            </Typography>
            <IconButton size="small" onClick={() => setAddBuildingDialogOpen(true)} title="添加教学楼">
              <Add fontSize="small" className="text-gray-500" />
            </IconButton>
          </Box>
          {buildings.map((building) => (
            <Box key={building.id}>
              <Box
                onClick={() => toggleBuilding(building.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer mb-1 ${
                  expandedBuilding === building.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                <IconButton size="small" className="p-0">
                  {expandedBuilding === building.id ? (
                    <ExpandMore fontSize="small" />
                  ) : (
                    <ChevronRight fontSize="small" />
                  )}
                </IconButton>
                <Business fontSize="small" />
                <Typography variant="body2" className="font-medium">
                  {building.name}
                </Typography>
                <Box className="ml-auto">
                  <IconButton size="small" className="p-0.5" onClick={(e) => { e.stopPropagation(); setAddFloorTargetBuilding(building.id); setNewFloorName(''); setAddFloorDialogOpen(true); }} title="添加楼层">
                    <Add fontSize="small" className="text-gray-400" />
                  </IconButton>
                </Box>
              </Box>
              <Collapse in={expandedBuilding === building.id}>
                <Box className="ml-4">
                  {building.floors.map((floor) => (
                    <Box
                      key={floor.id}
                      onClick={() => setSelectedFloorId(floor.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer mb-0.5 ${
                        selectedFloorId === floor.id
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Typography variant="body2">{floor.name}</Typography>
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </Box>
          ))}
        </Box>
      </Box>

      {/* 右侧内容 */}
      <Box className="flex-1 overflow-auto">
        <Box className="p-6">
          {/* 标题栏 */}
          <Box className="mb-4 flex items-center justify-between">
            <Box>
              <Typography variant="h5" className="font-bold">
                教室管理
              </Typography>
              {selectedBuilding && selectedFloor && (
                <Typography variant="body2" color="text.secondary" className="mt-1">
                  {selectedBuilding.name} / {selectedFloor.name}
                  <span className="ml-2 text-blue-600">共 {classroomsByFloor.length} 间教室</span>
                </Typography>
              )}
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddDialogOpen(true)}
            >
              添加教室
            </Button>
          </Box>

          {/* 搜索栏 */}
          <Box className="mb-4">
            <TextField
              size="small"
              placeholder="搜索教室名称或编号..."
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

          {/* 教室列表 */}
          <Box className="bg-white rounded-lg">
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow className="bg-gray-50">
                    <TableCell>编号</TableCell>
                    <TableCell>教室名称</TableCell>
                    <TableCell>所属学校</TableCell>
                    <TableCell>年级</TableCell>
                    <TableCell>学生人数</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredClassrooms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                        暂无教室数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClassrooms
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((classroom) => (
                        <TableRow key={classroom.id} hover>
                          <TableCell>{classroom.code}</TableCell>
                          <TableCell className="font-medium">{classroom.name}</TableCell>
                          <TableCell>{classroom.school}</TableCell>
                          <TableCell>{classroom.grade}</TableCell>
                          <TableCell>{classroom.studentCount}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              classroom.status === '在线' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {classroom.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Box className="flex gap-2">
                              <Button size="small" className="text-blue-600" onClick={() => handleViewClassroom(classroom)}>查看</Button>
                              <Button size="small" className="text-green-600" onClick={() => handleEditClassroom(classroom)}>编辑</Button>
                              <Button size="small" className="text-purple-600" onClick={() => handleControlClassroom(classroom)}>集控</Button>
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
              count={filteredClassrooms.length}
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
        </Box>
      </Box>

      {/* 详情弹窗 */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box className="flex items-center justify-between">
            <Typography variant="h6">教室详细信息</Typography>
            <IconButton onClick={() => setViewDialogOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedClassroom && (
            <Box className="py-2">
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box className="border-b pb-2 mb-3">
                    <Typography variant="h6" className="font-bold text-blue-600">{selectedClassroom.name}</Typography>
                    <Typography variant="caption" color="text.secondary">编号：{selectedClassroom.code}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" className="mb-1">所属学校</Typography>
                  <Typography variant="body1">{selectedClassroom.school}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" className="mb-1">年级</Typography>
                  <Typography variant="body1">{selectedClassroom.grade}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" className="mb-1">学生人数</Typography>
                  <Typography variant="body1">{selectedClassroom.studentCount} 人</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" className="mb-1">位置</Typography>
                  <Typography variant="body1">{selectedClassroom.location}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" className="mb-1">状态</Typography>
                  <Typography variant="body1">{selectedClassroom.status}</Typography>
                </Grid>
                {(selectedClassroom.teacherVideoUrl || selectedClassroom.studentVideoUrl || selectedClassroom.whiteboardVideoUrl) && (
                  <>
                    <Grid item xs={12}>
                      <Box className="border-t pt-3 mt-2">
                        <Typography variant="subtitle2" className="font-bold text-gray-700 mb-2">视频流配置</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary" className="mb-1">老师视频流地址</Typography>
                      <Typography variant="body1" className="text-sm">{selectedClassroom.teacherVideoUrl || '-'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary" className="mb-1">学生视频流地址</Typography>
                      <Typography variant="body1" className="text-sm">{selectedClassroom.studentVideoUrl || '-'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary" className="mb-1">白板视频流地址</Typography>
                      <Typography variant="body1" className="text-sm">{selectedClassroom.whiteboardVideoUrl || '-'}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* 添加教室弹窗 */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="border-b">
          <Box className="flex items-center justify-between">
            <Typography variant="h6">添加教室</Typography>
            <IconButton onClick={() => setAddDialogOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box className="py-4">
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '16px 12px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '50%' }}>
                    <Box>
                      <Typography variant="body2" className="mb-2"><span className="text-red-600">* </span>教室名称:</Typography>
                      <TextField fullWidth size="small" value={newClassroom.name}
                        onChange={(e) => setNewClassroom({ ...newClassroom, name: e.target.value })}
                        placeholder="请输入教室名称" />
                    </Box>
                  </td>
                  <td style={{ width: '50%' }}>
                    <Box>
                      <Typography variant="body2" className="mb-2"><span className="text-red-600">* </span>教室编码:</Typography>
                      <TextField fullWidth size="small" value={newClassroom.code} disabled
                        placeholder="教室编码自动生成"
                        sx={{ '& .MuiInputBase-root': { backgroundColor: '#f5f5f5' } }} />
                    </Box>
                  </td>
                </tr>
                <tr>
                  <td>
                    <Box>
                      <Typography variant="body2" className="mb-2">所属学校:</Typography>
                      <TextField fullWidth size="small" value={newClassroom.school} disabled
                        sx={{ '& .MuiInputBase-root': { backgroundColor: '#f5f5f5' } }} />
                    </Box>
                  </td>
                  <td>
                    <Box>
                      <Typography variant="body2" className="mb-2">年级:</Typography>
                      <FormControl fullWidth size="small">
                        <Select value={newClassroom.grade}
                          onChange={(e) => setNewClassroom({ ...newClassroom, grade: e.target.value })}
                          displayEmpty>
                          <MenuItem value="">一年级</MenuItem>
                          <MenuItem value="一年级">一年级</MenuItem>
                          <MenuItem value="二年级">二年级</MenuItem>
                          <MenuItem value="三年级">三年级</MenuItem>
                          <MenuItem value="四年级">四年级</MenuItem>
                          <MenuItem value="五年级">五年级</MenuItem>
                          <MenuItem value="六年级">六年级</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </td>
                </tr>
                <tr>
                  <td>
                    <Box>
                      <Typography variant="body2" className="mb-2">位置:</Typography>
                      <TextField fullWidth size="small" value={newClassroom.location}
                        onChange={(e) => setNewClassroom({ ...newClassroom, location: e.target.value })}
                        placeholder="请输入教室位置" />
                    </Box>
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <Box>
                      <Typography variant="body2" className="mb-2">教室类型:</Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={newClassroom.type}
                          onChange={(e) => setNewClassroom({ ...newClassroom, type: e.target.value })}
                          displayEmpty
                        >
                          <MenuItem value="">
                            <Typography variant="body2" color="text.secondary">请选择教室类型</Typography>
                          </MenuItem>
                          <MenuItem value="听评课教室">听评课教室</MenuItem>
                          <MenuItem value="常规授课教室">常规授课教室</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <Box>
                      <Typography variant="body2" className="mb-2">教室描述:</Typography>
                      <TextField fullWidth size="small" multiline rows={4}
                        value={newClassroom.description}
                        onChange={(e) => setNewClassroom({ ...newClassroom, description: e.target.value })}
                        placeholder="输入内容" />
                    </Box>
                  </td>
                </tr>
                {newClassroom.type === '听评课教室' && (
                  <>
                    <tr>
                      <td colSpan={2}>
                        <Typography variant="subtitle2" className="font-bold text-gray-700 mb-2">视频流配置</Typography>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Box>
                          <Typography variant="body2" className="mb-2">老师视频流地址:</Typography>
                          <TextField fullWidth size="small" value={newClassroom.teacherVideoUrl}
                            onChange={(e) => setNewClassroom({ ...newClassroom, teacherVideoUrl: e.target.value })}
                            placeholder="rtmp://example.com/teacher" />
                        </Box>
                      </td>
                      <td>
                        <Box>
                          <Typography variant="body2" className="mb-2">学生视频流地址:</Typography>
                          <TextField fullWidth size="small" value={newClassroom.studentVideoUrl}
                            onChange={(e) => setNewClassroom({ ...newClassroom, studentVideoUrl: e.target.value })}
                            placeholder="rtmp://example.com/student" />
                        </Box>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <Box>
                          <Typography variant="body2" className="mb-2">白板视频流地址:</Typography>
                          <TextField fullWidth size="small" value={newClassroom.whiteboardVideoUrl}
                            onChange={(e) => setNewClassroom({ ...newClassroom, whiteboardVideoUrl: e.target.value })}
                            placeholder="rtmp://example.com/whiteboard" />
                        </Box>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setAddDialogOpen(false)} variant="outlined">取消</Button>
          <Button onClick={handleAddClassroom} variant="contained" disabled={!newClassroom.name}>确定</Button>
        </DialogActions>
      </Dialog>

      {/* 编辑教室弹窗 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="border-b">
          <Box className="flex items-center justify-between">
            <Typography variant="h6">编辑教室</Typography>
            <IconButton onClick={() => setEditDialogOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box className="py-4">
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '16px 12px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '50%' }}>
                    <Box>
                      <Typography variant="body2" className="mb-2"><span className="text-red-600">* </span>教室名称:</Typography>
                      <TextField fullWidth size="small" value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="请输入教室名称" />
                    </Box>
                  </td>
                  <td style={{ width: '50%' }}>
                    <Box>
                      <Typography variant="body2" className="mb-2">教室编码:</Typography>
                      <TextField fullWidth size="small" value={editingClassroom?.code ?? ''} disabled
                        sx={{ '& .MuiInputBase-root': { backgroundColor: '#f5f5f5' } }} />
                    </Box>
                  </td>
                </tr>
                <tr>
                  <td>
                    <Box>
                      <Typography variant="body2" className="mb-2">所属学校:</Typography>
                      <TextField fullWidth size="small" value={editForm.school}
                        onChange={(e) => setEditForm({ ...editForm, school: e.target.value })} />
                    </Box>
                  </td>
                  <td>
                    <Box>
                      <Typography variant="body2" className="mb-2">年级:</Typography>
                      <FormControl fullWidth size="small">
                        <Select value={editForm.grade}
                          onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
                          displayEmpty>
                          <MenuItem value="">一年级</MenuItem>
                          <MenuItem value="一年级">一年级</MenuItem>
                          <MenuItem value="二年级">二年级</MenuItem>
                          <MenuItem value="三年级">三年级</MenuItem>
                          <MenuItem value="四年级">四年级</MenuItem>
                          <MenuItem value="五年级">五年级</MenuItem>
                          <MenuItem value="六年级">六年级</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </td>
                </tr>
                <tr>
                  <td>
                    <Box>
                      <Typography variant="body2" className="mb-2">位置:</Typography>
                      <TextField fullWidth size="small" value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        placeholder="请输入教室位置" />
                    </Box>
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <Box>
                      <Typography variant="body2" className="mb-2">教室类型:</Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={editForm.type}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                          displayEmpty
                        >
                          <MenuItem value="">
                            <Typography variant="body2" color="text.secondary">请选择教室类型</Typography>
                          </MenuItem>
                          <MenuItem value="听评课教室">听评课教室</MenuItem>
                          <MenuItem value="常规授课教室">常规授课教室</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <Box>
                      <Typography variant="body2" className="mb-2">教室描述:</Typography>
                      <TextField fullWidth size="small" multiline rows={4}
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="输入内容" />
                    </Box>
                  </td>
                </tr>
                {editForm.type === '听评课教室' && (
                  <>
                    <tr>
                      <td colSpan={2}>
                        <Typography variant="subtitle2" className="font-bold text-gray-700 mb-2">视频流配置</Typography>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Box>
                          <Typography variant="body2" className="mb-2">老师视频流地址:</Typography>
                          <TextField fullWidth size="small" value={editForm.teacherVideoUrl}
                            onChange={(e) => setEditForm({ ...editForm, teacherVideoUrl: e.target.value })}
                            placeholder="rtmp://example.com/teacher" />
                        </Box>
                      </td>
                      <td>
                        <Box>
                          <Typography variant="body2" className="mb-2">学生视频流地址:</Typography>
                          <TextField fullWidth size="small" value={editForm.studentVideoUrl}
                            onChange={(e) => setEditForm({ ...editForm, studentVideoUrl: e.target.value })}
                            placeholder="rtmp://example.com/student" />
                        </Box>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <Box>
                          <Typography variant="body2" className="mb-2">白板视频流地址:</Typography>
                          <TextField fullWidth size="small" value={editForm.whiteboardVideoUrl}
                            onChange={(e) => setEditForm({ ...editForm, whiteboardVideoUrl: e.target.value })}
                            placeholder="rtmp://example.com/whiteboard" />
                        </Box>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setEditDialogOpen(false)} variant="outlined">取消</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={!editForm.name}>保存</Button>
        </DialogActions>
      </Dialog>

      {/* 集控弹窗 */}
      {controllingClassroom && (
        <ClassroomControl
          open={controlDialogOpen}
          onClose={() => setControlDialogOpen(false)}
          classroom={{ name: controllingClassroom.name, code: controllingClassroom.code }}
        />
      )}

      {/* 添加教学楼弹窗 */}
      <Dialog open={addBuildingDialogOpen} onClose={() => setAddBuildingDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>添加教学楼</DialogTitle>
        <DialogContent>
          <Box className="pt-2">
            <TextField fullWidth size="small" label="教学楼名称" value={newBuildingName}
              onChange={(e) => setNewBuildingName(e.target.value)}
              placeholder="请输入教学楼名称" autoFocus />
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setAddBuildingDialogOpen(false)} variant="outlined">取消</Button>
          <Button onClick={handleAddBuilding} variant="contained" disabled={!newBuildingName.trim()}>确定</Button>
        </DialogActions>
      </Dialog>

      {/* 添加楼层弹窗 */}
      <Dialog open={addFloorDialogOpen} onClose={() => setAddFloorDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>添加楼层</DialogTitle>
        <DialogContent>
          <Box className="pt-2">
            <TextField fullWidth size="small" label="楼层名称" value={newFloorName}
              onChange={(e) => setNewFloorName(e.target.value)}
              placeholder="例如：一楼、二楼" autoFocus />
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setAddFloorDialogOpen(false)} variant="outlined">取消</Button>
          <Button onClick={handleAddFloor} variant="contained" disabled={!newFloorName.trim()}>确定</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
