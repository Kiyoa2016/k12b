import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Collapse,
  Checkbox,
  Card,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Paper,
  Link,
  Divider,
} from '@mui/material';
import {
  Search,
  Upload,
  ChevronRight,
  ChevronLeft,
  ViewList,
  ViewModule,
  FolderOpen,
  ExpandMore,
  ExpandLess,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Slideshow,
  Description,
  PermMedia,
  Assignment,
  Download,
  Close,
} from '@mui/icons-material';

interface Subject {
  id: string;
  name: string;
  count: number;
  children?: Grade[];
}

interface Grade {
  id: string;
  name: string;
  count: number;
}

interface Question {
  id: string;
  type: string;
  difficulty: string;
  number: number;
  content: string;
  options: string[];
  answer?: string;
  analysis?: {
    summary: string;
    details: string[];
    comment?: string;
  };
  isOwnUpload?: boolean;
}

export default function QuestionBankManagement() {
  const [selectedSubject, setSelectedSubject] = useState<string>('科学');
  const [expandedSubject, setExpandedSubject] = useState<string>('科学');
  const [selectedType, setSelectedType] = useState<string>('全部');
  const [gradeFilter, setGradeFilter] = useState<string>('全部年级');
  const [subjectFilter, setSubjectFilter] = useState<string>('全部学科');
  const [resourceFilter, setResourceFilter] = useState<string>('全部资源');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [questionTypeFilter, setQuestionTypeFilter] = useState<string>('全部');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('全部');
  const [statusFilter, setStatusFilter] = useState<string>('全部');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [uploadMenuAnchor, setUploadMenuAnchor] = useState<null | HTMLElement>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'manual' | 'document'>('manual');
  const [uploadStep, setUploadStep] = useState(1);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedDirectory, setSelectedDirectory] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [hoveredQuestion, setHoveredQuestion] = useState<string | null>(null);

  // 最近上传的目录
  const recentDirectories = [
    '全部资源',
    '自动',
    '四年级1',
    '五年级1',
    '六年级2',
  ];

  const subjects: Subject[] = [
    {
      id: 'science',
      name: '科学',
      count: 5,
      children: [
        { id: 'grade6', name: '六年级', count: 1 },
        { id: 'grade5', name: '五年级', count: 0 },
        { id: 'grade4', name: '四年级', count: 0 },
        { id: 'grade3', name: '三年级', count: 0 },
        { id: 'grade2', name: '二年级', count: 0 },
        { id: 'grade1', name: '一年级', count: 0 },
        { id: 'grade712', name: '七年级12', count: 0 },
      ],
    },
    { id: 'english', name: '英语', count: 0 },
    { id: 'math', name: '数学', count: 1 },
    { id: 'chinese', name: '语文', count: 2 },
    { id: 'art', name: '美术', count: 0 },
    { id: 'geography', name: '地理', count: 0 },
    { id: 'chemistry', name: '化学', count: 0 },
    { id: 'physics', name: '物理', count: 0 },
  ];

  const resourceTypes = ['全部', '课件', '教案', '多媒体', '题库'];

  const questions: Question[] = [
    {
      id: '1',
      type: '单选题',
      difficulty: '难度一般',
      number: 1,
      content: '下列汉字声母是"p"的是（    ）',
      options: ['A.班', 'B.佛', 'C.盆'],
      answer: 'C',
      analysis: {
        summary: '本题考查了学生对于声母的掌握，完成此类题目较简单，结合对拼音知识的学习完成。',
        details: [
          'A."班"字读音为"bān"，其声母是"b"，并非"p"。',
          'B."佛"是一个多音字，读音有"fó""fú""bì""bó"，其声母分别为"f""f""b""b"，没有"p"。',
          'C."盆"字读音为"pén"，其声母是"p"，符合要求。',
          '故选：C。',
        ],
        comment: '声母表：b p m f d t n l g k h j q x zh ch sh r z c s y w',
      },
      isOwnUpload: true,
    },
    {
      id: '2',
      type: '单选题',
      difficulty: '难度一般',
      number: 2,
      content: '书写时占第一二格的是（    ）',
      options: ['A.p', 'B.m', 'C.b', 'D.n'],
      isOwnUpload: false,
    },
  ];

  const toggleQuestionExpand = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const handleUploadMenuClick = (type: string) => {
    setUploadMenuAnchor(null);
    if (type === '题库') {
      setUploadDialogOpen(true);
      setUploadStep(1);
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
    // 处理文件上传
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    // 处理文件上传
  };

  const handleSubjectClick = (subject: Subject) => {
    if (subject.children) {
      setExpandedSubject(expandedSubject === subject.name ? '' : subject.name);
    }
    setSelectedSubject(subject.name);
  };

  return (
    <Box className="flex h-screen bg-white">
      {/* 左侧边栏 */}
      <Box className="w-48 bg-gray-50 border-r border-gray-200 flex-shrink-0 overflow-auto">
        <Box className="p-4">
          <Typography variant="subtitle1" className="font-bold mb-4">
            全部资源
          </Typography>
          <List className="space-y-1">
            {subjects.map((subject) => (
              <Box key={subject.id}>
                <ListItem
                  onClick={() => handleSubjectClick(subject)}
                  className={`cursor-pointer rounded px-2 py-1.5 ${
                    selectedSubject === subject.name
                      ? 'bg-green-50 text-green-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {subject.children ? (
                    expandedSubject === subject.name ? (
                      <ExpandLess fontSize="small" className="mr-1" />
                    ) : (
                      <ExpandMore fontSize="small" className="mr-1" />
                    )
                  ) : (
                    <FolderOpen fontSize="small" className="mr-1" />
                  )}
                  <ListItemText
                    primary={subject.name}
                    primaryTypographyProps={{
                      variant: 'body2',
                      className: selectedSubject === subject.name ? 'font-medium' : '',
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {subject.count}
                  </Typography>
                </ListItem>

                {subject.children && (
                  <Collapse in={expandedSubject === subject.name} timeout="auto" unmountOnExit>
                    <List className="ml-4">
                      {subject.children.map((grade) => (
                        <ListItem
                          key={grade.id}
                          className="cursor-pointer rounded px-2 py-1 hover:bg-gray-100"
                        >
                          <FolderOpen fontSize="small" className="mr-1 text-orange-400" />
                          <ListItemText
                            primary={grade.name}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {grade.count}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                )}
              </Box>
            ))}
          </List>
        </Box>
      </Box>

      {/* 主内容区 */}
      <Box className="flex-1 flex flex-col">
        {/* 顶部标题栏 */}
        <Box className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <Typography variant="h6" className="font-bold">
            校本资源库
          </Typography>
          <Box className="flex items-center gap-3">
            <IconButton size="small">
              <Search />
            </IconButton>
            <Button variant="outlined" size="small">
              下载记录
            </Button>
            <Button
              variant="contained"
              startIcon={<Upload />}
              endIcon={<ExpandMore />}
              size="small"
              onClick={(e) => setUploadMenuAnchor(e.currentTarget)}
            >
              上传资源
            </Button>
            <Menu
              anchorEl={uploadMenuAnchor}
              open={Boolean(uploadMenuAnchor)}
              onClose={() => setUploadMenuAnchor(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  width: uploadMenuAnchor?.offsetWidth || 'auto',
                  mt: 0.5,
                },
              }}
            >
              <MenuItem onClick={() => handleUploadMenuClick('课件')}>
                <Slideshow fontSize="small" className="mr-2" />
                课件
              </MenuItem>
              <MenuItem onClick={() => handleUploadMenuClick('教案')}>
                <Description fontSize="small" className="mr-2" />
                教案
              </MenuItem>
              <MenuItem onClick={() => handleUploadMenuClick('多媒体')}>
                <PermMedia fontSize="small" className="mr-2" />
                多媒体
              </MenuItem>
              <MenuItem onClick={() => handleUploadMenuClick('题库')}>
                <Assignment fontSize="small" className="mr-2" />
                题库
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* 面包屑导航 */}
        <Box className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
          <Box className="flex items-center gap-2 text-sm text-gray-600">
            <IconButton size="small">
              <ChevronLeft fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <ChevronRight fontSize="small" />
            </IconButton>
            <Typography variant="body2" color="text.secondary">
              全部资源
            </Typography>
            <Typography variant="body2">/</Typography>
            <Typography variant="body2">{selectedSubject}</Typography>
          </Box>
          <Box className="flex items-center gap-3">
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                displayEmpty
                sx={{
                  height: '32px',
                  fontSize: '0.875rem'
                }}
              >
                <MenuItem value="全部年级">全部年级</MenuItem>
                <MenuItem value="一年级">一年级</MenuItem>
                <MenuItem value="二年级">二年级</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                displayEmpty
                sx={{
                  height: '32px',
                  fontSize: '0.875rem'
                }}
              >
                <MenuItem value="全部学科">全部学科</MenuItem>
                <MenuItem value="语文">语文</MenuItem>
                <MenuItem value="数学">数学</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={resourceFilter}
                onChange={(e) => setResourceFilter(e.target.value)}
                displayEmpty
                sx={{
                  height: '32px',
                  fontSize: '0.875rem'
                }}
              >
                <MenuItem value="全部资源">全部资源</MenuItem>
                <MenuItem value="课件">课件</MenuItem>
                <MenuItem value="教案">教案</MenuItem>
                <MenuItem value="多媒体">多媒体</MenuItem>
                <MenuItem value="题库">题库</MenuItem>
              </Select>
            </FormControl>
            <IconButton size="small" onClick={() => setViewMode('list')}>
              <ViewList className={viewMode === 'list' ? 'text-green-600' : ''} />
            </IconButton>
            <IconButton size="small" onClick={() => setViewMode('grid')}>
              <ViewModule className={viewMode === 'grid' ? 'text-green-600' : ''} />
            </IconButton>
          </Box>
        </Box>

        {/* 筛选标签区 */}
        <Box className="px-6 border-b border-gray-200">
          <Box className="flex items-center gap-0">
            {resourceTypes.map((type) => (
              <Box
                key={type}
                onClick={() => setSelectedType(type)}
                className={`cursor-pointer px-4 py-3 relative ${
                  selectedType === type
                    ? 'text-green-600 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Typography variant="body2">{type}</Typography>
                {selectedType === type && (
                  <Box
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"
                  />
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* 上传题库对话框 */}
        <Dialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle className="border-b">
            <Box className="flex items-center justify-between">
              <Typography variant="h6">上传题库</Typography>
              <IconButton size="small" onClick={() => setUploadDialogOpen(false)}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent className="p-0">
            {/* 上传方式选择 */}
            <Tabs
              value={uploadMode}
              onChange={(e, newValue) => setUploadMode(newValue)}
              className="border-b"
            >
              <Tab label="手动选择题目" value="manual" />
              <Tab label="Word文档导入" value="document" />
            </Tabs>

            {uploadMode === 'manual' ? (
              <Box className="p-6">
                {/* 步骤指示器 */}
                <Stepper activeStep={uploadStep - 1} className="mb-6">
                  <Step>
                    <StepLabel>选择题目</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>设置分类</StepLabel>
                  </Step>
                </Stepper>

                {uploadStep === 1 ? (
                  <Box>
                    {/* 第一步：选择题目 */}
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="请输入课件名称"
                      InputProps={{
                        startAdornment: (
                          <Search fontSize="small" className="mr-2 text-gray-400" />
                        ),
                      }}
                      className="mb-4"
                    />
                    <Box className="border rounded max-h-96 overflow-auto">
                      <List>
                        {[1, 2, 3, 4, 5].map((item) => (
                          <ListItem key={item} className="hover:bg-gray-50">
                            <Checkbox size="small" />
                            <Assignment className="mr-2 text-blue-500" />
                            <ListItemText primary={`题目 ${item}`} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    {/* 第二步：设置分类 */}
                    <Box className="mb-4">
                      <Typography variant="subtitle2" className="mb-2">
                        1.请选择年级范围
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        placeholder="幼儿园 / 英语 / 未设置"
                      />
                    </Box>
                    <Box>
                      <Box className="flex items-center justify-between mb-2">
                        <Typography variant="subtitle2">
                          2.请选择需要上传的目录
                        </Typography>
                        <IconButton size="small">
                          <Search fontSize="small" />
                        </IconButton>
                      </Box>
                      <Paper variant="outlined" className="max-h-80 overflow-auto p-3">
                        {/* 最近上传 */}
                        <Typography variant="body2" className="font-medium mb-2">
                          最近上传
                        </Typography>
                        <List className="pl-2 mb-3">
                          {recentDirectories.map((dir, index) => (
                            <ListItem key={`recent-${index}`} className="py-1 hover:bg-gray-50 rounded cursor-pointer">
                              <FolderOpen fontSize="small" className="mr-2 text-orange-400" />
                              <ListItemText primary={dir} primaryTypographyProps={{ variant: 'body2' }} />
                            </ListItem>
                          ))}
                        </List>

                        {/* 全部目录 */}
                        <Typography variant="body2" className="font-medium mb-2">
                          全部目录
                        </Typography>
                        <List className="pl-2">
                          <ListItem key="all-resources" className="py-1 hover:bg-gray-50 rounded cursor-pointer">
                            <FolderOpen fontSize="small" className="mr-2 text-orange-400" />
                            <ListItemText primary="全部资源" primaryTypographyProps={{ variant: 'body2' }} />
                          </ListItem>
                          <ListItem key="auto" className="py-1 hover:bg-gray-50 rounded cursor-pointer">
                            <FolderOpen fontSize="small" className="mr-2 text-orange-400" />
                            <ListItemText primary="自动" primaryTypographyProps={{ variant: 'body2' }} />
                          </ListItem>
                          <ListItem key="grade-4-1" className="py-1 hover:bg-gray-50 rounded cursor-pointer">
                            <FolderOpen fontSize="small" className="mr-2 text-orange-400" />
                            <ListItemText primary="四年级1" primaryTypographyProps={{ variant: 'body2' }} />
                          </ListItem>
                          <ListItem key="grade-5-1" className="py-1 hover:bg-gray-50 rounded cursor-pointer">
                            <FolderOpen fontSize="small" className="mr-2 text-orange-400" />
                            <ListItemText primary="五年级1" primaryTypographyProps={{ variant: 'body2' }} />
                          </ListItem>
                          <ListItem key="grade-6-2" className="py-1 hover:bg-gray-50 rounded cursor-pointer">
                            <FolderOpen fontSize="small" className="mr-2 text-orange-400" />
                            <ListItemText primary="六年级2" primaryTypographyProps={{ variant: 'body2' }} />
                          </ListItem>
                          <ListItem key="grade-7-2" className="py-1 hover:bg-gray-50 rounded cursor-pointer">
                            <FolderOpen fontSize="small" className="mr-2 text-orange-400" />
                            <ListItemText primary="七年级2" primaryTypographyProps={{ variant: 'body2' }} />
                          </ListItem>
                          <ListItem key="grade-8-2" className="py-1 hover:bg-gray-50 rounded cursor-pointer">
                            <FolderOpen fontSize="small" className="mr-2 text-orange-400" />
                            <ListItemText primary="八年级2" primaryTypographyProps={{ variant: 'body2' }} />
                          </ListItem>
                        </List>
                      </Paper>
                    </Box>
                  </Box>
                )}
              </Box>
            ) : (
              <Box className="p-6">
                {/* Word文档导入 */}
                <Box className="mb-4">
                  <Typography variant="subtitle2" className="mb-2">
                    上传Word文档批量导入题目
                  </Typography>
                  <Box className="flex items-center gap-2 mb-3">
                    <Typography variant="body2" color="text.secondary">
                      请按照标准模板格式编辑题目
                    </Typography>
                    <Link href="#" className="text-blue-600 text-sm flex items-center gap-1">
                      <Download fontSize="small" />
                      下载标准模板
                    </Link>
                  </Box>
                </Box>

                <Divider className="my-4" />

                {/* 文件上传区域 */}
                <Box
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                >
                  <Upload className="text-6xl text-gray-400 mb-4" />
                  <Typography variant="body1" className="mb-2 font-medium">
                    拖拽文件到此处
                  </Typography>
                  <Typography variant="body2" color="text.secondary" className="mb-4">
                    或者
                  </Typography>
                  <Button variant="contained" component="label" startIcon={<Upload />}>
                    选择文件
                    <input type="file" hidden accept=".doc,.docx" onChange={handleFileUpload} />
                  </Button>
                  <Typography variant="caption" color="text.secondary" className="mt-3 block">
                    支持 DOC、DOCX 格式，文件大小不超过 10MB
                  </Typography>
                </Box>

                <Divider className="my-4" />

                {/* 年级和目录选择 */}
                <Box className="mb-4">
                  <Typography variant="subtitle2" className="mb-2">
                    选择年级范围
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    placeholder="请选择年级"
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" className="mb-2">
                    选择上传目录
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={selectedDirectory}
                    onChange={(e) => setSelectedDirectory(e.target.value)}
                    placeholder="请选择目录"
                  />
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions className="px-6 pb-4 border-t">
            {uploadMode === 'manual' && uploadStep === 2 && (
              <Button onClick={() => setUploadStep(1)} variant="outlined">
                上一步
              </Button>
            )}
            <Button onClick={() => setUploadDialogOpen(false)} variant="outlined">
              取消
            </Button>
            {uploadMode === 'manual' ? (
              uploadStep === 1 ? (
                <Button onClick={() => setUploadStep(2)} variant="contained">
                  下一步(0/50)
                </Button>
              ) : (
                <Button variant="contained">上传</Button>
              )
            ) : (
              <Button variant="contained">上传</Button>
            )}
          </DialogActions>
        </Dialog>

        {/* 表格区域 */}
        <Box className="flex-1 overflow-auto">
          {selectedType === '题库' ? (
            <Box className="px-6 py-4">
              {/* 题库筛选器 */}
              <Box className="flex items-center gap-4 mb-4">
                <Box className="flex items-center gap-2">
                  <Typography variant="body2">题型</Typography>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={questionTypeFilter}
                      onChange={(e) => setQuestionTypeFilter(e.target.value)}
                      displayEmpty
                      sx={{
                        height: '32px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <MenuItem value="全部">全部</MenuItem>
                      <MenuItem value="单选题">单选题</MenuItem>
                      <MenuItem value="多选题">多选题</MenuItem>
                      <MenuItem value="判断题">判断题</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box className="flex items-center gap-2">
                  <Typography variant="body2">难度</Typography>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      displayEmpty
                      sx={{
                        height: '32px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <MenuItem value="全部">全部</MenuItem>
                      <MenuItem value="简单">简单</MenuItem>
                      <MenuItem value="一般">一般</MenuItem>
                      <MenuItem value="困难">困难</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box className="flex items-center gap-2">
                  <Typography variant="body2">状态</Typography>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      displayEmpty
                      sx={{
                        height: '32px',
                        fontSize: '0.875rem'
                      }}
                    >
                      <MenuItem value="全部">全部</MenuItem>
                      <MenuItem value="已完成">已完成</MenuItem>
                      <MenuItem value="未完成">未完成</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {/* 题目列表 */}
              <Box className="space-y-4">
                {questions.map((question) => (
                  <Card
                    key={question.id}
                    className="p-4 border border-gray-200 relative"
                    onMouseEnter={() => setHoveredQuestion(question.id)}
                    onMouseLeave={() => setHoveredQuestion(null)}
                  >
                    <Box className="flex items-start gap-3">
                      <Checkbox size="small" className="mt-1" />
                      <Box className="flex-1">
                        {/* 题目标签 */}
                        <Box className="flex items-center gap-2 mb-3">
                          <Chip label={question.type} size="small" className="bg-blue-50 text-blue-600" />
                          <Chip label={question.difficulty} size="small" className="bg-gray-100" />
                        </Box>

                        {/* 题目内容 */}
                        <Typography variant="body1" className="mb-3">
                          {question.number}. {question.content}
                        </Typography>

                        {/* 选项 */}
                        <Box className="flex flex-wrap gap-x-8 gap-y-2 mb-3">
                          {question.options.map((option, index) => (
                            <Typography key={index} variant="body2" color="text.secondary">
                              {option}
                            </Typography>
                          ))}
                        </Box>

                        {/* 展开解析按钮 */}
                        <Button
                          size="small"
                          endIcon={expandedQuestions.has(question.id) ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                          onClick={() => toggleQuestionExpand(question.id)}
                          className="text-gray-600"
                        >
                          {expandedQuestions.has(question.id) ? '收起解析' : '展开解析'}
                        </Button>

                        {/* 解析内容（可展开） */}
                        <Collapse in={expandedQuestions.has(question.id)}>
                          <Box className="mt-3 p-4 bg-gray-50 rounded">
                            {question.answer && (
                              <Box className="mb-3">
                                <Typography variant="body2" className="font-medium mb-1 flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  答案
                                </Typography>
                                <Typography variant="body2" className="ml-4">
                                  {question.answer}
                                </Typography>
                              </Box>
                            )}

                            {question.analysis && (
                              <Box>
                                <Typography variant="body2" className="font-medium mb-2 flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  解析
                                </Typography>
                                <Box className="ml-4 space-y-2">
                                  <Typography variant="body2" color="text.secondary">
                                    【分析】{question.analysis.summary}
                                  </Typography>
                                  <Box>
                                    <Typography variant="body2" color="text.secondary" className="mb-1">
                                      【解答】
                                    </Typography>
                                    {question.analysis.details.map((detail, idx) => (
                                      <Typography key={idx} variant="body2" color="text.secondary" className="mb-1">
                                        {detail}
                                      </Typography>
                                    ))}
                                  </Box>
                                  {question.analysis.comment && (
                                    <Typography variant="body2" color="text.secondary">
                                      【点评】{question.analysis.comment}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </Box>
                    </Box>

                    {/* 获取按钮（非本人上传时显示） */}
                    {!question.isOwnUpload && hoveredQuestion === question.id && (
                      <Box className="absolute bottom-4 right-4">
                        <Button
                          variant="contained"
                          size="small"
                          className="bg-green-500 hover:bg-green-600"
                        >
                          获取
                        </Button>
                      </Box>
                    )}
                  </Card>
                ))}
              </Box>
            </Box>
          ) : (
            <>
              <TableContainer className="px-6">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <Box className="flex items-center gap-1">
                          资源名称
                          <Typography variant="caption" className="text-green-600">
                            ↕
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box className="flex items-center gap-1">
                          作者
                          <Typography variant="caption" className="text-green-600">
                            ↕
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box className="flex items-center gap-1">
                          更新日期
                          <Typography variant="caption" className="text-green-600">
                            ↕
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody></TableBody>
                </Table>
              </TableContainer>

              {/* 空状态显示 */}
              <Box className="flex flex-col items-center justify-center py-20">
                <Box className="w-24 h-24 mb-4 opacity-20">
                  <svg viewBox="0 0 100 100" fill="none">
                    <rect x="20" y="30" width="60" height="50" fill="#E5E7EB" rx="4" />
                    <circle cx="50" cy="50" r="15" fill="#D1D5DB" />
                  </svg>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  暂无资源
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
