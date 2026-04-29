import React, { useRef } from 'react';
import { motion, useDragControls } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
  headerColor?: string;
}

/**
 * Standardized Modal Wrapper with Drag Support
 * Designed to be used EITHER inside AnimatePresence or standalone.
 */
export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  width = 'max-w-[32rem]',
  headerColor = 'bg-[#2D336B]'
}) => {
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);

  // If not open, we must return null to allow clicking elements behind.
  // Note: For exit animations to work, the PARENT must handle the conditional rendering with AnimatePresence.
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none" ref={constraintsRef}>
      {/* Backdrop - Click through handled by pointer-events-auto */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-auto"
      />

      {/* Modal Container */}
      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={constraintsRef}
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          "relative w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] pointer-events-auto border border-slate-200",
          width
        )}
      >
        {/* Modal Header */}
        <div 
          onPointerDown={(e) => dragControls.start(e)}
          className={cn(
            "px-6 py-5 text-white flex justify-between items-center shrink-0 cursor-move active:cursor-grabbing select-none",
            headerColor
          )}
        >
          <div className="flex items-center gap-3">
            {icon && <div className="p-2 bg-white/10 rounded-xl">{icon}</div>}
            <h3 className="text-lg font-black tracking-tight leading-none uppercase">
              {title}
            </h3>
          </div>
          <button 
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }} 
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0 bg-white">
          {children}
        </div>
      </motion.div>
    </div>
  );
};
