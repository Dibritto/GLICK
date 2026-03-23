import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Plus, ArrowUpRight, ArrowDownRight, RefreshCw, Bitcoin, Activity, Lock, Zap, ChevronRight, Search, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Select } from './ui/Select';
import Modal from './Modal';

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
      <section 
        className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 min-h-[600px]"
        aria-labelledby="crypto-promo-title"
      >
        <div className="relative" aria-hidden="true">
          <div className="w-24 h-24 bg-brand-blue/10 rounded-full flex items-center justify-center text-brand-blue animate-pulse">
            <Lock size={48} />
          </div>
          <div className="absolute -top-2 -right-2 p-2 bg-brand-blue text-white rounded-lg shadow-lg">
            <Zap size={16} />
          </div>
        </div>

        <header className="space-y-4 max-w-md">
          <h2 id="crypto-promo-title" className="text-3xl font-bold text-white uppercase italic font-serif tracking-tighter">
            Módulo Cripto
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Desbloqueie a gestão avançada de ativos digitais. Acompanhe seu portfólio de criptomoedas com cotações em tempo real e análise de P&L.
          </p>
        </header>

        <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl" role="list">
          {[
            { label: 'Cotações Real-time', desc: 'Integração com Exchanges' },
            { label: 'Análise de P&L', desc: 'Lucro e Prejuízo' },
            { label: 'Gestão de Custódia', desc: 'Controle de Wallets' },
          ].map((feat, i) => (
            <li key={i} className="glass-panel technical-border p-4 rounded-xl text-left space-y-1" role="listitem">
              <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">{feat.label}</p>
              <p className="text-[10px] text-gray-500">{feat.desc}</p>
            </li>
          ))}
        </ul>

        <Button 
          onClick={onNavigateToMarketplace}
          variant="primary"
          className="px-8 py-3 uppercase text-xs tracking-[0.2em] shadow-[0_0_30px_rgba(44,199,255,0.3)] flex items-center gap-3"
          aria-label="Ativar Módulo Cripto no Marketplace"
        >
          Ativar Módulo no Marketplace
          <ChevronRight size={16} aria-hidden="true" />
        </Button>
      </section>
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
    <section className="p-4 md:p-8 space-y-6" aria-labelledby="crypto-title">
      {/* Cabeçalho Técnico */}
      <header className="space-y-1">
        <h2 id="crypto-title" className="text-2xl font-bold tracking-tighter text-white uppercase italic font-serif">
          Criptoativos
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
          Gestão de Ativos Digitais e Telemetria de Blockchain
        </p>
      </header>

      {/* Barra de Ferramentas - Linha 1: Busca e Ações */}
      <nav className="flex flex-col md:flex-row gap-4 items-center" aria-label="Ferramentas de Criptoativos">
        <div className="flex-1 w-full">
          <Input 
            placeholder="Pesquisar por símbolo ou nome do ativo..."
            className="w-full"
            aria-label="Pesquisar ativos"
            icon={<Search size={16} aria-hidden="true" />}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button 
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(44,199,255,0.4)]"
            aria-label="Adicionar nova transação cripto"
          >
            <Plus size={14} aria-hidden="true" />
            Nova Transação
          </Button>
        </div>
      </nav>

      {/* Barra de Ferramentas - Linha 2: Filtros */}
      <nav className="flex flex-wrap gap-2 items-center" aria-label="Filtros de transação">
        <div className="flex gap-2 flex-wrap" role="toolbar" aria-label="Tipos de transação">
          {(['all', 'buy', 'sell'] as const).map((type) => (
            <Button
              key={type}
              variant={type === 'all' ? 'primary' : 'outline'}
              className="min-w-[100px] py-2.5 px-4 text-[10px] uppercase tracking-widest"
              aria-pressed={type === 'all'}
            >
              {type === 'all' ? 'Todos' : type === 'buy' ? 'Compra' : 'Venda'}
            </Button>
          ))}
        </div>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <article className="glass-panel p-6 rounded-xl border border-white/5 interactive-card" aria-labelledby="total-portfolio-label">
          <p id="total-portfolio-label" className="text-sm text-gray-400 mb-2 uppercase tracking-widest font-bold">Valor Total do Portfólio</p>
          <p className="text-3xl font-mono font-bold text-white" aria-label={`Valor Total: ${formatCurrency(totalCryptoValue)}`}>
            {formatCurrency(totalCryptoValue)}
          </p>
        </article>
      </div>

      <div className="space-y-4">
        <h2 id="assets-title" className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-tighter italic font-serif">
          <Activity size={18} className="text-brand-blue" aria-hidden="true" />
          Seus Ativos
        </h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-labelledby="assets-title">
          {cryptoAssets.map(asset => (
            <li key={asset.id} className="glass-panel p-4 rounded-lg border border-white/5 flex justify-between items-center interactive-card" role="listitem">
              <div>
                <p className="font-bold text-white uppercase tracking-widest">{asset.symbol}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{asset.name}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-white">{asset.quantity} {asset.symbol}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider" aria-label={`Valor atual: ${formatCurrency(asset.quantity * asset.current_price)}`}>
                  {formatCurrency(asset.quantity * asset.current_price)}
                </p>
              </div>
            </li>
          ))}
          {cryptoAssets.length === 0 && (
            <li className="col-span-full text-center py-8 text-gray-500 uppercase text-[10px] tracking-widest" role="listitem">
              Nenhum ativo registrado.
            </li>
          )}
        </ul>
      </div>

      <div className="space-y-4">
        <h2 id="history-title" className="text-lg font-bold text-white uppercase tracking-tighter italic font-serif">Histórico de Transações</h2>
        <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-300" aria-labelledby="history-title">
            <caption className="sr-only">Lista de transações de criptoativos</caption>
            <thead className="bg-white/5 text-gray-400 uppercase text-[10px] tracking-widest">
              <tr>
                <th className="p-4" scope="col">Data</th>
                <th className="p-4" scope="col">Ativo</th>
                <th className="p-4" scope="col">Tipo</th>
                <th className="p-4" scope="col">Quantidade</th>
                <th className="p-4" scope="col">Preço</th>
                <th className="p-4" scope="col">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {cryptoTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">{formatDate(tx.date)}</td>
                  <td className="p-4 font-bold uppercase tracking-widest">{tx.symbol}</td>
                  <td className="p-4">
                    <Badge variant={tx.type === 'buy' ? 'success' : 'danger'}>
                      {tx.type === 'buy' ? 'Compra' : 'Venda'}
                    </Badge>
                  </td>
                  <td className="p-4 font-mono">{tx.quantity}</td>
                  <td className="p-4 font-mono">{formatCurrency(tx.price_at_time)}</td>
                  <td className="p-4 font-mono">{formatCurrency(tx.quantity * tx.price_at_time)}</td>
                </tr>
              ))}
              {cryptoTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 uppercase text-[10px] tracking-widest">
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
        title="Nova Transação Cripto"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              id="symbol"
              label="Símbolo (ex: BTC)"
              type="text" 
              required
              value={formData.symbol}
              onChange={e => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
            />
            <Input 
              id="name"
              label="Nome (ex: Bitcoin)"
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <Select
            id="type"
            label="Tipo"
            value={formData.type}
            onChange={e => setFormData({...formData, type: e.target.value})}
          >
            <option value="buy">Compra</option>
            <option value="sell">Venda</option>
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              id="quantity"
              label="Quantidade"
              type="number" 
              step="any"
              required
              value={formData.quantity}
              onChange={e => setFormData({...formData, quantity: e.target.value})}
            />
            <Input 
              id="price"
              label="Preço Unitário (R$)"
              type="number" 
              step="any"
              required
              value={formData.price_at_time}
              onChange={e => setFormData({...formData, price_at_time: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              id="date"
              label="Data"
              type="date" 
              required
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
            />
            <Select
              id="account"
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
