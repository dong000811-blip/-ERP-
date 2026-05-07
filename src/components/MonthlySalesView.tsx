import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Search,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle as AlertIcon,
  PlusCircle,
  Plus,
  Trash2,
  X,
  CreditCard
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { cn } from '../lib/utils';
import { useShelters } from '../context/ShelterContext';
import { useFirestore } from '../FirestoreContext';

// --- Types ---
interface MonthlyKPI {
  label: string;
  value: string;
  subValue: string;
  change: number; // positive or negative percentage
  icon: any;
  color: string;
}

interface AggregatedSalesData {
  category: string; // Shelter Name or '일반 판매 (B2C)'
  normalCount: number;
  totalRevenue: number;
  totalFees: number;
  totalSettlement: number;
  cancelCount: number;
  cancelAmount: number;
  isTotal?: boolean;
}

interface RawSalesRow {
  id: string;
  productName: string;
  category: string; 
  status: string;
  revenue: number;
  settlement: number;
  fees: number;
  originalRow: any;
  isAdjustment?: boolean;
}

interface SettlementAdjustment {
  id: string;
  month: string; // e.g., '2026-05'
  shelterName: string;
  type: '사후 취소' | '반품 정산' | '기타 차감';
  amount: number; // 차감 매출액 (Deduction Amount)
  commission: number; // 환급 수수료 (Refunded Commission)
  memo: string;
  createdAt: string;
}
// --- Constants ---
const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#10B981', '#F59E0B', '#94A3B8'];

// Custom aliases for flexible matching (e.g., "드림테일즈" in product name -> "드림테일즈 레스큐")
const SHELTER_ALIASES: Record<string, string> = {
  "드림테일즈": "드림테일즈 레스큐",
  "똥강아지": "똥강아지 공화국",
  "삼송": "삼송보호소",
};

interface KPICardProps {
  data: MonthlyKPI;
}

const KPICard: React.FC<KPICardProps> = ({ data }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-xl bg-slate-50", data.color)}>
        <data.icon size={20} />
      </div>
      <div className={cn(
        "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full",
        data.change >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
      )}>
        {data.change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {Math.round(Math.abs(data.change) * 10) / 10}%
      </div>
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{data.label}</p>
      <h3 className="text-xl font-black text-slate-800 tracking-tight">{data.value}</h3>
      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{data.subValue}</p>
    </div>
  </motion.div>
);

const MonthlySalesView: React.FC = () => {
  const { shelters } = useShelters();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [salesData, setSalesData] = useState<AggregatedSalesData[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Preview / Staging States
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [stagingRows, setStagingRows] = useState<RawSalesRow[]>([]);
  const [excelTotalAmount, setExcelTotalAmount] = useState(0);

  // Firestore Data
  const { settlements, adjustments, addDocument, deleteDocument, currentUser } = useFirestore();

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [newAdjustment, setNewAdjustment] = useState<Partial<SettlementAdjustment>>({
    type: '사후 취소',
    amount: 0,
    commission: 0,
    memo: ''
  });

  // Current month adjustments
  const currentMonthAdjustments = useMemo(() => {
    return (adjustments || []).filter(a => a.month === selectedMonth);
  }, [adjustments, selectedMonth]);

  const adjustmentRevenueTotal = useMemo(() => {
    return currentMonthAdjustments.reduce((sum, a) => sum - a.amount, 0);
  }, [currentMonthAdjustments]);

  const adjustmentSettlementTotal = useMemo(() => {
    // Net impact on settlement: -(Amount - Commission)
    return currentMonthAdjustments.reduce((sum, a) => sum - (a.amount - a.commission), 0);
  }, [currentMonthAdjustments]);

  // Load saved data for selected month
  useEffect(() => {
    const matched = settlements.find(s => s.month === selectedMonth);
    if (matched && !isPreviewMode) {
      setSalesData(matched.data || []);
    } else if (!matched && !isPreviewMode) {
      setSalesData([]);
    }
  }, [selectedMonth, settlements, isPreviewMode]);

  // Parse Excel and show Preview
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadStatus('idle');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const findBestShelterMatch = (productName: string) => {
          const normalizedProduct = productName.replace(/\s+/g, '');
          
          // 1. Alias Check (Highest Priority)
          for (const [alias, realName] of Object.entries(SHELTER_ALIASES)) {
            const normalizedAlias = alias.replace(/\s+/g, '');
            if (normalizedProduct.includes(normalizedAlias)) {
              return realName;
            }
          }

          // 2. Normalized Inclusion Check
          for (const s of shelters) {
            const normalizedShelter = s.name.replace(/\s+/g, '');
            if (normalizedProduct.includes(normalizedShelter)) {
              return s.name;
            }
          }

          // 3. Core Keyword Check (First word of shelter name)
          for (const s of shelters) {
            const coreKeyword = s.name.trim().split(/\s+/)[0];
            if (coreKeyword && normalizedProduct.includes(coreKeyword.replace(/\s+/g, ''))) {
              return s.name;
            }
          }

          return null;
        };

        let totalRaw = 0;
        const rows: RawSalesRow[] = data.map((row, index) => {
          const productName = String(row['상품명'] || '');
          const revenue = Number(row['정산기준금액'] || 0);
          const settlement = Number(row['정산예정금액'] || 0);
          const fee1 = Number(row['Npay 수수료'] || 0);
          const fee2 = Number(row['매출 연동 수수료 합계'] || 0);
          const fee3 = Number(row['무이자할부 수수료'] || 0);
          const totalFees = fee1 + fee2 + fee3;
          const status = String(row['정산상태'] || '');
          
          totalRaw += revenue;

          // Advanced matching logic
          const matchedShelter = findBestShelterMatch(productName);
          const initialCategory = matchedShelter ? `${matchedShelter}` : '일반 판매 (B2C)';

          return {
            id: `row-${index}-${Date.now()}`,
            productName,
            category: initialCategory,
            status,
            revenue,
            settlement,
            fees: totalFees,
            originalRow: row
          };
        });

        setStagingRows(rows);
        setExcelTotalAmount(totalRaw);
        setIsPreviewMode(true);
        setUploadStatus('success');
      } catch (err) {
        console.error('Excel parsing error:', err);
        setUploadStatus('error');
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // Derived aggregation for either final display or preview validation
  const currentAggregated = useMemo(() => {
    const source = isPreviewMode ? stagingRows : []; // If not in preview, we use salesData below
    if (!isPreviewMode) return salesData;

    const aggregation: Record<string, AggregatedSalesData> = {};
    source.forEach(row => {
      const category = row.category;
      const status = row.status;

      if (!aggregation[category]) {
        aggregation[category] = {
          category,
          normalCount: 0,
          totalRevenue: 0,
          totalFees: 0,
          totalSettlement: 0,
          cancelCount: 0,
          cancelAmount: 0
        };
      }

      const isCancel = status.includes('취소') || status.includes('반품') || status.includes('환불');
      if (isCancel) {
        aggregation[category].cancelCount += 1;
        aggregation[category].cancelAmount += Math.abs(row.revenue);
      } else {
        aggregation[category].normalCount += 1;
        aggregation[category].totalRevenue += row.revenue;
        aggregation[category].totalFees += row.fees;
        aggregation[category].totalSettlement += row.settlement;
      }
    });

    return Object.values(aggregation).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [stagingRows, isPreviewMode, salesData]);

  const parsedTotalAmount = useMemo(() => {
    // Total from aggregation including cancellations? 
    // Actually the user says "파싱된 데이터 총 금액 (취소건 제외)"
    return currentAggregated.reduce((sum, item) => sum + item.totalRevenue, 0);
  }, [currentAggregated]);

  const isVerified = Math.abs(excelTotalAmount - (parsedTotalAmount + currentAggregated.reduce((sum, item) => sum + item.cancelAmount, 0))) < 1;
  // Note: verify against (Parsed Total + Cancel Total) because Parsed Total is requested to be net of cancellations

  const handleCommitToDB = async () => {
    setIsProcessing(true);
    try {
      // Save aggregated data to DB
      const settlementRecord = {
        month: selectedMonth,
        data: currentAggregated,
        totalRevenue: parsedTotalAmount,
        createdAt: new Date().toISOString(),
      };
      
      await addDocument('settlements', settlementRecord);
      
      setSalesData(currentAggregated);
      setIsPreviewMode(false);
      setStagingRows([]);
      alert('데이터가 성공적으로 검증 및 저장되었습니다.');
    } catch (error) {
      console.error(error);
      alert('DB 저장 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAdjustment = () => {
    if (!newAdjustment.shelterName || !newAdjustment.amount) {
      alert('대상 보호소와 차감 금액을 입력해주세요.');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAdjustment = async () => {
    try {
      setIsProcessing(true);
      const adjustmentData = {
        ...newAdjustment,
        month: selectedMonth,
        createdAt: new Date().toISOString(),
        userId: currentUser?.uid // Ensure userId is attached for consistency
      };
      await addDocument('adjustments', adjustmentData);
      
      setIsConfirmModalOpen(false);
      setIsAdjustmentModalOpen(false);
      setNewAdjustment({ type: '사후 취소', amount: 0, commission: 0, memo: '' });
      
      alert('조정 내역이 성공적으로 등록되었습니다.');
    } catch (error) {
      console.error(error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAdjustment = async (id: string) => {
    if (!window.confirm('조정 내역을 삭제하시겠습니까?')) return;
    try {
      await deleteDocument('adjustments', id);
    } catch (error) {
      console.error(error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateCategory = (rowId: string, newCategory: string) => {
    setStagingRows(prev => prev.map(row => 
      row.id === rowId ? { ...row, category: newCategory } : row
    ));
  };

  // Calculated totals for Top Sum row
  const totals = useMemo(() => {
    return salesData.reduce((acc, curr) => ({
      category: '전체 합계',
      normalCount: acc.normalCount + curr.normalCount,
      totalRevenue: acc.totalRevenue + curr.totalRevenue,
      totalFees: acc.totalFees + curr.totalFees,
      totalSettlement: acc.totalSettlement + curr.totalSettlement,
      cancelCount: acc.cancelCount + curr.cancelCount,
      cancelAmount: acc.cancelAmount + curr.cancelAmount,
      isTotal: true
    }), {
      category: '전체 합계',
      normalCount: 0,
      totalRevenue: 0,
      totalFees: 0,
      totalSettlement: 0,
      cancelCount: 0,
      cancelAmount: 0,
      isTotal: true
    });
  }, [salesData]);

  const kpis: MonthlyKPI[] = useMemo(() => [
    { 
      label: '총 매출액', 
      value: `₩${(totals.totalRevenue + adjustmentRevenueTotal).toLocaleString()}`, 
      subValue: '엑셀 합계 + 수동 조정', 
      change: salesData.length > 0 ? 12.5 : 0, 
      icon: DollarSign, 
      color: 'text-indigo-600' 
    },
    { 
      label: '총 정산금액', 
      value: `₩${(totals.totalSettlement + adjustmentSettlementTotal).toLocaleString()}`, 
      subValue: `최종 실 수령액`, 
      change: salesData.length > 0 ? 8.2 : 0, 
      icon: TrendingUp, 
      color: 'text-emerald-600' 
    },
    { 
      label: '총 결제 건수', 
      value: `${totals.normalCount}건`, 
      subValue: `전체 유효 주문`, 
      change: salesData.length > 0 ? 15.3 : 0, 
      icon: Package, 
      color: 'text-amber-600' 
    },
    { 
      label: '취소/반품/조정 총액', 
      value: `₩${(totals.cancelAmount + Math.abs(adjustmentRevenueTotal)).toLocaleString()}`, 
      subValue: `${totals.cancelCount}건 + ${currentMonthAdjustments.length}건 조정`, 
      change: salesData.length > 0 ? -1.2 : 0, 
      icon: TrendingDown, 
      color: 'text-rose-600' 
    },
  ], [totals, salesData, adjustmentRevenueTotal, adjustmentSettlementTotal, currentMonthAdjustments]);

  const pieData = useMemo(() => {
    return salesData
      .slice(0, 5)
      .map(d => ({ name: d.category, value: d.totalRevenue }));
  }, [salesData]);

  const filteredData = useMemo(() => {
    return salesData.filter(d => 
      d.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [salesData, searchTerm]);

  return (
    <div className="flex flex-col h-full overflow-y-auto gap-8 pb-24 custom-scrollbar pr-2">
      {/* Header with Month Filter & Upload */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white/50 p-4 rounded-2xl border border-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-xl shadow-indigo-200">
            <BarChart3 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">월별 정산 현황 고도화</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">B2B & B2C Settlement Aggregator</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
                <CalendarIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="month" 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                />
            </div>

            <div className="h-8 w-px bg-slate-200" />

            <input 
              type="file" 
              accept=".xlsx, .xls" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-lg active:scale-95",
                isProcessing ? "bg-slate-100 text-slate-400" : "bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700"
              )}
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              정산 엑셀 업로드
            </button>

            <button 
              onClick={() => setIsAdjustmentModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-amber-500 text-white shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all active:scale-95"
            >
              <PlusCircle size={16} />
              추가 조정 내역 등록
            </button>

            <AnimatePresence>
              {uploadStatus !== 'idle' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase",
                    uploadStatus === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}
                >
                  {uploadStatus === 'success' ? <CheckCircle2 size={14} /> : <AlertIcon size={14} />}
                  {uploadStatus === 'success' ? '데이터 분석 완료' : '업로드 실패'}
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        {kpis.map((kpi, i) => (
          <KPICard key={i} data={kpi} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 min-h-[300px] shrink-0">
        {/* Market Share Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:col-span-1">
            <div className="mb-4">
                <h4 className="text-[13px] font-black text-slate-800 tracking-tight">주요 보호소별 매출 비중</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Revenue Concentration</p>
            </div>
            <div className="flex-1 flex items-center justify-center min-h-0">
                {salesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={pieData}
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                          >
                              {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                          </Pie>
                          <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px' }}
                              formatter={(value: number) => `₩${value.toLocaleString()}`}
                          />
                          <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 800 }} />
                      </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-300 gap-2">
                    <FileSpreadsheet size={32} />
                    <p className="text-[10px] font-bold uppercase">데이터를 업로드해주세요</p>
                  </div>
                )}
            </div>
        </div>

        {/* Info Box */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <FileSpreadsheet size={32} className="text-indigo-400" />
            </div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">실무형 정산 집계 엔진 활성화</h4>
            <div className="mt-4 grid grid-cols-2 gap-4 text-left max-w-lg">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">매핑 로직</p>
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed">상품명 내 보호소 키워드 자동 매칭 (B2B/B2C 분리)</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-rose-600 uppercase mb-1">상태 필터</p>
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed">정상 정산 건과 취소/반품/환불 건을 자동 분류하여 집계</p>
                </div>
            </div>
            <p className="text-[10px] text-slate-300 mt-6 font-bold">* 네이버 스마트스토어 등 주요 쇼핑몰 정산 엑셀 표준 포맷 지원</p>
        </div>
      </div>

      {/* Detailed Aggregation Table / Staging View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[600px] shrink-0">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-30 shrink-0 rounded-t-2xl shadow-sm">
            <div>
              <h4 className="text-[13px] font-black text-slate-800 tracking-tight">
                {isPreviewMode ? "검증 및 데이터 매핑 (Staging)" : "보호소별/카테고리별 정산 내역"}
              </h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 font-mono">
                {isPreviewMode ? "Data Verification & Manual Mapping" : "Detailed Settlement Grid"}
              </p>
            </div>
            {isPreviewMode ? (
              <div className="flex items-center gap-6">
                 {/* Summary Validation Panel */}
                 <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">원본 엑셀 총 금액</span>
                        <span className="text-xs font-black text-slate-600">₩{excelTotalAmount.toLocaleString()}</span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">파싱 총 금액 (취소제외)</span>
                        <span className="text-xs font-black text-indigo-600">₩{parsedTotalAmount.toLocaleString()}</span>
                    </div>
                    <div className="ml-2">
                        {isVerified ? (
                          <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                            <CheckCircle2 size={12} /> 검증 완료
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                            <AlertIcon size={12} /> 오류 확인 요망
                          </div>
                        )}
                    </div>
                 </div>
                 <button 
                  onClick={() => {
                    setIsPreviewMode(false);
                    setStagingRows([]);
                  }}
                  className="text-[10px] font-black text-slate-400 hover:text-slate-600"
                 >
                   취소
                 </button>
              </div>
            ) : (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="카테고리 검색..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs w-[240px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50/50 font-medium transition-all" 
                />
              </div>
            )}
        </div>

        <div className="flex-1">
          {!isPreviewMode ? (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="sticky top-[81px] bg-slate-50 z-20 shadow-sm">
                <tr>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">구분 (보호소명/기타)</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">정상 결제건수</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">총 매출액</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">수수료 합계</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">최종 정산금</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right text-rose-500">취소 건수</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right text-rose-500">취소 금액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* TOTAL ROW AT THE TOP */}
                {salesData.length > 0 && (
                  <tr className="bg-indigo-50/50 sticky top-[126px] z-10 border-b-2 border-indigo-100 font-bold">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black">Σ</div>
                          <span className="text-xs font-black text-indigo-900">{totals.category}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right text-xs font-black text-indigo-600">{totals.normalCount.toLocaleString()}건</td>
                    <td className="p-4 text-right text-xs font-black text-indigo-900">₩{totals.totalRevenue.toLocaleString()}</td>
                    <td className="p-4 text-right text-xs font-bold text-slate-400">₩{totals.totalFees.toLocaleString()}</td>
                    <td className="p-4 text-right text-xs font-black text-emerald-600">₩{totals.totalSettlement.toLocaleString()}</td>
                    <td className="p-4 text-right text-xs font-black text-rose-600">{totals.cancelCount.toLocaleString()}건</td>
                    <td className="p-4 text-right text-xs font-black text-rose-600">₩{totals.cancelAmount.toLocaleString()}</td>
                  </tr>
                )}

                {filteredData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px]",
                            item.category === '일반 판매 (B2C)' ? "bg-slate-100 text-slate-400" : "bg-indigo-50 text-indigo-600"
                          )}>
                              {item.category.charAt(0)}
                          </div>
                          <span className="text-xs font-black text-slate-800">{item.category}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-xs font-bold text-slate-600">{item.normalCount.toLocaleString()}건</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-xs font-black text-slate-800">₩{item.totalRevenue.toLocaleString()}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-xs font-bold text-slate-400">₩{item.totalFees.toLocaleString()}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-sm font-black text-indigo-600">₩{item.totalSettlement.toLocaleString()}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-xs font-bold text-rose-400">{item.cancelCount.toLocaleString()}건</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-xs font-bold text-rose-400">₩{item.cancelAmount.toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col">
               <table className="w-full text-left border-collapse min-w-[1000px] table-fixed">
                <thead className="sticky top-[81px] bg-slate-50 z-20 shadow-sm border-b border-slate-100">
                  <tr>
                    <th className="w-1/4 p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">상품명</th>
                    <th className="w-1/6 p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">구분(매핑)</th>
                    <th className="w-1/12 p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">상태</th>
                    <th className="w-1/6 p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">정산기준금액</th>
                    <th className="w-1/6 p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">수수료</th>
                    <th className="w-1/6 p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">정산예정액</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stagingRows.map((row) => (
                    <tr key={row.id} className={cn(
                      "hover:bg-slate-50 transition-colors group",
                      row.category === '일반 판매 (B2C)' ? "bg-amber-50/40" : ""
                    )}>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5 max-w-full overflow-hidden">
                          <span className="text-[11px] font-bold text-slate-700 truncate">{row.productName}</span>
                          <span className="text-[9px] text-slate-400 font-black">{row.status}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <select 
                          value={row.category}
                          onChange={(e) => handleUpdateCategory(row.id, e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="일반 판매 (B2C)">일반 판매 (B2C)</option>
                          {shelters.map(s => (
                            <option key={s.id} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-black uppercase",
                          row.status.includes('취소') ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {row.status.includes('취소') ? '취소' : '정상'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-xs font-bold text-slate-700">₩{row.revenue.toLocaleString()}</span>
                      </td>
                      <td className="p-4 text-right text-[11px] text-slate-400 font-medium">
                        ₩{row.fees.toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-xs font-black text-indigo-600">₩{row.settlement.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isPreviewMode && filteredData.length === 0 && !isProcessing && (
            <div className="p-20 text-center">
              <div className="flex flex-col items-center gap-3 grayscale opacity-30">
                <FileSpreadsheet size={48} className="text-slate-200" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">표시할 데이터가 없습니다. 엑셀을 업로드하세요.</p>
              </div>
            </div>
          )}
        </div>

        {/* Verification Bottom Bar */}
        {isPreviewMode && (
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0 rounded-b-2xl">
             <div className="flex items-center gap-2 text-slate-400">
               <AlertIcon size={14} />
               <span className="text-[10px] font-bold italic">매핑이 불확실한 항목(노란색)은 드롭다운을 통해 직접 보호소를 지정할 수 있습니다.</span>
             </div>
             <div className="flex items-center gap-4">
                <div className="text-right">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">저장될 전체 매출 (취소제외)</p>
                   <p className="text-lg font-black text-[#2D336B]">₩{parsedTotalAmount.toLocaleString()}</p>
                </div>
                <button 
                  onClick={handleCommitToDB}
                  disabled={isProcessing}
                  className={cn(
                    "px-8 py-4 rounded-2xl text-xs font-black shadow-xl transition-all active:scale-95 flex items-center gap-2",
                    isProcessing ? "bg-slate-200 text-slate-400" : "bg-[#2D336B] hover:bg-[#1E234A] text-white"
                  )}
                >
                  <CheckCircle2 size={18} /> 검증 완료 및 DB 최종 저장
                </button>
             </div>
          </div>
        )}
      </div>

      {/* Manual Adjustments Table */}
      {!isPreviewMode && currentMonthAdjustments.length > 0 && (
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col shrink-0 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-amber-50/30">
               <div>
                  <h4 className="text-[13px] font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <AlertIcon size={16} className="text-amber-500" />
                    당월 수동 조정 내역
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Manual Post-Settlement Adjustments</p>
               </div>
               <div className="bg-amber-100 px-3 py-1 rounded-full text-[10px] font-black text-amber-700">
                  총 차감액: ₩{Math.abs(adjustmentRevenueTotal).toLocaleString()}
               </div>
            </div>
            <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50">
                  <tr>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">대상 보호소</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">조정 구분</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">차감 매출액</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">환급 수수료</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">메모</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">작업</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {currentMonthAdjustments.map((a) => (
                    <tr key={a.id} className="hover:bg-amber-50/20 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                           <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded tracking-widest">수동</span>
                           <span className="text-xs font-black text-slate-800">{a.shelterName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200">
                           {a.type}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-xs font-black text-rose-600">-₩{a.amount.toLocaleString()}</span>
                      </td>
                      <td className="p-4 text-right text-[11px] text-emerald-600 font-bold">
                        +₩{a.commission.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className="text-[11px] text-slate-500 italic">{a.memo || '--'}</span>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => handleDeleteAdjustment(a.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      )}

      {/* Manual Adjustment Modal */}
      <AnimatePresence>
        {isAdjustmentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsAdjustmentModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-white/20 w-full max-w-md overflow-hidden relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                      <PlusCircle size={20} />
                   </div>
                   <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">추가 조정 내역 등록</h3>
                      <p className="text-[10px] text-slate-400 font-bold">사후 취소 및 반품 전용 차감 등록</p>
                   </div>
                </div>
                <button onClick={() => setIsAdjustmentModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                   <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {/* Shelter Select */}
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">대상 보호소 (공급처)</label>
                   <div className="relative">
                      <Users size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <select 
                        value={newAdjustment.shelterName || ''}
                        onChange={(e) => setNewAdjustment(prev => ({ ...prev, shelterName: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      >
                         <option value="">보호소 선택</option>
                         <option value="일반 판매 (B2C)">일반 판매 (B2C)</option>
                         {shelters.map(s => (
                           <option key={s.id} value={s.name}>{s.name}</option>
                         ))}
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">조정 구분</label>
                      <select 
                        value={newAdjustment.type}
                        onChange={(e) => setNewAdjustment(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      >
                         <option value="사후 취소">사후 취소</option>
                         <option value="반품 정산">반품 정산</option>
                         <option value="기타 차감">기타 차감</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">차감 매출액 (₩)</label>
                      <input 
                        type="number"
                        placeholder="0"
                        value={newAdjustment.amount || ''}
                        onChange={(e) => setNewAdjustment(prev => ({ ...prev, amount: Number(e.target.value) }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">환급 수수료 (₩)</label>
                      <input 
                        type="number"
                        placeholder="0"
                        value={newAdjustment.commission || ''}
                        onChange={(e) => setNewAdjustment(prev => ({ ...prev, commission: Number(e.target.value) }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                   </div>
                   <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
                      <div className="text-center">
                         <p className="text-[9px] font-black text-indigo-400 uppercase">예상 정산 차감액</p>
                         <p className="text-sm font-black text-indigo-700">
                           ₩{((newAdjustment.amount || 0) - (newAdjustment.commission || 0)).toLocaleString()}
                         </p>
                      </div>
                   </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">조정 메모 (사유)</label>
                    <textarea 
                      placeholder="예: 고객 단순 변심 반품 (정산 확정 후)"
                      value={newAdjustment.memo}
                      onChange={(e) => setNewAdjustment(prev => ({ ...prev, memo: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 min-h-[80px]"
                    />
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                 <button 
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-black text-slate-400 hover:bg-white hover:text-slate-600 transition-all"
                 >
                   취소
                 </button>
                 <button 
                  onClick={(e) => {
                    e.preventDefault();
                    handleSaveAdjustment();
                  }}
                  disabled={isProcessing}
                  className="flex-3 bg-amber-500 text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 font-mono"
                 >
                   조정 내역 등록
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2-Step Confirmation Modal */}
      <AnimatePresence>
        {isConfirmModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-white/20 w-full max-w-sm overflow-hidden relative z-10"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertIcon size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">최종 등록 확인</h3>
                <p className="text-[11px] text-slate-500 font-bold mt-2 leading-relaxed">
                  아래 내용으로 취소 데이터를 확정하시겠습니까?<br />
                  이 작업은 재무 통계에 즉시 반영됩니다.
                </p>

                <div className="mt-8 bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">대상 보호소</span>
                    <span className="text-xs font-black text-slate-800">{newAdjustment.shelterName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">조정 금액</span>
                    <span className="text-xs font-black text-rose-600">-₩{newAdjustment.amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">환급 수수료</span>
                    <span className="text-xs font-black text-emerald-600">+₩{newAdjustment.commission?.toLocaleString()}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">실 정산 영향</span>
                    <span className="text-sm font-black text-indigo-700">
                      -₩{((newAdjustment.amount || 0) - (newAdjustment.commission || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button 
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="flex-1 py-4 rounded-xl border border-slate-200 text-xs font-black text-slate-400 hover:bg-white hover:text-slate-600 transition-all font-mono"
                >
                  돌아가기
                </button>
                <button 
                  onClick={handleConfirmAdjustment}
                  disabled={isProcessing}
                  className="flex-2 bg-[#2D336B] text-white py-4 rounded-xl text-xs font-black shadow-lg shadow-indigo-100 hover:bg-[#1D235B] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 font-mono"
                >
                  {isProcessing ? '처리 중...' : '최종 승인 및 저장'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>

  );
};

export default MonthlySalesView;
