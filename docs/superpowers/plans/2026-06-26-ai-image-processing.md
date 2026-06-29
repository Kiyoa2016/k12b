# AI 图片处理功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在果仁云菜单下新增 AI 模块，实现 AI 图片处理单页工作流页面。

**Architecture:** 单组件模式，AIImageProcessing.tsx 包含全部 UI 和 Mock 逻辑。App.tsx 添加菜单和路由，permissions.ts 添加页面配置。

**Tech Stack:** React 18 + TypeScript, MUI v7, Tailwind CSS v4

## 全局约束

- 使用 MUI Box/Typography/Button/Chip 等组件 + Tailwind 样式类
- 内容区高度使用 h-[calc(100vh-64px)]
- Mock 处理延迟 2-3 秒
- 四个功能用 Chip 单选切换
- 使用已有 import 图片作为示例

---

### Task 1: 权限配置 — permissions.ts

**Files:**
- Modify: `src/app/types/permissions.ts`

- [ ] **Step 1: 在 ALL_PAGES 数组中新增 `ai-image` 页面配置**

在 `news-broadcast` 条目之后（或其他合适位置）添加：

```typescript
  {
    key: 'ai-image',
    label: 'AI 图片处理',
    buttons: [
      { key: 'upload', label: '上传图片' },
      { key: 'optimize', label: '图片优化' },
      { key: 'regenerate', label: '重新生成' },
      { key: 'cutout', label: '智能抠图' },
      { key: 'ocr', label: '提取文字' },
      { key: 'download', label: '下载结果' },
    ],
  },
```

---

### Task 2: 新建 AIImageProcessing.tsx 组件

**Files:**
- Create: `src/app/components/AIImageProcessing.tsx`

**全部代码一次写入**，包含以下结构：

#### 2a: import + 类型定义

```typescript
import { useState, useRef } from 'react';
import {
  Box, Typography, Button, IconButton, Chip, Card, CardContent,
  Icon, Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, Alert,
} from '@mui/material';
import {
  CloudUpload, AutoAwesome, Gesture, ContentCut, TextSnippet,
  Download, Replay, CheckCircle, Close,
} from '@mui/icons-material';

type AiFunction = 'optimize' | 'regenerate' | 'cutout' | 'ocr' | null;

type OptimizeLevel = 'low' | 'medium' | 'high';
type RegenerateStyle = '写实' | '插画' | '油画' | '素描';
```

#### 2b: Mock 模拟函数

```typescript
function simulateProcessing(fn: AiFunction, _file: File | null): Promise<{
  imageUrl?: string;
  text?: string;
}> {
  return new Promise((resolve) => {
    const delay = 2000 + Math.random() * 1000;
    setTimeout(() => {
      if (fn === 'ocr') {
        resolve({
          text: '本次图片文字识别结果如下：\n\n可编辑文本内容示例\n\n' +
            '1. 第一章 函数与极限\n' +
            '   1.1 函数的定义\n' +
            '   设 x 和 y 是两个变量，D 是实数集的某个子集...\n\n' +
            '2. 若对于任意 x ∈ D，变量 y 按照某种对应法则 f 总有确定的值与之对应...\n\n' +
            '识别时间：2026-06-26 14:30:25\n' +
            '识别语言：中文（简体）',
        });
      } else {
        // 其他功能返回 "处理后" 的图片（使用随机滤镜模拟）
        resolve({ imageUrl: URL.createObjectURL(_file!) + '#processed' });
      }
    }, delay);
  });
}
```

#### 2c: 上传区域组件

```typescript
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
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
        dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
      }`}
    >
      <CloudUpload className="text-5xl text-gray-400 mb-3" />
      <Typography variant="body1" className="mb-1 font-medium">拖拽图片到此处</Typography>
      <Typography variant="body2" color="text.secondary" className="mb-3">或点击选择文件</Typography>
      <Button variant="contained" size="small">选择文件</Button>
      <Typography variant="caption" color="text.secondary" className="mt-2 block">支持 JPG / PNG / WebP</Typography>
      <input ref={inputRef} type="file" hidden accept="image/png,image/jpeg,image/webp"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelect(f); }} />
    </Box>
  );
}
```

#### 2d: 功能选择与参数配置区

```typescript
const FUNCTION_OPTIONS: { key: AiFunction; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: 'optimize', label: '图片优化', icon: <AutoAwesome />, desc: '增强画质、提升清晰度' },
  { key: 'regenerate', label: '重新生成', icon: <Gesture />, desc: '基于原图 AI 重绘' },
  { key: 'cutout', label: '智能抠图', icon: <ContentCut />, desc: '去除背景、替换背景' },
  { key: 'ocr', label: '提取文字', icon: <TextSnippet />, desc: '识别图片内文字内容' },
];

// 在组件内：
const [selectedFunction, setSelectedFunction] = useState<AiFunction>(null);
const [optimizeLevel, setOptimizeLevel] = useState<OptimizeLevel>('medium');
const [regenerateStyle, setRegenerateStyle] = useState<RegenerateStyle>('写实');
const [replaceBg, setReplaceBg] = useState(false);
const [bgColor, setBgColor] = useState('#4ade80');
```

#### 2e: 主组件 JSX 布局

```
┌──────────────────────────────────────────────────────────────┐
│  🤖 AI 图片处理                                                │
├──────────────────────────────────────────────────────────────┤
│  上传区域 (UploadZone)                                        │
├──────────────────────────────────────────────────────────────┤
│  ┌─ 预览区 ───────┐  ┌─ 功能操作区 ────────────────────────┐  │
│  │  [原图预览]     │  │  功能选择 Chip 行                    │  │
│  │                 │  │  参数配置区域                        │  │
│  │                 │  │  [开始处理] 按钮                     │  │
│  └────────────────┘  └─────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  处理结果区域                                                  │
└──────────────────────────────────────────────────────────────┘
```

#### 2f: 完整主组件代码

```typescript
export default function AIImageProcessing() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [selectedFunction, setSelectedFunction] = useState<AiFunction>(null);
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
  };

  const handleClear = () => {
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

  const renderFunctionParams = () => {
    switch (selectedFunction) {
      case 'optimize':
        return (
          <Box className="mb-3">
            <Typography variant="body2" className="font-medium mb-1">优化强度</Typography>
            <Box className="flex gap-2">
              {(['low', 'medium', 'high'] as OptimizeLevel[]).map((level) => (
                <Chip key={level}
                  label={level === 'low' ? '低' : level === 'medium' ? '中' : '高'}
                  color={optimizeLevel === level ? 'primary' : 'default'}
                  variant={optimizeLevel === level ? 'filled' : 'outlined'}
                  onClick={() => setOptimizeLevel(level)}
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
              {(['写实', '插画', '油画', '素描'] as RegenerateStyle[]).map((style) => (
                <Chip key={style} label={style}
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
          <Box className="mb-3 space-y-2">
            <Box className="flex items-center gap-2">
              <Typography variant="body2" className="font-medium">替换背景</Typography>
              <Chip label={replaceBg ? '开启' : '关闭'}
                size="small"
                color={replaceBg ? 'primary' : 'default'}
                onClick={() => setReplaceBg(!replaceBg)}
              />
            </Box>
            {replaceBg && (
              <Box className="flex items-center gap-2">
                <Typography variant="body2">背景颜色：</Typography>
                <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: bgColor, border: '2px solid #e0e0e0' }} />
                {['#4ade80', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa', '#ffffff', '#000000'].map((c) => (
                  <Box key={c} onClick={() => setBgColor(c)}
                    sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: c, cursor: 'pointer', border: bgColor === c ? '3px solid #3b82f6' : '2px solid #e0e0e0' }} />
                ))}
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
                <Box className="p-3 bg-gray-900 flex items-center justify-center min-h-[240px]">
                  <img src={previewUrl} alt="preview" className="max-w-full max-h-[300px] object-contain rounded" />
                </Box>
                <Box className="p-2 text-center border-t border-gray-100">
                  <Typography variant="caption" color="text.secondary">{file.name} ({(file.size / 1024).toFixed(0)} KB)</Typography>
                </Box>
              </Card>
            </Box>

            {/* 右侧：功能操作 */}
            <Box className="lg:col-span-3">
              <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" className="font-bold mb-3">选择 AI 功能</Typography>
                  <Box className="flex gap-2 mb-4 flex-wrap">
                    {FUNCTION_OPTIONS.map((opt) => (
                      <Card key={opt.key}
                        className={`flex-1 min-w-[120px] cursor-pointer transition-all ${
                          selectedFunction === opt.key ? 'border-2 border-blue-500 bg-blue-50' : 'border border-gray-200 hover:border-blue-300'
                        }`}
                        sx={{ borderRadius: 2 }}
                        onClick={() => setSelectedFunction(opt.key)}
                      >
                        <CardContent className="text-center py-3 px-2">
                          <Box className={selectedFunction === opt.key ? 'text-blue-600' : 'text-gray-400'}>{opt.icon}</Box>
                          <Typography variant="body2" className="font-medium mt-1">{opt.label}</Typography>
                          <Typography variant="caption" color="text.secondary" className="block">{opt.desc}</Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>

                  {selectedFunction && (
                    <>
                      <Typography variant="subtitle2" className="font-bold mb-2">参数配置</Typography>
                      {renderFunctionParams()}

                      <Button variant="contained" size="medium"
                        startIcon={processing ? undefined : <AutoAwesome />}
                        onClick={handleProcess}
                        disabled={processing}
                        className="mt-2"
                      >
                        {processing ? '处理中...' : '开始处理'}
                      </Button>
                      {processing && <LinearProgress className="mt-2" />}
                    </>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}

        {/* 错误提示 */}
        {error && (
          <Alert severity="error" className="mb-4" onClose={() => setError(null)}>{error}</Alert>
        )}

        {/* 处理结果 */}
        {result && (
          <Box>
            <Typography variant="h6" className="font-bold mb-3">📊 处理结果</Typography>
            <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
              <CardContent>
                {result.imageUrl ? (
                  <Box>
                    <Box className="bg-gray-900 rounded-lg flex items-center justify-center p-4 mb-3 min-h-[200px]">
                      <Box className="relative">
                        <img src={previewUrl} alt="processed" className="max-w-full max-h-[300px] object-contain rounded" />
                        {selectedFunction === 'cutout' && (
                          <Box sx={{
                            position: 'absolute', inset: 0,
                            backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                            backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                            borderRadius: 'inherit', opacity: 0.3, pointerEvents: 'none',
                          }} />
                        )}
                      </Box>
                    </Box>
                    <Box className="flex gap-2">
                      <Button variant="contained" size="small" startIcon={<Download />}>下载结果</Button>
                      <Button variant="outlined" size="small" startIcon={<Replay />} onClick={handleClear}>重新上传</Button>
                    </Box>
                  </Box>
                ) : result.text ? (
                  <Box>
                    <Box className="bg-gray-50 rounded-lg p-4 mb-3 whitespace-pre-wrap font-mono text-sm">
                      {result.text}
                    </Box>
                    <Box className="flex gap-2">
                      <Button variant="contained" size="small"
                        onClick={() => navigator.clipboard.writeText(result.text || '')}>
                        复制文字
                      </Button>
                      <Button variant="outlined" size="small" startIcon={<Replay />} onClick={handleClear}>重新上传</Button>
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
```

---

### Task 3: App.tsx — 菜单 + 路由

**Files:**
- Modify: `src/app/App.tsx`

- [ ] **Step 1: 引入 AIImageProcessing 组件**

在 import 区块添加：
```typescript
import AIImageProcessing from './components/AIImageProcessing';
```

- [ ] **Step 2: 更新 currentPage 类型**

在 `useState<'template' | ... >` 的联合类型中添加 `'ai-image'`：
```typescript
// 找到类似 'security-policy' | 'operation-log' 的位置
// 在末尾 | 'operation-log' 之后添加
| 'ai-image'
```

- [ ] **Step 3: 在 guorenyun 菜单组中添加 AI 模块**

找到 `guorenyun` 菜单组的 children 数组，在末尾添加：
```typescript
{
  id: 'ai-module-parent', label: 'AI 模块', icon: <AutoAwesome />,
  children: [
    { id: 'ai-image', label: 'AI 图片处理', pageId: 'ai-image' },
  ],
},
```

需要 import `AutoAwesome` from `@mui/icons-material`。

在顶部 import 中添加：
```typescript
import { ..., AutoAwesome, ... } from '@mui/icons-material';
```

- [ ] **Step 4: 添加路由条件渲染**

在 `App.tsx` 的页面条件渲染区域（`currentPage === 'voice-mgmt' ? ...` 附近）添加：
```typescript
) : currentPage === 'ai-image' ? (
  <AIImageProcessing />
) : (
```
放在已有条件分支的末尾（`voice-mgmt` 之后、`(` 回退之前）。
