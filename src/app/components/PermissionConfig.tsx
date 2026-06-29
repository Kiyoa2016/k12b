import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  Chip,
} from '@mui/material';
import { Close, Security, School } from '@mui/icons-material';
import { usePermission } from '../store/PermissionContext';
import { useSchoolAuthorization } from '../store/SchoolAuthorizationContext';
import { ALL_PAGES, type Role, type PagePermission } from '../types/permissions';

interface Props {
  role: Role;
  open: boolean;
  onClose: () => void;
}

export default function PermissionConfig({ role, open, onClose }: Props) {
  const { roles, updateRolePermissions } = usePermission();
  const [permissions, setPermissions] = useState<PagePermission[]>(() =>
    JSON.parse(JSON.stringify(role.permissions))
  );
  const [referenceRoleId, setReferenceRoleId] = useState<string>('');

  const otherRoles = useMemo(
    () => roles.filter((r) => r.id !== role.id && !r.isSystem),
    [roles, role.id]
  );

  const isSuperAdmin = role.isSystem;

  // ── 学校授权过滤 ──
  const { getSchoolAuth, currentSchoolId } = useSchoolAuthorization();
  const schoolAuth = getSchoolAuth(currentSchoolId);
  const availablePages = isSuperAdmin
    ? ALL_PAGES
    : ALL_PAGES.filter((p) => schoolAuth?.authorizedPageKeys.includes(p.key));

  const handleTogglePageAccess = (pageKey: string) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.pageKey === pageKey
          ? {
              ...p,
              canAccess: !p.canAccess,
              allowedButtons: !p.canAccess
                ? ALL_PAGES.find((pg) => pg.key === pageKey)?.buttons.map(
                    (b) => b.key
                  ) ?? []
                : [],
            }
          : p
      )
    );
  };

  const handleToggleButton = (pageKey: string, buttonKey: string) => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.pageKey !== pageKey) return p;
        const has = p.allowedButtons.includes(buttonKey);
        return {
          ...p,
          allowedButtons: has
            ? p.allowedButtons.filter((k) => k !== buttonKey)
            : [...p.allowedButtons, buttonKey],
        };
      })
    );
  };

  const handleReference = (targetRoleId: string) => {
    const target = roles.find((r) => r.id === targetRoleId);
    if (!target) return;
    setPermissions(JSON.parse(JSON.stringify(target.permissions)));
    setReferenceRoleId('');
  };

  const handleSave = () => {
    updateRolePermissions(role.id, permissions);
    onClose();
  };

  const handleCancel = () => {
    setPermissions(JSON.parse(JSON.stringify(role.permissions)));
    setReferenceRoleId('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: 'rounded-xl',
        sx: { height: '90vh', maxHeight: 700 },
      }}
    >
      <DialogTitle className="border-b">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <Security className="text-blue-600" />
            <Typography variant="h6">
              功能权限配置 — {role.name}
            </Typography>
            {isSuperAdmin && (
              <Chip
                label="拥有所有权限"
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
          <IconButton onClick={handleCancel} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent className="py-4" sx={{ overflow: 'auto' }}>
        {/* 快速参照 */}
        {!isSuperAdmin && otherRoles.length > 0 && (
          <Box className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
            <Typography
              variant="body2"
              className="font-medium whitespace-nowrap"
            >
              快速参照：
            </Typography>
            <FormControl size="small" className="min-w-[200px]">
              <Select
                value={referenceRoleId}
                onChange={(e) => handleReference(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">
                  <Typography variant="body2" color="text.secondary">
                    选择参照角色
                  </Typography>
                </MenuItem>
                {otherRoles.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              选择后将当前权限重置为参照角色的配置
            </Typography>
          </Box>
        )}

        {isSuperAdmin ? (
          <Box className="text-center py-16 text-gray-400">
            <Security className="text-6xl mb-3 text-gray-300" />
            <Typography variant="h6">
              超级管理员拥有全部权限
            </Typography>
            <Typography variant="body2">无需配置</Typography>
          </Box>
        ) : (
          <Box className="space-y-6">
            {/* 学校授权提示 */}
            {!isSuperAdmin && schoolAuth && (
              <Box className="p-3 bg-blue-50 rounded-lg flex items-center gap-2 mb-4">
                <School fontSize="small" className="text-blue-600" />
                <Typography variant="body2" color="text.secondary">
                  当前学校已授权 {schoolAuth.authorizedPageKeys.length}/{ALL_PAGES.length} 个功能模块，
                  以下仅显示已授权的模块
                </Typography>
              </Box>
            )}
            {availablePages.map((page) => {
              const perm = permissions.find(
                (p) => p.pageKey === page.key
              );
              if (!perm) return null;
              return (
                <Box
                  key={page.key}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* 页面标题行 */}
                  <Box className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={perm.canAccess}
                          onChange={() =>
                            handleTogglePageAccess(page.key)
                          }
                        />
                      }
                      label={
                        <Typography variant="subtitle2" className="font-semibold">
                          {page.label}
                        </Typography>
                      }
                    />
                  </Box>
                  {/* 按钮权限列表 */}
                  {perm.canAccess && page.buttons.length > 0 && (
                    <Box className="px-4 py-3 flex flex-wrap items-center gap-3">
                      {page.buttons.map((btn) => (
                        <FormControlLabel
                          key={btn.key}
                          control={
                            <Checkbox
                              size="small"
                              checked={perm.allowedButtons.includes(
                                btn.key
                              )}
                              onChange={() =>
                                handleToggleButton(page.key, btn.key)
                              }
                            />
                          }
                          label={
                            <Typography variant="body2">
                              {btn.label}
                            </Typography>
                          }
                        />
                      ))}
                    </Box>
                  )}
                  {perm.canAccess && page.buttons.length === 0 && (
                    <Box className="px-4 py-2">
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        此页面无可配置的按钮权限
                      </Typography>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>
      {!isSuperAdmin && (
        <DialogActions className="border-t px-6 py-3">
          <Button onClick={handleCancel} variant="outlined">
            取消
          </Button>
          <Button onClick={handleSave} variant="contained">
            保存
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
