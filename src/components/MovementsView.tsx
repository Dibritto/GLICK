import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  ArrowLeftRight,
  CreditCard,
  MoreVertical,
  Calendar,
  Tag,
  Wallet,
  Loader2,
  Trash2,
  Clock,
  Activity,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFinance } from '../context/FinanceContext';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '../utils/formatters';
import ConfirmationModal from './ConfirmationModal';

interface MovementsViewProps {
  typeFilter?: 'income' | 'expense' | 'all';
  title?: string;
  onAddTransaction?: () => void;
  onEditTransaction?: (transaction: any) => void;
}

const MovementsView: React.FC<MovementsViewProps> = ({ 
  typeFilter: initialTypeFilter = 'all',
  title = 'Fluxo de Caixa & Telemetria',
  onAddTransaction,
  onEditTransaction
}) => {
  const { transactions: movements, derivedData, categories, isLoading, deleteTransaction, updateTransaction } = useFinance();
  const { projectedTransactions, allTransactionsSorted, totalIncome, totalExpense } = derivedData;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>(initialTypeFilter as any);
  const [filterCategory, setFilterCategory] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string | number) => {
    const idStr = String(id);
    if (idStr.startsWith('projected-')) {
      toast.error('Não é possível deletar uma transação projetada. Registre-a primeiro.');
      return;
    }
    setTransactionToDelete(idStr);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    
    try {
      await deleteTransaction(transactionToDelete);
      toast.success('Transação removida com sucesso');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao deletar transação');
    } finally {
      setShowDeleteConfirm(false);
      setTransactionToDelete(null);
    }
  };

  const filteredMovements = allTransactionsSorted.filter(m => {
    const matchesSearch = m.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || m.type === filterType;
    const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const totals = { income: totalIncome, expense: totalExpense };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Cabeçalho Técnico */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tighter text-white uppercase italic font-serif">
            {title}
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
            Fluxo de caixa em tempo real — Telemetria Financeira
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue/10 text-brand-blue border border-brand-blue/30 rounded-lg hover:bg-brand-blue/20 transition-all text-xs font-bold uppercase tracking-widest">
            <Download size={14} />
            Exportar
          </button>
          <button 
            onClick={onAddTransaction}
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-brand-graphite rounded-lg hover:bg-brand-blue/80 transition-all text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(44,199,255,0.3)]"
          >
            <Plus size={14} />
            Nova Transação
          </button>
        </div>
      </header>

      {/* Barra de Ferramentas / Filtros */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder="Pesquisar por descrição ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-brand-gray-deep/50 border border-brand-lead/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-brand-blue/50 focus:outline-none transition-all"
          />
        </div>

        <div className="lg:col-span-4 flex gap-2">
          {(['all', 'income', 'expense', 'transfer'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`
                flex-1 py-2.5 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all
                ${filterType === type 
                  ? 'bg-brand-blue/10 border-brand-blue text-brand-blue' 
                  : 'bg-transparent border-brand-lead/30 text-gray-500 hover:border-brand-blue/30'}
              `}
            >
              {type === 'all' ? 'Todos' : type === 'income' ? 'Entradas' : type === 'expense' ? 'Saídas' : 'Transf.'}
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-brand-gray-deep/50 border border-brand-lead/30 rounded-xl py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 focus:border-brand-blue/50 focus:outline-none transition-all appearance-none"
          >
            <option value="all">Todas Categorias</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Movimentações */}
      <div className="glass-panel technical-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-brand-lead/10 border-b border-brand-lead/20">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic font-serif">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic font-serif">Data</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic font-serif">Descrição</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic font-serif">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic font-serif">Conta</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic font-serif text-right">Valor</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-lead/10">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 size={32} className="text-brand-blue animate-spin" />
                      <p className="text-xs text-gray-500 uppercase tracking-widest">Sincronizando Telemetria...</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredMovements.map((m) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={m.id} 
                      onClick={() => {
                        if (!String(m.id).startsWith('projected-')) {
                          onEditTransaction?.(m);
                        }
                      }}
                      className={`hover:bg-white/[0.02] transition-colors group cursor-pointer ${String(m.id).startsWith('projected-') ? 'opacity-50 grayscale-[0.5]' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className={`w-2 h-2 rounded-full ${
                          String(m.id).startsWith('projected-') ? 'bg-brand-blue border border-brand-blue/50 animate-pulse' :
                          m.status === 'confirmed' ? 'bg-brand-green shadow-[0_0_8px_rgba(0,255,159,0.5)]' : 
                          'bg-brand-orange animate-pulse'
                        }`} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-400 font-mono text-[11px]">
                          <Calendar size={12} className="opacity-50" />
                          {formatDate(m.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-200 group-hover:text-brand-blue transition-colors">{m.description}</p>
                          {m.recurrence && m.recurrence !== 'none' && (
                            <Clock size={12} className="text-brand-blue opacity-70" />
                          )}
                          {String(m.id).startsWith('projected-') && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue font-bold uppercase tracking-tighter">Projetado</span>
                          )}
                          {m.goal_id && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white font-bold uppercase tracking-tighter flex items-center gap-1">
                              <Target size={10} /> Meta
                            </span>
                          )}
                          {m.status === 'pending' && !String(m.id).startsWith('projected-') && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-orange/10 text-brand-orange font-bold uppercase tracking-tighter">Pendente</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Tag size={12} className="text-gray-600" />
                          <span className="px-2 py-0.5 rounded-full bg-brand-lead/20 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            {m.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-gray-500 text-xs">
                            <Wallet size={12} className="opacity-50" />
                            {m.account_name}
                          </div>
                          {m.card_name && (
                            <div className="flex items-center gap-2 text-brand-lead text-[10px] font-bold uppercase tracking-wider">
                              <CreditCard size={10} className="opacity-70" />
                              {m.card_name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-sm font-mono font-bold text-right ${m.type === 'income' ? 'text-brand-green' : m.type === 'expense' ? 'text-brand-red' : 'text-brand-blue'}`}>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center justify-end gap-2">
                            {m.type === 'income' ? <ArrowUpCircle size={14} /> : m.type === 'expense' ? <ArrowDownCircle size={14} /> : <ArrowLeftRight size={14} />}
                            {m.type === 'income' ? '+' : m.type === 'expense' ? '-' : '⇄'} {formatCurrency(m.amount)}
                          </div>
                          {m.status === 'pending' && !String(m.id).startsWith('projected-') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateTransaction(m.id, { ...m, status: 'confirmed' });
                              }}
                              className="text-[9px] text-brand-blue hover:text-white uppercase font-bold tracking-widest border border-brand-blue/30 px-2 py-0.5 rounded hover:bg-brand-blue/20 transition-all"
                            >
                              Confirmar Agora
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(m.id);
                            }}
                            className="p-2 text-gray-600 hover:text-brand-red transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button className="p-2 text-gray-600 hover:text-white transition-colors">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
        
        {!isLoading && filteredMovements.length === 0 && (
          <div className="p-20 text-center space-y-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-brand-blue/10 blur-2xl rounded-full" />
              <div className="relative p-6 rounded-full bg-brand-gray-deep/50 text-gray-600 border border-brand-lead/20">
                <Activity size={48} className="animate-pulse" />
              </div>
            </div>
            <div className="space-y-2 max-w-xs mx-auto">
              <p className="text-white font-bold uppercase tracking-widest text-sm italic font-serif">Silêncio na Telemetria</p>
              <p className="text-[10px] text-gray-500 uppercase leading-relaxed">
                Nenhum fluxo de capital detectado para os parâmetros atuais. Ajuste os filtros ou registre uma nova movimentação para iniciar o monitoramento.
              </p>
            </div>
            <button 
              onClick={onAddTransaction}
              className="px-6 py-2 bg-brand-blue/10 text-brand-blue border border-brand-blue/30 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-brand-blue/20 transition-all"
            >
              Registrar Primeira Movimentação
            </button>
          </div>
        )}
      </div>

      {/* Rodapé de Telemetria */}
      <footer className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 glass-panel technical-border rounded-2xl">
        <div className="flex gap-8">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">Total Entradas</p>
            <p className="text-lg font-mono font-bold text-brand-green">{formatCurrency(totals.income)}</p>
          </div>
          <div className="w-px h-10 bg-brand-lead/20" />
          <div>
            <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">Total Saídas</p>
            <p className="text-lg font-mono font-bold text-brand-red">{formatCurrency(totals.expense)}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">Resultado Líquido</p>
          <p className="text-xl font-mono font-bold text-brand-blue">{formatCurrency(totals.income - totals.expense)}</p>
        </div>
      </footer>

      <ConfirmationModal 
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setTransactionToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Excluir Transação"
        message="Tem certeza que deseja remover este registro do seu fluxo de caixa? Esta ação é irreversível e impactará sua telemetria financeira."
        confirmText="Sim, Remover"
        cancelText="Manter Registro"
      />
    </div>
  );
};

export default MovementsView;

