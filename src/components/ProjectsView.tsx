import React, { useState, useMemo, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Edit2, 
  X, 
  Trash2,
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Users,
  MoreVertical,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Coins,
  BarChart3,
  Package,
  Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { PROJECT_DATA, Project, ProjectPerformance } from '../projectData';
import { MOCK_SHELTERS } from '../mockData';
import { MASTER_PRODUCT_DATA } from '../masterProductData';
import { PARTNER_MASTER_DATA } from '../partnerMasterData';

interface ProjectFormData {
  projectName: string;
  shelterId: string;
  startDate: string;
  endDate: string;
  description: string;
  status: Project['status'];
  type: Project['type'];
  partnerIds: string[];
}

interface ProjectsViewProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ projects, setProjects }) => {
  const [shelterFilter, setShelterFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPerfModalOpen, setIsPerfModalOpen] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [perfProjectId, setPerfProjectId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    projectName: '',
    shelterId: '',
    startDate: '',
    endDate: '',
    description: '',
    status: 'Upcoming',
    type: 'event',
    partnerIds: []
  });

  const [partnerSearch, setPartnerSearch] = useState('');
  const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);

  const [perfFormData, setPerfFormData] = useState<ProjectPerformance>({
    productId: '',
    productName: '',
    quantity: 0,
    sellingPrice: 0,
    purchasePrice: 0,
    commission: 0,
    shippingFee: 0,
    vat: 0
  });

  useEffect(() => {
    if (isPerfModalOpen) {
      const revenue = perfFormData.quantity * perfFormData.sellingPrice;
      const purchaseCost = perfFormData.quantity * perfFormData.purchasePrice;
      const calculatedVat = Math.max(0, Math.floor((revenue - purchaseCost) * 0.1));
      setPerfFormData(prev => ({
        ...prev,
        vat: calculatedVat
      }));
    }
  }, [perfFormData.quantity, perfFormData.sellingPrice, perfFormData.purchasePrice, isPerfModalOpen]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const activeProjectsCount = projects.filter(p => p.status === 'Ongoing').length;
  const upcomingProjectsCount = projects.filter(p => p.status === 'Upcoming').length;
  const completedProjectsCount = projects.filter(p => p.status === 'Completed').length;

  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => {
        const matchesShelter = shelterFilter === 'all' || p.shelterId === shelterFilter;
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesShelter && matchesStatus;
      })
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [projects, shelterFilter, statusFilter]);

  const filteredPartners = useMemo(() => {
    return PARTNER_MASTER_DATA.filter(p => 
      p.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
      p.id.toLowerCase().includes(partnerSearch.toLowerCase()) ||
      p.type.toLowerCase().includes(partnerSearch.toLowerCase())
    );
  }, [partnerSearch]);

  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingProjectId(project.id);
      setFormData({
        projectName: project.projectName,
        shelterId: project.shelterId,
        startDate: project.startDate,
        endDate: project.endDate,
        description: project.description,
        status: project.status,
        type: project.type,
        partnerIds: project.partnerIds || []
      });
    } else {
      setEditingProjectId(null);
      setFormData({
        projectName: '',
        shelterId: '',
        startDate: '',
        endDate: '',
        description: '',
        status: 'Upcoming',
        type: 'event',
        partnerIds: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectName || !formData.shelterId || !formData.startDate || !formData.endDate) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    const shelterName = MOCK_SHELTERS.find(s => s.id === formData.shelterId)?.name || 'Unknown';

    if (editingProjectId) {
      setProjects(prev => prev.map(p => {
        if (p.id === editingProjectId) {
          return {
            ...p,
            projectName: formData.projectName,
            shelterId: formData.shelterId,
            shelterName: shelterName,
            startDate: formData.startDate,
            endDate: formData.endDate,
            description: formData.description,
            status: formData.status,
            type: formData.type,
            partnerIds: formData.partnerIds
          };
        }
        return p;
      }));
      showToast('프로젝트 정보가 수정되었습니다.');
    } else {
      const newProject: Project = {
        id: `PRJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        projectName: formData.projectName,
        shelterId: formData.shelterId,
        shelterName: shelterName,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        description: formData.description,
        type: formData.type,
        partnerIds: formData.partnerIds
      };
      setProjects(prev => [newProject, ...prev]);
      showToast('새 프로젝트가 등록되었습니다.');
    }

    setIsModalOpen(false);
  };

  const handleOpenPerfModal = (project: Project) => {
    setPerfProjectId(project.id);
    if (project.performance) {
      setPerfFormData(project.performance);
    } else {
      setPerfFormData({
        productId: '',
        productName: '',
        quantity: 0,
        sellingPrice: 0,
        purchasePrice: 0,
        commission: 0,
        shippingFee: 0,
        vat: 0
      });
    }
    setIsPerfModalOpen(true);
  };

  const handleSavePerformance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfFormData.productId || perfFormData.quantity <= 0) {
      alert('상품을 선택하고 수량을 입력해주세요.');
      return;
    }

    setProjects(prev => prev.map(p => {
      if (p.id === perfProjectId) {
        return {
          ...p,
          performance: perfFormData
        };
      }
      return p;
    }));

    showToast('프로젝트 성과 정보가 저장되었습니다.');
    setIsPerfModalOpen(false);
  };

  const calculatePerf = (data: ProjectPerformance) => {
    const totalRevenue = data.quantity * data.sellingPrice;
    const totalPurchaseCost = data.quantity * data.purchasePrice;
    const vat = data.vat;
    const totalCost = totalPurchaseCost + data.commission + data.shippingFee + vat;
    const profit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    return { totalRevenue, totalCost, profit, margin, totalPurchaseCost };
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    showToast('프로젝트가 삭제되었습니다.');
    setExpandedProjectId(null);
    setDeleteConfirmId(null);
  };

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'Ongoing':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-tight"><Clock size={12} /> 진행 중</span>;
      case 'Upcoming':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-tight"><Clock size={12} /> 진행 예정</span>;
      case 'Completed':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-tight"><CheckCircle2 size={12} /> 완료</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      {/* Stats Summary Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">전체 프로젝트</p>
            <p className="text-2xl font-black text-slate-800 leading-none">{projects.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-[#2D336B] shadow-inner">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">진행 중</p>
            <p className="text-2xl font-black text-slate-800 leading-none">{activeProjectsCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-inner">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">진행 예정</p>
            <p className="text-2xl font-black text-slate-800 leading-none">{upcomingProjectsCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">완료 프로젝트</p>
            <p className="text-2xl font-black text-slate-800 leading-none">{completedProjectsCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">보호소별 필터:</label>
            <select 
              value={shelterFilter}
              onChange={(e) => setShelterFilter(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-[#2D336B]/10 transition-all cursor-pointer"
            >
              <option value="all">전체 보호소</option>
              {MOCK_SHELTERS.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">상태별 필터:</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-[#2D336B]/10 transition-all cursor-pointer"
            >
              <option value="all">전체 상태</option>
              <option value="Upcoming">진행 예정</option>
              <option value="Ongoing">진행 중</option>
              <option value="Completed">완료</option>
            </select>
          </div>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[#2D336B] hover:bg-[#1E234A] text-white px-6 py-2.5 rounded-xl text-[11px] font-black flex items-center gap-2 shadow-lg shadow-indigo-900/10 transition-all active:scale-95"
        >
          <Plus size={16} /> 신규 프로젝트 등록
        </button>
      </div>

      {/* Project Table */}
      <div className="flex-1 overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col">
        <div className="overflow-x-auto overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px] table-fixed">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="w-[5%] px-4 py-5"></th>
                <th className="w-[40%] px-4 py-5">프로젝트명</th>
                <th className="w-[20%] px-4 py-5">대상 보호소</th>
                <th className="w-[20%] px-4 py-5 text-center">진행 기간</th>
                <th className="w-[15%] px-4 py-5 text-center">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.map(project => {
                const isExpanded = expandedProjectId === project.id;
                const perf = project.performance ? calculatePerf(project.performance) : null;
                
                return (
                  <React.Fragment key={project.id}>
                    <tr 
                      className={cn(
                        "hover:bg-slate-50/50 transition-all cursor-pointer group",
                        isExpanded && "bg-slate-50/80"
                      )}
                      onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                    >
                      <td className="px-4 py-6 text-center">
                        <button className="text-slate-300 group-hover:text-slate-500 transition-colors">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                      <td className="px-4 py-6">
                        <div className="flex flex-col gap-1 overflow-hidden">
                          <span className="text-sm font-black text-slate-800 tracking-tight truncate">{project.projectName}</span>
                          <span className="text-[10px] font-bold text-slate-400 font-mono truncate">{project.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="shrink-0 w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2D336B] text-[10px] font-black">
                            {project.shelterName.substring(0, 1)}
                          </div>
                          <span className="text-xs font-bold text-slate-600 truncate">{project.shelterName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-6 text-center">
                        <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-500 whitespace-nowrap">
                          <Calendar size={14} className="text-slate-300 shrink-0" />
                          <span>{project.startDate}</span>
                          <span className="text-slate-200">~</span>
                          <span>{project.endDate}</span>
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <div className="flex justify-center">
                          {getStatusBadge(project.status)}
                        </div>
                      </td>
                    </tr>

                    {/* Extended Detail Area */}
                    <AnimatePresence>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="bg-slate-50/30 px-8 py-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="py-6 border-t border-slate-100/50 flex flex-col gap-6 relative">
                                {/* Description Card */}
                                <div className="grid grid-cols-3 gap-6">
                                  <div className="col-span-2 space-y-4">
                                    <div className="space-y-1.5">
                                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Briefcase size={12} className="text-[#2D336B]" />
                                        프로젝트 상세 설명
                                      </h4>
                                      <p className="text-sm font-medium text-slate-600 bg-white p-4 rounded-xl border border-slate-100 leading-relaxed shadow-sm">
                                        {project.description || "상세 설명이 등록되지 않았습니다."}
                                      </p>
                                    </div>

                                    {/* Participating Partners */}
                                    <div className="space-y-1.5">
                                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Users size={12} className="text-indigo-500" />
                                        참여 협력 파트너
                                      </h4>
                                      <div className="flex flex-wrap gap-2">
                                        {project.partnerIds && project.partnerIds.length > 0 ? (
                                          project.partnerIds.map(pid => {
                                            const partner = PARTNER_MASTER_DATA.find(p => p.id === pid);
                                            return (
                                              <div key={pid} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-lg shadow-sm">
                                                <div className={cn(
                                                  "w-1.5 h-1.5 rounded-full",
                                                  partner?.type === 'Corporate' ? "bg-indigo-500" : "bg-slate-400"
                                                )} />
                                                <span className="text-xs font-bold text-slate-700">{partner?.name || pid}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                  {partner?.specialties[0]?.replace(' 지원', '') || (partner?.type === 'Corporate' ? '기업' : '개인')}
                                                </span>
                                              </div>
                                            );
                                          })
                                        ) : (
                                          <p className="text-[10px] font-bold text-slate-400 italic">등록된 파트너가 없습니다.</p>
                                        )}
                                      </div>
                                    </div>

                                    {project.status === 'Completed' && (
                                      <div className="space-y-1.5">
                                        <div className="flex justify-between items-center mb-1">
                                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <TrendingUp size={12} className="text-emerald-500" />
                                            성과 지표 내역
                                          </h4>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenPerfModal(project);
                                            }}
                                            className="text-[10px] font-black text-[#2D336B] hover:underline underline-offset-4 flex items-center gap-1"
                                          >
                                            {project.performance ? <><Edit2 size={10} /> 성과 수정하기</> : <><Plus size={10} /> 성과 기입하기</>}
                                          </button>
                                        </div>
                                        
                                        {project.performance ? (
                                          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                                            <table className="w-full text-left text-[11px]">
                                              <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-tighter">
                                                <tr>
                                                  <th className="px-4 py-2">판매 품목</th>
                                                  <th className="px-4 py-2 text-right">수량</th>
                                                  <th className="px-4 py-2 text-right">매출액</th>
                                                  <th className="px-4 py-2 text-right">매입가/공제</th>
                                                  <th className="px-4 py-2 text-right text-[#2D336B]">영업이익</th>
                                                </tr>
                                              </thead>
                                              <tbody className="font-bold text-slate-700">
                                                <tr>
                                                  <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                      <Package size={12} className="text-slate-300" />
                                                      {project.performance.productName}
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-3 text-right">{project.performance.quantity.toLocaleString()}</td>
                                                  <td className="px-4 py-3 text-right">₩{perf?.totalRevenue.toLocaleString()}</td>
                                                  <td className="px-4 py-3 text-right text-red-400">
                                                    <div className="flex flex-col items-end">
                                                      <span>₩{perf?.totalCost.toLocaleString()}</span>
                                                      <span className="text-[8px] font-medium text-slate-400">
                                                        (매입 ₩{perf?.totalPurchaseCost.toLocaleString()} + 공제 ₩{(project.performance.commission + project.performance.shippingFee + project.performance.vat).toLocaleString()})
                                                      </span>
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-3 text-right text-emerald-600 font-black">₩{perf?.profit.toLocaleString()}</td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </div>
                                        ) : (
                                          <div className="bg-white border border-slate-100 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-slate-300 gap-2">
                                            <BarChart3 size={24} />
                                            <span className="text-[11px] font-black uppercase tracking-widest">등록된 성과가 없습니다</span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Quick Stats Column */}
                                  <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 pl-1">
                                      <Calculator size={12} className="text-[#2D336B]" />
                                      영업 데이터 요약
                                    </h4>
                                    
                                    {project.performance ? (
                                      <div className="grid grid-cols-1 gap-3">
                                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">총 매출</p>
                                          <p className="text-sm font-black text-slate-800">₩{perf?.totalRevenue.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">영업 이익</p>
                                          <p className="text-sm font-black text-emerald-600">₩{perf?.profit.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-[#2D336B] p-3 rounded-xl shadow-lg shadow-indigo-900/10">
                                          <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">이익률</p>
                                          <p className="text-xl font-black text-white">{perf?.margin.toFixed(1)}%</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bg-slate-100/50 rounded-xl p-6 border border-slate-100 text-center space-y-2">
                                        <Coins size={20} className="text-slate-300 mx-auto" />
                                        <p className="text-[10px] font-bold text-slate-400 leading-tight">
                                          {project.status === 'Completed' ? "회계 데이터를 입력하면\n자동 분석이 시작됩니다" : "진행 완료 후 회계 성과를\n기록할 수 있습니다"}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Row Actions - Bottom Right */}
                                <div className="flex justify-end items-center gap-2 mt-2 pt-4 border-t border-slate-100/50">
                                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mr-auto">프로젝트 관리:</span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenModal(project);
                                    }}
                                    className="px-4 py-2 bg-white hover:bg-slate-50 rounded-xl text-slate-500 hover:text-[#2D336B] border border-slate-100 shadow-sm transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                  >
                                    <Edit2 size={12} /> 프로젝트 수정
                                  </button>
                                  {deleteConfirmId === project.id ? (
                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest mr-2">정말 삭제하시겠습니까?</span>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteProject(project.id);
                                        }}
                                        className="px-4 py-2 bg-red-600 text-white rounded-xl shadow-lg shadow-red-200 text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
                                      >
                                        확인
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteConfirmId(null);
                                        }}
                                        className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                      >
                                        취소
                                      </button>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirmId(project.id);
                                      }}
                                      className="px-4 py-2 bg-white hover:bg-red-50 rounded-xl text-slate-500 hover:text-red-500 border border-slate-100 shadow-sm transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                    >
                                      <Trash2 size={12} /> 프로젝트 삭제
                                    </button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {filteredProjects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 grayscale opacity-40">
              <LayoutGrid size={48} className="text-slate-200 mb-4" />
              <p className="text-sm font-black text-slate-300 uppercase tracking-widest">일치하는 프로젝트가 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
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
              className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 bg-[#2D336B] text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Briefcase size={20} />
                  </div>
                  <h3 className="text-lg font-black tracking-tight">
                    {editingProjectId ? '프로젝트 정보 수정' : '신규 프로젝트 등록'}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveProject} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">프로젝트명 *</label>
                  <input 
                    required
                    type="text" 
                    value={formData.projectName}
                    onChange={e => setFormData({...formData, projectName: e.target.value})}
                    placeholder="e.g. 2026 하반기 대규모 사료 지원 프로젝트"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2D336B]/10 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">대상 보호소 *</label>
                    <select 
                      required
                      value={formData.shelterId}
                      onChange={e => setFormData({...formData, shelterId: e.target.value})}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2D336B]/10 outline-none transition-all cursor-pointer"
                    >
                      <option value="" disabled>보호소를 선택하세요</option>
                      {MOCK_SHELTERS.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">분류(Type) *</label>
                    <select 
                      required
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value as any})}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2D336B]/10 outline-none transition-all cursor-pointer"
                    >
                      <option value="logistics">배송/물류</option>
                      <option value="sales">영업/미팅</option>
                      <option value="event">이벤트/캠페인</option>
                    </select>
                  </div>
                </div>


                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">시작 날짜 *</label>
                    <input 
                      required
                      type="date" 
                      value={formData.startDate}
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2D336B]/10 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">종료 날짜 *</label>
                    <input 
                      required
                      type="date" 
                      value={formData.endDate}
                      onChange={e => setFormData({...formData, endDate: e.target.value})}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2D336B]/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">프로젝트 상세 내용</label>
                  <textarea 
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="프로젝트의 목적, 지원 내용 등을 입력하세요."
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2D336B]/10 outline-none transition-all resize-none"
                  />
                </div>

                {/* Partners & Status Layout */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr,180px] gap-6 items-start">
                  {/* Partner Multi-Select */}
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1 h-[14px] flex items-center">협력 파트너 <span className="opacity-50 text-[9px] ml-1">(선택)</span></label>
                    
                    <div className="relative">
                      <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={partnerSearch}
                        onFocus={() => setIsPartnerDropdownOpen(true)}
                        onChange={e => {
                          setPartnerSearch(e.target.value);
                          setIsPartnerDropdownOpen(true);
                        }}
                        placeholder="파트너명 또는 ID 검색..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2D336B]/10 outline-none transition-all"
                      />
                      
                      {/* Selected Partner Tags */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {formData.partnerIds.map(pid => {
                          const partner = PARTNER_MASTER_DATA.find(p => p.id === pid);
                          if (!partner) return null;
                          const displaySpecialty = partner.specialties[0]?.replace(' 지원', '') || (partner.type === 'Corporate' ? '기업' : '개인');
                          return (
                            <span key={pid} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] font-black text-[#2D336B]">
                              [{displaySpecialty}] {partner.name}
                              <button 
                                type="button"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  partnerIds: prev.partnerIds.filter(id => id !== pid)
                                }))}
                                className="hover:text-red-500 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          );
                        })}
                      </div>

                      {/* Dropdown */}
                      <AnimatePresence>
                        {isPartnerDropdownOpen && partnerSearch && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar"
                          >
                            {filteredPartners.length > 0 ? (
                              filteredPartners
                                .filter(p => !formData.partnerIds.includes(p.id))
                                .map(partner => (
                                  <button
                                    key={partner.id}
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        partnerIds: [...prev.partnerIds, partner.id]
                                      }));
                                      setPartnerSearch('');
                                      setIsPartnerDropdownOpen(false);
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group"
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-xs font-black text-slate-700">
                                        <span className="text-indigo-500 mr-1">
                                          [{partner.specialties[0]?.replace(' 지원', '') || (partner.type === 'Corporate' ? '기업' : '개인')}]
                                        </span>
                                        {partner.name}
                                      </span>
                                      <span className="text-[10px] font-bold text-slate-400">{partner.id} · {partner.specialties.join(', ')}</span>
                                    </div>
                                    <Plus size={14} className="text-slate-200 group-hover:text-indigo-400" />
                                  </button>
                                ))
                            ) : (
                              <div className="px-4 py-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                                검색 결과가 없습니다
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {isPartnerDropdownOpen && partnerSearch && (
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsPartnerDropdownOpen(false)}
                      />
                    )}
                  </div>

                  {/* Status Options Button Group */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1 h-[14px] flex items-center">프로젝트 상태</label>
                    <div className="flex bg-slate-50 p-1 rounded-xl h-[46px] items-center gap-1">
                      {(['Upcoming', 'Ongoing', 'Completed'] as Project['status'][]).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData({...formData, status: s})}
                          className={cn(
                            "flex-1 h-full text-[9px] font-black rounded-lg transition-all",
                            formData.status === s 
                              ? "bg-white text-[#2D336B] shadow-sm ring-1 ring-slate-100" 
                              : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          {s === 'Upcoming' ? '진행 예정' : s === 'Ongoing' ? '진행 중' : '완료'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-[#FF9F1C] text-white font-black rounded-xl shadow-xl shadow-orange-200 hover:opacity-90 active:scale-[0.98] transition-all mt-4"
                >
                  {editingProjectId ? '프로젝트 정보 수정 완료' : '새로운 프로젝트 등록하기'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Performance Tracking Modal */}
      <AnimatePresence>
        {isPerfModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPerfModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <h3 className="text-lg font-black tracking-tight">프로젝트 성과(영업) 기입</h3>
                </div>
                <button 
                  onClick={() => setIsPerfModalOpen(false)} 
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSavePerformance} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">판매 품목 *</label>
                    <select 
                      required
                      value={perfFormData.productId}
                      onChange={e => {
                        const product = MASTER_PRODUCT_DATA.find(p => p.id === e.target.value);
                        if (product) {
                          setPerfFormData({
                            ...perfFormData,
                            productId: product.id,
                            productName: product.name,
                            purchasePrice: product.purchasePrice,
                            sellingPrice: product.sellingPrice
                          });
                        }
                      }}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all cursor-pointer"
                    >
                      <option value="" disabled>상품을 선택하세요</option>
                      {MASTER_PRODUCT_DATA.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.standard})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">판매 수량 *</label>
                      <input 
                        required
                        type="number"
                        value={perfFormData.quantity || ''}
                        onChange={e => setPerfFormData({...perfFormData, quantity: Number(e.target.value)})}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">수수료 (Commission)</label>
                      <input 
                        type="number"
                        value={perfFormData.commission || ''}
                        onChange={e => setPerfFormData({...perfFormData, commission: Number(e.target.value)})}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">배송비 (Shipping Fee)</label>
                      <input 
                        type="number"
                        value={perfFormData.shippingFee || ''}
                        onChange={e => setPerfFormData({...perfFormData, shippingFee: Number(e.target.value)})}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">부가세 (VAT - 10% 자동계산)</label>
                      <input 
                        type="number"
                        value={perfFormData.vat || ''}
                        onChange={e => setPerfFormData({...perfFormData, vat: Number(e.target.value)})}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">판매 단가 (수정 가능)</label>
                      <input 
                        type="number"
                        value={perfFormData.sellingPrice || ''}
                        onChange={e => setPerfFormData({...perfFormData, sellingPrice: Number(e.target.value)})}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">매입 단가 (수정 가능)</label>
                      <input 
                        type="number"
                        value={perfFormData.purchasePrice || ''}
                        onChange={e => setPerfFormData({...perfFormData, purchasePrice: Number(e.target.value)})}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Real-time Calculation Summary */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-200 pb-2 mb-4">실시간 정산 미리보기</h4>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">매출 합계</span>
                        <span className="font-black text-slate-800">₩{(perfFormData.quantity * perfFormData.sellingPrice).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">총 매입가</span>
                        <span className="font-black text-slate-800">₩{(perfFormData.quantity * perfFormData.purchasePrice).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">공제 비용 합계</span>
                        <span className="font-black text-red-400">₩{(perfFormData.commission + perfFormData.shippingFee + perfFormData.vat).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">최종 이익률</span>
                        <span className="font-black text-[#2D336B]">
                          {(() => {
                            const rev = perfFormData.quantity * perfFormData.sellingPrice;
                            const cost = (perfFormData.quantity * perfFormData.purchasePrice) + perfFormData.commission + perfFormData.shippingFee + perfFormData.vat;
                            const profit = rev - cost;
                            return rev > 0 ? ((profit / rev) * 100).toFixed(1) : '0.0';
                          })()}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 col-span-2">
                        <span className="text-sm font-black text-[#2D336B]">영업 순이익 (Net Profit)</span>
                        <span className="text-lg font-black text-emerald-600">
                          ₩{(perfFormData.quantity * perfFormData.sellingPrice - ((perfFormData.quantity * perfFormData.purchasePrice) + perfFormData.commission + perfFormData.shippingFee + perfFormData.vat)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-emerald-600 text-white font-black rounded-xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-[0.98] transition-all mt-4 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} /> 성과 데이터 저장 완료
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className={cn(
              "fixed top-4 right-8 z-[110] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border font-black text-sm",
              toast.type === 'success' ? "bg-white text-emerald-600 border-emerald-100" : "bg-white text-red-600 border-red-100"
            )}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectsView;
