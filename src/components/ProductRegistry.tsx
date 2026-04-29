import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  TrendingUp, 
  TrendingDown,
  Info,
  Trash2,
  Edit2,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Product } from '../mockData';
import { useFirestore } from '../FirestoreContext';
import * as XLSX from 'xlsx';

interface AddProductFormData {
  name: string;
  category: Product['category'];
  standard: string;
  unit: string;
  purchasePrice: string;
  isPurchaseVatIncl: boolean;
  sellingPrice: string;
  isSalesVatIncl: boolean;
  remarks: string;
}

const ProductRegistry = () => {
  const { products, addDocument, updateDocument, deleteDocument, deleteDocuments } = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('전체');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [formData, setFormData] = useState<AddProductFormData>({
    name: '',
    category: '건식',
    standard: '',
    unit: '포',
    purchasePrice: '',
    isPurchaseVatIncl: true,
    sellingPrice: '',
    isSalesVatIncl: true,
    remarks: ''
  });

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const categories: Product['category'][] = ['건식', '습식', '간식', '용품', '기타'];

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === '전체' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProductId(product.id);
      setFormData({
        name: product.name,
        category: product.category,
        standard: product.standard,
        unit: product.unit,
        purchasePrice: String(product.purchasePrice),
        isPurchaseVatIncl: product.isPurchaseVatIncl ?? true,
        sellingPrice: String(product.sellingPrice),
        isSalesVatIncl: product.isSalesVatIncl ?? true,
        remarks: product.remarks || ''
      });
    } else {
      setEditingProductId(null);
      setFormData({
        name: '',
        category: '건식',
        standard: '',
        unit: '포',
        purchasePrice: '',
        isPurchaseVatIncl: true,
        sellingPrice: '',
        isSalesVatIncl: true,
        remarks: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleAddOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.purchasePrice || !formData.sellingPrice) {
      showToast('필수 사항을 입력해주세요.', 'error');
      return;
    }

    try {
      if (editingProductId) {
        // Update existing
        await updateDocument('products', editingProductId, {
          name: formData.name,
          category: formData.category,
          standard: formData.standard,
          unit: formData.unit,
          purchasePrice: parseInt(formData.purchasePrice),
          isPurchaseVatIncl: formData.isPurchaseVatIncl,
          sellingPrice: parseInt(formData.sellingPrice),
          isSalesVatIncl: formData.isSalesVatIncl,
          remarks: formData.remarks
        });
        showToast('상품 정보가 수정되었습니다.');
      } else {
        // Add new
        const id = `PRD-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        const nextNo = products.length > 0 ? Math.max(...products.map(p => p.no)) + 1 : 1;
        await addDocument('products', {
          id,
          no: nextNo,
          name: formData.name,
          category: formData.category,
          standard: formData.standard,
          unit: formData.unit,
          purchasePrice: parseInt(formData.purchasePrice),
          isPurchaseVatIncl: formData.isPurchaseVatIncl,
          sellingPrice: parseInt(formData.sellingPrice),
          isSalesVatIncl: formData.isSalesVatIncl,
          remarks: formData.remarks
        });
        showToast('새로운 상품이 등록되었습니다.');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      showToast('상품 저장 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleDeleteSelected = async () => {
    if (window.confirm(`선택한 ${selectedProductIds.size}개의 상품을 정말 삭제하시겠습니까?`)) {
      try {
        await deleteDocuments('products', Array.from(selectedProductIds));
        setSelectedProductIds(new Set());
        showToast('선택한 상품들이 삭제되었습니다.');
      } catch (error) {
        console.error(error);
        showToast('삭제 중 오류가 발생했습니다.', 'error');
      }
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.size === filteredProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleExport = () => {
    const dataToExport = filteredProducts.map(p => {
      const { margin, marginRate } = calculateMargin(p.sellingPrice, p.purchasePrice);
      return {
        'No.': p.no,
        '상품코드': p.id,
        '상품명': p.name,
        '카테고리': p.category,
        '규격': p.standard,
        '단위': p.unit,
        '매입단가': p.purchasePrice,
        '판매단가': p.sellingPrice,
        '수익(Margin)': margin,
        '마진율(%)': marginRate.toFixed(1) + '%',
        '비고': p.remarks || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    
    // Save as XLSX
    XLSX.writeFile(workbook, `Master_Product_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('엑셀 파일이 성공적으로 다운로드되었습니다.');
  };

  const calculateMargin = (selling: number, purchase: number) => {
    const margin = selling - purchase;
    const marginRate = purchase > 0 ? (margin / selling) * 100 : 0;
    return { margin, marginRate };
  };

  return (
    <div className="flex flex-col gap-6 h-full p-6 bg-slate-50/50">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border",
              toast.type === 'success' 
                ? "bg-emerald-500/90 border-emerald-400 text-white" 
                : "bg-rose-500/90 border-rose-400 text-white"
            )}
          >
            {toast.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            <span className="font-bold">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-4 opacity-70 hover:opacity-100 transition-opacity">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Package className="text-[#2D336B]" />
            기초 정보 관리 <span className="text-slate-300 mx-2">|</span> 
            <span className="text-[#2D336B]">상품 등록 센터</span>
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">사료 및 용품의 표준 데이터를 체계적으로 관리합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={18} /> 엑셀 내보내기
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2D336B] text-white rounded-xl font-bold shadow-lg shadow-[#2D336B]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={18} /> 상품 추가하기
          </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">총 등록 상품</p>
          <p className="text-xl font-black text-slate-800">{products.length} <span className="text-xs font-medium text-slate-400">SKUs</span></p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">평균 마진율</p>
          <p className="text-xl font-black text-emerald-500">
            {(products.reduce((acc, p) => acc + calculateMargin(p.sellingPrice, p.purchasePrice).marginRate, 0) / products.length).toFixed(1)}%
          </p>
        </div>
        {/* placeholders for more stats */}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-2 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2D336B] transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="상품명으로 검색하세요..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2D336B]/10 transition-all outline-none"
          />
        </div>
        <div className="flex gap-1 p-1 bg-slate-50 rounded-xl overflow-x-auto max-w-full">
          {['전체', ...categories].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                categoryFilter === cat 
                  ? "bg-white text-[#2D336B] shadow-sm ring-1 ring-slate-200" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedProductIds.size > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#2D336B] text-white p-4 rounded-2xl flex items-center justify-between shadow-xl shadow-[#2D336B]/20">
              <div className="flex items-center gap-4">
                <span className="text-sm font-black tracking-tight">{selectedProductIds.size}개의 항목 선택됨</span>
                <div className="w-px h-4 bg-white/20"></div>
                <button 
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-2 text-xs font-bold hover:text-rose-300 transition-colors"
                >
                  <Trash2 size={16} /> 선택 삭제
                </button>
              </div>
              <button 
                onClick={() => setSelectedProductIds(new Set())}
                className="text-xs font-bold opacity-60 hover:opacity-100 transition-opacity"
              >
                선택 해제
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Container */}
      <div className="flex-1 overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col relative">
        <div className="overflow-x-auto overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-[#2D336B] focus:ring-[#2D336B] cursor-pointer" 
                    checked={selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 w-16">No.</th>
                <th className="px-6 py-4">상품명</th>
                <th className="px-6 py-4">카테고리</th>
                <th className="px-6 py-4">규격/단위</th>
                <th className="px-6 py-4 text-right">매입가 (₩)</th>
                <th className="px-6 py-4 text-right">판매가 (₩)</th>
                <th className="px-6 py-4 text-center">수익 분석</th>
                <th className="px-6 py-4">비고</th>
                <th className="px-6 py-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.map((product) => {
                const { margin, marginRate } = calculateMargin(product.sellingPrice, product.purchasePrice);
                const isSelected = selectedProductIds.has(product.id);
                
                return (
                  <tr 
                    key={product.id} 
                    className={cn(
                      "hover:bg-slate-50/30 transition-colors text-[11px] group",
                      isSelected ? "bg-indigo-50/50" : ""
                    )}
                  >
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-[#2D336B] focus:ring-[#2D336B] cursor-pointer"
                        checked={isSelected}
                        onChange={() => toggleSelectProduct(product.id)}
                      />
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300 group-hover:text-slate-600">{String(product.no).padStart(2, '0')}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{product.name}</div>
                      <div className="text-[9px] text-slate-400 font-medium tracking-tight mt-0.5">{product.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded text-[9px] font-bold tracking-tight",
                        product.category === '건식' ? "bg-amber-50 text-amber-600" :
                        product.category === '습식' ? "bg-cyan-50 text-cyan-600" :
                        product.category === '간식' ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-500"
                      )}>
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-600">{product.standard} / {product.unit}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-500 font-bold">{product.purchasePrice.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono text-[#2D336B] font-black">{product.sellingPrice.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <div className={cn(
                          "flex items-center gap-1 font-black",
                          marginRate > 30 ? "text-emerald-500" : marginRate > 15 ? "text-amber-500" : "text-rose-500"
                        )}>
                          {marginRate > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {marginRate.toFixed(1)}%
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium">+{margin.toLocaleString()}₩</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 italic max-w-[200px] truncate">{product.remarks || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity min-h-[32px]">
                        <button 
                          onClick={() => handleOpenModal(product)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#2D336B] transition-all"
                          title="상세보기"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <Package size={48} className="opacity-20 mb-4" />
              <p className="font-bold">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* Registration / Modification Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[#2D336B]/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 bg-[#2D336B] text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Package size={20} />
                  <h3 className="text-lg font-black tracking-tight">
                    {editingProductId ? '상품 정보 수정' : '신규 기초 상품 등록'}
                  </h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="opacity-60 hover:opacity-100 transition-opacity">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddOrUpdateProduct} className="p-8 space-y-5 overflow-y-auto max-h-[85vh] custom-scrollbar">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">상품명 *</label>
                  <input 
                    type="text" 
                    placeholder="상품명을 입력하세요 (예: 넥스트 펫밸런스 어덜트...)"
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#234] transition-all outline-none"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">카테고리</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#234] outline-none"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value as any})}
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">규격 (예: 10kg, 500ml)</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#234] outline-none"
                      value={formData.standard}
                      onChange={e => setFormData({...formData, standard: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">단위 (포, 개, 박스)</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#234] outline-none"
                      value={formData.unit}
                      onChange={e => setFormData({...formData, unit: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between pl-1 border-b border-rose-100 pb-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">매입 단가 (₩) *</label>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, isPurchaseVatIncl: !formData.isPurchaseVatIncl})}
                        className="flex items-center gap-1.5 group select-none"
                      >
                        <div className={cn(
                          "w-7 h-4 rounded-full relative transition-all duration-300",
                          formData.isPurchaseVatIncl ? "bg-indigo-500" : "bg-slate-300"
                        )}>
                          <div className={cn(
                            "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300",
                            formData.isPurchaseVatIncl ? "left-3.5" : "left-0.5"
                          )} />
                        </div>
                        <span className={cn(
                          "text-[9px] font-black tracking-tight transition-colors",
                          formData.isPurchaseVatIncl ? "text-indigo-600" : "text-slate-400"
                        )}>VAT 포함</span>
                      </button>
                    </div>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 bg-rose-50/30 border-none rounded-xl text-sm font-black text-rose-600 focus:ring-2 focus:ring-rose-200 outline-none"
                      value={formData.purchasePrice}
                      onChange={e => setFormData({...formData, purchasePrice: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pl-1 border-b border-indigo-100 pb-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">판매/공급 단가 (₩) *</label>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, isSalesVatIncl: !formData.isSalesVatIncl})}
                      className="flex items-center gap-1.5 group select-none"
                    >
                      <div className={cn(
                        "w-7 h-4 rounded-full relative transition-all duration-300",
                        formData.isSalesVatIncl ? "bg-indigo-500" : "bg-slate-300"
                      )}>
                        <div className={cn(
                          "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300",
                          formData.isSalesVatIncl ? "left-3.5" : "left-0.5"
                        )} />
                      </div>
                      <span className={cn(
                        "text-[9px] font-black tracking-tight transition-colors",
                        formData.isSalesVatIncl ? "text-indigo-600" : "text-slate-400"
                      )}>VAT 포함</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 bg-indigo-50/30 border-none rounded-xl text-sm font-black text-indigo-700 focus:ring-2 focus:ring-indigo-200 outline-none"
                      value={formData.sellingPrice}
                      onChange={e => setFormData({...formData, sellingPrice: e.target.value})}
                    />
                    {formData.purchasePrice && formData.sellingPrice && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                        MARG. {calculateMargin(parseInt(formData.sellingPrice), parseInt(formData.purchasePrice)).marginRate.toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">비고 (상품 특징 등)</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#234] outline-none h-20 resize-none"
                    value={formData.remarks}
                    onChange={e => setFormData({...formData, remarks: e.target.value})}
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                  <Info size={16} className="text-[#2D336B] mt-0.5 shrink-0" />
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                    등록된 정보는 출고 관리 및 보호소 매출 정산 시 사료 선택 리스트로 활용됩니다. 선택하신 VAT 포함 여부에 따라 최종 마진율이 계산됩니다. 원가 정보는 보안이 유지됩니다.
                  </p>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-[#2D336B] text-white font-black rounded-2xl shadow-xl shadow-[#2D336B]/20 hover:scale-[1.01] active:scale-[0.99] transition-all mt-4"
                >
                  {editingProductId ? '수정 내용 저장하기' : '기초 데이터 등록 완료'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductRegistry;
