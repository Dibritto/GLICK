import React from 'react';
import { 
  Plus, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  Building2,
  MoreHorizontal,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';

interface Account {
  id: string;
  name: string;
  bank: string;
  balance: number;
  type: 'checking' | 'savings' | 'investment';
  color: string;
  lastUpdate: string;
}

const mockAccounts: Account[] = [
  { id: '1', name: 'Principal', bank: 'Nubank', balance: 2450.50, type: 'checking', color: '#8A05BE', lastUpdate: 'Agora mesmo' },
  { id: '2', name: 'Reserva', bank: 'Itaú', balance: 1200.00, type: 'savings', color: '#EC7000', lastUpdate: 'Há 2 horas' },
  { id: '3', name: 'Investimentos', bank: 'Inter', balance: 8500.00, type: 'investment', color: '#FF7A00', lastUpdate: 'Ontem' },
];

const AccountsView: React.FC = () => {
  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Cabeçalho */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tighter text-white uppercase italic font-serif">
            Gestão de Contas
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
            Monitoramento de liquidez e custódia bancária
          </p>
        </div>

        <button className="flex items-center gap-2 px-6 py-2.5 bg-brand-blue text-brand-graphite rounded-xl hover:bg-brand-blue/80 transition-all text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(44,199,255,0.2)]">
          <Plus size={16} />
          Conectar Conta
        </button>
      </header>

      {/* Grid de Contas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockAccounts.map((acc, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={acc.id}
            className="glass-panel technical-border p-6 rounded-2xl group hover:border-brand-blue/30 transition-all relative overflow-hidden"
          >
            {/* Efeito de fundo com a cor do banco */}
            <div 
              className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] -mr-8 -mt-8 rounded-full"
              style={{ backgroundColor: acc.color }}
            />

            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <Building2 size={24} style={{ color: acc.color }} />
              </div>
              <button className="p-2 text-gray-600 hover:text-white transition-colors">
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div className="space-y-1 relative z-10">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{acc.bank}</p>
              <h3 className="text-lg font-bold text-white tracking-tight">{acc.name}</h3>
            </div>

            <div className="mt-6 relative z-10">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Saldo Disponível</p>
              <p className="text-2xl font-mono font-bold text-white">
                R$ {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-brand-lead/10 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <Zap size={12} className="text-brand-orange" />
                <span>{acc.lastUpdate}</span>
              </div>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                <div className="w-1.5 h-1.5 rounded-full bg-brand-green/30" />
                <div className="w-1.5 h-1.5 rounded-full bg-brand-green/30" />
              </div>
            </div>
          </motion.div>
        ))}

        {/* Card de Adicionar */}
        <button className="border-2 border-dashed border-brand-lead/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:border-brand-blue/30 hover:bg-brand-blue/5 transition-all group min-h-[240px]">
          <div className="p-4 rounded-full bg-brand-lead/10 text-gray-500 group-hover:text-brand-blue group-hover:bg-brand-blue/10 transition-all">
            <Plus size={32} />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-400 group-hover:text-brand-blue transition-colors">Nova Instituição</p>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">Open Finance Ativo</p>
          </div>
        </button>
      </div>

      {/* Resumo de Liquidez */}
      <section className="glass-panel technical-border p-8 rounded-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Wallet className="text-brand-blue" size={20} />
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Consolidado de Liquidez</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <p className="text-xs text-gray-500">Contas Correntes</p>
              <p className="text-sm font-mono font-bold text-white">R$ 2.450,50</p>
            </div>
            <div className="h-1.5 w-full bg-brand-lead/20 rounded-full overflow-hidden">
              <div className="h-full bg-brand-blue w-[30%]" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <p className="text-xs text-gray-500">Reservas de Valor</p>
              <p className="text-sm font-mono font-bold text-white">R$ 1.200,00</p>
            </div>
            <div className="h-1.5 w-full bg-brand-lead/20 rounded-full overflow-hidden">
              <div className="h-full bg-brand-orange w-[15%]" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <p className="text-xs text-gray-500">Capital Investido</p>
              <p className="text-sm font-mono font-bold text-white">R$ 8.500,00</p>
            </div>
            <div className="h-1.5 w-full bg-brand-lead/20 rounded-full overflow-hidden">
              <div className="h-full bg-brand-green w-[55%]" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AccountsView;
