import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Role, PagePermission } from '../types/permissions';
import { createFullPermissions } from '../types/permissions';

interface PermissionContextType {
  roles: Role[];
  addRole: (name: string) => void;
  updateRole: (id: string, updates: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  updateRolePermissions: (id: string, permissions: PagePermission[]) => void;
  addMembersToRole: (roleId: string, memberIds: string[]) => void;
  removeMemberFromRole: (roleId: string, memberId: string) => void;
  getRoleById: (id: string) => Role | undefined;
}

const defaultRoles: Role[] = [
  {
    id: 'super-admin',
    name: '超级管理员',
    isSystem: true,
    permissions: createFullPermissions(),
    memberIds: [],
  },
];

const PermissionContext = createContext<PermissionContextType | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [roles, setRoles] = useState<Role[]>(() => {
    try {
      const saved = localStorage.getItem('app-roles');
      if (saved) {
        const parsed = JSON.parse(saved) as Role[];
        // 确保超级管理员始终存在且拥有所有权限
        const hasSuperAdmin = parsed.some((r) => r.id === 'super-admin');
        if (!hasSuperAdmin) {
          parsed.unshift(defaultRoles[0]);
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return defaultRoles;
  });

  const persist = (next: Role[]) => {
    setRoles(next);
    localStorage.setItem('app-roles', JSON.stringify(next));
  };

  const addRole = useCallback((name: string) => {
    setRoles((prev) => {
      const newRole: Role = {
        id: 'role-' + Date.now().toString(),
        name,
        permissions: prev[0].permissions.map((p) => ({
          pageKey: p.pageKey,
          canAccess: false,
          allowedButtons: [] as string[],
        })),
        memberIds: [],
      };
      const next = [...prev, newRole];
      localStorage.setItem('app-roles', JSON.stringify(next));
      return next;
    });
  }, []);

  const updateRole = useCallback((id: string, updates: Partial<Role>) => {
    setRoles((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...updates } : r));
      localStorage.setItem('app-roles', JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteRole = useCallback((id: string) => {
    setRoles((prev) => {
      const next = prev.filter((r) => r.id !== id);
      localStorage.setItem('app-roles', JSON.stringify(next));
      return next;
    });
  }, []);

  const updateRolePermissions = useCallback(
    (id: string, permissions: PagePermission[]) => {
      setRoles((prev) => {
        const next = prev.map((r) =>
          r.id === id ? { ...r, permissions } : r
        );
        localStorage.setItem('app-roles', JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const addMembersToRole = useCallback(
    (roleId: string, memberIds: string[]) => {
      setRoles((prev) => {
        const next = prev.map((r) => {
          if (r.id !== roleId) return r;
          const existing = new Set(r.memberIds);
          memberIds.forEach((id) => existing.add(id));
          return { ...r, memberIds: Array.from(existing) };
        });
        localStorage.setItem('app-roles', JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const removeMemberFromRole = useCallback(
    (roleId: string, memberId: string) => {
      setRoles((prev) => {
        const next = prev.map((r) =>
          r.id === roleId
            ? { ...r, memberIds: r.memberIds.filter((id) => id !== memberId) }
            : r
        );
        localStorage.setItem('app-roles', JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const getRoleById = useCallback(
    (id: string) => roles.find((r) => r.id === id),
    [roles]
  );

  return (
    <PermissionContext.Provider
      value={{
        roles,
        addRole,
        updateRole,
        deleteRole,
        updateRolePermissions,
        addMembersToRole,
        removeMemberFromRole,
        getRoleById,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error('usePermission must be used inside PermissionProvider');
  return ctx;
}
