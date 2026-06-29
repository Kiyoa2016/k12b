import { useState, useRef } from 'react';
import {
  Box, Typography, Button, IconButton, Chip, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, Alert,
} from '@mui/material';
import {
  CloudUpload, AutoAwesome, Gesture, ContentCut, TextSnippet,
  Download, Replay, CheckCircle, Close,
} from '@mui/icons-material';

// ─── 类型定义 ───

type AiFunction = 'optimize' | 'regenerate' | 'cutout' | 'ocr';
type OptimizeLevel = 'low' | 'medium' | 'high';
type RegenerateStyle = '写实' | '插画' | '油画' | '素描';

// ─── 功能选项定义 ───

const FUNCTION_OPTIONS: { key: AiFunction; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: 'optimize', label: '图片优化', icon: <AutoAwesome />, desc: '增强画质、提升清晰度' },
  { key: 'regenerate', label: '重新生成', icon: <Gesture />, desc: '基于原图 AI 重绘' },
  { key: 'cutout', label: '智能抠图', icon: <ContentCut />, desc: '去除背景、替换背景' },
  { key: 'ocr', label: '提取文字', icon: <TextSnippet />, desc: '识别图片内文字内容' },
];

const OPTIMIZE_LEVELS: { key: OptimizeLevel; label: string }[] = [
  { key: 'low', label: '低' },
  { key: 'medium', label: '中' },
  { key: 'high', label: '高' },
];

const REGENERATE_STYLES: RegenerateStyle[] = ['写实', '插画', '油画', '素描'];

const BG_COLORS = ['#4ade80', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa', '#ffffff', '#000000'];

// ─── 模拟处理函数 ───

function simulateProcessing(fn: AiFunction, _file: File | null): Promise<{ imageUrl?: string; text?: string }> {
  return new Promise((resolve) => {
    const delay = 2000 + Math.random() * 1000;
    setTimeout(() => {
      if (fn === 'ocr') {
        resolve({
          text: '本次图片文字识别结果如下：\n\n可编辑文本内容示例\n\n'
            + '1. 第一章 函数与极限\n'
            + '   1.1 函数的定义\n'
            + '   设 x 和 y 是两个变量，D 是实数集的某个子集...\n\n'
            + '2. 若对于任意 x ∈ D，变量 y 按照某种对应法则 f 总有确定的值与之对应...\n\n'
            + '识别时间：2026-06-26 14:30:25\n'
            + '识别语言：中文（简体）',
        });
      } else {
        resolve({ imageUrl: 'processed' });
      }
    }, delay);
  });
}

// ─── 上传区域组件 ───

function UploadZone({
  onFileSelect, hasFile, onClear,
}: {
  onFileSelect: (f: File) => void;
  hasFile: boolean;
  onClear: () => void;
}) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      onFileSelect(file);
    }
  };

  if (hasFile) {
    return (
      <Box className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
        <Box className="flex items-center gap-2">
          <CheckCircle className="text-green-500" />
          <Typography variant="body2" className="font-medium">图片已上传</Typography>
        </Box>
        <Button size="small" startIcon={<Replay />} onClick={onClear}>重新选择</Button>
      </Box>
    );
  }

  return (
    <Box
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
        dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
      }`}
    >
      <CloudUpload className="text-5xl text-gray-400 mb-3" />
      <Typography variant="body1" className="mb-1 font-medium">拖拽图片到此处</Typography>
      <Typography variant="body2" color="text.secondary" className="mb-3">或点击选择文件</Typography>
      <Button variant="contained" size="small">选择文件</Button>
      <Typography variant="caption" color="text.secondary" className="mt-2 block">支持 JPG / PNG / WebP</Typography>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelect(f); }}
      />
    </Box>
  );
}

// ─── 主组件 ───

export default function AIImageProcessing() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [selectedFunction, setSelectedFunction] = useState<AiFunction | null>(null);
  const [optimizeLevel, setOptimizeLevel] = useState<OptimizeLevel>('medium');
  const [regenerateStyle, setRegenerateStyle] = useState<RegenerateStyle>('写实');
  const [replaceBg, setReplaceBg] = useState(false);
  const [bgColor, setBgColor] = useState('#4ade80');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ imageUrl?: string; text?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (f: File) => {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    setError(null);
    setSelectedFunction(null);
  };

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl('');
    setResult(null);
    setSelectedFunction(null);
    setError(null);
  };

  const handleProcess = async () => {
    if (!file || !selectedFunction) return;
    setProcessing(true);
    setError(null);
    setResult(null);
    try {
      const res = await simulateProcessing(selectedFunction, file);
      setResult(res);
    } catch {
      setError('处理失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `processed_${file?.name || 'image.png'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderFunctionParams = () => {
    switch (selectedFunction) {
      case 'optimize':
        return (
          <Box className="mb-3">
            <Typography variant="body2" className="font-medium mb-1">优化强度</Typography>
            <Box className="flex gap-2">
              {OPTIMIZE_LEVELS.map(({ key, label }) => (
                <Chip
                  key={key}
                  label={label}
                  color={optimizeLevel === key ? 'primary' : 'default'}
                  variant={optimizeLevel === key ? 'filled' : 'outlined'}
                  onClick={() => setOptimizeLevel(key)}
                />
              ))}
            </Box>
          </Box>
        );

      case 'regenerate':
        return (
          <Box className="mb-3">
            <Typography variant="body2" className="font-medium mb-1">生成风格</Typography>
            <Box className="flex gap-2 flex-wrap">
              {REGENERATE_STYLES.map((style) => (
                <Chip
                  key={style}
                  label={style}
                  color={regenerateStyle === style ? 'primary' : 'default'}
                  variant={regenerateStyle === style ? 'filled' : 'outlined'}
                  onClick={() => setRegenerateStyle(style)}
                />
              ))}
            </Box>
          </Box>
        );

      case 'cutout':
        return (
          <Box className="mb-3 space-y-3">
            <Box className="flex items-center gap-2">
              <Typography variant="body2" className="font-medium">替换背景</Typography>
              <Chip
                label={replaceBg ? '开启' : '关闭'}
                size="small"
                color={replaceBg ? 'primary' : 'default'}
                onClick={() => setReplaceBg(!replaceBg)}
              />
            </Box>
            {replaceBg && (
              <Box>
                <Typography variant="body2" className="font-medium mb-1">背景颜色</Typography>
                <Box className="flex gap-2 items-center flex-wrap">
                  {BG_COLORS.map((c) => (
                    <Box
                      key={c}
                      onClick={() => setBgColor(c)}
                      sx={{
                        width: 26, height: 26, borderRadius: '50%', cursor: 'pointer',
                        bgcolor: c, border: bgColor === c ? '3px solid #3b82f6' : '2px solid #e0e0e0',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        );

      case 'ocr':
        return (
          <Box className="mb-3">
            <Typography variant="body2" color="text.secondary">
              📝 一键识别图片中的文字内容，支持中文、英文
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box className="overflow-auto h-[calc(100vh-64px)] bg-gray-50">
      <Box className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* 标题 */}
        <Box className="mb-4">
          <Typography variant="h5" className="font-bold">🤖 AI 图片处理</Typography>
          <Typography variant="body2" color="text.secondary" className="mt-1">
            上传图片，使用 AI 进行优化、抠图、文字提取等操作
          </Typography>
        </Box>

        {/* 上传区域 */}
        <Box className="mb-4">
          <UploadZone onFileSelect={handleFileSelect} hasFile={Boolean(file)} onClear={handleClear} />
        </Box>

        {file && (
          <Box className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
            {/* 左侧：图片预览 */}
            <Box className="lg:col-span-2">
              <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <Box className="bg-gray-900 flex items-center justify-center min-h-[240px] p-3">
                  <img src={previewUrl} alt="preview" className="max-w-full max-h-[300px] object-contain rounded" />
                </Box>
                <Box className="p-2 text-center border-t border-gray-100">
                  <Typography variant="caption" color="text.secondary">
                    {file.name} ({(file.size / 1024).toFixed(0)} KB)
                  </Typography>
                </Box>
              </Card>
            </Box>

            {/* 右侧：功能操作 */}
            <Box className="lg:col-span-3">
              <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" className="font-bold mb-3">选择 AI 功能</Typography>

                  {/* 功能卡片选择 */}
                  <Box className="grid grid-cols-2 gap-2 mb-4">
                    {FUNCTION_OPTIONS.map((opt) => (
                      <Card
                        key={opt.key}
                        className={`cursor-pointer transition-all ${
                          selectedFunction === opt.key
                            ? 'border-2 border-blue-500 bg-blue-50'
                            : 'border border-gray-200 hover:border-blue-300'
                        }`}
                        sx={{ borderRadius: 2 }}
                        onClick={() => setSelectedFunction(opt.key)}
                      >
                        <CardContent className="text-center py-3 px-2">
                          <Box className={selectedFunction === opt.key ? 'text-blue-600' : 'text-gray-400'}>
                            {opt.icon}
                          </Box>
                          <Typography variant="body2" className="font-medium mt-1">{opt.label}</Typography>
                          <Typography variant="caption" color="text.secondary" className="block">{opt.desc}</Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>

                  {/* 参数配置 */}
                  {selectedFunction && (
                    <>
                      <Typography variant="subtitle2" className="font-bold mb-2">参数配置</Typography>
                      {renderFunctionParams()}

                      <Button
                        variant="contained"
                        size="medium"
                        startIcon={processing ? undefined : <AutoAwesome />}
                        onClick={handleProcess}
                        disabled={processing}
                        className="mt-2"
                      >
                        {processing ? '处理中...' : '开始处理'}
                      </Button>
                      {processing && <LinearProgress className="mt-3" />}
                    </>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}

        {/* 错误提示 */}
        {error && (
          <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* 处理结果 */}
        {result && (
          <Box>
            <Typography variant="h6" className="font-bold mb-3">📊 处理结果</Typography>
            <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
              <CardContent>
                {result.imageUrl ? (
                  <Box>
                    <Box
                      className="bg-gray-900 rounded-lg flex items-center justify-center p-4 mb-3 min-h-[200px]"
                      sx={{
                        ...(selectedFunction === 'cutout'
                          ? {
                              backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                              backgroundSize: '20px 20px',
                              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                            }
                          : {}),
                        ...(selectedFunction === 'cutout' && replaceBg ? { backgroundColor: bgColor } : {}),
                      }}
                    >
                      <img src={previewUrl} alt="processed" className="max-w-full max-h-[300px] object-contain rounded" />
                    </Box>
                    <Box className="flex gap-2">
                      <Button variant="contained" size="small" startIcon={<Download />} onClick={handleDownload}>
                        下载结果
                      </Button>
                    </Box>
                  </Box>
                ) : result.text ? (
                  <Box>
                    <Box className="bg-gray-50 rounded-lg p-4 mb-3 whitespace-pre-wrap font-mono text-sm max-h-64 overflow-auto">
                      {result.text}
                    </Box>
                    <Box className="flex gap-2">
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigator.clipboard.writeText(result.text || '')}
                      >
                        复制文字
                      </Button>
                    </Box>
                  </Box>
                ) : null}
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
    </Box>
  );
}
