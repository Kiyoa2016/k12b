import { useState } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, Chip,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, FormControl, InputLabel, Select, MenuItem,
  Menu, ListItemIcon, ListItemText,
} from '@mui/material';
import {
  Videocam, Add, Close, Upload, Search, AccessTime, CloudUpload,
  ArrowDropDown, School, DescriptionOutlined, PlayArrow,
} from '@mui/icons-material';

export interface CloudVideo {
  id: string;
  title: string;
  subject: string;
  grade: string;
  teacher: string;
  duration: string;
  uploadDate: string;
  description?: string;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewVideo {
  id: string;
  title: string;
  subject: string;
  grade: string;
  teacher: string;
  duration: string;
  uploadDate: string;
  status: ReviewStatus;
  reviewNote?: string;
  description?: string;
}

const subjectOptions = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];
const stageOptions = ['小学', '初中', '高中'];
const gradeOptions: Record<string, string[]> = {
  '小学': ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
  '初中': ['初一', '初二', '初三'],
  '高中': ['高一', '高二', '高三'],
};
const allGrades = Object.values(gradeOptions).flat();
const stageLabels: Record<string, string> = { '小学': '小学', '初中': '初中', '高中': '高中' };

function getStage(grade: string): string {
  for (const [stage, grades] of Object.entries(gradeOptions)) {
    if (grades.includes(grade)) return stage;
  }
  return '高中';
}

const defaultVideos: CloudVideo[] = [
  { id: '1', title: '函数与极限', subject: '数学', grade: '高一', teacher: '张老师', duration: '45:00', uploadDate: '2026-05-10', description: '本课程介绍函数的基本概念、极限的定义与性质，以及常见的极限计算方法。' },
  { id: '2', title: '古诗词鉴赏', subject: '语文', grade: '高一', teacher: '李老师', duration: '40:00', uploadDate: '2026-05-11', description: '赏析中国古代经典诗词，理解诗词的意境与表达技巧。' },
  { id: '3', title: '语法基础', subject: '英语', grade: '高二', teacher: '王老师', duration: '45:00', uploadDate: '2026-05-12', description: '系统讲解英语语法基础知识，包括时态、语态、从句等核心内容。' },
  { id: '4', title: '力学实验', subject: '物理', grade: '高二', teacher: '陈老师', duration: '50:00', uploadDate: '2026-05-13', description: '通过实验演示牛顿力学定律，帮助学生理解力与运动的关系。' },
  { id: '5', title: '元素周期表', subject: '化学', grade: '高一', teacher: '刘老师', duration: '45:00', uploadDate: '2026-05-14', description: '系统学习元素周期表的排列规律、元素性质递变规律及其应用。' },
  { id: '6', title: '细胞结构', subject: '生物', grade: '初一', teacher: '赵老师', duration: '40:00', uploadDate: '2026-05-15', description: '介绍植物细胞和动物细胞的基本结构及其功能。' },
  { id: '7', title: '辛亥革命', subject: '历史', grade: '初二', teacher: '周老师', duration: '45:00', uploadDate: '2026-05-16', description: '讲述辛亥革命的背景、经过及其在中国历史上的重要意义。' },
  { id: '8', title: '大气环流', subject: '地理', grade: '高二', teacher: '吴老师', duration: '45:00', uploadDate: '2026-05-17', description: '讲解全球大气环流的基本模式、形成原因及其对气候的影响。' },
];

const gradeColors: Record<string, string> = {
  '初一': 'bg-cyan-100 text-cyan-700', '初二': 'bg-cyan-100 text-cyan-700', '初三': 'bg-cyan-100 text-cyan-700',
  '高一': 'bg-blue-100 text-blue-700', '高二': 'bg-blue-100 text-blue-700', '高三': 'bg-blue-100 text-blue-700',
};

const subjectGradients: Record<string, string> = {
  '语文': 'from-red-100 to-red-50', '数学': 'from-blue-100 to-blue-50',
  '英语': 'from-yellow-100 to-yellow-50', '物理': 'from-purple-100 to-purple-50',
  '化学': 'from-green-100 to-green-50', '生物': 'from-emerald-100 to-emerald-50',
  '历史': 'from-orange-100 to-orange-50', '地理': 'from-teal-100 to-teal-50',
  '政治': 'from-rose-100 to-rose-50',
};

const subjectIcons: Record<string, string> = {
  '语文': '文', '数学': '数', '英语': '英', '物理': '物', '化学': '化',
  '生物': '生', '历史': '史', '地理': '地', '政治': '政',
};

interface MicroLesson {
  id: string;
  title: string;
  subject: string;
  grade: string;
  teacher: string;
  duration: string;
}

const microLessons: MicroLesson[] = [
  { id: 'm1', title: '二次函数图像与性质', subject: '数学', grade: '高一', teacher: '我', duration: '15:30' },
  { id: 'm2', title: '文言文虚词用法', subject: '语文', grade: '高二', teacher: '我', duration: '12:00' },
  { id: 'm3', title: '现在完成时讲解', subject: '英语', grade: '初三', teacher: '我', duration: '18:20' },
  { id: 'm4', title: '牛顿第二定律实验', subject: '物理', grade: '高二', teacher: '我', duration: '20:00' },
  { id: 'm5', title: '氧化还原反应', subject: '化学', grade: '高一', teacher: '我', duration: '14:45' },
];

interface Props {
  onOpenPlay: (video: CloudVideo, relatedVideos: CloudVideo[]) => void;
}

export default function CloudClassroom({ onOpenPlay }: Props) {
  const [videos, setVideos] = useState(defaultVideos);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', subject: '', grade: '', teacher: '我', description: '' });
  const [microOpen, setMicroOpen] = useState(false);

  const filteredVideos = videos.filter((v) => {
    if (selectedSubject && v.subject !== selectedSubject) return false;
    if (selectedStage && getStage(v.grade) !== selectedStage) return false;
    if (selectedGrade && v.grade !== selectedGrade) return false;
    if (searchTerm && !v.title.includes(searchTerm) && !v.teacher.includes(searchTerm)) return false;
    return true;
  });

  const availableGrades = selectedStage ? gradeOptions[selectedStage] : allGrades;

  const handleUploadSubmit = () => {
    if (!uploadForm.title || !uploadForm.subject || !uploadForm.grade) return;
    const newVideo: CloudVideo = {
      id: Date.now().toString(),
      title: uploadForm.title,
      subject: uploadForm.subject,
      grade: uploadForm.grade,
      teacher: uploadForm.teacher || '未知',
      duration: '00:00',
      uploadDate: new Date().toISOString().split('T')[0],
      description: uploadForm.description,
    };
    setVideos((prev) => [newVideo, ...prev]);
    setUploadOpen(false);
    setUploadForm({ title: '', subject: '', grade: '', teacher: '我', description: '' });
  };

  const handleMicroSelect = (lesson: MicroLesson) => {
    const newVideo: CloudVideo = {
      id: Date.now().toString(),
      title: lesson.title,
      subject: lesson.subject,
      grade: lesson.grade,
      teacher: lesson.teacher,
      duration: lesson.duration,
      uploadDate: new Date().toISOString().split('T')[0],
      description: `微课堂录制 - ${lesson.title}`,
    };
    setVideos((prev) => [newVideo, ...prev]);
    setMicroOpen(false);
  };

  return (
    <Box className="p-6">
      {/* 标题栏 */}
      <Box className="mb-6 flex items-center justify-between">
        <Box>
          <Typography variant="h5" className="font-bold">云课堂</Typography>
          <Typography variant="body2" color="text.secondary" className="mt-1">
            点播观看课程视频
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            endIcon={<ArrowDropDown />}
            onClick={(e) => setMenuAnchor(e.currentTarget)}
          >
            上传视频
          </Button>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => { setMenuAnchor(null); setMicroOpen(true); }}>
              <ListItemIcon><School fontSize="small" /></ListItemIcon>
              <ListItemText primary="微课堂" secondary="选择已录制的微课" />
            </MenuItem>
            <MenuItem onClick={() => { setMenuAnchor(null); setUploadOpen(true); }}>
              <ListItemIcon><DescriptionOutlined fontSize="small" /></ListItemIcon>
              <ListItemText primary="本地文件" secondary="从本地上传视频文件" />
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* 筛选栏 */}
      <Box className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <Box className="flex gap-2 flex-wrap items-center">
          <Typography variant="caption" color="text.secondary" className="mr-1">学科：</Typography>
          <Chip label="全部" size="small" onClick={() => setSelectedSubject(null)}
            color={selectedSubject === null ? 'primary' : 'default'}
            variant={selectedSubject === null ? 'filled' : 'outlined'} />
          {subjectOptions.map((s) => (
            <Chip key={s} label={s} size="small" onClick={() => setSelectedSubject(s)}
              color={selectedSubject === s ? 'primary' : 'default'}
              variant={selectedSubject === s ? 'filled' : 'outlined'} />
          ))}
        </Box>
      </Box>
      <Box className="mb-3 flex flex-wrap items-center gap-2">
          <Typography variant="caption" color="text.secondary">学段：</Typography>
          <Chip label="全部" size="small" onClick={() => { setSelectedStage(null); setSelectedGrade(null); }}
            color={selectedStage === null ? 'primary' : 'default'}
            variant={selectedStage === null ? 'filled' : 'outlined'} />
          {stageOptions.map((s) => (
            <Chip key={s} label={s} size="small" onClick={() => setSelectedStage(selectedStage === s ? null : s)}
              color={selectedStage === s ? 'primary' : 'default'}
              variant={selectedStage === s ? 'filled' : 'outlined'} />
          ))}
        </Box>
        <Box className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <Box className="flex gap-2 flex-wrap items-center">
          <Typography variant="caption" color="text.secondary" className="mr-1">年级：</Typography>
          <Chip label="全部" size="small" onClick={() => setSelectedGrade(null)}
            color={selectedGrade === null ? 'primary' : 'default'}
            variant={selectedGrade === null ? 'filled' : 'outlined'} />
          {availableGrades.map((g) => (
            <Chip key={g} label={g} size="small" onClick={() => setSelectedGrade(g)}
              color={selectedGrade === g ? 'primary' : 'default'}
              variant={selectedGrade === g ? 'filled' : 'outlined'} />
          ))}
        </Box>
        <TextField
          size="small" placeholder="搜索视频标题或老师..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <Search fontSize="small" className="mr-1 text-gray-400" /> }}
          className="w-full md:w-64"
        />
      </Box>

      {/* 视频网格 */}
      {filteredVideos.length === 0 ? (
        <Box className="text-center py-16">
          <Videocam className="text-6xl text-gray-300 mb-4" />
          <Typography variant="h6" color="text.secondary">暂无视频</Typography>
          <Typography variant="body2" color="text.secondary" className="mt-2">
            点击"上传视频"按钮添加您的第一个视频
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredVideos.map((video) => (
            <Grid item xs={12} sm={12} md={6} lg={6} key={video.id}>
              <Card
                className="h-full hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => onOpenPlay(video, filteredVideos)}
              >
                <Box
                  className={`h-44 bg-gradient-to-br ${subjectGradients[video.subject] || 'from-gray-100 to-gray-50'} flex items-center justify-center relative`}
                >
                  <Box className="text-center">
                    <Typography variant="h3" className="font-bold text-white drop-shadow-md opacity-60">
                      {subjectIcons[video.subject] || '课'}
                    </Typography>
                  </Box>
                  {/* 视频封面播放按钮 */}
                  <Box className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                    <Box className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayArrow className="text-gray-800 ml-0.5" />
                    </Box>
                  </Box>
                  <Chip
                    label={video.duration}
                    size="small"
                    icon={<AccessTime fontSize="small" />}
                    className="absolute bottom-2 right-2 bg-black/60 text-white"
                    sx={{ height: 22, '& .MuiChip-label': { px: 0.8, fontSize: 11 }, '& .MuiChip-icon': { fontSize: 12, color: 'white' } }}
                  />
                </Box>
                <CardContent className="p-3">
                  <Typography variant="subtitle2" className="font-semibold truncate mb-1.5">
                    {video.title}
                  </Typography>
                  <Box className="flex items-center gap-1.5 mb-1.5">
                    <Chip label={video.subject} size="small" variant="outlined" color="primary"
                      sx={{ height: 20, '& .MuiChip-label': { px: 0.6, fontSize: 10 } }} />
                    <Chip label={video.grade} size="small" variant="outlined"
                      className={gradeColors[video.grade] || ''}
                      sx={{ height: 20, '& .MuiChip-label': { px: 0.6, fontSize: 10 } }} />
                  </Box>
                  <Box className="flex items-center justify-between">
                    <Typography variant="caption" color="text.secondary">{video.teacher}</Typography>
                    <Typography variant="caption" color="text.secondary">{video.uploadDate}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 本地文件上传弹窗 */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="border-b">
          <Box className="flex items-center justify-between">
            <Box className="flex items-center gap-2">
              <CloudUpload className="text-blue-600" />
              <Typography variant="h6">上传视频</Typography>
            </Box>
            <IconButton onClick={() => setUploadOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box className="py-4 flex flex-col gap-4">
            <TextField fullWidth size="small" label="视频标题" value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })} placeholder="请输入视频标题" />
            <Box className="flex gap-3">
              <FormControl fullWidth size="small">
                <InputLabel>学科</InputLabel>
                <Select value={uploadForm.subject} label="学科"
                  onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}>
                  {subjectOptions.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>年级</InputLabel>
                <Select value={uploadForm.grade} label="年级"
                  onChange={(e) => setUploadForm({ ...uploadForm, grade: e.target.value })}>
                  {allGrades.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <TextField fullWidth size="small" label="授课教师" value={uploadForm.teacher}
              onChange={(e) => setUploadForm({ ...uploadForm, teacher: e.target.value })} placeholder="请输入教师姓名" />
            <TextField fullWidth size="small" label="视频描述" value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              placeholder="请输入视频描述" multiline rows={3} />
            <Button variant="outlined" component="label" startIcon={<Upload />}
              className="h-12 justify-start px-4" sx={{ textTransform: 'none', borderStyle: 'dashed' }}>
              <Typography variant="body2" color="text.secondary">选择视频文件</Typography>
              <input type="file" hidden accept="video/*" />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setUploadOpen(false)} variant="outlined">取消</Button>
          <Button onClick={handleUploadSubmit} variant="contained" disabled={!uploadForm.title || !uploadForm.subject || !uploadForm.grade}>确定上传</Button>
        </DialogActions>
      </Dialog>

      {/* 微课堂选择弹窗 */}
      <Dialog open={microOpen} onClose={() => setMicroOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="border-b">
          <Box className="flex items-center justify-between">
            <Box className="flex items-center gap-2">
              <School className="text-purple-600" />
              <Typography variant="h6">选择微课</Typography>
            </Box>
            <IconButton onClick={() => setMicroOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box className="py-4 flex flex-col gap-2">
            {microLessons.map((lesson) => (
              <Card
                key={lesson.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleMicroSelect(lesson)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <Box className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <Videocam className="text-purple-600" fontSize="small" />
                  </Box>
                  <Box className="min-w-0 flex-1">
                    <Typography variant="subtitle2" className="font-medium truncate">{lesson.title}</Typography>
                    <Box className="flex items-center gap-2 mt-0.5">
                      <Typography variant="caption" color="text.secondary">{lesson.teacher}</Typography>
                      <Typography variant="caption" color="text.secondary">·</Typography>
                      <Typography variant="caption" color="text.secondary">{lesson.duration}</Typography>
                    </Box>
                    <Box className="flex gap-1 mt-1">
                      <Chip label={lesson.subject} size="small" variant="outlined" color="primary"
                        sx={{ height: 18, '& .MuiChip-label': { px: 0.5, fontSize: 9 } }} />
                      <Chip label={lesson.grade} size="small" variant="outlined"
                        sx={{ height: 18, '& .MuiChip-label': { px: 0.5, fontSize: 9 } }} />
                    </Box>
                  </Box>
                  <Typography variant="caption" color="primary" className="shrink-0 font-medium">选择</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setMicroOpen(false)} variant="outlined">取消</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
