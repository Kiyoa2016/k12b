import { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import {
  Slideshow,
  Description,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';

export default function ContentPreview() {
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(1);
  const totalPages = [12, 8]; // 课件12页，教案8页

  const isCourseware = tabValue === 0;
  const currentTotal = totalPages[tabValue];

  return (
    <Box className="h-full flex flex-col">
      {/* 页签 */}
      <Tabs
        value={tabValue}
        onChange={(e, v) => { setTabValue(v); setPage(1); }}
        sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: '0.9rem', minHeight: 40 } }}
      >
        <Tab icon={<Slideshow fontSize="small" />} iconPosition="start" label="课件" />
        <Tab icon={<Description fontSize="small" />} iconPosition="start" label="教案" />
      </Tabs>

      {/* 预览区域 */}
      <Box className="flex-1 mt-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col overflow-hidden">
        <Box className="flex-1 flex items-center justify-center p-6">
          {isCourseware ? (
            <Box className="text-center">
              <Slideshow sx={{ fontSize: 80 }} className="text-blue-300 mb-4" />
              <Typography variant="h6" className="text-gray-700 font-medium">
                函数与极限.pptx
              </Typography>
              <Typography variant="body2" className="text-gray-400 mt-1">
                数学课件 — 第 {page} 页
              </Typography>
              <Box className="mt-6 w-64 h-40 mx-auto bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center">
                <Typography variant="h2" className="text-gray-200 font-bold">
                  {page}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box className="text-center">
              <Description sx={{ fontSize: 80 }} className="text-green-300 mb-4" />
              <Typography variant="h6" className="text-gray-700 font-medium">
                函数与极限_教案.docx
              </Typography>
              <Typography variant="body2" className="text-gray-400 mt-1">
                数学教案 — 第 {page} 页
              </Typography>
              <Box className="mt-6 w-64 h-40 mx-auto bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center">
                <Typography variant="h2" className="text-gray-200 font-bold">
                  {page}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* 翻页控制 */}
        <Box className="border-t border-gray-200 px-4 py-2 flex items-center justify-between bg-white">
          <Typography variant="caption" className="text-gray-500">
            共 {currentTotal} 页
          </Typography>
          <Box className="flex items-center gap-1">
            <IconButton
              size="small"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft fontSize="small" />
            </IconButton>
            <Typography variant="caption" className="min-w-[40px] text-center">
              {page} / {currentTotal}
            </Typography>
            <IconButton
              size="small"
              disabled={page >= currentTotal}
              onClick={() => setPage((p) => Math.min(currentTotal, p + 1))}
            >
              <ChevronRight fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
