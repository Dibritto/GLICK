import React from 'react';
import { 
  Tags, 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  PieChart,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { motion } from 'motion/react';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  budget: number;
  spent: number;
  color: string;
  icon: string;
}

const mockCategories: Category[] = [
  { id: '1', name: 'Alimentação', type: 'expense', budget: 1200, spent: 850, color: '#FF4B4B', icon: '🍔' },
  { id: '2', name: 'Transporte', type: 'expense', budget: 400, spent: 420, color: '#2CC7FF', icon: '🚗' },
  { id: '3', name: 'Moradia', type: 'expense', budget: 2500, spent: 2500, color: '#F27D26', icon: '🏠' },
  { id: '4', name: 'Lazer', type: 'expense', budget: 500, spent: 120, color: '#00FF9F', icon: '🎬' },
  { id: '5', name: 'Saúde', type: 'expense', budget: 300, spent: 50, color: '#FF7A00', icon: '🏥' },
];

const CategoriesView: React.FC = () => {
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

        <button className="flex items-center gap-2 px-6 py-2.5 bg-brand-blue text-brand-graphite rounded-xl hover:bg-brand-blue/80 transition-all text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(44,199,255,0.2)]">
          <Plus size={16} />
          Nova Categoria
        </button>
      </header>

      {/* Grid de Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockCategories.map((cat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={cat.id}
            className="glass-panel technical-border p-5 rounded-2xl group hover:border-brand-blue/20 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-white/5 border border-white/10"
                >
                  {cat.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{cat.name}</h3>
                  <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Orçamento Mensal</p>
                </div>
              </div>
              <button className="p-1.5 text-gray-600 hover:text-white transition-colors">
                <MoreVertical size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <p className="text-xs font-mono font-bold text-white">
                  R$ {cat.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] font-mono text-gray-500">
                  de R$ {cat.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="h-1.5 w-full bg-brand-lead/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((cat.spent / cat.budget) * 100, 100)}%` }}
                  className="h-full transition-all duration-1000"
                  style={{ backgroundColor: cat.spent > cat.budget ? '#FF4B4B' : cat.color }}
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  {cat.spent > cat.budget ? (
                    <TrendingUp size={10} className="text-brand-red" />
                  ) : (
                    <TrendingDown size={10} className="text-brand-green" />
                  )}
                  <span className={`text-[9px] font-bold uppercase tracking-tighter ${cat.spent > cat.budget ? 'text-brand-red' : 'text-brand-green'}`}>
                    {cat.spent > cat.budget ? 'Excedido' : 'Dentro do Limite'}
                  </span>
                </div>
                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                  {Math.round((cat.spent / cat.budget) * 100)}% Utilizado
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Card de Adicionar */}
        <button className="border border-dashed border-brand-lead/20 rounded-2xl p-5 flex items-center justify-center gap-3 hover:border-brand-blue/30 hover:bg-brand-blue/5 transition-all group">
          <Plus size={18} className="text-gray-500 group-hover:text-brand-blue transition-colors" />
          <span className="text-xs font-bold text-gray-500 group-hover:text-brand-blue transition-colors uppercase tracking-widest">Nova Categoria</span>
        </button>
      </div>

      {/* Insights de Categorias */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel technical-border p-8 rounded-2xl space-y-6">
          <div className="flex items-center gap-3">
            <PieChart className="text-brand-blue" size={20} />
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Distribuição de Gastos</h3>
          </div>
          <div className="flex items-center justify-center h-48 border border-dashed border-brand-lead/20 rounded-xl">
            <p className="text-xs text-gray-600 uppercase tracking-widest">Gráfico de Pizza em Desenvolvimento</p>
          </div>
        </div>

        <div className="glass-panel technical-border p-8 rounded-2xl space-y-6">
          <div className="flex items-center gap-3">
            <TrendingDown className="text-brand-red" size={20} />
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Maiores Ofensores</h3>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Supermercado', val: 'R$ 850,00', perc: '25%' },
              { name: 'Aluguel', val: 'R$ 2.500,00', perc: '60%' },
              { name: 'Combustível', val: 'R$ 420,00', perc: '12%' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-red" />
                  <p className="text-xs font-bold text-white">{item.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-white">{item.val}</p>
                  <p className="text-[9px] text-gray-500 uppercase font-bold">{item.perc} do total</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CategoriesView;
