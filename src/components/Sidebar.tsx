import React from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Tags, 
  Target, 
  BarChart3, 
  Clock,
  Zap,
  Settings,
  ChevronRight,
  Package,
  ShoppingCart,
  Gem,
  Lock,
  X,
  LogOut
} from 'lucide-react';
import { motion } from 'motion/react';
import Tooltip from './Tooltip';
import { Badge } from './ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'core' },
  { id: 'fluxo-caixa', label: 'Fluxo de Caixa', icon: ArrowLeftRight, module: 'core' },
  { id: 'contas', label: 'Contas', icon: Wallet, module: 'core' },
  { id: 'cartoes', label: 'Cartões', icon: CreditCard, module: 'core' },
  { id: 'categorias', label: 'Categorias', icon: Tags, module: 'core' },
  { id: 'metas', label: 'Metas', icon: Target, module: 'core' },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3, module: 'core' },
  { id: 'projecoes', label: 'Projeções', icon: Clock, module: 'core' },
  { id: 'crypto', label: 'Cripto', icon: Zap, module: 'crypto', premium: true },
  { id: 'investimentos', label: 'Investimentos', icon: TrendingUp, module: 'investments', premium: true },
  { id: 'patrimonio', label: 'Patrimônio', icon: Gem, module: 'wealth', premium: true },
];

interface SidebarProps {
  onClose?: () => void;
  installedModules?: string[];
  activeView?: string;
  onViewChange?: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onClose, 
  installedModules = ['core'],
  activeView = 'dashboard',
  onViewChange
}) => {
  const { user, logout } = useAuth();
  const { derivedData, transactions } = useFinance();
  const { totalBalance, monthlyIncome, monthlyExpenses, weeklyBurnRate, retentionRate } = derivedData;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col border-r border-brand-lead/30 h-full bg-brand-graphite shadow-2xl lg:shadow-none relative overflow-hidden" role="complementary" aria-label="Barra lateral de navegação e resumo">
      {/* Efeito de brilho sutil no topo */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-blue/5 to-transparent pointer-events-none" aria-hidden="true" />

      <div className="p-6 flex items-center justify-between relative z-10">
        <h1 className="text-2xl font-bold tracking-tighter text-brand-blue flex items-center gap-2 group cursor-pointer">
          <motion.div 
            whileHover={{ rotate: 225 }}
            className="w-6 h-6 bg-brand-blue rounded-sm rotate-45 transition-transform duration-500" 
            aria-hidden="true"
          />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-brand-blue">GLICK</span>
        </h1>
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-1 text-gray-500 hover:text-white transition-colors"
            aria-label="Fechar barra lateral"
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar relative z-10" aria-label="Menu principal">
        <div className="mb-4">
          <p className="px-3 text-[9px] uppercase tracking-[0.2em] text-gray-500 font-black mb-3 italic font-serif opacity-70" id="nav-main-label">
            — Navegação Principal
          </p>
          <ul className="space-y-0.5" role="list" aria-labelledby="nav-main-label">
            {navItems.filter(i => !i.premium || installedModules.includes(i.module)).map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange?.(item.id)}
                  aria-current={activeView === item.id ? 'page' : undefined}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-lg transition-all duration-300 group relative overflow-hidden
                    ${activeView === item.id 
                      ? 'text-brand-blue bg-brand-blue/5 shadow-[inset_0_0_20px_rgba(44,199,255,0.05)]' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'}
                  `}
                >
                  {activeView === item.id && (
                    <motion.div 
                      layoutId="activeNav"
                      className="absolute left-0 top-2 bottom-2 w-1 bg-brand-blue rounded-full"
                      aria-hidden="true"
                    />
                  )}
                  <item.icon size={16} className={`${activeView === item.id ? 'text-brand-blue' : 'text-gray-500 group-hover:text-brand-blue'} transition-colors`} aria-hidden="true" />
                  <span className="flex-1 text-left tracking-tight">{item.label}</span>
                  <ChevronRight size={12} className={`transition-all duration-300 ${activeView === item.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 border-t border-brand-lead/10">
          <p className="px-3 text-[9px] uppercase tracking-[0.2em] text-gray-500 font-black mb-3 italic font-serif opacity-70" id="nav-apps-label">
            — Extensões & Apps
          </p>
          <ul className="space-y-0.5" role="list" aria-labelledby="nav-apps-label">
            <li>
              <button
                onClick={() => onViewChange?.('marketplace')}
                aria-current={activeView === 'marketplace' ? 'page' : undefined}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-lg transition-all duration-300 group relative
                  ${activeView === 'marketplace' 
                    ? 'text-brand-orange bg-brand-orange/5 shadow-[inset_0_0_20px_rgba(242,125,38,0.05)]' 
                    : 'text-brand-blue/60 hover:text-brand-blue hover:bg-brand-blue/5'}
                `}
              >
                {activeView === 'marketplace' && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute left-0 top-2 bottom-2 w-1 bg-brand-orange rounded-full"
                    aria-hidden="true"
                  />
                )}
                <ShoppingCart size={16} className={activeView === 'marketplace' ? 'text-brand-orange' : 'group-hover:text-brand-orange'} aria-hidden="true" />
                <span className="flex-1 text-left tracking-tight">Marketplace</span>
                <Badge 
                  variant="warning" 
                  className="px-1.5 py-0.5 text-[7px] font-black uppercase tracking-tighter animate-pulse"
                  aria-label="Novidade disponível"
                >
                  Novo
                </Badge>
              </button>
            </li>

            <li>
              <button
                onClick={() => onViewChange?.('configuracoes')}
                aria-current={activeView === 'configuracoes' ? 'page' : undefined}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-lg transition-all duration-300 group relative
                  ${activeView === 'configuracoes' 
                    ? 'text-brand-blue bg-brand-blue/5 shadow-[inset_0_0_20px_rgba(44,199,255,0.05)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'}
                `}
              >
                {activeView === 'configuracoes' && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute left-0 top-2 bottom-2 w-1 bg-brand-blue rounded-full"
                    aria-hidden="true"
                  />
                )}
                <Settings size={16} className={activeView === 'configuracoes' ? 'text-brand-blue' : 'group-hover:text-brand-blue'} aria-hidden="true" />
                <span className="flex-1 text-left tracking-tight">Configurações</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <div className="px-4 py-6 mt-auto space-y-4 relative z-10 bg-gradient-to-t from-brand-graphite via-brand-graphite to-transparent" role="contentinfo" aria-label="Resumo da conta e perfil">
        <div className="space-y-2">
          <div className="p-3 rounded-lg glass-panel technical-border group hover:border-brand-green/30 transition-colors" role="status" aria-label={`Saldo Consolidado: ${formatCurrency(totalBalance)}`}>
            <div className="flex justify-between items-start mb-1">
              <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Saldo Consolidado</p>
              <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" aria-hidden="true" />
            </div>
            <p className="text-base font-mono font-bold text-white tracking-tighter">
              {formatCurrency(totalBalance)}
            </p>
            <div className="mt-2 h-1 w-full bg-brand-lead/20 rounded-full overflow-hidden" role="progressbar" aria-valuenow={retentionRate} aria-valuemin={0} aria-valuemax={100} aria-label="Taxa de retenção">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${retentionRate}%` }}
                className="h-full bg-brand-green shadow-[0_0_10px_rgba(0,255,159,0.3)]" 
              />
            </div>
          </div>

          <div className="p-3 rounded-lg glass-panel technical-border group hover:border-brand-red/30 transition-colors" role="status" aria-label={`Burn Rate Semanal: ${formatCurrency(weeklyBurnRate)}`}>
            <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">Burn Rate Semanal</p>
            <div className="flex items-baseline gap-2">
              <p className="text-base font-mono font-bold text-white tracking-tighter">
                {formatCurrency(weeklyBurnRate)}
              </p>
              {weeklyBurnRate > 0 && <span className="text-[9px] text-brand-red font-bold" aria-label="Aumento de 100%">↑ 100%</span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 px-2 py-1" role="group" aria-label="Informações do usuário">
          <div className="w-8 h-8 rounded-full bg-brand-blue/20 border border-brand-blue/30 flex items-center justify-center text-brand-blue font-bold text-xs" aria-hidden="true">
            {user ? getInitials(user.name) : '--'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-white truncate">{user?.name || 'Usuário'}</p>
            <p className="text-[9px] text-gray-500 truncate">Plano Enterprise</p>
          </div>
          <button 
            onClick={logout}
            className="p-1.5 text-gray-500 hover:text-brand-red transition-colors"
            title="Sair do Console"
            aria-label="Sair do Console"
          >
            <LogOut size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
