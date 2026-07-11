import { useState } from 'react';
import {
  Box, Typography, Button, TextField, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Radio, RadioGroup, FormControlLabel, Divider,
} from '@mui/material';
import {
  ArrowBack, People, Close, Videocam, History,
} from '@mui/icons-material';
import desktopImage from '../../../image/电脑桌面.png';

// ─── 类型 ───

interface QuizRecord {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  selectedAnswer?: string;
  votes: Record<string, number>;
  totalVotes: number;
}

const mockClassroom = {
  id: 'c1', name: '函数与极限', teacher: '张老师', subject: '数学',
};

const mockParticipants = [
  { id: '1', name: '张老师', role: 'teacher' as const, online: true },
  { id: '2', name: '李明', role: 'student' as const, online: true },
  { id: '3', name: '王芳', role: 'student' as const, online: true },
  { id: '4', name: '赵强', role: 'student' as const, online: true },
  { id: '5', name: '刘洋', role: 'student' as const, online: false },
];

enum Stage { Join, Viewing }
type CallState = 'none' | 'calling' | 'connected';

export default function StudentClassroom() {
  const [stage, setStage] = useState(Stage.Join);
  const [studentName, setStudentName] = useState('');
  const [memberOpen, setMemberOpen] = useState(false);

  // ── 答题 ──
  const [quizActive, setQuizActive] = useState(false);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizStage, setQuizStage] = useState<'answer' | 'result' | 'idle'>('idle');
  const [selectedOption, setSelectedOption] = useState('');
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [quizHistory, setQuizHistory] = useState<QuizRecord[]>([
    {
      id: 1, question: '请问函数 y=x² 的图像是？',
      options: ['直线', '抛物线', '双曲线'], correctAnswer: '抛物线',
      selectedAnswer: '抛物线', votes: { '直线': 3, '抛物线': 12, '双曲线': 5 }, totalVotes: 20,
    },
    {
      id: 2, question: '文言文"之"字在"赤子之心"中的含义是？',
      options: ['的', '到', '代词', '取消独立性'], correctAnswer: '的',
      selectedAnswer: '的', votes: { '的': 10, '到': 2, '代词': 5, '取消独立性': 1 }, totalVotes: 18,
    },
    {
      id: 3, question: '现在完成时的结构是？',
      options: ['have+过去分词', 'be+doing', 'will+do', 'did'], correctAnswer: 'have+过去分词',
      selectedAnswer: undefined, votes: { 'have+过去分词': 8, 'be+doing': 3, 'will+do': 4, 'did': 1 }, totalVotes: 16,
    },
    {
      id: 4, question: '牛顿第一定律又称为什么？',
      options: ['万有引力定律', '惯性定律', '作用力与反作用力', '能量守恒'], correctAnswer: '惯性定律',
      selectedAnswer: '惯性定律', votes: { '万有引力定律': 2, '惯性定律': 14, '作用力与反作用力': 3, '能量守恒': 1 }, totalVotes: 20,
    },
  ]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedHistoryIdx, setSelectedHistoryIdx] = useState(0);
  const totalVotes = Object.values(userVotes).reduce((a, b) => a + b, 0);

  // ── 举手 ──
  const [handRaised, setHandRaised] = useState(false);
  const [handMessage, setHandMessage] = useState('');
  const [handInputOpen, setHandInputOpen] = useState(false);
  const [callState, setCallState] = useState<CallState>('none');

  const mockQuiz = {
    question: '请问函数 y=x² 的图像是？',
    options: ['直线', '抛物线', '双曲线'],
    correctAnswer: '抛物线',
  };

  const handleJoin = () => {
    if (!studentName.trim()) return;
    setStage(Stage.Viewing);
    setTimeout(() => {
      setQuizActive(true);
      setQuizStage('answer');
      setSelectedOption('');
      setQuizAnswered(false);
    }, 5000);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption) return;
    const votes: Record<string, number> = {};
    mockQuiz.options.forEach(o => { votes[o] = Math.floor(Math.random() * 8) + 1; });
    votes[selectedOption] = Math.max(votes[selectedOption] || 0, 5);
    setUserVotes(votes);
    setQuizStage('result');
    setQuizAnswered(true);
    // 存入历史
    const record: QuizRecord = {
      id: quizHistory.length + 1,
      question: mockQuiz.question,
      options: mockQuiz.options,
      correctAnswer: mockQuiz.correctAnswer,
      selectedAnswer: selectedOption,
      votes,
      totalVotes: Object.values(votes).reduce((a, b) => a + b, 0),
    };
    setQuizHistory(prev => [...prev, record]);
  };

  const handleRaiseHand = () => {
    setHandRaised(true);
    setHandInputOpen(false);
    // 模拟3秒后老师接通语音
    setTimeout(() => {
      setCallState('calling');
      setTimeout(() => setCallState('connected'), 1500);
    }, 4000);
  };

  const handleCancelHand = () => {
    setHandRaised(false);
    setHandMessage('');
    setCallState('none');
  };

  // ── 加入页面 ──
  if (stage === Stage.Join) {
    return (
      <Box className="h-[calc(100vh-57px)] bg-gray-50 flex items-center justify-center p-6">
        <Box className="w-full max-w-sm">
          <Button startIcon={<ArrowBack />} className="text-gray-500 mb-8" sx={{ textTransform: 'none' }}>返回</Button>
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
              <Typography variant="caption" color="text.secondary" className="mb-2 block">请输入你的姓名</Typography>
              <TextField fullWidth size="small" placeholder="请输入你的姓名" value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()} />
            </Box>
            <Button fullWidth variant="contained" size="large"
              disabled={!studentName.trim()} onClick={handleJoin}
              sx={{ borderRadius: 3, py: 1.2 }}>加入课堂</Button>
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
    <Box className="h-[calc(100vh-57px)] bg-black flex flex-col relative overflow-hidden">
      {/* 顶部栏 */}
      <Box className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent px-4 py-3 flex items-center justify-between">
        <Button size="small" startIcon={<ArrowBack />}
          onClick={() => setStage(Stage.Join)}
          className="text-white" sx={{ textTransform: 'none', color: 'white' }}>退出课堂</Button>
        <Box className="flex items-center gap-2">
          {quizHistory.length > 0 && (
            <Chip icon={<History />} label={quizHistory.length}
              size="small" className="text-white bg-white/20 cursor-pointer hover:bg-white/30"
              onClick={() => { setHistoryOpen(true); setSelectedHistoryIdx(quizHistory.length - 1); }}
              sx={{ color: 'white', height: 26, '& .MuiChip-icon': { color: 'white', fontSize: 14 } }} />
          )}
          <Chip icon={<People />} label={`在线 ${mockParticipants.filter(p => p.online).length}`}
            size="small" className="text-white bg-white/20 cursor-pointer"
            onClick={() => setMemberOpen(true)}
            sx={{ color: 'white', height: 26, '& .MuiChip-icon': { color: 'white', fontSize: 14 } }} />
          <Box className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
            {studentName.charAt(0)}
          </Box>
        </Box>
      </Box>

      {/* 直播内容 */}
      <Box className="flex-1 flex items-center justify-center overflow-hidden p-4">
        <img src={desktopImage} alt="课堂画面" className="max-w-full max-h-full object-contain" />
      </Box>

      {/* 底部答题通知（居中） */}
      <Box className="absolute bottom-0 left-0 right-0 z-20 flex justify-center p-4 pointer-events-none">
        {quizActive && (
          <Box className="pointer-events-auto max-w-sm w-full">
            {quizAnswered ? (
              <Chip label="📊 已作答 查看结果" size="small"
                onClick={() => setQuizStage('result')}
                className="bg-white/90 shadow-lg cursor-pointer hover:bg-white w-full"
                sx={{ height: 30, '& .MuiChip-label': { px: 1.2, fontSize: 12 } }} />
            ) : quizStage === 'result' ? (
              <Chip label="📊 查看答题结果" size="small"
                onClick={() => setQuizStage('result')}
                className="bg-white/90 shadow-lg cursor-pointer hover:bg-white w-full"
                sx={{ height: 30, '& .MuiChip-label': { px: 1.2, fontSize: 12 } }} />
            ) : (
              <Box className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-lg">
                <Box className="min-w-0 flex-1">
                  <Typography variant="body2" className="font-medium">📝 老师发起了一个投票</Typography>
                  <Typography variant="caption" color="text.secondary" className="truncate block">{mockQuiz.question}</Typography>
                </Box>
                <Button variant="contained" size="small" onClick={() => setQuizStage('answer')}
                  sx={{ borderRadius: 2, whiteSpace: 'nowrap', flexShrink: 0 }}>立即参与</Button>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* 举手/语音区域（右下角） */}
      <Box className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2">
        {!handRaised && callState === 'none' && (
          <Button variant="contained" startIcon={<Box sx={{ fontSize: 16 }}>✋</Box>}
            onClick={() => setHandInputOpen(true)}
            sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
              color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, minWidth: 100 }}>
            举手
          </Button>
        )}

        {handRaised && callState === 'none' && (
          <Box className="bg-white/90 backdrop-blur rounded-xl p-3 shadow-lg min-w-[200px] text-center">
            <Typography variant="body2" className="font-medium">✋ 已举手</Typography>
            {handMessage && (
              <Typography variant="caption" color="text.secondary" className="block mt-1">"{handMessage}"</Typography>
            )}
            <Typography variant="caption" color="text.disabled" className="block mt-0.5">等待老师回应...</Typography>
            <Button size="small" color="error" onClick={handleCancelHand}
              sx={{ borderRadius: 2, mt: 1 }}>取消举手</Button>
          </Box>
        )}

        {callState === 'calling' && (
          <Box className="bg-amber-50 rounded-xl p-3 shadow-lg min-w-[200px] text-center border border-amber-200">
            <Typography variant="body2" className="font-medium">🔔 老师正在接听...</Typography>
            <Button size="small" color="error" onClick={handleCancelHand}
              sx={{ borderRadius: 2, mt: 1 }}>取消</Button>
          </Box>
        )}

        {callState === 'connected' && (
          <Box className="bg-green-50 rounded-xl p-3 shadow-lg min-w-[200px] text-center border border-green-200">
            <Typography variant="body2" className="font-medium flex items-center justify-center gap-2">
              <Box component="span" className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              🎙️ 通话中
            </Typography>
            {handMessage && (
              <Typography variant="caption" color="text.secondary" className="block mt-1">"{handMessage}"</Typography>
            )}
            <Button size="small" variant="contained" color="error" onClick={handleCancelHand}
              sx={{ borderRadius: 2, mt: 1 }}>挂断</Button>
          </Box>
        )}
      </Box>

      {/* ── 举手输入弹窗 ── */}
      <Dialog open={handInputOpen} onClose={() => setHandInputOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ className: 'rounded-2xl' }}>
        <DialogTitle className="border-b flex items-center justify-between">
          <Typography variant="h6">✋ 举手</Typography>
          <IconButton onClick={() => setHandInputOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box className="py-4">
            <Typography variant="body2" color="text.secondary" className="mb-3">
              有什么问题或想说的？（选填）
            </Typography>
            <TextField fullWidth multiline rows={3} placeholder="例如：老师，这道题能再讲一遍吗？"
              value={handMessage} onChange={(e) => setHandMessage(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setHandInputOpen(false)} variant="outlined">取消</Button>
          <Button onClick={handleRaiseHand} variant="contained">✋ 举手</Button>
        </DialogActions>
      </Dialog>

      {/* ── 答题记录弹窗（机考阅卷风格） ── */}
      <Dialog open={historyOpen} onClose={() => { setHistoryOpen(false); setSelectedHistoryIdx(0); }} maxWidth="md" fullWidth
        PaperProps={{ className: 'rounded-2xl' }}>
        <DialogTitle className="border-b flex items-center justify-between">
          <Typography variant="h6">📋 答题记录（共{quizHistory.length}次）</Typography>
          <IconButton onClick={() => { setHistoryOpen(false); setSelectedHistoryIdx(0); }} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ minHeight: 380 }}>
          {quizHistory.length === 0 ? (
            <Box className="py-12 text-center text-gray-400">
              <Typography variant="body2">暂无答题记录</Typography>
            </Box>
          ) : (
            <Box className="flex gap-6 py-2" sx={{ minHeight: 320 }}>
              {/* 左侧：题号网格 */}
              <Box className="w-28 shrink-0">
                <Typography variant="caption" color="text.secondary" className="font-semibold block mb-2 text-center">
                  答题卡
                </Typography>
                <Box className="grid grid-cols-2 gap-2">
                  {quizHistory.map((r, idx) => {
                    const isSelected = selectedHistoryIdx === idx;
                    let bgColor = 'bg-gray-100 text-gray-500'; // 未参与
                    if (r.selectedAnswer) {
                      bgColor = r.selectedAnswer === r.correctAnswer
                        ? 'bg-green-100 text-green-700 border-green-400'   // 正确
                        : 'bg-red-100 text-red-700 border-red-400';       // 错误
                    }
                    return (
                      <Box key={r.id}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer text-sm font-bold border-2 transition-all ${
                          isSelected ? 'ring-2 ring-blue-400 border-blue-500' : 'border-transparent'
                        } ${bgColor}`}
                        onClick={() => setSelectedHistoryIdx(idx)}>
                        {idx + 1}
                      </Box>
                    );
                  })}
                </Box>
                {/* 图例 */}
                <Box className="mt-4 flex flex-col gap-1 text-[10px] text-gray-400">
                  <Box className="flex items-center gap-1">
                    <Box className="w-3 h-3 rounded bg-green-100 border border-green-400" />
                    <span>正确</span>
                  </Box>
                  <Box className="flex items-center gap-1">
                    <Box className="w-3 h-3 rounded bg-red-100 border border-red-400" />
                    <span>错误</span>
                  </Box>
                  <Box className="flex items-center gap-1">
                    <Box className="w-3 h-3 rounded bg-gray-100" />
                    <span>未参与</span>
                  </Box>
                </Box>
              </Box>

              {/* 右侧：题目详情 */}
              <Box className="flex-1 min-w-0 border-l border-gray-200 pl-6">
                {(() => {
                  const r = quizHistory[selectedHistoryIdx];
                  const idx = selectedHistoryIdx;
                  const max = Math.max(...Object.values(r.votes), 1);
                  const total = r.totalVotes;
                  return (
                    <Box>
                      <Typography variant="caption" color="text.secondary" className="font-semibold">
                        第 {idx + 1} 题
                      </Typography>
                      <Typography variant="body1" className="font-medium mt-1 mb-4">
                        {r.question}
                      </Typography>

                      {/* 选项列表 */}
                      <Box className="flex flex-col gap-1.5 mb-4">
                        {r.options.map((opt, oi) => {
                          const isCorrect = opt === r.correctAnswer;
                          const isSelected = opt === r.selectedAnswer;
                          let borderColor = 'border-gray-200';
                          let bgColor = '';
                          let suffix = '';
                          if (isCorrect && isSelected) { borderColor = 'border-green-400'; bgColor = 'bg-green-50'; suffix = '✅ 正确答案'; }
                          else if (isCorrect) { borderColor = 'border-green-300'; bgColor = 'bg-green-50/50'; suffix = '✓ 正确答案'; }
                          else if (isSelected) { borderColor = 'border-red-400'; bgColor = 'bg-red-50'; suffix = '❌ 你的答案'; }
                          return (
                            <Box key={opt} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${borderColor} ${bgColor}`}>
                              <Typography variant="body2" className="w-5 shrink-0 text-gray-500">
                                {String.fromCharCode(65 + oi)}.
                              </Typography>
                              <Typography variant="body2" className="flex-1">{opt}</Typography>
                              {suffix && (
                                <Typography variant="caption" className="shrink-0 font-medium"
                                  color={isCorrect ? 'green' : 'error'}>
                                  {suffix}
                                </Typography>
                              )}
                            </Box>
                          );
                        })}
                      </Box>

                      <Typography variant="caption" color="text.secondary" className="block mb-4">
                        全班 {total} 人参与
                      </Typography>

                      {/* 全班统计柱状图 */}
                      <Typography variant="caption" color="text.secondary" className="font-semibold block mb-2">
                        全班统计
                      </Typography>
                      {Object.entries(r.votes).map(([opt, count]) => (
                        <Box key={opt} className="flex items-center gap-2 text-xs mb-1">
                          <Typography variant="caption" className="w-10 truncate shrink-0 text-gray-500">{opt}</Typography>
                          <Box className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden relative">
                            <Box className={`h-full rounded-full transition-all ${
                              opt === r.correctAnswer ? 'bg-green-400' : 'bg-blue-400'
                            }`} sx={{ width: `${Math.round(count / max * 100)}%` }} />
                          </Box>
                          <Typography variant="caption" className="w-8 text-right font-mono text-gray-500">{count}人</Typography>
                        </Box>
                      ))}
                    </Box>
                  );
                })()}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => { setHistoryOpen(false); setSelectedHistoryIdx(0); }} variant="outlined">关闭</Button>
        </DialogActions>
      </Dialog>

      {/* ── 成员列表弹窗 ── */}
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
                }`}>{p.name.charAt(0)}</Box>
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

      {/* ── 答题弹窗 ── */}
      <Dialog open={quizStage === 'answer'} onClose={() => setQuizStage('result')}
        maxWidth="xs" fullWidth PaperProps={{ className: 'rounded-2xl' }}>
        <DialogTitle className="border-b flex items-center justify-between">
          <Typography variant="h6">❓ 答题器</Typography>
          <IconButton onClick={() => setQuizStage('result')} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box className="py-4">
            <Typography variant="body1" className="font-medium mb-4">{mockQuiz.question}</Typography>
            <RadioGroup value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)}>
              {mockQuiz.options.map((opt, i) => (
                <FormControlLabel key={opt} value={opt}
                  control={<Radio />}
                  label={`${String.fromCharCode(65 + i)}. ${opt}`}
                  className="mb-1 py-1 px-2 rounded-lg hover:bg-gray-50" />
              ))}
            </RadioGroup>
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setQuizStage('result')} variant="outlined">关闭</Button>
          <Button onClick={handleSubmitAnswer} variant="contained" disabled={!selectedOption}>提交答案</Button>
        </DialogActions>
      </Dialog>

      {/* ── 结果弹窗 ── */}
      <Dialog open={quizStage === 'result'} onClose={() => setQuizStage('idle')}
        maxWidth="xs" fullWidth PaperProps={{ className: 'rounded-2xl' }}>
        <DialogTitle className="border-b flex items-center justify-between">
          <Typography variant="h6">📊 答题结果</Typography>
          <IconButton onClick={() => setQuizStage('idle')} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box className="py-4">
            <Typography variant="body2" className="font-medium mb-1">{mockQuiz.question}</Typography>
            <Typography variant="caption" color="primary" className="block mb-4">
              {quizAnswered ? (
                selectedOption === mockQuiz.correctAnswer ? '✅ 回答正确' : `❌ 正确答案：${mockQuiz.correctAnswer}`
              ) : '你未参与本次投票'}
            </Typography>
            {Object.entries(userVotes).map(([opt, count]) => {
              const max = Math.max(...Object.values(userVotes), 1);
              return (
                <Box key={opt} className="mb-2">
                  <Box className="flex justify-between text-xs mb-0.5">
                    <Typography variant="caption" className={opt === selectedOption ? 'font-bold text-blue-600' : ''}>
                      {opt} {opt === selectedOption && '（你的选择）'}
                    </Typography>
                    <Typography variant="caption" className="font-mono">{Math.round(count / totalVotes * 100)}%</Typography>
                  </Box>
                  <Box className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <Box className={`h-full rounded-full transition-all ${opt === mockQuiz.correctAnswer ? 'bg-green-500' : 'bg-blue-400'}`}
                      sx={{ width: `${Math.round(count / max * 100)}%` }} />
                  </Box>
                </Box>
              );
            })}
            <Typography variant="caption" color="text.secondary">共 {totalVotes} 人参与</Typography>
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setQuizStage('idle')} variant="outlined">关闭</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
