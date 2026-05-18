import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Chip,
  InputAdornment,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Search,
  Upload,
  GridView,
  ViewList,
  FilePresent,
  MoreVert,
  Delete,
  Download,
  Edit,
  Description,
  Slideshow,
  CloudUpload,
  CheckCircle,
  People,
  Folder,
  Menu as MenuIcon,
  LibraryBooks,
  Videocam,
  RateReview,
  StarBorder,
} from '@mui/icons-material';
import TeacherManagement from './components/TeacherManagement';
import SchoolManagement from './components/SchoolManagement';
import QuestionBankManagement from './components/QuestionBankManagement';
import ClassroomManagement from './components/ClassroomManagement';
import LiveStream from './components/LiveStream';
import LectureEvaluation from './components/LectureEvaluation';
import LectureEvaluationDetail from './components/LectureEvaluationDetail';
import CloudClassroom from './components/CloudClassroom';
import CloudClassroomPlay from './components/CloudClassroomPlay';
import CloudClassroomReview from './components/CloudClassroomReview';
import type { Lecture } from './components/LectureEvaluation';
import type { CloudVideo } from './components/CloudClassroom';
import TrainingVideo from './components/TrainingVideo';
import TrainingVideoPlay from './components/TrainingVideoPlay';
import TrainingVideoManagement from './components/TrainingVideoManagement';
import type { TrainingVideo as TrainingVideoType } from './components/TrainingVideo';

interface Template {
  id: string;
  name: string;
  type: '课件' | '教案' | '评分表';
  format: 'PPTX' | 'DOCX';
  uploadDate: string;
  thumbnail?: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<'template' | 'teacher' | 'school' | 'questionbank' | 'classroom' | 'livestream' | 'lecture' | 'lecture-detail' | 'cloudclassroom' | 'cloudclassroom-play' | 'cloudclassroom-review' | 'training-video' | 'training-video-play' | 'training-video-mgmt'>('template');
  const [detailLecture, setDetailLecture] = useState<Lecture | null>(null);
  const [detailVideoMode, setDetailVideoMode] = useState<'live' | 'recorded'>('live');
  const [cloudDetail, setCloudDetail] = useState<CloudVideo | null>(null);
  const [cloudRelated, setCloudRelated] = useState<CloudVideo[]>([]);
  const [trainingVideoDetail, setTrainingVideoDetail] = useState<TrainingVideoType | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | '课件' | '教案' | '评分表'>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [uploadType, setUploadType] = useState<'课件' | '教案' | '评分表'>('课件');
  const [dragActive, setDragActive] = useState(false);

  // 示例数据
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: '数学课件 - 函数与极限',
      type: '课件',
      format: 'PPTX',
      uploadDate: '2026-05-01',
      thumbnail: '/placeholder-ppt.jpg',
    },
    {
      id: '2',
      name: '语文教案 - 古诗词鉴赏',
      type: '教案',
      format: 'DOCX',
      uploadDate: '2026-05-03',
    },
    {
      id: '3',
      name: '英语课件 - 语法基础',
      type: '课件',
      format: 'PPTX',
      uploadDate: '2026-05-05',
      thumbnail: '/placeholder-ppt.jpg',
    },
    {
      id: '4',
      name: '物理教案 - 力学实验',
      type: '教案',
      format: 'DOCX',
      uploadDate: '2026-05-06',
    },
    {
      id: '5',
      name: '课堂教学评价表（常规）',
      type: '评分表',
      format: 'DOCX',
      uploadDate: '2026-05-08',
    },
  ]);

  // 过滤模板
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || template.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    processFiles(files);
  };

  const processFiles = (files: FileList | null) => {
    if (files) {
      Array.from(files).forEach((file) => {
        const fileExtension = file.name.split('.').pop()?.toUpperCase();
        if (fileExtension === 'PPTX' || fileExtension === 'DOCX') {
          const newTemplate: Template = {
            id: Date.now().toString(),
            name: file.name.replace(/\.(pptx|docx)$/i, ''),
            type: uploadType,
            format: fileExtension as 'PPTX' | 'DOCX',
            uploadDate: new Date().toISOString().split('T')[0],
          };
          setTemplates((prev) => [...prev, newTemplate]);
        }
      });
      setUploadDialogOpen(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleOpenLectureDetail = (lecture: Lecture, videoMode: 'live' | 'recorded') => {
    setDetailLecture(lecture);
    setDetailVideoMode(videoMode);
    setCurrentPage('lecture-detail');
  };

  const handleOpenCloudPlay = (video: CloudVideo, related: CloudVideo[]) => {
    setCloudDetail(video);
    setCloudRelated(related);
    setCurrentPage('cloudclassroom-play');
  };

  const handleOpenTrainingPlay = (video: TrainingVideoType) => {
    setTrainingVideoDetail(video);
    setCurrentPage('training-video-play');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, template: Template) => {
    setAnchorEl(event.currentTarget);
    setSelectedTemplate(template);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTemplate(null);
  };

  const handleDelete = () => {
    if (selectedTemplate) {
      setTemplates((prev) => prev.filter((t) => t.id !== selectedTemplate.id));
    }
    handleMenuClose();
  };

  const getTypeIcon = (type: string, inherit?: boolean) => {
    const sx = inherit ? { fontSize: 'inherit' } : undefined;
    if (type === '评分表') return <RateReview sx={sx} />;
    return type === '课件' ? <Slideshow sx={sx} /> : <Description sx={sx} />;
  };

  const menuItems = [
    { id: 'template', label: '模板管理', icon: <Folder /> },
    { id: 'teacher', label: '教师管理', icon: <People /> },
    { id: 'school', label: '学校管理', icon: <People /> },
    { id: 'questionbank', label: '校本资源', icon: <LibraryBooks /> },
    { id: 'lecture', label: '听评课', icon: <RateReview /> },
    { id: 'cloudclassroom-parent', label: '云课堂', icon: <Videocam />, children: [
      { id: 'cloudclassroom', label: '云课堂' },
      { id: 'cloudclassroom-review', label: '云课堂审核' },
    ]},
    { id: 'training-video', label: '培训视频', icon: <Videocam /> },
    { id: 'training-video-mgmt', label: '培训视频管理', icon: <Videocam /> },
    { id: 'central', label: '集控管理', icon: <MenuIcon />, children: [
      { id: 'classroom', label: '教室管理', icon: <People /> },
      { id: 'livestream', label: '实时流', icon: <Videocam /> },
    ]},
  ];

  return (
    <Box className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <AppBar position="static" elevation={0} className="bg-white border-b border-gray-200">
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => setDrawerOpen(true)}
            className="mr-2 text-gray-700 md:hidden"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className="text-gray-800 font-bold">
            教学管理系统
          </Typography>
          <Box className="ml-auto hidden md:flex gap-2">
            {menuItems.map((item) =>
              item.children ? (
                <Box key={item.id}>
                  <Button
                    startIcon={item.icon}
                    onClick={(e) => { setMenuAnchorEl(e.currentTarget); setActiveMenuId(item.id); }}
                    variant={item.children?.some(c => currentPage === c.id) ? 'contained' : 'text'}
                    sx={{
                      color: item.children?.some(c => currentPage === c.id) ? undefined : 'white',
                      '&:hover': {
                        backgroundColor: item.children?.some(c => currentPage === c.id) ? undefined : 'rgba(255, 255, 255, 0.1)',
                      }
                    }}
                  >
                    {item.label}
                  </Button>
                  <Menu
                    anchorEl={menuAnchorEl}
                    open={Boolean(menuAnchorEl) && activeMenuId === item.id}
                    onClose={() => { setMenuAnchorEl(null); setActiveMenuId(null); }}
                  >
                    {item.children.map((child) => (
                      <MenuItem
                        key={child.id}
                        onClick={() => {
                          setCurrentPage(child.id as 'classroom' | 'livestream' | 'cloudclassroom' | 'cloudclassroom-review' | 'training-video' | 'training-video-mgmt');
                          setMenuAnchorEl(null);
                          setActiveMenuId(null);
                        }}
                      >
                        {child.icon}
                        <span className="ml-2">{child.label}</span>
                      </MenuItem>
                    ))}
                  </Menu>
                </Box>
              ) : (
                <Button
                  key={item.id}
                  startIcon={item.icon}
                  onClick={() => setCurrentPage(item.id as 'template' | 'teacher' | 'school' | 'questionbank' | 'classroom' | 'livestream' | 'cloudclassroom' | 'cloudclassroom-review' | 'training-video' | 'training-video-mgmt')}
                  variant={currentPage === item.id ? 'contained' : 'text'}
                  sx={{
                    color: currentPage === item.id ? undefined : 'white',
                    '&:hover': {
                      backgroundColor: currentPage === item.id ? undefined : 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  {item.label}
                </Button>
              )
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* 移动端侧边栏 */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box className="w-64 p-4">
          <Typography variant="h6" className="mb-4 font-bold">
            菜单
          </Typography>
          <List>
            {menuItems.map((item) => (
              <Box key={`drawer-${item.id}`}>
                {item.children ? (
                  <>
                    <ListItem
                      className="cursor-pointer rounded-lg mb-1"
                    >
                      <ListItemAvatar>
                        <Avatar className="bg-gray-100">
                          {item.icon}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={item.label} />
                    </ListItem>
                    {item.children.map((child) => (
                      <ListItem
                        key={`drawer-${child.id}`}
                        onClick={() => {
                          setCurrentPage(child.id as 'classroom' | 'livestream' | 'cloudclassroom' | 'cloudclassroom-review' | 'training-video' | 'training-video-mgmt');
                          setDrawerOpen(false);
                        }}
                        className={`cursor-pointer rounded-lg mb-1 ml-4 ${
                          currentPage === child.id ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                      >
                        <ListItemAvatar>
                          <Avatar className={currentPage === child.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}>
                            {child.icon}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={child.label} />
                      </ListItem>
                    ))}
                  </>
                ) : (
                  <ListItem
                    onClick={() => {
                      setCurrentPage(item.id as 'template' | 'teacher' | 'school' | 'questionbank' | 'classroom' | 'livestream' | 'cloudclassroom' | 'cloudclassroom-review' | 'training-video' | 'training-video-mgmt');
                      setDrawerOpen(false);
                    }}
                    className={`cursor-pointer rounded-lg mb-2 ${
                      currentPage === item.id ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    <ListItemAvatar>
                      <Avatar className={currentPage === item.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}>
                        {item.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={item.label} />
                  </ListItem>
                )}
              </Box>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* 页面内容 */}
      {currentPage === 'teacher' ? (
        <TeacherManagement />
      ) : currentPage === 'school' ? (
        <SchoolManagement />
      ) : currentPage === 'questionbank' ? (
        <QuestionBankManagement />
      ) : currentPage === 'lecture' ? (
        <LectureEvaluation onOpenDetail={handleOpenLectureDetail} />
      ) : currentPage === 'lecture-detail' && detailLecture ? (
        <LectureEvaluationDetail
          lecture={detailLecture}
          videoMode={detailVideoMode}
          onBack={() => setCurrentPage('lecture')}
        />
      ) : currentPage === 'cloudclassroom-review' ? (
        <CloudClassroomReview />
      ) : currentPage === 'cloudclassroom' ? (
        <CloudClassroom onOpenPlay={handleOpenCloudPlay} />
      ) : currentPage === 'cloudclassroom-play' && cloudDetail ? (
        <CloudClassroomPlay
          video={cloudDetail}
          relatedVideos={cloudRelated}
          onBack={() => setCurrentPage('cloudclassroom')}
          onPlay={(video) => handleOpenCloudPlay(video, cloudRelated)}
        />
      ) : currentPage === 'classroom' ? (
        <ClassroomManagement />
      ) : currentPage === 'livestream' ? (
        <LiveStream />
      ) : currentPage === 'training-video' ? (
        <TrainingVideo onOpenPlay={handleOpenTrainingPlay} />
      ) : currentPage === 'training-video-play' && trainingVideoDetail ? (
        <TrainingVideoPlay
          video={trainingVideoDetail}
          onBack={() => setCurrentPage('training-video')}
        />
      ) : currentPage === 'training-video-mgmt' ? (
        <TrainingVideoManagement />
      ) : (
        <Container maxWidth="xl" className="py-8">
        {/* 标题栏 */}
        <Box className="mb-8">
          <Typography variant="h4" className="mb-2">
            模板管理
          </Typography>
          <Typography variant="body2" color="text.secondary">
            管理您的课件、教案和评分表模板
          </Typography>
        </Box>

        {/* 工具栏 */}
        <Box className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <Box className="flex gap-2 flex-wrap">
            <Chip
              label="全部"
              onClick={() => setSelectedType('all')}
              color={selectedType === 'all' ? 'primary' : 'default'}
              variant={selectedType === 'all' ? 'filled' : 'outlined'}
            />
            <Chip
              label="课件"
              onClick={() => setSelectedType('课件')}
              color={selectedType === '课件' ? 'primary' : 'default'}
              variant={selectedType === '课件' ? 'filled' : 'outlined'}
            />
            <Chip
              label="教案"
              onClick={() => setSelectedType('教案')}
              color={selectedType === '教案' ? 'primary' : 'default'}
              variant={selectedType === '教案' ? 'filled' : 'outlined'}
            />
            <Chip
              label="评分表"
              onClick={() => setSelectedType('评分表')}
              color={selectedType === '评分表' ? 'primary' : 'default'}
              variant={selectedType === '评分表' ? 'filled' : 'outlined'}
            />
          </Box>

          <Box className="flex gap-2 w-full md:w-auto">
            <TextField
              size="small"
              placeholder="搜索模板名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              className="flex-1 md:w-64"
            />
            <IconButton
              onClick={() => setViewMode('grid')}
              color={viewMode === 'grid' ? 'primary' : 'default'}
            >
              <GridView />
            </IconButton>
            <IconButton
              onClick={() => setViewMode('list')}
              color={viewMode === 'list' ? 'primary' : 'default'}
            >
              <ViewList />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<Upload />}
              onClick={() => setUploadDialogOpen(true)}
            >
              上传模板
            </Button>
          </Box>
        </Box>

        {/* 模板展示区域 */}
        {filteredTemplates.length === 0 ? (
          <Box className="text-center py-16">
            <FilePresent className="text-6xl text-gray-300 mb-4" />
            <Typography variant="h6" color="text.secondary">
              暂无模板
            </Typography>
            <Typography variant="body2" color="text.secondary" className="mt-2">
              点击"上传模板"按钮添加您的第一个模板
            </Typography>
          </Box>
        ) : viewMode === 'grid' ? (
          <Grid container spacing={3}>
            {filteredTemplates.map((template) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={template.id}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardMedia
                    className={`h-48 flex items-center justify-center ${
                      template.type === '评分表' ? 'bg-gradient-to-br from-orange-100 to-orange-50' :
                      template.type === '课件' ? 'bg-gradient-to-br from-blue-100 to-blue-50' :
                      'bg-gradient-to-br from-green-100 to-green-50'
                    }`}
                    component="div"
                  >
                    <Box className={`text-6xl ${
                      template.type === '评分表' ? 'text-orange-300' :
                      template.type === '课件' ? 'text-blue-300' : 'text-green-300'
                    }`}>
                      {getTypeIcon(template.type, true)}
                    </Box>
                  </CardMedia>
                  <CardContent>
                    <Box className="flex justify-between items-start mb-2">
                      <Typography variant="h6" className="flex-1 truncate">
                        {template.name}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, template)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                    <Box className="flex gap-2 mb-2">
                      <Chip label={template.type} size="small" color="primary" variant="outlined" />
                      <Chip label={template.format} size="small" />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      上传时间: {template.uploadDate}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <List className="bg-white rounded-lg">
            {filteredTemplates.map((template, index) => (
              <Box key={template.id}>
                <ListItem
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={(e) => handleMenuOpen(e, template)}
                    >
                      <MoreVert />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar className={`${
                      template.type === '评分表' ? 'bg-orange-100 text-orange-600' :
                      template.type === '课件' ? 'bg-blue-100 text-blue-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {getTypeIcon(template.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={template.name}
                    secondary={
                      <Box className="flex gap-2 items-center mt-1">
                        <Chip label={template.type} size="small" variant="outlined" />
                        <Chip label={template.format} size="small" />
                        <Typography variant="caption" color="text.secondary">
                          • {template.uploadDate}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < filteredTemplates.length - 1 && <Box className="border-b border-gray-100" />}
              </Box>
            ))}
          </List>
        )}

        {/* 操作菜单 */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
            <Download className="mr-2" fontSize="small" />
            下载
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Edit className="mr-2" fontSize="small" />
            重命名
          </MenuItem>
          <MenuItem onClick={handleDelete} className="text-red-600">
            <Delete className="mr-2" fontSize="small" />
            删除
          </MenuItem>
        </Menu>

        {/* 上传对话框 */}
        <Dialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            className: "rounded-2xl"
          }}
        >
          <DialogTitle className="pb-2">
            <Box className="flex items-center gap-2">
              <CloudUpload className="text-blue-600" />
              <Typography variant="h6">上传模板</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box className="py-2">
              {/* 模板类型选择 */}
              <Box className="mb-6">
                <Typography variant="subtitle2" className="mb-3 font-semibold">
                  选择模板类型
                </Typography>
                <Box className="flex gap-3">
                  <Card
                    className={`flex-1 cursor-pointer transition-all ${
                      uploadType === '课件'
                        ? 'border-2 border-blue-600 bg-blue-50'
                        : 'border border-gray-300 hover:border-blue-300'
                    }`}
                    onClick={() => setUploadType('课件')}
                  >
                    <CardContent className="text-center py-4">
                      <Slideshow className={`text-4xl mb-2 ${uploadType === '课件' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <Typography variant="body1" className="font-medium">
                        课件
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        PPTX 格式
                      </Typography>
                      {uploadType === '课件' && (
                        <CheckCircle className="text-blue-600 absolute top-2 right-2" fontSize="small" />
                      )}
                    </CardContent>
                  </Card>
                  <Card
                    className={`flex-1 cursor-pointer transition-all ${
                      uploadType === '教案'
                        ? 'border-2 border-green-600 bg-green-50'
                        : 'border border-gray-300 hover:border-green-300'
                    }`}
                    onClick={() => setUploadType('教案')}
                  >
                    <CardContent className="text-center py-4">
                      <Description className={`text-4xl mb-2 ${uploadType === '教案' ? 'text-green-600' : 'text-gray-400'}`} />
                      <Typography variant="body1" className="font-medium">
                        教案
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        DOCX 格式
                      </Typography>
                      {uploadType === '教案' && (
                        <CheckCircle className="text-green-600 absolute top-2 right-2" fontSize="small" />
                      )}
                    </CardContent>
                  </Card>
                  <Card
                    className={`flex-1 cursor-pointer transition-all ${
                      uploadType === '评分表'
                        ? 'border-2 border-orange-600 bg-orange-50'
                        : 'border border-gray-300 hover:border-orange-300'
                    }`}
                    onClick={() => setUploadType('评分表')}
                  >
                    <CardContent className="text-center py-4">
                      <RateReview className={`text-4xl mb-2 ${uploadType === '评分表' ? 'text-orange-600' : 'text-gray-400'}`} />
                      <Typography variant="body1" className="font-medium">
                        评分表
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        DOCX 格式
                      </Typography>
                      {uploadType === '评分表' && (
                        <CheckCircle className="text-orange-600 absolute top-2 right-2" fontSize="small" />
                      )}
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              {/* 文件上传区域 */}
              <Box className="mb-2">
                <Typography variant="subtitle2" className="mb-3 font-semibold">
                  上传文件
                </Typography>
                <Box
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                >
                  <CloudUpload className="text-6xl text-gray-400 mb-3" />
                  <Typography variant="body1" className="mb-2 font-medium">
                    拖拽文件到此处
                  </Typography>
                  <Typography variant="body2" color="text.secondary" className="mb-4">
                    或者
                  </Typography>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<Upload />}
                  >
                    选择文件
                    <input
                      type="file"
                      hidden
                      accept=".pptx,.docx"
                      multiple
                      onChange={handleFileUpload}
                    />
                  </Button>
                  <Typography variant="caption" color="text.secondary" className="mt-3 block">
                    支持 PPTX 和 DOCX 格式，可同时上传多个文件
                  </Typography>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions className="px-6 pb-4">
            <Button onClick={() => setUploadDialogOpen(false)} variant="outlined">
              取消
            </Button>
          </DialogActions>
        </Dialog>
        </Container>
      )}
    </Box>
  );
}