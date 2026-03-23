import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import MainConsole from './components/MainConsole';
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
import { Menu, Loader2 } from 'lucide-react';

export default function App() {
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const { derivedData, refreshData, modules } = useFinance();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  
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

  const handleEditAccount = (account: any) => {
    setModal({ type: 'account', data: account });
  };

  const handleEditGoal = (goal: any) => {
    setModal({ type: 'goal', data: goal });
  };

  const handleEditCard = (card: any) => {
    setModal({ type: 'card', data: card });
  };

  const handleEditCategory = (category: any) => {
    setModal({ type: 'category', data: category });
  };

  const handleEditTransaction = (transaction: any) => {
    setModal({ type: 'transaction', data: transaction, extra: { transactionType: transaction.type } });
  };

  useEffect(() => {
    if (!token) return;

    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [token, refreshData]);

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
              setActiveView(view);
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
            />
          </div>
        </div>

        {/* Conteúdo: Console e Painel Lateral Direito */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Área Central: Console Financeiro */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-32 lg:pb-32">
            <MainConsole 
              activeView={activeView} 
              installedModules={installedModules}
              onOpenTransactionModal={(type, lockType = false, goal = null) => {
                setModal({ 
                  type: 'transaction', 
                  extra: { transactionType: type || 'expense', lockType, prefilledGoal: goal } 
                });
              }}
              onEditTransaction={handleEditTransaction}
              onOpenAccountModal={() => setModal({ type: 'account' })}
              onEditAccount={handleEditAccount}
              onOpenGoalModal={() => setModal({ type: 'goal' })}
              onEditGoal={handleEditGoal}
              onOpenGoalFundingModal={(type, goal) => setModal({ type: 'goalFunding', data: goal, extra: { fundingType: type } })}
              onOpenCardModal={() => setModal({ type: 'card' })}
              onEditCard={handleEditCard}
              onOpenCategoryModal={() => setModal({ type: 'category' })}
              onEditCategory={handleEditCategory}
              onNavigate={(view) => setActiveView(view)}
            />
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
        onNavigateReports={() => setActiveView('relatorios')}
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


