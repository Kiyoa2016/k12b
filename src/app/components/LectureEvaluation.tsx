import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Chip,
  Rating,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Divider,
} from '@mui/material';
import {
  Add,
  Close,
  Visibility,
  EditNote,
  School,
  Upload,
  Description,
  Slideshow,
  PersonAdd,
  Videocam,
  StarBorder,
} from '@mui/icons-material';
import ScoringDialog from './ScoringDialog';

export interface Lecture {
  id: string;
  courseName: string;
  teacher: string;
  className: string;
  date: string;
  time: string;
  classroom: string;
  grade: string;
  subject: string;
  evaluationForm: string;
  evaluator: string;
  observers: string[];
  status: '待评' | '已评';
  score?: number;
  comment?: string;
}

type RoomStatus = 'not_started' | 'live' | 'recorded';

function getRoomStatus(date: string, time: string): RoomStatus {
  const lectureTime = new Date(`${date}T${time}`).getTime();
  const now = Date.now();
  const diff = lectureTime - now;
  const classDuration = 45 * 60 * 1000;
  if (diff > 0) return 'not_started';
  if (diff > -classDuration) return 'live';
  return 'recorded';
}

const roomStatusConfig: Record<RoomStatus, { label: string; color: 'default' | 'success' | 'warning' }> = {
  not_started: { label: '未开始', color: 'default' },
  live: { label: '进行中', color: 'success' },
  recorded: { label: '已结束', color: 'warning' },
};

interface NewLectureForm {
  courseName: string;
  className: string;
  date: string;
  time: string;
  endTime: string;
  classroom: string;
  grade: string;
  subject: string;
  evaluationForm: string;
  courseware: string;
  lessonPlan: string;
  localFiles: string[];
  evaluator: string;
  observers: string[];
}

const evaluationForms = [
  '课堂教学评价表（常规）',
  '课堂教学评价表（优质课）',
  '课堂教学评价表（新教师）',
  '课堂教学评价表（实验课）',
];

const gradeOptions = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三', '高一', '高二', '高三'];
const subjectOptions = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '音乐', '美术', '体育', '信息技术'];
const teacherOptions = ['张老师', '李老师', '王老师', '陈老师', '刘老师', '赵老师', '周老师', '吴老师'];

const initialNewLecture: NewLectureForm = {
  courseName: '', className: '', date: '', time: '', endTime: '', classroom: '',
  grade: '', subject: '', evaluationForm: '',
  courseware: '', lessonPlan: '', localFiles: [],
  evaluator: '', observers: [],
};

const defaultLectures: Lecture[] = [
  { id: '1', courseName: '数学 - 函数与极限', teacher: '张老师', className: '高一（1）班', date: '2026-05-12', time: '09:00', classroom: '东教学楼 201', grade: '高一', subject: '数学', evaluationForm: '课堂教学评价表（常规）', evaluator: '李老师', observers: ['王老师', '陈老师'], status: '已评', score: 92, comment: '讲解清晰，互动充分' },
  { id: '2', courseName: '语文 - 古诗词鉴赏', teacher: '李老师', className: '高一（2）班', date: '2026-05-20', time: '10:00', classroom: '东教学楼 202', grade: '高一', subject: '语文', evaluationForm: '课堂教学评价表（优质课）', evaluator: '张老师', observers: ['刘老师'], status: '待评' },
  { id: '3', courseName: '英语 - 语法基础', teacher: '王老师', className: '高二（1）班', date: '2026-05-17', time: '21:00', classroom: '西教学楼 101', grade: '高二', subject: '英语', evaluationForm: '课堂教学评价表（常规）', evaluator: '陈老师', observers: ['赵老师', '周老师'], status: '已评', score: 88, comment: '课堂氛围好' },
  { id: '4', courseName: '物理 - 力学实验', teacher: '陈老师', className: '高二（3）班', date: '2026-05-17', time: '09:30', classroom: '实验楼 301', grade: '高二', subject: '物理', evaluationForm: '课堂教学评价表（实验课）', evaluator: '张老师', observers: ['刘老师', '王老师'], status: '待评' },
  { id: '5', courseName: '化学 - 元素周期表', teacher: '刘老师', className: '高一（4）班', date: '2026-05-16', time: '15:00', classroom: '实验楼 302', grade: '高一', subject: '化学', evaluationForm: '课堂教学评价表（新教师）', evaluator: '李老师', observers: ['赵老师'], status: '待评' },
];

const defaultMyLectures: Lecture[] = [
  { id: 'm1', courseName: '数学 - 概率论基础', teacher: '我', className: '高二（2）班', date: '2026-05-10', time: '08:00', classroom: '东教学楼 301', grade: '高二', subject: '数学', evaluationForm: '课堂教学评价表（常规）', evaluator: '王老师', observers: ['陈老师', '刘老师'], status: '已评', score: 90, comment: '重点突出' },
  { id: 'm2', courseName: '数学 - 数列与级数', teacher: '我', className: '高二（1）班', date: '2026-05-17', time: '09:00', classroom: '东教学楼 302', grade: '高二', subject: '数学', evaluationForm: '课堂教学评价表（常规）', evaluator: '李老师', observers: ['张老师'], status: '待评' },
  { id: 'm3', courseName: '数学 - 立体几何', teacher: '我', className: '高一（3）班', date: '2026-05-20', time: '10:30', classroom: '西教学楼 201', grade: '高一', subject: '数学', evaluationForm: '课堂教学评价表（优质课）', evaluator: '陈老师', observers: ['王老师', '赵老师', '周老师'], status: '待评' },
];

interface Props {
  onOpenDetail: (lecture: Lecture, videoMode: 'live' | 'recorded') => void;
}

export default function LectureEvaluation({ onOpenDetail }: Props) {
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [lectures, setLectures] = useState(defaultLectures);
  const [myLectures, setMyLectures] = useState(defaultMyLectures);
  const [newLecture, setNewLecture] = useState<NewLectureForm>(initialNewLecture);
  const [videoUploadOpen, setVideoUploadOpen] = useState(false);
  const [videoUploadLecture, setVideoUploadLecture] = useState<Lecture | null>(null);
  const [uploadedVideos, setUploadedVideos] = useState<{ teacher: string; student: string; whiteboard: string }>({
    teacher: '',
    student: '',
    whiteboard: '',
  });
  const [scoringOpen, setScoringOpen] = useState(false);
  const [scoringLecture, setScoringLecture] = useState<Lecture | null>(null);
  const [scoringReadOnly, setScoringReadOnly] = useState(false);
  const [scoringRecords, setScoringRecords] = useState<Record<string, Record<string, number>>>({});

  const currentData = tabValue === 0 ? myLectures : lectures;

  const handleAdd = () => {
    console.log('添加听评课:', newLecture);
    setAddDialogOpen(false);
    setNewLecture(initialNewLecture);
  };

  const handleView = (lecture: Lecture, videoMode?: 'live' | 'recorded') => {
    onOpenDetail(lecture, videoMode || 'live');
  };

  const handleVideoUploadOpen = (lecture: Lecture) => {
    setVideoUploadLecture(lecture);
    setUploadedVideos({ teacher: '', student: '', whiteboard: '' });
    setVideoUploadOpen(true);
  };

  const handleVideoFileSelect = (type: 'teacher' | 'student' | 'whiteboard', fileName: string) => {
    setUploadedVideos((prev) => ({ ...prev, [type]: fileName }));
  };

  const handleScoringOpen = (lecture: Lecture) => {
    setScoringLecture(lecture);
    setScoringReadOnly(false);
    setScoringOpen(true);
  };

  const handleViewScore = (lecture: Lecture) => {
    setScoringLecture(lecture);
    setScoringReadOnly(true);
    setScoringOpen(true);
  };

  const handleScoringSubmit = (lectureId: string, scores: Record<string, number>) => {
    const total = Object.values(scores).reduce((sum, s) => sum + s, 0);
    setScoringRecords((prev) => ({ ...prev, [lectureId]: scores }));
    setLectures((prev) =>
      prev.map((l) =>
        l.id === lectureId ? { ...l, score: total, status: '已评' as const } : l
      )
    );
    setScoringOpen(false);
    setScoringLecture(null);
  };

  return (
    <Box className="p-6">
      {/* 标题栏 */}
      <Box className="mb-6 flex items-center justify-between">
        <Box>
          <Typography variant="h5" className="font-bold">
            听评课
          </Typography>
          <Typography variant="body2" color="text.secondary" className="mt-1">
            管理听课与评课记录
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddDialogOpen(true)}
        >
          添加听评课
        </Button>
      </Box>

      {/* 页签 */}
      <Box className="border-b border-gray-200 mb-4">
        <Tabs
          value={tabValue}
          onChange={(e, v) => { setTabValue(v); setPage(0); }}
          sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: '0.95rem' } }}
        >
          <Tab label="我的讲课" icon={<School />} iconPosition="start" />
          <Tab label="我的评课" icon={<EditNote />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* 表格 */}
      <Box className="bg-white rounded-lg">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow className="bg-gray-50">
                {tabValue === 0 ? (
                  <>
                    <TableCell>课程名称</TableCell>
                    <TableCell>时间</TableCell>
                    <TableCell>教室</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>课程名称</TableCell>
                    <TableCell>评课老师</TableCell>
                    <TableCell>班级</TableCell>
                    <TableCell>教室</TableCell>
                    <TableCell>日期</TableCell>
                    <TableCell>上课时间</TableCell>
                    <TableCell>评课状态</TableCell>
                    <TableCell>评分</TableCell>
                  </>
                )}
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tabValue === 0 ? 4 : 9} className="text-center py-8 text-gray-400">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                currentData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((lecture) => (
                    <TableRow key={lecture.id} hover>
                      {tabValue === 0 ? (
                        <>
                          <TableCell className="font-medium">{lecture.courseName}</TableCell>
                          <TableCell>{lecture.date} {lecture.time}</TableCell>
                          <TableCell>{lecture.classroom}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-medium">{lecture.courseName}</TableCell>
                          <TableCell>{lecture.evaluator}</TableCell>
                          <TableCell>{lecture.className}</TableCell>
                          <TableCell>{lecture.classroom}</TableCell>
                          <TableCell>{lecture.date}</TableCell>
                          <TableCell>{lecture.time}</TableCell>
                          <TableCell>
                            {(() => {
                              const rs = getRoomStatus(lecture.date, lecture.time);
                              return (
                                <Chip label={roomStatusConfig[rs].label} size="small"
                                  color={roomStatusConfig[rs].color} variant="outlined" />
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            {lecture.score ? (
                              <Box className="flex items-center gap-1">
                                <Rating value={lecture.score / 20} readOnly size="small" precision={0.5} />
                                <Typography
                                  variant="caption"
                                  className="text-blue-600 cursor-pointer hover:underline"
                                  onClick={() => handleViewScore(lecture)}
                                >
                                  {lecture.score}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <Box className="flex gap-2">
                          {(() => {
                            const rs = tabValue === 1 ? getRoomStatus(lecture.date, lecture.time) : null;
                            const isLive = rs === 'live';
                            const isRecorded = rs === 'recorded';
                            const isNotStarted = rs === 'not_started';
                            return (
                              <>
                                <Button size="small" className="text-blue-600" onClick={() => handleView(lecture, isRecorded ? 'recorded' : 'live')} startIcon={<Visibility />} disabled={isNotStarted} sx={{ display: isNotStarted ? 'none' : undefined }}>
                                  {isRecorded ? '回看' : isLive ? '进入评课' : '查看'}
                                </Button>
                                {tabValue === 0 && (
                                  <Button size="small" className="text-purple-600" onClick={() => handleVideoUploadOpen(lecture)} startIcon={<Videocam />}>
                                    上传视频
                                  </Button>
                                )}
                                {tabValue === 1 && lecture.status === '待评' && !isNotStarted && (
                                  <Button size="small" className="text-orange-600" onClick={() => handleScoringOpen(lecture)} startIcon={<StarBorder />}>
                                    评分
                                  </Button>
                                )}
                              </>
                            );
                          })()}
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
          count={currentData.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="每页行数："
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count}`}
        />
      </Box>

      {/* 添加弹窗 */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="border-b">
          <Box className="flex items-center justify-between">
            <Typography variant="h6">添加听评课</Typography>
            <IconButton onClick={() => setAddDialogOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box className="py-4 flex flex-col gap-5">
            {/* 基本信息 */}
            <Box>
              <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-3">基本信息</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="课程名称" value={newLecture.courseName}
                    onChange={(e) => setNewLecture({ ...newLecture, courseName: e.target.value })}
                    placeholder="请输入课程名称" />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>年级</InputLabel>
                    <Select value={newLecture.grade} label="年级"
                      onChange={(e) => setNewLecture({ ...newLecture, grade: e.target.value })}>
                      {gradeOptions.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>学科</InputLabel>
                    <Select value={newLecture.subject} label="学科"
                      onChange={(e) => setNewLecture({ ...newLecture, subject: e.target.value })}>
                      {subjectOptions.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="班级" value={newLecture.className}
                    onChange={(e) => setNewLecture({ ...newLecture, className: e.target.value })}
                    placeholder="例如：高一（1）班" />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="上课教室" value={newLecture.classroom}
                    onChange={(e) => setNewLecture({ ...newLecture, classroom: e.target.value })}
                    placeholder="例如：东教学楼 201" />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="上课日期" type="date" value={newLecture.date}
                    onChange={(e) => setNewLecture({ ...newLecture, date: e.target.value })}
                    InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="上课时间" type="time" value={newLecture.time}
                    onChange={(e) => {
                      const t = e.target.value;
                      if (t) {
                        const [h, m] = t.split(':').map(Number);
                        const totalMin = h * 60 + m + 45;
                        const endH = Math.floor(totalMin / 60) % 24;
                        const endM = totalMin % 60;
                        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                        setNewLecture({ ...newLecture, time: t, endTime });
                      } else {
                        setNewLecture({ ...newLecture, time: t, endTime: '' });
                      }
                    }}
                    InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="上课结束时间" type="time" value={newLecture.endTime}
                    onChange={(e) => setNewLecture({ ...newLecture, endTime: e.target.value })}
                    InputLabelProps={{ shrink: true }} />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* 评课配置 */}
            <Box>
              <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-3">评课配置</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>评课表</InputLabel>
                    <Select value={newLecture.evaluationForm} label="评课表"
                      onChange={(e) => setNewLecture({ ...newLecture, evaluationForm: e.target.value })}>
                      {evaluationForms.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>评课老师</InputLabel>
                    <Select value={newLecture.evaluator} label="评课老师"
                      onChange={(e) => setNewLecture({ ...newLecture, evaluator: e.target.value })}>
                      {teacherOptions.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={teacherOptions}
                    value={newLecture.observers}
                    onChange={(e, val) => setNewLecture({ ...newLecture, observers: val })}
                    renderInput={(params) => (
                      <TextField {...params} label="听课老师" placeholder="选择听课老师" />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip label={option} size="small" {...getTagProps({ index })} key={option} />
                      ))
                    }
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* 课程资料 */}
            <Box>
              <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-3">课程资料</Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Slideshow />}
                    className="h-20 flex-col gap-1"
                    sx={{ textTransform: 'none' }}
                  >
                    <Typography variant="caption">课件</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {newLecture.courseware || '未选择'}
                    </Typography>
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Description />}
                    className="h-20 flex-col gap-1"
                    sx={{ textTransform: 'none' }}
                  >
                    <Typography variant="caption">教案</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {newLecture.lessonPlan || '未选择'}
                    </Typography>
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    component="label"
                    startIcon={<Upload />}
                    className="h-20 flex-col gap-1"
                    sx={{ textTransform: 'none' }}
                  >
                    <Typography variant="caption">本地文件</Typography>
                    <Typography variant="caption" color="text.secondary">点击上传</Typography>
                    <input type="file" hidden multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []).map((f) => f.name);
                        setNewLecture({ ...newLecture, localFiles: [...newLecture.localFiles, ...files] });
                      }} />
                  </Button>
                </Grid>
                {newLecture.localFiles.length > 0 && (
                  <Grid item xs={12}>
                    <Box className="flex flex-wrap gap-1">
                      {newLecture.localFiles.map((file, i) => (
                        <Chip key={i} label={file} size="small" variant="outlined"
                          onDelete={() => setNewLecture({
                            ...newLecture,
                            localFiles: newLecture.localFiles.filter((_, j) => j !== i),
                          })} />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => { setAddDialogOpen(false); setNewLecture(initialNewLecture); }} variant="outlined">取消</Button>
          <Button onClick={handleAdd} variant="contained" disabled={!newLecture.courseName}>确定</Button>
        </DialogActions>
      </Dialog>

      {/* 视频上传弹窗 */}
      <Dialog open={videoUploadOpen} onClose={() => setVideoUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="border-b">
          <Box className="flex items-center justify-between">
            <Box className="flex items-center gap-2">
              <Videocam className="text-purple-600" />
              <Typography variant="h6">上传教学视频</Typography>
            </Box>
            <IconButton onClick={() => setVideoUploadOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {videoUploadLecture && (
            <Box className="py-4 flex flex-col gap-6">
              <Typography variant="body2" className="text-gray-500">
                课程：{videoUploadLecture.courseName}
              </Typography>

              {/* 老师视频 */}
              <Box>
                <Typography variant="subtitle2" className="font-semibold mb-2 flex items-center gap-1">
                  <Videocam fontSize="small" className="text-blue-500" />
                  老师画面
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  className={`h-16 justify-start px-4 gap-3 ${uploadedVideos.teacher ? 'border-blue-400 bg-blue-50' : ''}`}
                  sx={{ textTransform: 'none', borderStyle: uploadedVideos.teacher ? 'solid' : 'dashed' }}
                >
                  <Upload className={uploadedVideos.teacher ? 'text-blue-600' : 'text-gray-400'} />
                  <Box className="text-left">
                    <Typography variant="body2" className={uploadedVideos.teacher ? 'text-blue-700 font-medium' : 'text-gray-500'}>
                      {uploadedVideos.teacher || '点击选择老师视频文件'}
                    </Typography>
                  </Box>
                  <input type="file" hidden accept="video/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleVideoFileSelect('teacher', file.name);
                  }} />
                </Button>
              </Box>

              {/* 学生视频 */}
              <Box>
                <Typography variant="subtitle2" className="font-semibold mb-2 flex items-center gap-1">
                  <Videocam fontSize="small" className="text-green-500" />
                  学生画面
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  className={`h-16 justify-start px-4 gap-3 ${uploadedVideos.student ? 'border-green-400 bg-green-50' : ''}`}
                  sx={{ textTransform: 'none', borderStyle: uploadedVideos.student ? 'solid' : 'dashed' }}
                >
                  <Upload className={uploadedVideos.student ? 'text-green-600' : 'text-gray-400'} />
                  <Box className="text-left">
                    <Typography variant="body2" className={uploadedVideos.student ? 'text-green-700 font-medium' : 'text-gray-500'}>
                      {uploadedVideos.student || '点击选择学生视频文件'}
                    </Typography>
                  </Box>
                  <input type="file" hidden accept="video/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleVideoFileSelect('student', file.name);
                  }} />
                </Button>
              </Box>

              {/* 白板视频 */}
              <Box>
                <Typography variant="subtitle2" className="font-semibold mb-2 flex items-center gap-1">
                  <Videocam fontSize="small" className="text-orange-500" />
                  白板画面
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  className={`h-16 justify-start px-4 gap-3 ${uploadedVideos.whiteboard ? 'border-orange-400 bg-orange-50' : ''}`}
                  sx={{ textTransform: 'none', borderStyle: uploadedVideos.whiteboard ? 'solid' : 'dashed' }}
                >
                  <Upload className={uploadedVideos.whiteboard ? 'text-orange-600' : 'text-gray-400'} />
                  <Box className="text-left">
                    <Typography variant="body2" className={uploadedVideos.whiteboard ? 'text-orange-700 font-medium' : 'text-gray-500'}>
                      {uploadedVideos.whiteboard || '点击选择白板视频文件'}
                    </Typography>
                  </Box>
                  <input type="file" hidden accept="video/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleVideoFileSelect('whiteboard', file.name);
                  }} />
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setVideoUploadOpen(false)} variant="outlined">取消</Button>
          <Button
            onClick={() => {
              console.log('上传视频:', { lecture: videoUploadLecture, videos: uploadedVideos });
              setVideoUploadOpen(false);
            }}
            variant="contained"
            disabled={!uploadedVideos.teacher && !uploadedVideos.student && !uploadedVideos.whiteboard}
          >
            确定上传
          </Button>
        </DialogActions>
      </Dialog>

      {/* 评分弹窗 */}
      <ScoringDialog
        open={scoringOpen}
        lecture={scoringLecture}
        readOnly={scoringReadOnly}
        initialScores={scoringLecture ? scoringRecords[scoringLecture.id] || {} : {}}
        onClose={() => { setScoringOpen(false); setScoringLecture(null); }}
        onSubmit={handleScoringSubmit}
      />
    </Box>
  );
}
