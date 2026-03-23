import React from 'react';
import { Calendar, Bell, Target, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useFinance } from '../context/FinanceContext';
import { Badge } from './ui/Badge';

import { formatCurrency, formatDate } from '../utils/formatters';

const RightPanel: React.FC = () => {
  const { transactions, derivedData, isLoading } = useFinance();
  const { goalsWithDynamicAmount: goals } = derivedData;
  
  const pendingTransactions = transactions.filter(t => t.status === 'pending').slice(0, 3);
  const displayGoals = goals.slice(0, 2);

  return (
    <aside className="w-80 flex-shrink-0 border-l border-brand-lead/30 flex flex-col bg-brand-graphite overflow-y-auto no-scrollbar" aria-label="Painel de Informações Laterais">
      {/* Alertas */}
      <section className="p-6 space-y-4" aria-labelledby="alerts-title">
        <div className="flex items-center justify-between">
          <h3 id="alerts-title" className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Alertas Críticos</h3>
          <Badge variant="warning" aria-label="1 alerta ativo">01</Badge>
        </div>

        <div className="space-y-2">
          <article className="p-3 rounded-md bg-brand-orange/5 border border-brand-orange/20 flex gap-3 interactive-card">
            <AlertTriangle size={16} className="text-brand-orange flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold text-brand-orange">Sincronização Ativa</p>
              <p className="text-[10px] text-gray-400 mt-1">Monitorando fluxos de caixa em tempo real.</p>
            </div>
          </article>
        </div>
      </section>

      <div className="h-[1px] w-full bg-brand-lead/20" aria-hidden="true" />

      {/* Próximos Vencimentos */}
      <section className="p-6 space-y-4" aria-labelledby="upcoming-title">
        <div className="flex items-center justify-between">
          <h3 id="upcoming-title" className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Próximos Compromissos</h3>
          <Calendar size={14} className="text-gray-500" aria-hidden="true" />
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-4" aria-label="Carregando compromissos">
              <Loader2 size={16} className="text-brand-blue animate-spin" />
            </div>
          ) : pendingTransactions.length > 0 ? (
            <ul className="space-y-3" role="list">
              {pendingTransactions.map((item) => (
                <li key={item.id} className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-all interactive-card" aria-label={`${item.description}: ${formatCurrency(item.amount)} em ${formatDate(item.date)}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-8 rounded-full ${item.type === 'income' ? 'bg-brand-green' : 'bg-brand-red'}`} aria-hidden="true" />
                    <div>
                      <p className="text-xs font-bold text-gray-200">{item.description}</p>
                      <p className="text-[10px] text-gray-500">{formatDate(item.date)}</p>
                    </div>
                  </div>
                  <p className={`text-xs font-mono font-bold ${item.type === 'income' ? 'text-brand-green' : 'text-brand-red'}`}>
                    {formatCurrency(item.amount)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 rounded-lg bg-brand-lead/5 border border-brand-lead/10 interactive-card">
              <p className="text-[10px] text-gray-600 italic text-center">Nenhum compromisso pendente.</p>
            </div>
          )}
        </div>
      </section>

      <div className="h-[1px] w-full bg-brand-lead/20" aria-hidden="true" />

      {/* Metas */}
      <section className="p-6 space-y-4" aria-labelledby="goals-title">
        <div className="flex items-center justify-between">
          <h3 id="goals-title" className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Metas Ativas</h3>
          <Target size={14} className="text-gray-500" aria-hidden="true" />
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-4" aria-label="Carregando metas">
              <Loader2 size={16} className="text-brand-blue animate-spin" />
            </div>
          ) : displayGoals.length > 0 ? (
            <ul className="space-y-4" role="list">
              {displayGoals.map((goal) => {
                const progress = Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100);
                return (
                  <li key={goal.id} className="p-2 rounded-lg hover:bg-white/5 transition-all interactive-card" aria-label={`Meta ${goal.name}: ${progress}% concluída`}>
                    <div className="flex justify-between text-[10px] mb-1.5">
                      <span className="text-gray-300 font-bold">{goal.name}</span>
                      <span style={{ color: goal.color }} aria-hidden="true">{progress}%</span>
                    </div>
                    <div 
                      className="h-1.5 w-full bg-brand-lead/30 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progresso da meta ${goal.name}`}
                    >
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full" 
                        style={{ backgroundColor: goal.color }}
                      />
                    </div>
                    <p className="text-[9px] text-gray-500 mt-1">
                      {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[10px] text-gray-600 italic">Nenhuma meta ativa.</p>
          )}
        </div>
      </section>
    </aside>
  );
};

export default RightPanel;
