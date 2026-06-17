// 页面按钮定义
export interface PageButton {
  key: string;
  label: string;
}

// 页面路由配置
export interface PageConfig {
  key: string;
  label: string;
  buttons: PageButton[];
}

// 角色对某个页面的权限配置
export interface PagePermission {
  pageKey: string;
  canAccess: boolean;
  allowedButtons: string[];
}

// 角色定义
export interface Role {
  id: string;
  name: string;
  isSystem?: boolean; // true = 超级管理员，不可删除不可编辑权限
  permissions: PagePermission[];
  memberIds: string[]; // 教师 ID 列表
}

// 全系统页面配置（单一定义，保持和导航结构一致）
export const ALL_PAGES: PageConfig[] = [
  {
    key: 'template',
    label: '模板管理',
    buttons: [
      { key: 'upload', label: '上传模板' },
      { key: 'download', label: '下载' },
      { key: 'rename', label: '重命名' },
      { key: 'delete', label: '删除' },
    ],
  },
  {
    key: 'teacher',
    label: '教师管理',
    buttons: [
      { key: 'add', label: '新增老师' },
      { key: 'edit', label: '编辑' },
      { key: 'delete', label: '删除' },
      { key: 'approve', label: '审核通过' },
      { key: 'reject', label: '审核拒绝' },
    ],
  },
  {
    key: 'school',
    label: '学校管理',
    buttons: [
      { key: 'add', label: '添加学校' },
      { key: 'view', label: '查看' },
      { key: 'deactivate', label: '停用' },
    ],
  },
  {
    key: 'questionbank',
    label: '校本资源',
    buttons: [
      { key: 'upload', label: '上传资源' },
      { key: 'manage-courseware', label: '课件管理' },
      { key: 'manage-lesson-plan', label: '教案管理' },
      { key: 'manage-media', label: '多媒体管理' },
      { key: 'manage-question-bank', label: '题库管理' },
    ],
  },
  {
    key: 'lecture',
    label: '听评课',
    buttons: [
      { key: 'create', label: '创建听评课' },
      { key: 'view', label: '查看/听课' },
      { key: 'upload-video', label: '上传视频' },
      { key: 'score', label: '评分' },
      { key: 'view-score', label: '查看评分' },
    ],
  },
  {
    key: 'cloudclassroom',
    label: '云课堂',
    buttons: [
      { key: 'upload', label: '上传视频' },
      { key: 'edit', label: '编辑' },
      { key: 'delete', label: '删除' },
    ],
  },
  {
    key: 'cloudclassroom-review',
    label: '云课堂审核',
    buttons: [
      { key: 'approve', label: '审核通过' },
      { key: 'reject', label: '审核拒绝' },
    ],
  },
  {
    key: 'training-video',
    label: '培训视频',
    buttons: [],
  },
  {
    key: 'training-video-mgmt',
    label: '培训视频管理',
    buttons: [
      { key: 'upload', label: '上传视频' },
      { key: 'edit', label: '编辑' },
      { key: 'delete', label: '删除' },
      { key: 'toggle-status', label: '上架/下架' },
    ],
  },
  {
    key: 'classroom',
    label: '教室管理',
    buttons: [
      { key: 'add', label: '添加教室' },
      { key: 'view', label: '查看' },
      { key: 'edit', label: '编辑' },
      { key: 'control', label: '集控' },
      { key: 'add-building', label: '添加教学楼' },
      { key: 'add-floor', label: '添加楼层' },
    ],
  },
  {
    key: 'livestream',
    label: '实时流',
    buttons: [],
  },
  {
    key: 'central-overview',
    label: '集控总览',
    buttons: [],
  },
  {
    key: 'device-mgmt',
    label: '设备管理',
    buttons: [
      { key: 'add', label: '添加设备' },
      { key: 'edit', label: '编辑' },
      { key: 'delete', label: '删除' },
      { key: 'view', label: '查看' },
    ],
  },
  {
    key: 'info-publish',
    label: '信息发布',
    buttons: [
      { key: 'publish', label: '发布信息' },
      { key: 'edit', label: '编辑' },
      { key: 'delete', label: '删除' },
      { key: 'take-down', label: '下架' },
    ],
  },
  {
    key: 'security-policy',
    label: '安全策略',
    buttons: [
      { key: 'cleanup', label: '磁盘清理' },
      { key: 'migrate', label: '文件迁移' },
      { key: 'format', label: '磁盘格式化' },
      { key: 'transcribe', label: '音频转文字' },
    ],
  },
  {
    key: 'operation-log',
    label: '运行日志',
    buttons: [
      { key: 'export', label: '导出日志' },
      { key: 'clear', label: '清除日志' },
    ],
  },
  {
    key: 'news-broadcast',
    label: '时事转播',
    buttons: [
      { key: 'create', label: '新建计划' },
      { key: 'edit', label: '编辑' },
      { key: 'delete', label: '删除' },
      { key: 'toggle-status', label: '启停' },
      { key: 'config-watermark', label: '水印设置' },
    ],
  },
];

// 帮助函数：判断角色是否有某个按钮权限
export function hasButtonPermission(
  role: Role | undefined,
  pageKey: string,
  buttonKey: string
): boolean {
  if (!role) return false;
  if (role.isSystem) return true; // 超级管理员拥有一切
  const pagePerm = role.permissions.find((p) => p.pageKey === pageKey);
  if (!pagePerm || !pagePerm.canAccess) return false;
  return pagePerm.allowedButtons.includes(buttonKey);
}

// 帮助函数：判断角色是否有页面访问权限
export function hasPageAccess(
  role: Role | undefined,
  pageKey: string
): boolean {
  if (!role) return false;
  if (role.isSystem) return true;
  const pagePerm = role.permissions.find((p) => p.pageKey === pageKey);
  return pagePerm?.canAccess ?? false;
}

// 创建一个拥有所有权限的 PagePermission 列表
export function createFullPermissions(): PagePermission[] {
  return ALL_PAGES.map((page) => ({
    pageKey: page.key,
    canAccess: true,
    allowedButtons: page.buttons.map((b) => b.key),
  }));
}

// 创建一个空权限的 PagePermission 列表
export function createEmptyPermissions(): PagePermission[] {
  return ALL_PAGES.map((page) => ({
    pageKey: page.key,
    canAccess: false,
    allowedButtons: [],
  }));
}
