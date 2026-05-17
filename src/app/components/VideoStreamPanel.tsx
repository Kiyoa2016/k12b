import { useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Slider,
  Chip,
} from '@mui/material';
import {
  Videocam,
  Person,
  Group,
  Computer,
  PlayArrow,
  Pause,
  VolumeUp,
  Fullscreen,
} from '@mui/icons-material';

type StreamSource = 'teacher' | 'student' | 'whiteboard';

const streamConfig: Record<StreamSource, { label: string; icon: React.ReactNode }> = {
  teacher: { label: '老师画面', icon: <Person sx={{ fontSize: 80 }} /> },
  student: { label: '学生画面', icon: <Group sx={{ fontSize: 80 }} /> },
  whiteboard: { label: '白板画面', icon: <Computer sx={{ fontSize: 80 }} /> },
};

interface Props {
  mode?: 'live' | 'recorded';
}

export default function VideoStreamPanel({ mode = 'live' }: Props) {
  const [source, setSource] = useState<StreamSource>('teacher');
  const [playing, setPlaying] = useState(false);

  const config = streamConfig[source];

  return (
    <Box className="h-full flex flex-col">
      {/* 切换栏 */}
      <Box className="mb-3 flex items-center justify-between">
        <Box className="flex items-center gap-2">
          <Typography variant="subtitle1" className="font-semibold">
            视频流
          </Typography>
          <Chip
            label={mode === 'live' ? '直播' : '录播'}
            size="small"
            color={mode === 'live' ? 'error' : 'warning'}
            variant="filled"
            className="font-medium"
            sx={{ height: 22, '& .MuiChip-label': { px: 0.8, fontSize: 11 } }}
          />
        </Box>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={source}
            onChange={(e) => setSource(e.target.value as StreamSource)}
          >
            <MenuItem value="teacher">老师</MenuItem>
            <MenuItem value="student">学生</MenuItem>
            <MenuItem value="whiteboard">白板</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 播放器区域 */}
      <Box className="flex-1 bg-black rounded-xl flex flex-col overflow-hidden">
        <Box className="flex-1 flex items-center justify-center text-white">
          <Box className="text-center">
            <Box className="mb-4 text-gray-400">
              {config.icon}
            </Box>
            <Typography variant="h6" className="text-gray-300">
              {config.label}
            </Typography>
            <Typography variant="caption" className="text-gray-500 block mt-1">
              {mode === 'live' ? '正在直播 — 实时画面' : '录播回放 — 可拖动进度条回看'}
            </Typography>
          </Box>
        </Box>

        {/* 播放器控制栏 */}
        <Box className="bg-gray-900 px-4 py-2 flex items-center gap-3">
          <IconButton
            size="small"
            className="text-white"
            onClick={() => setPlaying(!playing)}
          >
            {playing ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
          </IconButton>
          <Slider
            size="small"
            defaultValue={30}
            className="flex-1 text-blue-500"
            sx={{ '& .MuiSlider-thumb': { width: 12, height: 12 } }}
          />
          <Typography variant="caption" className="text-gray-400 min-w-[70px] text-right">
            03:21 / 12:45
          </Typography>
          <IconButton size="small" className="text-white">
            <VolumeUp fontSize="small" />
          </IconButton>
          <IconButton size="small" className="text-white">
            <Fullscreen fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
