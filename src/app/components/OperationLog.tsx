import { Box, Typography } from '@mui/material';
import { ReceiptLong } from '@mui/icons-material';

export default function OperationLog() {
  return (
    <Box className="p-6">
      <Box className="mb-6">
        <Typography variant="h5" className="font-bold">
          运行日志
        </Typography>
        <Typography variant="body2" color="text.secondary" className="mt-1">
          查看系统运行日志，包含设备状态、操作记录和异常信息
        </Typography>
      </Box>
      <Box className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
        <Box className="text-center text-gray-400">
          <ReceiptLong className="text-5xl mb-3 text-gray-300" />
          <Typography variant="h6">运行日志</Typography>
          <Typography variant="body2" className="mt-1">
            页面内容正在建设中...
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
