import { useState } from 'react';
import { Box, IconButton, Typography, Divider, Chip } from '@mui/material';
import { ArrowBack, Person, Group, Computer } from '@mui/icons-material';
import ContentPreview from './ContentPreview';
import type { Lecture } from './LectureEvaluation';

interface Props {
  lecture: Lecture;
  videoMode: 'live' | 'recorded';
  onBack: () => void;
}

type StreamType = 'teacher' | 'student' | 'whiteboard';

const streamConfig: Record<StreamType, { label: string; desc: string; icon: React.ReactNode; iconSm: React.ReactNode }> = {
  teacher: { label: '老师画面', desc: '老师', icon: <Person sx={{ fontSize: 80 }} />, iconSm: <Person sx={{ fontSize: 48 }} /> },
  student: { label: '学生画面', desc: '学生', icon: <Group sx={{ fontSize: 80 }} />, iconSm: <Group sx={{ fontSize: 48 }} /> },
  whiteboard: { label: '白板画面', desc: '白板', icon: <Computer sx={{ fontSize: 80 }} />, iconSm: <Computer sx={{ fontSize: 48 }} /> },
};

const allStreams: StreamType[] = ['teacher', 'student', 'whiteboard'];

export default function LectureEvaluationDetail({ lecture, videoMode, onBack }: Props) {
  const [mainStream, setMainStream] = useState<StreamType>('teacher');
  const auxiliary = allStreams.filter((s) => s !== mainStream);

  const handleSwap = (stream: StreamType) => {
    if (stream !== mainStream) setMainStream(stream);
  };

  return (
    <Box className="flex flex-col bg-white" sx={{ height: 'calc(100vh - 57px)' }}>
      {/* 头部 */}
      <Box className="border-b border-gray-200 py-3 px-6 flex items-center justify-between bg-white shrink-0">
        <Box className="flex items-center gap-3">
          <IconButton onClick={onBack} size="small" className="text-gray-600">
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" className="font-bold">
            听评课详情 — {lecture.courseName}
          </Typography>
          <Chip
            label={videoMode === 'live' ? '● 直播' : '● 录播'}
            size="small"
            color={videoMode === 'live' ? 'success' : 'warning'}
            variant="filled"
            className="font-medium"
          />
        </Box>
      </Box>

      {/* 主体内容：左右分栏 */}
      <Box className="flex-1 flex overflow-hidden">
        {/* 左侧视频流 60% */}
        <Box className="w-[60%] p-5 overflow-hidden flex flex-col gap-3">
          {/* 主画面 */}
          <Box
            className="flex-[6] bg-black rounded-xl flex items-center justify-center text-white relative overflow-hidden min-h-0 cursor-pointer"
            onClick={() => handleSwap(mainStream)}
          >
            <Box className="text-center pointer-events-none">
              {streamConfig[mainStream].icon}
              <Typography variant="h6" className="text-gray-300 mt-3">
                {streamConfig[mainStream].label}
              </Typography>
              <Typography variant="caption" className="text-gray-500 block mt-1">
                {videoMode === 'live' ? '正在直播 — 实时画面' : '录播回放'}
              </Typography>
            </Box>
            <Chip
              label={videoMode === 'live' ? '直播' : '录播'}
              size="small"
              color={videoMode === 'live' ? 'error' : 'warning'}
              variant="filled"
              className="absolute top-3 left-3 font-medium"
              sx={{ height: 22, '& .MuiChip-label': { px: 0.8, fontSize: 11 } }}
            />
            <Typography variant="caption" className="absolute bottom-2 right-3 text-gray-600">
              {streamConfig[mainStream].desc}
            </Typography>
          </Box>

          {/* 辅画面：两个并排 */}
          <Box className="flex-[4] flex gap-3 min-h-0">
            {auxiliary.map((stream) => (
              <Box
                key={stream}
                className="flex-1 bg-black rounded-xl flex items-center justify-center text-white relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                onClick={() => handleSwap(stream)}
              >
                <Box className="text-center pointer-events-none">
                  {streamConfig[stream].iconSm}
                  <Typography variant="subtitle2" className="text-gray-300 mt-2">
                    {streamConfig[stream].label}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500 block mt-0.5">
                    {videoMode === 'live' ? '实时画面' : '录播回放'}
                  </Typography>
                </Box>
                <Typography variant="caption" className="absolute bottom-2 right-3 text-gray-600">
                  {streamConfig[stream].desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* 分隔线 */}
        <Divider orientation="vertical" flexItem />

        {/* 右侧内容预览 40% */}
        <Box className="flex-1 p-5 overflow-auto">
          <ContentPreview />
        </Box>
      </Box>
    </Box>
  );
}
