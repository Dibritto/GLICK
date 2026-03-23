import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Plus, ArrowUpRight, ArrowDownRight, RefreshCw, Bitcoin, Activity, Lock, Zap, ChevronRight, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface CryptoViewProps {
  isInstalled?: boolean;
  onNavigateToMarketplace?: () => void;
}

export const CryptoView: React.FC<CryptoViewProps> = ({ isInstalled = false, onNavigateToMarketplace }) => {
  const { derivedData, createCryptoTransaction } = useFinance();
  const { cryptoAssets, cryptoTransactions, accounts } = derivedData;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    type: 'buy',
    quantity: '',
    price_at_time: '',
    fee: '',
    account_id: '',
    date: new Date().toISOString().split('T')[0]
  });

  if (!isInstalled) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 min-h-[600px]">
        <div className="relative">
          <div className="w-24 h-24 bg-brand-blue/10 rounded-full flex items-center justify-center text-brand-blue animate-pulse">
            <Lock size={48} />
          </div>
          <div className="absolute -top-2 -right-2 p-2 bg-brand-blue text-white rounded-lg shadow-lg">
            <Zap size={16} />
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          <h2 className="text-3xl font-bold text-white uppercase italic font-serif tracking-tighter">Módulo Cripto</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Desbloqueie a gestão avançada de ativos digitais. Acompanhe seu portfólio de criptomoedas com cotações em tempo real e análise de P&L.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
          {[
            { label: 'Cotações Real-time', desc: 'Integração com Exchanges' },
            { label: 'Análise de P&L', desc: 'Lucro e Prejuízo' },
            { label: 'Gestão de Custódia', desc: 'Controle de Wallets' },
          ].map((feat, i) => (
            <div key={i} className="glass-panel technical-border p-4 rounded-xl text-left space-y-1">
              <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">{feat.label}</p>
              <p className="text-[10px] text-gray-500">{feat.desc}</p>
            </div>
          ))}
        </div>

        <button 
          onClick={onNavigateToMarketplace}
          className="px-8 py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue/80 transition-all uppercase text-xs tracking-[0.2em] shadow-[0_0_30px_rgba(44,199,255,0.3)] flex items-center gap-3">
          Ativar Módulo no Marketplace
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  const totalCryptoValue = cryptoAssets.reduce((acc, asset) => acc + (asset.quantity * asset.current_price), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCryptoTransaction({
      ...formData,
      quantity: Number(formData.quantity),
      price_at_time: Number(formData.price_at_time),
      fee: Number(formData.fee),
      account_id: formData.account_id ? Number(formData.account_id) : undefined
    });
    setIsModalOpen(false);
    setFormData({
      symbol: '',
      name: '',
      type: 'buy',
      quantity: '',
      price_at_time: '',
      fee: '',
      account_id: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Cabeçalho Técnico */}
      <header className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tighter text-white uppercase italic font-serif">
          Criptoativos
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
          Gestão de Ativos Digitais e Telemetria de Blockchain
        </p>
      </header>

      {/* Barra de Ferramentas - Linha 1: Busca e Ações */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder="Pesquisar por símbolo ou nome do ativo..."
            className="w-full bg-brand-gray-deep/50 border border-brand-lead/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-brand-blue/50 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-blue text-brand-graphite rounded-xl hover:bg-brand-blue/80 transition-all text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(44,199,255,0.4)]"
          >
            <Plus size={14} />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Barra de Ferramentas - Linha 2: Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'buy', 'sell'] as const).map((type) => (
            <button
              key={type}
              className={`
                min-w-[100px] py-2.5 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all
                ${type === 'all' 
                  ? 'bg-brand-blue/10 border-brand-blue text-brand-blue' 
                  : 'bg-transparent border-brand-lead/30 text-gray-500 hover:border-brand-blue/30'}
              `}
            >
              {type === 'all' ? 'Todos' : type === 'buy' ? 'Compra' : 'Venda'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-xl border border-white/5">
          <p className="text-sm text-gray-400 mb-2">Valor Total do Portfólio</p>
          <p className="text-3xl font-mono font-bold text-white">{formatCurrency(totalCryptoValue)}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity size={18} className="text-brand-blue" />
          Seus Ativos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cryptoAssets.map(asset => (
            <div key={asset.id} className="glass-panel p-4 rounded-lg border border-white/5 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">{asset.symbol}</p>
                <p className="text-xs text-gray-400">{asset.name}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-white">{asset.quantity} {asset.symbol}</p>
                <p className="text-xs text-gray-400">{formatCurrency(asset.quantity * asset.current_price)}</p>
              </div>
            </div>
          ))}
          {cryptoAssets.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              Nenhum ativo registrado.
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Histórico de Transações</h2>
        <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-white/5 text-gray-400">
              <tr>
                <th className="p-4">Data</th>
                <th className="p-4">Ativo</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Quantidade</th>
                <th className="p-4">Preço</th>
                <th className="p-4">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {cryptoTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">{formatDate(tx.date)}</td>
                  <td className="p-4 font-bold">{tx.symbol}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${tx.type === 'buy' ? 'bg-brand-green/20 text-brand-green' : 'bg-brand-red/20 text-brand-red'}`}>
                      {tx.type === 'buy' ? 'Compra' : 'Venda'}
                    </span>
                  </td>
                  <td className="p-4 font-mono">{tx.quantity}</td>
                  <td className="p-4 font-mono">{formatCurrency(tx.price_at_time)}</td>
                  <td className="p-4 font-mono">{formatCurrency(tx.quantity * tx.price_at_time)}</td>
                </tr>
              ))}
              {cryptoTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Nenhuma transação registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1A1D24] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Nova Transação Cripto</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Símbolo (ex: BTC)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.symbol}
                    onChange={e => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-brand-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Nome (ex: Bitcoin)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-brand-blue outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Tipo</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-brand-blue outline-none"
                >
                  <option value="buy">Compra</option>
                  <option value="sell">Venda</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Quantidade</label>
                  <input 
                    type="number" 
                    step="any"
                    required
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-brand-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Preço Unitário (R$)</label>
                  <input 
                    type="number" 
                    step="any"
                    required
                    value={formData.price_at_time}
                    onChange={e => setFormData({...formData, price_at_time: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-brand-blue outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Data</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-brand-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Conta (Opcional)</label>
                  <select 
                    value={formData.account_id}
                    onChange={e => setFormData({...formData, account_id: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-brand-blue outline-none"
                  >
                    <option value="">Não debitar/creditar de conta</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 rounded-lg bg-brand-blue text-brand-graphite font-bold hover:bg-blue-400 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
