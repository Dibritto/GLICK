import React from 'react';
import { 
  Plus, 
  Wallet, 
  Building2,
  MoreHorizontal,
  Zap,
  Loader2,
  ArrowRightLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle2,
  Clock,
  History,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';

interface AccountsViewProps {
  onAddAccount?: () => void;
  onAddTransfer?: () => void;
  onEditAccount?: (account: any) => void;
  onEditTransaction?: (transaction: any) => void;
}

const AccountsView: React.FC<AccountsViewProps> = ({ onAddAccount, onAddTransfer, onEditAccount, onEditTransaction }) => {
  const { isLoading, derivedData } = useFinance();
  const { accounts, totalBalance, netWorth, freeCapital, allTransactionsSorted } = derivedData;
  const [selectedAccountId, setSelectedAccountId] = React.useState<number | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterType, setFilterType] = React.useState<'all' | 'checking' | 'savings'>('all');

  const filteredAccounts = React.useMemo(() => {
    return accounts.filter(acc => {
      const matchesSearch = (acc.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || acc.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [accounts, searchTerm, filterType]);

  const filteredTransactions = React.useMemo(() => {
    if (selectedAccountId === null) return allTransactionsSorted.slice(0, 15);
    return allTransactionsSorted.filter(t => 
      t.account_id === selectedAccountId || t.destination_account_id === selectedAccountId
    ).slice(0, 15);
  }, [allTransactionsSorted, selectedAccountId]);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <section className="p-4 md:p-8 space-y-6" aria-labelledby="accounts-view-title">
      {/* Cabeçalho Técnico */}
      <header className="space-y-1">
        <h2 id="accounts-view-title" className="text-2xl font-bold tracking-tighter text-white uppercase italic font-serif">
          Gestão de Contas
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
          Monitoramento de liquidez e custódia bancária
        </p>
      </header>

      {/* Barra de Ferramentas - Linha 1: Busca e Ações */}
      <div className="flex flex-col md:flex-row gap-4 items-center" role="toolbar" aria-label="Ferramentas de busca e ações de conta">
        <div className="flex-1 w-full">
          <Input 
            id="account-search"
            type="text" 
            placeholder="Pesquisar por nome do banco ou conta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Pesquisar por nome do banco ou conta"
            className="pl-10"
          />
          <Search className="absolute left-3 top-[calc(50%+0.75rem)] md:top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} aria-hidden="true" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button 
            onClick={onAddTransfer}
            variant="outline"
            size="md"
            className="flex-1 md:flex-none gap-2 text-[10px] font-bold uppercase tracking-[0.2em]"
            aria-label="Realizar nova transferência entre contas"
          >
            <ArrowRightLeft size={14} aria-hidden="true" />
            Transferir
          </Button>
          <Button 
            onClick={onAddAccount}
            variant="primary"
            size="md"
            className="flex-1 md:flex-none gap-2 text-[10px] font-bold uppercase tracking-[0.2em]"
            aria-label="Adicionar nova conta bancária ou instituição"
          >
            <Plus size={14} aria-hidden="true" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Barra de Ferramentas - Linha 2: Filtros */}
      <nav className="flex flex-wrap gap-2 items-center" aria-label="Filtrar contas por tipo">
        <div className="flex gap-2 flex-wrap" role="group">
          {(['all', 'checking', 'savings'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              aria-pressed={filterType === type}
              aria-label={`Mostrar ${type === 'all' ? 'todas as contas' : type === 'checking' ? 'contas correntes' : 'contas poupança'}`}
              className={`
                min-w-[100px] py-2.5 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all
                ${filterType === type 
                  ? 'bg-brand-blue/10 border-brand-blue text-brand-blue' 
                  : 'bg-transparent border-brand-lead/30 text-gray-500 hover:border-brand-blue/30'}
              `}
            >
              {type === 'all' ? 'Todas' : type === 'checking' ? 'Corrente' : 'Poupança'}
            </button>
          ))}
        </div>
      </nav>

      {/* Grid de Contas */}
      <div 
        className="grid gap-8" 
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
      >
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4" aria-live="polite">
            <Loader2 size={32} className="text-brand-blue animate-spin" aria-hidden="true" />
            <p className="text-xs text-gray-500 uppercase tracking-widest">Sincronizando Contas...</p>
          </div>
        ) : (
          <ul className="contents" role="list">
            {filteredAccounts.map((acc, i) => (
              <motion.li 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={acc.id}
                onClick={() => setSelectedAccountId(selectedAccountId === acc.id ? null : acc.id)}
                className={`glass-panel technical-border p-6 rounded-lg group transition-all relative overflow-hidden card-container ${
                  selectedAccountId === acc.id ? 'border-brand-blue ring-1 ring-brand-blue/30' : ''
                }`}
                aria-label={`Conta ${acc.name}, Saldo: ${formatCurrency(acc.balance)}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedAccountId(selectedAccountId === acc.id ? null : acc.id);
                  }
                }}
              >
                {/* Efeito de fundo com a cor do banco */}
                <div 
                  className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] -mr-8 -mt-8 rounded-full"
                  style={{ backgroundColor: acc.color }}
                  aria-hidden="true"
                />

                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <Building2 size={24} style={{ color: acc.color }} aria-hidden="true" />
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditAccount?.(acc);
                    }}
                    className="p-2 text-gray-600 hover:text-white transition-colors"
                    aria-label={`Editar conta ${acc.name}`}
                  >
                    <MoreHorizontal size={18} aria-hidden="true" />
                  </button>
                </div>

                <div className="space-y-1 relative z-10">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{acc.type === 'checking' ? 'Conta Corrente' : 'Conta Poupança'}</p>
                  <h3 className="text-lg font-bold text-white tracking-tight">{acc.name}</h3>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 relative z-10">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Saldo Real</p>
                    <div className="fluid-value font-mono font-bold text-white">
                      <span className="currency-symbol" aria-hidden="true">R$</span>
                      {formatCurrency(acc.balance, false)}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-brand-blue font-bold mb-1">Saldo Projetado</p>
                    <div className="fluid-value font-mono font-bold text-brand-blue">
                      <span className="currency-symbol" aria-hidden="true">R$</span>
                      {formatCurrency(acc.projected_balance, false)}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-brand-lead/10 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-gray-400">
                    <Zap size={12} className="text-brand-green" aria-hidden="true" />
                    <span>Sincronização Ativa</span>
                  </div>
                  <div className="flex gap-1" aria-label="Status de conexão: Ativo">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-green/30" />
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-green/30" />
                  </div>
                </div>
              </motion.li>
            ))}

            {/* Card de Adicionar */}
            <li className="contents" role="none">
              <button 
                onClick={onAddAccount}
                className="border-2 border-dashed border-brand-lead/20 rounded-lg p-6 flex flex-col items-center justify-center gap-4 hover:border-brand-blue/30 hover:bg-brand-blue/5 transition-all group min-h-[240px]"
                aria-label="Adicionar nova instituição financeira"
              >
                <div className="p-4 rounded-full bg-brand-lead/10 text-gray-500 group-hover:text-brand-blue group-hover:bg-brand-blue/10 transition-all">
                  <Plus size={32} aria-hidden="true" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-400 group-hover:text-brand-blue transition-colors">Nova Instituição</p>
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">Open Finance Ativo</p>
                </div>
              </button>
            </li>
          </ul>
        )}
      </div>

      {/* Resumo de Liquidez */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8" aria-labelledby="liquidity-summary-title">
        <div className="lg:col-span-2 glass-panel technical-border p-8 rounded-lg space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="text-brand-blue" size={20} aria-hidden="true" />
              <h3 id="liquidity-summary-title" className="text-sm font-bold uppercase tracking-widest text-gray-400">
                {selectedAccount ? `Histórico: ${selectedAccount.name}` : 'Últimos Lançamentos (Geral)'}
              </h3>
            </div>
            {selectedAccountId && (
              <button 
                onClick={() => setSelectedAccountId(null)}
                className="text-[10px] uppercase tracking-widest text-brand-blue font-bold hover:underline"
                aria-label="Limpar filtro de conta e ver todos os lançamentos"
              >
                Ver Tudo
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <caption className="sr-only">Lista de transações recentes filtradas por conta ou geral</caption>
              <thead>
                <tr className="border-b border-brand-lead/10">
                  <th scope="col" className="py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Data</th>
                  <th scope="col" className="py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Descrição</th>
                  <th scope="col" className="py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Conta</th>
                  <th scope="col" className="py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold text-right">Valor</th>
                  <th scope="col" className="py-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold text-center w-10">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-lead/5">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-gray-600 uppercase tracking-widest">
                      Nenhuma movimentação encontrada
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => {
                    let displayType = t.type;
                    if (t.type === 'transfer') {
                      if (selectedAccountId) {
                        displayType = t.destination_account_id === selectedAccountId ? 'income' : 'expense';
                      }
                    }

                    const isIncome = displayType === 'income';
                    const isExpense = displayType === 'expense';
                    const isTransfer = displayType === 'transfer';

                    return (
                      <tr 
                        key={t.id} 
                        className="group hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => onEditTransaction?.(t)}
                        aria-label={`${t.description}: ${formatCurrency(t.amount)} em ${formatDate(t.date)}`}
                      >
                        <td className="py-4 text-xs font-mono text-gray-400">{formatDate(t.date)}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              isIncome ? 'bg-brand-green/10 text-brand-green' : 
                              isExpense ? 'bg-brand-red/10 text-brand-red' : 
                              'bg-brand-blue/10 text-brand-blue'
                            }`}>
                              {isIncome ? <ArrowUpCircle size={14} aria-hidden="true" /> : 
                               isExpense ? <ArrowDownCircle size={14} aria-hidden="true" /> : 
                               <ArrowRightLeft size={14} aria-hidden="true" />}
                            </div>
                            <span className="text-xs font-bold text-white tracking-tight">{t.description}</span>
                          </div>
                        </td>
                        <td className="py-4 text-[10px] text-gray-500 uppercase font-bold">
                          {isTransfer ? `${t.account_name} → ${accounts.find(a => a.id === t.destination_account_id)?.name || 'Outra Conta'}` : t.account_name}
                        </td>
                        <td className={`py-4 text-xs font-mono font-bold text-right ${
                          isIncome ? 'text-brand-green' : 
                          isExpense ? 'text-brand-red' : 
                          'text-brand-blue'
                        }`}>
                          {isIncome ? '+' : isExpense ? '-' : '⇄'} {formatCurrency(t.amount)}
                        </td>
                        <td className="py-4 text-center">
                          {t.status === 'confirmed' || t.status === 'reconciled' ? (
                            <CheckCircle2 size={14} className="text-brand-green mx-auto" aria-label="Confirmado" />
                          ) : (
                            <Clock size={14} className="text-brand-orange mx-auto opacity-50" aria-label="Pendente" />
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel technical-border p-8 rounded-lg space-y-8" aria-labelledby="liquidity-stats-title">
          <div className="flex items-center gap-3">
            <Wallet className="text-brand-blue" size={20} aria-hidden="true" />
            <h3 id="liquidity-stats-title" className="text-sm font-bold uppercase tracking-widest text-gray-400">Liquidez</h3>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-xs text-gray-500 uppercase tracking-widest">Patrimônio Líquido</p>
                <p className="text-sm font-mono font-bold text-white">{formatCurrency(netWorth)}</p>
              </div>
              <div 
                className="h-1.5 w-full bg-brand-lead/20 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={100}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Patrimônio Líquido Total"
              >
                <div className="h-full bg-brand-blue w-full" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-xs text-brand-blue uppercase tracking-widest font-bold">Capital Livre</p>
                <p className="text-sm font-mono font-bold text-brand-blue">{formatCurrency(freeCapital)}</p>
              </div>
              <div 
                className="h-1.5 w-full bg-brand-lead/20 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={netWorth > 0 ? Math.round((freeCapital / netWorth) * 100) : 0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Percentual de Capital Livre sobre Patrimônio Líquido"
              >
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${netWorth > 0 ? (freeCapital / netWorth) * 100 : 0}%` }}
                  className="h-full bg-brand-blue" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
};

export default AccountsView;
