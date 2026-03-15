import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  Building2,
  MoreHorizontal,
  Zap,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  color: string;
  updated_at: string;
}

const AccountsView: React.FC = () => {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccounts = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch('/api/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [token]);

  const totalBalance = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);

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

        <button className="flex items-center gap-2 px-6 py-2.5 bg-brand-blue text-brand-graphite rounded-lg hover:bg-brand-blue/80 transition-all text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(44,199,255,0.2)]">
          <Plus size={16} />
          Conectar Conta
        </button>
      </header>

      {/* Grid de Contas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
            <Loader2 size={32} className="text-brand-blue animate-spin" />
            <p className="text-xs text-gray-500 uppercase tracking-widest">Sincronizando Contas...</p>
          </div>
        ) : (
          <>
            {accounts.map((acc, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={acc.id}
                className="glass-panel technical-border p-6 rounded-lg group hover:border-brand-blue/30 transition-all relative overflow-hidden"
              >
                {/* Efeito de fundo com a cor do banco */}
                <div 
                  className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] -mr-8 -mt-8 rounded-full"
                  style={{ backgroundColor: acc.color }}
                />

                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <Building2 size={24} style={{ color: acc.color }} />
                  </div>
                  <button className="p-2 text-gray-600 hover:text-white transition-colors">
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                <div className="space-y-1 relative z-10">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{acc.type === 'checking' ? 'Conta Corrente' : 'Conta Poupança'}</p>
                  <h3 className="text-lg font-bold text-white tracking-tight">{acc.name}</h3>
                </div>

                <div className="mt-6 relative z-10">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Saldo Disponível</p>
                  <p className="text-2xl font-mono font-bold text-white">
                    R$ {Number(acc.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-brand-lead/10 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <Zap size={12} className="text-brand-orange" />
                    <span>Atualizado em {new Date(acc.updated_at).toLocaleDateString('pt-BR')}</span>
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
            <button className="border-2 border-dashed border-brand-lead/20 rounded-lg p-6 flex flex-col items-center justify-center gap-4 hover:border-brand-blue/30 hover:bg-brand-blue/5 transition-all group min-h-[240px]">
              <div className="p-4 rounded-full bg-brand-lead/10 text-gray-500 group-hover:text-brand-blue group-hover:bg-brand-blue/10 transition-all">
                <Plus size={32} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-400 group-hover:text-brand-blue transition-colors">Nova Instituição</p>
                <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">Open Finance Ativo</p>
              </div>
            </button>
          </>
        )}
      </div>

      {/* Resumo de Liquidez */}
      <section className="glass-panel technical-border p-8 rounded-lg space-y-6">
        <div className="flex items-center gap-3">
          <Wallet className="text-brand-blue" size={20} />
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Consolidado de Liquidez</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <p className="text-xs text-gray-500">Total Consolidado</p>
              <p className="text-sm font-mono font-bold text-white">R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="h-1.5 w-full bg-brand-lead/20 rounded-full overflow-hidden">
              <div className="h-full bg-brand-blue w-full" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AccountsView;
