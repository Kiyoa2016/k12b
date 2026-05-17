import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  Videocam,
  Add,
  Close,
  Link as LinkIcon,
  PlayCircle,
  StopCircle,
  Delete,
  InfoOutlined,
} from '@mui/icons-material';
import Hls from 'hls.js';

interface Stream {
  id: string;
  name: string;
  url: string;
  status: 'playing' | 'stopped' | 'error';
}

function isRtmpUrl(url: string) {
  return url.trim().toLowerCase().startsWith('rtmp://');
}

function isHlsUrl(url: string) {
  return url.trim().toLowerCase().includes('.m3u8');
}

export default function LiveStream() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newStream, setNewStream] = useState({ name: '', url: '' });
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const hlsInstances = useRef<Record<string, Hls | null>>({});

  // 清理 Hls 实例
  const destroyHls = (id: string) => {
    if (hlsInstances.current[id]) {
      hlsInstances.current[id]!.destroy();
      hlsInstances.current[id] = null;
    }
  };

  const playStream = (stream: Stream) => {
    const video = videoRefs.current[stream.id];
    if (!video) return;

    // RTMP 无法在浏览器播放
    if (isRtmpUrl(stream.url)) {
      setStreams((prev) =>
        prev.map((s) => (s.id === stream.id ? { ...s, status: 'error' } : s))
      );
      return;
    }

    // HLS 使用 hls.js
    if (isHlsUrl(stream.url)) {
      if (Hls.isSupported()) {
        destroyHls(stream.id);
        const hls = new Hls();
        hls.loadSource(stream.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, () => {
          setStreams((prev) =>
            prev.map((s) => (s.id === stream.id ? { ...s, status: 'error' } : s))
          );
        });
        hlsInstances.current[stream.id] = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari 原生 HLS
        video.src = stream.url;
        video.play().catch(() => {});
      } else {
        setStreams((prev) =>
          prev.map((s) => (s.id === stream.id ? { ...s, status: 'error' } : s))
        );
      }
    } else {
      // 普通视频流（MP4 等）
      video.src = stream.url;
      video.play().catch(() => {});
    }
  };

  const stopStream = (stream: Stream) => {
    const video = videoRefs.current[stream.id];
    if (video) { video.pause(); video.src = ''; }
    destroyHls(stream.id);
  };

  const togglePlay = (stream: Stream) => {
    if (stream.status === 'playing') {
      stopStream(stream);
      setStreams((prev) =>
        prev.map((s) => (s.id === stream.id ? { ...s, status: 'stopped' } : s))
      );
    } else {
      setStreams((prev) =>
        prev.map((s) => (s.id === stream.id ? { ...s, status: 'playing' } : s))
      );
      playStream(stream);
    }
  };

  const handleAddStream = () => {
    if (!newStream.name.trim() || !newStream.url.trim()) return;
    setStreams((prev) => [
      ...prev,
      { id: Date.now().toString(), name: newStream.name, url: newStream.url, status: 'stopped' },
    ]);
    setNewStream({ name: '', url: '' });
    setAddDialogOpen(false);
  };

  const handleDeleteStream = (id: string) => {
    stopStream({ id, name: '', url: '', status: 'stopped' });
    setStreams((prev) => prev.filter((s) => s.id !== id));
  };

  // 组件卸载时清理所有 Hls 实例
  useEffect(() => {
    return () => {
      Object.keys(hlsInstances.current).forEach((id) => destroyHls(id));
    };
  }, []);

  const getStreamError = (stream: Stream) => {
    if (stream.status === 'error' && isRtmpUrl(stream.url)) {
      return 'RTMP 无法在浏览器直接播放，请使用 HLS 地址（.m3u8）';
    }
    return null;
  };

  return (
    <Box className="p-6">
      {/* 标题栏 */}
      <Box className="mb-6 flex items-center justify-between">
        <Box>
          <Typography variant="h5" className="font-bold">
            实时流
          </Typography>
          <Typography variant="body2" color="text.secondary" className="mt-1">
            管理并预览视频流（支持 HLS / RTMP 转 HLS）
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddDialogOpen(true)}
        >
          添加流
        </Button>
      </Box>

      {/* 流列表 */}
      {streams.length === 0 ? (
        <Box className="text-center py-16">
          <Videocam className="text-6xl text-gray-300 mb-4" />
          <Typography variant="h6" color="text.secondary">
            暂无视频流
          </Typography>
          <Typography variant="body2" color="text.secondary" className="mt-2">
            点击"添加流"按钮添加视频流地址
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {streams.map((stream) => {
            const errorHint = getStreamError(stream);
            return (
              <Grid item xs={12} sm={6} lg={4} key={stream.id}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  {/* 视频区域 */}
                  <Box className="relative bg-black aspect-video flex items-center justify-center">
                    {stream.status === 'playing' ? (
                      <video
                        ref={(el) => { videoRefs.current[stream.id] = el; }}
                        controls
                        autoPlay
                        className="w-full h-full object-contain"
                        onError={() => {
                          if (!isRtmpUrl(stream.url)) {
                            setStreams((prev) =>
                              prev.map((s) => (s.id === stream.id ? { ...s, status: 'error' } : s))
                            );
                          }
                        }}
                      />
                    ) : (
                      <Box className="text-center text-gray-500">
                        <Videocam sx={{ fontSize: 48 }} />
                        <Typography variant="body2" className="mt-1 text-gray-600">
                          {stream.status === 'error' ? '播放失败' : '点击播放'}
                        </Typography>
                      </Box>
                    )}
                    {/* 状态标签 */}
                    <Chip
                      label={
                        stream.status === 'playing' ? '播放中' :
                        stream.status === 'error' ? '异常' : '已停止'
                      }
                      size="small"
                      className={`absolute top-2 right-2 ${
                        stream.status === 'playing' ? 'bg-green-500 text-white' :
                        stream.status === 'error' ? 'bg-red-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}
                    />
                  </Box>
                  <CardContent>
                    {errorHint && (
                      <Alert severity="warning" icon={<InfoOutlined />} className="mb-2 !text-xs !py-1 !px-2">
                        {errorHint}
                      </Alert>
                    )}
                    <Box className="flex items-start justify-between">
                      <Box className="flex-1 min-w-0 mr-2">
                        <Typography variant="subtitle1" className="font-medium truncate">
                          {stream.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" className="truncate block">
                          {stream.url}
                        </Typography>
                      </Box>
                      <Box className="flex gap-1 flex-shrink-0">
                        <IconButton
                          size="small"
                          onClick={() => togglePlay(stream)}
                          color={stream.status === 'playing' ? 'error' : 'primary'}
                        >
                          {stream.status === 'playing' ? <StopCircle /> : <PlayCircle />}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteStream(stream.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* 添加流弹窗 */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="border-b">
          <Box className="flex items-center justify-between">
            <Typography variant="h6">添加视频流</Typography>
            <IconButton onClick={() => setAddDialogOpen(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box className="py-4 flex flex-col gap-4">
            <TextField
              fullWidth
              size="small"
              label="流名称"
              value={newStream.name}
              onChange={(e) => setNewStream({ ...newStream, name: e.target.value })}
              placeholder="例如：东教学楼-大厅"
            />
            <TextField
              fullWidth
              size="small"
              label="流地址"
              value={newStream.url}
              onChange={(e) => setNewStream({ ...newStream, url: e.target.value })}
              placeholder="http://example.com/live/stream.m3u8"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Alert severity="info" className="!text-xs !py-2">
              <Typography variant="caption">
                浏览器不支持 RTMP 协议。请使用 HLS 地址（.m3u8），例如：<br />
                <code className="text-blue-600 break-all">http://211.149.202.34:8080/live/B010102.m3u8</code>
                <br />
                （需要流媒体服务器将 RTMP 转为 HLS）
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setAddDialogOpen(false)} variant="outlined">取消</Button>
          <Button onClick={handleAddStream} variant="contained" disabled={!newStream.name.trim() || !newStream.url.trim()}>
            确定
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
