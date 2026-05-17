import { useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Tab, Tabs, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
} from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import type { ReviewVideo, ReviewStatus } from './CloudClassroom';

const mockVideos: ReviewVideo[] = [
  { id: 'r1', title: '函数与极限', subject: '数学', grade: '高一', teacher: '张老师', duration: '45:00', uploadDate: '2026-05-10', status: 'pending', description: '函数基本概念' },
  { id: 'r2', title: '古诗词鉴赏', subject: '语文', grade: '高一', teacher: '李老师', duration: '40:00', uploadDate: '2026-05-11', status: 'pending', description: '古诗词赏析' },
  { id: 'r3', title: '语法基础', subject: '英语', grade: '高二', teacher: '王老师', duration: '45:00', uploadDate: '2026-05-12', status: 'approved' },
  { id: 'r4', title: '力学实验', subject: '物理', grade: '高二', teacher: '陈老师', duration: '50:00', uploadDate: '2026-05-13', status: 'rejected', reviewNote: '视频画面不清晰，请重新录制' },
  { id: 'r5', title: '元素周期表', subject: '化学', grade: '高一', teacher: '刘老师', duration: '45:00', uploadDate: '2026-05-14', status: 'pending' },
  { id: 'r6', title: '细胞结构', subject: '生物', grade: '初一', teacher: '赵老师', duration: '40:00', uploadDate: '2026-05-15', status: 'approved' },
  { id: 'r7', title: '辛亥革命', subject: '历史', grade: '初二', teacher: '周老师', duration: '45:00', uploadDate: '2026-05-16', status: 'rejected', reviewNote: '内容与课程大纲不符' },
  { id: 'r8', title: '大气环流', subject: '地理', grade: '高二', teacher: '吴老师', duration: '45:00', uploadDate: '2026-05-17', status: 'pending' },
];

const statusConfig: Record<ReviewStatus, { label: string; color: 'warning' | 'success' | 'error' }> = {
  pending: { label: '待审核', color: 'warning' },
  approved: { label: '已通过', color: 'success' },
  rejected: { label: '已驳回', color: 'error' },
};

export default function CloudClassroomReview() {
  const [videos, setVideos] = useState(mockVideos);
  const [tabIndex, setTabIndex] = useState(0);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<ReviewVideo | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<ReviewVideo | null>(null);

  const tabs = ['全部', '待审核', '已通过', '已驳回'];
  const tabStatusMap: (ReviewStatus | 'all')[] = ['all', 'pending', 'approved', 'rejected'];

  const filteredVideos = tabIndex === 0
    ? videos
    : videos.filter((v) => v.status === tabStatusMap[tabIndex]);

  const handleApprove = (video: ReviewVideo) => {
    setVideos((prev) => prev.map((v) =>
      v.id === video.id ? { ...v, status: 'approved' as const, reviewNote: undefined } : v
    ));
  };

  const handleRejectOpen = (video: ReviewVideo) => {
    setRejectTarget(video);
    setRejectReason('');
    setRejectOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectTarget) return;
    setVideos((prev) => prev.map((v) =>
      v.id === rejectTarget.id ? { ...v, status: 'rejected' as const, reviewNote: rejectReason } : v
    ));
    setRejectOpen(false);
    setRejectTarget(null);
  };

  const handleReset = (video: ReviewVideo) => {
    setVideos((prev) => prev.map((v) =>
      v.id === video.id ? { ...v, status: 'pending' as const, reviewNote: undefined } : v
    ));
  };

  return (
    <Box className="p-6">
      <Box className="mb-6">
        <Typography variant="h5" className="font-bold">云课堂审核</Typography>
        <Typography variant="body2" color="text.secondary" className="mt-1">
          审核教师上传的视频内容
        </Typography>
      </Box>

      <Tabs value={tabIndex} onChange={(_, i) => setTabIndex(i)} className="mb-4 border-b border-gray-200">
        {tabs.map((t) => <Tab key={t} label={t} />)}
      </Tabs>

      {filteredVideos.length === 0 ? (
        <Box className="text-center py-16">
          <Typography variant="h6" color="text.secondary">暂无审核记录</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>视频标题</TableCell>
                <TableCell width={80}>学科</TableCell>
                <TableCell width={80}>年级</TableCell>
                <TableCell width={100}>授课教师</TableCell>
                <TableCell width={110}>上传时间</TableCell>
                <TableCell width={90}>状态</TableCell>
                <TableCell width={300}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVideos.map((video) => (
                <TableRow key={video.id} hover>
                  <TableCell>
                    <Typography variant="body2" className="font-medium cursor-pointer text-blue-600 hover:underline"
                      onClick={() => { setPreviewTarget(video); setPreviewOpen(true); }}>
                      {video.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={video.subject} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label={video.grade} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{video.teacher}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{video.uploadDate}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusConfig[video.status].label}
                      size="small"
                      color={statusConfig[video.status].color}
                    />
                  </TableCell>
                  <TableCell>
                    <Box className="flex gap-1 items-center">
                      {video.status === 'pending' && (
                        <>
                          <Button size="small" variant="contained" color="success"
                            onClick={() => handleApprove(video)}
                            sx={{ minWidth: 52, fontSize: 12, px: 1 }}>通过</Button>
                          <Button size="small" variant="outlined" color="error"
                            onClick={() => handleRejectOpen(video)}
                            sx={{ minWidth: 52, fontSize: 12, px: 1 }}>驳回</Button>
                        </>
                      )}
                      {video.status === 'approved' && (
                        <Button size="small" variant="outlined"
                          onClick={() => handleReset(video)}
                          sx={{ fontSize: 12, px: 1, whiteSpace: 'nowrap' }}>撤销审核</Button>
                      )}
                      {video.status === 'rejected' && (
                        <Button size="small" variant="outlined"
                          onClick={() => handleReset(video)}
                          sx={{ fontSize: 12, px: 1, whiteSpace: 'nowrap' }}>重新审核</Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 驳回原因弹窗 */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>驳回视频</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" className="mb-3">
            确定驳回视频「{rejectTarget?.title}」？请填写驳回原因。
          </Typography>
          <TextField
            fullWidth multiline rows={3}
            placeholder="请输入驳回原因..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setRejectOpen(false)} variant="outlined">取消</Button>
          <Button onClick={handleRejectConfirm} variant="contained" color="error"
            disabled={!rejectReason.trim()}>确认驳回</Button>
        </DialogActions>
      </Dialog>

      {/* 视频预览弹窗 */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="border-b flex items-center gap-2">
          <PlayArrow className="text-blue-600" />
          <span>{previewTarget?.title}</span>
        </DialogTitle>
        <DialogContent className="p-0">
          <Box className="bg-black flex flex-col">
            <Box className="aspect-video flex items-center justify-center text-white">
              <Box className="text-center">
                <Box className="text-gray-500 text-7xl flex justify-center mb-3">
                  <PlayArrow fontSize="inherit" />
                </Box>
                <Typography variant="h6" className="text-gray-400">
                  {previewTarget?.title}
                </Typography>
                <Typography variant="body2" className="text-gray-600 mt-1">
                  {previewTarget?.description || '视频播放区域'}
                </Typography>
              </Box>
            </Box>
            <Box className="bg-gray-900 px-4 py-2 flex items-center gap-3">
              <PlayArrow fontSize="small" className="text-white" />
              <Box className="flex-1 h-1 bg-gray-700 rounded-full relative">
                <Box className="h-full w-1/3 bg-blue-500 rounded-full" />
              </Box>
              <Typography variant="caption" className="text-gray-400 font-mono">
                00:00 / {previewTarget?.duration}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions className="px-6 py-3 border-t">
          <Box className="flex items-center gap-3 mr-auto">
            <Chip label={previewTarget?.subject} size="small" color="primary" variant="outlined" />
            <Chip label={previewTarget?.grade} size="small" variant="outlined" />
            <Typography variant="caption" color="text.secondary">
              授课：{previewTarget?.teacher}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              上传：{previewTarget?.uploadDate}
            </Typography>
          </Box>
          <Button onClick={() => setPreviewOpen(false)} variant="contained">关闭</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
