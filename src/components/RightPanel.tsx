import React, { useState, useEffect } from 'react';
import { Calendar, Bell, Target, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  status: 'confirmed' | 'pending';
}

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  color: string;
}

const RightPanel: React.FC = () => {
  const { token } = useAuth();
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const [transRes, goalsRes] = await Promise.all([
        fetch('/api/transactions', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/goals', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (transRes.ok) {
        const data = await transRes.json();
        setPendingTransactions(data.filter((t: any) => t.status === 'pending').slice(0, 3));
      }

      if (goalsRes.ok) {
        const data = await goalsRes.json();
        setGoals(data.slice(0, 2));
      }
    } catch (error) {
      console.error('Erro ao buscar dados do painel lateral:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  return (
    <aside className="w-80 flex-shrink-0 border-l border-brand-lead/30 flex flex-col bg-brand-graphite overflow-y-auto no-scrollbar">
      {/* Alertas */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Alertas Críticos</h3>
          <span className="px-1.5 py-0.5 rounded bg-brand-orange/20 text-brand-orange text-[10px] font-bold">01</span>
        </div>

        <div className="space-y-2">
          <div className="p-3 rounded-md bg-brand-orange/5 border border-brand-orange/20 flex gap-3">
            <AlertTriangle size={16} className="text-brand-orange flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-brand-orange">Sincronização Ativa</p>
              <p className="text-[10px] text-gray-400 mt-1">Monitorando fluxos de caixa em tempo real.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[1px] w-full bg-brand-lead/20" />

      {/* Próximos Vencimentos */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Próximos Compromissos</h3>
          <Calendar size={14} className="text-gray-500" />
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={16} className="text-brand-blue animate-spin" />
            </div>
          ) : pendingTransactions.length > 0 ? (
            pendingTransactions.map((item) => (
              <div key={item.id} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`w-1 h-8 rounded-full ${item.type === 'income' ? 'bg-brand-green' : 'bg-brand-red'}`} />
                  <div>
                    <p className="text-xs font-bold text-gray-200">{item.description}</p>
                    <p className="text-[10px] text-gray-500">{new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                  </div>
                </div>
                <p className={`text-xs font-mono font-bold ${item.type === 'income' ? 'text-brand-green' : 'text-brand-red'}`}>
                  R$ {Number(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))
          ) : (
            <p className="text-[10px] text-gray-600 italic">Nenhum compromisso pendente.</p>
          )}
        </div>
      </div>

      <div className="h-[1px] w-full bg-brand-lead/20" />

      {/* Metas */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Metas Ativas</h3>
          <Target size={14} className="text-gray-500" />
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={16} className="text-brand-blue animate-spin" />
            </div>
          ) : goals.length > 0 ? (
            goals.map((goal) => {
              const progress = Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100);
              return (
                <div key={goal.id}>
                  <div className="flex justify-between text-[10px] mb-1.5">
                    <span className="text-gray-300 font-bold">{goal.name}</span>
                    <span style={{ color: goal.color }}>{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-brand-lead/30 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full" 
                      style={{ backgroundColor: goal.color }}
                    />
                  </div>
                  <p className="text-[9px] text-gray-500 mt-1">
                    R$ {Number(goal.current_amount).toLocaleString('pt-BR')} / R$ {Number(goal.target_amount).toLocaleString('pt-BR')}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="text-[10px] text-gray-600 italic">Nenhuma meta ativa.</p>
          )}
        </div>
      </div>
    </aside>
  );
};

export default RightPanel;
