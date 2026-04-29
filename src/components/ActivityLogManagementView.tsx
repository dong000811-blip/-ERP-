import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  MapPin, 
  Calendar, 
  Plus, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Users, 
  Plane, 
  MessageSquare, 
  Tag, 
  PlusCircle, 
  Trash2, 
  Camera, 
  Wallet,
  ArrowRight,
  Printer,
  Download,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  ActivityLog, 
  Shelter 
} from '../mockData';
import { useShelters } from '../context/ShelterContext';
import { useFirestore } from '../FirestoreContext';
import { ModalWrapper } from './ModalWrapper';

export default function ActivityLogManagementView() {
  const { shelters } = useShelters();
  const { logs, deleteDocuments, addDocument, partners } = useFirestore();
  const [activeTab, setActiveTab] = useState<'All' | 'Meeting' | 'Travel'>('All');
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isTravelModalOpen, setIsTravelModalOpen] = useState(false);
  const [selectedLogForDocument, setSelectedLogForDocument] = useState<ActivityLog | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set());

  const filteredLogs = useMemo(() => {
    if (activeTab === 'All') return logs;
    return logs.filter(log => log.type === activeTab);
  }, [logs, activeTab]);

  const handleDeleteSelected = async () => {
    if (window.confirm(`기록된 ${selectedLogIds.size}개의 업무 이력이 영구 삭제됩니다. 계속하시겠습니까?`)) {
      try {
        await deleteDocuments('logs', Array.from(selectedLogIds));
        setSelectedLogIds(new Set());
      } catch (error) {
        console.error(error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleSaveLog = async (log: ActivityLog) => {
    try {
      await addDocument('logs', log);
    } catch (error) {
      console.error(error);
      alert('로그 저장 중 오류가 발생했습니다.');
    }
  };

  const toggleSelectLog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLogIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedLogIds.size === filteredLogs.length && filteredLogs.length > 0) {
      setSelectedLogIds(new Set());
    } else {
      setSelectedLogIds(new Set(filteredLogs.map(l => l.id)));
    }
  };

  return (
    <div className="flex flex-col h-full gap-[1rem]">
      {/* Header Actions */}
      <div className="flex justify-between items-end shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex gap-[0.5rem] p-[0.25rem] bg-white border border-slate-200 rounded-xl shadow-sm">
            {(['All', 'Meeting', 'Travel'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-[1rem] py-[0.375rem] rounded-lg text-[0.6875rem] font-black transition-all",
                  activeTab === tab 
                    ? "bg-[#2D336B] text-white shadow-md shadow-indigo-200" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab === 'All' ? '전체' : tab === 'Meeting' ? '회의록' : '출장 일지'}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {selectedLogIds.size > 0 && (
              <motion.button 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-6 py-[0.5rem] bg-rose-50 text-rose-600 rounded-xl text-[0.6875rem] font-black border border-rose-100 hover:bg-rose-100 transition-all shadow-sm"
              >
                <Trash2 size={14} /> 선택 일지 삭제 ({selectedLogIds.size})
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-[0.75rem]">
          <button 
            onClick={() => setIsMeetingModalOpen(true)}
            className="px-[1.25rem] py-[0.625rem] bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[0.6875rem] font-black flex items-center gap-[0.5rem] shadow-lg shadow-blue-100 transition-all border border-blue-500/20"
          >
            <Plus size={16} /> 신규 회의록 작성
          </button>
          <button 
            onClick={() => setIsTravelModalOpen(true)}
            className="px-[1.25rem] py-[0.625rem] bg-[#FF9F1C] hover:bg-[#E68A00] text-white rounded-xl text-[0.6875rem] font-black flex items-center gap-[0.5rem] shadow-lg shadow-orange-100 transition-all border border-orange-500/20"
          >
            <Plus size={16} /> 신규 출장 일지 작성
          </button>
        </div>
      </div>

      {/* Main List Table */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="overflow-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 text-[0.625rem] font-black text-slate-400 uppercase tracking-[0.15em] sticky top-0 z-10 border-b border-slate-100">
              <tr>
                <th className="px-[1rem] py-[1rem] w-[3rem] text-center">
                  <button 
                    onClick={toggleSelectAll}
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-all mx-auto",
                      selectedLogIds.size === filteredLogs.length && filteredLogs.length > 0
                        ? "bg-[#2D336B] border-[#2D336B] text-white" 
                        : "bg-white border-slate-300 text-transparent"
                    )}
                  >
                    <CheckCircle2 size={12} />
                  </button>
                </th>
                <th className="px-[1.5rem] py-[1rem] w-[6rem]">분류</th>
                <th className="px-[1.5rem] py-[1rem]">제목</th>
                <th className="px-[1.5rem] py-[1rem]">대상 / 장소</th>
                <th className="px-[1.5rem] py-[1rem] w-[8rem]">일시</th>
                <th className="px-[1.5rem] py-[1rem] w-[8rem]">상태</th>
                <th className="px-[1.5rem] py-[1rem] w-[3rem] text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.map((log) => {
                const isSelected = selectedLogIds.has(log.id);
                return (
                  <tr 
                    key={log.id} 
                    onClick={() => {
                      setSelectedLogForDocument(log);
                      setIsDocumentModalOpen(true);
                    }}
                    className={cn(
                      "hover:bg-slate-50/50 group transition-colors cursor-pointer",
                      isSelected && "bg-indigo-50/30"
                    )}
                  >
                    <td className="px-[1rem] py-[1rem] text-center">
                      <button 
                        onClick={(e) => toggleSelectLog(log.id, e)}
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-all mx-auto",
                          isSelected 
                            ? "bg-[#2D336B] border-[#2D336B] text-white" 
                            : "bg-white border-slate-200 text-transparent group-hover:border-[#2D336B]/30"
                        )}
                      >
                        <CheckCircle2 size={12} />
                      </button>
                    </td>
                    <td className="px-[1.5rem] py-[1rem]">
                    <div className={cn(
                      "flex items-center justify-center w-[2.25rem] h-[2.25rem] rounded-xl border shadow-sm",
                      log.type === 'Meeting' ? "bg-blue-50 border-blue-100 text-blue-500" : "bg-orange-50 border-orange-100 text-orange-500"
                    )}>
                      {log.type === 'Meeting' ? <MessageSquare size={16} /> : <Plane size={16} />}
                    </div>
                  </td>
                  <td className="px-[1.5rem] py-[1rem]">
                    <div className="flex flex-col">
                      <span className="text-[0.875rem] font-bold text-slate-800 tracking-tight group-hover:text-[#2D336B] transition-colors">{log.title}</span>
                      <span className="text-[0.625rem] text-slate-400 font-medium">{log.type === 'Meeting' ? '파트너 미팅 기록' : '순회 출장 일지'}</span>
                    </div>
                  </td>
                  <td className="px-[1.5rem] py-[1rem]">
                    <div className="flex flex-col gap-[0.25rem]">
                      <div className="flex items-center gap-[0.375rem] text-[0.75rem] font-bold text-slate-600">
                        <Users size={12} className="text-slate-400" /> {log.target}
                      </div>
                      <div className="flex items-center gap-[0.375rem] text-[0.625rem] text-slate-400 font-medium italic">
                        <MapPin size={10} /> {log.location}
                      </div>
                    </div>
                  </td>
                  <td className="px-[1.5rem] py-[1rem]">
                    <span className="text-[0.6875rem] font-mono font-bold text-slate-500 tracking-tight">{log.date}</span>
                  </td>
                  <td className="px-[1.5rem] py-[1rem]">
                    <span className={cn(
                      "px-[0.625rem] py-[0.25rem] rounded-full text-[0.5625rem] font-black uppercase tracking-tight inline-flex items-center gap-[0.375rem]",
                      log.status === '완료' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                      log.status === '후속 업무 진행 중' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                      "bg-slate-100 text-slate-500 border border-slate-200"
                    )}>
                      <span className={cn(
                        "w-[0.25rem] h-[0.25rem] rounded-full",
                        log.status === '완료' ? "bg-emerald-500" :
                        log.status === '후속 업무 진행 중' ? "bg-blue-500" : "bg-slate-400"
                      )} />
                      {log.status}
                    </span>
                  </td>
                  <td className="px-[1.5rem] py-[1rem] text-right">
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-all group-hover:translate-x-1" />
                  </td>
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isMeetingModalOpen && (
          <MeetingLogModal 
            isOpen={isMeetingModalOpen} 
            onClose={() => setIsMeetingModalOpen(false)} 
            onSave={handleSaveLog}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTravelModalOpen && (
          <TravelLogModal 
            isOpen={isTravelModalOpen} 
            onClose={() => setIsTravelModalOpen(false)} 
            onSave={handleSaveLog}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDocumentModalOpen && (
          <DocumentViewModal 
            log={selectedLogForDocument}
            isOpen={isDocumentModalOpen}
            onClose={() => setIsDocumentModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DocumentViewModal({ log, isOpen, onClose }: { log: ActivityLog | null, isOpen: boolean, onClose: () => void }) {
  if (!log) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Document Viewer"
      icon={<FileText size={18} />}
      width="max-w-4xl"
      headerColor="bg-slate-800"
    >
      <div className="flex flex-col flex-1 bg-white relative">
        {/* Actions - Hidden on print */}
        <div className="px-8 py-4 bg-slate-50 border-b border-slate-100 flex justify-end items-center shrink-0 print:hidden sticky top-0 z-20">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#2D336B] text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Printer size={16} /> 문서 내보내기 (PDF/출력)
          </button>
        </div>

        {/* Document Content */}
        <style>
          {`
            @media print {
              @page { 
                size: A4; 
                margin: 15mm; 
              }
              
              /* Hide entire app UI except the document container */
              body > *:not(#root),
              #root > *:not(.document-view-container),
              .sidebar, .dashboard-header, nav, header, aside, .action-bar, .print-hidden {
                display: none !important;
              }

              body, #root {
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                height: auto !important;
              }

              .document-view-container {
                position: static !important;
                display: block !important;
                padding: 0 !important;
                z-index: auto !important;
                overflow: visible !important;
              }

              .document-card {
                position: static !important;
                width: 100% !important;
                max-width: none !important;
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                display: block !important;
                height: auto !important;
                overflow: visible !important;
                border-radius: 0 !important;
              }

              .document-content-area {
                padding: 0 !important;
                overflow: visible !important;
                height: auto !important;
                display: block !important;
              }

              /* Color preservation for charts, badges, and branding */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
            }
            .document-a4-style {
              font-family: "Noto Sans KR", sans-serif;
            }
          `}
        </style>
        <div className="flex-1 p-12 print:p-0 print:overflow-visible document-a4-style document-content-area document-view-container document-card">
           {/* Document Ribbon / Header */}
           <div className="border-b-4 border-slate-900 pb-8 mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">{log.type === 'Meeting' ? '회 의 록' : '출 장 일 지'}</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">SHELTER FLOW BUSINESS ACTIVITY LOG</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">문서코드</p>
                <p className="text-xs font-mono font-bold text-slate-900">{log.id.toUpperCase()}</p>
              </div>
           </div>

           {/* Business Meta Table-like Grid */}
           <div className="grid grid-cols-2 gap-px bg-slate-200 border border-slate-200 mb-10 overflow-hidden rounded-sm">
              <div className="bg-slate-50 p-5 flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">작성일자 (DATE)</span>
                <span className="text-sm font-bold text-slate-800">{log.date}</span>
              </div>
              <div className="bg-slate-50 p-5 flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">작성자 (WRITER)</span>
                <span className="text-sm font-bold text-slate-800">영업운영그룹 / 이성진 파트장</span>
              </div>
              <div className="bg-slate-50 p-5 flex flex-col gap-1 col-span-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">문서 제목 (SUBJECT)</span>
                <span className="text-sm font-bold text-slate-800 tracking-tight">{log.title}</span>
              </div>
              <div className="bg-slate-50 p-5 flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">대상 파트너 (TARGET)</span>
                <span className="text-sm font-bold text-slate-800">{log.target}</span>
              </div>
              <div className="bg-slate-50 p-5 flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">지역/장소 (LOCATION)</span>
                <span className="text-sm font-bold text-slate-800">{log.location}</span>
              </div>
           </div>

           {/* Main Narrative Sections */}
           {log.type === 'Meeting' ? (
             <div className="space-y-10">
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-[1.25rem] h-[1.25rem] bg-[#2D336B] text-white flex items-center justify-center rounded-sm text-[10px] font-black">01</div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">미팅 주요 목적</h4>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-8 text-black">
                    {log.purposes?.map(p => (
                      <span key={p} className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-bold text-slate-600"># {p}</span>
                    ))}
                  </div>
                </section>
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-[1.25rem] h-[1.25rem] bg-[#2D336B] text-white flex items-center justify-center rounded-sm text-[10px] font-black">02</div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">회의 및 상담 상세 내용</h4>
                  </div>
                  <div className="pl-8 text-black">
                    <div className="p-8 bg-slate-50/50 border border-slate-100 rounded-2xl min-h-[300px] text-sm leading-[1.8] text-slate-700 whitespace-pre-wrap shadow-inner">
                      {log.content || '회의 상세 내용이 입력되지 않았습니다.'}
                    </div>
                  </div>
                </section>
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-[1.25rem] h-[1.25rem] bg-orange-500 text-white flex items-center justify-center rounded-sm text-[10px] font-black">!</div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest text-orange-600">결정 사항 및 후속 업무</h4>
                  </div>
                  <div className="pl-8 text-black">
                    <div className="p-6 bg-orange-50/30 border border-orange-100 rounded-2xl text-[13px] font-bold text-orange-700 leading-relaxed ring-4 ring-orange-50/50">
                      {log.nextActions || '지정된 후속 업무가 없습니다.'}
                    </div>
                  </div>
                </section>
             </div>
           ) : (
             <div className="space-y-12">
                <section>
                   <div className="flex items-center gap-3 mb-6">
                    <div className="w-[1.25rem] h-[1.25rem] bg-orange-500 text-white flex items-center justify-center rounded-sm text-[10px] font-black">R</div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">출장지 활동 및 현장 리포트</h4>
                  </div>
                  <div className="space-y-6 pl-8 text-black">
                    {log.days?.map(day => (
                      <div key={day.day} className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">
                        <div className="bg-slate-900 text-white px-6 py-3 flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-widest">Day 0{day.day} Activity</span>
                          <div className="flex items-center gap-2 text-slate-400">
                            <MapPin size={10} />
                            <span className="text-[10px] font-bold">{day.route}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-slate-100">
                          <div className="p-6">
                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-3 underline underline-offset-4 decoration-2 decoration-slate-100">Morning Report (AM)</span>
                            <p className="text-xs text-slate-700 font-medium leading-[1.6]">{day.reportAM}</p>
                          </div>
                          <div className="p-6">
                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-3 underline underline-offset-4 decoration-2 decoration-slate-100">Afternoon Report (PM)</span>
                            <p className="text-xs text-slate-700 font-medium leading-[1.6]">{day.reportPM}</p>
                          </div>
                        </div>
                        {day.expenses.length > 0 && (
                          <div className="p-6 bg-slate-50 border-t border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-3">Daily Expense Breakdown</span>
                            <div className="space-y-2 text-black">
                              {day.expenses.map((exp, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                                  <span className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-slate-300 rounded-full" /> {exp.item}
                                  </span>
                                  <span className="font-mono">{exp.amount.toLocaleString()} <span className="font-sans text-[8px] text-slate-400">KRW</span></span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-slate-900 rounded-[2rem] p-10 text-white flex justify-between items-end shadow-2xl shadow-slate-200">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1 border-l-2 border-orange-500">Expenditure Summary</h4>
                    <p className="text-[0.625rem] text-slate-500 font-black italic">본 정보는 전표 증빙 및 회계 승인을 위한 선행 자료입니다.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-mono font-black text-orange-400 tracking-tighter">{(log.totalExpense || 0).toLocaleString()}</span>
                    <span className="text-xs font-black text-slate-400 ml-2">원 (VAT 포함)</span>
                  </div>
                </section>
             </div>
           )}

           {/* Official Footer / Signatures */}
           <div className="mt-24 pt-10 border-t-2 border-slate-100 flex justify-between items-start text-black">
              <div className="flex gap-6">
                <div className="w-20 h-20 bg-slate-50 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-200 relative">
                  <span className="text-[9px] font-black uppercase text-center leading-tight rotate-[-15deg] opacity-50">SHELTER FLOW<br/>OFFICIAL RECORD</span>
                  <div className="absolute inset-2 border border-slate-100 rounded-lg pointer-events-none" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-serif italic text-slate-900 opacity-20 mb-3 tracking-tighter">Shelter Flow CRM Systems</p>
                <p className="text-[10px] font-black text-slate-400 max-w-[280px] leading-relaxed">
                  본 문서는 시스템을 통해 자동 생성되었으며,<br/>
                  위 변조 방지에 위해 작성 히스토리가 서버에 저장되었습니다.
                </p>
              </div>
           </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

// --- Modals ---

function MeetingLogModal({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (log: ActivityLog) => void }) {
  const { shelters } = useShelters();
  const { partners } = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    target: '',
    targetId: '',
    purposes: [] as string[],
    tags: [] as string[],
    content: '',
    nextActions: '',
    salesStage: 'Negotiating'
  });

  const allTargets = useMemo(() => {
    const s = shelters.map(item => ({ id: item.id, name: `[보호소] ${item.name}`, type: 'shelter' }));
    const p = partners.map(item => ({ id: item.id, name: `[파트너] ${item.name}`, type: 'partner' }));
    return [...s, ...p];
  }, [shelters, partners]);

  const filteredTargets = allTargets.filter(t => t.name.includes(searchTerm));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      type: 'Meeting',
      title: formData.title,
      target: formData.target,
      targetId: formData.targetId,
      location: '삼송 보호소 상담실 (자동 연동)', // Mock location
      date: new Date().toISOString().split('T')[0],
      status: formData.nextActions ? '후속 업무 진행 중' : '완료',
      purposes: formData.purposes,
      tags: formData.tags,
      content: formData.content,
      nextActions: formData.nextActions
    };
    onSave(newLog);
    onClose();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="파트너 미팅 회의록 작성"
      icon={<MessageSquare size={18} />}
      headerColor="bg-blue-600"
      width="max-w-2xl"
    >
      <form onSubmit={handleSave} className="flex-1 p-[1.5rem] space-y-[1.25rem] bg-white">
        <div className="grid grid-cols-2 gap-[1.25rem]">
          <div className="space-y-[0.25rem] relative">
            <label className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest pl-[0.25rem]">대상 파트너 (CRM 연동) *</label>
            <div className="relative">
              <Search size={14} className="absolute left-[1rem] top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                required
                type="text" 
                placeholder="검색 후 선택하세요..."
                value={searchTerm}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-[2.5rem] pr-[1rem] py-[0.625rem] bg-slate-50 border border-slate-100 rounded-xl text-[0.875rem] font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all placeholder:text-slate-400"
              />
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute z-50 left-0 right-0 top-full mt-[0.5rem] bg-white border border-slate-200 rounded-xl shadow-2xl max-h-[12rem] overflow-y-auto custom-scrollbar p-[0.25rem]"
                  >
                    {filteredTargets.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setFormData({...formData, target: t.name, targetId: t.id});
                          setSearchTerm(t.name);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-[1rem] py-[0.625rem] text-left hover:bg-slate-50 rounded-lg text-[0.75rem] font-bold flex items-center gap-[0.5rem] group transition-colors"
                      >
                        <span className={cn(
                          "px-[0.375rem] py-[0.125rem] rounded text-[0.5rem] font-black uppercase",
                          t.type === 'shelter' ? "bg-green-50 text-green-600 border border-green-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                        )}>
                          {t.type === 'shelter' ? '보호소' : '파트너'}
                        </span>
                        {t.name.split('] ')[1]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="space-y-[0.25rem]">
            <label className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest pl-[0.25rem]">회의 제목 *</label>
            <input 
              required
              type="text" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="미팅의 주요 목적을 적어주세요"
              className="w-full px-[1rem] py-[0.625rem] bg-slate-50 border border-slate-100 rounded-xl text-[0.875rem] font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="space-y-[0.25rem]">
          <label className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest pl-[0.25rem]">미팅 목적 (다중 선택)</label>
          <div className="flex flex-wrap gap-[0.5rem] pt-[0.25rem]">
            {['단가 협의', '물류 최적화', '이벤트 기획', '샘플 피드백', '정기 계약', '클레임 대응'].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  purposes: prev.purposes.includes(p) ? prev.purposes.filter(item => item !== p) : [...prev.purposes, p]
                }))}
                className={cn(
                  "px-[0.75rem] py-[0.375rem] rounded-lg text-[0.625rem] font-bold border transition-all",
                  formData.purposes.includes(p) ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" : "bg-white border-slate-200 text-slate-500 hover:border-blue-200"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-[1.25rem]">
          <div className="space-y-[0.25rem]">
            <label className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest pl-[0.25rem]">영업 파이프라인 상태 변경</label>
            <select 
              value={formData.salesStage}
              onChange={e => setFormData({...formData, salesStage: e.target.value})}
              className="w-full px-[1rem] py-[0.625rem] bg-slate-50 border border-slate-100 rounded-xl text-[0.875rem] font-bold focus:ring-2 focus:ring-accent/20 outline-none cursor-pointer appearance-none"
            >
              <option value="Lead">가망 고객 (Lead)</option>
              <option value="Sample Sent">샘플 배송 (Sample Sent)</option>
              <option value="Negotiating">협상 진행 (Negotiating)</option>
              <option value="Partnered">협력 완료 (Partnered)</option>
            </select>
          </div>
          <div className="space-y-[0.25rem]">
            <label className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest pl-[0.25rem]">주요 요구사항 (#태그)</label>
            <div className="relative">
              <Tag size={14} className="absolute left-[1rem] top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="태그 입력 후 엔터 (예: #배송비절감)"
                className="w-full pl-[2.5rem] pr-[1rem] py-[0.625rem] bg-slate-50 border border-slate-100 rounded-xl text-[0.875rem] font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all placeholder:text-slate-300"
              />
            </div>
          </div>
        </div>

        <div className="space-y-[0.25rem]">
          <label className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest pl-[0.25rem]">회의 상세 내용</label>
          <textarea 
            value={formData.content}
            onChange={e => setFormData({...formData, content: e.target.value})}
            placeholder="대화의 핵심 내용과 합의 사항을 자유롭게 기록하세요."
            className="w-full px-[1rem] py-[0.75rem] bg-slate-50 border border-slate-100 rounded-xl text-[0.75rem] font-medium min-h-[6rem] focus:ring-2 focus:ring-accent/20 outline-none resize-none"
          />
        </div>

        <div className="p-[1rem] bg-orange-50 border border-orange-100 rounded-2xl space-y-[0.5rem]">
           <div className="flex items-center gap-[0.5rem] mb-[0.25rem]">
             <div className="w-[0.5rem] h-[0.5rem] rounded-full bg-orange-500 animate-pulse" />
             <label className="text-[0.625rem] font-black text-orange-600 uppercase tracking-widest italic">후속 업무 자동 연동 (Next Action)</label>
           </div>
           <input 
             placeholder="여기에 입력된 내용은 대시보드의 'Action Items'로 즉시 전송됩니다."
             value={formData.nextActions}
             onChange={e => setFormData({...formData, nextActions: e.target.value})}
             className="w-full px-[1rem] py-[0.5rem] bg-white border border-orange-200 rounded-xl text-[0.75rem] font-bold placeholder:text-orange-200 focus:ring-2 focus:ring-orange-200/50 outline-none"
           />
        </div>

        <div className="flex gap-[1rem] pt-[1rem] sticky bottom-0 bg-white border-t border-slate-100">
          <button type="button" onClick={onClose} className="flex-1 py-[0.875rem] bg-slate-100 text-slate-600 font-black text-[0.75rem] rounded-2xl hover:bg-slate-200 transition-colors">취소</button>
          <button type="submit" className="flex-[2] py-[0.875rem] bg-blue-600 text-white font-black text-[0.75rem] rounded-2xl shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-[0.98] transition-all">회의록 저장 및 동기화</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function TravelLogModal({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (log: ActivityLog) => void }) {
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    days: [] as any[]
  });

  const [activeDay, setActiveDay] = useState(1);

  const calculateDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  }, [formData.startDate, formData.endDate]);

  React.useEffect(() => {
    if (calculateDays > 0 && formData.days.length !== calculateDays) {
      const newDays = Array.from({ length: calculateDays }, (_, i) => ({
        day: i + 1,
        route: '',
        reportAM: '',
        reportPM: '',
        expenses: [{ item: '', amount: 0 }]
      }));
      setFormData(prev => ({ ...prev, days: newDays }));
    }
  }, [calculateDays]);

  const totalExpense = useMemo(() => {
    return formData.days.reduce((acc, day) => {
      const daySum = day.expenses.reduce((sum: number, exp: any) => sum + (Number(exp.amount) || 0), 0);
      return acc + daySum;
    }, 0);
  }, [formData.days]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      type: 'Travel',
      title: formData.title,
      target: `${calculateDays}일간의 전국 순회`,
      location: formData.days[0]?.route.split('-')[0] || '전국',
      date: formData.startDate,
      status: '완료',
      startDate: formData.startDate,
      endDate: formData.endDate,
      totalExpense,
      days: formData.days
    };
    onSave(newLog);
    onClose();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="다일/다구간 출장 일지 작성"
      icon={<Plane size={18} />}
      headerColor="bg-[#FF9F1C]"
      width="max-w-2xl"
    >
      <form onSubmit={handleSave} className="flex-1 p-[1.5rem] space-y-[1.5rem] bg-white">
        <div className="grid grid-cols-12 gap-[1.25rem]">
          <div className="col-span-12 space-y-[0.25rem]">
            <label className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest pl-[0.25rem]">출장명/프로젝트명 *</label>
            <input 
              required
              type="text" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="예: 영남권 신규 보호소 실태 조사"
              className="w-full px-[1rem] py-[0.625rem] bg-slate-50 border border-slate-100 rounded-xl text-[0.875rem] font-bold focus:ring-2 focus:ring-accent/20 outline-none"
            />
          </div>
          <div className="col-span-6 space-y-[0.25rem]">
            <label className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest pl-[0.25rem]">시작 일자 *</label>
            <input 
              required
              type="date" 
              value={formData.startDate}
              onChange={e => setFormData({...formData, startDate: e.target.value})}
              className="w-full px-[1rem] py-[0.625rem] bg-slate-50 border border-slate-100 rounded-xl text-[0.875rem] font-bold focus:ring-2 focus:ring-accent/20 outline-none"
            />
          </div>
          <div className="col-span-6 space-y-[0.25rem]">
            <label className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest pl-[0.25rem]">종료 일자 *</label>
            <input 
              required
              type="date" 
              value={formData.endDate}
              onChange={e => setFormData({...formData, endDate: e.target.value})}
              className="w-full px-[1rem] py-[0.625rem] bg-slate-50 border border-slate-100 rounded-xl text-[0.875rem] font-bold focus:ring-2 focus:ring-accent/20 outline-none"
            />
          </div>
        </div>

        {calculateDays > 0 && (
          <div className="space-y-[1rem]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-[0.5rem]">
               <div className="flex gap-[0.5rem]">
                  {formData.days.map((day, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveDay(idx + 1)}
                      className={cn(
                        "px-[0.75rem] py-[0.25rem] rounded-full text-[0.625rem] font-black transition-all",
                        activeDay === idx + 1 ? "bg-[#FF9F1C] text-white shadow-md shadow-orange-100" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      )}
                    >
                      DAY {idx + 1}
                    </button>
                  ))}
               </div>
               <div className="flex items-center gap-[0.5rem] bg-slate-900 text-white px-[0.75rem] py-[0.25rem] rounded-full shadow-lg">
                  <Wallet size={12} className="text-orange-400" />
                  <span className="text-[0.5625rem] font-black uppercase tracking-widest text-slate-400">Total:</span>
                  <span className="text-[0.6875rem] font-mono font-black">{totalExpense.toLocaleString()}원</span>
               </div>
            </div>

            <div className="bg-slate-50/50 p-[1.25rem] rounded-2xl border border-slate-100 grid grid-cols-2 gap-[1.25rem] animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="col-span-2 space-y-[0.25rem]">
                  <label className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest pl-[0.25rem]">이동 동선 (출발-경유-도착)</label>
                  <div className="relative">
                     <MapPin size={14} className="absolute left-[1rem] top-1/2 -translate-y-1/2 text-slate-400" />
                     <input 
                       placeholder="예: 서울-고양-의정부-춘천"
                       value={formData.days[activeDay-1]?.route || ''}
                       onChange={e => {
                         const next = [...formData.days];
                         next[activeDay-1].route = e.target.value;
                         setFormData({...formData, days: next});
                       }}
                       className="w-full pl-[2.5rem] pr-[1rem] py-[0.625rem] bg-white border border-slate-100 rounded-xl text-[0.75rem] font-bold outline-none ring-accent/10 focus:ring-2"
                     />
                  </div>
               </div>
               <div className="space-y-[0.25rem]">
                  <label className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest pl-[0.25rem]">AM 현장 리포트</label>
                  <textarea 
                     placeholder="오전 활동 주요 내용"
                     value={formData.days[activeDay-1]?.reportAM || ''}
                     onChange={e => {
                        const next = [...formData.days];
                        next[activeDay-1].reportAM = e.target.value;
                        setFormData({...formData, days: next});
                     }}
                     className="w-full px-[1rem] py-[0.625rem] bg-white border border-slate-100 rounded-xl text-[0.6875rem] font-medium h-[5rem] resize-none outline-none ring-accent/10 focus:ring-2"
                  />
               </div>
               <div className="space-y-[0.25rem]">
                  <label className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest pl-[0.25rem]">PM 현장 리포트</label>
                  <textarea 
                     placeholder="오후 미팅 및 활동 사항"
                     value={formData.days[activeDay-1]?.reportPM || ''}
                     onChange={e => {
                        const next = [...formData.days];
                        next[activeDay-1].reportPM = e.target.value;
                        setFormData({...formData, days: next});
                     }}
                     className="w-full px-[1rem] py-[0.625rem] bg-white border border-slate-100 rounded-xl text-[0.6875rem] font-medium h-[5rem] resize-none outline-none ring-accent/10 focus:ring-2"
                  />
               </div>

               <div className="col-span-2">
                  <div className="flex justify-between items-center mb-[0.5rem]">
                     <label className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest pl-[0.25rem]">일일 비용 지출 내역</label>
                     <button 
                       type="button" 
                       onClick={() => {
                         const next = [...formData.days];
                         next[activeDay-1].expenses.push({ item: '', amount: 0 });
                         setFormData({...formData, days: next});
                       }}
                       className="text-[0.5625rem] font-black text-[#FF9F1C] flex items-center gap-[0.25rem] hover:underline"
                     >
                       <PlusCircle size={10} /> 항목 추가
                     </button>
                  </div>
                  <div className="space-y-[0.5rem] max-h-[8rem] overflow-y-auto custom-scrollbar pr-[0.5rem]">
                     {formData.days[activeDay-1]?.expenses.map((exp: any, eIdx: number) => (
                       <div key={eIdx} className="flex gap-[0.5rem] items-center">
                          <input 
                            placeholder="지출 항목"
                            value={exp.item}
                            onChange={e => {
                              const next = [...formData.days];
                              next[activeDay-1].expenses[eIdx].item = e.target.value;
                              setFormData({...formData, days: next});
                            }}
                            className="flex-1 px-[0.75rem] py-[0.375rem] bg-white border border-slate-100 rounded-lg text-[0.625rem] font-bold"
                          />
                          <div className="relative flex-1">
                             <input 
                               type="number"
                               placeholder="금액"
                               value={exp.amount || ''}
                               onChange={e => {
                                 const next = [...formData.days];
                                 next[activeDay-1].expenses[eIdx].amount = Number(e.target.value);
                                 setFormData({...formData, days: next});
                               }}
                               className="w-full px-[0.75rem] py-[0.375rem] bg-white border border-slate-100 rounded-lg text-[0.625rem] font-mono font-bold text-right pr-[1.5rem]"
                             />
                             <span className="absolute right-[0.5rem] top-1/2 -translate-y-1/2 text-[0.625rem] font-bold text-slate-300">원</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              const next = [...formData.days];
                              next[activeDay-1].expenses.splice(eIdx, 1);
                              setFormData({...formData, days: next});
                            }}
                            className="text-slate-300 hover:text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        <div className="flex gap-[1rem] pt-[1rem] sticky bottom-0 bg-white border-t border-slate-100">
          <button type="button" onClick={onClose} className="flex-1 py-[0.875rem] bg-slate-100 text-slate-600 font-black text-[0.75rem] rounded-2xl hover:bg-slate-200 transition-colors">취소</button>
          <button type="submit" className="flex-[2] py-[0.875rem] bg-[#FF9F1C] text-white font-black text-[0.75rem] rounded-2xl shadow-xl shadow-orange-200 hover:scale-[1.02] active:scale-[0.98] transition-all">출장 일지 등록 완료</button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function MinusCircle({ size, className }: { size?: number, className?: string }) {
   return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
   );
}
