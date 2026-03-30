import React from 'react';
import { Activity, TrendingUp, TrendingDown, Target, Wallet, PanelRight, PanelLeft, RefreshCcw } from 'lucide-react';
import Tooltip from './Tooltip';
import { formatCurrency } from '../utils/formatters';
import { Button } from './ui/Button';

interface TopBarProps {
  data: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    projectedBalance: number;
    freeCapital: number;
  };
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onToggleRightPanel: () => void;
  isRightPanelOpen: boolean;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ 
  data, 
  onToggleSidebar, 
  isSidebarOpen, 
  onToggleRightPanel, 
  isRightPanelOpen,
  onRefresh,
  isRefreshing = false
}) => {
  return (
    <header className="h-11 flex-shrink-0 bg-brand-graphite border-b border-brand-lead/20 relative z-50 overflow-visible" role="banner">
      <div className="flex items-center h-full px-2 gap-2 md:gap-4 overflow-visible">
        {/* Toggle Sidebar Esquerda */}
        <Button 
          onClick={onToggleSidebar}
          variant={isSidebarOpen ? "primary" : "ghost"}
          size="icon"
          className={`hidden lg:flex p-1.5 rounded-md transition-all ${isSidebarOpen ? 'bg-brand-blue text-brand-graphite' : 'bg-brand-lead/30 text-gray-400 hover:text-white'}`}
          title={isSidebarOpen ? "Ocultar Menu" : "Mostrar Menu"}
          aria-label={isSidebarOpen ? "Ocultar Menu Lateral" : "Mostrar Menu Lateral"}
          aria-expanded={isSidebarOpen}
        >
          <PanelLeft size={16} aria-hidden="true" />
        </Button>

        <div className="hidden lg:block h-4 w-[1px] bg-brand-lead/50 shrink-0" aria-hidden="true" />

        <div className="flex items-center gap-1.5 md:gap-3 overflow-visible" role="status" aria-live="polite">
          <Tooltip text="Soma de todos os saldos em contas e investimentos." position="bottom">
            <div className="flex items-center gap-1 whitespace-nowrap cursor-help group" aria-label={`Saldo Total: ${formatCurrency(data.totalBalance)}`}>
              <Wallet size={12} className="text-brand-blue/70 group-hover:text-brand-blue transition-colors" aria-hidden="true" />
              <span className="hidden xl:inline text-[8px] uppercase tracking-wider text-gray-500 font-bold">Saldo:</span>
              <span className="text-[9px] md:text-[11px] font-mono font-bold text-brand-green">{formatCurrency(data.totalBalance)}</span>
            </div>
          </Tooltip>

          <div className="h-3 w-[1px] bg-brand-lead/30 shrink-0" aria-hidden="true" />

          <Tooltip text="Total de entradas confirmadas e previstas para o mês atual." position="bottom">
            <div className="flex items-center gap-1 whitespace-nowrap cursor-help group" aria-label={`Receitas do Mês: ${formatCurrency(data.monthlyIncome)}`}>
              <TrendingUp size={12} className="text-brand-green/70 group-hover:text-brand-green transition-colors" aria-hidden="true" />
              <span className="hidden xl:inline text-[8px] uppercase tracking-wider text-gray-500 font-bold">Rec:</span>
              <span className="text-[9px] md:text-[11px] font-mono font-bold text-brand-green">{formatCurrency(data.monthlyIncome)}</span>
            </div>
          </Tooltip>

          <Tooltip text="Total de saídas confirmadas e previstas para o mês atual." position="bottom">
            <div className="flex items-center gap-1 whitespace-nowrap cursor-help group" aria-label={`Despesas do Mês: ${formatCurrency(data.monthlyExpenses)}`}>
              <TrendingDown size={12} className="text-brand-red/70 group-hover:text-brand-red transition-colors" aria-hidden="true" />
              <span className="hidden xl:inline text-[8px] uppercase tracking-wider text-gray-500 font-bold">Desp:</span>
              <span className="text-[9px] md:text-[11px] font-mono font-bold text-brand-red">{formatCurrency(data.monthlyExpenses)}</span>
            </div>
          </Tooltip>

          <div className="h-3 w-[1px] bg-brand-lead/30 shrink-0" aria-hidden="true" />

          <Tooltip text="Estimativa de saldo ao final do mês (Saldo + Receitas - Despesas)." position="bottom">
            <div className="flex items-center gap-1 whitespace-nowrap cursor-help group" aria-label={`Projeção de Saldo: ${formatCurrency(data.projectedBalance)}`}>
              <Activity size={12} className="text-brand-orange/70 group-hover:text-brand-orange transition-colors" aria-hidden="true" />
              <span className="hidden xl:inline text-[8px] uppercase tracking-wider text-gray-500 font-bold">Proj:</span>
              <span className="text-[9px] md:text-[11px] font-mono font-bold text-brand-orange">{formatCurrency(data.projectedBalance)}</span>
            </div>
          </Tooltip>

          <Tooltip text="Valor disponível após subtrair despesas comprometidas e reservas." position="bottom">
            <div className="flex items-center gap-1 whitespace-nowrap cursor-help group" aria-label={`Capital Livre: ${formatCurrency(data.freeCapital)}`}>
              <Target size={12} className="text-brand-green/70 group-hover:text-brand-green transition-colors" aria-hidden="true" />
              <span className="hidden xl:inline text-[8px] uppercase tracking-wider text-gray-500 font-bold">Livre:</span>
              <span className="text-[9px] md:text-[11px] font-mono font-bold text-brand-green">{formatCurrency(data.freeCapital)}</span>
            </div>
          </Tooltip>
        </div>

        <div className="hidden sm:flex items-center gap-4 ml-auto shrink-0">
          <Button
            onClick={onRefresh}
            variant="ghost"
            size="icon"
            className="p-1.5 rounded-md bg-brand-lead/30 text-gray-400 hover:text-white transition-all"
            title="Atualizar Dados"
            disabled={isRefreshing}
          >
            <RefreshCcw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          </Button>

          <div className="flex items-center gap-2" role="status" aria-live="polite">
            <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" aria-hidden="true" />
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">LIVE TELEMETRY</span>
          </div>
          <Button 
            onClick={onToggleRightPanel}
            variant={isRightPanelOpen ? "primary" : "ghost"}
            size="icon"
            className={`p-1.5 rounded-md transition-all ${isRightPanelOpen ? 'bg-brand-blue text-brand-graphite' : 'bg-brand-lead/30 text-gray-400 hover:text-white'}`}
            title={isRightPanelOpen ? "Ocultar Painel Lateral" : "Mostrar Painel Lateral"}
            aria-label={isRightPanelOpen ? "Ocultar Painel Lateral" : "Mostrar Painel Lateral"}
            aria-expanded={isRightPanelOpen}
          >
            <PanelRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
