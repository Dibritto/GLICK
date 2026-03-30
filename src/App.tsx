import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import RightPanel from './components/RightPanel';
import QuickActions from './components/QuickActions';
import TransactionModal from './components/TransactionModal';
import AccountModal from './components/AccountModal';
import GoalModal from './components/GoalModal';
import CardModal from './components/CardModal';
import CategoryModal from './components/CategoryModal';
import GoalFundingModal from './components/GoalFundingModal';
import ErrorBoundary from './components/ErrorBoundary';
import AuthView from './components/AuthView';
import { Toaster } from 'sonner';
import { useAuth } from './context/AuthContext';
import { useFinance } from './context/FinanceContext';
import { Menu, Loader2, Zap } from 'lucide-react';
import { Button } from './components/ui/Button';

// Lazy load views for code splitting
const DashboardView = lazy(() => import('./components/DashboardView'));
const ModuleMarketplace = lazy(() => import('./components/ModuleMarketplace'));
const ForecastView = lazy(() => import('./components/ForecastView'));
const MovementsView = lazy(() => import('./components/MovementsView'));
const AccountsView = lazy(() => import('./components/AccountsView'));
const CardsView = lazy(() => import('./components/CardsView'));
const GoalsView = lazy(() => import('./components/GoalsView'));
const CategoriesView = lazy(() => import('./components/CategoriesView'));
const ReportsView = lazy(() => import('./components/ReportsView'));
const InvestmentsView = lazy(() => import('./components/InvestmentsView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const WealthView = lazy(() => import('./components/WealthView'));
const CryptoView = lazy(() => import('./components/CryptoView').then(m => ({ default: m.CryptoView })));

// Loading fallback for Suspense
const ViewLoader = () => (
  <div className="flex-1 flex items-center justify-center p-8">
    <Loader2 size={32} className="text-brand-blue animate-spin" />
  </div>
);

// Under development fallback
const UnderDevelopment = () => {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="p-4 bg-brand-blue/10 rounded-full text-brand-blue">
        <Zap size={32} />
      </div>
      <h2 className="text-xl font-bold text-white uppercase italic font-serif">Módulo em Desenvolvimento</h2>
      <p className="text-gray-500 text-sm max-w-xs">
        Esta funcionalidade está sendo implementada. Em breve você terá acesso total à telemetria deste módulo.
      </p>
      <Button 
        onClick={() => navigate('/')}
        variant="primary"
        size="md"
        className="uppercase tracking-widest font-bold"
      >
        Voltar ao Dashboard
      </Button>
    </div>
  );
};

function AppContent() {
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const { derivedData, refreshData, modules, isLoading: isFinanceLoading } = useFinance();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Derive activeView from current path for Sidebar compatibility
  const activeView = location.pathname === '/' ? 'dashboard' : location.pathname.substring(1);
  
  type ModalState = {
    type: 'transaction' | 'account' | 'goal' | 'card' | 'category' | 'goalFunding' | null;
    data?: any;
    extra?: any;
  };
  
  const [modal, setModal] = useState<ModalState>({ type: null });

  const installedModules = useMemo(() => {
    const installed = modules
      .filter(m => m.status === 'active' || m.status === 'trial')
      .map(m => m.slug);
    return ['core', ...installed];
  }, [modules]);

  const handleEditAccount = (account: any) => setModal({ type: 'account', data: account });
  const handleEditGoal = (goal: any) => setModal({ type: 'goal', data: goal });
  const handleEditCard = (card: any) => setModal({ type: 'card', data: card });
  const handleEditCategory = (category: any) => setModal({ type: 'category', data: category });
  const handleEditTransaction = (transaction: any) => setModal({ type: 'transaction', data: transaction, extra: { transactionType: transaction.type } });

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-brand-graphite flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-brand-blue animate-spin" />
          <p className="text-xs text-gray-500 uppercase tracking-[0.3em] font-bold">Iniciando Console...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-right" theme="dark" richColors closeButton />
        <AuthView />
      </>
    );
  }

  // Common props for views
  const viewProps = {
    installedModules,
    onOpenTransactionModal: (type?: 'income' | 'expense' | 'transfer', lockType = false, goal = null) => {
      setModal({ type: 'transaction', extra: { transactionType: type || 'expense', lockType, prefilledGoal: goal } });
    },
    onOpenAccountModal: () => setModal({ type: 'account' }),
    onEditAccount: handleEditAccount,
    onOpenGoalModal: () => setModal({ type: 'goal' }),
    onEditGoal: handleEditGoal,
    onOpenGoalFundingModal: (type: 'add' | 'withdraw', goal: any) => setModal({ type: 'goalFunding', data: goal, extra: { fundingType: type } }),
    onOpenCardModal: () => setModal({ type: 'card' }),
    onEditCard: handleEditCard,
    onOpenCategoryModal: () => setModal({ type: 'category' }),
    onEditCategory: handleEditCategory,
    onEditTransaction: handleEditTransaction,
    onNavigate: (view: string) => navigate(`/${view === 'dashboard' ? '' : view}`)
  };

  return (
    <ErrorBoundary>
      <Toaster position="top-right" theme="dark" richColors closeButton />
      <div className="flex flex-col lg:flex-row h-screen w-full bg-brand-graphite overflow-hidden selection:bg-brand-blue/30 selection:text-brand-blue">
      {/* Overlay para Mobile Sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Coluna Esquerda: Navegação e KPIs */}
      <div className={`
        fixed inset-y-0 left-0 z-[60] lg:z-40 transform transition-transform duration-300 ease-in-out lg:relative
        ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-0'}
      `}>
        <div className={`h-full w-64 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'lg:opacity-0 pointer-events-none'}`}>
          <Sidebar 
            onClose={() => setIsSidebarOpen(false)} 
            installedModules={installedModules}
            activeView={activeView}
            onViewChange={(view) => {
              navigate(`/${view === 'dashboard' ? '' : view}`);
              if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
          />
        </div>
      </div>

      {/* Área Principal (Centro + Direita) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-visible">
        {/* Barra Superior: Telemetria + Mobile Menu Toggle */}
        <div className="flex items-center bg-brand-graphite relative z-50 overflow-visible">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-3 text-brand-blue hover:bg-brand-blue/10 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1 min-w-0 overflow-visible">
            <TopBar 
              data={derivedData} 
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              isSidebarOpen={isSidebarOpen}
              onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
              isRightPanelOpen={isRightPanelOpen}
              onRefresh={refreshData}
              isRefreshing={isFinanceLoading}
            />
          </div>
        </div>

        {/* Conteúdo: Console e Painel Lateral Direito */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Área Central: Console Financeiro */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-32 lg:pb-32 relative">
            <Suspense fallback={<ViewLoader />}>
              <Routes>
                <Route path="/" element={<DashboardView {...viewProps} />} />
                <Route path="/marketplace" element={<ModuleMarketplace />} />
                <Route path="/fluxo-caixa" element={<MovementsView onAddTransaction={() => viewProps.onOpenTransactionModal()} onEditTransaction={handleEditTransaction} />} />
                <Route path="/contas" element={<AccountsView onAddAccount={viewProps.onOpenAccountModal} onAddTransfer={() => viewProps.onOpenTransactionModal('transfer')} onEditAccount={handleEditAccount} onEditTransaction={handleEditTransaction} />} />
                <Route path="/cartoes" element={<CardsView onAddCard={viewProps.onOpenCardModal} onEditCard={handleEditCard} />} />
                <Route path="/metas" element={<GoalsView onAddGoal={viewProps.onOpenGoalModal} onEditGoal={handleEditGoal} onAddFunds={(goal) => viewProps.onOpenGoalFundingModal('add', goal)} onWithdrawFunds={(goal) => viewProps.onOpenGoalFundingModal('withdraw', goal)} />} />
                <Route path="/categorias" element={<CategoriesView onAddCategory={viewProps.onOpenCategoryModal} onEditCategory={handleEditCategory} />} />
                <Route path="/relatorios" element={<ReportsView />} />
                <Route path="/projecoes" element={<ForecastView />} />
                <Route path="/crypto" element={<CryptoView isInstalled={installedModules.includes('crypto')} onNavigateToMarketplace={() => navigate('/marketplace')} />} />
                <Route path="/investimentos" element={<InvestmentsView isInstalled={installedModules.includes('investments')} onNavigateToMarketplace={() => navigate('/marketplace')} />} />
                <Route path="/patrimonio" element={<WealthView isInstalled={installedModules.includes('wealth')} onNavigateToMarketplace={() => navigate('/marketplace')} />} />
                <Route path="/configuracoes" element={<SettingsView />} />
                <Route path="*" element={<UnderDevelopment />} />
              </Routes>
            </Suspense>
          </div>

          {/* Coluna Direita: Compromissos e Metas */}
          {isRightPanelOpen && (
            <div className="hidden xl:block">
              <RightPanel />
            </div>
          )}
        </div>
      </div>

      {/* Dock Inferior: Ações Rápidas */}
      <QuickActions 
        onAddExpense={() => setModal({ type: 'transaction', extra: { transactionType: 'expense', lockType: false } })}
        onAddIncome={() => setModal({ type: 'transaction', extra: { transactionType: 'income', lockType: false } })}
        onAddTransfer={() => setModal({ type: 'transaction', extra: { transactionType: 'transfer' } })}
        onAddGoal={() => setModal({ type: 'goal' })}
        onNavigateReports={() => navigate('/relatorios')}
      />

      {/* Modais Globais */}
      <TransactionModal 
        isOpen={modal.type === 'transaction'}
        onClose={() => setModal({ type: null })}
        type={modal.extra?.transactionType || 'expense'}
        lockType={modal.extra?.lockType || false}
        editingTransaction={modal.data}
        prefilledGoal={modal.extra?.prefilledGoal}
      />

      <AccountModal 
        isOpen={modal.type === 'account'}
        onClose={() => setModal({ type: null })}
        editingAccount={modal.data}
      />

      <GoalModal 
        isOpen={modal.type === 'goal'}
        onClose={() => setModal({ type: null })}
        editingGoal={modal.data}
      />

      <CardModal 
        isOpen={modal.type === 'card'}
        onClose={() => setModal({ type: null })}
        editingCard={modal.data}
      />

      <CategoryModal 
        isOpen={modal.type === 'category'}
        onClose={() => setModal({ type: null })}
        editingCategory={modal.data}
      />

      <GoalFundingModal
        isOpen={modal.type === 'goalFunding'}
        onClose={() => setModal({ type: null })}
        goal={modal.data}
        type={modal.extra?.fundingType || 'add'}
      />
    </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}