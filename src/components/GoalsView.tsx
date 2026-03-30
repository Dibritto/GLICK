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
import { Button } from './ui/Button';
import { Input } from './ui/Input';
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
    const matchesSearch = (goal.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const isCompleted = Number(goal.current_amount) >= Number(goal.target_amount);
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && !isCompleted) || 
      (filterStatus === 'completed' && isCompleted);
    return matchesSearch && matchesStatus;
  });

  return (
    <section className="p-4 md:p-8 space-y-6" aria-labelledby="goals-view-title">
      {/* Cabeçalho Técnico */}
      <header className="space-y-1">
        <h2 id="goals-view-title" className="text-2xl font-bold tracking-tighter text-white uppercase italic font-serif">
          Metas & Objetivos
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
          Planejamento estratégico e acumulação de capital
        </p>
      </header>

      {/* Barra de Ferramentas - Linha 1: Busca e Ações */}
      <div className="flex flex-col md:flex-row gap-4 items-center" role="toolbar" aria-label="Ferramentas de metas">
        <div className="flex-1 w-full">
          <Input 
            type="text" 
            placeholder="Pesquisar por nome da meta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Pesquisar metas"
            className="pl-10"
          />
          <Search className="absolute left-3 top-[calc(50%+0.75rem)] md:top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} aria-hidden="true" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button 
            onClick={onAddGoal}
            variant="primary"
            size="md"
            className="flex-1 md:flex-none gap-2 text-[10px] font-bold uppercase tracking-[0.2em]"
            aria-label="Adicionar nova meta"
          >
            <Plus size={14} aria-hidden="true" />
            Nova Meta
          </Button>
        </div>
      </div>

      {/* Barra de Ferramentas - Linha 2: Filtros */}
      <nav className="flex flex-wrap gap-2 items-center" aria-label="Filtros de status de metas">
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Filtrar por status">
          {(['all', 'active', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              aria-pressed={filterStatus === status}
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
      </nav>

      {/* Grid de Metas */}
      <div 
        className="grid gap-6" 
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}
      >
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4" aria-live="polite">
            <Loader2 size={32} className="text-brand-blue animate-spin" aria-hidden="true" />
            <p className="text-xs text-gray-500 uppercase tracking-widest">Sincronizando Metas...</p>
          </div>
        ) : (
          <ul className="contents" role="list">
            {filteredGoals.map((goal, i) => (
              <motion.li 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                key={goal.id}
                role="listitem"
                aria-label={`Meta: ${goal.name}`}
                className="glass-panel technical-border p-6 rounded-2xl group hover:border-brand-blue/30 transition-all cursor-pointer card-container"
              >
                <div 
                  onClick={() => onEditGoal?.(goal)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Editar detalhes da meta ${goal.name}`}
                  onKeyDown={(e) => e.key === 'Enter' && onEditGoal?.(goal)}
                  className="flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div 
                        className="p-3 rounded-xl bg-white/5 border border-white/10"
                        style={{ color: goal.color }}
                        aria-hidden="true"
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
                    <div 
                      className="h-3 w-full bg-brand-lead/20 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progresso da meta ${goal.name}`}
                    >
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
                      <Calendar size={12} aria-hidden="true" />
                      <span>Prazo: {goal.deadline ? formatDate(goal.deadline) : 'Sem prazo'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onWithdrawFunds?.(goal);
                        }}
                        aria-label={`Resgatar fundos da meta ${goal.name}`}
                        className="text-[10px] uppercase font-bold text-brand-red hover:underline flex items-center gap-1"
                      >
                        Resgatar
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddFunds?.(goal);
                        }}
                        aria-label={`Aportar capital na meta ${goal.name}`}
                        className="text-[10px] uppercase font-bold text-brand-blue hover:underline flex items-center gap-1"
                      >
                        Aportar Capital <ChevronRight size={12} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      {/* Telemetria de Metas */}
      <section className="glass-panel technical-border p-8 rounded-2xl" aria-labelledby="goals-telemetry-title">
        <h3 id="goals-telemetry-title" className="sr-only">Telemetria de Metas</h3>
        <div 
          className="grid gap-12" 
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
        >
          <article className="flex items-center gap-4 p-4 rounded-xl">
            <div className="p-3 rounded-xl bg-brand-blue/10 text-brand-blue" aria-hidden="true">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Aporte Mensal Médio</p>
              <p className="text-xl font-mono font-bold text-white">{formatCurrency(0)}</p>
            </div>
          </article>

          <article className="flex items-center gap-4 p-4 rounded-xl">
            <div className="p-3 rounded-xl bg-brand-green/10 text-brand-green" aria-hidden="true">
              <Trophy size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Metas Concluídas</p>
              <p className="text-xl font-mono font-bold text-white">{completedGoalsCount} Objetivos</p>
            </div>
          </article>

          <article className="flex items-center gap-4 p-4 rounded-xl">
            <div className="p-3 rounded-xl bg-brand-orange/10 text-brand-orange" aria-hidden="true">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Velocidade de Acúmulo</p>
              <p className="text-xl font-mono font-bold text-white">Telemetria Ativa</p>
            </div>
          </article>
        </div>
      </section>
    </section>
  );
};

export default GoalsView;
