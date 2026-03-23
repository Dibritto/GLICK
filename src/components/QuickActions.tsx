import React, { useState } from 'react';
import { Plus, Minus, ArrowLeftRight, Target, FileText } from 'lucide-react';
import Modal from './Modal';
import { Button } from './ui/Button';

interface QuickActionsProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddTransfer: () => void;
  onAddGoal: () => void;
  onNavigateReports: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ 
  onAddIncome, 
  onAddExpense, 
  onAddTransfer, 
  onAddGoal, 
  onNavigateReports 
}) => {
  return (
    <div className="fixed bottom-4 lg:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 lg:gap-2 p-1.5 bg-brand-gray-deep/95 border border-brand-lead/50 rounded-full backdrop-blur-md shadow-2xl z-50 max-w-[95vw] overflow-x-auto no-scrollbar">
      <Button 
        onClick={onAddIncome}
        variant="outline"
        className="flex items-center gap-2 px-4 lg:px-6 py-2.5 bg-brand-green/10 text-brand-green hover:bg-brand-green/20 border border-brand-green/20 rounded-full transition-all group shrink-0 interactive-card"
      >
        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
        <span className="text-[10px] lg:text-xs font-black uppercase tracking-widest">+ Receita</span>
      </Button>

      <Button 
        onClick={onAddExpense}
        variant="outline"
        className="flex items-center gap-2 px-4 lg:px-6 py-2.5 bg-brand-red/10 text-brand-red hover:bg-brand-red/20 border border-brand-red/20 rounded-full transition-all group shrink-0 interactive-card"
      >
        <Minus size={18} className="group-hover:scale-110 transition-transform" />
        <span className="text-[10px] lg:text-xs font-black uppercase tracking-widest">- Despesa</span>
      </Button>

      <div className="w-[1px] h-6 bg-brand-lead/50 mx-1" />

      <Button 
        onClick={onAddTransfer}
        variant="ghost"
        size="icon"
        aria-label="Nova Transferência"
        className="p-2 text-gray-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded-full transition-all interactive-card" 
        title="Transferência"
      >
        <ArrowLeftRight size={18} />
      </Button>

      <Button 
        onClick={onAddGoal}
        variant="ghost"
        size="icon"
        aria-label="Criar Nova Meta"
        className="p-2 text-gray-400 hover:text-brand-orange hover:bg-brand-orange/10 rounded-full transition-all interactive-card" 
        title="Criar Meta"
      >
        <Target size={18} />
      </Button>

      <Button 
        onClick={onNavigateReports}
        variant="ghost"
        size="icon"
        aria-label="Ver Relatórios"
        className="p-2 text-gray-400 hover:text-white hover:bg-brand-lead rounded-full transition-all interactive-card" 
        title="Relatório"
      >
        <FileText size={18} />
      </Button>
    </div>
  );
};

export default QuickActions;

