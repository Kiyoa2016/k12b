import { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  IconButton,
  Rating,
  Divider,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import type { Lecture } from './LectureEvaluation';

interface ScoringItem {
  id: string;
  label: string;
  maxScore: number;
}

interface ScoringGroup {
  id: string;
  label: string;
  items: ScoringItem[];
}

const scoringTemplate: ScoringGroup[] = [
  {
    id: 'objectives',
    label: '教学目标',
    items: [
      { id: 'obj-clarity', label: '目标明确性', maxScore: 10 },
      { id: 'obj-appropriateness', label: '目标适切性', maxScore: 10 },
    ],
  },
  {
    id: 'content',
    label: '教学内容',
    items: [
      { id: 'cnt-accuracy', label: '内容科学性', maxScore: 10 },
      { id: 'cnt-organization', label: '内容组织', maxScore: 10 },
      { id: 'cnt-focus', label: '重点突出', maxScore: 10 },
    ],
  },
  {
    id: 'methods',
    label: '教学方法',
    items: [
      { id: 'met-diversity', label: '方法多样性', maxScore: 10 },
      { id: 'met-guidance', label: '启发引导', maxScore: 10 },
      { id: 'met-interaction', label: '师生互动', maxScore: 10 },
    ],
  },
  {
    id: 'effectiveness',
    label: '教学效果',
    items: [
      { id: 'eff-achievement', label: '目标达成度', maxScore: 10 },
      { id: 'eff-participation', label: '学生参与度', maxScore: 10 },
    ],
  },
];

interface Props {
  open: boolean;
  lecture: Lecture | null;
  readOnly?: boolean;
  initialScores?: Record<string, number>;
  onClose: () => void;
  onSubmit?: (lectureId: string, scores: Record<string, number>) => void;
}

export default function ScoringDialog({ open, lecture, readOnly = false, initialScores = {}, onClose, onSubmit }: Props) {
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => { if (open) setScores(initialScores); }, [open, initialScores]);

  const handleScoreChange = (itemId: string, value: number | null) => {
    setScores((prev) => ({ ...prev, [itemId]: value || 0 }));
  };

  const handleSubmit = () => {
    if (!lecture) return;
    onSubmit(lecture.id, scores);
    setScores({});
    onClose();
  };

  const handleClose = () => {
    setScores({});
    onClose();
  };

  const totalScore = scoringTemplate
    .flatMap((g) => g.items)
    .reduce((sum, item) => sum + (scores[item.id] || 0), 0);

  const totalMax = scoringTemplate
    .flatMap((g) => g.items)
    .reduce((sum, item) => sum + item.maxScore, 0);

  const totalItems = scoringTemplate.flatMap((g) => g.items).length;

  if (!lecture) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle className="border-b">
        <Box className="flex items-center justify-between">
          <Typography variant="h6" className="font-bold">
            课堂教学评分
          </Typography>
          <IconButton onClick={handleClose} size="small"><Close /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box className="py-4">
          {/* 课程信息 */}
          <Box className="mb-6 p-3 bg-gray-50 rounded-lg">
            <Typography variant="subtitle1" className="font-medium">
              {lecture.courseName}
            </Typography>
            <Typography variant="body2" color="text.secondary" className="mt-1">
              {lecture.teacher} · {lecture.className} · {lecture.date} {lecture.time}
            </Typography>
          </Box>

          {/* 评分模板 */}
          {scoringTemplate.map((group) => (
            <Box key={group.id} className="mb-5">
              <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-2">
                {group.label}
              </Typography>
              <Box className="space-y-3">
                {group.items.map((item) => (
                  <Box key={item.id} className="flex items-center justify-between pl-2">
                    <Typography variant="body2" className="text-gray-600">
                      {item.label}
                    </Typography>
                    <Box className="flex items-center gap-2">
                      <Rating
                        value={scores[item.id] ? scores[item.id] / 2 : 0}
                        onChange={(e, val) => handleScoreChange(item.id, (val || 0) * 2)}
                        precision={0.5}
                        size="small"
                        readOnly={readOnly}
                      />
                      <Typography
                        variant="caption"
                        className={`min-w-[24px] text-right font-mono ${
                          scores[item.id] ? 'text-blue-600 font-medium' : 'text-gray-400'
                        }`}
                      >
                        {scores[item.id] || 0}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
              {group.id !== scoringTemplate[scoringTemplate.length - 1].id && (
                <Divider className="mt-3" />
              )}
            </Box>
          ))}
        </Box>
      </DialogContent>

      {/* 底部总分 + 提交 */}
      <Box className="px-6 py-3 border-t border-gray-100 bg-gray-50">
        <Box className="flex items-center justify-between">
          <Box>
            <Typography variant="body2" color="text.secondary">
              评分项共 {totalItems} 项
            </Typography>
          </Box>
          <Box className="flex items-center gap-4">
            <Typography variant="h6" className="font-bold text-blue-600">
              {totalScore} / {totalMax}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              得分率 {totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0}%
            </Typography>
          </Box>
        </Box>
      </Box>
      <DialogActions className="px-6 pb-4">
        {readOnly ? (
          <Button onClick={handleClose} variant="outlined">关闭</Button>
        ) : (
          <>
            <Button onClick={handleClose} variant="outlined">取消</Button>
            <Button onClick={handleSubmit} variant="contained" disabled={totalScore === 0}>提交评分</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
