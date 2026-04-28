import React, { useState, useMemo } from 'react';
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
  ShieldCheck,
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
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare as MsgIcon
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
import SalesTaskManager from './SalesTaskManager';
import ActivityLogManagementView from './ActivityLogManagementView';
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
  MOCK_SALES_TASKS,
  Shelter,
  Donation,
  Delivery,
  SalesTask
} from '../mockData';
import { PARTNER_MASTER_DATA } from '../partnerMasterData';
import { useShelters } from '../context/ShelterContext';
import { PROJECT_DATA, Project } from '../projectData';
import { cn } from '../lib/utils';

// --- Shared Components ---

const SidebarItem = ({ icon: Icon, active = false, label, onClick }: { icon: any, active?: boolean, label: string, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={cn(
      "p-[0.625rem] rounded-lg flex items-center gap-[0.5rem] transition-all duration-200 group cursor-pointer",
      active 
        ? "bg-[#F0FDF4] border-l-[0.25rem] border-accent text-accent shadow-sm" 
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
    )}
  >
    <Icon size={18} className={cn(active ? "text-accent" : "text-slate-400 group-hover:text-slate-500")} />
    <span className={cn("text-[0.75rem] font-medium", active ? "font-semibold" : "")}>{label}</span>
  </div>
);

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("bg-white rounded-xl p-[1rem] shadow-sm border border-slate-200", className)}
  >
    {children}
  </motion.div>
);

// --- Action Items Related Components ---

const TodayFocusWidget = ({ onTaskClick }: { onTaskClick: (task: SalesTask) => void }) => {
  const [tasks, setTasks] = useState<SalesTask[]>(MOCK_SALES_TASKS);
  const { shelters } = useShelters();

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = useMemo(() => {
    return [...tasks]
      .filter(t => {
        if (t.status === '완료') return false;
        const deadline = new Date(t.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return deadline <= today;
      })
      .sort((a, b) => {
        const priorityMap = { '높음': 3, '보통': 2, '낮음': 1 };
        return priorityMap[b.priority] - priorityMap[a.priority];
      });
  }, [tasks]);

  const handleToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Simulated completion logic
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: '완료' } : t));
  };

  const isOverdue = (deadline: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(deadline) < today;
  };

  return (
    <div className="space-y-[0.75rem] overflow-y-auto pr-[0.5rem] custom-scrollbar flex-1 min-h-0">
      <AnimatePresence mode="popLayout">
        {filteredTasks.map(task => {
          const shelter = shelters.find(s => s.id === task.shelterId);
          const overdue = isOverdue(task.deadline);
          
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, x: -10 }}
              layout
              className={cn(
                "group flex items-start gap-[0.75rem] p-[0.75rem] bg-white border border-slate-100 rounded-xl hover:shadow-md transition-all cursor-pointer",
                overdue && "border-red-100 bg-red-50/10"
              )}
              onClick={() => onTaskClick(task)}
            >
              <button
                onClick={(e) => handleToggle(task.id, e)}
                className={cn(
                  "mt-[0.125rem] flex-shrink-0 w-[1.25rem] h-[1.25rem] rounded-full border-2 flex items-center justify-center transition-all",
                  "border-slate-200 text-transparent hover:border-accent hover:bg-accent/5",
                  overdue && "border-red-200"
                )}
              >
                <CheckCircle2 size={12} />
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-[0.125rem]">
                  <div className="flex items-center gap-1.5">
                    {overdue && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[0.625rem] font-black rounded uppercase">긴급</span>}
                    <span className={cn(
                      "text-[0.625rem] font-black uppercase tracking-widest",
                      overdue ? "text-red-500" : "text-slate-400"
                    )}>
                      {task.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-[0.25rem]">
                    <Clock size={10} className={cn(overdue ? "text-red-500" : "text-slate-300")} />
                    <span className={cn(
                      "text-[0.625rem] font-mono font-bold tracking-tighter text-slate-400",
                      overdue && "text-red-500 font-black"
                    )}>
                      {task.deadline === todayStr ? 'Today' : task.deadline}
                    </span>
                  </div>
                </div>
                <h4 className="text-[0.75rem] font-bold text-slate-800 leading-tight mb-[0.125rem] truncate">
                  {task.taskName}
                </h4>
                <div className="flex items-center gap-[0.5rem] text-[0.625rem] font-medium text-slate-400">
                  <MapPin size={10} />
                  <span className="truncate">{shelter?.name}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {filteredTasks.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center py-[2rem] text-center">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 mb-2">
            <ShieldCheck size={20} />
          </div>
          <p className="text-[0.75rem] font-black text-slate-800 uppercase tracking-tight">여유로운 시간입니다!</p>
          <p className="text-[0.625rem] text-slate-400 font-bold uppercase tracking-widest mt-1">오늘 예정된 급한 업무가 없습니다</p>
        </div>
      )}
    </div>
  );
};

const ActivityTimelineWidget = ({ onTaskClick }: { onTaskClick: (task: SalesTask) => void }) => {
  const { shelters } = useShelters();
  
  const activities = useMemo(() => {
    const history = CONTACT_HISTORY.map(h => ({
      id: h.id,
      date: h.date,
      message: h.message,
      type: 'contact',
      category: '상담/컨택',
      shelterId: h.shelterId
    }));

    const taskEvents = MOCK_SALES_TASKS.map(t => ({
      id: t.id,
      date: t.deadline,
      message: t.taskName,
      type: 'task',
      category: t.category,
      shelterId: t.shelterId,
      originalTask: t
    }));

    return [...history, ...taskEvents]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  const getIcon = (category: string) => {
    if (category.includes('방문') || category.includes('현장')) return <MapPin size={14} className="text-emerald-500" />;
    if (category.includes('유선') || category.includes('상담')) return <Phone size={14} className="text-blue-500" />;
    if (category.includes('물류') || category.includes('배송')) return <Truck size={14} className="text-amber-500" />;
    return <Activity size={14} className="text-slate-400" />;
  };

  return (
    <div className="space-y-[0.75rem] overflow-y-auto pr-[0.5rem] custom-scrollbar flex-1 min-h-0">
      <div className="relative pl-[1.25rem]">
        <div className="absolute left-[0.4375rem] top-0 bottom-0 w-[0.125rem] bg-slate-100" />
        
        {activities.map((activity, idx) => {
          const shelter = shelters.find(s => s.id === activity.shelterId);
          return (
            <div 
              key={`${activity.id}-${idx}`} 
              className="relative mb-[1rem] group cursor-pointer"
              onClick={() => {
                if ('originalTask' in activity) onTaskClick(activity.originalTask as SalesTask);
              }}
            >
              <div className="absolute -left-[1.25rem] top-[0.25rem] w-[0.875rem] h-[0.875rem] rounded-full border-2 border-white bg-slate-200 group-hover:bg-accent group-hover:scale-110 transition-all z-10" />
              
              <div className="p-[0.75rem] bg-slate-50/50 border border-slate-100 rounded-xl group-hover:bg-white group-hover:shadow-md group-hover:border-accent/10 transition-all">
                <div className="flex justify-between items-center mb-[0.25rem]">
                  <div className="flex items-center gap-[0.375rem]">
                    {getIcon(activity.category)}
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activity.category}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-300">{activity.date}</span>
                </div>
                <p className="text-[0.75rem] font-bold text-slate-700 leading-tight mb-[0.25rem]">{activity.message}</p>
                <div className="flex items-center gap-[0.25rem] text-[0.625rem] font-bold text-slate-400">
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="truncate">{shelter?.name}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


const TaskDrawer = ({ task, onClose }: { task: SalesTask | null, onClose: () => void }) => {
  const { shelters } = useShelters();
  const shelter = task ? shelters.find(s => s.id === task.shelterId) : null;
  const overdue = task ? new Date(task.deadline) < new Date() : false;

  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 w-[30rem] h-full bg-white shadow-2xl z-[101] flex flex-col border-l border-slate-200"
          >
            <div className="p-6 bg-[#2D336B] text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">{task.taskName}</h3>
                  <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">테스크 상세 정보</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              <section className="space-y-4">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} /> 업무 개요
                </h5>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-4">
                   <div className="flex justify-between items-center bg-white px-4 py-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase">전략적 카테고리</span>
                      <span className="text-xs font-black text-accent">{task.category}</span>
                   </div>
                   <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                     "{task.description || '세부 정보가 입력되지 않았습니다.'}"
                   </p>
                </div>
              </section>

              <section className="space-y-4">
                <h5 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                  <Users size={14} /> 담당 파트너 정보
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">대상 보호소</p>
                    <p className="text-sm font-black text-slate-800">{shelter?.name || 'Unknown'}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                       <MapPin size={12} /> {shelter?.region}
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">대표자</p>
                    <p className="text-sm font-black text-slate-800">{shelter?.representative || 'Unknown'}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
                       <Phone size={12} /> {shelter?.representativePhone || 'N/A'}
                    </div>
                  </div>
                </div>
                {task.partnerIds.length > 0 && (
                  <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                     <p className="text-[9px] font-black text-indigo-400 uppercase mb-3">연결된 물류/이벤트 파트너</p>
                     <div className="flex flex-wrap gap-2">
                       {task.partnerIds.map(pid => {
                         const partner = PARTNER_MASTER_DATA.find(p => p.id === pid);
                         return (
                           <div key={pid} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              <span className="text-[11px] font-bold text-slate-700">{partner?.name}</span>
                              <ExternalLink size={10} className="text-slate-300" />
                           </div>
                         );
                       })}
                     </div>
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <h5 className="text-[10px] font-black text-[#FF9F1C] uppercase tracking-widest flex items-center gap-2">
                  <MsgIcon size={14} /> 업무 메모 및 협의 사항
                </h5>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all resize-none min-h-[120px]"
                  placeholder="클라이언트와의 미팅 내용이나 내부 전달 사항을 자유롭게 기록하세요..."
                />
              </section>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
               <button className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-black text-xs rounded-xl hover:bg-slate-100 transition-all active:scale-[0.98]">
                 수정하기
               </button>
               <button className="flex-2 py-4 bg-[#FF9F1C] text-white font-black text-xs rounded-xl shadow-lg shadow-orange-200 transition-all active:scale-[0.98]">
                 완료 처리하기
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

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
  const [selectedTaskForDrawer, setSelectedTaskForDrawer] = useState<SalesTask | null>(null);
  
  const ongoingCount = projects.filter(p => p.status === 'Ongoing').length;
  
  return (
    <div className="space-y-[1rem] flex flex-col h-full overflow-hidden">
      <section className="grid grid-cols-4 gap-[0.75rem] shrink-0">
        {/* ... stats cards ... */}
        <Card className="h-full flex flex-col justify-between border-l-[0.25rem] border-l-[#2D336B] p-[0.875rem]">
          <div>
            <p className="text-slate-400 text-[0.625rem] font-bold uppercase tracking-wider mb-[0.125rem]">활성 파트너</p>
            <div className="text-[1.25rem] font-black text-slate-800">{shelters.length} 보호소</div>
          </div>
          <div className="text-[0.625rem] text-green-500 flex items-center font-bold">
            +12.5% <span className="text-slate-400 font-normal ml-[0.25rem]">전월 대비</span>
          </div>
        </Card>

        <Card className="h-full flex flex-col justify-between border-l-[0.25rem] border-l-[#FF9F1C] p-[0.875rem]">
          <div>
            <p className="text-slate-400 text-[0.625rem] font-bold uppercase tracking-wider mb-[0.125rem]">진행 중 프로젝트</p>
            <div className="text-[1.25rem] font-black text-slate-800">{ongoingCount} 건</div>
          </div>
          <div className="text-[0.625rem] text-[#FF9F1C] flex items-center font-bold">
            진행 중 <span className="text-slate-400 font-normal ml-[0.25rem]">실시간 데이터</span>
          </div>
        </Card>

        <Card className="h-full flex flex-col justify-between p-[0.875rem]">
          <div>
            <p className="text-slate-400 text-[0.625rem] font-bold uppercase tracking-wider mb-[0.125rem]">배송 대기</p>
            <div className="text-[1.25rem] font-black text-slate-800">12 건</div>
          </div>
          <div className="text-[0.625rem] text-blue-500 flex items-center font-bold">
            배송 중 <span className="text-slate-400 font-normal ml-[0.25rem]">물류 활성화</span>
          </div>
        </Card>

        <Card className="h-full flex flex-col justify-between bg-[#2D336B] text-white border-none shadow-lg shadow-indigo-900/10 p-[0.875rem]">
          <div>
            <p className="text-slate-300 text-[0.625rem] font-bold uppercase tracking-wider mb-[0.125rem]">네트워크 안정성</p>
            <div className="text-[1.25rem] font-black">92.8%</div>
          </div>
          <div className="text-[0.625rem] text-white/50 font-normal">
            운영 효율 지수
          </div>
        </Card>
      </section>

      <div className="flex flex-col gap-[0.75rem] flex-1 min-h-0">
        {/* View Switcher Toggle */}
        <div className="flex justify-start shrink-0">
          <div className="bg-slate-100 p-[0.25rem] rounded-xl flex items-center gap-[0.25rem] shadow-inner border border-slate-200">
            <button 
              onClick={() => setViewMode('map')}
              className={cn(
                "px-[0.75rem] py-[0.25rem] rounded-lg text-[0.6875rem] font-black flex items-center gap-[0.375rem] transition-all",
                viewMode === 'map' ? "bg-white text-[#2D336B] shadow-sm ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <MapIcon size={12} /> Map
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={cn(
                "px-[0.75rem] py-[0.25rem] rounded-lg text-[0.6875rem] font-black flex items-center gap-[0.375rem] transition-all",
                viewMode === 'calendar' ? "bg-white text-[#2D336B] shadow-sm ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Calendar size={12} /> Calendar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-[1rem] flex-1 min-h-0 bg-slate-100">
          <div className="col-span-8 flex flex-col min-h-0 relative">
            <AnimatePresence mode="wait">
              {viewMode === 'map' ? (
                <motion.div 
                  key="map-view"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1"
                >
                  <Card className="h-full overflow-hidden p-0 border-white/50 shadow-xl shadow-indigo-900/5">
                    <KoreaMap onSelectRegion={onSelectRegion} />
                  </Card>
                </motion.div>
              ) : (
                <motion.div 
                   key="calendar-view"
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 1.02 }}
                   transition={{ duration: 0.2 }}
                   className="flex-1"
                >
                  <Card className="h-full overflow-hidden border-white/50 shadow-xl shadow-indigo-900/5">
                    <ProjectCalendar onEventClick={onProjectClick} projects={projects} />
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="col-span-4 flex flex-col gap-[1rem] min-h-0">
            <Card className="flex-1 flex flex-col min-h-0 bg-white/80 backdrop-blur-sm border-white/40 shadow-xl shadow-slate-200/50">
              <div className="flex items-center justify-between mb-[0.875rem] shrink-0">
                <div>
                  <h3 className="text-[0.8125rem] font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <Calendar size={14} className="text-accent" /> Today's Focus
                  </h3>
                  <p className="text-[0.625rem] text-slate-400 font-bold uppercase tracking-widest mt-[0.125rem]">오늘 완료가 필요한 긴급 과제</p>
                </div>
                <div className="px-2 py-0.5 bg-accent/10 rounded text-[10px] font-black text-accent uppercase tracking-tighter">Priority</div>
              </div>
              
              <div className="flex-1 min-h-0">
                <TodayFocusWidget onTaskClick={setSelectedTaskForDrawer} />
              </div>
            </Card>

            <Card className="flex-1 flex flex-col min-h-0 bg-white shadow-xl shadow-slate-200/50">
              <div className="flex items-center justify-between mb-[0.875rem] shrink-0">
                <div>
                  <h3 className="text-[0.8125rem] font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <Activity size={14} className="text-indigo-500" /> Action Items
                  </h3>
                  <p className="text-[0.625rem] text-slate-400 font-bold uppercase tracking-widest mt-[0.125rem]">최근 활동 및 업무 추진 현황</p>
                </div>
                <button className="text-[10px] font-black text-slate-300 hover:text-slate-500 uppercase flex items-center gap-1 transition-colors">
                  All <ArrowRight size={10} />
                </button>
              </div>
              
              <div className="flex-1 min-h-0">
                <ActivityTimelineWidget onTaskClick={setSelectedTaskForDrawer} />
              </div>
            </Card>

            <TaskDrawer 
              task={selectedTaskForDrawer} 
              onClose={() => setSelectedTaskForDrawer(null)} 
            />
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
  const { shelters, addShelter, updateShelter, deleteShelter, deleteShelters } = useShelters();
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [filter, setFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState(initialFilter || '전체 지역');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShelterId, setEditingShelterId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [selectedShelterIds, setSelectedShelterIds] = useState<Set<string>>(new Set());

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

  const handleDeleteSelected = () => {
    if (window.confirm(`선택한 ${selectedShelterIds.size}개의 보호소 정보를 정말 삭제하시겠습니까? 관련 영업 데이터가 함께 삭제될 수 있습니다.`)) {
      deleteShelters(Array.from(selectedShelterIds));
      setSelectedShelterIds(new Set());
      if (selectedShelter && selectedShelterIds.has(selectedShelter.id)) {
        setSelectedShelter(null);
      }
      alert(`${selectedShelterIds.size}곳의 보호소 정보가 성공적으로 삭제되었습니다.`);
    }
  };

  const toggleSelectShelter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedShelterIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedShelterIds.size === filteredShelters.length && filteredShelters.length > 0) {
      setSelectedShelterIds(new Set());
    } else {
      setSelectedShelterIds(new Set(filteredShelters.map(s => s.id)));
    }
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
          <div className="flex items-center gap-2">
            {selectedShelterIds.size > 0 && (
              <button 
                onClick={handleDeleteSelected}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border border-rose-100 transition-all shadow-sm"
              >
                <Trash2 size={14} /> 선택 보호소 삭제 ({selectedShelterIds.size})
              </button>
            )}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#2D336B] hover:bg-[#1E234A] text-white px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus size={16} /> 신규 보호소 등록
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky top-0 z-20 border-b border-slate-100">
              <tr>
                <th className="px-4 py-4 w-[40px] text-center">
                  <button 
                    onClick={toggleSelectAll}
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-all mx-auto",
                      selectedShelterIds.size === filteredShelters.length && filteredShelters.length > 0
                        ? "bg-[#2D336B] border-[#2D336B] text-white" 
                        : "bg-white border-slate-300 text-transparent"
                    )}
                  >
                    <CheckCircle2 size={12} />
                  </button>
                </th>
                <th className="px-6 py-4 w-[20%]">보호소명</th>
                <th className="px-6 py-4 w-[10%]">지역</th>
                <th className="px-6 py-4 w-[10%] text-center">규모 (마리)</th>
                <th className="px-6 py-4 w-[15%]">대표자</th>
                <th className="px-6 py-4 w-[15%]">영업 단계</th>
                <th className="px-6 py-4 w-[15%]">마지막 컨택</th>
                <th className="px-6 py-4 text-right w-[10%]">기능</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredShelters.map((shelter) => {
                const isSelected = selectedShelterIds.has(shelter.id);
                return (
                  <tr 
                    key={shelter.id} 
                    onClick={() => setSelectedShelter(shelter)}
                    className={cn(
                      "hover:bg-slate-50/50 cursor-pointer transition-colors text-xs group relative",
                      selectedShelter?.id === shelter.id && "bg-slate-50 border-l-4 border-l-[#2D336B]",
                      isSelected && "bg-indigo-50/30"
                    )}
                  >
                    <td className="px-4 py-4 text-center">
                      <button 
                        onClick={(e) => toggleSelectShelter(shelter.id, e)}
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-all mx-auto",
                          isSelected 
                            ? "bg-[#2D336B] border-[#2D336B] text-white" 
                            : "bg-white border-slate-200 text-transparent group-hover:border-indigo-300"
                        )}
                      >
                        <CheckCircle2 size={12} />
                      </button>
                    </td>
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
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
            className="absolute top-0 right-0 w-[26.25rem] h-full bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col"
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
                  <Activity size={12} /> 영업 및 활동 기록 히스토리
                </h4>
                <div className="relative pl-6 space-y-6 border-l border-slate-100 ml-2 max-h-[30rem] overflow-y-auto pr-2 custom-scrollbar">
                   { ( [
                      ...CONTACT_HISTORY.filter(h => h.shelterId === selectedShelter.id).map(h => ({ date: h.date, msg: h.message, type: 'contact', status: undefined })),
                      ...MOCK_SALES_TASKS.filter(t => t.shelterId === selectedShelter.id).map(t => ({ date: t.deadline, msg: `[${t.category}] ${t.taskName}`, type: 'task', status: t.status }))
                     ] as any[] )
                     .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                     .map((item, idx) => (
                      <div key={idx} className="relative">
                         <div className={cn(
                           "absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-white border-2 shadow-sm",
                           item.type === 'task' ? "border-indigo-500 shadow-indigo-200" : "border-[#FF9F1C] shadow-orange-200"
                         )}></div>
                         <div>
                           <div className="flex items-center justify-between mb-1">
                             <p className="text-[9px] font-black text-slate-400 tracking-tighter">{item.date}</p>
                             {item.type === 'task' && (
                               <span className={cn(
                                 "text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter",
                                 item.status === '완료' ? "bg-green-50 text-green-600 border border-green-100" : "bg-slate-100 text-slate-500 border border-slate-200"
                               )}>
                                 {item.status === '완료' ? '완료' : '진행중'}
                               </span>
                             )}
                           </div>
                           <p className={cn(
                             "text-[11px] leading-relaxed font-medium p-2 rounded-lg border",
                             item.type === 'task' ? "bg-indigo-50/30 border-indigo-100/50 text-indigo-700" : "bg-slate-50/50 border-slate-100/50 text-slate-600"
                           )}>
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-[2rem]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsModalOpen(false);
                setEditingShelterId(null);
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-[32rem] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header - Fixed */}
              <div className="px-[1.5rem] py-[1.25rem] bg-[#2D336B] text-white flex justify-between items-center shrink-0 shadow-sm border-b border-white/10">
                <div className="flex items-center gap-[0.75rem]">
                  <div className="p-[0.5rem] bg-white/10 rounded-lg"><LayoutDashboard size={18} /></div>
                  <h3 className="text-[1rem] font-black tracking-tight leading-none">
                    {editingShelterId ? '보호소 정보 수정' : '신규 보호소 등록'}
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingShelterId(null);
                  }} 
                  className="w-[1.75rem] h-[1.75rem] rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer"
                >
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <form onSubmit={handleAddOrUpdateShelter} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                <div className="p-[1.5rem] space-y-[1.25rem] bg-white">
                  <div className="grid grid-cols-2 gap-[1rem]">
                    <div className="space-y-[0.375rem] flex flex-col">
                      <label className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest pl-[0.25rem]">보호소명 *</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="기관명을 입력하세요"
                        className="px-[1rem] py-[0.75rem] bg-slate-50 border border-slate-100 rounded-2xl text-[0.875rem] font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-[0.375rem] flex flex-col">
                      <label className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest pl-[0.25rem]">지역 (시/도) *</label>
                      <select 
                        value={formData.region}
                        onChange={e => setFormData({...formData, region: e.target.value})}
                        className="px-[1rem] py-[0.75rem] bg-slate-50 border border-slate-100 rounded-2xl text-[0.875rem] font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                      >
                        {REGIONAL_SHELTER_DATA.map(r => <option key={r.id}>{r.region}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-[0.375rem] flex flex-col">
                    <label className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest pl-[0.25rem]">상세 주소</label>
                    <input 
                      type="text" 
                      value={formData.detailedAddress}
                      onChange={e => setFormData({...formData, detailedAddress: e.target.value})}
                      placeholder="상세 주소를 기재하세요"
                      className="px-[1rem] py-[0.75rem] bg-slate-50 border border-slate-100 rounded-2xl text-[0.875rem] font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-[0.375rem] flex flex-col">
                    <label className="text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest pl-[0.25rem]">보호소 규모 (보호 마리수) *</label>
                    <input 
                      required
                      type="number" 
                      value={formData.size}
                      onChange={e => setFormData({...formData, size: parseInt(e.target.value) || 0})}
                      placeholder="0"
                      className="px-[1rem] py-[0.75rem] bg-slate-50 border border-slate-100 rounded-2xl text-[0.875rem] font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                    />
                  </div>

                  <div className="bg-slate-50 p-[1.5rem] rounded-2xl border border-slate-100 space-y-[1.25rem]">
                    <h4 className="text-[0.75rem] font-bold text-[#2D336B] flex items-center gap-[0.5rem] uppercase tracking-widest leading-none">
                      <ShieldCheck size={14} className="text-accent" /> 시설 상세 설정
                    </h4>
                    
                    <div className="space-y-[1rem]">
                      <h5 className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest pl-[0.25rem] flex items-center gap-[0.375rem]">
                        <Users size={12} /> 대표자 정보
                      </h5>
                      <div className="grid grid-cols-2 gap-[1rem]">
                        <input 
                          required
                          placeholder="이름" 
                          value={formData.representative}
                          onChange={e => setFormData({...formData, representative: e.target.value})}
                          className="px-[1rem] py-[0.625rem] bg-white border border-slate-200 rounded-xl text-[0.8125rem] focus:ring-2 focus:ring-accent/20 outline-none"
                        />
                        <select 
                          value={formData.representativeGender}
                          onChange={e => setFormData({...formData, representativeGender: e.target.value as any})}
                          className="px-[1rem] py-[0.625rem] bg-white border border-slate-200 rounded-xl text-[0.8125rem] focus:ring-2 focus:ring-accent/20 outline-none cursor-pointer"
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
                          className="col-span-2 px-[1rem] py-[0.625rem] bg-white border border-slate-200 rounded-xl text-[0.8125rem] focus:ring-2 focus:ring-accent/20 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-[1rem]">
                      <h5 className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest pl-[0.25rem] flex items-center gap-[0.375rem]">
                        <Users size={12} /> 매니저/실무자 정보 (선택)
                      </h5>
                      <div className="grid grid-cols-2 gap-[1rem]">
                        <input 
                          placeholder="이름" 
                          value={formData.managerName}
                          onChange={e => setFormData({...formData, managerName: e.target.value})}
                          className="px-[1rem] py-[0.625rem] bg-white border border-slate-200 rounded-xl text-[0.8125rem] focus:ring-2 focus:ring-accent/20 outline-none"
                        />
                        <select 
                          value={formData.managerGender}
                          onChange={e => setFormData({...formData, managerGender: e.target.value as any})}
                          className="px-[1rem] py-[0.625rem] bg-white border border-slate-200 rounded-xl text-[0.8125rem] focus:ring-2 focus:ring-accent/20 outline-none cursor-pointer"
                        >
                          <option value="Male">남성</option>
                          <option value="Female">여성</option>
                        </select>
                        <input 
                          placeholder="연락처" 
                          value={formData.managerPhone}
                          type="tel"
                          onChange={e => setFormData({...formData, managerPhone: e.target.value})}
                          className="col-span-2 px-[1rem] py-[0.625rem] bg-white border border-slate-200 rounded-xl text-[0.8125rem] focus:ring-2 focus:ring-accent/20 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer - Sticky */}
                <div className="p-[1.5rem] bg-slate-50 border-t border-slate-100 flex gap-[0.75rem] sticky bottom-0 shrink-0">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingShelterId(null);
                    }}
                    className="flex-1 py-[0.875rem] bg-white border border-slate-200 text-slate-500 font-black text-[0.75rem] rounded-2xl hover:bg-slate-100 transition-all active:scale-[0.98]"
                  >
                    취소
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-[0.875rem] bg-[#2D336B] text-white font-black text-[0.75rem] rounded-2xl shadow-xl shadow-indigo-900/20 hover:scale-[1.01] active:scale-[0.98] transition-all"
                  >
                    {editingShelterId ? '변경 사항 저장' : '보호소 등록 완료'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Layout Component ---

export default function ShelterDashboard() {
  const { shelters } = useShelters();
  const [activeView, setActiveView] = useState<'dashboard' | 'crm' | 'donations' | 'activities' | 'inventory' | 'settings' | 'products' | 'partners' | 'sales'>('dashboard');
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
      case 'activities': return <ActivityLogManagementView />;
      case 'partners': return <PartnerManagement />;
      case 'products': return <ProductRegistry />;
      case 'sales': return <SalesTaskManager />;
      case 'settings': return <div className="p-10 text-center flex flex-col items-center justify-center h-full"><Settings size={48} className="text-slate-100 mb-4 animate-spin-slow" /><h3 className="text-slate-400 font-bold uppercase tracking-widest">환경 설정 콘솔</h3><p className="text-xs text-slate-300 mt-2 italic">모듈 유지 관리 중...</p></div>;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {/* Sidebar - Proportional Scaling */}
      <aside className="w-[14rem] bg-white border-r border-slate-200 flex flex-col shrink-0 z-50">
        <div className="p-[1.75rem] flex items-center gap-[0.75rem] mb-[1.5rem]">
          <div className="w-[2.75rem] h-[2.75rem] bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 border border-white/20">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-[1.25rem] tracking-tighter text-slate-800 leading-none">쉘터플로우</span>
            <span className="text-[0.5625rem] font-black text-accent tracking-[.25em] uppercase mt-[0.25rem] leading-none">네트워크 ERP</span>
          </div>
        </div>
        
        <nav className="flex-1 px-[1.25rem] space-y-[0.5rem] overflow-y-auto custom-scrollbar">
          <SidebarItem 
            icon={LayoutDashboard} 
            active={activeView === 'dashboard'} 
            label="대시보드" 
            onClick={() => setActiveView('dashboard')}
          />
          <SidebarItem 
            icon={Activity} 
            active={activeView === 'sales'} 
            label="영업 및 협력 관리" 
            onClick={() => setActiveView('sales')}
          />
          <SidebarItem 
            icon={Briefcase} 
            active={activeView === 'donations'} 
            label="프로젝트 관리" 
            onClick={() => setActiveView('donations')}
          />
          <SidebarItem 
            icon={FileText} 
            active={activeView === 'activities'} 
            label="일지 관리" 
            onClick={() => setActiveView('activities')}
          />
          <SidebarItem 
            icon={Package} 
            active={activeView === 'inventory'} 
            label="수불/물류 관리" 
            onClick={() => setActiveView('inventory')}
          />
          
          <div className="pt-[1.5rem] pb-[0.5rem] px-[0.75rem] text-[0.625rem] font-black text-slate-300 uppercase tracking-widest">기초 정보 관리</div>
          <SidebarItem 
            icon={Users} 
            active={activeView === 'crm'} 
            label="보호소 등록/관리" 
            onClick={() => { setActiveView('crm'); setCrmFilter(''); }}
          />
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

          <div className="pt-[1.5rem] pb-[0.5rem] px-[0.75rem] text-[0.625rem] font-black text-slate-300 uppercase tracking-widest">지원</div>
          <SidebarItem 
            icon={Settings} 
            active={activeView === 'settings'} 
            label="설정" 
            onClick={() => setActiveView('settings')}
          />
        </nav>

        <div className="p-[1.25rem] mt-auto bg-slate-50/50 border-t border-slate-100">
          <div className="flex items-center gap-[0.75rem] p-[0.75rem] bg-white rounded-xl shadow-sm border border-slate-200 group">
            <div className="relative">
               <img 
                 src="https://api.dicebear.com/7.x/avataaars/svg?seed=Carlis" 
                 alt="Avatar" 
                 className="w-[2.5rem] h-[2.5rem] rounded-lg bg-slate-100 border border-slate-200 object-cover p-[0.125rem] transition-transform group-hover:scale-105"
               />
               <div className="absolute -bottom-[0.25rem] -right-[0.25rem] w-[0.75rem] h-[0.75rem] bg-green-500 rounded-full border-2 border-white shadow-sm ring-1 ring-green-100"></div>
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-[0.6875rem] font-black text-slate-800 truncate">카를리스 볼롬보이</p>
              <p className="text-[0.5625rem] text-slate-400 font-bold uppercase tracking-tighter">지역 총괄 이사</p>
            </div>
            <button className="text-slate-300 hover:text-red-400 transition-colors p-[0.25rem] rounded-md hover:bg-red-50">
               <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-100 relative min-w-0">
        <div className="absolute inset-0 bg-[radial-gradient(#80BCBD15_1px,transparent_1px)] [background-size:1.25rem_1.25rem] pointer-events-none opacity-50"></div>
        
        {/* Header - Integrated & Clean */}
        <header className="h-[4.5rem] bg-white border-b border-slate-200 px-[2.5rem] flex items-center justify-between flex-shrink-0 z-40 shadow-sm shadow-slate-200/20 sticky top-0">
          <div className="flex items-center gap-[1rem]">
             <div className="w-[0.375rem] h-[1.5rem] bg-accent rounded-full shadow-[0_0_0.5rem_rgba(128,188,189,0.5)]"></div>
             <h1 className="text-[1.25rem] font-black text-slate-800 tracking-tight capitalize antialiased">
                {activeView === 'crm' ? '보호소 마스터 명부' : 
                 activeView === 'donations' ? '프로젝트 생애주기 관리' : 
                 activeView === 'inventory' ? '보호소별 수불부 관리' : 
                 activeView === 'activities' ? '일지 및 활동 관리' : 
                 activeView === 'partners' ? '파트너 마스터 관리' : 
                 activeView === 'dashboard' ? '대시보드 개요' :
                 activeView === 'products' ? '상품 기초 데이터 등록' :
                 activeView === 'sales' ? '영업 및 협력 테스크 관리' :
                 activeView.replace(/([A-Z])/g, ' $1').trim()}
             </h1>
          </div>
          <div className="flex items-center gap-[1.75rem] text-slate-800">
            <div className="relative group hidden md:block">
              <Search className="absolute left-[1rem] top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-accent" size={16} />
              <input 
                type="text" 
                placeholder="전체 네트워크 검색..." 
                className="bg-slate-50 border border-slate-200/60 rounded-full py-[0.625rem] pl-[2.75rem] pr-[1.25rem] text-[0.6875rem] font-medium w-[18rem] focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all shadow-inner"
              />
            </div>
            <div className="flex items-center gap-[1rem] border-l border-slate-100 pl-[1.75rem]">
              <button className="relative p-[0.625rem] bg-slate-50 rounded-xl hover:bg-white hover:shadow-md border border-slate-100 transition-all text-slate-500 cursor-pointer group">
                <Bell size={20} className="group-hover:text-accent transition-colors" />
                <span className="absolute top-[0.5rem] right-[0.5rem] w-[0.625rem] h-[0.625rem] bg-red-500 rounded-full ring-2 ring-white border border-red-200 shadow-sm"></span>
              </button>
              <button className="flex items-center gap-[0.5rem] p-[0.25rem] pr-[0.75rem] bg-slate-900 rounded-full text-white shadow-lg shadow-slate-900/10 hover:opacity-90 active:scale-95 transition-all">
                  <div className="w-[2rem] h-[2rem] rounded-full bg-accent flex items-center justify-center font-black text-[0.625rem]">SF</div>
                  <span className="text-[0.625rem] font-black uppercase tracking-wider">빠른 작업</span>
              </button>
            </div>
          </div>
        </header>

        {/* View Content Area */}
        <div className="flex-1 overflow-hidden p-[2.5rem] flex flex-col gap-[1.5rem] relative z-10">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeView}
                    initial={{ opacity: 0, scale: 0.99, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.99, y: -10 }}
                    transition={{ duration: 0.3, ease: 'circOut' }}
                    className="h-full flex flex-col overflow-hidden"
                >
                    {renderView()}
                </motion.div>
            </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
