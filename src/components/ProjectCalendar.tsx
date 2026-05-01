import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { PROJECT_DATA, Project } from '../projectData';
import { cn } from '../lib/utils';
import { Info, Calendar as CalendarIcon, Package, Truck, Heart } from 'lucide-react';

interface ProjectCalendarProps {
  onEventClick?: (event: Project) => void;
  projects?: Project[];
}

const ProjectCalendar: React.FC<ProjectCalendarProps> = ({ onEventClick, projects = PROJECT_DATA }) => {
  // Modern, comfortable color palette
  const COLOR_PALETTE = [
    { bg: '#EEF2FF', border: '#C7D2FE', text: '#4338CA' }, // Indigo
    { bg: '#F0F9FF', border: '#BAE6FD', text: '#0369A1' }, // Sky
    { bg: '#F5F3FF', border: '#DDD6FE', text: '#6D28D9' }, // Violet
    { bg: '#ECFDF5', border: '#A7F3D0', text: '#047857' }, // Emerald
    { bg: '#FFF7ED', border: '#FFEDD5', text: '#C2410C' }, // Orange
    { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' }, // Red
    { bg: '#FDF2F8', border: '#FBCFE8', text: '#BE185D' }, // Pink
    { bg: '#F0FDFA', border: '#CCFBF1', text: '#0F766E' }, // Teal
    { bg: '#FAFAF9', border: '#E7E5E4', text: '#44403C' }, // Stone
    { bg: '#EFF6FF', border: '#DBEAFE', text: '#1D4ED8' }, // Blue
    { bg: '#F8FAFC', border: '#E2E8F0', text: '#334155' }, // Slate
    { bg: '#FFFBEB', border: '#FEF3C7', text: '#B45309' }, // Amber
    { bg: '#F5FAFE', border: '#E0F2FE', text: '#0369A1' }, // Light Blue
    { bg: '#FDF4FF', border: '#FAE8FF', text: '#A21CAF' }, // Fuchsia
  ];

  const getEventStyles = (id: string, name: string) => {
    // Simple deterministic hash based on ID or Name
    const seed = id + name;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % COLOR_PALETTE.length;
    return COLOR_PALETTE[index];
  };

  const events = projects.map(proj => {
    const styles = getEventStyles(proj.id, proj.projectName);
    return {
      id: proj.id,
      title: proj.projectName,
      start: proj.startDate,
      end: proj.endDate,
      backgroundColor: styles.bg,
      borderColor: styles.border,
      textColor: styles.text,
      extendedProps: { ...proj }
    };
  });

  const handleEventClick = (info: any) => {
    if (onEventClick) {
      onEventClick(info.event.extendedProps as Project);
    }
  };

  return (
    <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col pt-1">
      <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <CalendarIcon size={16} className="text-[#2D336B]" />
          <h3 className="text-sm font-bold text-slate-700">보호소 프로젝트 일정</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">배송/물류</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">영업/미팅</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">이벤트/캠페인</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-hidden calendar-container">
        <style>{`
          .fc { font-size: 11px; font-family: inherit; }
          .fc .fc-toolbar-title { font-size: 14px; font-weight: 800; color: #1e293b; }
          .fc .fc-button { padding: 4px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; border-radius: 6px; }
          .fc .fc-button-primary { background-color: #f8fafc; border-color: #e2e8f0; color: #64748b; }
          .fc .fc-button-primary:hover { background-color: #f1f5f9; border-color: #cbd5e1; color: #1e293b; }
          .fc .fc-button-primary:not(:disabled).fc-button-active { background-color: #2D336B; border-color: #2D336B; color: white; }
          .fc .fc-col-header-cell-cushion { color: #94a3b8; font-weight: 800; text-transform: uppercase; padding: 10px 0; }
          .fc .fc-daygrid-day-number { color: #64748b; font-weight: 600; padding: 8px; }
          .fc .fc-day-today { background-color: #f0fdf4 !important; }
          .fc .fc-event { 
            border-radius: 6px; 
            padding: 2px 6px; 
            border-width: 1px;
            font-weight: 700; 
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            transition: all 0.2s ease;
            cursor: pointer;
            margin-bottom: 2px;
          }
          .fc .fc-event:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            filter: brightness(1.05);
            z-index: 50;
          }
          .fc .fc-event-main {
            color: inherit !important;
          }
          .fc .fc-event-title {
            color: inherit !important;
            font-size: 10px;
            letter-spacing: -0.01em;
          }
          .fc .fc-daygrid-event { margin-top: 2px; }
          .calendar-container { height: 100%; min-height: 400px; }
          .fc-header-toolbar { margin-bottom: 1rem !important; }
          .fc .fc-daygrid-day-frame:hover { background-color: #f8fafc; }
        `}</style>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          eventClick={handleEventClick}
          height="100%"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
          }}
          locale="ko"
        />
      </div>
    </div>
  );
};

export default ProjectCalendar;
