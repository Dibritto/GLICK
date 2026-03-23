import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Zap, Clock, ShieldCheck, ListFilter, BarChart3, Loader2, CreditCard } from 'lucide-react';
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
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import Tooltip from './Tooltip';
import ModuleMarketplace from './ModuleMarketplace';
import ForecastView from './ForecastView';
import MovementsView from './MovementsView';
import AccountsView from './AccountsView';
import CardsView from './CardsView';
import GoalsView from './GoalsView';
import CategoriesView from './CategoriesView';
import ReportsView from './ReportsView';
import InvestmentsView from './InvestmentsView';
import SettingsView from './SettingsView';
import WealthView from './WealthView';
import { CryptoView } from './CryptoView';

import { Account, Goal, Card, Category } from '../types';

interface MainConsoleProps {
  activeView?: string;
  installedModules?: string[];
  onOpenTransactionModal: (type?: 'income' | 'expense' | 'transfer', lockType?: boolean, goal?: Goal) => void;
  onOpenAccountModal: () => void;
  onEditAccount: (account: Account) => void;
  onOpenGoalModal: () => void;
  onEditGoal: (goal: Goal) => void;
  onOpenGoalFundingModal: (type: 'add' | 'withdraw', goal: Goal) => void;
  onOpenCardModal: () => void;
  onEditCard: (card: Card) => void;
  onOpenCategoryModal: () => void;
  onEditCategory: (category: Category) => void;
  onEditTransaction: (transaction: any) => void;
  onNavigate?: (view: string) => void;
}

const MainConsole: React.FC<MainConsoleProps> = ({ 
  activeView = 'dashboard',
  installedModules = ['core'],
  onOpenTransactionModal,
  onOpenAccountModal,
  onEditAccount,
  onOpenGoalModal,
  onEditGoal,
  onOpenGoalFundingModal,
  onOpenCardModal,
  onEditCard,
  onOpenCategoryModal,
  onEditCategory,
  onEditTransaction,
  onNavigate
}) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { transactions, accounts, goals, derivedData, isLoading } = useFinance();
  const { 
    totalBalance, 
    reservedBalance,
    committedBalance,
    totalCardDebt,
    netWorth,
    freeCapital,
    predictedIncome, 
    predictedExpense, 
    projectedBalance,
    pendingIncome,
    pendingExpense,
    moneyVelocity,
    retentionRate,
    dailyAverageSpending,
    financialAutonomy,
    chartData,
    confirmedTransactions
  } = derivedData;

  if (activeView === 'marketplace') return <ModuleMarketplace />;
  if (activeView === 'fluxo-caixa') return <MovementsView onAddTransaction={() => onOpenTransactionModal()} onEditTransaction={onEditTransaction} />;
  if (activeView === 'contas') return <AccountsView onAddAccount={onOpenAccountModal} onAddTransfer={() => onOpenTransactionModal('transfer')} onEditAccount={onEditAccount} onEditTransaction={onEditTransaction} />;
  if (activeView === 'cartoes') return <CardsView onAddCard={onOpenCardModal} onEditCard={onEditCard} />;
  if (activeView === 'metas') return <GoalsView onAddGoal={onOpenGoalModal} onEditGoal={onEditGoal} onAddFunds={(goal) => onOpenGoalFundingModal('add', goal)} onWithdrawFunds={(goal) => onOpenGoalFundingModal('withdraw', goal)} />;
  if (activeView === 'categorias') return <CategoriesView onAddCategory={onOpenCategoryModal} onEditCategory={onEditCategory} />;
  if (activeView === 'relatorios') return <ReportsView />;
  if (activeView === 'projecoes') return <ForecastView />;
  if (activeView === 'crypto') return <CryptoView isInstalled={installedModules.includes('crypto')} onNavigateToMarketplace={() => onNavigate?.('marketplace')} />;
  if (activeView === 'investimentos') return <InvestmentsView isInstalled={installedModules.includes('investments')} onNavigateToMarketplace={() => onNavigate?.('marketplace')} />;
  if (activeView === 'patrimonio') return <WealthView isInstalled={installedModules.includes('wealth')} onNavigateToMarketplace={() => onNavigate?.('marketplace')} />;
  if (activeView === 'configuracoes') return <SettingsView />;

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

  return (
    <main className="flex-1 p-4 md:p-8 space-y-8">
      {/* PAINEL 1 — ESTADOS DO DINHEIRO */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-brand-blue" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Estados do Dinheiro (Core Engine)</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="glass-panel technical-border p-5 md:p-6 rounded-lg hover:border-brand-blue/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group card-container min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold truncate">Saldo Total</p>
            <div className="fluid-value font-mono font-bold text-white">
              <span className="currency-symbol">R$</span>
              {formatCurrency(totalBalance, false)}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500">
              <TrendingUp size={12} className="text-brand-green" />
              <span className="truncate">Soma de todas as contas</span>
            </div>
          </div>

          <div className="glass-panel technical-border p-5 md:p-6 rounded-lg hover:border-brand-red/30 transition-all group card-container min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-brand-red mb-2 font-bold">Comprometido</p>
            <div className="fluid-value font-mono font-bold text-brand-red">
              <span className="currency-symbol">R$</span>
              {formatCurrency(committedBalance, false)}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500">
              <CreditCard size={12} className="text-brand-red" />
              <span className="truncate">Faturas + Pendências</span>
            </div>
          </div>

          <div className="glass-panel technical-border p-5 md:p-6 rounded-lg hover:border-brand-orange/30 transition-all group card-container min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-brand-orange mb-2 font-bold">Reservado</p>
            <div className="fluid-value font-mono font-bold text-brand-orange">
              <span className="currency-symbol">R$</span>
              {formatCurrency(reservedBalance, false)}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500">
              <ShieldCheck size={12} className="text-brand-orange" />
              <span className="truncate">Alocado em Metas</span>
            </div>
          </div>

          <div className="bg-brand-green/5 border border-brand-green/30 p-5 md:p-6 rounded-lg shadow-[0_0_20px_rgba(46,204,113,0.05)] group card-container min-w-0 hover:border-brand-green/50 transition-all">
            <p className="text-[10px] uppercase tracking-widest text-brand-green mb-2 font-bold">Capital Livre</p>
            <div className="fluid-value font-mono font-bold text-brand-green">
              <span className="currency-symbol">R$</span>
              {formatCurrency(freeCapital, false)}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-brand-green/70">
              <Zap size={12} />
              <span className="truncate">Disponível para uso</span>
            </div>
          </div>
        </div>
      </section>

      {/* PAINEL 2 — GRÁFICO DE EVOLUÇÃO E VELOCIDADE */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-brand-blue" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Fluxo de Gastos Mensal</h2>
          </div>
          <div className="glass-panel technical-border p-6 rounded-lg h-[300px]">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2ECC71" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2ECC71" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF3B30" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF3B30" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#3C3C45" vertical={false} />
                <XAxis 
                  dataKey="month" 
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
                  tickFormatter={(value) => formatCurrency(value, false)}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1A1A1D', border: '1px solid #3C3C45', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="receitas" 
                  stroke="#2ECC71" 
                  fillOpacity={1} 
                  fill="url(#colorReceitas)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="despesas" 
                  stroke="#FF3B30" 
                  fillOpacity={1} 
                  fill="url(#colorDespesas)" 
                />
              </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-brand-blue" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Velocidade & Autonomia</h2>
          </div>
          <div className="glass-panel technical-border p-6 rounded-lg grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Velocidade do Dinheiro</p>
                <p className="text-lg font-mono font-bold text-white">{moneyVelocity}</p>
              </div>
              <div className="h-1.5 w-full bg-brand-lead/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(Number(moneyVelocity) * 100, 100)}%` }}
                  className={`h-full ${Number(moneyVelocity) > 0.8 ? 'bg-brand-red' : 'bg-brand-blue'}`}
                />
              </div>
              <p className="text-[9px] text-gray-600 italic">Taxa de evasão de capital vs receita.</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Autonomia Financeira</p>
                <p className="text-lg font-mono font-bold text-brand-green">{financialAutonomy} Dias</p>
              </div>
              <div className="h-1.5 w-full bg-brand-lead/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((financialAutonomy / 365) * 100, 100)}%` }}
                  className="h-full bg-brand-green"
                />
              </div>
              <p className="text-[9px] text-gray-600 italic">Dias de sobrevivência sem novas receitas.</p>
            </div>
          </div>

          <div className="glass-panel technical-border p-6 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Projeção de Saldo Final</p>
              <Tooltip 
                text={`Cálculo: Saldo Atual (${formatCurrency(totalBalance)}) + Entradas Pendentes (${formatCurrency(pendingIncome)}) - Saídas Pendentes (${formatCurrency(pendingExpense)}) + Recorrências Futuras (${formatCurrency(predictedIncome - predictedExpense)})`} 
                position="top"
              >
                <p className="text-lg font-mono font-bold text-brand-orange cursor-help border-b border-dashed border-brand-orange/50">
                  {formatCurrency(projectedBalance)}
                </p>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-500 italic">
              <Clock size={12} />
              <span>Considerando lançamentos pendentes e recorrências.</span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-brand-blue" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Metodologia GLICK (Ideal)</h2>
          </div>
          <div className="glass-panel technical-border p-6 rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-brand-lead/10 rounded-lg border border-brand-lead/20">
                <p className="text-[10px] uppercase text-gray-500 mb-1">Capital Livre (40%)</p>
                <p className="text-sm font-mono font-bold text-brand-blue">{formatCurrency(derivedData.monthlyIncome * 0.4)}</p>
              </div>
              <div className="p-3 bg-brand-lead/10 rounded-lg border border-brand-lead/20">
                <p className="text-[10px] uppercase text-gray-500 mb-1">Reserva (30%)</p>
                <p className="text-sm font-mono font-bold text-brand-green">{formatCurrency(derivedData.monthlyIncome * 0.3)}</p>
              </div>
              <div className="p-3 bg-brand-lead/10 rounded-lg border border-brand-lead/20">
                <p className="text-[10px] uppercase text-gray-500 mb-1">Invest. (20%)</p>
                <p className="text-sm font-mono font-bold text-brand-orange">{formatCurrency(derivedData.monthlyIncome * 0.2)}</p>
              </div>
              <div className="p-3 bg-brand-lead/10 rounded-lg border border-brand-lead/20">
                <p className="text-[10px] uppercase text-gray-500 mb-1">Lazer (10%)</p>
                <p className="text-sm font-mono font-bold text-brand-red">{formatCurrency(derivedData.monthlyIncome * 0.1)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-500 italic">
              <Activity size={12} />
              <span>Sua autonomia atual é de {financialAutonomy} dias.</span>
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
          <button 
            onClick={() => onNavigate?.('fluxo-caixa')}
            className="text-[10px] uppercase font-bold text-brand-blue hover:underline"
          >
            Ver Tudo
          </button>
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
              ) : confirmedTransactions.length > 0 ? (
                confirmedTransactions.slice(0, 5).map((t) => (
                  <tr 
                    key={t.id} 
                    onClick={() => onEditTransaction(t)}
                    className="hover:bg-brand-lead/10 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 text-xs font-mono text-gray-400">
                      {formatDate(t.date)}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-200">{t.description}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-brand-lead/30 text-[10px] text-gray-400">{t.category}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">{t.account_name}</td>
                    <td className={`px-6 py-4 text-xs font-mono font-bold text-right ${t.type === 'income' ? 'text-brand-green' : t.type === 'expense' ? 'text-brand-red' : 'text-brand-blue'}`}>
                      {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '⇄'} {formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <Clock size={24} className="text-gray-600" />
                      <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Aguardando Telemetria de Fluxo</p>
                    </div>
                  </td>
                </tr>
              )}
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
            <p className="text-3xl font-mono font-bold text-white">{formatCurrency(dailyAverageSpending)}</p>
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
