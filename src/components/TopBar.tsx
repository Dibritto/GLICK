import React from 'react';
import { Activity, TrendingUp, TrendingDown, Target, Wallet } from 'lucide-react';
import Tooltip from './Tooltip';

interface TopBarProps {
  data: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    projectedBalance: number;
    freeCapital: number;
  };
}

const TopBar: React.FC<TopBarProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <header className="h-11 flex-shrink-0 bg-brand-graphite relative z-50 overflow-visible">
      <div className="flex items-center h-full px-4 gap-4 md:gap-8 overflow-visible">
        <Tooltip text="Soma de todos os saldos em contas e investimentos." position="bottom">
          <div className="flex items-center gap-2 whitespace-nowrap cursor-help group">
            <Wallet size={14} className="text-brand-blue/70 group-hover:text-brand-blue transition-colors" />
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Saldo Total:</span>
            <span className="text-xs font-mono font-bold text-brand-green">{formatCurrency(data.totalBalance)}</span>
          </div>
        </Tooltip>

        <div className="h-4 w-[1px] bg-brand-lead/50 shrink-0" />

        <Tooltip text="Total de entradas confirmadas e previstas para o mês atual." position="bottom">
          <div className="flex items-center gap-2 whitespace-nowrap cursor-help group">
            <TrendingUp size={14} className="text-brand-green/70 group-hover:text-brand-green transition-colors" />
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Receitas:</span>
            <span className="text-xs font-mono font-bold text-brand-green">{formatCurrency(data.monthlyIncome)}</span>
          </div>
        </Tooltip>

        <Tooltip text="Total de saídas confirmadas e previstas para o mês atual." position="bottom">
          <div className="flex items-center gap-2 whitespace-nowrap cursor-help group">
            <TrendingDown size={14} className="text-brand-red/70 group-hover:text-brand-red transition-colors" />
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Despesas:</span>
            <span className="text-xs font-mono font-bold text-brand-red">{formatCurrency(data.monthlyExpenses)}</span>
          </div>
        </Tooltip>

        <div className="h-4 w-[1px] bg-brand-lead/50 shrink-0" />

        <Tooltip text="Estimativa de saldo ao final do mês (Saldo + Receitas - Despesas)." position="bottom">
          <div className="flex items-center gap-2 whitespace-nowrap cursor-help group">
            <Activity size={14} className="text-brand-blue/70 group-hover:text-brand-blue transition-colors" />
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Projetado:</span>
            <span className="text-xs font-mono font-bold text-brand-blue">{formatCurrency(data.projectedBalance)}</span>
          </div>
        </Tooltip>

        <Tooltip text="Valor disponível após subtrair despesas comprometidas e reservas." position="bottom">
          <div className="flex items-center gap-2 whitespace-nowrap cursor-help group">
            <Target size={14} className="text-brand-orange/70 group-hover:text-brand-orange transition-colors" />
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Livre:</span>
            <span className="text-xs font-mono font-bold text-brand-orange">{formatCurrency(data.freeCapital)}</span>
          </div>
        </Tooltip>

        <div className="hidden sm:flex items-center gap-2 ml-auto shrink-0">
          <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">Live Telemetry</span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
