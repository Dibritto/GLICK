import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import MainConsole from './components/MainConsole';
import RightPanel from './components/RightPanel';
import QuickActions from './components/QuickActions';
import TransactionModal from './components/TransactionModal';
import ErrorBoundary from './components/ErrorBoundary';
import { Menu } from 'lucide-react';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalType, setTransactionModalType] = useState<'income' | 'expense'>('expense');
  const [installedModules, setInstalledModules] = useState(['core']);
  const [summary, setSummary] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    projectedBalance: 0,
    freeCapital: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar Sumário
        const summaryRes = await fetch('/api/summary');
        if (summaryRes.ok) setSummary(await summaryRes.json());

        // Buscar Módulos Instalados
        const modulesRes = await fetch('/api/user/modules');
        if (modulesRes.ok) {
          const modules = await modulesRes.json();
          if (Array.isArray(modules)) {
            setInstalledModules(['core', ...modules.map((m: any) => m.slug)]);
          } else {
            setInstalledModules(['core']);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
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
        fixed inset-y-0 left-0 z-[60] lg:z-40 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar 
          onClose={() => setIsSidebarOpen(false)} 
          installedModules={installedModules}
          activeView={activeView}
          onViewChange={(view) => {
            setActiveView(view);
            setIsSidebarOpen(false);
          }}
        />
      </div>

      {/* Área Principal (Centro + Direita) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-visible">
        {/* Barra Superior: Telemetria + Mobile Menu Toggle */}
        <div className="flex items-center bg-brand-graphite border-b border-brand-blue/30 relative z-50 overflow-visible">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-3 text-brand-blue hover:bg-brand-blue/10 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1 min-w-0 overflow-visible">
            <TopBar data={summary} />
          </div>
        </div>

        {/* Conteúdo: Console e Painel Lateral Direito */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Área Central: Console Financeiro */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-24 lg:pb-0">
            <ErrorBoundary>
              <MainConsole 
                activeView={activeView} 
                onOpenTransactionModal={(type) => {
                  if (type) setTransactionModalType(type);
                  setIsTransactionModalOpen(true);
                }}
              />
            </ErrorBoundary>
          </div>

          {/* Coluna Direita: Compromissos e Metas (Escondida em mobile ou empilhada se necessário) */}
          <div className="hidden xl:block">
            <RightPanel />
          </div>
        </div>
      </div>

      {/* Dock Inferior: Ações Rápidas */}
      <QuickActions 
        onAddExpense={() => {
          setTransactionModalType('expense');
          setIsTransactionModalOpen(true);
        }}
        onAddIncome={() => {
          setTransactionModalType('income');
          setIsTransactionModalOpen(true);
        }}
      />

      {/* Modais Globais */}
      <TransactionModal 
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        type={transactionModalType}
      />
    </div>
  );
}


