import React, { useState } from 'react';
import { MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Activity, 
  Calendar, 
  Package, 
  Settings,
  Bell,
  Search,
  Users,
  LogOut,
  TrendingUp,
  AlertCircle,
  Truck,
  Heart,
  ChevronRight,
  Plus,
  ArrowRight,
  Filter,
  MoreVertical,
  CalendarDays,
  FileText,
  MapPin,
  Phone,
  Database,
  Briefcase
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { KoreaMap } from './KoreaMap';
import ProductRegistry from './ProductRegistry';
import ProjectCalendar from './ProjectCalendar';
import ProjectsView from './ProjectsView';
import InventoryLogisticsView from './InventoryLogisticsView';
import PartnerManagement from './PartnerManagement';
import { 
  LIVE_EVENTS, 
  LEAD_SHELTERS, 
  GROWTH_DATA,
  REGIONAL_SHELTER_DATA
} from '../constants';
import { 
  MOCK_SHELTERS, 
  MOCK_DONATIONS, 
  MOCK_DELIVERIES, 
  CONTACT_HISTORY,
  Shelter,
  Donation,
  Delivery
} from '../mockData';
import { useShelters } from '../context/ShelterContext';
import { PROJECT_DATA, Project } from '../projectData';
import { cn } from '../lib/utils';

// --- Shared Components ---

const SidebarItem = ({ icon: Icon, active = false, label, onClick }: { icon: any, active?: boolean, label: string, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={cn(
      "p-3 rounded-lg flex items-center gap-3 transition-all duration-200 group cursor-pointer",
      active 
        ? "bg-[#F0FDF4] border-l-4 border-accent text-accent shadow-sm" 
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
    )}
  >
    <Icon size={20} className={cn(active ? "text-accent" : "text-slate-400 group-hover:text-slate-500")} />
    <span className={cn("text-sm font-medium", active ? "font-semibold" : "")}>{label}</span>
  </div>
);

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("bg-white rounded-xl p-5 shadow-sm border border-slate-200", className)}
  >
    {children}
  </motion.div>
);

// --- View 1: Dashboard ---

const DashboardView = ({ 
  onSelectRegion, 
  onProjectClick,
  projects
}: { 
  onSelectRegion: (region: string) => void, 
  onProjectClick?: (proj: Project) => void,
  projects: Project[]
}) => {
  const { shelters } = useShelters();
  const [viewMode, setViewMode] = useState<'map' | 'calendar'>('map');
  
  const ongoingCount = projects.filter(p => p.status === 'Ongoing').length;
  
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-4 gap-4">
        {/* ... stats cards ... */}
        <Card className="h-28 flex flex-col justify-between border-l-4 border-l-[#2D336B]">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">활성 파트너</p>
            <div className="text-2xl font-black text-slate-800">{shelters.length} 보호소</div>
          </div>
          <div className="text-[10px] text-green-500 flex items-center font-bold">
            +12.5% <span className="text-slate-400 font-normal ml-1">전월 대비</span>
          </div>
        </Card>

        <Card className="h-28 flex flex-col justify-between border-l-4 border-l-[#FF9F1C]">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">진행 중 프로젝트</p>
            <div className="text-2xl font-black text-slate-800">{ongoingCount} 건</div>
          </div>
          <div className="text-[10px] text-[#FF9F1C] flex items-center font-bold">
            진행 중 <span className="text-slate-400 font-normal ml-1">실시간 데이터</span>
          </div>
        </Card>

        <Card className="h-28 flex flex-col justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">배송 대기</p>
            <div className="text-2xl font-black text-slate-800">12 건</div>
          </div>
          <div className="text-[10px] text-blue-500 flex items-center font-bold">
            배송 중 <span className="text-slate-400 font-normal ml-1">물류 활성화</span>
          </div>
        </Card>

        <Card className="h-28 flex flex-col justify-between bg-[#2D336B] text-white border-none shadow-lg shadow-indigo-900/10">
          <div>
            <p className="text-slate-300 text-[10px] font-bold uppercase tracking-wider mb-1">네트워크 안정성</p>
            <div className="text-2xl font-black">92.8%</div>
          </div>
          <div className="text-[10px] text-white/50 font-normal">
            운영 효율 지수
          </div>
        </Card>
      </section>

      <div className="flex flex-col gap-4">
        {/* View Switcher Toggle */}
        <div className="flex justify-start">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 shadow-inner border border-slate-200">
            <button 
              onClick={() => setViewMode('map')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-black flex items-center gap-2 transition-all",
                viewMode === 'map' ? "bg-white text-[#2D336B] shadow-sm ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <MapIcon size={14} /> Map
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-black flex items-center gap-2 transition-all",
                viewMode === 'calendar' ? "bg-white text-[#2D336B] shadow-sm ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Calendar size={14} /> Calendar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 min-h-[500px]">
          <div className="col-span-8 h-full relative">
            <AnimatePresence mode="wait">
              {viewMode === 'map' ? (
                <motion.div 
                  key="map-view"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <KoreaMap onSelectRegion={onSelectRegion} />
                </motion.div>
              ) : (
                <motion.div 
                   key="calendar-view"
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 1.02 }}
                   transition={{ duration: 0.2 }}
                   className="h-full"
                >
                  <ProjectCalendar onEventClick={onProjectClick} projects={projects} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="col-span-4 flex flex-col gap-4">
            <Card className="flex-1">
              <h3 className="text-sm font-bold text-slate-700 mb-4">기부 및 실시간 이벤트</h3>
              <div className="space-y-3 overflow-y-auto max-h-[380px] pr-2 custom-scrollbar">
                <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-bold text-accent italic">최근 활동</p>
                    <span className="text-[8px] bg-accent text-white px-1.5 py-0.5 rounded font-bold uppercase">업데이트</span>
                  </div>
                  <p className="text-[10px] text-slate-600 font-bold">왕왕랜드 1,660kg 수령</p>
                  <p className="text-[9px] text-slate-400 italic">고기호성 사료 배송 성공적으로 완료됨.</p>
                </div>
                
                {LIVE_EVENTS.map(event => (
                  <div key={event.id} className={cn(
                    "p-3 rounded-lg border transition-all cursor-pointer hover:bg-slate-50/80",
                    event.id === '1' ? "bg-red-50 border-red-100" : "bg-slate-50/50 border-slate-100"
                  )}>
                    <div className="flex justify-between items-center mb-1">
                      <p className={cn("text-xs font-bold", event.id === '1' ? "text-red-700" : "text-slate-700")}>
                        {event.eventName}
                      </p>
                      {event.id === '1' && (
                        <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded animate-pulse uppercase font-bold">Live</span>
                      )}
                    </div>
                    <p className={cn("text-[10px]", event.id === '1' ? "text-red-600" : "text-slate-500")}>
                      {event.shelterName}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="h-24 bg-slate-900 text-white border-none flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-red-500" size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-red-100 uppercase tracking-tight">시스템 경보</p>
                <p className="text-[11px] text-slate-400 leading-tight">공급망 알림: 경기 클러스터 사료 재고 부족</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- View 2: Shelter List (Overhauled CRM) ---

interface AddShelterFormData {
  name: string;
  region: string;
  detailedAddress: string;
  size: number;
  representative: string;
  representativeGender: 'Male' | 'Female';
  representativePhone: string;
  managerName: string;
  managerGender: 'Male' | 'Female';
  managerPhone: string;
}

const ShelterListView = ({ initialFilter }: { initialFilter?: string }) => {
  const { shelters, addShelter, updateShelter, deleteShelter } = useShelters();
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [filter, setFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState(initialFilter || '전체 지역');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShelterId, setEditingShelterId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<AddShelterFormData>({
    name: '',
    region: '서울',
    detailedAddress: '',
    size: 0,
    representative: '',
    representativeGender: 'Male',
    representativePhone: '',
    managerName: '',
    managerGender: 'Male',
    managerPhone: ''
  });

  const filteredShelters = shelters.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(filter.toLowerCase()) || 
                         s.representative.toLowerCase().includes(filter.toLowerCase());
    const matchesRegion = regionFilter === '전체 지역' || s.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

  const handleOpenEdit = (shelter: Shelter, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({
      name: shelter.name,
      region: shelter.region,
      detailedAddress: shelter.detailedAddress || '',
      size: shelter.size,
      representative: shelter.representative,
      representativeGender: shelter.representativeGender || 'Male',
      representativePhone: shelter.representativePhone || '',
      managerName: shelter.managerName || '',
      managerGender: shelter.managerGender || 'Male',
      managerPhone: shelter.managerPhone || ''
    });
    setEditingShelterId(shelter.id);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('정말로 이 보호소 정보를 삭제하시겠습니까?')) {
      deleteShelter(id);
      if (selectedShelter?.id === id) setSelectedShelter(null);
    }
    setOpenMenuId(null);
  };

  const handleAddOrUpdateShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.representative) {
      alert('필수 항목을 입력해주세요.');
      return;
    }

    if (editingShelterId) {
      await updateShelter(editingShelterId, formData);
    } else {
      await addShelter(formData);
    }

    setIsModalOpen(false);
    setEditingShelterId(null);
    setFormData({
      name: '',
      region: '서울',
      detailedAddress: '',
      size: 0,
      representative: '',
      representativeGender: 'Male',
      representativePhone: '',
      managerName: '',
      managerGender: 'Male',
      managerPhone: ''
    });
  };

  return (
    <div className="flex h-full gap-6 overflow-hidden relative">
      {/* Main List Table */}
      <div className={cn(
        "flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all duration-300",
        selectedShelter ? "w-[60%]" : "w-full"
      )}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex gap-3 items-center">
             <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="보호소명 또는 대표자 검색..." 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-8 py-2 border border-slate-200 rounded-lg text-xs w-64 focus:outline-none focus:ring-1 focus:ring-accent bg-slate-50/50" 
                />
             </div>
             <select 
               value={regionFilter}
               onChange={(e) => setRegionFilter(e.target.value)}
               className="px-3 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-accent font-medium"
             >
               <option>전체 지역</option>
               {REGIONAL_SHELTER_DATA.map(r => <option key={r.id}>{r.region}</option>)}
             </select>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#2D336B] hover:bg-[#1E234A] text-white px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus size={16} /> 신규 보호소 등록
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky top-0 z-20 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">보호소명</th>
                <th className="px-6 py-4">지역</th>
                <th className="px-6 py-4 text-center">규모 (마리)</th>
                <th className="px-6 py-4">대표자</th>
                <th className="px-6 py-4">영업 단계</th>
                <th className="px-6 py-4">마지막 컨택</th>
                <th className="px-6 py-4 text-right">기능</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredShelters.map((shelter) => (
                <tr 
                  key={shelter.id} 
                  onClick={() => setSelectedShelter(shelter)}
                  className={cn(
                    "hover:bg-slate-50/50 cursor-pointer transition-colors text-xs group relative",
                    selectedShelter?.id === shelter.id && "bg-slate-50 border-l-4 border-l-[#2D336B]"
                  )}
                >
                  <td className="px-6 py-4 font-bold text-slate-800">{shelter.name}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-slate-500 font-medium tracking-tight">
                      <MapPin size={12} className="text-slate-300" /> {shelter.region}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-bold text-slate-600">{shelter.size}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{shelter.representative}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tight inline-block",
                      shelter.stage === 'Partnered' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                      shelter.stage === 'Negotiating' ? "bg-orange-50 text-orange-600 border border-orange-100" :
                      shelter.stage === 'Sample Sent' ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-slate-100 text-slate-500 border border-slate-200"
                    )}>
                      {shelter.stage === 'Partnered' ? '협력 완료' :
                       shelter.stage === 'Negotiating' ? '협상 중' :
                       shelter.stage === 'Sample Sent' ? '샘플 배송' : '가망 고객'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-medium tracking-tighter">{shelter.lastContactDate}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block text-left">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === shelter.id ? null : shelter.id);
                        }}
                        className="p-1 px-2 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-slate-700"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      
                      {openMenuId === shelter.id && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setOpenMenuId(null)}></div>
                          <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-xl border border-slate-100 z-40 py-1.5 overflow-hidden">
                            <button 
                              onClick={(e) => handleOpenEdit(shelter, e)}
                              className="w-full px-4 py-2 text-left text-[11px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Edit2 size={12} className="text-blue-500" /> 정보 수정
                            </button>
                            <button 
                              onClick={(e) => handleDelete(shelter.id, e)}
                              className="w-full px-4 py-2 text-left text-[11px] font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 size={12} /> 정보 삭제
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Detail Panel */}
      <AnimatePresence>
        {selectedShelter && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 w-[420px] h-full bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#2D336B] text-white">
              <div>
                <h3 className="text-lg font-bold tracking-tight">{selectedShelter.name}</h3>
                <p className="text-[10px] text-white/60 font-medium tracking-widest uppercase mt-0.5">보호소 상세 프로필</p>
              </div>
              <button 
                onClick={() => setSelectedShelter(null)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Plus className="rotate-45" size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-7 space-y-8 custom-scrollbar">
              {/* Region & Address */}
              <section className="space-y-4">
                <h4 className="text-[10px] font-black text-[#2D336B] uppercase tracking-[0.2em] flex items-center gap-2">
                  <MapPin size={12} /> 위치 및 주소
                </h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                  <p className="text-xs font-bold text-slate-800">{selectedShelter.region}</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedShelter.detailedAddress || '상세 주소 정보가 없습니다.'}</p>
                </div>
              </section>

              {/* Personnel */}
              <div className="grid grid-cols-2 gap-4">
                <section className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">대표자</h4>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <p className="text-sm font-bold text-slate-800">{selectedShelter.representative}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{selectedShelter.representativeGender === 'Male' ? '남성' : '여성'} | {selectedShelter.representativePhone}</p>
                  </div>
                </section>
                <section className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">매니저</h4>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <p className="text-sm font-bold text-slate-800">{selectedShelter.managerName || '--'}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{selectedShelter.managerGender ? (selectedShelter.managerGender === 'Male' ? '남성' : '여성') : '--'} | {selectedShelter.managerPhone || '--'}</p>
                  </div>
                </section>
              </div>

              {/* History Timeline */}
              <section className="space-y-5">
                <h4 className="text-[10px] font-black text-[#FF9F1C] uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity size={12} /> 영업 및 활동 기록
                </h4>
                <div className="relative pl-6 space-y-6 border-l border-slate-100 ml-2">
                   {[
                     { date: selectedShelter.lastContactDate, msg: '공급망 관련 최신 후속 통화 완료.' },
                     { date: '2024-03-12', msg: '현장 방문 완료. 운영상 문제점 논의.' },
                     { date: '2024-01-05', msg: '지역 네트워킹 이벤트를 통한 초기 리드 확보.' }
                   ].map((item, idx) => (
                     <div key={idx} className="relative">
                        <div className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-white border-2 border-[#FF9F1C] shadow-sm shadow-orange-200"></div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 tracking-tighter mb-1">{item.date}</p>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                            {item.msg}
                          </p>
                        </div>
                     </div>
                   ))}
                </div>
              </section>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100">
               <button className="w-full py-3 bg-[#FF9F1C] hover:bg-[#E68A00] text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                 <FileText size={14} /> 히스토리 기록 추가
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Shelter Modal */}
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
                <h3 className="text-xl font-bold tracking-tight">
                  {editingShelterId ? '보호소 정보 수정' : '신규 보호소 등록'}
                </h3>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingShelterId(null);
                  }} 
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>

              <form onSubmit={handleAddOrUpdateShelter} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">보호소명 *</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. 행복한 유기견 센터"
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">지역 (시/도) *</label>
                    <select 
                      value={formData.region}
                      onChange={e => setFormData({...formData, region: e.target.value})}
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                    >
                      {REGIONAL_SHELTER_DATA.map(r => <option key={r.id}>{r.region}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">상세 주소</label>
                  <input 
                    type="text" 
                    value={formData.detailedAddress}
                    onChange={e => setFormData({...formData, detailedAddress: e.target.value})}
                    placeholder="상세 번지수 및 건물명"
                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">보호소 규모 (수용 마리수) *</label>
                  <input 
                    required
                    type="number" 
                    value={formData.size}
                    onChange={e => setFormData({...formData, size: parseInt(e.target.value) || 0})}
                    placeholder="현재 보호중인 강아지 수"
                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                  />
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
                  <h4 className="text-xs font-bold text-[#2D336B] flex items-center gap-2">
                    <Users size={14} /> 대표자 정보
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      required
                      placeholder="이름" 
                      value={formData.representative}
                      onChange={e => setFormData({...formData, representative: e.target.value})}
                      className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-accent"
                    />
                    <select 
                      value={formData.representativeGender}
                      onChange={e => setFormData({...formData, representativeGender: e.target.value as any})}
                      className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-accent"
                    >
                      <option value="Male">남성</option>
                      <option value="Female">여성</option>
                    </select>
                    <input 
                      required
                      placeholder="연락처 (e.g. 010-0000-0000)" 
                      value={formData.representativePhone}
                      type="tel"
                      onChange={e => setFormData({...formData, representativePhone: e.target.value})}
                      className="col-span-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
                  <h4 className="text-xs font-bold text-slate-500 flex items-center gap-2">
                    <Users size={14} /> 매니저/실무자 정보 (선택)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      placeholder="이름" 
                      value={formData.managerName}
                      onChange={e => setFormData({...formData, managerName: e.target.value})}
                      className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-accent"
                    />
                    <select 
                      value={formData.managerGender}
                      onChange={e => setFormData({...formData, managerGender: e.target.value as any})}
                      className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-accent"
                    >
                      <option value="Male">남성</option>
                      <option value="Female">여성</option>
                    </select>
                    <input 
                      placeholder="연락처" 
                      value={formData.managerPhone}
                      type="tel"
                      onChange={e => setFormData({...formData, managerPhone: e.target.value})}
                      className="col-span-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-[#2D336B] text-white font-bold rounded-xl shadow-xl hover:shadow-[#2D336B]/20 transition-all active:scale-[0.98] mt-4"
                >
                  {editingShelterId ? '수정 내용 저장' : '보호소 등록하기'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LogisticsView = () => {
    const statuses: Delivery['status'][] = ['Order Received', 'Preparing', 'Shipped', 'Delivered'];
    const statusLabels: Record<Delivery['status'], string> = {
        'Order Received': '주문 접수',
        'Preparing': '배송 준비',
        'Shipped': '배송 중',
        'Delivered': '배송 완료'
    };

    return (
        <div className="grid grid-cols-4 gap-6 h-full overflow-hidden">
            {statuses.map(status => (
                <div key={status} className="flex flex-col h-full bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden shadow-inner">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-2">
                           <div className={cn(
                             "w-1.5 h-4 rounded-full",
                             status === 'Delivered' ? "bg-green-400" :
                             status === 'Shipped' ? "bg-blue-400" :
                             status === 'Preparing' ? "bg-orange-400" : "bg-slate-300"
                           )}></div>
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{statusLabels[status]}</h4>
                        </div>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200/50">
                            {MOCK_DELIVERIES.filter(d => d.status === status).length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {MOCK_DELIVERIES.filter(d => d.status === status).map(delivery => (
                            <motion.div 
                                layoutId={delivery.id}
                                key={delivery.id} 
                                className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-accent/20 transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rotate-45 translate-x-10 -translate-y-10 group-hover:bg-accent/5 transition-colors"></div>
                                
                                <div className="flex justify-between items-start mb-3 relative z-10">
                                    <span className="text-[10px] text-slate-400 font-bold tracking-tighter bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{delivery.trackingNumber}</span>
                                    <button className="text-slate-200 group-hover:text-slate-400 transition-colors"><MoreVertical size={14} /></button>
                                </div>
                                <h5 className="text-sm font-bold text-slate-800 mb-1 tracking-tight">{delivery.destination}</h5>
                                <p className="text-[10px] text-slate-500 mb-5 leading-relaxed font-medium line-clamp-2">{delivery.items}</p>
                                
                                {status === 'Delivered' ? (
                                    <div className="flex gap-2">
                                       <button className="flex-1 py-2.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-lg border border-green-100 flex items-center justify-center gap-2 hover:bg-green-100 transition-colors">
                                            <FileText size={12} /> 배송 증명 업로드됨
                                       </button>
                                       <button className="p-2.5 bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"><MapPin size={14} /></button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                       <button className="flex-1 py-2.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2">
                                           <Plus size={12} /> 정보 업로드
                                       </button>
                                       <button className="p-2.5 bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 border border-slate-100 transition-all"><Truck size={14} /></button>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                        <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-300 text-[10px] font-black hover:border-accent/30 hover:text-accent/50 transition-all uppercase tracking-widest bg-slate-50/50">
                            + 신규 배송 등록
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Main Layout Component ---

export default function ShelterDashboard() {
  const { shelters } = useShelters();
  const [activeView, setActiveView] = useState<'dashboard' | 'crm' | 'donations' | 'logistics' | 'inventory' | 'settings' | 'products' | 'partners'>('dashboard');
  const [crmFilter, setCrmFilter] = useState('');
  const [projects, setProjects] = useState<Project[]>(PROJECT_DATA);

  const navigateToCrm = (region: string) => {
    setCrmFilter(region);
    setActiveView('crm');
  };

  const ongoingProjects = projects.filter(p => p.status === 'Ongoing').length;

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return (
        <DashboardView 
          onSelectRegion={navigateToCrm} 
          onProjectClick={(proj) => {
            setCrmFilter(proj.shelterName);
            setActiveView('crm');
          }}
          projects={projects}
        />
      );
      case 'crm': return <ShelterListView initialFilter={crmFilter} />;
      case 'donations': return (
        <ProjectsView 
          projects={projects} 
          setProjects={setProjects} 
        />
      );
      case 'inventory': return <InventoryLogisticsView />;
      case 'logistics': return <LogisticsView />;
      case 'partners': return <PartnerManagement />;
      case 'products': return <ProductRegistry />;
      case 'settings': return <div className="p-10 text-center flex flex-col items-center justify-center h-full"><Settings size={48} className="text-slate-100 mb-4 animate-spin-slow" /><h3 className="text-slate-400 font-bold uppercase tracking-widest">환경 설정 콘솔</h3><p className="text-xs text-slate-300 mt-2 italic">모듈 유지 관리 중...</p></div>;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {/* Sidebar - Clean Slate Themed */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-50">
        <div className="p-7 flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 border border-white/20">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tighter text-slate-800 leading-none">쉘터플로우</span>
            <span className="text-[9px] font-black text-accent tracking-[.25em] uppercase mt-1 leading-none">네트워크 ERP</span>
          </div>
        </div>
        
        <nav className="flex-1 px-5 space-y-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            active={activeView === 'dashboard'} 
            label="대시보드" 
            onClick={() => setActiveView('dashboard')}
          />
          <SidebarItem 
            icon={Users} 
            active={activeView === 'crm'} 
            label="보호소 관리 (CRM)" 
            onClick={() => { setActiveView('crm'); setCrmFilter(''); }}
          />
          <SidebarItem 
            icon={Briefcase} 
            active={activeView === 'donations'} 
            label="프로젝트 관리" 
            onClick={() => setActiveView('donations')}
          />
          <SidebarItem 
            icon={Truck} 
            active={activeView === 'logistics'} 
            label="배송 현황" 
            onClick={() => setActiveView('logistics')}
          />
          <SidebarItem 
            icon={Package} 
            active={activeView === 'inventory'} 
            label="수불/물류 관리" 
            onClick={() => setActiveView('inventory')}
          />
          
          <div className="pt-6 pb-2 px-3 text-[10px] font-black text-slate-300 uppercase tracking-widest">기초 정보 관리 (Master Data)</div>
          <SidebarItem 
            icon={Database} 
            active={activeView === 'products'} 
            label="사료/용품 등록" 
            onClick={() => setActiveView('products')}
          />
          <SidebarItem 
            icon={Users} 
            active={activeView === 'partners'} 
            label="파트너 관리" 
            onClick={() => setActiveView('partners')}
          />

          <div className="pt-6 pb-2 px-3 text-[10px] font-black text-slate-300 uppercase tracking-widest">지원</div>
          <SidebarItem 
            icon={Settings} 
            active={activeView === 'settings'} 
            label="설정" 
            onClick={() => setActiveView('settings')}
          />
        </nav>

        <div className="p-5 mt-auto bg-slate-50/50 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-slate-200 group">
            <div className="relative">
               <img 
                 src="https://api.dicebear.com/7.x/avataaars/svg?seed=Carlis" 
                 alt="Avatar" 
                 className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 object-cover p-0.5 transition-transform group-hover:scale-105"
               />
               <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm ring-1 ring-green-100"></div>
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-[11px] font-black text-slate-800 truncate">카를리스 볼롬보이</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">지역 총괄 이사</p>
            </div>
            <button className="text-slate-300 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-50">
               <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-100 relative">
        <div className="absolute inset-0 bg-[radial-gradient(#80BCBD15_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-50"></div>
        
        {/* Header - Integrated & Clean */}
        <header className="h-[72px] bg-white border-b border-slate-200 px-10 flex items-center justify-between flex-shrink-0 z-40 shadow-sm shadow-slate-200/20 sticky top-0">
          <div className="flex items-center gap-4">
             <div className="w-1.5 h-6 bg-accent rounded-full shadow-[0_0_8px_rgba(128,188,189,0.5)]"></div>
             <h1 className="text-xl font-black text-slate-800 tracking-tight capitalize antialiased">
                {activeView === 'crm' ? '보호소 관리 (CRM)' : 
                 activeView === 'donations' ? '프로젝트 생애주기 관리' : 
                 activeView === 'inventory' ? '보호소별 수불부 관리' : 
                 activeView === 'logistics' ? '출고 및 물류 이행' : 
                 activeView === 'partners' ? '파트너 마스터 관리' : 
                 activeView === 'dashboard' ? '대시보드 개요' :
                 activeView === 'products' ? '상품 기초 데이터 등록' :
                 activeView.replace(/([A-Z])/g, ' $1').trim()}
             </h1>
          </div>
          <div className="flex items-center gap-7 text-slate-800">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-accent" size={16} />
              <input 
                type="text" 
                placeholder="전체 네트워크 검색..." 
                className="bg-slate-50 border border-slate-200/60 rounded-full py-2.5 pl-11 pr-5 text-[11px] font-medium w-72 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all shadow-inner"
              />
            </div>
            <div className="flex items-center gap-4 border-l border-slate-100 pl-7">
              <button className="relative p-2.5 bg-slate-50 rounded-xl hover:bg-white hover:shadow-md border border-slate-100 transition-all text-slate-500 cursor-pointer group">
                <Bell size={20} className="group-hover:text-accent transition-colors" />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white border border-red-200 shadow-sm"></span>
              </button>
              <button className="flex items-center gap-2 p-1 pr-3 bg-slate-900 rounded-full text-white shadow-lg shadow-slate-900/10 hover:opacity-90 active:scale-95 transition-all">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-black text-[10px]">SF</div>
                  <span className="text-[10px] font-black uppercase tracking-wider">빠른 작업</span>
              </button>
            </div>
          </div>
        </header>

        {/* View Render Area */}
        <div className="flex-1 overflow-hidden p-10 flex flex-col gap-6 relative z-10">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeView}
                    initial={{ opacity: 0, scale: 0.99, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.99, y: -10 }}
                    transition={{ duration: 0.3, ease: 'circOut' }}
                    className="h-full flex flex-col"
                >
                    {renderView()}
                </motion.div>
            </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
