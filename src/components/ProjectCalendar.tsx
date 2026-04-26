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
  const getEventColor = (type: Project['type']) => {
    switch (type) {
      case 'logistics': return '#FF9F1C'; // Orange
      case 'sales': return '#2D336B'; // Deep Blue
      case 'event': return '#80BCBD'; // Green
      default: return '#94a3b8';
    }
  };

  const events = projects.map(proj => ({
    id: proj.id,
    title: proj.projectName,
    start: proj.startDate,
    end: proj.endDate,
    backgroundColor: getEventColor(proj.type),
    borderColor: getEventColor(proj.type),
    extendedProps: { ...proj }
  }));

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
            <div className="w-2 h-2 rounded-full bg-[#FF9F1C]"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">배송/물류</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#2D336B]"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">영업/미팅</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#80BCBD]"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">이벤트/캠페인</span>
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
          .fc .fc-event { border-radius: 4px; padding: 2px 4px; border: none; font-weight: 600; }
          .fc .fc-daygrid-event { margin-top: 2px; }
          .calendar-container { height: 100%; min-height: 400px; }
          .fc-header-toolbar { margin-bottom: 1rem !important; }
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
