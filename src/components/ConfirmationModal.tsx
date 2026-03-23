import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './ui/Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const colors = {
    danger: 'bg-brand-red text-white shadow-brand-red/20',
    warning: 'bg-brand-orange text-brand-graphite shadow-brand-orange/20',
    info: 'bg-brand-blue text-brand-graphite shadow-brand-blue/20'
  };

  const iconColors = {
    danger: 'text-brand-red bg-brand-red/10',
    warning: 'text-brand-orange bg-brand-orange/10',
    info: 'text-brand-blue bg-brand-blue/10'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-graphite/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md glass-panel technical-border rounded-2xl p-8 overflow-hidden"
        >
          <div className="flex justify-between items-start mb-6">
            <div className={`p-3 rounded-xl ${iconColors[type]}`}>
              <AlertTriangle size={24} />
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-2 mb-8">
            <h3 className="text-xl font-bold text-white tracking-tight italic font-serif uppercase">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="ghost"
              onClick={onClose}
              className="flex-1 py-3 bg-brand-lead/20 text-white border border-brand-lead/30 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-brand-lead/30 transition-all"
            >
              {cancelText}
            </Button>
            <Button 
              variant={type === 'danger' ? 'danger' : 'primary'}
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-lg ${colors[type]}`}
            >
              {confirmText}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmationModal;
