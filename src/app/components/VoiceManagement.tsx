import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Tabs, Tab, Card, CardContent,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Chip, Avatar, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions, InputAdornment, IconButton,
  Snackbar, Alert, Switch, FormControlLabel,
} from '@mui/material';
import {
  Settings, Mic, Book, BarChart, VolumeUp,
  Search, Add, Delete, Edit,
  Close, Upload, Download, CheckCircle, Warning, Info,
} from '@mui/icons-material';

/* ============================================================
   Mock Data
   ============================================================ */
const MOCK_COMMANDS = [
  { id: '1', text: '下一页', category: '课件控制', param: '—', enabled: true },
  { id: '2', text: '翻到第 N 页', category: '课件控制', param: '页码', enabled: true },
  { id: '3', text: '打开 [目标]', category: '系统操作', param: '应用/文件/网页', enabled: true, flex: true },
  { id: '4', text: '随机点一名同学', category: '课堂互动', param: '—', enabled: true },
  { id: '5', text: '第一组加 1 分', category: '课堂互动', param: '组别/分数', enabled: true },
  { id: '6', text: '搜索 [关键词]', category: '语音搜索', param: '关键词', enabled: false },
  { id: '7', text: '开始计时 N 分钟', category: '教学工具', param: '1-60', enabled: true },
  { id: '8', text: '画笔 / 红色笔', category: '板书控制', param: '颜色', enabled: true },
  { id: '9', text: '播放 / 暂停', category: '多媒体', param: '—', enabled: true },
  { id: '10', text: '音量调到 50%', category: '多媒体', param: '百分比', enabled: true },
];

const MOCK_LOGS = [
  { time: '09:32:15', teacher: '彭浩', raw: '下一页', category: '课件控制', result: '下一页', status: 'success', detail: '已翻页' },
  { time: '09:35:42', teacher: '彭浩', raw: '打开勾股定理', category: '系统操作', result: '勾股定理课件', status: 'success', detail: '已打开课件' },
  { time: '09:38:03', teacher: '王剑川', raw: '随机来一个同学', category: '课堂互动', result: '随机点一名同学', status: 'success', detail: '已点名：张三' },
  { time: '09:42:18', teacher: '汪鑫', raw: '狗骨定理的课件', category: '语音搜索', result: '勾股定理 ✓', status: 'corrected', detail: '已打开课件' },
  { time: '09:45:50', teacher: '王显平', raw: '开始三分钟', category: '教学工具', result: '未匹配', status: 'failed', detail: '—' },
  { time: '09:48:12', teacher: '郭叮洪', raw: '第一组加一分', category: '课堂互动', result: '第一组加1分', status: 'success', detail: '积分已更新' },
];

const MOCK_VOCABULARY = [
  { word: '勾股定理', pinyin: 'Gougu Theorem', subject: '数学', level: '初中' },
  { word: '光合作用', pinyin: 'Photosynthesis', subject: '生物', level: '初中' },
  { word: '二次函数 y=ax²+bx+c', pinyin: '', subject: '数学', level: '初中' },
  { word: '将进酒·君不见', pinyin: '', subject: '语文', level: '高中' },
  { word: '牛顿第二定律', pinyin: "Newton's Second Law", subject: '物理', level: '高中' },
  { word: '现在完成时', pinyin: '', subject: '英语', level: '初中' },
];

const COMMAND_CATEGORIES = ['课件控制', '板书控制', '教学工具', '多媒体', '课堂互动', '系统操作', '语音搜索'];

/* ============================================================
   Tab Panel Helper
   ============================================================ */
function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;
}

/* ============================================================
   Main Component
   ============================================================ */
export default function VoiceManagement() {
  const [tabValue, setTabValue] = useState(0);
  const [noteOpen, setNoteOpen] = useState(false);

  return (
    <>
    <Box className="p-6 pb-16">
      {/* 标题栏 */}
      <Box className="mb-6 flex items-center justify-between">
        <Box>
          <Typography variant="h5" className="font-bold">语音管理</Typography>
          <Typography variant="body2" color="text.secondary" className="mt-1">
            配置语音唤醒、指令、词库与统计分析
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Box className="mb-4 border-b border-gray-200">
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab icon={<Settings fontSize="small" />} label="基础配置" iconPosition="start" />
          <Tab icon={<Mic fontSize="small" />} label="指令管理" iconPosition="start" />
          <Tab icon={<Book fontSize="small" />} label="词库管理" iconPosition="start" />
          <Tab icon={<BarChart fontSize="small" />} label="日志统计" iconPosition="start" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}><BasicConfig /></TabPanel>
      <TabPanel value={tabValue} index={1}><CommandMgmt /></TabPanel>
      <TabPanel value={tabValue} index={2}><VocabularyMgmt /></TabPanel>
      <TabPanel value={tabValue} index={3}><LogStats /></TabPanel>
    </Box>

      {/* 悬浮说明按钮 */}
      <IconButton
        onClick={() => setNoteOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: 'primary.main',
          color: 'white',
          width: 48,
          height: 48,
          zIndex: 1100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          '&:hover': { bgcolor: 'primary.dark' },
        }}
      >
        <Info />
      </IconButton>

      {/* 页面说明弹窗 */}
      <Dialog open={noteOpen} onClose={() => setNoteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <Info fontSize="small" />
            <Typography variant="subtitle1" className="font-semibold">页面说明</Typography>
          </Box>
          <IconButton size="small" onClick={() => setNoteOpen(false)}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="text.secondary" className="block mb-4">
            当前页面为交互原型，以下标注了各模块的数据状态与交互完成情况。
          </Typography>

          {[
            { tab: '基础配置', icon: '⚙️', items: [
              '唤醒词、唤醒回复的编辑和重置交互已完成',
              '唤醒词"测试"按钮为 UI 示意，未接入真实语音引擎',
              '数据为本地 React 状态（useState），刷新后重置',
            ]},
            { tab: '指令管理', icon: '🎤', items: [
              '选择、全选、批量启用/禁用、新增指令的交互流程已完成',
              '指令数据为 Mock 数据，刷新后恢复初始状态',
              '分类管理弹窗中的删除分类功能为 UI 示意',
              '自定义指令映射已移除',
            ]},
            { tab: '词库管理', icon: '📖', items: [
              '全部为展示性内容，无数据接入',
              '词条表格、热词、纠偏建议均为 Mock 数据',
              'Tab 切换、搜索框、筛选下拉框为 UI 示意',
            ]},
            { tab: '日志统计', icon: '📊', items: [
              '全部为展示性内容，无数据接入',
              '统计卡片、趋势图、TOP 5、日志表格均为 Mock 数据',
              '筛选条件、导出按钮为 UI 示意',
            ]},
          ].map(section => (
            <Box key={section.tab} className="mb-4">
              <Typography variant="subtitle2" className="font-semibold mb-1">
                {section.icon} {section.tab}
              </Typography>
              <ul className="list-disc list-inside space-y-0.5">
                {section.items.map((item, i) => (
                  <li key={i}>
                    <Typography variant="caption" color="text.secondary">{item}</Typography>
                  </li>
                ))}
              </ul>
            </Box>
          ))}
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button variant="contained" onClick={() => setNoteOpen(false)}>知道了</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/* ============================================================
   Tab 1: Basic Config
   ============================================================ */
function BasicConfig() {
  const [wakeWord, setWakeWord] = useState('果仁果仁');
  const [wakeResponse, setWakeResponse] = useState('我在');
  const [showDesc, setShowDesc] = useState(true);

  return (
    <Box className="max-w-3xl space-y-4">
      {/* 模块说明 */}
      {showDesc && (
      <Card variant="outlined" className="rounded-xl bg-blue-50/50 border-blue-100">
        <CardContent className="py-3">
          <Box className="flex justify-between items-start">
            <Typography variant="body2" color="text.secondary" className="flex-1">
              配置语音唤醒的核心参数，包括唤醒词和唤醒后的回复内容。唤醒词是设备进入语音交互状态的触发口令，
              建议设置为辨识度高的 2-6 字中文。唤醒回复是设备成功唤醒后向用户播报的确认语音。
            </Typography>
            <IconButton size="small" onClick={() => setShowDesc(false)}
              className="ml-2 -mt-1 -mr-1" sx={{ color: 'text.secondary' }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
      )}

      {/* 唤醒词 */}
      <Card variant="outlined" className="rounded-xl">
        <CardContent>
          <Typography variant="subtitle1" className="font-semibold mb-3">唤醒词</Typography>
          <Box className="flex items-center gap-3">
            <TextField size="small" value={wakeWord}
              onChange={e => setWakeWord(e.target.value)} className="w-48" />
            <Button variant="outlined" size="small" startIcon={<VolumeUp />}>测试</Button>
            <Button variant="text" size="small" onClick={() => setWakeWord('果仁果仁')}>重置默认</Button>
          </Box>
          <Typography variant="caption" color="text.secondary" className="mt-1 block">
            建议使用 2-6 个中文汉字，避免常见词汇
          </Typography>
        </CardContent>
      </Card>

      {/* 唤醒回复 */}
      <Card variant="outlined" className="rounded-xl">
        <CardContent>
          <Typography variant="subtitle1" className="font-semibold mb-3">唤醒回复</Typography>
          <Box className="flex items-center gap-3">
            <TextField size="small" value={wakeResponse}
              onChange={e => setWakeResponse(e.target.value)}
              className="w-48" placeholder="如：我在" />
            <Button variant="text" size="small" onClick={() => setWakeResponse('我在')}>重置默认</Button>
          </Box>
          <Typography variant="caption" color="text.secondary" className="mt-1 block">
            设备被唤醒后的语音播报内容，留空则不播报
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

/* ============================================================
   Tab 2: Command Management
   ============================================================ */
function CommandMgmt() {
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [manageOpen, setManageOpen] = useState(false);
  const [categories, setCategories] = useState(COMMAND_CATEGORIES);
  const [newCat, setNewCat] = useState('');
  const [commands, setCommands] = useState(MOCK_COMMANDS);
  const [searchText, setSearchText] = useState('');
  const [showDesc, setShowDesc] = useState(true);

  // 多选状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 批量操作确认弹窗
  const [batchAction, setBatchAction] = useState<'enable' | 'disable' | null>(null);

  // 新增指令弹窗
  const [addOpen, setAddOpen] = useState(false);
  const initCmdForm = () => ({ text: '', category: categories[0] || '', param: '', flex: false });
  const [cmdForm, setCmdForm] = useState(initCmdForm());

  // Snackbar 反馈
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'warning' | 'info' }>(
    { open: false, message: '', severity: 'success' }
  );

  // ---- 筛选 ----
  const filtered = commands.filter(c => {
    const matchCategory = categoryFilter === '全部' || c.category === categoryFilter;
    const matchSearch = !searchText || c.text.toLowerCase().includes(searchText.toLowerCase());
    return matchCategory && matchSearch;
  });

  // ---- 多选 ----
  const allFilteredSelected = filtered.length > 0 && filtered.every(c => selectedIds.has(c.id));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filtered.forEach(c => allFilteredSelected ? next.delete(c.id) : next.add(c.id));
      return next;
    });
  };

  // ---- 单条切换启用/禁用 ----
  const toggleSingle = (id: string) => {
    setCommands(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  };

  // ---- 批量操作 ----
  const executeBatchAction = () => {
    if (!batchAction) return;
    const enable = batchAction === 'enable';
    setCommands(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, enabled: enable } : c));
    const count = selectedIds.size;
    setSelectedIds(new Set());
    setBatchAction(null);
    setSnackbar({ open: true, message: `已批量${enable ? '启用' : '禁用'} ${count} 条指令`, severity: 'success' });
  };

  // ---- 新增指令 ----
  const handleAddCommand = () => {
    if (!cmdForm.text.trim()) return;
    const newCmd = {
      id: `cmd-${Date.now()}`,
      text: cmdForm.text.trim(),
      category: cmdForm.category || '未分类',
      param: cmdForm.param || '—',
      enabled: true,
      flex: cmdForm.flex,
    };
    setCommands(prev => [...prev, newCmd]);
    setCmdForm(initCmdForm());
    setAddOpen(false);
    setSnackbar({ open: true, message: `指令「${newCmd.text}」已添加`, severity: 'success' });
  };

  return (
    <Box>
      {/* 模块说明 */}
      {showDesc && (
      <Card variant="outlined" className="rounded-xl mb-6 bg-blue-50/50 border-blue-100">
        <CardContent className="py-3">
          <Box className="flex justify-between items-start">
            <Typography variant="body2" color="text.secondary" className="flex-1">
              管理设备可识别的全部语音指令。每条指令归属于一个类别，支持按类别筛选和搜索。
              可单独启用/禁用某条指令，也可批量操作。新增指令时需指定指令文本和所属类别，
              并可配置参数说明及是否为灵活参数模式（由系统动态解析参数内容）。
            </Typography>
            <IconButton size="small" onClick={() => setShowDesc(false)}
              className="ml-2 -mt-1 -mr-1" sx={{ color: 'text.secondary' }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
      )}

      {/* ========== 操作栏 ========== */}
      <Box className="mb-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <TextField
          size="small"
          placeholder="搜索指令..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="w-full md:w-64"
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" className="text-gray-400" /></InputAdornment> }}
        />
        <Box className="flex gap-2 items-center">
          <Button size="small" variant="outlined" startIcon={<CheckCircle />}
            disabled={selectedIds.size === 0}
            onClick={() => setBatchAction('enable')}>
            批量启用
          </Button>
          <Button size="small" variant="outlined" startIcon={<Close />}
            disabled={selectedIds.size === 0}
            onClick={() => setBatchAction('disable')}>
            批量禁用
          </Button>
          {selectedIds.size > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              已选 {selectedIds.size} 项
            </Typography>
          )}
          <Button size="small" variant="contained" startIcon={<Add />}
            onClick={() => { setCmdForm(initCmdForm()); setAddOpen(true); }}>
            新增指令
          </Button>
        </Box>
      </Box>

      {/* ========== 分类筛选 ========== */}
      <Box className="mb-4 flex flex-wrap items-center gap-2">
        <Typography variant="caption" color="text.secondary" className="mr-1">分类：</Typography>
        <Chip label="全部" size="small" onClick={() => setCategoryFilter('全部')}
          color={categoryFilter === '全部' ? 'primary' : 'default'}
          variant={categoryFilter === '全部' ? 'filled' : 'outlined'} />
        {categories.map(cat => (
          <Chip key={cat} label={cat} size="small" onClick={() => setCategoryFilter(cat)}
            color={categoryFilter === cat ? 'primary' : 'default'}
            variant={categoryFilter === cat ? 'filled' : 'outlined'} />
        ))}
        <Button size="small" variant="text" onClick={() => setManageOpen(true)} sx={{ fontSize: 12 }}>
          管理分类
        </Button>
      </Box>

      {/* ========== 分类管理弹窗 ========== */}
      <Dialog open={manageOpen} onClose={() => setManageOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="flex items-center justify-between">
          <Typography variant="subtitle1" className="font-semibold">管理指令分类</Typography>
          <IconButton size="small" onClick={() => setManageOpen(false)}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box className="flex flex-wrap gap-2 mb-3">
            {categories.map(cat => (
              <Chip key={cat} label={cat} onDelete={() => setCategories(prev => prev.filter(c => c !== cat))} variant="outlined" />
            ))}
          </Box>
          <Box className="flex gap-2">
            <TextField size="small" placeholder="新分类名称" value={newCat} onChange={e => setNewCat(e.target.value)} className="flex-1" />
            <Button variant="contained" size="small" disabled={!newCat.trim()}
              onClick={() => { if (newCat.trim() && !categories.includes(newCat.trim())) { setCategories(prev => [...prev, newCat.trim()]); setNewCat(''); } }}>
              添加
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" className="mt-2 block">
            💡 删除分类不会删除指令，指令会移至"未分类"
          </Typography>
        </DialogContent>
        <DialogActions><Button onClick={() => setManageOpen(false)}>完成</Button></DialogActions>
      </Dialog>

      {/* ========== 批量操作确认弹窗 ========== */}
      <Dialog open={batchAction !== null} onClose={() => setBatchAction(null)} maxWidth="xs" fullWidth>
        <DialogContent className="pt-6">
          <Box className="text-center">
            <Warning className="text-5xl text-amber-500 mb-3" />
            <Typography variant="h6" className="font-semibold mb-1">
              {batchAction === 'enable' ? '批量启用' : '批量禁用'}指令
            </Typography>
            <Typography variant="body2" color="text.secondary">
              确定要批量{batchAction === 'enable' ? '启用' : '禁用'}选中的 <strong>{selectedIds.size}</strong> 条指令吗？
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions className="justify-center pb-4">
          <Button variant="outlined" onClick={() => setBatchAction(null)}>取消</Button>
          <Button variant="contained"
            color={batchAction === 'enable' ? 'primary' : 'error'}
            onClick={executeBatchAction}>
            确认{batchAction === 'enable' ? '启用' : '禁用'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========== 新增指令弹窗 ========== */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="flex items-center justify-between">
          <Typography variant="subtitle1" className="font-semibold">新增指令</Typography>
          <IconButton size="small" onClick={() => setAddOpen(false)}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box className="flex flex-col gap-4 pt-2">
            {/* 指令文本 */}
            <TextField label="指令文本" placeholder="如：打开课件" required fullWidth size="small"
              value={cmdForm.text}
              onChange={e => setCmdForm(prev => ({ ...prev, text: e.target.value }))}
              helperText="教师说出该指令时触发的操作" />

            {/* 类别 */}
            <FormControl size="small" fullWidth required>
              <InputLabel>指令类别</InputLabel>
              <Select label="指令类别" value={cmdForm.category}
                onChange={e => setCmdForm(prev => ({ ...prev, category: e.target.value }))}>
                {categories.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
                <MenuItem value="未分类">未分类</MenuItem>
              </Select>
            </FormControl>

            {/* 参数说明 */}
            <TextField label="参数说明" placeholder="如：页码" fullWidth size="small"
              value={cmdForm.param}
              onChange={e => setCmdForm(prev => ({ ...prev, param: e.target.value }))}
              helperText="指令需要的参数，没有则留空" />

            {/* 灵活参数 */}
            <FormControlLabel
              control={
                <Switch checked={cmdForm.flex}
                  onChange={e => setCmdForm(prev => ({ ...prev, flex: e.target.checked }))} />
              }
              label={
                <Box>
                  <Typography variant="body2">灵活参数</Typography>
                  <Typography variant="caption" color="text.secondary">
                    开启后参数部分由 NLU 动态解析，不做穷举匹配
                  </Typography>
                </Box>
              }
            />
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button variant="outlined" onClick={() => setAddOpen(false)}>取消</Button>
          <Button variant="contained" disabled={!cmdForm.text.trim()}
            onClick={handleAddCommand}>保存</Button>
        </DialogActions>
      </Dialog>

      {/* ========== 指令表格 ========== */}
      <TableContainer component={Paper} variant="outlined" className="rounded-xl">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ width: 40 }}>
                <input type="checkbox" checked={allFilteredSelected}
                  onChange={toggleSelectAll} className="w-4 h-4" />
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>指令</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>类别</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>参数</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 120 }}>状态</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Typography variant="body2" color="text.secondary">
                    {searchText ? '没有匹配的指令' : '暂无指令，点击"新增指令"添加'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filtered.map(cmd => (
              <TableRow key={cmd.id} hover selected={selectedIds.has(cmd.id)}>
                <TableCell padding="checkbox">
                  <input type="checkbox" checked={selectedIds.has(cmd.id)}
                    onChange={() => toggleSelect(cmd.id)} className="w-4 h-4" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" className="font-medium">
                    {cmd.text}
                  </Typography>
                  {cmd.flex && (
                    <Chip label="灵活参数" size="small" color="warning" variant="outlined"
                      sx={{ height: 18, fontSize: 10, ml: 1 }} />
                  )}
                </TableCell>
                <TableCell>
                  <Chip label={cmd.category} size="small" variant="outlined"
                    sx={{ height: 22, fontSize: 11 }} />
                </TableCell>
                <TableCell><Typography variant="caption" color="text.secondary">{cmd.param}</Typography></TableCell>
                <TableCell>
                  <Chip
                    label={cmd.enabled ? '已启用' : '已禁用'}
                    size="small"
                    color={cmd.enabled ? 'success' : 'default'}
                    variant="outlined"
                    onClick={() => toggleSingle(cmd.id)}
                    sx={{ height: 22, fontSize: 11, cursor: 'pointer' }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ========== 操作反馈 Snackbar ========== */}
      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled"
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

/* ============================================================
   Tab 3: Vocabulary Management
   ============================================================ */
function VocabularyMgmt() {
  const [vocabTab, setVocabTab] = useState(0);
  const [showDesc, setShowDesc] = useState(true);
  const VOCAB_CATEGORIES_INITIAL = ['学科术语', '教材词库', '自定义词库'];
  const SYSTEM_VOCAB_CATEGORIES = ['课件索引'];
  const [vocabCategories, setVocabCategories] = useState(VOCAB_CATEGORIES_INITIAL);
  const [vocabManageOpen, setVocabManageOpen] = useState(false);
  const [newVocabCat, setNewVocabCat] = useState('');

  const allVocabCategories = [...vocabCategories, ...SYSTEM_VOCAB_CATEGORIES];

  // 分类删除后自动校正 Tab 索引，确保不越界
  useEffect(() => {
    if (vocabTab >= allVocabCategories.length) {
      setVocabTab(Math.max(0, allVocabCategories.length - 1));
    }
  }, [allVocabCategories.length, vocabTab]);

  // ---- 词条数据 ----
  const [vocabularies, setVocabularies] = useState(MOCK_VOCABULARY);
  const [searchVocab, setSearchVocab] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');

  // ---- 新增词条 ----
  const [addVocabOpen, setAddVocabOpen] = useState(false);
  const initVocabForm = () => ({ word: '', pinyin: '', subject: '数学', level: '初中' });
  const [vocabForm, setVocabForm] = useState(initVocabForm());

  // ---- 批量导入 ----
  const [importOpen, setImportOpen] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [importDragActive, setImportDragActive] = useState(false);

  // ---- 筛选 ----
  const filteredVocab = vocabularies.filter(v => {
    const matchSearch = !searchVocab || v.word.includes(searchVocab) || v.pinyin?.includes(searchVocab);
    const matchSubject = subjectFilter === 'all' || v.subject === subjectFilter;
    return matchSearch && matchSubject;
  });

  const subjects = [...new Set(vocabularies.map(v => v.subject))];
  const levels = ['初中', '高中'];

  const handleAddVocab = () => {
    if (!vocabForm.word.trim()) return;
    setVocabularies(prev => [...prev, {
      word: vocabForm.word.trim(),
      pinyin: vocabForm.pinyin.trim(),
      subject: vocabForm.subject,
      level: vocabForm.level,
    }]);
    setVocabForm(initVocabForm());
    setAddVocabOpen(false);
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      let count = 0;
      const newEntries: typeof MOCK_VOCABULARY = [];
      for (const line of lines) {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length >= 1 && parts[0]) {
          newEntries.push({
            word: parts[0],
            pinyin: parts[1] || '',
            subject: parts[2] || '其他',
            level: parts[3] || '初中',
          });
          count++;
        }
      }
      if (count > 0) {
        setVocabularies(prev => [...prev, ...newEntries]);
        setImportedCount(count);
      }
    };
    reader.readAsText(file);
  };

  const handleImportDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setImportDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImportFile(file);
  };

  return (
    <Box>
      {/* 模块说明 */}
      {showDesc && (
      <Card variant="outlined" className="rounded-xl mb-6 bg-blue-50/50 border-blue-100">
        <CardContent className="py-3">
          <Box className="flex justify-between items-start">
            <Typography variant="body2" color="text.secondary" className="flex-1">
              词库是语音识别的"字典"，用于提升特定词汇的识别准确率。预置了各学科术语和教材词库，
              支持自定义添加学校特有的词汇（如教师姓名、校本课程名），系统还会自动从课件资源库建立索引，
              并根据使用频率生成热词。词条越丰富，语音识别的准确度就越高。
            </Typography>
            <IconButton size="small" onClick={() => setShowDesc(false)}
              className="ml-2 -mt-1 -mr-1" sx={{ color: 'text.secondary' }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
      )}

      {/* 词库 Tabs */}
      <Box className="mb-4 flex items-center justify-between">
        <Tabs value={vocabTab} onChange={(_, v) => {
          if (v < allVocabCategories.length) setVocabTab(v);
        }}>
          {allVocabCategories.map((cat, i) => (
            <Tab key={cat} label={
              cat === '课件索引'
                ? <Box component="span">课件索引 <Chip label="自动" size="small" color="default" sx={{ ml: 0.5, height: 16, fontSize: 9 }} /></Box>
                : cat
            } />
          ))}
        </Tabs>
        <Button size="small" variant="text" onClick={() => setVocabManageOpen(true)} sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          管理分类
        </Button>
      </Box>

      {/* 词库分类管理弹窗 */}
      <Dialog open={vocabManageOpen} onClose={() => setVocabManageOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="flex items-center justify-between">
          <Typography variant="subtitle1" className="font-semibold">管理词库分类</Typography>
          <IconButton size="small" onClick={() => setVocabManageOpen(false)}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box className="flex flex-wrap gap-2 mb-3">
            {vocabCategories.map(cat => (
              <Chip key={cat} label={cat} onDelete={() => setVocabCategories(prev => prev.filter(c => c !== cat))} variant="outlined" />
            ))}
            {SYSTEM_VOCAB_CATEGORIES.map(cat => (
              <Chip key={cat} label={`${cat}（系统）`} variant="outlined" color="default" sx={{ opacity: 0.6 }} />
            ))}
          </Box>
          <Box className="flex gap-2">
            <TextField size="small" placeholder="新分类名称" value={newVocabCat} onChange={e => setNewVocabCat(e.target.value)} className="flex-1" />
            <Button variant="contained" size="small" disabled={!newVocabCat.trim()}
              onClick={() => {
                const name = newVocabCat.trim();
                if (name && !vocabCategories.includes(name) && !SYSTEM_VOCAB_CATEGORIES.includes(name)) {
                  setVocabCategories(prev => [...prev, name]);
                  setNewVocabCat('');
                }
              }}>
              添加
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" className="mt-2 block">
            💡 课件索引为系统分类，不可删除
          </Typography>
        </DialogContent>
        <DialogActions><Button onClick={() => setVocabManageOpen(false)}>完成</Button></DialogActions>
      </Dialog>

      {/* 操作栏 */}
      <Box className="mb-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <Box className="flex gap-2">
          <TextField size="small" placeholder="搜索词条..." className="w-56"
            value={searchVocab}
            onChange={e => setSearchVocab(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" className="text-gray-400" /></InputAdornment> }} />
          <FormControl size="small" className="w-28">
            <Select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
              <MenuItem value="all">全部学科</MenuItem>
              {subjects.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <Box className="flex gap-2">
          <Button size="small" variant="outlined" startIcon={<Upload />} onClick={() => { setImportedCount(0); setImportOpen(true); }}>
            批量导入
          </Button>
          <Button size="small" variant="contained" startIcon={<Add />}
            onClick={() => { setVocabForm(initVocabForm()); setAddVocabOpen(true); }}>
            新增词条
          </Button>
        </Box>
      </Box>

      {/* ========== 新增词条弹窗 ========== */}
      <Dialog open={addVocabOpen} onClose={() => setAddVocabOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="flex items-center justify-between">
          <Typography variant="subtitle1" className="font-semibold">新增词条</Typography>
          <IconButton size="small" onClick={() => setAddVocabOpen(false)}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box className="flex flex-col gap-4 pt-2">
            <TextField label="词条" placeholder="如：勾股定理" required fullWidth size="small"
              value={vocabForm.word}
              onChange={e => setVocabForm(prev => ({ ...prev, word: e.target.value }))}
              helperText="需要提升识别率的词汇" />

            <TextField label="拼音/英文" placeholder="可选，如：Gougu Theorem" fullWidth size="small"
              value={vocabForm.pinyin}
              onChange={e => setVocabForm(prev => ({ ...prev, pinyin: e.target.value }))} />

            <Box className="grid grid-cols-2 gap-4">
              <FormControl size="small" fullWidth required>
                <InputLabel>学科</InputLabel>
                <Select value={vocabForm.subject} label="学科"
                  onChange={e => setVocabForm(prev => ({ ...prev, subject: e.target.value }))}>
                  {subjects.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  <MenuItem value="其他">其他</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth required>
                <InputLabel>学段</InputLabel>
                <Select value={vocabForm.level} label="学段"
                  onChange={e => setVocabForm(prev => ({ ...prev, level: e.target.value }))}>
                  {levels.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button variant="outlined" onClick={() => setAddVocabOpen(false)}>取消</Button>
          <Button variant="contained" disabled={!vocabForm.word.trim()} onClick={handleAddVocab}>保存</Button>
        </DialogActions>
      </Dialog>

      {/* ========== 批量导入弹窗 ========== */}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <Upload fontSize="small" />
            <Typography variant="subtitle1" className="font-semibold">批量导入词条</Typography>
          </Box>
          <IconButton size="small" onClick={() => setImportOpen(false)}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent>
          {importedCount > 0 ? (
            /* 导入成功 */
            <Box className="text-center py-8">
              <CheckCircle className="text-5xl text-green-500 mb-4" />
              <Typography variant="h6" className="font-semibold mb-1">导入完成</Typography>
              <Typography variant="body2" color="text.secondary">
                成功导入 <strong>{importedCount}</strong> 条词条
              </Typography>
            </Box>
          ) : (
            /* 导入表单 */
            <Box className="flex flex-col gap-4 pt-2">
              <Typography variant="body2" color="text.secondary">
                支持 CSV / TXT 格式，每行一条词条，按<strong>词条,拼音,学科,学段</strong>顺序排列（学科和学段可选）。
              </Typography>

              <Box
                onDragEnter={e => { e.preventDefault(); setImportDragActive(true); }}
                onDragLeave={() => setImportDragActive(false)}
                onDragOver={e => e.preventDefault()}
                onDrop={handleImportDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  importDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
                onClick={() => document.getElementById('import-file-input')?.click()}
              >
                <Upload className={`text-5xl mb-3 ${importDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                <Typography variant="body1" className="mb-1 font-medium">拖拽文件到此处</Typography>
                <Typography variant="body2" color="text.secondary" className="mb-3">或者</Typography>
                <Button variant="contained" size="small">选择文件</Button>
                <Typography variant="caption" color="text.secondary" className="mt-3 block">
                  支持 .csv 和 .txt 格式
                </Typography>
                <input id="import-file-input" type="file" hidden accept=".csv,.txt"
                  onChange={e => { if (e.target.files?.[0]) handleImportFile(e.target.files[0]); }} />
              </Box>

              <Typography variant="caption" color="text.secondary">
                💡 示例格式：<br />
                <code className="bg-gray-100 px-1 rounded">勾股定理,Gougu Theorem,数学,初中</code><br />
                <code className="bg-gray-100 px-1 rounded">光合作用,,生物,初中</code>
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          {importedCount > 0 ? (
            <Button variant="contained" onClick={() => setImportOpen(false)}>完成</Button>
          ) : (
            <Button variant="outlined" onClick={() => setImportOpen(false)}>取消</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ========== 词条表格 ========== */}
      <TableContainer component={Paper} variant="outlined" className="rounded-xl">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>词条</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>拼音/英文</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>学科</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>学段</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 100 }}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVocab.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Typography variant="body2" color="text.secondary">
                    {searchVocab ? '没有匹配的词条' : '暂无词条，点击"新增词条"添加'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredVocab.map((v, i) => (
              <TableRow key={`${v.word}-${i}`} hover>
                <TableCell><Typography variant="body2" className="font-medium">{v.word}</Typography></TableCell>
                <TableCell><Typography variant="caption" color="text.secondary">{v.pinyin || '—'}</Typography></TableCell>
                <TableCell><Chip label={v.subject} size="small" variant="outlined" sx={{ height: 20, fontSize: 10 }} /></TableCell>
                <TableCell><Typography variant="caption" color="text.secondary">{v.level}</Typography></TableCell>
                <TableCell>
                  <IconButton size="small"><Edit fontSize="small" /></IconButton>
                  <IconButton size="small"><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 词条计数 */}
      <Box className="mt-3">
        <Typography variant="caption" color="text.secondary">
          共 {vocabularies.length} 条词条，当前显示 {filteredVocab.length} 条
        </Typography>
      </Box>
    </Box>
  );
}

/* ============================================================
   Tab 4: Logs & Statistics
   ============================================================ */
function LogStats() {
  const [showDesc, setShowDesc] = useState(true);
  const statusChip = (s: string) => {
    if (s === 'success') return <Chip label="成功" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: 10 }} />;
    if (s === 'corrected') return <Chip label="已纠偏" size="small" color="warning" variant="outlined" sx={{ height: 20, fontSize: 10 }} />;
    return <Chip label="未识别" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: 10 }} />;
  };

  return (
    <Box>
      {/* 模块说明 */}
      {showDesc && (
      <Card variant="outlined" className="rounded-xl mb-6 bg-blue-50/50 border-blue-100">
        <CardContent className="py-3">
          <Box className="flex justify-between items-start">
            <Typography variant="body2" color="text.secondary" className="flex-1">
              查看语音指令的使用情况和执行日志。统计数据反映整体的使用活跃度和识别/执行质量，
              趋势图和 TOP 5 指令帮助了解教师的使用习惯。日志明细可按时间、教师、状态筛选，
              用于排查识别失败原因和优化词库。
            </Typography>
            <IconButton size="small" onClick={() => setShowDesc(false)}
              className="ml-2 -mt-1 -mr-1" sx={{ color: 'text.secondary' }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
      )}

      {/* 统计卡片 */}
      <Box className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: '今日指令', value: '1,284', trend: '↑ 12%', trendColor: 'text-green-600' },
          { label: '唤醒率', value: '94.2%', trend: '↑ 2.1%', trendColor: 'text-green-600' },
          { label: '识别成功率', value: '88.6%', trend: '→ 持平', trendColor: 'text-amber-600' },
          { label: '执行成功率', value: '97.3%', trend: '↑ 0.5%', trendColor: 'text-green-600' },
          { label: '活跃教师', value: '42', trend: '/ 68 人', trendColor: 'text-gray-500' },
        ].map(s => (
          <Card key={s.label} variant="outlined" className="rounded-xl">
            <CardContent className="py-2">
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              <Typography variant="h5" className="font-bold">{s.value}</Typography>
              <Typography variant="caption" className={s.trendColor}>{s.trend}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* 趋势图 + TOP5 */}
      <Box className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card variant="outlined" className="rounded-xl md:col-span-2">
          <CardContent>
            <Box className="flex justify-between items-center mb-3">
              <Typography variant="subtitle2" className="font-semibold">指令使用趋势（近 7 天）</Typography>
              <Box className="flex gap-1">
                <Chip label="本周" size="small" color="primary" />
                <Chip label="本月" size="small" variant="outlined" />
              </Box>
            </Box>
            <Box className="flex items-end gap-2 h-28">
              {[
                { day: '周一', v: 80 }, { day: '周二', v: 100 }, { day: '周三', v: 95 },
                { day: '周四', v: 110 }, { day: '周五', v: 70 }, { day: '周六', v: 40 }, { day: '周日', v: 45 },
              ].map(d => (
                <Box key={d.day} className="flex-1 flex flex-col items-center">
                  <Box className="w-full rounded-t" sx={{ height: d.v, bgcolor: d.v > 60 ? '#3b82f6' : '#93c5fd' }} />
                  <Typography variant="caption" color="text.secondary" className="mt-1">{d.day}</Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined" className="rounded-xl">
          <CardContent>
            <Typography variant="subtitle2" className="font-semibold mb-3">🏆 指令 TOP 5</Typography>
            <Box className="space-y-2">
              {[
                { rank: 1, name: '下一页', count: 356 },
                { rank: 2, name: '打开课件', count: 218 },
                { rank: 3, name: '随机点名', count: 167 },
                { rank: 4, name: '暂停', count: 132 },
                { rank: 5, name: '音量调大', count: 98 },
              ].map(item => (
                <Box key={item.rank} className="flex items-center gap-2">
                  <Avatar sx={{ width: 22, height: 22, bgcolor: item.rank === 1 ? '#3b82f6' : '#94a3b8', fontSize: 11, color: 'white' }}>
                    {item.rank}
                  </Avatar>
                  <Typography variant="body2" className="flex-1">{item.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.count} 次</Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* 日志筛选 */}
      <Box className="mb-4 flex flex-col md:flex-row gap-3 items-start md:items-center">
        <TextField size="small" placeholder="搜索指令原文..." className="w-full md:w-52"
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" className="text-gray-400" /></InputAdornment> }} />
        <TextField size="small" type="date" className="w-36" defaultValue="2026-06-11" />
        <FormControl size="small" className="w-28">
          <Select defaultValue="all">
            <MenuItem value="all">全部教师</MenuItem>
            <MenuItem value="ph">彭浩</MenuItem>
            <MenuItem value="wj">王剑川</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" className="w-28">
          <Select defaultValue="all">
            <MenuItem value="all">全部状态</MenuItem>
            <MenuItem value="success">成功</MenuItem>
            <MenuItem value="failed">未识别</MenuItem>
          </Select>
        </FormControl>
        <Button size="small" variant="outlined" startIcon={<Download />}>导出</Button>
      </Box>

      {/* 日志表格 */}
      <TableContainer component={Paper} variant="outlined" className="rounded-xl">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>时间</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>教师</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>指令原文</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>分类</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>识别结果</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>状态</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>执行结果</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {MOCK_LOGS.map((log, i) => (
              <TableRow key={i} hover>
                <TableCell><Typography variant="caption">{log.time}</Typography></TableCell>
                <TableCell><Typography variant="body2">{log.teacher}</Typography></TableCell>
                <TableCell><Typography variant="caption" className="font-mono">"{log.raw}"</Typography></TableCell>
                <TableCell>
                  <Chip label={log.category} size="small" variant="outlined"
                    sx={{ height: 20, fontSize: 10 }} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" className={log.status === 'failed' ? 'text-red-600' : ''}>{log.result}</Typography>
                </TableCell>
                <TableCell>{statusChip(log.status)}</TableCell>
                <TableCell><Typography variant="caption" color="text.secondary">{log.detail}</Typography></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
