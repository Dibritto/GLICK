import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  TrendingUp, 
  Calendar, 
  ChevronRight,
  Trophy,
  Zap,
  Loader2,
  Search
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isCompleted = Number(goal.current_amount) >= Number(goal.target_amount);
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && !isCompleted) || 
      (filterStatus === 'completed' && isCompleted);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Cabeçalho Técnico */}
      <header className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tighter text-white uppercase italic font-serif">
          Metas & Objetivos
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
          Planejamento estratégico e acumulação de capital
        </p>
      </header>

      {/* Barra de Ferramentas - Linha 1: Busca e Ações */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome da meta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-brand-gray-deep/50 border border-brand-lead/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-brand-blue/50 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={onAddGoal}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-blue text-brand-graphite rounded-xl hover:bg-brand-blue/80 transition-all text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(44,199,255,0.4)]"
          >
            <Plus size={14} />
            Nova Meta
          </button>
        </div>
      </div>

      {/* Barra de Ferramentas - Linha 2: Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`
                min-w-[100px] py-2.5 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all
                ${filterStatus === status 
                  ? 'bg-brand-blue/10 border-brand-blue text-brand-blue' 
                  : 'bg-transparent border-brand-lead/30 text-gray-500 hover:border-brand-blue/30'}
              `}
            >
              {status === 'all' ? 'Todas' : status === 'active' ? 'Em Andamento' : 'Concluídas'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Metas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
            <Loader2 size={32} className="text-brand-blue animate-spin" />
            <p className="text-xs text-gray-500 uppercase tracking-widest">Sincronizando Metas...</p>
          </div>
        ) : (
          <>
            {filteredGoals.map((goal, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                key={goal.id}
                onClick={() => onEditGoal?.(goal)}
                className="glass-panel technical-border p-6 rounded-2xl group hover:border-brand-blue/30 transition-all cursor-pointer card-container"
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
                      <div className="fluid-value font-mono font-bold text-white">
                        <span className="currency-symbol">R$</span>
                        {formatCurrency(goal.current_amount, false)}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Objetivo</p>
                      <div className="text-sm font-mono font-bold text-gray-400 flex items-baseline justify-end gap-1">
                        <span className="text-[0.6em] opacity-60">R$</span>
                        {formatCurrency(goal.target_amount, false)}
                      </div>
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
              <p className="text-xl font-mono font-bold text-white">{formatCurrency(0)}</p>
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
