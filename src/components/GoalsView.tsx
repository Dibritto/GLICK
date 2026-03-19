import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  TrendingUp, 
  Calendar, 
  ChevronRight,
  Trophy,
  Zap,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatPercent, formatDate } from '../utils/formatters';
import { Goal } from '../types';

interface GoalsViewProps {
  onAddGoal?: () => void;
  onEditGoal?: (goal: Goal) => void;
  onAddFunds?: (goal: Goal) => void;
  onWithdrawFunds?: (goal: Goal) => void;
}

const GoalsView: React.FC<GoalsViewProps> = ({ onAddGoal, onEditGoal, onAddFunds, onWithdrawFunds }) => {
  const { isLoading, derivedData } = useFinance();
  const { completedGoalsCount, goalsWithDynamicAmount: goals } = derivedData;

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Cabeçalho */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tighter text-white uppercase italic font-serif">
            Metas & Objetivos
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
            Planejamento estratégico e acumulação de capital
          </p>
        </div>

        <button 
          onClick={onAddGoal}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-blue text-brand-graphite rounded-xl hover:bg-brand-blue/80 transition-all text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(44,199,255,0.2)]"
        >
          <Plus size={16} />
          Nova Meta
        </button>
      </header>

      {/* Grid de Metas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
            <Loader2 size={32} className="text-brand-blue animate-spin" />
            <p className="text-xs text-gray-500 uppercase tracking-widest">Sincronizando Metas...</p>
          </div>
        ) : (
          <>
            {goals.map((goal, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                key={goal.id}
                onClick={() => onEditGoal?.(goal)}
                className="glass-panel technical-border p-6 rounded-2xl group hover:border-brand-blue/30 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div 
                      className="p-3 rounded-xl bg-white/5 border border-white/10"
                      style={{ color: goal.color }}
                    >
                      {Number(goal.current_amount) >= Number(goal.target_amount) ? <Trophy size={24} /> : <Target size={24} />}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Objetivo</p>
                      <h3 className="text-lg font-bold text-white tracking-tight">{goal.name}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Progresso</p>
                    <p className="text-lg font-mono font-bold text-white">
                      {formatPercent((Number(goal.current_amount) / Number(goal.target_amount)) * 100)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="h-3 w-full bg-brand-lead/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(Number(goal.current_amount) / Number(goal.target_amount)) * 100}%` }}
                      className="h-full shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                      style={{ backgroundColor: goal.color }}
                    />
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Acumulado</p>
                      <p className="text-xl font-mono font-bold text-white">
                        {formatCurrency(goal.current_amount)}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Objetivo</p>
                      <p className="text-sm font-mono font-bold text-gray-400">
                        {formatCurrency(goal.target_amount)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-brand-lead/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <Calendar size={12} />
                    <span>Prazo: {goal.deadline ? formatDate(goal.deadline) : 'Sem prazo'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onWithdrawFunds?.(goal);
                      }}
                      className="text-[10px] uppercase font-bold text-brand-red hover:underline flex items-center gap-1"
                    >
                      Resgatar
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddFunds?.(goal);
                      }}
                      className="text-[10px] uppercase font-bold text-brand-blue hover:underline flex items-center gap-1"
                    >
                      Aportar Capital <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Telemetria de Metas */}
      <section className="glass-panel technical-border p-8 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand-blue/10 text-brand-blue">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Aporte Mensal Médio</p>
              <p className="text-xl font-mono font-bold text-white">R$ 0,00</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand-green/10 text-brand-green">
              <Trophy size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Metas Concluídas</p>
              <p className="text-xl font-mono font-bold text-white">{completedGoalsCount} Objetivos</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand-orange/10 text-brand-orange">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Velocidade de Acúmulo</p>
              <p className="text-xl font-mono font-bold text-white">Telemetria Ativa</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GoalsView;
