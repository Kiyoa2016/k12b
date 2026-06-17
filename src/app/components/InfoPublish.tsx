import { Box, Typography } from '@mui/material';
import { Campaign } from '@mui/icons-material';

export default function InfoPublish() {
  return (
    <Box className="p-6">
      <Box className="mb-6">
        <Typography variant="h5" className="font-bold">
          信息发布
        </Typography>
        <Typography variant="body2" color="text.secondary" className="mt-1">
          发布和管理校园通知、公告等信息到各教室终端
        </Typography>
      </Box>
      <Box className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
        <Box className="text-center text-gray-400">
          <Campaign className="text-5xl mb-3 text-gray-300" />
          <Typography variant="h6">信息发布</Typography>
          <Typography variant="body2" className="mt-1">
            页面内容正在建设中...
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
