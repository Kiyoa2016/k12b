import { Box, Typography } from '@mui/material';
import { Security } from '@mui/icons-material';

export default function SecurityPolicy() {
  return (
    <Box className="p-6">
      <Box className="mb-6">
        <Typography variant="h5" className="font-bold">
          安全策略
        </Typography>
        <Typography variant="body2" color="text.secondary" className="mt-1">
          配置教室终端和设备的安全访问控制策略
        </Typography>
      </Box>
      <Box className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
        <Box className="text-center text-gray-400">
          <Security className="text-5xl mb-3 text-gray-300" />
          <Typography variant="h6">安全策略</Typography>
          <Typography variant="body2" className="mt-1">
            页面内容正在建设中...
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
