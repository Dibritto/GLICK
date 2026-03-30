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
  Target,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFinance } from '../context/FinanceContext';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '../utils/formatters';
import ConfirmationModal from './ConfirmationModal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Select } from './ui/Select';

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
  const { transactions: recentMovements, derivedData, categories, isLoading, deleteTransaction, updateTransaction, reconcileTransaction, createTransaction, apiAction } = useFinance();
  const { projectedTransactions, allTransactionsSorted: recentTransactionsSorted, totalIncome, totalExpense } = derivedData;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>(initialTypeFilter as any);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // Paginated state
  const [paginatedTransactions, setPaginatedTransactions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasFetchedPaginated, setHasFetchedPaginated] = useState(false);

  useEffect(() => {
    const fetchPaginated = async () => {
      try {
        setIsLoadingMore(true);
        const res = await apiAction(`/api/transactions/paginated?page=${page}&limit=50`, 'GET');
        if (res && res.transactions) {
          if (page === 1) {
            setPaginatedTransactions(res.transactions);
          } else {
            setPaginatedTransactions(prev => {
              // Avoid duplicates
              const existingIds = new Set(prev.map(t => t.id));
              const newTxs = res.transactions.filter((t: any) => !existingIds.has(t.id));
              return [...prev, ...newTxs];
            });
          }
          setTotalPages(res.pagination.totalPages);
          setHasFetchedPaginated(true);
        }
      } catch (error) {
        console.error('Erro ao buscar transações paginadas:', error);
      } finally {
        setIsLoadingMore(false);
      }
    };
    fetchPaginated();
  }, [page, apiAction]);

  // Sync paginated transactions with recent updates from context
  useEffect(() => {
    setPaginatedTransactions(prev => {
      let hasChanges = false;
      const updated = prev.map(pt => {
        const recentMatch = recentTransactionsSorted.find(rt => rt.id === pt.id);
        if (recentMatch && JSON.stringify(recentMatch) !== JSON.stringify(pt)) {
          hasChanges = true;
          return recentMatch;
        }
        return pt;
      });
      
      // Check for new transactions in recentTransactionsSorted that aren't in paginatedTransactions
      const newTxs = recentTransactionsSorted.filter(
        rt => !String(rt.id).startsWith('projected-') && !prev.some(pt => pt.id === rt.id)
      );
      
      if (newTxs.length > 0) {
        hasChanges = true;
        return [...newTxs, ...updated].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      
      return hasChanges ? updated : prev;
    });
  }, [recentTransactionsSorted]);

  // Merge paginated transactions with projected transactions
  const allTransactionsSorted = useMemo(() => {
    if (!hasFetchedPaginated) return recentTransactionsSorted;
    
    const merged = [...paginatedTransactions, ...projectedTransactions];
    return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [paginatedTransactions, projectedTransactions, recentTransactionsSorted, hasFetchedPaginated]);

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
      setPaginatedTransactions(prev => prev.filter(t => t.id !== transactionToDelete));
      toast.success('Transação removida com sucesso');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao deletar transação');
    } finally {
      setShowDeleteConfirm(false);
      setTransactionToDelete(null);
    }
  };

  const filteredMovements = allTransactionsSorted.filter(m => {
    const matchesSearch = (m.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (m.category?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || m.type === filterType;
    const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
    
    let matchesMonth = true;
    if (filterMonth !== 'all') {
      const txMonth = m.date.substring(0, 7); // YYYY-MM
      matchesMonth = txMonth === filterMonth;
    }

    return matchesSearch && matchesType && matchesCategory && matchesMonth;
  });

  console.log('[FRONTEND] MovementsView - allTransactionsSorted:', allTransactionsSorted.length, 'filteredMovements:', filteredMovements.length);

  // Extract unique months from transactions for the filter dropdown
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    allTransactionsSorted.forEach(t => {
      if (t.date) {
        months.add(t.date.substring(0, 7));
      }
    });
    
    // Ensure current, previous, and next months are always options
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Current month
    months.add(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
    
    // Previous month
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    months.add(`${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`);
    
    // Next month
    const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
    months.add(`${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`);
    
    return Array.from(months).sort().reverse();
  }, [allTransactionsSorted]);

  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const y = Number(year);
    const m = Number(month);
    if (isNaN(y) || isNaN(m)) return 'Data Inválida';
    const date = new Date(y, m - 1, 1);
    if (isNaN(date.getTime())) return 'Data Inválida';
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
  };

  const totals = useMemo(() => {
    const monthMovements = allTransactionsSorted.filter(m => {
      if (filterMonth === 'all') return true;
      return m.date.substring(0, 7) === filterMonth;
    });

    return monthMovements.reduce(
      (acc, curr) => {
        if (curr.type === 'income') acc.income += Number(curr.amount);
        if (curr.type === 'expense') acc.expense += Number(curr.amount);
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [allTransactionsSorted, filterMonth]);

  const handleExportCSV = () => {
    if (filteredMovements.length === 0) {
      toast.error('Não há dados para exportar com os filtros atuais.');
      return;
    }

    const headers = ['Data', 'Descrição', 'Categoria', 'Conta', 'Tipo', 'Valor', 'Status', 'Conciliado'];
    const csvContent = [
      headers.join(','),
      ...filteredMovements.map(m => {
        const date = m.date;
        const desc = `"${m.description.replace(/"/g, '""')}"`;
        const cat = `"${m.category}"`;
        const acc = `"${m.account_name || ''}"`;
        const type = m.type === 'income' ? 'Entrada' : m.type === 'expense' ? 'Saída' : 'Transferência';
        const val = m.amount;
        const status = m.status === 'confirmed' ? 'Confirmado' : m.status === 'reconciled' ? 'Conciliado' : 'Pendente';
        const rec = m.status === 'reconciled' ? 'Sim' : 'Não';
        return [date, desc, cat, acc, type, val, status, rec].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fluxo_de_caixa_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exportação concluída com sucesso.');
  };

  return (
    <section className="p-4 md:p-8 space-y-6" aria-labelledby="movements-view-title">
      {/* Cabeçalho Técnico */}
      <header className="space-y-1">
        <h2 id="movements-view-title" className="text-2xl font-bold tracking-tighter text-white uppercase italic font-serif">
          {title}
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
          Fluxo de caixa em tempo real — Telemetria Financeira
        </p>
      </header>

      {/* Barra de Ferramentas - Linha 1: Busca e Ações */}
      <div className="flex flex-col md:flex-row gap-4 items-center" role="toolbar" aria-label="Ferramentas de busca e ações de transação">
        <div className="flex-1 w-full">
          <Input 
            id="movement-search"
            placeholder="Pesquisar por descrição ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={16} aria-hidden="true" />}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button 
            onClick={handleExportCSV}
            variant="outline"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-[10px] uppercase tracking-[0.2em]"
            aria-label="Exportar transações filtradas para CSV"
          >
            <Download size={14} aria-hidden="true" />
            Exportar
          </Button>
          <Button 
            onClick={onAddTransaction}
            variant="primary"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(44,199,255,0.4)]"
            aria-label="Registrar nova transação financeira"
          >
            <Plus size={14} aria-hidden="true" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Barra de Ferramentas - Linha 2: Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between" role="group" aria-label="Filtros de transação">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full sm:w-[180px]">
            <Select
              id="month-filter"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              aria-label="Filtrar por mês"
              icon={<Calendar size={12} />}
            >
              <option value="all" className="bg-brand-gray-deep">Todo o Período</option>
              {availableMonths.map(month => (
                <option key={month} value={month} className="bg-brand-gray-deep">{formatMonthLabel(month)}</option>
              ))}
            </Select>
          </div>

          <div className="w-full sm:w-[180px]">
            <Select
              id="category-filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              aria-label="Filtrar por categoria"
              icon={<Tag size={12} />}
            >
              <option value="all" className="bg-brand-gray-deep">Todas Categorias</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name} className="bg-brand-gray-deep">{cat.name}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-brand-lead/10 rounded-xl border border-brand-lead/20 self-start lg:self-center" role="group" aria-label="Filtrar por tipo de transação">
          {(['all', 'income', 'expense', 'transfer'] as const).map((type) => (
            <Button
              key={type}
              variant={filterType === type ? 'primary' : 'ghost'}
              onClick={() => setFilterType(type)}
              aria-pressed={filterType === type}
              className={`
                min-w-[70px] sm:min-w-[80px] py-1.5 px-3 text-[9px] uppercase tracking-widest transition-all rounded-lg
                ${filterType === type ? 'shadow-lg' : 'text-gray-500 hover:text-gray-300'}
              `}
            >
              {type === 'all' ? 'Todos' : type === 'income' ? 'Entradas' : type === 'expense' ? 'Saídas' : 'Transf.'}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabela de Movimentações */}
      <div className="glass-panel technical-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <caption className="sr-only">Lista detalhada de movimentações financeiras</caption>
            <thead>
              <tr className="bg-brand-lead/10 border-b border-brand-lead/20">
                <th scope="col" className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic font-serif">Status</th>
                <th scope="col" className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic font-serif">Data</th>
                <th scope="col" className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic font-serif">Descrição</th>
                <th scope="col" className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic font-serif">Categoria</th>
                <th scope="col" className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic font-serif">Conta</th>
                <th scope="col" className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic font-serif text-right">Valor</th>
                <th scope="col" className="px-6 py-4"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-lead/10">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4" aria-live="polite">
                      <Loader2 size={32} className="text-brand-blue animate-spin" aria-hidden="true" />
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
                        onEditTransaction?.(m);
                      }}
                      className={`hover:bg-white/[0.02] transition-colors group cursor-pointer ${String(m.id).startsWith('projected-') ? 'opacity-50 grayscale-[0.5]' : ''}`}
                      aria-label={`${m.description}: ${formatCurrency(m.amount)} em ${formatDate(m.date)}, Status: ${m.status}`}
                    >
                      <td className="px-6 py-4">
                        <div 
                          className={`w-2 h-2 rounded-full ${
                            String(m.id).startsWith('projected-') ? 'bg-brand-blue border border-brand-blue/50 animate-pulse' :
                            m.status === 'confirmed' || m.status === 'reconciled' ? 'bg-brand-green shadow-[0_0_8px_rgba(0,255,159,0.5)]' : 
                            'bg-brand-orange animate-pulse'
                          }`} 
                          aria-label={`Status: ${m.status}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-400 font-mono text-[11px]">
                          <Calendar size={12} className="opacity-50" aria-hidden="true" />
                          {formatDate(m.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-200 group-hover:text-brand-blue transition-colors">{m.description}</p>
                          {m.recurrence && m.recurrence !== 'none' && (
                            <Clock size={12} className="text-brand-blue opacity-70" aria-label="Recorrente" />
                          )}
                          {String(m.id).startsWith('projected-') && (
                            <Badge variant="info">Projetado</Badge>
                          )}
                          {m.goal_id && (
                            <Badge variant="neutral" className="flex items-center gap-1">
                              <Target size={10} aria-hidden="true" /> Meta
                            </Badge>
                          )}
                          {m.status === 'pending' && !String(m.id).startsWith('projected-') && (
                            <Badge variant="warning">Pendente</Badge>
                          )}
                          {m.status === 'confirmed' && (
                            <Badge variant="info">Confirmado</Badge>
                          )}
                          {m.status === 'reconciled' && (
                            <Badge variant="success" className="flex items-center gap-1">
                              <CheckCircle size={10} aria-hidden="true" /> Conciliado
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Tag size={12} className="text-gray-600" aria-hidden="true" />
                          <span className="px-2 py-0.5 rounded-full bg-brand-lead/20 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            {m.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase tracking-wider">
                            <Wallet size={12} className="opacity-50" aria-hidden="true" />
                            {m.account_name}
                          </div>
                          {m.card_name && (
                            <div className="flex items-center gap-2 text-brand-lead text-[9px] font-bold uppercase tracking-wider">
                              <CreditCard size={10} className="opacity-70" aria-hidden="true" />
                              {m.card_name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-sm font-mono font-bold text-right ${m.type === 'income' ? 'text-brand-green' : m.type === 'expense' ? 'text-brand-red' : 'text-brand-blue'}`}>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center justify-end gap-2">
                            {m.type === 'income' ? <ArrowUpCircle size={14} aria-hidden="true" /> : m.type === 'expense' ? <ArrowDownCircle size={14} aria-hidden="true" /> : <ArrowLeftRight size={14} aria-hidden="true" />}
                            {m.type === 'income' ? '+' : m.type === 'expense' ? '-' : '⇄'} {formatCurrency(m.amount)}
                          </div>
                          {m.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (String(m.id).startsWith('projected-')) {
                                  const { id, account_name, card_name, ...dataToCreate } = m;
                                  createTransaction({ ...dataToCreate, status: 'confirmed' })
                                    .then(() => toast.success('Transação projetada confirmada com sucesso!'))
                                    .catch((err: any) => toast.error(err.message || 'Erro ao confirmar projeção'));
                                } else {
                                  updateTransaction(m.id, { ...m, status: 'confirmed' });
                                  setPaginatedTransactions(prev => prev.map(t => t.id === m.id ? { ...t, status: 'confirmed' } : t));
                                }
                              }}
                              className="text-[9px] uppercase tracking-widest px-2 py-0.5"
                              aria-label="Confirmar transação pendente"
                            >
                              Confirmar Agora
                            </Button>
                          )}
                          {m.status === 'confirmed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                reconcileTransaction(m.id);
                                setPaginatedTransactions(prev => prev.map(t => t.id === m.id ? { ...t, status: 'reconciled' } : t));
                              }}
                              className="text-[9px] uppercase tracking-widest px-2 py-0.5"
                              aria-label="Conciliar transação confirmada"
                            >
                              Conciliar
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(m.id);
                            }}
                            variant="ghost"
                            size="icon"
                            className="p-2 text-gray-600 hover:text-brand-red hover:bg-brand-red/10 transition-colors"
                            title="Excluir transação"
                            aria-label={`Excluir transação ${m.description}`}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </Button>
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
          <div className="p-20 text-center space-y-6" role="status">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-brand-blue/10 blur-2xl rounded-full" aria-hidden="true" />
              <div className="relative p-6 rounded-full bg-brand-gray-deep/50 text-gray-600 border border-brand-lead/20">
                <Activity size={48} className="animate-pulse" aria-hidden="true" />
              </div>
            </div>
            <div className="space-y-2 max-w-xs mx-auto">
              <p className="text-white font-bold uppercase tracking-widest text-sm italic font-serif">Silêncio na Telemetria</p>
              <p className="text-[10px] text-gray-500 uppercase leading-relaxed tracking-wider">
                Nenhum fluxo de capital detectado para os parâmetros atuais. Ajuste os filtros ou registre uma nova movimentação para iniciar o monitoramento.
              </p>
            </div>
            <Button 
              onClick={onAddTransaction}
              variant="outline"
              className="px-6 py-2 text-[10px] uppercase tracking-widest"
              aria-label="Registrar primeira movimentação financeira"
            >
              Registrar Primeira Movimentação
            </Button>
          </div>
        )}
        
        {page < totalPages && (
          <div className="p-4 flex justify-center border-t border-brand-lead">
            <Button 
              variant="outline" 
              onClick={() => setPage(p => p + 1)}
              disabled={isLoadingMore}
              className="w-full max-w-xs uppercase tracking-widest text-xs"
            >
              {isLoadingMore ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              {isLoadingMore ? 'Carregando...' : 'Carregar Mais'}
            </Button>
          </div>
        )}
      </div>

      {/* Rodapé de Telemetria */}
      <footer className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 glass-panel technical-border rounded-2xl" aria-label="Resumo de telemetria financeira do período">
        <div className="flex gap-8">
          <div role="status">
            <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">Total Entradas</p>
            <p className="text-lg font-mono font-bold text-brand-green">{formatCurrency(totals.income)}</p>
          </div>
          <div className="w-px h-10 bg-brand-lead/20" aria-hidden="true" />
          <div role="status">
            <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">Total Saídas</p>
            <p className="text-lg font-mono font-bold text-brand-red">{formatCurrency(totals.expense)}</p>
          </div>
        </div>

        <div className="text-right" role="status">
          <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">Resultado Líquido</p>
          <p className={`text-xl font-mono font-bold ${totals.income - totals.expense >= 0 ? 'text-brand-blue' : 'text-brand-red'}`}>
            {formatCurrency(totals.income - totals.expense)}
          </p>
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
    </section>
  );
};

export default MovementsView;

