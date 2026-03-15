import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  MoreVertical,
  Calendar,
  Tag,
  Wallet,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Movement {
  id: string;
  date: string;
  description: string;
  category: string;
  account_name: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'confirmed' | 'pending';
}

interface MovementsViewProps {
  typeFilter?: 'income' | 'expense' | 'all';
  title?: string;
  onAddTransaction?: () => void;
}

const MovementsView: React.FC<MovementsViewProps> = ({ 
  typeFilter: initialTypeFilter = 'all',
  title = 'Registro de Movimentações',
  onAddTransaction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>(initialTypeFilter);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        setMovements(data);
      }
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredMovements = movements.filter(m => {
    const matchesSearch = m.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  const totals = movements.reduce((acc, m) => {
    if (m.type === 'income') acc.income += Number(m.amount);
    else acc.expense += Number(m.amount);
    return acc;
  }, { income: 0, expense: 0 });

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
          {(['all', 'income', 'expense'] as const).map((type) => (
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
              {type === 'all' ? 'Todos' : type === 'income' ? 'Entradas' : 'Saídas'}
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-gray-deep/50 border border-brand-lead/30 rounded-xl text-gray-400 hover:text-white transition-all">
            <Filter size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Filtros</span>
          </button>
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
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className={`w-2 h-2 rounded-full ${m.status === 'confirmed' ? 'bg-brand-green shadow-[0_0_8px_rgba(0,255,159,0.5)]' : 'bg-brand-orange animate-pulse'}`} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-400 font-mono text-[11px]">
                          <Calendar size={12} className="opacity-50" />
                          {new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-200 group-hover:text-brand-blue transition-colors">{m.description}</p>
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
                        <div className="flex items-center gap-2 text-gray-500 text-xs">
                          <Wallet size={12} className="opacity-50" />
                          {m.account_name}
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-sm font-mono font-bold text-right ${m.type === 'income' ? 'text-brand-green' : 'text-brand-red'}`}>
                        <div className="flex items-center justify-end gap-2">
                          {m.type === 'income' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                          {m.type === 'income' ? '+' : '-'} R$ {Number(m.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-gray-600 hover:text-white transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredMovements.length === 0 && (
          <div className="p-20 text-center space-y-4">
            <div className="inline-flex p-4 rounded-full bg-brand-gray-deep/50 text-gray-600">
              <Search size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-white font-bold">Nenhuma movimentação encontrada</p>
              <p className="text-xs text-gray-500">Tente ajustar seus filtros ou termo de pesquisa.</p>
            </div>
          </div>
        )}
      </div>

      {/* Rodapé de Telemetria */}
      <footer className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 glass-panel technical-border rounded-2xl">
        <div className="flex gap-8">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">Total Entradas</p>
            <p className="text-lg font-mono font-bold text-brand-green">R$ {totals.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-px h-10 bg-brand-lead/20" />
          <div>
            <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">Total Saídas</p>
            <p className="text-lg font-mono font-bold text-brand-red">R$ {totals.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">Resultado Líquido</p>
          <p className="text-xl font-mono font-bold text-brand-blue">R$ {(totals.income - totals.expense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </footer>
    </div>
  );
};

export default MovementsView;
