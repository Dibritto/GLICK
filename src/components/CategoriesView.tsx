import React, { useState, useEffect } from 'react';
import { 
  Tags, 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  PieChart,
  ChevronRight,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { Category } from '../types';

interface CategoriesViewProps {
  onAddCategory?: () => void;
  onEditCategory?: (category: Category) => void;
}

const CategoriesView: React.FC<CategoriesViewProps> = ({ onAddCategory, onEditCategory }) => {
  const { categories, derivedData, isLoading } = useFinance();
  const { monthlyExpenses: totalExpense, spendingByCategory } = derivedData;

  const offenders = spendingByCategory.slice(0, 3);

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Cabeçalho */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tighter text-white uppercase italic font-serif">
            Categorias & Orçamentos
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
            Classificação de dados e controle de teto de gastos
          </p>
        </div>

        <button 
          onClick={onAddCategory}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-blue text-brand-graphite rounded-lg hover:bg-brand-blue/80 transition-all text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(44,199,255,0.2)]"
        >
          <Plus size={16} />
          Nova Categoria
        </button>
      </header>

      {/* Grid de Categorias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
            <Loader2 size={32} className="text-brand-blue animate-spin" />
            <p className="text-xs text-gray-500 uppercase tracking-widest">Sincronizando Categorias...</p>
          </div>
        ) : (
          <>
            {categories.map((cat, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={cat.id}
                onClick={() => onEditCategory?.(cat)}
                className="glass-panel technical-border p-5 rounded-lg group hover:border-brand-blue/30 hover:shadow-[0_0_20px_rgba(44,199,255,0.05)] transition-all cursor-pointer relative overflow-hidden card-container"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-brand-blue/5 transition-all" />
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-white/5 border border-white/10 shrink-0 group-hover:border-brand-blue/30 transition-all"
                    >
                      {cat.icon}
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

                  <div className="h-1.5 w-full bg-brand-lead/20 rounded-full overflow-hidden">
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
                        <TrendingUp size={10} className="text-brand-red" />
                      ) : (
                        <TrendingDown size={10} className="text-brand-green" />
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
              </motion.div>
            ))}

            {/* Card de Adicionar */}
            <button 
              onClick={onAddCategory}
              className="border border-dashed border-brand-lead/20 rounded-lg p-5 flex items-center justify-center gap-3 hover:border-brand-blue/30 hover:bg-brand-blue/5 transition-all group"
            >
              <Plus size={18} className="text-gray-500 group-hover:text-brand-blue transition-colors" />
              <span className="text-xs font-bold text-gray-500 group-hover:text-brand-blue transition-colors uppercase tracking-widest">Nova Categoria</span>
            </button>
          </>
        )}
      </div>

      {/* Insights de Categorias */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel technical-border p-8 rounded-lg space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-blue/10 transition-all" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PieChart className="text-brand-blue" size={20} />
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Distribuição de Gastos</h3>
            </div>
            <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Análise Mensal</div>
          </div>
          
          <div className="flex items-center justify-center h-48 border border-dashed border-brand-lead/20 rounded-xl bg-black/20">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-brand-lead/40 mx-auto animate-spin-slow flex items-center justify-center">
                <PieChart size={16} className="text-gray-600" />
              </div>
              <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-bold">Processando Gráfico...</p>
            </div>
          </div>
        </div>

        <div className="glass-panel technical-border p-8 rounded-lg space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-red/10 transition-all" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingDown className="text-brand-red" size={20} />
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Maiores Ofensores</h3>
            </div>
            <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Top 3 Gastos</div>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {offenders.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-brand-red" />
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
        </div>
      </section>

      {/* Botão Flutuante Mobile */}
      <button 
        onClick={onAddCategory}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-brand-blue text-brand-graphite rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default CategoriesView;
