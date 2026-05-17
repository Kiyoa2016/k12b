import { useState } from 'react';
import {
  Box, Typography, IconButton, Chip, Divider,
} from '@mui/material';
import {
  ArrowBack, PlayArrow, Pause, VolumeUp, Fullscreen,
} from '@mui/icons-material';
import type { CloudVideo } from './CloudClassroom';

interface Props {
  video: CloudVideo;
  relatedVideos: CloudVideo[];
  onBack: () => void;
  onPlay: (video: CloudVideo) => void;
}

const gradeColors: Record<string, string> = {
  '初一': 'bg-cyan-100 text-cyan-700', '初二': 'bg-cyan-100 text-cyan-700', '初三': 'bg-cyan-100 text-cyan-700',
  '高一': 'bg-blue-100 text-blue-700', '高二': 'bg-blue-100 text-blue-700', '高三': 'bg-blue-100 text-blue-700',
};

export default function CloudClassroomPlay({ video, relatedVideos, onBack, onPlay }: Props) {
  const [playing, setPlaying] = useState(false);

  return (
    <Box className="flex flex-col bg-white" sx={{ height: 'calc(100vh - 57px)' }}>
      {/* 头部 */}
      <Box className="border-b border-gray-200 py-3 px-6 flex items-center gap-3 bg-white shrink-0">
        <IconButton onClick={onBack} size="small" className="text-gray-600">
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" className="font-bold truncate">
          {video.title}
        </Typography>
        <Chip label={video.subject} size="small" color="primary" variant="outlined" />
      </Box>

      {/* 主体 */}
      <Box className="flex-1 flex overflow-hidden">
        {/* 左侧：播放器区域 70% */}
        <Box className="flex-[7] p-5 overflow-auto flex flex-col gap-4">
          {/* 视频播放器 */}
          <Box className="bg-black rounded-xl flex flex-col overflow-hidden">
            <Box className="aspect-video flex items-center justify-center text-white">
              <Box className="text-center">
                <Box className="mb-3 text-gray-500 text-8xl flex justify-center">
                  <PlayArrow fontSize="inherit" />
                </Box>
                <Typography variant="h6" className="text-gray-400">
                  {video.title}
                </Typography>
                <Typography variant="body2" className="text-gray-600 mt-1">
                  视频播放区域 — 点击播放
                </Typography>
              </Box>
            </Box>
            {/* 控制栏 */}
            <Box className="bg-gray-900 px-4 py-2 flex items-center gap-3">
              <IconButton size="small" className="text-white" onClick={() => setPlaying(!playing)}>
                {playing ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
              </IconButton>
              <Box className="flex-1 h-1 bg-gray-700 rounded-full relative">
                <Box className="h-full w-1/3 bg-blue-500 rounded-full" />
              </Box>
              <Typography variant="caption" className="text-gray-400 min-w-[80px] text-right font-mono">
                15:23 / {video.duration}
              </Typography>
              <IconButton size="small" className="text-white"><VolumeUp fontSize="small" /></IconButton>
              <IconButton size="small" className="text-white"><Fullscreen fontSize="small" /></IconButton>
            </Box>
          </Box>

          {/* 视频信息 */}
          <Box>
            <Typography variant="h5" className="font-bold mb-2">{video.title}</Typography>
            <Box className="flex items-center gap-2 mb-3">
              <Chip label={video.subject} size="small" color="primary" variant="outlined" />
              <Chip label={video.grade} size="small" variant="outlined"
                className={gradeColors[video.grade] || ''}
                sx={{ height: 22, '& .MuiChip-label': { px: 0.8, fontSize: 11 } }} />
              <Typography variant="caption" color="text.secondary">
                授课：{video.teacher}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                上传：{video.uploadDate}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                时长：{video.duration}
              </Typography>
            </Box>
            {video.description && (
              <Typography variant="body2" color="text.secondary" className="leading-relaxed">
                {video.description}
              </Typography>
            )}
          </Box>
        </Box>

        {/* 分隔线 */}
        <Divider orientation="vertical" flexItem />

        {/* 右侧：相关视频 30% */}
        <Box className="flex-[3] p-4 overflow-auto">
          <Typography variant="subtitle2" className="font-semibold mb-3 text-gray-700">
            相关视频
          </Typography>
          {relatedVideos.length === 0 ? (
            <Typography variant="body2" color="text.secondary" className="text-center py-8">
              暂无相关视频
            </Typography>
          ) : (
            <Box className="flex flex-col gap-3">
              {relatedVideos.map((rv) => (
                <Box
                  key={rv.id}
                  className="flex gap-2 cursor-pointer hover:bg-gray-50 rounded-lg p-1.5 transition-colors"
                  onClick={() => onPlay(rv)}
                >
                  <Box className="w-28 h-16 bg-gradient-to-br from-gray-200 to-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    <PlayArrow fontSize="small" className="text-gray-400" />
                  </Box>
                  <Box className="min-w-0 flex-1">
                    <Typography variant="body2" className="font-medium truncate">{rv.title}</Typography>
                    <Typography variant="caption" color="text.secondary" className="block mt-0.5">
                      {rv.teacher} · {rv.duration}
                    </Typography>
                    <Box className="flex gap-1 mt-0.5">
                      <Chip label={rv.subject} size="small" variant="outlined" color="primary"
                        sx={{ height: 18, '& .MuiChip-label': { px: 0.5, fontSize: 9 } }} />
                      <Chip label={rv.grade} size="small" variant="outlined"
                        sx={{ height: 18, '& .MuiChip-label': { px: 0.5, fontSize: 9 } }} />
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
