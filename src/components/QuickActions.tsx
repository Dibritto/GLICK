import React, { useState } from 'react';
import { Plus, Minus, ArrowLeftRight, Target, FileText, Landmark } from 'lucide-react';
import Modal from './Modal';
import { Button } from './ui/Button';

interface QuickActionsProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddTransfer: () => void;
  onAddGoal: () => void;
  onAddDebt: () => void;
  onNavigateReports: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ 
  onAddIncome, 
  onAddExpense, 
  onAddTransfer, 
  onAddGoal, 
  onAddDebt,
  onNavigateReports 
}) => {
  return (
    <div className="fixed bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 bg-brand-gray-deep/90 border border-brand-lead/30 rounded-full backdrop-blur-lg shadow-2xl z-50 max-w-[95vw] overflow-x-auto no-scrollbar">
      <Button 
        onClick={onAddIncome}
        variant="outline"
        className="flex items-center gap-2 px-4 lg:px-5 py-2 bg-brand-green/10 text-brand-green hover:bg-brand-green/20 border border-brand-green/20 rounded-full transition-all group shrink-0"
      >
        <Plus size={16} className="group-hover:rotate-90 transition-transform" />
        <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest">Receita</span>
      </Button>

      <Button 
        onClick={onAddExpense}
        variant="outline"
        className="flex items-center gap-2 px-4 lg:px-5 py-2 bg-brand-red/10 text-brand-red hover:bg-brand-red/20 border border-brand-red/20 rounded-full transition-all group shrink-0"
      >
        <Minus size={16} className="group-hover:scale-110 transition-transform" />
        <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest">Despesa</span>
      </Button>

      <div className="w-[1px] h-6 bg-brand-lead/50 mx-1" />

      <Button 
        onClick={onAddTransfer}
        variant="ghost"
        size="icon"
        aria-label="Nova Transferência"
        className="p-2 text-gray-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded-full transition-all" 
        title="Transferência"
      >
        <ArrowLeftRight size={18} />
      </Button>

      <Button 
        onClick={onAddGoal}
        variant="ghost"
        size="icon"
        aria-label="Criar Nova Meta"
        className="p-2 text-gray-400 hover:text-brand-orange hover:bg-brand-orange/10 rounded-full transition-all" 
        title="Criar Meta"
      >
        <Target size={18} />
      </Button>

      <Button 
        onClick={onAddDebt}
        variant="ghost"
        size="icon"
        aria-label="Nova Dívida"
        className="p-2 text-gray-400 hover:text-brand-red hover:bg-brand-red/10 rounded-full transition-all" 
        title="Nova Dívida"
      >
        <Landmark size={18} />
      </Button>

      <Button 
        onClick={onNavigateReports}
        variant="ghost"
        size="icon"
        aria-label="Ver Relatórios"
        className="p-2 text-gray-400 hover:text-white hover:bg-brand-lead rounded-full transition-all" 
        title="Relatório"
      >
        <FileText size={18} />
      </Button>
    </div>
  );
};

export default QuickActions;

