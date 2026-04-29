
import React, { useState, useMemo } from 'react';
import { 
  PlusCircle, 
  MinusCircle, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  ArrowRight, 
  ArrowLeft,
  Truck,
  Box,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  XCircle,
  FileText,
  Database,
  Trash2,
  Edit2,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from '../lib/utils';
import { InventoryEntry } from '../inventoryLedgerData';
import { useFirestore } from '../FirestoreContext';
import { useShelters } from '../context/ShelterContext';
import { ModalWrapper } from './ModalWrapper';

const Card = ({ children, className, ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) => (
  <div {...props} className={cn("bg-white rounded-2xl p-5 shadow-sm border border-slate-100", className)}>
    {children}
  </div>
);

export default function InventoryLogisticsView() {
  const { inventory: ledgerRaw, addDocument, updateDocument, deleteDocument, deleteDocuments } = useFirestore();
  const { shelters } = useShelters();
  const [selectedShelterId, setSelectedShelterId] = useState<string>('전체');
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<InventoryEntry | null>(null);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [focusedShelterId, setFocusedShelterId] = useState<string | null>(null);
  const [summaryFilter, setSummaryFilter] = useState('');

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Balance recalculation logic for display
  const ledger = useMemo(() => {
    // Sort by date (oldest first) to calculate sequential balance
    const sorted = [...ledgerRaw].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Group by shelter + item
    const groups: Record<string, number> = {};
    
    return sorted.map(entry => {
      const key = `${entry.shelterId}-${entry.itemName}`;
      if (groups[key] === undefined) groups[key] = 0;
      
      if (entry.type === '입고') {
        groups[key] += entry.quantity;
      } else {
        groups[key] -= entry.quantity;
      }
      
      return { ...entry, balance: groups[key] };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Return to newest first for display
  }, [ledgerRaw]);

  const filteredLedger = useMemo(() => {
    let result = [...ledger];
    if (selectedShelterId !== '전체') {
      result = result.filter(entry => entry.shelterId === selectedShelterId);
    }
    return result;
  }, [ledger, selectedShelterId]);

  const balancesByItem = useMemo(() => {
    const balances: Record<string, { quantity: number; spec: string }> = {};
    const targetShelterId = focusedShelterId || selectedShelterId;
    const targets = targetShelterId === '전체' ? ledger : ledger.filter(e => e.shelterId === targetShelterId);

    targets.forEach(entry => {
      if (!balances[entry.itemName]) {
        balances[entry.itemName] = { quantity: 0, spec: entry.specification };
      }
      if (entry.type === '입고') {
        balances[entry.itemName].quantity += entry.quantity;
      } else {
        balances[entry.itemName].quantity -= entry.quantity;
      }
    });

    return Object.entries(balances).map(([name, data]) => ({
      name,
      ...data
    })).filter(b => b.quantity !== 0);
  }, [ledger, selectedShelterId, focusedShelterId]);

  // Annual Logistics Chart Data
  const chartData = useMemo(() => {
    const targetShelterId = focusedShelterId || selectedShelterId;
    const targets = targetShelterId === '전체' ? ledger : ledger.filter(e => e.shelterId === targetShelterId);
    
    // Initialize last 12 months
    const data: Record<string, { month: string; Inbound: number; Outbound: number }> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear().toString().slice(-2)}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      data[monthKey] = { month: monthKey, Inbound: 0, Outbound: 0 };
    }

    targets.forEach(entry => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear().toString().slice(-2)}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (data[monthKey]) {
        if (entry.type === '입고') {
          data[monthKey].Inbound += entry.quantity;
        } else {
          data[monthKey].Outbound += entry.quantity;
        }
      }
    });

    return Object.values(data);
  }, [ledger, selectedShelterId, focusedShelterId]);

  const focusedShelterName = useMemo(() => {
    const id = focusedShelterId || selectedShelterId;
    if (id === '전체') return '전체 보호소';
    return shelters.find(s => s.id === id)?.name || shelters.find(s => `SHT-${s.id}` === id)?.name || '기타 보호소';
  }, [focusedShelterId, selectedShelterId, shelters]);

  const shelterSummary = useMemo(() => {
    const summary: Record<string, Record<string, { quantity: number; spec: string }>> = {};
    
    ledger.forEach(entry => {
      if (!summary[entry.shelterName]) {
        summary[entry.shelterName] = {};
      }
      if (!summary[entry.shelterName][entry.itemName]) {
        summary[entry.shelterName][entry.itemName] = { quantity: 0, spec: entry.specification };
      }
      
      if (entry.type === '입고') {
        summary[entry.shelterName][entry.itemName].quantity += entry.quantity;
      } else {
        summary[entry.shelterName][entry.itemName].quantity -= entry.quantity;
      }
    });

    const result: { shelterName: string; itemName: string; quantity: number; spec: string }[] = [];
    Object.entries(summary).forEach(([shelter, items]) => {
      Object.entries(items).forEach(([item, data]) => {
        if (data.quantity !== 0) {
          result.push({
            shelterName: shelter,
            itemName: item,
            ...data
          });
        }
      });
    });

    return result.filter(item => 
      item.shelterName.toLowerCase().includes(summaryFilter.toLowerCase()) ||
      item.itemName.toLowerCase().includes(summaryFilter.toLowerCase())
    );
  }, [ledger, summaryFilter]);

  const [formData, setFormData] = useState({
    shelterId: '',
    itemName: '',
    specification: '',
    quantity: 100,
    manager: '관리자',
    remarks: '',
    shippingFee: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const handleOpenEdit = (entry: InventoryEntry) => {
    setEditingEntry(entry);
    setFormData({
      shelterId: entry.shelterId,
      itemName: entry.itemName,
      specification: entry.specification,
      quantity: entry.quantity,
      manager: entry.manager,
      remarks: entry.remarks,
      shippingFee: entry.shippingFee || 0,
      date: entry.date
    });
    if (entry.type === '입고') setIsStockInModalOpen(true);
    else setIsStockOutModalOpen(true);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteId) {
        await deleteDocument('inventory', deleteId);
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(deleteId);
          return next;
        });
        showToast('삭제되었습니다.');
      } else {
        await deleteDocuments('inventory', Array.from(selectedIds));
        setSelectedIds(new Set());
        showToast('선택한 내역이 삭제되었습니다.');
      }
    } catch (error) {
      console.error(error);
      showToast('삭제 중 오류가 발생했습니다.', 'error');
    }
    setIsDeleteConfirmOpen(false);
    setDeleteId(null);
  };

  const handleBulkDelete = () => {
    setDeleteId(null);
    setIsDeleteConfirmOpen(true);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLedger.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLedger.map(e => e.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (type: '입고' | '출고') => {
    const shelter = shelters.find(s => s.id === formData.shelterId) || shelters.find(s => `SHT-${s.id}` === formData.shelterId);
    const shelterName = shelter?.name || '기타 보호소';

    if (type === '출고' && !editingEntry) {
      const currentBalance = ledger
        .filter(e => e.shelterId === formData.shelterId && e.itemName === formData.itemName)
        .reduce((acc, curr) => curr.type === '입고' ? acc + curr.quantity : acc - curr.quantity, 0);

      if (currentBalance < formData.quantity) {
        alert(`재고가 부족합니다. (현재 잔고: ${currentBalance.toLocaleString()}kg)`);
        return;
      }
    }

    try {
      if (editingEntry) {
        await updateDocument('inventory', editingEntry.id, {
          ...formData,
          shelterName,
          type
        });
        showToast('내역이 수정되었습니다.');
      } else {
        const id = `ENT-${Date.now()}`;
        await addDocument('inventory', {
          id,
          ...formData,
          shelterName,
          type,
          balance: 0 // Recalculated on display
        });
        showToast('내역이 등록되었습니다.');
      }

      setIsStockInModalOpen(false);
      setIsStockOutModalOpen(false);
      setEditingEntry(null);
      resetForm();
    } catch (error) {
       console.error(error);
       showToast('저장 중 오류가 발생했습니다.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      shelterId: '',
      itemName: '',
      specification: '',
      quantity: 100,
      manager: '관리자',
      remarks: '',
      shippingFee: 0,
      date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="flex flex-col gap-6 h-full p-1 overflow-hidden">
      {/* Top Header & Filter */}
      <div className="flex justify-between items-end">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">수불 및 물류 관리</h2>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-md border border-indigo-100">Inventory & Logistics</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">보호소 선택:</span>
              <select 
                value={selectedShelterId}
                onChange={(e) => setSelectedShelterId(e.target.value)}
                className="text-xs font-bold text-slate-700 outline-none bg-transparent"
              >
                <option value="전체">전체 보호소</option>
                <option value="SHT-001">왕왕랜드</option>
                <option value="SHT-002">삼송보호소</option>
                <option value="SHT-003">드림테일즈</option>
              </select>
            </div>
            
            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setIsSummaryModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black shadow-sm hover:bg-slate-50 transition-all active:scale-[0.98]"
          >
            <Database size={18} className="text-amber-500" /> 보호소별 잔고 현황
          </button>
          <button 
            onClick={() => { setEditingEntry(null); resetForm(); setIsStockInModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-3.5 bg-[#2D336B] hover:bg-[#1E234A] text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
          >
            <PlusCircle size={18} /> 입고 내역 등록
          </button>
          <button 
            onClick={() => { setEditingEntry(null); resetForm(); setIsStockOutModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
          >
            <Truck size={18} /> 물송/출고 지시
          </button>
        </div>
      </div>

      {/* Summary Widgets */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 shrink-0">
        {/* Real-time Balance Widget */}
        <Card className="lg:col-span-4 flex flex-col h-[12.5rem]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                <Database size={14} />
              </div>
              <h3 className="text-xs font-black text-slate-800 tracking-tight">
                <span className="text-indigo-600 mr-1">[{focusedShelterName}]</span> 
                실시간 잔고
              </h3>
            </div>
            {focusedShelterId && (
              <button 
                onClick={() => setFocusedShelterId(null)}
                className="text-[9px] font-bold text-slate-400 hover:text-indigo-500 flex items-center gap-1"
              >
                <ArrowLeft size={10} /> 초기화
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar pr-1">
            {balancesByItem.length > 0 ? (
              <div className="space-y-1.5">
                {balancesByItem.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-indigo-100 transition-all group">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-700 tracking-tight">{item.name}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase">{item.spec}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-black text-slate-800 tabular-nums">
                        {item.quantity.toLocaleString()} <span className="text-[9px] text-slate-400 ml-0.5">kg</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-40">
                <Box size={24} className="text-slate-300 mb-1" />
                <p className="text-[9px] font-bold text-slate-400 italic">표시할 잔고가 없습니다</p>
              </div>
            )}
          </div>
          
          <div className="mt-2 pt-2 border-t border-slate-50 flex items-center gap-1.5 shrink-0">
            <div className={cn("w-1 h-1 rounded-full animate-pulse", focusedShelterId ? "bg-indigo-500" : "bg-emerald-500")} />
            <span className="text-[9px] font-bold text-slate-400 italic">
              {focusedShelterId ? "개별 연동 데이터" : "전체 선택된 통합 데이터"}
            </span>
          </div>
        </Card>

        {/* Annual Logistics Chart Widget */}
        <Card className="lg:col-span-8 h-[12.5rem] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                <TrendingUp size={14} />
              </div>
              <h3 className="text-xs font-black text-slate-800 tracking-tight">연간 입출고 추이 (최근 12개월)</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#007bff]" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Inbound</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#dc3545]" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Outbound</span>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: -5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickCount={4}
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-xl overflow-hidden">
                          <p className="text-[9px] font-black text-slate-400 mb-1 px-1">{payload[0].payload.month}</p>
                          <div className="space-y-1 border-t border-slate-50 pt-1">
                            {payload.map((p: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: p.color }} />
                                  <span className="text-[10px] font-black text-slate-600">{p.name === 'Inbound' ? '입고' : '출고'}</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-800 tracking-tight">{p.value.toLocaleString()}kg</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar name="Inbound" dataKey="Inbound" fill="#007bff" radius={[2, 2, 0, 0]} barSize={8} />
                <Bar name="Outbound" dataKey="Outbound" fill="#dc3545" radius={[2, 2, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* Table/Ledger */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden relative">
        <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <FileText size={16} className="text-indigo-500" /> 보호소별 통합 수불부
              </h3>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded-md border border-slate-200 uppercase">Ledger</span>
            </div>

            {selectedIds.size > 0 && (
              <motion.button 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all flex items-center gap-2"
              >
                <Trash2 size={12} /> {selectedIds.size}개 일괄 삭제
              </motion.button>
            )}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="품목 정보 검색..." 
              className="pl-9 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold w-64 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-20 border-b-2 border-slate-200 shadow-sm">
              <tr className="whitespace-nowrap">
                <th className="px-6 py-5 w-12 bg-slate-50 sticky top-0 z-30">
                   <button 
                     onClick={toggleSelectAll}
                     className={cn(
                       "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                       selectedIds.size === filteredLedger.length && filteredLedger.length > 0
                         ? "bg-indigo-600 border-indigo-600 text-white"
                         : "bg-white border-slate-200"
                     )}
                   >
                     {selectedIds.size === filteredLedger.length && filteredLedger.length > 0 && <CheckCircle2 size={12} />}
                   </button>
                </th>
                <th className="px-6 py-5 bg-slate-50 sticky top-0 z-20">일자</th>
                <th className="px-6 py-5 bg-slate-50 sticky top-0 z-20">구분</th>
                <th className="px-6 py-5 bg-slate-50 sticky top-0 z-20">보호소명</th>
                <th className="px-6 py-5 bg-slate-50 sticky top-0 z-20">품목</th>
                <th className="px-6 py-5 text-right bg-slate-50 sticky top-0 z-20">배송비(VAT포함)</th>
                <th className="px-6 py-5 text-right bg-slate-50 sticky top-0 z-20">수량(kg)</th>
                <th className="px-6 py-5 text-right bg-slate-50 sticky top-0 z-20">잔고(kg)</th>
                <th className="px-6 py-5 text-right bg-slate-50 sticky top-0 z-20">관 리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLedger.map((entry) => (
                <tr 
                  key={entry.id} 
                  onClick={() => {
                    setFocusedShelterId(entry.shelterId);
                    showToast(`${entry.shelterName}의 실시간 잔고를 조회합니다.`, 'success');
                  }}
                  className={cn(
                    "hover:bg-slate-50/50 group transition-all cursor-pointer",
                    selectedIds.has(entry.id) ? "bg-indigo-50/20" : "",
                    focusedShelterId === entry.shelterId ? "bg-indigo-50/40 ring-1 ring-inset ring-indigo-100" : ""
                  )}
                >
                  <td className="px-6 py-4.5 whitespace-nowrap">
                    <button 
                       onClick={(e) => { 
                         e.stopPropagation(); 
                         toggleSelect(entry.id);
                         setFocusedShelterId(entry.shelterId);
                       }}
                       className={cn(
                         "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                         selectedIds.has(entry.id)
                           ? "bg-indigo-600 border-indigo-600 text-white"
                           : "bg-white border-slate-200 group-hover:border-slate-300"
                       )}
                    >
                       {selectedIds.has(entry.id) && <CheckCircle2 size={12} />}
                    </button>
                  </td>
                  <td className="px-6 py-4.5 whitespace-nowrap">
                    <span className="text-[11px] font-black text-slate-800 tracking-tighter">{entry.date}</span>
                  </td>
                  <td className="px-6 py-4.5 whitespace-nowrap min-w-[5rem]">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight inline-block",
                      entry.type === '입고' 
                        ? "bg-blue-50 text-blue-600 border border-blue-100" 
                        : "bg-red-50 text-red-600 border border-red-100"
                    )}>
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-6 py-4.5 whitespace-nowrap">
                    <span className="text-xs font-bold text-slate-700">{entry.shelterName}</span>
                  </td>
                  <td className="px-6 py-4.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                         <Box size={14} />
                       </div>
                       <span className="text-xs font-bold text-slate-600">{entry.itemName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4.5 text-right whitespace-nowrap">
                    {entry.type === '출고' ? (
                      <span className="text-[11px] font-black text-slate-800 tabular-nums">
                        {entry.shippingFee ? `₩${(Math.round(entry.shippingFee * 1.1)).toLocaleString()}` : '₩0'}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className={cn(
                    "px-6 py-4.5 text-right font-black text-sm tabular-nums whitespace-nowrap",
                    entry.type === '입고' ? "text-blue-600" : "text-red-600"
                  )}>
                    {entry.type === '입고' ? '+' : '-'}{entry.quantity.toLocaleString()}
                  </td>
                  <td className="px-6 py-4.5 text-right font-black text-sm text-slate-800 tabular-nums whitespace-nowrap">
                    {entry.balance.toLocaleString()}
                  </td>
                  <td className="px-6 py-4.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleOpenEdit(entry)}
                        className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 border border-transparent hover:border-indigo-100 transition-all shadow-sm"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLedger.length === 0 && (
             <div className="flex flex-col items-center justify-center py-20 gap-3">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                  <Database size={32} />
               </div>
               <p className="text-sm font-bold text-slate-300 italic">일치하는 결과가 없습니다.</p>
             </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-md"
          >
            <CheckCircle2 className="text-emerald-400" size={18} />
            <span className="text-[13px] font-black tracking-tight">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Balance Summary Modal */}
      <AnimatePresence>
        {isSummaryModalOpen && (
          <ModalWrapper
            isOpen={isSummaryModalOpen}
            onClose={() => setIsSummaryModalOpen(false)}
            title="보호소별 실시간 잔고 요약"
            icon={<Database size={20} />}
            width="max-w-4xl"
          >
            <div className="p-8 space-y-6 flex flex-col bg-white">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={summaryFilter}
                    onChange={e => setSummaryFilter(e.target.value)}
                    placeholder="전체 보호소 또는 품목명으로 검색..." 
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold shadow-sm focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                  />
                </div>
                <button className="px-6 py-4 bg-slate-50 text-slate-500 font-black text-sm rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all flex items-center gap-2">
                   <Filter size={18} /> 필터링
                </button>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar border border-slate-100 rounded-3xl max-h-[50vh]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 sticky top-0 z-10 border-b-2 border-slate-200 shadow-sm">
                    <tr>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 sticky top-0 z-10">보호소명</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 sticky top-0 z-10">품목명</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center bg-slate-50 sticky top-0 z-10">규격</th>
                      <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 sticky top-0 z-10">현재 총 잔고</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {shelterSummary.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-6 py-4.5 font-bold text-slate-800 text-sm">
                          {item.shelterName}
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
                              <Box size={14} />
                            </div>
                            <span className="text-sm font-black text-slate-700">{item.itemName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-bold text-slate-400">
                            {item.spec}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-right">
                           <div className={cn(
                             "text-lg font-black tracking-tight",
                             item.quantity <= 0 ? "text-rose-500" : 
                             item.quantity < 200 ? "text-amber-500" : "text-emerald-600"
                           )}>
                             {item.quantity.toLocaleString()}<span className="text-xs ml-0.5 opacity-60 font-bold uppercase">kg</span>
                           </div>
                           {item.quantity < 200 && (
                             <p className="text-[9px] font-black italic text-amber-500 mt-0.5">재고 보충 필요</p>
                           )}
                        </td>
                      </tr>
                    ))}
                    {shelterSummary.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                          <AlertCircle size={32} className="mx-auto text-slate-200 mb-2" />
                          <p className="text-sm font-bold text-slate-300 italic">집계된 데이터가 없습니다.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-slate-500 italic">수원 및 연동된 실시간 데이터입니다.</span>
                </div>
                <button className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-black text-sm rounded-xl border border-slate-200 transition-all flex items-center gap-2 shadow-sm active:scale-95">
                   <FileText size={18} className="text-blue-500" /> 엑셀 파일로 내보내기 (.xlsx)
                </button>
              </div>
            </div>
          </ModalWrapper>
        )}
      </AnimatePresence>

      {/* Stock In Modal */}
      <AnimatePresence>
        {isStockInModalOpen && (
          <ModalWrapper
            isOpen={isStockInModalOpen}
            onClose={() => setIsStockInModalOpen(false)}
            title={editingEntry ? '수불 내역 수정' : '후원 물품 적립(입고)'}
            icon={<PlusCircle size={20} />}
            width="max-w-lg"
          >
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit('입고'); }} className="p-8 space-y-6 bg-white overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">대상 보호소</label>
                    <select 
                      required
                      value={formData.shelterId}
                      onChange={e => setFormData({...formData, shelterId: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                    >
                      <option value="">보호소 선택</option>
                      <option value="SHT-001">왕왕랜드</option>
                      <option value="SHT-002">삼송보호소</option>
                      <option value="SHT-003">드림테일즈</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">입고 일자</label>
                    <input 
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">품목명</label>
                  <input 
                    required
                    type="text" 
                    value={formData.itemName}
                    onChange={e => setFormData({...formData, itemName: e.target.value})}
                    placeholder="e.g. 넥스트 펫밸런스 어덜트"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">규격</label>
                    <input 
                      required
                      type="text" 
                      value={formData.specification}
                      onChange={e => setFormData({...formData, specification: e.target.value})}
                      placeholder="e.g. 10kg 포대"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">입고 수량(kg)</label>
                    <input 
                      required
                      type="number" 
                      value={formData.quantity}
                      onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">비고 / 후원 정보</label>
                  <textarea 
                    value={formData.remarks}
                    onChange={e => setFormData({...formData, remarks: e.target.value})}
                    placeholder="후원 기업명 또는 특별 사항 기재"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all h-20 resize-none"
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-[#2D336B] text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-900/10 hover:shadow-indigo-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <CheckCircle2 size={18} /> {editingEntry ? '변경 사항 저장' : '입고 완료 및 장부 반영'}
              </button>
            </form>
          </ModalWrapper>
        )}
      </AnimatePresence>

      {/* Stock Out Modal */}
      <AnimatePresence>
        {isStockOutModalOpen && (
          <ModalWrapper
            isOpen={isStockOutModalOpen}
            onClose={() => setIsStockOutModalOpen(false)}
            title={editingEntry ? '출고 내역 수정' : '물품 출고 및 배송 등록'}
            icon={<Truck size={20} />}
            width="max-w-lg"
          >
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit('출고'); }} className="p-8 space-y-6 bg-white overflow-y-auto custom-scrollbar">
              {!editingEntry && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                   <AlertCircle className="text-amber-500 flex-shrink-0" size={18} />
                   <p className="text-[11px] text-amber-700 font-bold leading-relaxed">
                     출고 등록 시 선택한 보호소의 잔고가 실시간 차감되며,<br />
                     <span className="underline underline-offset-2">배송 현황 리스트</span>에 자동으로 주문 접수 상태로 추가됩니다.
                   </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">출고 대상 보호소</label>
                    <select 
                      required
                      value={formData.shelterId}
                      onChange={e => setFormData({...formData, shelterId: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                    >
                      <option value="">보호소 선택</option>
                      <option value="SHT-001">왕왕랜드</option>
                      <option value="SHT-002">삼송보호소</option>
                      <option value="SHT-003">드림테일즈</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">출고 품목</label>
                    <select 
                      required
                      value={formData.itemName}
                      onChange={e => setFormData({...formData, itemName: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                    >
                      <option value="">품목 선택</option>
                      <option value="넥스트 펫밸런스 어덜트">넥스트 펫밸런스 어덜트</option>
                      <option value="퍼피 프리미엄 연어">퍼피 프리미엄 연어</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">출고 수량(kg)</label>
                    <input 
                      required
                      type="number" 
                      value={formData.quantity}
                      onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">배송/출고 일자</label>
                    <input 
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">배송비 (부가세 별도)</label>
                  <input 
                    type="number" 
                    value={formData.shippingFee}
                    onChange={e => setFormData({...formData, shippingFee: Number(e.target.value)})}
                    placeholder="공급가액 입력"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                  />
                  <p className="text-[9px] font-bold text-slate-400 mt-1 pl-1">* 입력 시 VAT 10%가 자동으로 가산되어 정산됩니다.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">배송 특이사항</label>
                  <textarea 
                    value={formData.remarks}
                    onChange={e => setFormData({...formData, remarks: e.target.value})}
                    placeholder="배송 담당자에게 전달할 메모"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all h-20 resize-none"
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-900/10 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <Truck size={18} /> {editingEntry ? '수정 완료' : '출고 등록 및 배송 시작'}
              </button>
            </form>
          </ModalWrapper>
        )}
      </AnimatePresence>
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <ModalWrapper
            isOpen={isDeleteConfirmOpen}
            onClose={() => setIsDeleteConfirmOpen(false)}
            title={deleteId ? '수불 내역 삭제' : '선택 내역 삭제'}
            icon={<AlertCircle size={20} />}
            width="max-w-sm"
            headerColor="bg-rose-600"
          >
            <div className="p-8 flex flex-col items-center text-center bg-white">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-6">
                <AlertCircle size={32} />
              </div>
              <p className="text-sm text-slate-500 font-bold leading-relaxed mb-8">
                {deleteId 
                  ? '이 내역을 정말 삭제하시겠습니까?\n삭제 후에는 잔고가 자동으로 재계산됩니다.' 
                  : `선택한 ${selectedIds.size}개의 내역을 정말 삭제하시겠습니까?\n삭제 후에는 잔고가 자동으로 재계산됩니다.`}
              </p>
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="flex-1 py-3.5 bg-slate-50 text-slate-500 font-black text-xs rounded-xl hover:bg-slate-100 transition-all font-sans"
                >
                  취소
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3.5 bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all font-sans"
                >
                  삭제하기
                </button>
              </div>
            </div>
          </ModalWrapper>
        )}
      </AnimatePresence>

    </div>
  );
}
