import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  Clock, 
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  Users,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Tag,
  MapPin,
  X,
  LayoutGrid,
  List as ListIcon,
  RefreshCcw,
  CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { 
  MOCK_SHELTERS, 
  MOCK_SALES_TASKS, 
  SalesTask, 
  SalesTaskCategory, 
  SalesTaskPriority,
  SalesTaskStatus,
  RecurringType,
  SubTask
} from '../mockData';
import { PARTNER_MASTER_DATA } from '../partnerMasterData';
import { useShelters } from '../context/ShelterContext';
import { cn } from '../lib/utils';

const CATEGORIES: SalesTaskCategory[] = ['방문 영업', '유선 상담', '물류 협의', '이벤트 기획', '기타'];
const PRIORITIES: SalesTaskPriority[] = ['높음', '보통', '낮음'];
const STATUSES: SalesTaskStatus[] = ['대기', '진행중', '보류', '완료'];

type ViewMode = 'List' | 'Kanban';

export default function SalesTaskManager() {
  const { shelters } = useShelters();
  const [tasks, setTasks] = useState<SalesTask[]>(MOCK_SALES_TASKS);
  const [viewMode, setViewMode] = useState<ViewMode>('List');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [shelterFilter, setShelterFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<SalesTask | null>(null);

  // Subtask Accordion State
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Searchable Shelter Selection for Modal
  const [shelterSearch, setShelterSearch] = useState('');
  const [isShelterDropdownOpen, setIsShelterDropdownOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<SalesTask>>({
    shelterId: '',
    category: '방문 영업',
    taskName: '',
    description: '',
    partnerIds: [],
    deadline: '',
    priority: '보통',
    status: '대기',
    recurring: 'None',
    subTasks: []
  });

  const filteredSheltersForSelect = useMemo(() => {
    return shelters.filter(s => s.name.toLowerCase().includes(shelterSearch.toLowerCase()));
  }, [shelters, shelterSearch]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const shelter = shelters.find(s => s.id === task.shelterId);
      const matchesSearch = task.taskName.toLowerCase().includes(search.toLowerCase()) || 
                          shelter?.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || task.category === categoryFilter;
      const matchesShelter = shelterFilter === 'All' || task.shelterId === shelterFilter;
      return matchesSearch && matchesCategory && matchesShelter;
    }).sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());
  }, [tasks, search, categoryFilter, shelterFilter, shelters]);

  const handleOpenModal = (task?: SalesTask) => {
    if (task) {
      setEditingTask(task);
      setFormData(task);
      // Try to find the name for the search input
      const shelter = shelters.find(s => s.id === task.shelterId);
      const partner = PARTNER_MASTER_DATA.find(p => p.id === task.shelterId);
      if (shelter) setShelterSearch(`[보호소] ${shelter.name}`);
      else if (partner) setShelterSearch(`[파트너] ${partner.name}`);
      else setShelterSearch(task.shelterId || '');
    } else {
      setEditingTask(null);
      setFormData({
        shelterId: '',
        category: '방문 영업',
        taskName: '',
        description: '',
        partnerIds: [],
        deadline: new Date().toISOString().split('T')[0],
        priority: '보통',
        status: '대기',
        recurring: 'None',
        subTasks: []
      });
      setShelterSearch('');
    }
    setIsModalOpen(true);
  };

  const combinedTargets = useMemo(() => {
    const shelterList = shelters.map(s => ({ id: s.id, name: `[보호소] ${s.name}`, type: 'shelter', region: s.region }));
    const partnerList = PARTNER_MASTER_DATA.map(p => ({ id: p.id, name: `[파트너] ${p.name}`, type: 'partner', region: p.type }));
    return [...shelterList, ...partnerList];
  }, [shelters]);

  const filteredTargetsForSelect = useMemo(() => {
    return combinedTargets.filter(t => t.name.toLowerCase().includes(shelterSearch.toLowerCase()));
  }, [combinedTargets, shelterSearch]);

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    // Allow manual input if nothing selected from dropdown
    const targetId = formData.shelterId || shelterSearch;
    if (!targetId || !formData.taskName || !formData.deadline) return;

    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...formData, shelterId: targetId } as SalesTask : t));
    } else {
      const newTask: SalesTask = {
        id: `t-${Date.now()}`,
        shelterId: targetId,
        category: formData.category as SalesTaskCategory,
        taskName: formData.taskName!,
        description: formData.description || '',
        partnerIds: formData.partnerIds || [],
        deadline: formData.deadline!,
        priority: formData.priority as SalesTaskPriority,
        status: formData.status as SalesTaskStatus || '대기',
        recurring: formData.recurring as RecurringType || 'None',
        subTasks: formData.subTasks || [],
        createdAt: new Date().toISOString().split('T')[0]
      };
      setTasks(prev => [newTask, ...prev]);
    }
    setIsModalOpen(false);
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === '완료' ? '대기' : '완료' } : t));
  };

  const toggleSubTask = (taskId: string, subTaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId && t.subTasks) {
        return {
          ...t,
          subTasks: t.subTasks.map(st => st.id === subTaskId ? { ...st, isCompleted: !st.isCompleted } : st)
        };
      }
      return t;
    }));
  };

  const moveTask = (taskId: string, newStatus: SalesTaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const toggleExpand = (taskId: string) => {
    const next = new Set(expandedTasks);
    if (next.has(taskId)) next.delete(taskId);
    else next.add(taskId);
    setExpandedTasks(next);
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date() && new Date(deadline).toDateString() !== new Date().toDateString();
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Search & Filter Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          {/* View Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
            <button 
              onClick={() => setViewMode('List')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all",
                viewMode === 'List' ? "bg-white text-accent shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <ListIcon size={14} /> 리스트
            </button>
            <button 
              onClick={() => setViewMode('Kanban')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all",
                viewMode === 'Kanban' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <LayoutGrid size={14} /> 보드
            </button>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="업무명 또는 보호소 검색..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs w-64 focus:ring-2 focus:ring-accent/10 outline-none transition-all font-bold"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select 
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none"
            >
              <option value="All">모든 업무</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select 
              value={shelterFilter}
              onChange={e => setShelterFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none max-w-[150px]"
            >
              <option value="All">모든 보호소</option>
              {shelters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <button 
          onClick={() => handleOpenModal()}
          className="bg-accent hover:bg-accent/90 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-accent/20 flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus size={18} /> 새 업무 등록
        </button>
      </div>

      {/* Task Content: List or Kanban */}
      <div className="flex-1 min-h-0">
        {viewMode === 'List' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 w-12 text-center">상태</th>
                    <th className="px-6 py-4 w-8"></th>
                    <th className="px-6 py-4">대상 보호소</th>
                    <th className="px-6 py-4">업무 구분</th>
                    <th className="px-6 py-4">테스크명</th>
                    <th className="px-6 py-4">협력 파트너</th>
                    <th className="px-6 py-4">마감 기한</th>
                    <th className="px-6 py-4">우선순위</th>
                    <th className="px-6 py-4 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTasks.map((task) => {
                    const shelter = shelters.find(s => s.id === task.shelterId);
                    const overdue = task.status !== '완료' && isOverdue(task.deadline);
                    const isExpanded = expandedTasks.has(task.id);
                    const subTasksCount = task.subTasks?.length || 0;
                    const completedSubTasks = task.subTasks?.filter(st => st.isCompleted).length || 0;
                    const progress = subTasksCount > 0 ? (completedSubTasks / subTasksCount) * 100 : 0;
                    
                    return (
                      <React.Fragment key={task.id}>
                        <tr className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => toggleTaskStatus(task.id)}
                              className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                task.status === '완료' 
                                  ? "bg-green-500 border-green-500 text-white" 
                                  : "border-slate-200 text-transparent hover:border-accent"
                              )}
                            >
                              <CheckCircle2 size={12} />
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            {subTasksCount > 0 && (
                              <button 
                                onClick={() => toggleExpand(task.id)}
                                className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
                              >
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <MapPin size={12} className="text-slate-300" />
                              <span className="text-xs font-bold text-slate-700">{shelter?.name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-lg text-[10px] font-black",
                              task.category === '방문 영업' ? "bg-blue-50 text-blue-600" :
                              task.category === '유선 상담' ? "bg-amber-50 text-amber-600" :
                              task.category === '물류 협의' ? "bg-purple-50 text-purple-600" :
                              task.category === '이벤트 기획' ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-500"
                            )}>
                              {task.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className={cn(
                                "text-xs font-bold text-slate-800",
                                task.status === '완료' && "text-slate-400 line-through"
                              )}>
                                {task.taskName}
                              </span>
                              {subTasksCount > 0 && (
                                <div className="mt-1.5 flex items-center gap-2">
                                  <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-indigo-500" 
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] font-black text-slate-400">{completedSubTasks}/{subTasksCount}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex -space-x-2">
                              {task.partnerIds && task.partnerIds.length > 0 ? (
                                task.partnerIds.map(pid => {
                                  const partner = PARTNER_MASTER_DATA.find(p => p.id === pid);
                                  return (
                                    <div key={pid} title={partner?.name} className="w-7 h-7 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center text-[10px] font-black text-indigo-500 shadow-sm">
                                      {partner?.name.charAt(0)}
                                    </div>
                                  )
                                })
                              ) : (
                                <span className="text-[10px] font-bold text-slate-300 uppercase italic">N/A</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {task.recurring && task.recurring !== 'None' && (
                                <RefreshCcw size={10} className="text-indigo-400" />
                              )}
                              <div className="flex items-center gap-1.5">
                                <Clock size={12} className={cn(overdue ? "text-red-500 animate-pulse" : "text-slate-300")} />
                                <span className={cn(
                                  "text-xs font-bold font-mono tracking-tighter",
                                  overdue ? "text-red-500" : "text-slate-500"
                                )}>
                                  {task.deadline}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                task.priority === '높음' ? "bg-red-500" :
                                task.priority === '보통' ? "bg-amber-500" : "bg-slate-300"
                              )} />
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{task.priority}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleOpenModal(task)}
                              className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-300 hover:text-slate-700"
                            >
                              <MoreVertical size={16} />
                            </button>
                          </td>
                        </tr>
                        <AnimatePresence>
                          {isExpanded && task.subTasks && (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-indigo-50/20"
                            >
                              <td colSpan={9} className="px-16 py-3">
                                <div className="space-y-2 pb-2">
                                  {task.subTasks.map(st => (
                                    <div key={st.id} className="flex items-center gap-3">
                                      <button 
                                        onClick={() => toggleSubTask(task.id, st.id)}
                                        className={cn(
                                          "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                          st.isCompleted ? "bg-indigo-500 border-indigo-500 text-white" : "border-slate-300 text-transparent"
                                        )}
                                      >
                                        <CheckSquare size={10} />
                                      </button>
                                      <span className={cn(
                                        "text-[11px] font-medium",
                                        st.isCompleted ? "text-slate-400 line-through" : "text-slate-600"
                                      )}>
                                        {st.title}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center opacity-30">
                          <Search size={48} className="mb-4" />
                          <p className="text-sm font-black uppercase tracking-widest">검색 결과가 없습니다</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex gap-6 h-full overflow-x-auto pb-6 custom-scrollbar px-1">
            {STATUSES.map(status => (
              <div key={status} className="flex-1 min-w-[300px] flex flex-col bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      status === '대기' ? "bg-slate-400" :
                      status === '진행중' ? "bg-blue-500" :
                      status === '보류' ? "bg-amber-500" : "bg-green-500"
                    )} />
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">{status}</h4>
                    <span className="text-[10px] font-bold text-slate-400 ml-1">{tasks.filter(t => t.status === status).length}</span>
                  </div>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
                  {filteredTasks.filter(t => t.status === status).map(task => {
                    const shelter = shelters.find(s => s.id === task.shelterId);
                    return (
                      <motion.div 
                        key={task.id}
                        layoutId={task.id}
                        onClick={() => handleOpenModal(task)}
                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-accent/40 transition-all cursor-pointer group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter",
                            task.priority === '높음' ? "bg-red-50 text-red-600" :
                            task.priority === '보통' ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"
                          )}>
                            {task.priority}
                          </span>
                          <span className="text-[9px] font-bold text-slate-300">{task.category}</span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-800 mb-1 leading-tight">{task.taskName}</h5>
                        <p className="text-[10px] text-slate-400 font-medium mb-3 line-clamp-2">{task.description}</p>
                        
                        <div className="flex justify-between items-center mt-auto border-t border-slate-50 pt-3">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={10} className="text-slate-300" />
                            <span className="text-[10px] font-bold text-slate-500 truncate max-w-[100px]">{shelter?.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400">
                             <Calendar size={10} />
                             <span className="text-[9px] font-mono font-bold tracking-tighter">{task.deadline.slice(5)}</span>
                          </div>
                        </div>
                        
                        {/* Status Quick Select for Kanban simulation */}
                        <div className="hidden group-hover:flex gap-1 mt-3 pt-3 border-t border-slate-50">
                          {STATUSES.filter(s => s !== status).map(s => (
                            <button 
                              key={s}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveTask(task.id, s);
                              }}
                              className="text-[8px] font-black text-slate-400 hover:text-accent bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 transition-colors"
                            >
                              {s}(으)로 이동
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Creation Modal */}
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
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 bg-accent text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-white/10 rounded-lg">
                      <Plus size={18} />
                   </div>
                   <h3 className="text-lg font-black tracking-tight leading-none">
                     {editingTask ? '업무 상세 수정' : '신규 업무 등록'}
                   </h3>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveTask} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                <div className="p-6 space-y-4">
                  {/* Row 1: Task Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">업무명 *</label>
                    <input 
                      autoFocus
                      required
                      type="text" 
                      value={formData.taskName}
                      onChange={e => setFormData({...formData, taskName: e.target.value})}
                      placeholder="수행할 업무 제목을 입력하세요"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all shadow-inner placeholder:text-slate-300"
                    />
                  </div>

                  {/* Row 2: Target / Category */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 relative">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">업무 대상 (보호소/파트너) *</label>
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input 
                          type="text"
                          placeholder="검색하거나 직접 입력하세요..."
                          value={shelterSearch}
                          onFocus={() => setIsShelterDropdownOpen(true)}
                          onChange={e => {
                            setShelterSearch(e.target.value);
                            setIsShelterDropdownOpen(true);
                          }}
                          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                        />
                        
                        <AnimatePresence>
                          {isShelterDropdownOpen && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar p-1"
                            >
                              {filteredTargetsForSelect.length > 0 ? (
                                filteredTargetsForSelect.map(s => (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => {
                                      setFormData({...formData, shelterId: s.id});
                                      setShelterSearch(s.name);
                                      setIsShelterDropdownOpen(false);
                                    }}
                                    className={cn(
                                      "w-full px-3 py-2 text-left hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between group",
                                      formData.shelterId === s.id && "bg-accent/5 text-accent"
                                    )}
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-[11px] font-bold">{s.name}</span>
                                      <span className="text-[9px] text-slate-400 font-medium">{s.region}</span>
                                    </div>
                                    {formData.shelterId === s.id && <CheckCircle2 size={12} />}
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">검색 결과가 없습니다</div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">업무 구분 *</label>
                      <select 
                        required
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value as SalesTaskCategory})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all cursor-pointer"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Schedule / Priority */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">마감 기한 *</label>
                      <div className="relative">
                        <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          required
                          type="date" 
                          value={formData.deadline}
                          onChange={e => setFormData({...formData, deadline: e.target.value})}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">우선 순위</label>
                      <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                        {PRIORITIES.map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setFormData({...formData, priority: p})}
                            className={cn(
                              "py-1.5 rounded-lg text-[10px] font-black transition-all",
                              formData.priority === p 
                                ? "bg-white text-slate-800 shadow-sm" 
                                : "text-slate-400 hover:text-slate-600"
                            )}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Status / Recurring */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">진행 상태</label>
                      <select 
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as SalesTaskStatus})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all cursor-pointer"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">반복 업무 설정</label>
                      <select 
                        value={formData.recurring}
                        onChange={e => setFormData({...formData, recurring: e.target.value as RecurringType})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all cursor-pointer"
                      >
                        <option value="None">안 함</option>
                        <option value="Weekly">매주</option>
                        <option value="Monthly">매월 특정일</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 5: Detailed Content */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">세부 내용</label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="특이사항이나 구체적인 업무 내용을 입력하세요..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all resize-none h-20 placeholder:text-slate-300"
                    />
                  </div>

                  {/* Row 6: Subtasks / Partners */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">세부 체크리스트</label>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 max-h-32 overflow-y-auto">
                        {formData.subTasks?.map((st, idx) => (
                          <div key={st.id} className="flex items-center gap-2">
                             <input 
                               type="text"
                               value={st.title}
                               onChange={e => {
                                 const next = [...(formData.subTasks || [])];
                                 next[idx].title = e.target.value;
                                 setFormData({...formData, subTasks: next});
                               }}
                               className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-medium outline-none"
                             />
                             <button 
                               type="button"
                               onClick={() => setFormData({...formData, subTasks: formData.subTasks?.filter(s => s.id !== st.id)})}
                               className="text-slate-300 hover:text-red-500 transition-colors"
                             >
                               <X size={12} />
                             </button>
                          </div>
                        ))}
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, subTasks: [...(formData.subTasks || []), { id: `st-${Date.now()}`, title: '', isCompleted: false }]})}
                          className="text-[10px] font-black text-indigo-500 flex items-center gap-1 hover:underline"
                        >
                          <Plus size={12} /> 항목 추가
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">협력 파트너 (선택)</label>
                      <div className="grid grid-cols-1 gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100 max-h-32 overflow-y-auto">
                        {PARTNER_MASTER_DATA.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              const current = formData.partnerIds || [];
                              const next = current.includes(p.id) ? current.filter(id => id !== p.id) : [...current, p.id];
                              setFormData({...formData, partnerIds: next});
                            }}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all text-left",
                              formData.partnerIds?.includes(p.id) ? "bg-white border-indigo-200 shadow-sm" : "bg-transparent border-transparent"
                            )}
                          >
                             <div className={cn(
                               "w-3 h-3 rounded flex items-center justify-center border",
                               formData.partnerIds?.includes(p.id) ? "bg-indigo-500 border-indigo-500" : "bg-white border-slate-300"
                             )}>
                               {formData.partnerIds?.includes(p.id) && <CheckSquare className="text-white" size={10} />}
                             </div>
                             <span className={cn("text-[10px] font-bold", formData.partnerIds?.includes(p.id) ? "text-indigo-600" : "text-slate-400")}>{p.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 sticky bottom-0">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 font-black text-xs rounded-xl hover:bg-slate-100 transition-all active:scale-[0.98]"
                  >
                    취소
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-3 bg-accent text-white font-black text-xs rounded-xl shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {editingTask ? '변경 사항 저장' : '업무 등록 완료'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
