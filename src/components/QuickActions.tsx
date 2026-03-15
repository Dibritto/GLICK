import React, { useState } from 'react';
import { Plus, Minus, ArrowLeftRight, Target, FileText } from 'lucide-react';
import Modal from './Modal';

interface QuickActionsProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onAddIncome, onAddExpense }) => {
  return (
    <div className="fixed bottom-4 lg:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 lg:gap-2 p-1.5 bg-brand-gray-deep/95 border border-brand-lead/50 rounded-full backdrop-blur-md shadow-2xl z-50 max-w-[95vw] overflow-x-auto no-scrollbar">
      <button 
        onClick={onAddIncome}
        className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white rounded-full transition-all group shrink-0"
      >
        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
        <span className="text-[10px] lg:text-xs font-bold uppercase tracking-tighter">Receita</span>
      </button>

      <button 
        onClick={onAddExpense}
        className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-brand-red/10 text-brand-red hover:bg-brand-red hover:text-white rounded-full transition-all group shrink-0"
      >
        <Minus size={18} className="group-hover:scale-110 transition-transform" />
        <span className="text-[10px] lg:text-xs font-bold uppercase tracking-tighter">Despesa</span>
      </button>

      <div className="w-[1px] h-6 bg-brand-lead/50 mx-1" />

      <button className="p-2 text-gray-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded-full transition-all" title="Transferência">
        <ArrowLeftRight size={18} />
      </button>

      <button className="p-2 text-gray-400 hover:text-brand-orange hover:bg-brand-orange/10 rounded-full transition-all" title="Criar Meta">
        <Target size={18} />
      </button>

      <button className="p-2 text-gray-400 hover:text-white hover:bg-brand-lead rounded-full transition-all" title="Relatório">
        <FileText size={18} />
      </button>
    </div>
  );
};

export default QuickActions;

