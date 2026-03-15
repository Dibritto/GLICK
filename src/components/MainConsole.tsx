import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Zap, Clock, ShieldCheck, ListFilter, BarChart3, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import ModuleMarketplace from './ModuleMarketplace';
import MovementsView from './MovementsView';
import AccountsView from './AccountsView';
import CardsView from './CardsView';
import GoalsView from './GoalsView';
import CategoriesView from './CategoriesView';
import ReportsView from './ReportsView';
import InvestmentsView from './InvestmentsView';

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  account_name: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'confirmed' | 'pending';
}

interface Account {
  id: string;
  balance: number;
}

interface MainConsoleProps {
  activeView?: string;
  onOpenTransactionModal: (type?: 'income' | 'expense') => void;
}

const MainConsole: React.FC<MainConsoleProps> = ({ 
  activeView = 'dashboard',
  onOpenTransactionModal
}) => {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const [transRes, accRes, goalsRes] = await Promise.all([
        fetch('/api/transactions', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/accounts', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/goals', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (transRes.ok) {
        const data = await transRes.json();
        setTransactions(data);
      }

      if (accRes.ok) {
        const data = await accRes.json();
        setAccounts(data);
      }

      if (goalsRes.ok) {
        const data = await goalsRes.json();
        setGoals(data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  if (activeView === 'marketplace') return <ModuleMarketplace />;
  if (activeView === 'movimentacoes') return <MovementsView onAddTransaction={() => onOpenTransactionModal()} />;
  if (activeView === 'receitas') return <MovementsView typeFilter="income" title="Gestão de Receitas" onAddTransaction={() => onOpenTransactionModal('income')} />;
  if (activeView === 'despesas') return <MovementsView typeFilter="expense" title="Gestão de Despesas" onAddTransaction={() => onOpenTransactionModal('expense')} />;
  if (activeView === 'contas') return <AccountsView />;
  if (activeView === 'cartoes') return <CardsView />;
  if (activeView === 'metas') return <GoalsView />;
  if (activeView === 'categorias') return <CategoriesView />;
  if (activeView === 'relatorios') return <ReportsView />;
  if (activeView === 'investimentos') return <InvestmentsView />;

  if (activeView !== 'dashboard') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="p-4 bg-brand-blue/10 rounded-full text-brand-blue">
          <Zap size={32} />
        </div>
        <h2 className="text-xl font-bold text-white uppercase italic font-serif">Módulo em Desenvolvimento</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          Esta funcionalidade está sendo implementada. Em breve você terá acesso total à telemetria deste módulo.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-brand-blue text-brand-graphite font-bold rounded-lg text-xs uppercase tracking-widest"
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  const currentBalance = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);
  const reservedBalance = goals.reduce((acc, curr) => acc + Number(curr.current_amount), 0);
  const confirmedTransactions = transactions.filter(t => t.status === 'confirmed');
  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  
  const predictedIncome = pendingTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
    
  const predictedExpense = pendingTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const finalPredictedBalance = currentBalance + predictedIncome - predictedExpense;

  // Cálculo de Gasto Médio Diário (últimos 30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const last30DaysExpenses = confirmedTransactions
    .filter(t => t.type === 'expense' && new Date(t.date) >= thirtyDaysAgo)
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
  
  const dailyAverageSpending = last30DaysExpenses / 30;
  const financialAutonomy = dailyAverageSpending > 0 ? Math.floor(currentBalance / dailyAverageSpending) : 0;

  // Mock chart data based on transactions
  const chartData = [
    { name: '01/03', gastos: 120 },
    { name: '05/03', gastos: 450 },
    { name: '10/03', gastos: 300 },
    { name: '15/03', gastos: 900 },
    { name: '20/03', gastos: 200 },
    { name: '25/03', gastos: 600 },
    { name: '30/03', gastos: 400 },
  ];

  return (
    <main className="flex-1 p-4 md:p-8 space-y-8">
      {/* PAINEL 1 — SALDO PROJETADO */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-brand-blue" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Console de Projeção Financeira</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div className="glass-panel technical-border p-6 rounded-lg glow-blue-hover transition-all">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Saldo Atual</p>
            <p className="text-2xl font-mono font-bold text-white">R$ {currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-brand-green">
              <TrendingUp size={12} />
              <span>Disponível em {accounts.length} contas</span>
            </div>
          </div>

          <div className="glass-panel technical-border p-5 rounded-xl glow-blue-hover transition-all">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Receitas Previstas</p>
            <p className="text-2xl font-mono font-bold text-brand-green">R$ {predictedIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500">
              <Clock size={12} />
              <span>Lançamentos pendentes</span>
            </div>
          </div>

          <div className="glass-panel technical-border p-5 rounded-xl glow-blue-hover transition-all">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Despesas Previstas</p>
            <p className="text-2xl font-mono font-bold text-brand-red">R$ {predictedExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500">
              <TrendingDown size={12} />
              <span>Contas e faturas</span>
            </div>
          </div>

          <div className="bg-brand-blue/10 border border-brand-blue/30 p-6 rounded-lg glow-blue">
            <p className="text-[10px] uppercase tracking-widest text-brand-blue mb-2">Saldo Final Previsto</p>
            <p className="text-2xl font-mono font-bold text-brand-blue">R$ {finalPredictedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-brand-blue/70">
              <ShieldCheck size={12} />
              <span>Projeção de liquidez</span>
            </div>
          </div>
        </div>
      </section>

      {/* PAINEL 2 — GRÁFICO DE EVOLUÇÃO E ESTADO DO DINHEIRO */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-brand-blue" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Fluxo de Gastos Mensal</h2>
          </div>
          <div className="glass-panel technical-border p-6 rounded-lg h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2CC7FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2CC7FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#3C3C45" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#8E9299" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#8E9299" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1A1A1D', border: '1px solid #3C3C45', fontSize: '12px' }}
                  itemStyle={{ color: '#2CC7FF' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="gastos" 
                  stroke="#2CC7FF" 
                  fillOpacity={1} 
                  fill="url(#colorGastos)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-brand-orange" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Distribuição de Liquidez</h2>
          </div>

          <div className="glass-panel technical-border p-6 rounded-lg space-y-6 h-[300px] flex flex-col justify-center">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-bold text-gray-200">Dinheiro Comprometido</p>
                  <p className="text-[10px] text-gray-500">Contas fixas e faturas já fechadas</p>
                </div>
                <p className="text-sm font-mono font-bold text-brand-red">R$ {predictedExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="h-2 w-full bg-brand-lead/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${Math.min(100, (predictedExpense / currentBalance) * 100)}%` }} 
                  className="h-full bg-brand-red" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-bold text-gray-200">Dinheiro Reservado</p>
                  <p className="text-[10px] text-gray-500">Metas e fundo de emergência</p>
                </div>
                <p className="text-sm font-mono font-bold text-brand-orange">R$ {reservedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="h-2 w-full bg-brand-lead/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${Math.min(100, (reservedBalance / currentBalance) * 100)}%` }} 
                  className="h-full bg-brand-orange" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-bold text-gray-200">Dinheiro Livre</p>
                  <p className="text-[10px] text-gray-500">Disponível para gastos discricionários</p>
                </div>
                <p className="text-sm font-mono font-bold text-brand-green">R$ {Math.max(0, currentBalance - predictedExpense - reservedBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="h-2 w-full bg-brand-lead/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${Math.max(0, 100 - ((predictedExpense + reservedBalance) / currentBalance) * 100)}%` }} 
                  className="h-full bg-brand-green" 
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* PAINEL 3 — MOVIMENTAÇÕES RECENTES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListFilter size={18} className="text-brand-blue" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Movimentações Recentes</h2>
          </div>
          <button className="text-[10px] uppercase font-bold text-brand-blue hover:underline">Ver Tudo</button>
        </div>

        <div className="glass-panel technical-border rounded-lg overflow-hidden overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-brand-lead/20 border-b border-brand-lead/30">
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Data</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Descrição</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Categoria</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Conta</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-lead/20">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center">
                    <Loader2 size={24} className="text-brand-blue animate-spin mx-auto" />
                  </td>
                </tr>
              ) : confirmedTransactions.slice(0, 5).map((t) => (
                <tr key={t.id} className="hover:bg-brand-lead/10 transition-colors group cursor-pointer">
                  <td className="px-6 py-4 text-xs font-mono text-gray-400">
                    {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-200">{t.description}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded bg-brand-lead/30 text-[10px] text-gray-400">{t.category}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">{t.account_name}</td>
                  <td className={`px-6 py-4 text-xs font-mono font-bold text-right ${t.type === 'income' ? 'text-brand-green' : 'text-brand-red'}`}>
                    {t.type === 'income' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PAINEL 4 — VELOCIDADE DO DINHEIRO */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
        <div className="glass-panel technical-border p-6 rounded-xl flex items-center gap-6">
          <div className="w-16 h-16 rounded-full border-4 border-brand-blue/20 flex items-center justify-center relative">
            <div className="absolute inset-0 border-4 border-brand-blue border-t-transparent rounded-full animate-spin-slow" />
            <TrendingUp size={24} className="text-brand-blue" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Gasto Médio Diário</p>
            <p className="text-3xl font-mono font-bold text-white">R$ {dailyAverageSpending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-[10px] text-brand-blue mt-1">Calculado nos últimos 30 dias</p>
          </div>
        </div>

        <div className="glass-panel technical-border p-6 rounded-xl flex items-center gap-6">
          <div className="w-16 h-16 rounded-full border-4 border-brand-green/20 flex items-center justify-center relative">
            <Clock size={24} className="text-brand-green" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Autonomia Financeira</p>
            <p className="text-3xl font-mono font-bold text-brand-green">{financialAutonomy} Dias</p>
            <p className="text-[10px] text-gray-400 mt-1">Baseado no saldo atual e gasto médio</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default MainConsole;
