import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  contactPerson: string;
  unifiedCode: string;
  contractInfo: string;
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
    contractInfo: '2026年度框架协议',
  },
  {
    id: 's-2',
    name: '成都华育信息技术有限公司',
    phone: '028-85555678',
    address: '成都市武侯区科华北路99号',
    contactPerson: '李经理',
    unifiedCode: '91510100MA6CM*****',
    contractInfo: '2026年度框架协议',
  },
  {
    id: 's-3',
    name: '德阳博睿教育设备有限公司',
    phone: '0838-2500888',
    address: '德阳市旌阳区岷江西路一段88号',
    contactPerson: '王经理',
    unifiedCode: '91510600MA6CM*****',
    contractInfo: '2026年度框架协议',
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
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem('app-suppliers');
      if (saved) return JSON.parse(saved) as Supplier[];
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
