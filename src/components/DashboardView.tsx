import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Zap, Clock, ShieldCheck, ListFilter, BarChart3, Loader2, CreditCard, Wallet } from 'lucide-react';
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

import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
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

const DashboardView: React.FC<MainConsoleProps> = ({ 
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
    investedBalance,
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

  return (
    <main className="flex-1 p-4 md:p-8 space-y-8" aria-label="Painel de controle financeiro">
      {/* PAINEL 1 — ESTADOS DO DINHEIRO */}
      <section className="space-y-4" aria-labelledby="money-states-title">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-brand-blue" aria-hidden="true" />
          <h2 id="money-states-title" className="text-sm font-bold uppercase tracking-widest text-gray-400">Estados do Dinheiro (Core Engine)</h2>
        </div>

        <div 
          className="grid gap-4 md:gap-4" 
          style={{ 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' 
          }}
          role="list"
        >
          <article className="glass-panel technical-border p-4 md:p-5 rounded-lg group card-container min-w-0 flex flex-col justify-between" role="listitem" aria-labelledby="total-balance-label">
            <p id="total-balance-label" className="text-[9px] uppercase tracking-widest text-gray-500 mb-2 font-bold leading-tight">Saldo em Conta</p>
            <div className="text-lg md:text-xl font-mono font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis" aria-label={`R$ ${formatCurrency(totalBalance, false)}`}>
              <span className="text-[10px] md:text-xs mr-1 opacity-50" aria-hidden="true">R$</span>
              {formatCurrency(totalBalance, false)}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[9px] text-gray-500">
              <Wallet size={10} className="text-brand-blue" aria-hidden="true" />
              <span className="truncate">Disponível em contas</span>
            </div>
          </article>

          <article className="glass-panel technical-border p-4 md:p-5 rounded-lg group card-container min-w-0 flex flex-col justify-between" role="listitem" aria-labelledby="invested-balance-label">
            <p id="invested-balance-label" className="text-[9px] uppercase tracking-widest text-brand-blue mb-2 font-bold leading-tight">Investido</p>
            <div className="text-lg md:text-xl font-mono font-bold text-brand-blue whitespace-nowrap overflow-hidden text-ellipsis" aria-label={`R$ ${formatCurrency(investedBalance, false)}`}>
              <span className="text-[10px] md:text-xs mr-1 opacity-50" aria-hidden="true">R$</span>
              {formatCurrency(investedBalance, false)}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[9px] text-gray-500">
              <TrendingUp size={10} className="text-brand-blue" aria-hidden="true" />
              <span className="truncate">Criptos e Ações</span>
            </div>
          </article>

          <article className="glass-panel technical-border p-4 md:p-5 rounded-lg group card-container min-w-0 flex flex-col justify-between" role="listitem" aria-labelledby="reserved-balance-label">
            <p id="reserved-balance-label" className="text-[9px] uppercase tracking-widest text-brand-orange mb-2 font-bold leading-tight">Reservado</p>
            <div className="text-lg md:text-xl font-mono font-bold text-brand-orange whitespace-nowrap overflow-hidden text-ellipsis" aria-label={`R$ ${formatCurrency(reservedBalance, false)}`}>
              <span className="text-[10px] md:text-xs mr-1 opacity-50" aria-hidden="true">R$</span>
              {formatCurrency(reservedBalance, false)}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[9px] text-gray-500">
              <ShieldCheck size={10} className="text-brand-orange" aria-hidden="true" />
              <span className="truncate">Alocado em Metas</span>
            </div>
          </article>

          <article className="glass-panel technical-border p-4 md:p-5 rounded-lg group card-container min-w-0 flex flex-col justify-between" role="listitem" aria-labelledby="committed-balance-label">
            <p id="committed-balance-label" className="text-[9px] uppercase tracking-widest text-brand-red mb-2 font-bold leading-tight">Comprometido</p>
            <div className="text-lg md:text-xl font-mono font-bold text-brand-red whitespace-nowrap overflow-hidden text-ellipsis" aria-label={`R$ ${formatCurrency(committedBalance, false)}`}>
              <span className="text-[10px] md:text-xs mr-1 opacity-50" aria-hidden="true">R$</span>
              {formatCurrency(committedBalance, false)}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[9px] text-gray-500">
              <CreditCard size={10} className="text-brand-red" aria-hidden="true" />
              <span className="truncate">Faturas + Pendências</span>
            </div>
          </article>

          <article className="bg-brand-green/5 border border-brand-green/30 p-4 md:p-5 rounded-lg shadow-[0_0_20px_rgba(46,204,113,0.05)] group card-container min-w-0 hover:border-brand-green/50 flex flex-col justify-between" role="listitem" aria-labelledby="free-capital-label">
            <p id="free-capital-label" className="text-[9px] uppercase tracking-widest text-brand-green mb-2 font-bold leading-tight">Capital Livre</p>
            <div className="text-lg md:text-xl font-mono font-bold text-brand-green whitespace-nowrap overflow-hidden text-ellipsis" aria-label={`R$ ${formatCurrency(freeCapital, false)}`}>
              <span className="text-[10px] md:text-xs mr-1 opacity-50" aria-hidden="true">R$</span>
              {formatCurrency(freeCapital, false)}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[9px] text-brand-green/70">
              <Zap size={10} aria-hidden="true" />
              <span className="truncate">Disponível para uso</span>
            </div>
          </article>

          <article className="bg-white/5 border border-white/10 p-4 md:p-5 rounded-lg group card-container min-w-0 flex flex-col justify-between" role="listitem" aria-labelledby="net-worth-label">
            <p id="net-worth-label" className="text-[9px] uppercase tracking-widest text-gray-400 mb-2 font-bold leading-tight">Patrimônio Líquido</p>
            <div className="text-lg md:text-xl font-mono font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis" aria-label={`R$ ${formatCurrency(netWorth, false)}`}>
              <span className="text-[10px] md:text-xs mr-1 opacity-50" aria-hidden="true">R$</span>
              {formatCurrency(netWorth, false)}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[9px] text-gray-500">
              <Activity size={10} className="text-brand-blue" aria-hidden="true" />
              <span className="truncate">Total acumulado</span>
            </div>
          </article>
        </div>
      </section>

      {/* PAINEL 2 — GRÁFICO DE EVOLUÇÃO E VELOCIDADE */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="space-y-4" aria-labelledby="spending-flow-title">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-brand-blue" aria-hidden="true" />
            <h2 id="spending-flow-title" className="text-sm font-bold uppercase tracking-widest text-gray-400">Fluxo de Gastos Mensal</h2>
          </div>
          <div className="glass-panel technical-border p-6 rounded-lg h-[300px]" role="img" aria-label="Gráfico de área mostrando receitas e despesas mensais">
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

        <section className="space-y-4" aria-labelledby="velocity-autonomy-title">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-brand-blue" aria-hidden="true" />
            <h2 id="velocity-autonomy-title" className="text-sm font-bold uppercase tracking-widest text-gray-400">Velocidade & Autonomia</h2>
          </div>
          <div className="glass-panel technical-border p-6 rounded-lg grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <p className="text-[10px] uppercase tracking-widest text-gray-500" id="money-velocity-label">Velocidade do Dinheiro</p>
                <p className="text-xl font-mono font-bold text-white" aria-labelledby="money-velocity-label">{moneyVelocity}</p>
              </div>
              <div className="h-2 w-full bg-brand-lead/20 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.min(Number(moneyVelocity) * 100, 100)} aria-valuemin={0} aria-valuemax={100} aria-labelledby="money-velocity-label">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(Number(moneyVelocity) * 100, 100)}%` }}
                  className={`h-full ${Number(moneyVelocity) > 0.8 ? 'bg-brand-red' : 'bg-brand-blue'}`}
                />
              </div>
              <p className="text-[10px] text-gray-600 italic leading-relaxed">Taxa de evasão de capital vs receita mensal.</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <p className="text-[10px] uppercase tracking-widest text-gray-500" id="financial-autonomy-label">Autonomia Financeira</p>
                <p className="text-xl font-mono font-bold text-brand-green" aria-labelledby="financial-autonomy-label">{financialAutonomy} Dias</p>
              </div>
              <div className="h-2 w-full bg-brand-lead/20 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.min((financialAutonomy / 365) * 100, 100)} aria-valuemin={0} aria-valuemax={100} aria-labelledby="financial-autonomy-label">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((financialAutonomy / 365) * 100, 100)}%` }}
                  className="h-full bg-brand-green"
                />
              </div>
              <p className="text-[10px] text-gray-600 italic leading-relaxed">Dias de sobrevivência baseados no saldo e gasto médio.</p>
            </div>
          </div>

          <div className="glass-panel technical-border p-6 rounded-lg space-y-4" role="status" aria-labelledby="projected-balance-label">
            <div className="flex items-center justify-between">
              <p id="projected-balance-label" className="text-[10px] uppercase tracking-widest text-gray-500">Projeção de Saldo Final</p>
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
              <Clock size={12} aria-hidden="true" />
              <span>Considerando lançamentos pendentes e recorrências.</span>
            </div>
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="glick-methodology-title">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-brand-blue" aria-hidden="true" />
            <h2 id="glick-methodology-title" className="text-sm font-bold uppercase tracking-widest text-gray-400">Metodologia GLICK (Ideal)</h2>
          </div>
          <div className="glass-panel technical-border p-6 rounded-lg space-y-4">
            <div 
              className="grid gap-4" 
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}
              role="list"
            >
              <article className="p-3 bg-brand-lead/10 rounded-lg border border-brand-lead/20 transition-colors hover:border-brand-lead/40" role="listitem">
                <p className="text-[10px] uppercase text-gray-500 mb-1">Capital Livre (40%)</p>
                <p className="text-sm font-mono font-bold text-brand-blue">{formatCurrency(derivedData.monthlyIncome * 0.4)}</p>
              </article>
              <article className="p-3 bg-brand-lead/10 rounded-lg border border-brand-lead/20 transition-colors hover:border-brand-lead/40" role="listitem">
                <p className="text-[10px] uppercase text-gray-500 mb-1">Reserva (30%)</p>
                <p className="text-sm font-mono font-bold text-brand-green">{formatCurrency(derivedData.monthlyIncome * 0.3)}</p>
              </article>
              <article className="p-3 bg-brand-lead/10 rounded-lg border border-brand-lead/20 transition-colors hover:border-brand-lead/40" role="listitem">
                <p className="text-[10px] uppercase text-gray-500 mb-1">Invest. (20%)</p>
                <p className="text-sm font-mono font-bold text-brand-orange">{formatCurrency(derivedData.monthlyIncome * 0.2)}</p>
              </article>
              <article className="p-3 bg-brand-lead/10 rounded-lg border border-brand-lead/20 transition-colors hover:border-brand-lead/40" role="listitem">
                <p className="text-[10px] uppercase text-gray-500 mb-1">Lazer (10%)</p>
                <p className="text-sm font-mono font-bold text-brand-red">{formatCurrency(derivedData.monthlyIncome * 0.1)}</p>
              </article>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-500 italic">
              <Activity size={12} aria-hidden="true" />
              <span>Sua autonomia atual é de {financialAutonomy} dias.</span>
            </div>
          </div>
        </section>
      </div>

      {/* PAINEL 3 — MOVIMENTAÇÕES RECENTES */}
      <section className="space-y-4" aria-labelledby="recent-movements-title">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListFilter size={18} className="text-brand-blue" aria-hidden="true" />
            <h2 id="recent-movements-title" className="text-sm font-bold uppercase tracking-widest text-gray-400">Movimentações Recentes</h2>
          </div>
          <Button 
            onClick={() => onNavigate?.('fluxo-caixa')}
            variant="ghost"
            size="sm"
            className="text-[10px] uppercase font-bold text-brand-blue hover:text-brand-blue/80"
            aria-label="Ver todas as movimentações"
          >
            Ver Tudo
          </Button>
        </div>

        <div className="glass-panel technical-border rounded-lg overflow-hidden overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <caption className="sr-only">Lista das 5 movimentações financeiras mais recentes</caption>
            <thead>
              <tr className="bg-brand-lead/20 border-b border-brand-lead/30">
                <th scope="col" className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Data</th>
                <th scope="col" className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Descrição</th>
                <th scope="col" className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Categoria</th>
                <th scope="col" className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">Conta</th>
                <th scope="col" className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-lead/20">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center">
                    <Loader2 size={24} className="text-brand-blue animate-spin mx-auto" aria-hidden="true" />
                    <span className="sr-only">Carregando movimentações...</span>
                  </td>
                </tr>
              ) : confirmedTransactions.length > 0 ? (
                confirmedTransactions.slice(0, 5).map((t) => (
                  <tr 
                    key={t.id} 
                    onClick={() => onEditTransaction(t)}
                    className="hover:bg-brand-lead/10 transition-colors group cursor-pointer relative"
                    aria-label={`${t.description}: ${formatCurrency(t.amount)} em ${formatDate(t.date)}`}
                  >
                    <td className="px-6 py-4 text-xs font-mono text-gray-400">
                      {formatDate(t.date)}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-200">
                      <div className="flex items-center gap-2">
                        {t.description}
                        <Activity size={10} className="text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="neutral">{t.category}</Badge>
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
                    <div className="flex flex-col items-center gap-2 opacity-50" role="status">
                      <Clock size={24} className="text-gray-600" aria-hidden="true" />
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
      <section 
        className="grid gap-6 pb-12" 
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
        aria-label="Métricas de velocidade e autonomia"
      >
        <article className="glass-panel technical-border p-6 rounded-xl flex items-center gap-6" role="status" aria-labelledby="daily-spending-label">
          <div className="w-16 h-16 rounded-full border-4 border-brand-blue/20 flex items-center justify-center relative" aria-hidden="true">
            <div className="absolute inset-0 border-4 border-brand-blue border-t-transparent rounded-full animate-spin-slow" />
            <TrendingUp size={24} className="text-brand-blue" />
          </div>
          <div>
            <p id="daily-spending-label" className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Gasto Médio Diário</p>
            <p className="text-3xl font-mono font-bold text-white" aria-label={formatCurrency(dailyAverageSpending)}>{formatCurrency(dailyAverageSpending)}</p>
            <p className="text-[10px] text-brand-blue mt-1">Calculado nos últimos 30 dias</p>
          </div>
        </article>

        <article className="glass-panel technical-border p-6 rounded-xl flex items-center gap-6" role="status" aria-labelledby="financial-autonomy-summary-label">
          <div className="w-16 h-16 rounded-full border-4 border-brand-green/20 flex items-center justify-center relative" aria-hidden="true">
            <Clock size={24} className="text-brand-green" />
          </div>
          <div>
            <p id="financial-autonomy-summary-label" className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Autonomia Financeira</p>
            <p className="text-3xl font-mono font-bold text-brand-green" aria-label={`${financialAutonomy} dias`}>{financialAutonomy} Dias</p>
            <p className="text-[10px] text-gray-400 mt-1">Baseado no saldo atual e gasto médio</p>
          </div>
        </article>
      </section>
    </main>
  );
};

export default DashboardView;
