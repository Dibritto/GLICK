import React, { useState, useEffect } from 'react';
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
import ErrorBoundary from './components/ErrorBoundary';
import AuthView from './components/AuthView';
import { Toaster } from 'sonner';
import { useAuth } from './context/AuthContext';
import { useFinance } from './context/FinanceContext';
import { Menu, Loader2 } from 'lucide-react';

export default function App() {
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const { derivedData, refreshData } = useFinance();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [transactionModalType, setTransactionModalType] = useState<'income' | 'expense'>('expense');
  const [isTransactionTypeLocked, setIsTransactionTypeLocked] = useState(false);
  const [installedModules, setInstalledModules] = useState(['core']);

  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [prefilledGoal, setPrefilledGoal] = useState<any>(null);

  const handleEditAccount = (account: any) => {
    setEditingAccount(account);
    setIsAccountModalOpen(true);
  };

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setIsGoalModalOpen(true);
  };

  const handleEditCard = (card: any) => {
    setEditingCard(card);
    setIsCardModalOpen(true);
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction);
    setIsTransactionModalOpen(true);
  };

  useEffect(() => {
    if (!token) return;

    const fetchModules = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };

        // Buscar Módulos Instalados
        const modulesRes = await fetch('/api/user/modules', { headers });
        if (modulesRes.ok) {
          const modules = await modulesRes.json();
          if (Array.isArray(modules)) {
            setInstalledModules(['core', ...modules.map((m: any) => m.slug)]);
          } else {
            setInstalledModules(['core']);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar módulos:', error);
      }
    };

    fetchModules();
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
          <div className="flex-1 overflow-y-auto no-scrollbar pb-24 lg:pb-0">
            <MainConsole 
              activeView={activeView} 
              installedModules={installedModules}
              onOpenTransactionModal={(type, lockType = false, goal = null) => {
                if (type) setTransactionModalType(type);
                setIsTransactionTypeLocked(lockType);
                setEditingTransaction(null);
                setPrefilledGoal(goal);
                setIsTransactionModalOpen(true);
              }}
              onEditTransaction={handleEditTransaction}
              onOpenAccountModal={() => {
                setEditingAccount(null);
                setIsAccountModalOpen(true);
              }}
              onEditAccount={handleEditAccount}
              onOpenGoalModal={() => {
                setEditingGoal(null);
                setIsGoalModalOpen(true);
              }}
              onEditGoal={handleEditGoal}
              onOpenCardModal={() => {
                setEditingCard(null);
                setIsCardModalOpen(true);
              }}
              onEditCard={handleEditCard}
              onOpenCategoryModal={() => {
                setEditingCategory(null);
                setIsCategoryModalOpen(true);
              }}
              onEditCategory={handleEditCategory}
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
        onAddExpense={() => {
          setTransactionModalType('expense');
          setIsTransactionTypeLocked(false);
          setIsTransactionModalOpen(true);
        }}
        onAddIncome={() => {
          setTransactionModalType('income');
          setIsTransactionTypeLocked(false);
          setIsTransactionModalOpen(true);
        }}
      />

      {/* Modais Globais */}
      <TransactionModal 
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
          setIsTransactionTypeLocked(false);
          setPrefilledGoal(null);
        }}
        type={transactionModalType}
        lockType={isTransactionTypeLocked}
        editingTransaction={editingTransaction}
        prefilledGoal={prefilledGoal}
      />

      <AccountModal 
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setEditingAccount(null);
        }}
        editingAccount={editingAccount}
      />

      <GoalModal 
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        editingGoal={editingGoal}
      />

      <CardModal 
        isOpen={isCardModalOpen}
        onClose={() => {
          setIsCardModalOpen(false);
          setEditingCard(null);
        }}
        editingCard={editingCard}
      />

      <CategoryModal 
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        editingCategory={editingCategory}
      />
      </div>
    </ErrorBoundary>
  );
}


