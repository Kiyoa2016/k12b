import { useState } from 'react';
import {
  Box, Typography, Button, TextField, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Radio, RadioGroup, FormControlLabel,
} from '@mui/material';
import {
  ArrowBack, People, Close, Videocam,
} from '@mui/icons-material';
import desktopImage from '../../../image/电脑桌面.png';

// ─── 模拟数据 ───

interface Participant {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  online: boolean;
}

interface QuizData {
  question: string;
  options: string[];
  correctAnswer?: string;
}

const mockClassroom = {
  id: 'c1',
  name: '函数与极限',
  teacher: '张老师',
  subject: '数学',
};

const mockParticipants: Participant[] = [
  { id: '1', name: '张老师', role: 'teacher', online: true },
  { id: '2', name: '李明', role: 'student', online: true },
  { id: '3', name: '王芳', role: 'student', online: true },
  { id: '4', name: '赵强', role: 'student', online: true },
  { id: '5', name: '刘洋', role: 'student', online: false },
];

enum Stage { Join, Viewing }

export default function StudentClassroom() {
  const [stage, setStage] = useState(Stage.Join);
  const [studentName, setStudentName] = useState('');
  const [memberOpen, setMemberOpen] = useState(false);

  // 答题
  const [quizVisible, setQuizVisible] = useState(false);
  const [quizStage, setQuizStage] = useState<'answer' | 'result'>('answer');
  const [selectedOption, setSelectedOption] = useState('');
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const totalVotes = Object.values(userVotes).reduce((a, b) => a + b, 0);

  const mockQuiz: QuizData = {
    question: '请问函数 y=x² 的图像是？',
    options: ['直线', '抛物线', '双曲线'],
    correctAnswer: '抛物线',
  };

  const handleJoin = () => {
    if (!studentName.trim()) return;
    setStage(Stage.Viewing);
    // 模拟：5 秒后老师发起答题
    setTimeout(() => {
      setQuizVisible(true);
      setQuizStage('answer');
      setSelectedOption('');
    }, 5000);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption) return;
    const votes: Record<string, number> = {};
    mockQuiz.options.forEach(o => {
      votes[o] = Math.floor(Math.random() * 8) + 1;
    });
    // 确保选中选项有一定票数
    votes[selectedOption] = Math.max(votes[selectedOption] || 0, 5);
    setUserVotes(votes);
    setQuizStage('result');
  };

  // ── 加入页面 ──
  if (stage === Stage.Join) {
    return (
      <Box className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Box className="w-full max-w-sm">
          {/* 返回 */}
          <Button startIcon={<ArrowBack />} className="text-gray-500 mb-8" sx={{ textTransform: 'none' }}>
            返回
          </Button>

          {/* 卡片 */}
          <Box className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col items-center gap-5">
            <Box className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Videocam className="text-blue-600" sx={{ fontSize: 32 }} />
            </Box>

            <Box className="text-center">
              <Typography variant="h5" className="font-bold">{mockClassroom.name}</Typography>
              <Typography variant="body2" color="text.secondary" className="mt-1">
                {mockClassroom.teacher} · {mockClassroom.subject}
              </Typography>
            </Box>

            <Box className="w-full pt-2">
              <Typography variant="caption" color="text.secondary" className="mb-2 block">
                请输入你的姓名
              </Typography>
              <TextField
                fullWidth size="small" placeholder="请输入你的姓名" value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </Box>

            <Button fullWidth variant="contained" size="large"
              disabled={!studentName.trim()} onClick={handleJoin}
              sx={{ borderRadius: 3, py: 1.2 }}>
              加入课堂
            </Button>
          </Box>

          <Typography variant="caption" color="text.disabled" className="block text-center mt-6">
            首次使用？扫码下载 App
          </Typography>
        </Box>
      </Box>
    );
  }

  // ── 观看页面 ──
  return (
    <Box className="min-h-screen bg-black flex flex-col relative">
      {/* 顶部栏 */}
      <Box className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent px-4 py-3 flex items-center justify-between">
        <Button size="small" startIcon={<ArrowBack />}
          onClick={() => setStage(Stage.Join)}
          className="text-white" sx={{ textTransform: 'none', color: 'white' }}>
          退出课堂
        </Button>
        <Box className="flex items-center gap-2">
          <Chip icon={<People />} label={`在线 ${mockParticipants.filter(p => p.online).length}`}
            size="small" className="text-white bg-white/20"
            onClick={() => setMemberOpen(true)}
            sx={{ color: 'white', height: 26, '& .MuiChip-icon': { color: 'white', fontSize: 14 } }} />
          <Box className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
            {studentName.charAt(0)}
          </Box>
        </Box>
      </Box>

      {/* 直播内容 */}
      <Box className="flex-1 flex items-center justify-center">
        <img src={desktopImage} alt="课堂画面"
          className="w-full h-full object-contain" />
      </Box>

      {/* 底部通知：答题 */}
      {quizVisible && quizStage === 'answer' && (
        <Box className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <Box className="bg-white rounded-xl p-4 flex items-center justify-between shadow-lg">
            <Box>
              <Typography variant="body2" className="font-medium">📝 老师发起了一个投票</Typography>
              <Typography variant="caption" color="text.secondary">{mockQuiz.question}</Typography>
            </Box>
            <Button variant="contained" size="small" onClick={() => setQuizVisible(true)}
              sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}>
              立即参与
            </Button>
          </Box>
        </Box>
      )}

      {/* 成员列表弹窗 */}
      <Dialog open={memberOpen} onClose={() => setMemberOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="border-b flex items-center justify-between">
          <Typography variant="h6">课堂成员</Typography>
          <IconButton onClick={() => setMemberOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box className="py-2 flex flex-col gap-1">
            {mockParticipants.map(p => (
              <Box key={p.id} className="flex items-center gap-3 py-2">
                <Box className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  p.role === 'teacher' ? 'bg-blue-500' : 'bg-gray-400'
                }`}>
                  {p.name.charAt(0)}
                </Box>
                <Box className="min-w-0 flex-1">
                  <Typography variant="body2" className="font-medium">{p.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {p.role === 'teacher' ? '教师' : '学生'} {p.online ? '· 在线' : '· 离线'}
                  </Typography>
                </Box>
                {p.role === 'teacher' && (
                  <Chip label="教师" size="small" color="primary"
                    sx={{ height: 18, '& .MuiChip-label': { px: 0.4, fontSize: 9 } }} />
                )}
                <Box className={`w-2 h-2 rounded-full ${p.online ? 'bg-green-500' : 'bg-gray-300'}`} />
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      {/* 答题弹窗 */}
      <Dialog open={quizVisible && quizStage === 'answer'} onClose={() => setQuizVisible(false)}
        maxWidth="xs" fullWidth PaperProps={{ className: 'rounded-2xl' }}>
        <DialogTitle className="border-b flex items-center justify-between">
          <Typography variant="h6">❓ 答题器</Typography>
          <IconButton onClick={() => setQuizVisible(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box className="py-4">
            <Typography variant="body1" className="font-medium mb-4">{mockQuiz.question}</Typography>
            <RadioGroup value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)}>
              {mockQuiz.options.map((opt, i) => (
                <FormControlLabel key={opt} value={opt}
                  control={<Radio />}
                  label={`${String.fromCharCode(65 + i)}. ${opt}`}
                  className="mb-1 py-1 px-2 rounded-lg hover:bg-gray-50"
                />
              ))}
            </RadioGroup>
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setQuizVisible(false)} variant="outlined">关闭</Button>
          <Button onClick={handleSubmitAnswer} variant="contained" disabled={!selectedOption}>
            提交答案
          </Button>
        </DialogActions>
      </Dialog>

      {/* 结果弹窗 */}
      <Dialog open={quizVisible && quizStage === 'result'} onClose={() => setQuizVisible(false)}
        maxWidth="xs" fullWidth PaperProps={{ className: 'rounded-2xl' }}>
        <DialogTitle className="border-b flex items-center justify-between">
          <Typography variant="h6">📊 答题结果</Typography>
          <IconButton onClick={() => setQuizVisible(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box className="py-4">
            <Typography variant="body2" className="font-medium mb-1">{mockQuiz.question}</Typography>
            <Typography variant="caption" color="primary" className="block mb-4">
              {selectedOption === mockQuiz.correctAnswer ? '✅ 回答正确' : `❌ 正确答案：${mockQuiz.correctAnswer}`}
            </Typography>
            {Object.entries(userVotes).map(([opt, count]) => {
              const max = Math.max(...Object.values(userVotes), 1);
              const pct = max > 0 ? Math.round(count / totalVotes * 100) : 0;
              return (
                <Box key={opt} className="mb-2">
                  <Box className="flex justify-between text-xs mb-0.5">
                    <Typography variant="caption" className={opt === selectedOption ? 'font-bold text-blue-600' : ''}>
                      {opt} {opt === selectedOption && '（你的选择）'}
                    </Typography>
                    <Typography variant="caption" className="font-mono">{pct}%</Typography>
                  </Box>
                  <Box className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <Box className={`h-full rounded-full transition-all ${
                      opt === mockQuiz.correctAnswer ? 'bg-green-500' : 'bg-blue-400'
                    }`} sx={{ width: `${Math.round(count / max * 100)}%` }} />
                  </Box>
                </Box>
              );
            })}
            <Typography variant="caption" color="text.secondary">共 {totalVotes} 人参与</Typography>
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setQuizVisible(false)} variant="outlined">关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 等待状态 */}
      {false && (
        <Box className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <Typography variant="h6" className="text-white">等待老师开始上课...</Typography>
        </Box>
      )}
    </Box>
  );
}
