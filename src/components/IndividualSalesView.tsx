import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  TrendingUp, 
  ShoppingBag, 
  Clock, 
  MapPin, 
  Phone, 
  MessageSquare as MsgIcon,
  Filter,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  ArrowRight,
  Trash2,
  DollarSign,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirestore } from '../FirestoreContext';
import { useShelters } from '../context/ShelterContext';
import { ModalWrapper } from './ModalWrapper';
import { cn } from '../lib/utils';

const IndividualSalesView: React.FC = () => {
  const { individualSales, products, addDocument, updateDocument, deleteDocument, currentUser } = useFirestore();
  const { shelters } = useShelters();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Filters
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0].substring(0, 7)); // YYYY-MM
  const [shelterFilter, setShelterFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    orderer: '',
    contact: '',
    productId: '',
    productName: '',
    quantity: 1,
    unitPrice: 0,
    totalAmount: 0,
    shippingAddress: '',
    memo: '',
    shelterId: '',
    orderDate: new Date().toISOString().split('T')[0]
  });

  const [isEditing, setIsEditing] = useState(false);
  const [currentEditingId, setCurrentEditingId] = useState<string | null>(null);

  const [productSearch, setProductSearch] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  // Constants
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7);

  // KPI Calculations
  const stats = useMemo(() => {
    const todaySales = individualSales.filter(s => s.orderDate === today);
    const monthSales = individualSales.filter(s => s.orderDate.startsWith(currentMonth));

    const todayRevenue = todaySales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const monthRevenue = monthSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const todayCount = todaySales.length;

    return {
      todayRevenue,
      monthRevenue,
      todayCount
    };
  }, [individualSales, today, currentMonth]);

  // Filtered Sales
  const filteredSales = useMemo(() => {
    return individualSales.filter(s => {
      const matchesDate = s.orderDate.startsWith(dateFilter);
      const matchesShelter = shelterFilter === 'All' || s.shelterId === shelterFilter;
      const matchesSearch = s.orderer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.productName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDate && matchesShelter && matchesSearch;
    }).sort((a, b) => b.orderDate.localeCompare(a.orderDate));
  }, [individualSales, dateFilter, shelterFilter, searchTerm]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  const handleProductSelect = (product: any) => {
    setFormData(prev => ({
      ...prev,
      productId: product.id,
      productName: product.name,
      unitPrice: product.sellingPrice,
      totalAmount: product.sellingPrice * prev.quantity
    }));
    setProductSearch(product.name);
    setIsProductDropdownOpen(false);
  };

  const handleQuantityChange = (q: number) => {
    setFormData(prev => ({
      ...prev,
      quantity: q,
      totalAmount: prev.unitPrice * q
    }));
  };

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const handleResetForm = () => {
    setFormData({
      orderer: '',
      contact: '',
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      totalAmount: 0,
      shippingAddress: '',
      memo: '',
      shelterId: '',
      orderDate: new Date().toISOString().split('T')[0]
    });
    setProductSearch('');
    setIsModalOpen(false);
    setIsConfirmModalOpen(false);
    setIsProcessing(false);
    setIsEditing(false);
    setCurrentEditingId(null);
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || formData.quantity <= 0 || !formData.orderer) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleEdit = (sale: any) => {
    setFormData({
      orderer: sale.orderer,
      contact: sale.contact || '',
      productId: sale.productId,
      productName: sale.productName,
      quantity: sale.quantity,
      unitPrice: sale.unitPrice,
      totalAmount: sale.totalAmount,
      shippingAddress: sale.shippingAddress || '',
      memo: sale.memo || '',
      shelterId: sale.shelterId || '',
      orderDate: sale.orderDate
    });
    setProductSearch(sale.productName);
    setIsEditing(true);
    setCurrentEditingId(sale.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setIsProcessing(true);
      
      if (isEditing && currentEditingId) {
        await updateDocument('individualOrders', currentEditingId, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        alert('주문 정보가 수정되었습니다.');
      } else {
        const saleData = {
          ...formData,
          createdAt: new Date().toISOString(),
          userId: currentUser?.uid
        };
        await addDocument('individualOrders', saleData);
        alert('주문이 성공적으로 등록되었습니다.');
      }
      
      handleResetForm();
    } catch (error) {
      console.error('Operation failed:', error);
      alert('처리 중 오류가 발생했습니다. 브라우저 콘솔을 확인해 주세요.');
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('이 주문 내역을 삭제하시겠습니까?')) {
      await deleteDocument('individualOrders', id);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 overflow-hidden">
      {/* KPI Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">오늘 총 매출액</p>
            <p className="text-xl font-black text-slate-800">₩{stats.todayRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-[#2D336B] p-5 rounded-2xl shadow-lg shadow-indigo-100 flex items-center gap-4 text-white">
          <div className="p-3 bg-white/10 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">이번 달 총 매출액</p>
            <p className="text-xl font-black">₩{stats.monthRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">오늘 주문 건수</p>
            <p className="text-xl font-black text-slate-800">{stats.todayCount} 건</p>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
            <input 
              type="month" 
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-black text-slate-600 outline-none px-2 py-1 cursor-pointer"
            />
          </div>
          <select 
            value={shelterFilter}
            onChange={e => setShelterFilter(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/10"
          >
            <option value="All">전체 보호소</option>
            {shelters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="주문자 또는 제품명 검색..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/10 w-64"
            />
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-accent hover:bg-accent/90 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-emerald-100 transition-all flex items-center gap-2"
        >
          <Plus size={16} /> 신규 주문 등록
        </button>
      </div>

      {/* Table Section */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0">
        <div className="overflow-x-auto overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">주문일자</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">주문자</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">연락처</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">제품명</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">수량</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">총 결제금액</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">배송지</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">기타사항</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-xs font-mono font-bold text-slate-400">{sale.orderDate}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-black text-slate-700">{sale.orderer}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">{sale.contact || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">{sale.productName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">₩{sale.unitPrice.toLocaleString()} / EA</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-600">{sale.quantity}EA</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs font-black text-indigo-600">₩{sale.totalAmount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500 max-w-[200px] truncate" title={sale.shippingAddress}>
                    {sale.shippingAddress || '-'}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400 italic truncate max-w-[150px]" title={sale.memo}>
                    {sale.memo || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(sale)}
                        className="p-1.5 text-slate-300 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100"
                        title="수정"
                      >
                        <Edit2 size={14} />
                        <div className="sr-only">수정</div>
                        <span className="text-[10px] font-black uppercase ml-1">Edit</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(sale.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                        <ShoppingBag size={24} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">등록된 주문 내역이 없습니다</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Order Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <ModalWrapper
            isOpen={isModalOpen}
            onClose={handleResetForm}
            title={isEditing ? "주문 정보 수정" : "신규 낱개 주문 등록"}
            icon={isEditing ? <Edit2 size={18} /> : <Plus size={18} />}
            headerColor={isEditing ? "bg-indigo-600" : "bg-accent"}
            width="max-w-2xl"
          >
            <form onSubmit={handlePreSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">주문 날짜 *</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      required
                      type="date" 
                      value={formData.orderDate}
                      onChange={e => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">주문자 *</label>
                  <input 
                    required
                    type="text" 
                    value={formData.orderer}
                    onChange={e => setFormData(prev => ({ ...prev, orderer: e.target.value }))}
                    placeholder="성함 또는 업체명"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">연락처</label>
                  <input 
                    type="text" 
                    value={formData.contact}
                    onChange={e => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                    placeholder="010-0000-0000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">연관 보호소 (선택)</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select 
                      value={formData.shelterId}
                      onChange={e => setFormData(prev => ({ ...prev, shelterId: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/10 appearance-none"
                    >
                      <option value="">연관 보호소 없음</option>
                      {shelters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">제품 선택 *</label>
                  <div className="relative">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      required
                      type="text" 
                      value={productSearch}
                      onFocus={() => setIsProductDropdownOpen(true)}
                      onChange={e => {
                        setProductSearch(e.target.value);
                        setIsProductDropdownOpen(true);
                      }}
                      placeholder="제품명 검색..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                    />
                    
                    <AnimatePresence>
                      {isProductDropdownOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar"
                        >
                          {filteredProducts.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleProductSelect(p)}
                              className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group border-b border-slate-50 last:border-0"
                            >
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-700">
                                  <span className="text-emerald-500 mr-2 text-[10px] uppercase">[{p.category}]</span>
                                  {p.name}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 font-mono">{p.standard} · ₩{p.sellingPrice.toLocaleString()}</span>
                              </div>
                              <Plus size={14} className="text-slate-200 group-hover:text-emerald-400" />
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {isProductDropdownOpen && (
                    <div className="fixed inset-0 z-40" onClick={() => setIsProductDropdownOpen(false)} />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">수량 *</label>
                    <input 
                      required
                      type="number" 
                      min="1"
                      value={formData.quantity}
                      onChange={e => handleQuantityChange(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">총 결제금액</label>
                    <div className="w-full px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm font-black text-emerald-700 font-mono">
                      ₩{formData.totalAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">연관 보호소 (선택)</label>
                <select 
                  value={formData.shelterId}
                  onChange={e => setFormData(prev => ({ ...prev, shelterId: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/10"
                >
                  <option value="">연관 보호소 없음</option>
                  {shelters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">받는곳 (배송지)</label>
                <input 
                  type="text" 
                  value={formData.shippingAddress}
                  onChange={e => setFormData(prev => ({ ...prev, shippingAddress: e.target.value }))}
                  placeholder="상세 주소를 입력하세요"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">기타사항 (메모)</label>
                <textarea 
                  value={formData.memo}
                  onChange={e => setFormData(prev => ({ ...prev, memo: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all resize-none h-20"
                  placeholder="특이사항이나 주문 요청 내용을 기록하세요"
                />
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-2">
                <button 
                  type="button"
                  onClick={handleResetForm}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 font-black text-xs rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  disabled={isProcessing}
                  className="flex-2 bg-[#2D336B] text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  {isProcessing ? '저장 중...' : (isEditing ? '수정 내용 저장 완료' : '신규 주문 등록 완료')}
                </button>
              </div>
            </form>
          </ModalWrapper>
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
              onClick={() => setIsConfirmModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-white/20 w-full max-w-sm overflow-hidden relative z-10"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">{isEditing ? '주문 데이터 수정 확정' : '주문 데이터 확정'}</h3>
                <p className="text-[11px] text-slate-500 font-bold mt-2 leading-relaxed">
                  아래 내용으로 낱개 주문을 {isEditing ? '수정' : '확정'}하시겠습니까?<br />
                  {isEditing ? '수정 완료' : '등록'} 버튼을 누르면 DB에 기록됩니다.
                </p>

                <div className="mt-8 bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">주문 날짜</span>
                    <span className="text-xs font-black text-slate-800">{formData.orderDate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">주문자</span>
                    <span className="text-xs font-black text-slate-800">{formData.orderer}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">품목</span>
                    <span className="text-xs font-black text-slate-800">{formData.productName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">수량</span>
                    <span className="text-xs font-black text-slate-800">{formData.quantity}EA</span>
                  </div>
                   <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">최종 결제액</span>
                    <span className="text-sm font-black text-emerald-700">
                      ₩{formData.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button 
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="flex-1 py-4 rounded-xl border border-slate-200 text-xs font-black text-slate-400 hover:bg-white hover:text-slate-600 transition-all uppercase tracking-widest"
                >
                  돌아가기
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="flex-2 bg-[#2D336B] text-white py-4 rounded-xl text-xs font-black shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  {isProcessing ? '처리 중...' : '최종 등록 완료'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IndividualSalesView;
