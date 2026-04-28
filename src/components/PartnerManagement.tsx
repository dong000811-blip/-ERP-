
import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building2,
  User,
  MapPin,
  Phone,
  Hash,
  Mail,
  Calendar,
  CreditCard,
  Briefcase,
  AlertCircle,
  X,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { PARTNER_MASTER_DATA, Partner, PartnerType, Specialty } from '../partnerMasterData';

const Card = ({ children, className, ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) => (
  <div {...props} className={cn("bg-white rounded-2xl p-5 shadow-sm border border-slate-100", className)}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'slate' }: { children: React.ReactNode, variant?: 'slate' | 'indigo' | 'emerald' | 'amber' | 'rose' }) => {
  const variants = {
    slate: "bg-slate-50 text-slate-500 border-slate-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100"
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-black uppercase border tracking-tight", variants[variant])}>
      {children}
    </span>
  );
};

export default function PartnerManagement() {
  const [partners, setPartners] = useState<Partner[]>(PARTNER_MASTER_DATA);
  const [activePartner, setActivePartner] = useState<Partner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<'All' | PartnerType>('All');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      const matchType = typeFilter === 'All' || p.type === typeFilter;
      const matchSpecialty = specialtyFilter === 'All' || p.specialties.includes(specialtyFilter as Specialty);
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.resourcesMemo.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSpecialty && matchSearch;
    });
  }, [partners, typeFilter, specialtyFilter, searchQuery]);

  // Form State
  const initialFormState: Partial<Partner> = {
    type: 'Individual',
    name: '',
    specialties: [],
    region: '서울',
    contact: '',
    status: 'Active',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    resourcesMemo: '',
    organizationType: '기업',
  };

  const organizationTypes = ['기업', '봉사단체', '비영리단체', '지자체', '기타'];

  const [formData, setFormData] = useState<Partial<Partner>>(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [selectedPartnerIds, setSelectedPartnerIds] = useState<Set<string>>(new Set());
  
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name) errors.name = '이름/기업명을 입력해주세요.';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingPartner) {
      setPartners(prev => prev.map(p => p.id === editingPartner.id ? { ...p, ...formData } as Partner : p));
    } else {
      const newPartner: Partner = {
        ...formData,
        id: `PRT-${Date.now().toString().slice(-3)}`,
        createdAt: new Date().toISOString().split('T')[0],
      } as Partner;
      setPartners(prev => [...prev, newPartner]);
    }
    
    setIsModalOpen(false);
    setEditingPartner(null);
    setFormData(initialFormState);
  };

  const handleDelete = (id: string) => {
    setPartners(prev => prev.filter(p => p.id !== id));
    if (activePartner?.id === id) setActivePartner(null);
    setSelectedPartnerIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`선택한 ${selectedPartnerIds.size}개의 파트너 정보를 삭제하시겠습니까?`)) {
      setPartners(prev => prev.filter(p => !selectedPartnerIds.has(p.id)));
      setSelectedPartnerIds(new Set());
      if (activePartner && selectedPartnerIds.has(activePartner.id)) setActivePartner(null);
    }
  };

  const toggleSelectPartner = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPartnerIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPartnerIds.size === filteredPartners.length) {
      setSelectedPartnerIds(new Set());
    } else {
      setSelectedPartnerIds(new Set(filteredPartners.map(p => p.id)));
    }
  };

  const specialties: Specialty[] = ['물류 지원', '수의학', '훈련·행동', '홍보', '봉사', '기타'];
  const regions = ['전국', '서울', '경기', '인천', '충청', '강원', '전라', '경상', '제주'];

  return (
    <div className="flex gap-6 h-full p-1 overflow-hidden">
      {/* List Section */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-end shrink-0">
          <div>
             <div className="flex items-center gap-2 mb-1">
                <Users className="text-indigo-500" size={24} />
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">파트너 관리</h2>
             </div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Partner Master Database</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedPartnerIds.size > 0 && (
              <button 
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-6 py-3.5 bg-rose-50 text-rose-600 rounded-2xl text-xs font-black border border-rose-100 transition-all hover:bg-rose-100"
              >
                <Trash2 size={18} /> 선택 삭제 ({selectedPartnerIds.size})
              </button>
            )}
            <button 
              onClick={() => {
                setEditingPartner(null);
                setFormData(initialFormState);
                setFormErrors({});
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
            >
              <Plus size={18} /> 신규 파트너 등록
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="파트너명, 자원 메모 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-none transition-all shadow-sm"
            />
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">유형:</span>
            <div className="flex gap-1">
              {['All', 'Individual', 'Corporate'].map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type as any)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all",
                    typeFilter === type 
                      ? "bg-indigo-50 text-indigo-600 font-black" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {type === 'All' ? '전체' : type === 'Individual' ? '개인' : '기업'}
                </button>
              ))}
            </div>
          </div>

          <select 
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none shadow-sm focus:border-indigo-500/30"
          >
             <option value="All">전체 분야</option>
             {specialties.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Table/List */}
        <div className="flex-1 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse min-w-[900px] table-auto">
              <thead className="bg-slate-50/50 sticky top-0 z-10">
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-5 w-[40px]">
                    <button 
                      onClick={toggleSelectAll}
                      className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center transition-all",
                        selectedPartnerIds.size === filteredPartners.length && filteredPartners.length > 0
                          ? "bg-indigo-600 border-indigo-600 text-white" 
                          : "bg-white border-slate-300 text-transparent"
                      )}
                    >
                      <CheckCircle2 size={12} />
                    </button>
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[10%] whitespace-nowrap">분류</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[25%] whitespace-nowrap">파트너명</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[20%] whitespace-nowrap">전문 분야</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[15%] whitespace-nowrap">활동 지역</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[15%] whitespace-nowrap">연락처</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[8%] whitespace-nowrap text-center">상태</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-[7%] whitespace-nowrap text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPartners.map(partner => (
                  <tr 
                    key={partner.id} 
                    onClick={() => setActivePartner(partner)}
                    className={cn(
                      "hover:bg-slate-50/50 group transition-all cursor-pointer",
                      activePartner?.id === partner.id ? "bg-indigo-50/30" : ""
                    )}
                  >
                    <td className="px-6 py-5">
                      <button 
                        onClick={(e) => toggleSelectPartner(partner.id, e)}
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-all",
                          selectedPartnerIds.has(partner.id)
                            ? "bg-indigo-600 border-indigo-600 text-white" 
                            : "bg-white border-slate-200 text-transparent hover:border-indigo-300"
                        )}
                      >
                        <CheckCircle2 size={12} />
                      </button>
                    </td>
                    <td className="px-6 py-5 align-middle whitespace-nowrap">
                      {partner.type === 'Corporate' ? (
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                              <Building2 size={14} />
                           </div>
                           <Badge variant="indigo">기업</Badge>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                              <User size={14} />
                           </div>
                           <Badge variant="slate">개인</Badge>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 align-middle whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800 tracking-tight">{partner.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">{partner.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {partner.specialties.map(s => (
                          <span key={s} className="px-1.5 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-black rounded border border-slate-100">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1 text-slate-400">
                        <MapPin size={12} />
                        <span className="text-xs font-bold">{partner.region}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle whitespace-nowrap">
                      <span className="text-xs font-bold text-slate-500 font-mono">{partner.contact}</span>
                    </td>
                    <td className="px-6 py-5 align-middle text-center whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        <span className="text-[10px] font-black text-slate-400 uppercase">정상</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle text-center whitespace-nowrap">
                       <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPartner(partner);
                              setFormData(partner);
                              setFormErrors({});
                              setIsModalOpen(true);
                            }}
                            className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 border border-transparent hover:border-indigo-100 transition-all shadow-sm"
                            title="상세보기"
                          >
                            <ChevronRight size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPartners.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300 gap-4">
                <Users size={64} strokeWidth={1} />
                <p className="text-sm font-bold italic tracking-tight">등록된 파트너가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Side Detail Section */}
      <div className="w-[20rem] h-full flex flex-col gap-6 shrink-0">
        <AnimatePresence mode="wait">
          {activePartner ? (
            <motion.div
              key={activePartner.id}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="flex-1 flex flex-col gap-6"
            >
              <Card className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col items-center text-center gap-3">
                   <div className={cn(
                     "w-20 h-20 rounded-[2.5rem] flex items-center justify-center shadow-lg transition-all",
                     activePartner.type === 'Corporate' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                   )}>
                      {activePartner.type === 'Corporate' ? <Building2 size={32} /> : <User size={32} />}
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">{activePartner.name}</h3>
                      <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">{activePartner.type}</p>
                   </div>
                </div>

                <div className="space-y-6">
                  {/* Status */}
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">파트너 현재 상태</p>
                      <div className="flex items-center gap-1.5 text-emerald-500 font-black text-xs">
                        <CheckCircle2 size={12} /> 활성 정보
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                       <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                          <MapPin size={16} />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">활동 주요 지역</span>
                          <span className="text-xs font-black text-slate-700">{activePartner.region}</span>
                       </div>
                    </div>

                    <div className="flex items-start gap-4">
                       <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                          <Phone size={16} />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">연락처</span>
                          <span className="text-xs font-black text-slate-700 font-mono">{activePartner.contact}</span>
                       </div>
                    </div>

                    {activePartner.type === 'Corporate' && (
                      <div className="flex items-start gap-4">
                         <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                            <Hash size={16} />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">사업자 번호</span>
                            <span className="text-xs font-black text-slate-700 font-mono">{activePartner.businessNumber}</span>
                         </div>
                      </div>
                    )}
                  </div>

                  {/* Resources Memo */}
                  <div className="bg-indigo-50/50 border border-indigo-100/50 p-4 rounded-2xl">
                     <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                       <Briefcase size={12} /> 보유 자원 및 활동 메모
                     </p>
                     <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                       "{activePartner.resourcesMemo}"
                     </p>
                  </div>

                  {/* Project Activity Placeholder */}
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                    <AlertCircle className="text-amber-500 shrink-0" size={16} />
                    <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
                      파트너 활동 내역 및 연계 프로젝트 데이터는<br />시스템 개발 진행 중입니다.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : (
            <Card className="flex-1 flex flex-col items-center justify-center text-center p-8 border-dashed bg-slate-50/50">
               <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-slate-200 shadow-sm mb-4">
                  <ShieldCheck size={32} />
               </div>
               <h4 className="text-sm font-black text-slate-400 tracking-tight mb-2">파트너 상세 정보</h4>
               <p className="text-xs font-bold text-slate-300 leading-relaxed italic">리스트에서 파트너를 선택하여<br />상세 활동 및 자원을 확인하세요.</p>
            </Card>
          )}
        </AnimatePresence>
      </div>

      {/* Registration/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsModalOpen(false)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
            >
              <div className="p-8 bg-[#2D336B] text-white shrink-0">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner">
                      <Plus className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight">{editingPartner ? '파트너 정보 수정' : '신규 파트너 등록'}</h3>
                      <p className="text-[10px] text-white/50 font-bold uppercase tracking-[0.2em] mt-0.5">Master Data Registration</p>
                    </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Partner Type Selector */}
                <div className="flex p-1.5 bg-white/10 rounded-2xl backdrop-blur-md">
                   <button 
                     type="button"
                     onClick={() => setFormData({...formData, type: 'Individual'})}
                     className={cn(
                       "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all",
                       formData.type === 'Individual' ? "bg-white text-[#2D336B] shadow-lg" : "text-white/60 hover:text-white"
                     )}
                   >
                     <User size={16} /> 개인 파트너
                   </button>
                   <button 
                     type="button"
                     onClick={() => setFormData({...formData, type: 'Corporate'})}
                     className={cn(
                       "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all",
                       formData.type === 'Corporate' ? "bg-white text-[#2D336B] shadow-lg" : "text-white/60 hover:text-white"
                     )}
                   >
                     <Building2 size={16} /> 기업·단체 파트너
                   </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar p-8">
                <form id="partner-form" onSubmit={handleSave} className="space-y-8">
                  {/* Basic Info Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                       <ShieldCheck className="text-indigo-500" size={16} />
                       <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">기본 식별 정보</h4>
                    </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                            {formData.type === 'Individual' ? '이름' : '법인/단체명'} <span className="text-rose-500">*</span>
                          </label>
                          <input 
                            type="text" 
                            required
                            value={formData.name || ''}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            placeholder={formData.type === 'Individual' ? '홍길동' : '(주)넥스트 로지스틱스'}
                            className={cn(
                              "w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-none transition-all",
                              formData.name ? "bg-white" : ""
                            )}
                          />
                        </div>

                        {formData.type === 'Individual' ? (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">생년월일</label>
                            <input 
                              type="date" 
                              value={formData.birthDate || ''}
                              onChange={e => setFormData({...formData, birthDate: e.target.value})}
                              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-none transition-all"
                            />
                          </div>
                        ) : (
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">단체 유형</label>
                              <select 
                                value={formData.organizationType}
                                onChange={e => setFormData({...formData, organizationType: e.target.value})}
                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-none transition-all"
                              >
                                {organizationTypes.map(type => <option key={type} value={type}>{type}</option>)}
                              </select>
                           </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                            {formData.type === 'Individual' ? '연락처' : '대표 연락처'}
                          </label>
                          <input 
                            type="tel" 
                            value={formData.contact || ''}
                            onChange={e => setFormData({...formData, contact: e.target.value})}
                            placeholder="010-0000-0000"
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-none transition-all font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">활동 주요 지역</label>
                          <select 
                            value={formData.region}
                            onChange={e => setFormData({...formData, region: e.target.value})}
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-none transition-all"
                          >
                            {regions.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                      </div>

                      {formData.type === 'Corporate' && (
                         <>
                         <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">사업자 등록 번호</label>
                               <input 
                                 type="text" 
                                 value={formData.businessNumber || ''}
                                 onChange={e => setFormData({...formData, businessNumber: e.target.value})}
                                 placeholder="000-00-00000"
                                 className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-none transition-all font-mono"
                               />
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">계산서 발행용 이메일</label>
                               <div className="relative">
                                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                 <input 
                                   type="email" 
                                   value={formData.billingEmail || ''}
                                   onChange={e => setFormData({...formData, billingEmail: e.target.value})}
                                   placeholder="billing@company.com"
                                   className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-none transition-all font-mono"
                                 />
                               </div>
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">담당자 성함 및 직급</label>
                              <input 
                                type="text" 
                                value={formData.managerName || ''}
                                onChange={e => setFormData({...formData, managerName: e.target.value})}
                                placeholder="홍길동 팀장"
                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-none transition-all font-mono"
                              />
                            </div>
                         </div>
                         </>
                      )}
                  </div>

                  {/* Expertise Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                       <Briefcase className="text-indigo-500" size={16} />
                       <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">전문 분야 및 보유 자원</h4>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">전문 분야 (중복 선택 가능)</label>
                       <div className="flex flex-wrap gap-2">
                          {specialties.map(s => {
                            const isSelected = formData.specialties?.includes(s);
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() => {
                                  const currentSlots = formData.specialties || [];
                                  if (isSelected) {
                                    setFormData({...formData, specialties: currentSlots.filter(x => x !== s)});
                                  } else {
                                    setFormData({...formData, specialties: [...currentSlots, s]});
                                  }
                                }}
                                className={cn(
                                  "px-4 py-2.5 rounded-xl text-xs font-black transition-all border",
                                  isSelected 
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100" 
                                    : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                                )}
                              >
                                {s}
                              </button>
                            );
                          })}
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">보유 자원 및 활동 메모</label>
                       <textarea 
                         value={formData.resourcesMemo || ''}
                         onChange={e => setFormData({...formData, resourcesMemo: e.target.value})}
                         placeholder={formData.type === 'Individual' ? '예: 승용차 보유, 주말 활동 가능' : '예: 1톤 탑차 2대 보유, 창고 50평'}
                         className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-none transition-all h-24 resize-none"
                       />
                    </div>
                  </div>

                  {/* Settlement Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                       <CreditCard className="text-indigo-500" size={16} />
                       <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">정산 / 계좌 정보</h4>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">은행명</label>
                          <input 
                            type="text" 
                            value={formData.bankName || ''}
                            onChange={e => setFormData({...formData, bankName: e.target.value})}
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
                          />
                       </div>
                       <div className="col-span-2 space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">계좌번호 및 예금주</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={formData.accountNumber || ''}
                              onChange={e => setFormData({...formData, accountNumber: e.target.value})}
                              placeholder="000-000000-00-000"
                              className="flex-1 px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none font-mono"
                            />
                            <input 
                              type="text" 
                              value={formData.accountHolder || ''}
                              onChange={e => setFormData({...formData, accountHolder: e.target.value})}
                              placeholder="예금주"
                              className="w-24 px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
                            />
                          </div>
                       </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormData(initialFormState);
                    setEditingPartner(null);
                  }}
                  className="px-6 py-3.5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  취소
                </button>
                <button 
                  form="partner-form"
                  type="submit"
                  disabled={!formData.name}
                  className={cn(
                    "px-8 py-3.5 rounded-2xl text-xs font-black shadow-lg transition-all active:scale-[0.98] flex items-center gap-2",
                    formData.name 
                      ? "bg-[#2D336B] hover:bg-[#1E234A] text-white shadow-indigo-900/10" 
                      : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  )}
                >
                  {editingPartner ? '저장하기' : '파트너 등록 완료'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
