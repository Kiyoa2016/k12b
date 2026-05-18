import { useState } from 'react';
import {
  Box, Typography, IconButton, Chip,
} from '@mui/material';
import {
  ArrowBack, PlayArrow, Pause, VolumeUp, Fullscreen,
} from '@mui/icons-material';
import type { TrainingVideo } from './TrainingVideo';

interface Props {
  video: TrainingVideo;
  onBack: () => void;
}

export default function TrainingVideoPlay({ video, onBack }: Props) {
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
        <Chip label={video.module} size="small" color="primary" variant="outlined" />
      </Box>

      {/* 主体 */}
      <Box className="flex-1 overflow-auto p-6">
        {/* 视频播放器 */}
        <Box className="max-w-4xl mx-auto">
          <Box className="bg-black rounded-xl overflow-hidden mb-6">
            <Box className="aspect-video flex items-center justify-center text-white">
              <Box className="text-center">
                <Box className="mb-3 text-gray-500 text-8xl flex justify-center">
                  <PlayArrow fontSize="inherit" />
                </Box>
                <Typography variant="h6" className="text-gray-400">
                  {video.title}
                </Typography>
                <Typography variant="body2" className="text-gray-600 mt-1">
                  视频播放区域
                </Typography>
              </Box>
            </Box>
            {/* 控制栏 */}
            <Box className="bg-gray-900 px-4 py-2 flex items-center gap-3">
              <IconButton size="small" className="text-white" onClick={() => setPlaying(!playing)}>
                {playing ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
              </IconButton>
              <Box className="flex-1 h-1 bg-gray-700 rounded-full relative">
                <Box className="h-full w-0 bg-blue-500 rounded-full" />
              </Box>
              <Typography variant="caption" className="text-gray-400 min-w-[80px] text-right font-mono">
                00:00 / {video.duration}
              </Typography>
              <IconButton size="small" className="text-white"><VolumeUp fontSize="small" /></IconButton>
              <IconButton size="small" className="text-white"><Fullscreen fontSize="small" /></IconButton>
            </Box>
          </Box>

          {/* 视频信息 */}
          <Box>
            <Typography variant="h5" className="font-bold mb-2">{video.title}</Typography>
            <Box className="flex items-center gap-2 mb-3 flex-wrap">
              <Chip label={video.module} size="small" color="primary" variant="outlined" />
              <Typography variant="caption" color="text.secondary">
                时长：{video.duration}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                上传：{video.uploadDate}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" className="leading-relaxed">
              {video.description}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
