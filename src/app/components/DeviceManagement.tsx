import { Box, Typography } from '@mui/material';
import { Devices } from '@mui/icons-material';

export default function DeviceManagement() {
  return (
    <Box className="p-6">
      <Box className="mb-6">
        <Typography variant="h5" className="font-bold">
          设备管理
        </Typography>
        <Typography variant="body2" color="text.secondary" className="mt-1">
          管理所有教室终端设备，查看设备状态和配置信息
        </Typography>
      </Box>
      <Box className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
        <Box className="text-center text-gray-400">
          <Devices className="text-5xl mb-3 text-gray-300" />
          <Typography variant="h6">设备管理</Typography>
          <Typography variant="body2" className="mt-1">
            页面内容正在建设中...
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
