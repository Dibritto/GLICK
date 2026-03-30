import React, { useState, useEffect } from 'react';
import { 
  Tags, 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  PieChart,
  ChevronRight,
  MoreVertical,
  Loader2,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Category } from '../types';
import IconRenderer from './IconRenderer';

interface CategoriesViewProps {
  onAddCategory?: () => void;
  onEditCategory?: (category: Category) => void;
}

const CategoriesView: React.FC<CategoriesViewProps> = ({ onAddCategory, onEditCategory }) => {
  const { categories, derivedData, isLoading } = useFinance();
  const { monthlyExpenses: totalExpense, spendingByCategory } = derivedData;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const filteredCategories = categories.filter(cat => {
    const matchesSearch = (cat.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || cat.type === filterType;
    return matchesSearch && matchesType;
  });

  const offenders = spendingByCategory.slice(0, 3);

  return (
    <section className="p-4 md:p-8 space-y-6" aria-labelledby="categories-view-title">
      {/* Cabeçalho Técnico */}
      <header className="space-y-1">
        <h2 id="categories-view-title" className="text-2xl font-bold tracking-tighter text-white uppercase italic font-serif">
          Categorias & Orçamentos
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
          Classificação de dados e controle de teto de gastos
        </p>
      </header>

      {/* Barra de Ferramentas - Linha 1: Busca e Ações */}
      <div className="flex flex-col md:flex-row gap-4 items-center" role="toolbar" aria-label="Ferramentas de categorias">
        <div className="flex-1 w-full">
          <Input 
            type="text" 
            placeholder="Pesquisar por nome da categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Pesquisar categorias"
            className="pl-10"
          />
          <Search className="absolute left-3 top-[calc(50%+0.75rem)] md:top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} aria-hidden="true" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button 
            onClick={onAddCategory}
            variant="primary"
            size="md"
            className="flex-1 md:flex-none gap-2 text-[10px] font-bold uppercase tracking-[0.2em]"
            aria-label="Adicionar nova categoria"
          >
            <Plus size={14} aria-hidden="true" />
            Nova Categoria
          </Button>
        </div>
      </div>

      {/* Barra de Ferramentas - Linha 2: Filtros */}
      <nav className="flex flex-wrap gap-2 items-center" aria-label="Filtros de tipo de categoria">
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Filtrar por tipo">
          {(['all', 'income', 'expense'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              aria-pressed={filterType === type}
              className={`
                min-w-[100px] py-2.5 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all
                ${filterType === type 
                  ? 'bg-brand-blue/10 border-brand-blue text-brand-blue' 
                  : 'bg-transparent border-brand-lead/30 text-gray-500 hover:border-brand-blue/30'}
              `}
            >
              {type === 'all' ? 'Todas' : type === 'income' ? 'Entradas' : 'Saídas'}
            </button>
          ))}
        </div>
      </nav>

      {/* Grid de Categorias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4" aria-live="polite">
            <Loader2 size={32} className="text-brand-blue animate-spin" aria-hidden="true" />
            <p className="text-xs text-gray-500 uppercase tracking-widest">Sincronizando Categorias...</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 col-span-full" role="list">
            {filteredCategories.map((cat, i) => (
              <motion.li 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={cat.id}
                role="listitem"
                aria-label={`Categoria: ${cat.name} (${cat.type === 'income' ? 'Receita' : 'Despesa'})`}
                className="glass-panel technical-border p-5 rounded-lg group hover:border-brand-blue/30 hover:shadow-[0_0_20px_rgba(44,199,255,0.05)] transition-all cursor-pointer relative overflow-hidden card-container"
              >
                <div 
                  onClick={() => onEditCategory?.(cat)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Editar detalhes da categoria ${cat.name}`}
                  onKeyDown={(e) => e.key === 'Enter' && onEditCategory?.(cat)}
                  className="flex flex-col h-full"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-brand-blue/5 transition-all" aria-hidden="true" />
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-white/5 border border-white/10 shrink-0 group-hover:border-brand-blue/30 transition-all"
                        aria-hidden="true"
                      >
                        <IconRenderer iconName={cat.icon} size={20} color={cat.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white tracking-tight truncate" title={cat.name}>{cat.name}</h3>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-tighter shrink-0 ${cat.type === 'income' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-orange/10 text-brand-orange'}`}>
                            {cat.type === 'income' ? 'Rec' : 'Des'}
                          </span>
                        </div>
                        <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold truncate">Orçamento Mensal</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 relative z-10">
                    <div className="flex justify-between items-baseline gap-2">
                      <div className="fluid-value font-mono font-bold text-white">
                        <span className="currency-symbol">R$</span>
                        {formatCurrency(cat.spent, false)}
                      </div>
                      <div className="text-[10px] font-mono text-gray-500 flex items-baseline gap-1">
                        <span className="text-[0.7em] opacity-60">de</span>
                        {formatCurrency(cat.budget)}
                      </div>
                    </div>

                    <div 
                      className="h-1.5 w-full bg-brand-lead/20 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={cat.budget > 0 ? Math.round((Number(cat.spent) / Number(cat.budget)) * 100) : 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Uso do orçamento da categoria ${cat.name}`}
                    >
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((Number(cat.spent) / Number(cat.budget)) * 100, 100)}%` }}
                        className="h-full transition-all duration-1000"
                        style={{ backgroundColor: Number(cat.spent) > Number(cat.budget) ? '#FF4B4B' : cat.color }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        {Number(cat.spent) > Number(cat.budget) ? (
                          <TrendingUp size={10} className="text-brand-red" aria-hidden="true" />
                        ) : (
                          <TrendingDown size={10} className="text-brand-green" aria-hidden="true" />
                        )}
                        <span className={`text-[9px] font-bold uppercase tracking-tighter ${Number(cat.spent) > Number(cat.budget) ? 'text-brand-red' : 'text-brand-green'}`}>
                          {Number(cat.spent) > Number(cat.budget) ? 'Excedido' : 'Dentro do Limite'}
                        </span>
                      </div>
                      <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                        {cat.budget > 0 ? Math.round((Number(cat.spent) / Number(cat.budget)) * 100) : 0}% Utilizado
                      </p>
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}

            {/* Card de Adicionar */}
            <li role="listitem">
              <button 
                onClick={onAddCategory}
                aria-label="Adicionar nova categoria"
                className="w-full h-full border border-dashed border-brand-lead/20 rounded-lg p-5 flex items-center justify-center gap-3 hover:border-brand-blue/30 hover:bg-brand-blue/5 transition-all group"
              >
                <Plus size={18} className="text-gray-500 group-hover:text-brand-blue transition-colors" aria-hidden="true" />
                <span className="text-xs font-bold text-gray-500 group-hover:text-brand-blue transition-colors uppercase tracking-widest">Nova Categoria</span>
              </button>
            </li>
          </ul>
        )}
      </div>

      {/* Insights de Categorias */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8" aria-labelledby="category-insights-title">
        <h3 id="category-insights-title" className="sr-only">Insights de Categorias</h3>
        <article className="glass-panel technical-border p-8 rounded-lg space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-blue/10 transition-all" aria-hidden="true" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PieChart className="text-brand-blue" size={20} aria-hidden="true" />
              <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400">Distribuição de Gastos</h4>
            </div>
            <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Análise Mensal</div>
          </div>
          
          <div className="flex items-center justify-center h-48 border border-dashed border-brand-lead/20 rounded-xl bg-black/20" role="img" aria-label="Gráfico de distribuição de gastos (em processamento)">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-brand-lead/40 mx-auto animate-spin-slow flex items-center justify-center">
                <PieChart size={16} className="text-gray-600" aria-hidden="true" />
              </div>
              <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-bold">Processando Gráfico...</p>
            </div>
          </div>
        </article>

        <article className="glass-panel technical-border p-8 rounded-lg space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-red/10 transition-all" aria-hidden="true" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingDown className="text-brand-red" size={20} aria-hidden="true" />
              <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400">Maiores Ofensores</h4>
            </div>
            <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Top 3 Gastos</div>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar" role="list" aria-label="Lista de maiores ofensores de gastos">
            {offenders.map((item, i) => (
              <div key={i} role="listitem" className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-brand-red" aria-hidden="true" />
                  <p className="text-xs font-bold text-white truncate" title={item.name}>{item.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono font-bold text-white">{formatCurrency(item.value)}</p>
                  <p className="text-[9px] text-gray-500 uppercase font-bold">
                    {totalExpense > 0 ? Math.round((Number(item.value) / totalExpense) * 100) : 0}% do total
                  </p>
                </div>
              </div>
            ))}
            {offenders.length === 0 && (
              <p className="text-[10px] text-gray-600 uppercase tracking-widest text-center py-10">Sem dados de gastos</p>
            )}
          </div>
        </article>
      </section>

      {/* Botão Flutuante Mobile */}
      <button 
        onClick={onAddCategory}
        aria-label="Adicionar nova categoria"
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-brand-blue text-brand-graphite rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
      >
        <Plus size={24} aria-hidden="true" />
      </button>
    </section>
  );
};

export default CategoriesView;
