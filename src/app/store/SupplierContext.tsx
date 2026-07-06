import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

export interface ContractFile {
  name: string;      // 文件名，如 "合同2026.pdf"
  data: string;      // Base64 编码的文件内容
  type: string;      // MIME 类型，如 "application/pdf"
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  contactPerson: string;
  unifiedCode: string;
  contractFile: ContractFile | null;
}

// 从现有 Mock 学校经销商提取的初始数据
const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: 's-1',
    name: '四川云教科技有限公司',
    phone: '028-85551234',
    address: '成都市高新区天府大道1388号',
    contactPerson: '张经理',
    unifiedCode: '91510100MA6CM*****',
    contractFile: null,
  },
  {
    id: 's-2',
    name: '成都华育信息技术有限公司',
    phone: '028-85555678',
    address: '成都市武侯区科华北路99号',
    contactPerson: '李经理',
    unifiedCode: '91510100MA6CM*****',
    contractFile: null,
  },
  {
    id: 's-3',
    name: '德阳博睿教育设备有限公司',
    phone: '0838-2500888',
    address: '德阳市旌阳区岷江西路一段88号',
    contactPerson: '王经理',
    unifiedCode: '91510600MA6CM*****',
    contractFile: null,
  },
];

interface SupplierContextType {
  suppliers: Supplier[];
  addSupplier: (data: Omit<Supplier, 'id'>) => Supplier;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  getSupplier: (id: string) => Supplier | undefined;
  getSupplierByName: (name: string) => Supplier | undefined;
}

const SupplierContext = createContext<SupplierContextType | null>(null);

export function SupplierProvider({ children }: { children: ReactNode }) {
  /** 迁移旧数据：将 contractInfo 字符串转为 contractFile */
  function migrateSupplier(data: Record<string, unknown>): Supplier {
    if ('contractFile' in data) {
      return data as unknown as Supplier;
    }
    const old = data as unknown as Supplier & { contractInfo?: string };
    const contractInfo = old.contractInfo;
    return {
      ...old,
      contractFile: contractInfo
        ? { name: `${contractInfo}.pdf`, data: '', type: 'application/pdf' }
        : null,
    };
  }

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem('app-suppliers');
      if (saved) {
        const raw = JSON.parse(saved) as Record<string, unknown>[];
        return raw.map(migrateSupplier);
      }
    } catch { /* ignore */ }
    return DEFAULT_SUPPLIERS;
  });

  const addSupplier = useCallback((data: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = { id: 's-' + Date.now().toString(), ...data };
    setSuppliers((prev) => {
      const next = [...prev, newSupplier];
      localStorage.setItem('app-suppliers', JSON.stringify(next));
      return next;
    });
    return newSupplier;
  }, []);

  const updateSupplier = useCallback((id: string, data: Partial<Supplier>) => {
    setSuppliers((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...data } : s));
      localStorage.setItem('app-suppliers', JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteSupplier = useCallback((id: string) => {
    setSuppliers((prev) => {
      const next = prev.filter((s) => s.id !== id);
      localStorage.setItem('app-suppliers', JSON.stringify(next));
      return next;
    });
  }, []);

  const getSupplier = useCallback(
    (id: string) => suppliers.find((s) => s.id === id),
    [suppliers]
  );

  const getSupplierByName = useCallback(
    (name: string) => suppliers.find((s) => s.name === name),
    [suppliers]
  );

  return (
    <SupplierContext.Provider
      value={{ suppliers, addSupplier, updateSupplier, deleteSupplier, getSupplier, getSupplierByName }}
    >
      {children}
    </SupplierContext.Provider>
  );
}

export function useSupplier() {
  const ctx = useContext(SupplierContext);
  if (!ctx) throw new Error('useSupplier must be used inside SupplierProvider');
  return ctx;
}
