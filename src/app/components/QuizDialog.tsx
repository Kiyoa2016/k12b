import { Box, Typography, Button, IconButton, TextField, Dialog, DialogTitle, DialogContent } from '@mui/material';
import { Close, Quiz as QuizIcon } from '@mui/icons-material';

interface QuizDialogProps {
  open: boolean;
  onClose: () => void;
  quizQuestion: string;
  quizOptions: string[];
  quizVotes: Record<string, number>;
  quizActive: boolean;
  quizSubmitted: boolean;
  onQuestionChange: (q: string) => void;
  onOptionChange: (index: number, value: string) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
  onStartQuiz: () => void;
  onSimulateVotes: () => void;
  onResetQuiz: () => void;
}

export default function QuizDialog({
  open, onClose, quizQuestion, quizOptions, quizVotes,
  quizActive, quizSubmitted, onQuestionChange, onOptionChange,
  onAddOption, onRemoveOption, onStartQuiz, onSimulateVotes, onResetQuiz,
}: QuizDialogProps) {
  const totalVotes = Object.values(quizVotes).reduce((a, b) => a + b, 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="border-b">
        <Box className="flex items-center justify-between">
          <Typography variant="h6" className="flex items-center gap-2">
            <QuizIcon fontSize="small" /> 答题器
          </Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box className="py-4">
          {!quizActive ? (
            <Box className="flex flex-col gap-3">
              <TextField size="small" label="题目" value={quizQuestion}
                onChange={(e) => onQuestionChange(e.target.value)}
                placeholder="请输入题目" fullWidth />
              {quizOptions.map((opt, i) => (
                <Box key={i} className="flex items-center gap-1">
                  <Typography variant="caption" className="text-gray-500 w-5 shrink-0">
                    {String.fromCharCode(65 + i)}.
                  </Typography>
                  <TextField size="small" placeholder={`选项 ${String.fromCharCode(65 + i)}`}
                    value={opt} onChange={(e) => onOptionChange(i, e.target.value)} fullWidth />
                  {quizOptions.length > 2 && (
                    <IconButton size="small" onClick={() => onRemoveOption(i)}><Close fontSize="small" /></IconButton>
                  )}
                </Box>
              ))}
              <Box className="flex gap-2">
                <Button size="small" variant="text" onClick={onAddOption} disabled={quizOptions.length >= 6}>
                  + 添加选项
                </Button>
              </Box>
              <Button size="small" variant="contained" onClick={onStartQuiz}
                disabled={!quizQuestion.trim() || quizOptions.filter(o => o.trim()).length < 2}>
                发起答题
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" className="font-medium mb-3">{quizQuestion}</Typography>
              {quizSubmitted ? (
                <Box>
                  {Object.entries(quizVotes).map(([opt, count]) => {
                    const maxVotes = Math.max(...Object.values(quizVotes), 1);
                    const pct = maxVotes > 0 ? (count / maxVotes * 100) : 0;
                    return (
                      <Box key={opt} className="mb-1.5">
                        <Box className="flex justify-between text-xs mb-0.5">
                          <Typography variant="caption">{opt}</Typography>
                          <Typography variant="caption" className="font-mono">{count}票 ({totalVotes > 0 ? Math.round(count / totalVotes * 100) : 0}%)</Typography>
                        </Box>
                        <Box className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <Box className="h-full bg-blue-500 rounded-full transition-all" sx={{ width: `${pct}%` }} />
                        </Box>
                      </Box>
                    );
                  })}
                  <Typography variant="caption" color="text.secondary">共 {totalVotes} 票</Typography>
                  <Box className="flex gap-2 mt-2">
                    <Button size="small" variant="outlined" onClick={onSimulateVotes}>{quizSubmitted ? "重新模拟" : "模拟投票"}</Button>
                    <Button size="small" variant="text" color="error" onClick={onResetQuiz}>重置</Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  {Object.keys(quizVotes).map((opt) => (
                    <Typography key={opt} variant="body2" color="text.secondary" className="mb-1">
                      {String.fromCharCode(65 + Object.keys(quizVotes).indexOf(opt))}. {opt}
                    </Typography>
                  ))}
                  <Button size="small" variant="outlined" onClick={onSimulateVotes} className="mt-2">结束答题并统计</Button>
                  <Button size="small" variant="text" color="error" onClick={onResetQuiz} className="mt-1">取消</Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
