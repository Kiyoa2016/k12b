import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { SchoolAuth } from '../types/permissions';

// ─── 默认模拟数据 ───

const DEFAULT_SCHOOL_AUTHS: SchoolAuth[] = [
  {
    schoolId: '1',
    schoolName: '成都市仁寿中学（双流校区）',
    authorizedPageKeys: [
      'template', 'teacher', 'questionbank', 'lecture',
      'role-mgmt', 'voice-mgmt', 'cloudclassroom', 'cloudclassroom-review',
      'classroom', 'device-mgmt', 'livestream', 'info-publish',
      'security-policy', 'operation-log', 'news-broadcast', 'central-overview',
      'training-video', 'training-video-mgmt',
    ],
  },
  {
    schoolId: '2',
    schoolName: '成都市锦鑫中学',
    authorizedPageKeys: [
      'template', 'teacher', 'questionbank', 'lecture',
      'role-mgmt', 'voice-mgmt', 'classroom', 'device-mgmt',
    ],
  },
  {
    schoolId: '3',
    schoolName: '成都师资七中学（林荫校区）',
    authorizedPageKeys: [
      'template', 'teacher', 'questionbank', 'lecture',
      'role-mgmt', 'voice-mgmt', 'cloudclassroom', 'classroom',
      'device-mgmt', 'security-policy', 'operation-log', 'news-broadcast',
    ],
  },
];

// ─── Context 类型 ───

interface SchoolAuthorizationContextType {
  schoolAuths: SchoolAuth[];
  currentSchoolId: string;
  setCurrentSchoolId: (id: string) => void;
  updateSchoolAuth: (schoolId: string, authorizedPageKeys: string[]) => void;
  getSchoolAuth: (schoolId: string) => SchoolAuth | undefined;
}

const SchoolAuthorizationContext = createContext<SchoolAuthorizationContextType | null>(null);

// ─── Provider ───

export function SchoolAuthorizationProvider({ children }: { children: ReactNode }) {
  const [schoolAuths, setSchoolAuths] = useState<SchoolAuth[]>(() => {
    try {
      const saved = localStorage.getItem('app-school-auths');
      if (saved) return JSON.parse(saved) as SchoolAuth[];
    } catch { /* ignore */ }
    return DEFAULT_SCHOOL_AUTHS;
  });

  const [currentSchoolId, setCurrentSchoolId] = useState('1');

  const persist = (next: SchoolAuth[]) => {
    setSchoolAuths(next);
    localStorage.setItem('app-school-auths', JSON.stringify(next));
  };

  const updateSchoolAuth = useCallback((schoolId: string, authorizedPageKeys: string[]) => {
    setSchoolAuths((prev) => {
      const next = prev.map((a) =>
        a.schoolId === schoolId ? { ...a, authorizedPageKeys } : a
      );
      localStorage.setItem('app-school-auths', JSON.stringify(next));
      return next;
    });
  }, []);

  const getSchoolAuth = useCallback(
    (schoolId: string) => schoolAuths.find((a) => a.schoolId === schoolId),
    [schoolAuths]
  );

  return (
    <SchoolAuthorizationContext.Provider
      value={{
        schoolAuths,
        currentSchoolId,
        setCurrentSchoolId,
        updateSchoolAuth,
        getSchoolAuth,
      }}
    >
      {children}
    </SchoolAuthorizationContext.Provider>
  );
}

export function useSchoolAuthorization() {
  const ctx = useContext(SchoolAuthorizationContext);
  if (!ctx) throw new Error('useSchoolAuthorization must be used inside SchoolAuthorizationProvider');
  return ctx;
}
