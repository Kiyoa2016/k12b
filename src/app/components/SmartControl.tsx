import { useState, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Switch,
  Select, MenuItem, FormControl, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import { Save, CloudUpload, Close, Image, Computer, CheckCircle } from '@mui/icons-material';

// ─── 类型定义 ───

type SmartFeature = 'screensaver' | 'eye-care' | 'energy-saving';

interface UploadedImage {
  id: string;
  url: string;
  name: string;
}

interface FeatureConfig {
  enabled: boolean;
  [key: string]: any;
}

// ─── 常量 ───

const DEVICE_NAMES = [
  '东教学楼101教室终端', '东教学楼102教室终端', '东教学楼103教室终端',
  '东教学楼201教室终端', '东教学楼202教室终端', '东教学楼301教室终端',
  '西教学楼101教室终端', '西教学楼102教室终端',
  '西教学楼201教室终端', '西教学楼202教室终端', '西教学楼203教室终端',
  '综合楼101教室终端', '综合楼102教室终端', '综合楼103教室终端',
  '综合楼104教室终端', '综合楼201教室终端', '综合楼202教室终端',
];

// ─── 设备选择弹窗 ───

function DeviceSelectDialog({
  open, onClose, selected, onChange,
}: {
  open: boolean;
  onClose: () => void;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Box className="flex items-center justify-between">
          <Typography variant="h6">选择目标设备</Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box className="pt-2 max-h-72 overflow-auto space-y-1">
          <Box onClick={() => onChange(selected.length === DEVICE_NAMES.length ? [] : DEVICE_NAMES.map((_, i) => String(i)))}
            className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 mb-2">
            <CheckCircle sx={{ fontSize: 18, color: selected.length === DEVICE_NAMES.length ? '#3b82f6' : '#d1d5db' }} />
            <Typography variant="body2" className="font-medium">全选</Typography>
          </Box>
          {DEVICE_NAMES.map((name, i) => (
            <Box key={String(i)} onClick={() => toggle(String(i))}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${selected.includes(String(i)) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
              <Computer sx={{ fontSize: 18, color: selected.includes(String(i)) ? '#3b82f6' : '#9ca3af' }} />
              <Typography variant="body2">{name}</Typography>
              {selected.includes(String(i)) && <CheckCircle sx={{ fontSize: 16, color: '#3b82f6', ml: 'auto' }} />}
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions className="px-6 pb-4">
        <Button onClick={onClose} variant="contained" size="small">确定</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── 主组件 ───

export default function SmartControl() {
  const [activeDeviceDialog, setActiveDeviceDialog] = useState<'eye-care' | 'energy-saving' | null>(null);
  const [configs, setConfigs] = useState<Record<SmartFeature, FeatureConfig>>({
    'screensaver': {
      enabled: true,
      timeout: '10',
      images: [] as UploadedImage[],
    },
    'eye-care': {
      enabled: true,
      blueLightFilter: 'medium',
      timeRangeStart: '08:00',
      timeRangeEnd: '17:00',
      idleTimeout: '10',
      action: 'screensaver',
      deviceIds: [] as string[],
    },
    'energy-saving': {
      enabled: true,
      scheduledTime: '',
      scheduledTimeEnabled: false,
      idleTimeout: '30',
      mode: 'force',
      action: 'off',
      deviceIds: [] as string[],
    },
  });
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleFeature = (key: SmartFeature) => {
    setConfigs((prev) => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled } }));
  };

  const updateField = (feature: SmartFeature, field: string, value: any) => {
    setConfigs((prev) => ({ ...prev, [feature]: { ...prev[feature], [field]: value } }));
  };

  const handleUploadImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: UploadedImage[] = Array.from(files).map((file) => ({
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setConfigs((prev) => ({
      ...prev,
      screensaver: { ...prev.screensaver, images: [...prev.screensaver.images, ...newImages] },
    }));
    e.target.value = '';
  };

  const handleRemoveImage = (id: string) => {
    setConfigs((prev) => {
      const img = prev.screensaver.images.find((i: UploadedImage) => i.id === id);
      if (img) URL.revokeObjectURL(img.url);
      return {
        ...prev,
        screensaver: {
          ...prev.screensaver,
          images: prev.screensaver.images.filter((i: UploadedImage) => i.id !== id),
        },
      };
    });
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const screensaverConfig = configs.screensaver;
  const eyeCare = configs['eye-care'];
  const energySaving = configs['energy-saving'];
  const previewImage = screensaverConfig.images.length > 0 ? screensaverConfig.images[0].url : null;

  return (
    <Box className="overflow-auto h-[calc(100vh-64px)] bg-gray-50">
      <Box className="p-4 sm:p-6 max-w-6xl mx-auto">
        <Box className="mb-4">
          <Typography variant="h5" className="font-bold">🧠 智慧管控</Typography>
          <Typography variant="body2" color="text.secondary" className="mt-1">
            统一管理教室终端的屏保、护眼和节能策略
          </Typography>
        </Box>

        <Box className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* ===== 卡片 1: 屏保管理 ===== */}
          <Card elevation={0} sx={{
            border: `1px solid ${screensaverConfig.enabled ? '#3b82f6' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: 3,
          }}>
            <Box className="flex items-center justify-between p-5 pb-0">
              <Box className="flex items-center gap-2">
                <Typography variant="h4" sx={{ lineHeight: 1 }}>🖥️</Typography>
                <Typography variant="h6" className="font-bold">屏保管理</Typography>
              </Box>
              <Switch size="medium" checked={screensaverConfig.enabled} onChange={() => toggleFeature('screensaver')} color="primary" />
            </Box>
            <CardContent className="p-5 pt-3">
              <Typography variant="body2" color="text.secondary" className="mb-4">
                设置教室终端空闲时自动进入屏幕保护，支持上传多张图片轮播展示
              </Typography>

              <Box className="mb-4">
                <Typography variant="caption" color="text.secondary" className="mb-1 block font-medium">屏保预览</Typography>
                <Box className="bg-gray-900 rounded-lg overflow-hidden min-h-[140px] flex items-center justify-center">
                  {previewImage ? (
                    <img src={previewImage} alt="preview" className="w-full max-h-[180px] object-contain" />
                  ) : (
                    <Box className="text-center text-gray-500 py-8">
                      <Image sx={{ fontSize: 36 }} className="mb-1" />
                      <Typography variant="caption">请上传屏保图片</Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              <Box className="mb-4">
                <Typography variant="caption" color="text.secondary" className="mb-1 block font-medium">上传屏保图片（支持多张轮播）</Typography>
                <Box onClick={() => screensaverConfig.enabled && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                    !screensaverConfig.enabled ? 'border-gray-200 bg-gray-50 opacity-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}>
                  <CloudUpload sx={{ fontSize: 24, color: '#9ca3af' }} className="mb-1" />
                  <Typography variant="caption" color="text.secondary" className="block">点击上传图片（JPG/PNG/WebP）</Typography>
                  <input ref={fileInputRef} type="file" hidden multiple accept="image/png,image/jpeg,image/webp" onChange={handleUploadImages} />
                </Box>
              </Box>

              {screensaverConfig.images.length > 0 && (
                <Box className="mb-4">
                  <Typography variant="caption" color="text.secondary" className="mb-2 block font-medium">已上传 {screensaverConfig.images.length} 张</Typography>
                  <Box className="flex flex-wrap gap-2">
                    {screensaverConfig.images.map((img: UploadedImage) => (
                      <Box key={img.id} className="relative group">
                        <Box className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
                          sx={{ backgroundImage: `url(${img.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                        <IconButton size="small" onClick={() => handleRemoveImage(img.id)} disabled={!screensaverConfig.enabled}
                          sx={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, minWidth: 18, backgroundColor: '#ef4444', color: '#fff',
                            '&:hover': { backgroundColor: '#dc2626' }, '&.Mui-disabled': { backgroundColor: '#d1d5db' } }}>
                          <Close sx={{ fontSize: 12 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              <Box>
                <Typography variant="caption" color="text.secondary" className="mb-1 block font-medium">屏保启动时间</Typography>
                <FormControl fullWidth size="small" disabled={!screensaverConfig.enabled}>
                  <Select value={screensaverConfig.timeout} onChange={(e) => updateField('screensaver', 'timeout', e.target.value)}>
                    <MenuItem value="5">5 分钟无操作后启动</MenuItem>
                    <MenuItem value="10">10 分钟无操作后启动</MenuItem>
                    <MenuItem value="15">15 分钟无操作后启动</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>

          {/* ===== 卡片 2: 护眼管理 ===== */}
          <Card elevation={0} sx={{
            border: `1px solid ${eyeCare.enabled ? '#3b82f6' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: 3,
          }}>
            <Box className="flex items-center justify-between p-5 pb-0">
              <Box className="flex items-center gap-2">
                <Typography variant="h4" sx={{ lineHeight: 1 }}>👁️</Typography>
                <Typography variant="h6" className="font-bold">护眼管理</Typography>
              </Box>
              <Switch size="medium" checked={eyeCare.enabled} onChange={() => toggleFeature('eye-care')} color="primary" />
            </Box>
            <CardContent className="p-5 pt-3">
              <Typography variant="body2" color="text.secondary" className="mb-4">
                设置时间段和闲置超时后，自动控制设备进入指定模式，保护学生视力
              </Typography>

              <Box className="mb-3">
                <Typography variant="caption" color="text.secondary" className="mb-1 block font-medium">蓝光过滤强度</Typography>
                <FormControl fullWidth size="small" disabled={!eyeCare.enabled}>
                  <Select value={eyeCare.blueLightFilter} onChange={(e) => updateField('eye-care', 'blueLightFilter', e.target.value)}>
                    <MenuItem value="low">弱</MenuItem>
                    <MenuItem value="medium">中</MenuItem>
                    <MenuItem value="high">强</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box className="mb-3">
                <Typography variant="caption" color="text.secondary" className="mb-1 block font-medium">生效时间段</Typography>
                <Box className="flex items-center gap-2">
                  <TextField type="time" size="small" disabled={!eyeCare.enabled}
                    value={eyeCare.timeRangeStart}
                    onChange={(e) => updateField('eye-care', 'timeRangeStart', e.target.value)}
                    sx={{ flex: 1 }} />
                  <Typography variant="caption" color="text.secondary">至</Typography>
                  <TextField type="time" size="small" disabled={!eyeCare.enabled}
                    value={eyeCare.timeRangeEnd}
                    onChange={(e) => updateField('eye-care', 'timeRangeEnd', e.target.value)}
                    sx={{ flex: 1 }} />
                </Box>
              </Box>

              <Box className="mb-3">
                <Typography variant="caption" color="text.secondary" className="mb-1 block font-medium">闲置超时</Typography>
                <FormControl fullWidth size="small" disabled={!eyeCare.enabled}>
                  <Select value={eyeCare.idleTimeout} onChange={(e) => updateField('eye-care', 'idleTimeout', e.target.value)}>
                    <MenuItem value="5">超过 5 分钟未使用</MenuItem>
                    <MenuItem value="10">超过 10 分钟未使用</MenuItem>
                    <MenuItem value="15">超过 15 分钟未使用</MenuItem>
                    <MenuItem value="30">超过 30 分钟未使用</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box className="mb-3">
                <Typography variant="caption" color="text.secondary" className="mb-1 block font-medium">执行动作</Typography>
                <FormControl fullWidth size="small" disabled={!eyeCare.enabled}>
                  <Select value={eyeCare.action} onChange={(e) => updateField('eye-care', 'action', e.target.value)}>
                    <MenuItem value="screensaver">进入屏保模式</MenuItem>
                    <MenuItem value="lock">进入锁屏模式</MenuItem>
                    <MenuItem value="off">进入息屏模式</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" className="mb-1 block font-medium">指定设备</Typography>
                <Box className="flex items-center gap-2 flex-wrap">
                  <Button variant="outlined" size="small" disabled={!eyeCare.enabled}
                    onClick={() => setActiveDeviceDialog('eye-care')}>选择设备</Button>
                  {eyeCare.deviceIds.length > 0 ? (
                    <Box className="flex items-center gap-1 min-w-0">
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {eyeCare.deviceIds.slice(0, 2).map((id: string) => DEVICE_NAMES[parseInt(id)]).join('、')}
                        {eyeCare.deviceIds.length > 2 && ` 等 ${eyeCare.deviceIds.length} 台`}
                      </Typography>
                      <Chip label={`${eyeCare.deviceIds.length} 台`} size="small" color="primary" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.disabled">未选择（默认所有设备）</Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* ===== 卡片 3: 节能管理（自定义渲染） ===== */}
          <Card elevation={0} sx={{
            border: `1px solid ${energySaving.enabled ? '#3b82f6' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: 3,
          }}>
            <Box className="flex items-center justify-between p-5 pb-0">
              <Box className="flex items-center gap-2">
                <Typography variant="h4" sx={{ lineHeight: 1 }}>⚡</Typography>
                <Typography variant="h6" className="font-bold">节能管理</Typography>
              </Box>
              <Switch size="medium" checked={energySaving.enabled} onChange={() => toggleFeature('energy-saving')} color="primary" />
            </Box>
            <CardContent className="p-5 pt-3">
              <Typography variant="body2" color="text.secondary" className="mb-4">
                定时或在无人使用时自动息屏或关机，节约用电
              </Typography>

              {/* 定时执行 */}
              <Box className="mb-3">
                <Typography variant="caption" color="text.secondary" className="mb-1 block font-medium">定时执行</Typography>
                <Box className="flex items-center gap-2 flex-wrap">
                  <Chip
                    label="不设置时间"
                    size="small"
                    color={!energySaving.scheduledTimeEnabled ? 'primary' : 'default'}
                    variant={!energySaving.scheduledTimeEnabled ? 'filled' : 'outlined'}
                    onClick={() => { if (energySaving.enabled) updateField('energy-saving', 'scheduledTimeEnabled', false); }}
                  />
                  <Chip
                    label="指定时间"
                    size="small"
                    color={energySaving.scheduledTimeEnabled ? 'primary' : 'default'}
                    variant={energySaving.scheduledTimeEnabled ? 'filled' : 'outlined'}
                    onClick={() => { if (energySaving.enabled) updateField('energy-saving', 'scheduledTimeEnabled', true); }}
                  />
                  {energySaving.scheduledTimeEnabled && (
                    <TextField type="time" size="small" disabled={!energySaving.enabled}
                      value={energySaving.scheduledTime || '18:00'}
                      onChange={(e) => updateField('energy-saving', 'scheduledTime', e.target.value)}
                      sx={{ width: 120 }} />
                  )}
                </Box>
              </Box>

              {/* 无人使用超时 */}
              <Box className="mb-3">
                <Typography variant="caption" color="text.secondary" className="mb-1 block font-medium">无人使用超时</Typography>
                <FormControl fullWidth size="small" disabled={!energySaving.enabled}>
                  <Select value={energySaving.idleTimeout} onChange={(e) => updateField('energy-saving', 'idleTimeout', e.target.value)}>
                    <MenuItem value="15">连续 15 分钟无人使用</MenuItem>
                    <MenuItem value="30">连续 30 分钟无人使用</MenuItem>
                    <MenuItem value="60">连续 1 小时无人使用</MenuItem>
                    <MenuItem value="120">连续 2 小时无人使用</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* 执行方式 */}
              <Box className="mb-3">
                <Typography variant="caption" color="text.secondary" className="mb-1 block font-medium">执行方式</Typography>
                <FormControl fullWidth size="small" disabled={!energySaving.enabled}>
                  <Select value={energySaving.mode} onChange={(e) => updateField('energy-saving', 'mode', e.target.value)}>
                    <MenuItem value="force">强制执行</MenuItem>
                    <MenuItem value="prompt">提示后执行</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* 执行动作 */}
              <Box className="mb-3">
                <Typography variant="caption" color="text.secondary" className="mb-1 block font-medium">执行动作</Typography>
                <FormControl fullWidth size="small" disabled={!energySaving.enabled}>
                  <Select value={energySaving.action} onChange={(e) => updateField('energy-saving', 'action', e.target.value)}>
                    <MenuItem value="off">息屏</MenuItem>
                    <MenuItem value="shutdown">关机</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* 指定设备 */}
              <Box>
                <Typography variant="caption" color="text.secondary" className="mb-1 block font-medium">指定设备</Typography>
                <Box className="flex items-center gap-2 flex-wrap">
                  <Button variant="outlined" size="small" disabled={!energySaving.enabled}
                    onClick={() => setActiveDeviceDialog('energy-saving')}>选择设备</Button>
                  {energySaving.deviceIds.length > 0 ? (
                    <Box className="flex items-center gap-1 min-w-0">
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {energySaving.deviceIds.slice(0, 2).map((id: string) => DEVICE_NAMES[parseInt(id)]).join('、')}
                        {energySaving.deviceIds.length > 2 && ` 等 ${energySaving.deviceIds.length} 台`}
                      </Typography>
                      <Chip label={`${energySaving.deviceIds.length} 台`} size="small" color="primary" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.disabled">未选择（默认所有设备）</Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* 保存按钮 */}
        <Box className="flex items-center gap-3">
          <Button variant="contained" size="medium" startIcon={<Save />} onClick={handleSave}>
            保存设置
          </Button>
          {saved && (
            <Typography variant="body2" className="text-green-600 font-medium">
              ✅ 配置已保存，将下发至所有终端
            </Typography>
          )}
        </Box>

        {/* 设备选择弹窗 */}
        <DeviceSelectDialog
          open={Boolean(activeDeviceDialog)}
          onClose={() => setActiveDeviceDialog(null)}
          selected={activeDeviceDialog === 'eye-care' ? eyeCare.deviceIds : energySaving.deviceIds}
          onChange={(ids) => {
            if (activeDeviceDialog === 'eye-care') updateField('eye-care', 'deviceIds', ids);
            else if (activeDeviceDialog === 'energy-saving') updateField('energy-saving', 'deviceIds', ids);
          }}
        />
      </Box>
    </Box>
  );
}
