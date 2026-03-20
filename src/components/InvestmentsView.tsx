import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { Plus, TrendingUp, Activity, Lock, Zap, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface InvestmentsViewProps {
  isInstalled?: boolean;
  onNavigateToMarketplace?: () => void;
}

const InvestmentsView: React.FC<InvestmentsViewProps> = ({ isInstalled = false, onNavigateToMarketplace }) => {
  const { derivedData, createInvestmentTransaction } = useFinance();
  const { investmentAssets, investmentTransactions, accounts } = derivedData;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    type: 'buy',
    assetType: 'stocks',
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
          <div className="w-24 h-24 bg-brand-orange/10 rounded-full flex items-center justify-center text-brand-orange animate-pulse">
            <Lock size={48} />
          </div>
          <div className="absolute -top-2 -right-2 p-2 bg-brand-orange text-white rounded-lg shadow-lg">
            <Zap size={16} />
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          <h2 className="text-3xl font-bold text-white uppercase italic font-serif tracking-tighter">Módulo de Investimentos</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Desbloqueie o console de custódia avançada. Acompanhe sua carteira de ações, FIIs, Cripto e Renda Fixa com telemetria em tempo real e análise de risco.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
          {[
            { label: 'Cotações Real-time', desc: 'B3 e Mercado Global' },
            { label: 'Análise de Risco', desc: 'VaR e Volatilidade' },
            { label: 'IR Automático', desc: 'Relatórios de custódia' },
          ].map((feat, i) => (
            <div key={i} className="glass-panel technical-border p-4 rounded-xl text-left space-y-1">
              <p className="text-[10px] font-bold text-brand-orange uppercase tracking-widest">{feat.label}</p>
              <p className="text-[10px] text-gray-500">{feat.desc}</p>
            </div>
          ))}
        </div>

        <button 
          onClick={onNavigateToMarketplace}
          className="px-8 py-3 bg-brand-orange text-white font-bold rounded-xl hover:bg-brand-orange/80 transition-all uppercase text-xs tracking-[0.2em] shadow-[0_0_30px_rgba(242,125,38,0.3)] flex items-center gap-3">
          Ativar Módulo no Marketplace
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  const totalInvestmentValue = investmentAssets.reduce((acc, asset) => acc + (asset.quantity * asset.current_price), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createInvestmentTransaction({
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
      assetType: 'stocks',
      quantity: '',
      price_at_time: '',
      fee: '',
      account_id: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="text-brand-green" />
            Investimentos
          </h1>
          <p className="text-gray-400 text-sm">Gerencie seu portfólio de investimentos</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-green/20 text-brand-green rounded-lg hover:bg-brand-green/30 transition-colors"
        >
          <Plus size={18} />
          Nova Transação
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-xl border border-white/5">
          <p className="text-sm text-gray-400 mb-2">Valor Total do Portfólio</p>
          <p className="text-3xl font-mono font-bold text-white">{formatCurrency(totalInvestmentValue)}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity size={18} className="text-brand-green" />
          Seus Ativos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {investmentAssets.map(asset => (
            <div key={asset.id} className="glass-panel p-4 rounded-lg border border-white/5 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">{asset.symbol}</p>
                <p className="text-xs text-gray-400">{asset.name}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-white">{asset.quantity} cotas</p>
                <p className="text-xs text-gray-400">{formatCurrency(asset.quantity * asset.current_price)}</p>
              </div>
            </div>
          ))}
          {investmentAssets.length === 0 && (
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
              {investmentTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">{new Date(tx.date).toLocaleDateString('pt-BR')}</td>
                  <td className="p-4 font-bold">{tx.symbol}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      tx.type === 'buy' ? 'bg-brand-green/20 text-brand-green' : 
                      tx.type === 'sell' ? 'bg-brand-red/20 text-brand-red' : 
                      'bg-brand-blue/20 text-brand-blue'
                    }`}>
                      {tx.type === 'buy' ? 'Compra' : tx.type === 'sell' ? 'Venda' : 'Rendimento'}
                    </span>
                  </td>
                  <td className="p-4 font-mono">{tx.quantity}</td>
                  <td className="p-4 font-mono">{formatCurrency(tx.price_at_time)}</td>
                  <td className="p-4 font-mono">{formatCurrency(tx.quantity * tx.price_at_time)}</td>
                </tr>
              ))}
              {investmentTransactions.length === 0 && (
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
              <h2 className="text-xl font-bold text-white">Nova Transação de Investimento</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Símbolo (ex: PETR4)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.symbol}
                    onChange={e => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-brand-green outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Nome (ex: Petrobras)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-brand-green outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Tipo de Ativo</label>
                <select 
                  value={formData.assetType}
                  onChange={e => setFormData({...formData, assetType: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-brand-green outline-none"
                >
                  <option value="stocks">Ações</option>
                  <option value="real_estate">FIIs</option>
                  <option value="fixed_income">Renda Fixa</option>
                  <option value="funds">Fundos de Investimento</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Tipo de Transação</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-brand-green outline-none"
                >
                  <option value="buy">Compra</option>
                  <option value="sell">Venda</option>
                  <option value="dividend">Rendimento/Dividendo</option>
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
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-brand-green outline-none"
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
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-brand-green outline-none"
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
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-brand-green outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Conta (Opcional)</label>
                  <select 
                    value={formData.account_id}
                    onChange={e => setFormData({...formData, account_id: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-brand-green outline-none"
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
                  className="flex-1 py-3 rounded-lg bg-brand-green text-brand-graphite font-bold hover:bg-green-400 transition-colors"
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

export default InvestmentsView;
