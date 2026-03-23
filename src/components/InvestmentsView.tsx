import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Plus, TrendingUp, Activity, Lock, Zap, ChevronRight, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Select } from './ui/Select';
import Modal from './Modal';

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

        <Button 
          onClick={onNavigateToMarketplace}
          variant="primary"
          size="lg"
          className="px-8 py-3 uppercase text-xs tracking-[0.2em] shadow-[0_0_30px_rgba(242,125,38,0.3)] flex items-center gap-3"
        >
          Ativar Módulo no Marketplace
          <ChevronRight size={16} />
        </Button>
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
    <section className="p-4 md:p-8 space-y-6" aria-labelledby="investments-view-title">
      {/* Cabeçalho Técnico */}
      <header className="space-y-1">
        <h2 id="investments-view-title" className="text-2xl font-bold tracking-tighter text-white uppercase italic font-serif">
          Investimentos
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
          Gestão de Custódia e Telemetria de Mercado
        </p>
      </header>

      {/* Barra de Ferramentas - Linha 1: Busca e Ações */}
      <div className="flex flex-col md:flex-row gap-4 items-center" role="toolbar" aria-label="Ferramentas de busca e ações de investimento">
        <div className="flex-1 w-full">
          <Input 
            id="investment-search"
            type="text" 
            placeholder="Pesquisar por símbolo ou nome do ativo..."
            aria-label="Pesquisar por símbolo ou nome do ativo"
            icon={<Search size={16} aria-hidden="true" />}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button 
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            size="md"
            className="flex-1 md:flex-none gap-2 text-[10px] uppercase tracking-[0.2em]"
            aria-label="Adicionar nova transação de investimento"
          >
            <Plus size={14} aria-hidden="true" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Barra de Ferramentas - Linha 2: Filtros */}
      <nav className="flex flex-wrap gap-2 items-center" aria-label="Filtrar ativos por tipo">
        <div className="flex gap-2 flex-wrap" role="group">
          {(['all', 'stocks', 'fii', 'fixed', 'crypto'] as const).map((type) => (
            <Button
              key={type}
              variant={type === 'all' ? 'primary' : 'outline'}
              className="min-w-[100px] py-2.5 px-4 text-[10px] uppercase tracking-widest"
              aria-pressed={type === 'all'}
              aria-label={`Mostrar ${type === 'all' ? 'todos os ativos' : type === 'stocks' ? 'ações' : type === 'fii' ? 'FIIs' : type === 'fixed' ? 'renda fixa' : 'cripto'}`}
            >
              {type === 'all' ? 'Todos' : type === 'stocks' ? 'Ações' : type === 'fii' ? 'FIIs' : type === 'fixed' ? 'Renda Fixa' : 'Cripto'}
            </Button>
          ))}
        </div>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <article className="glass-panel p-6 rounded-xl border border-white/5 interactive-card">
          <p className="text-sm text-gray-400 mb-2 uppercase tracking-widest font-bold text-[10px]">Valor Total do Portfólio</p>
          <p className="text-3xl font-mono font-bold text-white">{formatCurrency(totalInvestmentValue)}</p>
        </article>
      </div>

      <div className="space-y-4">
        <h2 id="assets-list-title" className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-tighter italic font-serif">
          <Activity size={18} className="text-brand-green" aria-hidden="true" />
          Seus Ativos
        </h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-labelledby="assets-list-title">
          {investmentAssets.map(asset => (
            <li key={asset.id} className="glass-panel p-4 rounded-lg border border-white/5 flex justify-between items-center interactive-card" role="listitem">
              <div>
                <p className="font-bold text-white uppercase tracking-widest">{asset.symbol}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{asset.name}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-white">{asset.quantity} cotas</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{formatCurrency(asset.quantity * asset.current_price)}</p>
              </div>
            </li>
          ))}
          {investmentAssets.length === 0 && (
            <li className="col-span-full text-center py-8 text-gray-500 uppercase text-[10px] tracking-widest" aria-live="polite">
              Nenhum ativo registrado.
            </li>
          )}
        </ul>
      </div>

      <div className="space-y-4">
        <h2 id="transactions-history-title" className="text-lg font-bold text-white uppercase tracking-tighter italic font-serif">Histórico de Transações</h2>
        <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-300">
            <caption className="sr-only">Histórico de todas as transações de compra, venda e rendimentos de investimentos</caption>
            <thead className="bg-white/5 text-gray-400 uppercase text-[10px] tracking-widest">
              <tr>
                <th scope="col" className="p-4 font-bold">Data</th>
                <th scope="col" className="p-4 font-bold">Ativo</th>
                <th scope="col" className="p-4 font-bold">Tipo</th>
                <th scope="col" className="p-4 font-bold">Quantidade</th>
                <th scope="col" className="p-4 font-bold">Preço</th>
                <th scope="col" className="p-4 font-bold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {investmentTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-mono">{formatDate(tx.date)}</td>
                  <td className="p-4 font-bold uppercase tracking-widest">{tx.symbol}</td>
                  <td className="p-4">
                    <Badge variant={
                      tx.type === 'buy' ? 'success' : 
                      tx.type === 'sell' ? 'danger' : 
                      'info'
                    }>
                      {tx.type === 'buy' ? 'Compra' : tx.type === 'sell' ? 'Venda' : 'Rendimento'}
                    </Badge>
                  </td>
                  <td className="p-4 font-mono">{tx.quantity}</td>
                  <td className="p-4 font-mono">{formatCurrency(tx.price_at_time)}</td>
                  <td className="p-4 font-mono">{formatCurrency(tx.quantity * tx.price_at_time)}</td>
                </tr>
              ))}
              {investmentTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 uppercase text-[10px] tracking-widest" aria-live="polite">
                    Nenhuma transação registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Transação de Investimento"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Símbolo (ex: PETR4)"
              id="symbol"
              type="text" 
              required
              value={formData.symbol}
              onChange={e => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
            />
            <Input 
              label="Nome (ex: Petrobras)"
              id="name"
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <Select
            id="assetType"
            label="Tipo de Ativo"
            value={formData.assetType}
            onChange={e => setFormData({...formData, assetType: e.target.value})}
          >
            <option value="stocks">Ações</option>
            <option value="real_estate">FIIs</option>
            <option value="fixed_income">Renda Fixa</option>
            <option value="funds">Fundos de Investimento</option>
          </Select>

          <Select
            id="type"
            label="Tipo de Transação"
            value={formData.type}
            onChange={e => setFormData({...formData, type: e.target.value})}
          >
            <option value="buy">Compra</option>
            <option value="sell">Venda</option>
            <option value="dividend">Rendimento/Dividendo</option>
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Quantidade"
              id="quantity"
              type="number" 
              step="any"
              required
              value={formData.quantity}
              onChange={e => setFormData({...formData, quantity: e.target.value})}
            />
            <Input 
              label="Preço Unitário (R$)"
              id="price_at_time"
              type="number" 
              step="any"
              required
              value={formData.price_at_time}
              onChange={e => setFormData({...formData, price_at_time: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Data"
              id="date"
              type="date" 
              required
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
            />
            <Select
              id="account_id"
              label="Conta (Opcional)"
              value={formData.account_id}
              onChange={e => setFormData({...formData, account_id: e.target.value})}
            >
              <option value="">Não debitar/creditar de conta</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id.toString()}>
                  {acc.name} ({formatCurrency(acc.balance)})
                </option>
              ))}
            </Select>
          </div>

          <footer className="pt-4 flex gap-3">
            <Button 
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-3"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              variant="primary"
              className="flex-1 py-3"
            >
              Salvar
            </Button>
          </footer>
        </form>
      </Modal>
    </section>
  );
};

export default InvestmentsView;
