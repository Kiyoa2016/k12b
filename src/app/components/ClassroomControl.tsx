import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  InputAdornment,
  Grid,
  Chip,
} from '@mui/material';
import {
  Close,
  Videocam,
  Send,
  PowerSettingsNew,
  VolumeUp,
  CheckCircle,
} from '@mui/icons-material';

interface ClassroomControlProps {
  open: boolean;
  onClose: () => void;
  classroom: {
    name: string;
    code: string;
  };
}

export default function ClassroomControl({ open, onClose, classroom }: ClassroomControlProps) {
  const [selectedFeed, setSelectedFeed] = useState('teacher');
  const [textMessage, setTextMessage] = useState('');

  const handleShutdown = () => {
    console.log('关机指令已发送给:', classroom.code);
  };

  const handleRemoteCall = () => {
    console.log('远程喊话已开启:', classroom.code);
  };

  const handleSendText = () => {
    if (!textMessage.trim()) return;
    console.log('文字消息已发送:', textMessage);
    setTextMessage('');
  };

  const videoFeeds = [
    { id: 'teacher', label: '老师', icon: <Videocam />, color: 'bg-blue-500' },
    { id: 'student', label: '学生', icon: <Videocam />, color: 'bg-green-500' },
    { id: 'whiteboard', label: '白板', icon: <Videocam />, color: 'bg-purple-500' },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        className: "h-[90vh]"
      }}
    >
      {/* 标题栏 */}
      <DialogTitle className="border-b bg-gray-50">
        <Box className="flex items-center justify-between">
          <Box>
            <Typography variant="h6" className="font-bold">
              集控 - {classroom.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              编号: {classroom.code}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent className="p-0" sx={{ overflow: 'hidden' }}>
        <Box className="h-full flex flex-col">
          {/* 视频区域（全宽） */}
          <Box className="flex-1 relative bg-gray-900">
            {/* 视频占位 */}
            <Box className="w-full h-full flex items-center justify-center">
              <Box className="text-center text-gray-500">
                <Videocam sx={{ fontSize: 64 }} />
                <Typography variant="h5" className="mt-2 text-gray-400">
                  {videoFeeds.find((f) => f.id === selectedFeed)?.label} 画面
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  实时视频流
                </Typography>
              </Box>
            </Box>

            {/* 左侧浮动摄像头列表 */}
            <Box className="absolute left-4 top-4 flex flex-col gap-2">
              {videoFeeds.map((feed) => (
                <Box
                  key={feed.id}
                  onClick={() => setSelectedFeed(feed.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    selectedFeed === feed.id
                      ? 'bg-white text-gray-900 shadow-lg'
                      : 'bg-black/50 text-white hover:bg-black/60'
                  }`}
                >
                  <Box className={`w-2 h-2 rounded-full ${feed.color}`} />
                  <Typography variant="body2" className="font-medium whitespace-nowrap">
                    {feed.label}
                  </Typography>
                  {selectedFeed === feed.id && (
                    <CheckCircle fontSize="small" className="text-blue-500" />
                  )}
                </Box>
              ))}
            </Box>

            {/* 画面右上角 - 设备信息 */}
            <Box className="absolute top-4 right-4 bg-black/60 rounded-lg px-3 py-2 text-white text-xs">
              <Box className="flex items-center gap-2 mb-1">
                <Box className="w-2 h-2 rounded-full bg-green-500" />
                <span>在线</span>
              </Box>
              <Box className="text-gray-300">
                <div>设备编号: {classroom.code}</div>
                <div>系统版本: v2.1.0</div>
              </Box>
            </Box>

            {/* 画面左下角 - 摄像头标签 */}
            <Chip
              label={videoFeeds.find((f) => f.id === selectedFeed)?.label}
              size="small"
              className="absolute bottom-4 left-4 bg-black/60 text-white"
            />
          </Box>

          {/* 底部控制栏 */}
          <Box className="bg-gray-50 border-t border-gray-200 p-4">
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <Box className="flex gap-2">
                  <Button
                    variant="outlined"
                    startIcon={<VolumeUp />}
                    onClick={handleRemoteCall}
                    className="flex-1"
                    sx={{ textTransform: 'none' }}
                  >
                    远程喊话
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PowerSettingsNew />}
                    onClick={handleShutdown}
                    className="flex-1 text-red-600 border-red-300 hover:border-red-500"
                    sx={{ textTransform: 'none' }}
                  >
                    关机
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="输入要发送的文字内容..."
                  value={textMessage}
                  onChange={(e) => setTextMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={handleSendText}
                          disabled={!textMessage.trim()}
                          sx={{ textTransform: 'none', mr: -0.5 }}
                        >
                          发送
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
