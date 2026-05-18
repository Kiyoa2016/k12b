import { useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Chip,
  TextField,
} from '@mui/material';
import {
  Videocam, Search, PlayArrow, AccessTime,
} from '@mui/icons-material';

export interface TrainingVideo {
  id: string;
  title: string;
  description: string;
  module: string;
  duration: string;
  uploadDate: string;
  status: 'published' | 'draft';
  videoUrl?: string;
}

const moduleGradients: Record<string, string> = {
  '模板管理': 'from-blue-100 to-blue-50',
  '教师管理': 'from-green-100 to-green-50',
  '学校管理': 'from-purple-100 to-purple-50',
  '校本资源': 'from-yellow-100 to-yellow-50',
  '听评课': 'from-pink-100 to-pink-50',
  '云课堂': 'from-cyan-100 to-cyan-50',
  '集控管理': 'from-orange-100 to-orange-50',
};

const defaultVideos: TrainingVideo[] = [
  {
    id: '1',
    title: '模板管理功能介绍',
    description: '了解如何使用模板管理功能上传和管理课件、教案、评分表模板。',
    module: '模板管理',
    duration: '5:30',
    uploadDate: '2026-05-15',
    status: 'published',
  },
  {
    id: '2',
    title: '听评课功能使用指南',
    description: '学习如何创建听评课、进行课堂评价、查看评分记录。',
    module: '听评课',
    duration: '8:15',
    uploadDate: '2026-05-14',
    status: 'published',
  },
  {
    id: '3',
    title: '云课堂操作说明',
    description: '掌握云课堂的视频上传、审核和点播全流程操作。',
    module: '云课堂',
    duration: '12:00',
    uploadDate: '2026-05-13',
    status: 'published',
  },
  {
    id: '4',
    title: '集控管理使用教程',
    description: '学习使用教室管理和实时流功能进行集中控制。',
    module: '集控管理',
    duration: '6:45',
    uploadDate: '2026-05-12',
    status: 'published',
  },
  {
    id: '5',
    title: '教师管理功能介绍',
    description: '了解如何添加、编辑和管理教师账号信息。',
    module: '教师管理',
    duration: '4:20',
    uploadDate: '2026-05-11',
    status: 'draft',
  },
];

interface Props {
  onOpenPlay: (video: TrainingVideo) => void;
}

export default function TrainingVideo({ onOpenPlay }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  // 只显示已上架的视频
  const videos = defaultVideos;
  const moduleKeys = Object.keys(moduleGradients);

  const filtered = videos.filter((v) => {
    if (v.status !== 'published') return false;
    if (selectedModule && v.module !== selectedModule) return false;
    if (searchTerm && !v.title.toLowerCase().includes(searchTerm.toLowerCase()) && !v.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <Box className="p-6">
      {/* 标题栏 */}
      <Box className="mb-6">
        <Typography variant="h5" className="font-bold">培训视频</Typography>
        <Typography variant="body2" color="text.secondary" className="mt-1">
          平台功能介绍教学视频
        </Typography>
      </Box>

      {/* 搜索框 */}
      <Box className="mb-6">
        <TextField
          size="small"
          placeholder="搜索培训视频..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search fontSize="small" className="mr-1 text-gray-400" />,
          }}
          className="w-full md:w-96"
        />
      </Box>

      {/* 板块筛选 */}
      <Box className="mb-6 flex flex-wrap items-center gap-2">
        <Typography variant="caption" color="text.secondary" className="mr-1">板块：</Typography>
        <Chip label="全部" size="small" onClick={() => setSelectedModule(null)}
          color={selectedModule === null ? 'primary' : 'default'}
          variant={selectedModule === null ? 'filled' : 'outlined'} />
        {moduleKeys.map((m) => (
          <Chip key={m} label={m} size="small" onClick={() => setSelectedModule(m)}
            color={selectedModule === m ? 'primary' : 'default'}
            variant={selectedModule === m ? 'filled' : 'outlined'} />
        ))}
      </Box>

      {/* 视频网格 */}
      {filtered.length === 0 ? (
        <Box className="text-center py-16">
          <Videocam className="text-6xl text-gray-300 mb-4" />
          <Typography variant="h6" color="text.secondary">暂无培训视频</Typography>
          <Typography variant="body2" color="text.secondary" className="mt-2">
            暂无已发布的培训视频
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filtered.map((video) => (
            <Grid item xs={12} sm={6} md={4} key={video.id}>
              <Card
                className="h-full hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => onOpenPlay(video)}
              >
                <Box
                  className={`h-36 bg-gradient-to-br ${moduleGradients[video.module] || 'from-gray-100 to-gray-50'} flex items-center justify-center relative`}
                >
                  <Box className="text-center">
                    <Videocam className="text-4xl opacity-30" />
                  </Box>
                  {/* 播放按钮悬浮层 */}
                  <Box className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                    <Box className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayArrow className="text-gray-800 ml-0.5" />
                    </Box>
                  </Box>
                  <Chip
                    label={video.duration}
                    size="small"
                    icon={<AccessTime fontSize="small" />}
                    className="absolute bottom-2 right-2 bg-black/60 text-white"
                    sx={{ height: 22, '& .MuiChip-label': { px: 0.8, fontSize: 11 }, '& .MuiChip-icon': { fontSize: 12, color: 'white' } }}
                  />
                </Box>
                <CardContent className="p-3">
                  <Typography variant="subtitle2" className="font-semibold truncate mb-1">
                    {video.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" className="line-clamp-2 block mb-2">
                    {video.description}
                  </Typography>
                  <Box className="flex items-center gap-1.5">
                    <Chip label={video.module} size="small" variant="outlined" color="primary"
                      sx={{ height: 20, '& .MuiChip-label': { px: 0.6, fontSize: 10 } }} />
                    <Typography variant="caption" color="text.secondary">{video.uploadDate}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
