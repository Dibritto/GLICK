import React, { useState, useEffect, useCallback } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { useMarketPrice } from '../hooks/useMarketPrice';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Plus, ArrowUpRight, ArrowDownRight, RefreshCw, Bitcoin, Activity, Lock, Zap, ChevronRight, Search, X, Trash2, Edit2, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Select } from './ui/Select';
import Modal from './Modal';

const AssetRow = ({ asset, onEdit }: { asset: any, onEdit: (asset: any) => void }) => {
  const { price, isLoading } = useMarketPrice(asset.symbol);
  const USD_TO_BRL = 5.16;
  const currentPrice = (price ? price * USD_TO_BRL : 0) || asset.current_price || 0;
  const averagePrice = asset.average_price || 0;
  const totalValue = asset.quantity * currentPrice;
  const totalInvested = asset.quantity * averagePrice;
  const gain = totalValue - totalInvested;
  const gainPercent = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;
  
  return (
    <li className="glass-panel p-4 rounded-lg border border-white/5 flex flex-col gap-4" role="listitem">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-white uppercase tracking-widest text-lg">{asset.symbol}</p>
            {isLoading && <RefreshCw size={12} className="animate-spin text-brand-orange" />}
          </div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">{asset.name}</p>
        </div>
        <Button variant="ghost" onClick={() => onEdit(asset)} className="text-[10px] h-6 px-2">Editar</Button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 bg-black/20 p-3 rounded-lg">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Preço Médio</p>
          <p className="font-mono text-sm text-gray-300">{formatCurrency(averagePrice)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Preço Atual</p>
          <p className="font-mono text-sm text-white">{formatCurrency(currentPrice)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Saldo ({asset.quantity})</p>
          <p className="font-mono text-sm text-white">{formatCurrency(totalValue)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Lucro / Prejuízo</p>
          <p className={`font-mono text-sm font-bold flex items-center gap-1 ${gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {gain >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {formatCurrency(Math.abs(gain))} ({gainPercent > 0 ? '+' : ''}{gainPercent.toFixed(2)}%)
          </p>
        </div>
      </div>
    </li>
  );
};

interface CryptoViewProps {
  isInstalled?: boolean;
  onNavigateToMarketplace?: () => void;
}

interface CryptoViewProps {
  isInstalled?: boolean;
  onNavigateToMarketplace?: () => void;
}

export const CryptoView: React.FC<CryptoViewProps> = ({ isInstalled = false, onNavigateToMarketplace }) => {
  const { derivedData, createCryptoTransaction, updateCryptoAsset, deleteCryptoAsset, deleteCryptoTransaction, updateCryptoTransaction } = useFinance();
  const { cryptoAssets, cryptoTransactions, accounts, cryptoValue: totalCryptoValue } = derivedData;
  const { token } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditTxModalOpen, setIsEditTxModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any | null>(null);
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [priceEditedManually, setPriceEditedManually] = useState(false);
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

  const [txFormData, setTxFormData] = useState({
    quantity: '',
    price_at_time: '',
    date: ''
  });

  const { price: realTimePrice, name: realTimeName, isLoading: isRealTimeLoading } = useMarketPrice(
    formData.symbol.length >= 2 ? formData.symbol : '',
    'crypto'
  );

  useEffect(() => {
    console.log('CryptoView: realTimePrice changed', realTimePrice);
    console.log('CryptoView: realTimeName changed', realTimeName);
  }, [realTimePrice, realTimeName]);

  // Single source of truth for auto-filling
  useEffect(() => {
    if (realTimeName && !formData.name) {
      setFormData(prev => ({ ...prev, name: realTimeName }));
    }
    if (realTimePrice !== null && !priceEditedManually) {
      setFormData(prev => ({ ...prev, price_at_time: realTimePrice.toString() }));
    }
  }, [realTimeName, realTimePrice, priceEditedManually]);

  // Reset manual edit flag when symbol changes
  useEffect(() => {
    setPriceEditedManually(false);
  }, [formData.symbol]);

  useEffect(() => {
    if (realTimePrice !== null && !priceEditedManually) {
      setFormData(prev => ({
        ...prev,
        price_at_time: realTimePrice.toString()
      }));
    }
  }, [realTimePrice, priceEditedManually]);

  const fetchPrice = async (symbol: string, force: boolean = false) => {
    if (!symbol || !token) return;
    // Se o usuário editou manualmente, só busca se for forçado (botão de refresh)
    if (priceEditedManually && !force) return;
    
    setIsFetchingPrice(true);
    try {
      const url = new URL(`/api/market/price/${symbol}`, window.location.origin);
      url.searchParams.append('type', 'crypto');
      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const responseData = await res.json();
        if (responseData.success && responseData.data && responseData.data.price) {
          setFormData(prev => ({ 
            ...prev, 
            price_at_time: responseData.data.price.toString(),
            name: responseData.data.name || prev.name
          }));
          if (force) {
            setPriceEditedManually(false); // Reset manual flag if forced refresh
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar preço:', error);
    } finally {
      setIsFetchingPrice(false);
    }
  };

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

        <ul 
          className="grid gap-4 w-full max-w-2xl" 
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
          role="list"
        >
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

  const handleEditTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    await updateCryptoTransaction(editingTx.id, {
      quantity: Number(txFormData.quantity),
      price_at_time: Number(txFormData.price_at_time),
      date: txFormData.date
    });
    setIsEditTxModalOpen(false);
    setEditingTx(null);
  };

  const handleSymbolBlur = async () => {
    // Mantido para compatibilidade, mas a lógica agora está no useEffect com debounce
    if (formData.symbol && formData.symbol.length >= 2) {
      fetchPrice(formData.symbol, true); // Força a busca ao clicar no botão
    }
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
        <article className="glass-panel p-6 rounded-xl border border-white/5" aria-labelledby="total-portfolio-label">
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
        <ul 
          className="grid gap-4" 
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
          role="list" 
          aria-labelledby="assets-title"
        >
          {cryptoAssets.map(asset => (
            <AssetRow key={asset.id} asset={asset} onEdit={(a) => { setEditingAsset(a); setIsEditModalOpen(true); }} />
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
                <th className="p-4 text-right" scope="col">Ações</th>
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
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          setEditingTx(tx);
                          setTxFormData({
                            quantity: tx.quantity.toString(),
                            price_at_time: tx.price_at_time.toString(),
                            date: tx.date.split('T')[0]
                          });
                          setIsEditTxModalOpen(true);
                        }}
                        className="text-gray-400 hover:text-white p-2 h-auto"
                        title="Editar Transação"
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          if (confirm('Deseja excluir esta transação? O saldo do ativo será recalculado.')) {
                            deleteCryptoTransaction(tx.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-400 p-2 h-auto"
                        title="Excluir Transação"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {cryptoTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 uppercase text-[10px] tracking-widest">
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
            <div className="relative">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input 
                    id="symbol"
                    label="Símbolo (ex: BTC)"
                    type="text" 
                    required
                    value={formData.symbol}
                    onChange={e => {
                      console.log('CryptoView: symbol changed', e.target.value);
                      setFormData({...formData, symbol: e.target.value.toUpperCase()});
                    }}
                  />
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSymbolBlur}
                  disabled={!formData.symbol || isFetchingPrice || isRealTimeLoading}
                  className="mb-[2px] px-3 py-2 h-[42px]"
                  title="Buscar preço atual"
                >
                  <RefreshCw size={16} className={isFetchingPrice || isRealTimeLoading ? "animate-spin" : ""} />
                </Button>
              </div>
              <div className="h-5 mt-1">
                {realTimePrice !== null && (
                  <div className="text-[10px] text-brand-blue flex items-center gap-1">
                    <span>Preço atual: {formatCurrency(realTimePrice)}</span>
                  </div>
                )}
                {(isFetchingPrice || isRealTimeLoading) && (
                  <span className="text-[10px] text-brand-orange flex items-center gap-1">
                    Buscando...
                  </span>
                )}
              </div>
            </div>
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
            <div className="relative">
              <Input 
                id="price"
                label="Preço Unitário (R$)"
                type="number" 
                step="any"
                required
                value={formData.price_at_time}
                onChange={e => {
                  setFormData({...formData, price_at_time: e.target.value});
                  setPriceEditedManually(true);
                }}
              />
            </div>
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

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Ativo"
      >
        <form onSubmit={async (e) => {
          e.preventDefault();
          await updateCryptoAsset(editingAsset.id, {
            name: editingAsset.name,
            symbol: editingAsset.symbol,
            current_price: Number(editingAsset.current_price)
          });
          setIsEditModalOpen(false);
        }} className="space-y-4">
          <Input label="Nome" value={editingAsset?.name || ''} onChange={e => setEditingAsset({...editingAsset, name: e.target.value})} />
          <Input label="Símbolo" value={editingAsset?.symbol || ''} onChange={e => setEditingAsset({...editingAsset, symbol: e.target.value})} />
          <Input label="Preço Atual" type="number" step="any" value={editingAsset?.current_price || ''} onChange={e => setEditingAsset({...editingAsset, current_price: e.target.value})} />
          <footer className="pt-4 flex gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={async () => {
                if (confirm('Deseja realmente excluir este ativo e todas as suas transações?')) {
                  await deleteCryptoAsset(editingAsset.id);
                  setIsEditModalOpen(false);
                }
              }} 
              className="flex-1 py-3 text-red-500 hover:text-red-400 hover:bg-red-500/10"
            >
              Excluir
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3">Cancelar</Button>
            <Button type="submit" variant="primary" className="flex-1 py-3">Salvar</Button>
          </footer>
        </form>
      </Modal>
      <Modal
        isOpen={isEditTxModalOpen}
        onClose={() => setIsEditTxModalOpen(false)}
        title="Editar Transação"
      >
        <form onSubmit={handleEditTxSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              id="edit-quantity"
              label="Quantidade"
              type="number" 
              step="any"
              required
              value={txFormData.quantity}
              onChange={e => setTxFormData({...txFormData, quantity: e.target.value})}
            />
            <Input 
              id="edit-price"
              label="Preço Unitário (R$)"
              type="number" 
              step="any"
              required
              value={txFormData.price_at_time}
              onChange={e => setTxFormData({...txFormData, price_at_time: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Input 
              id="edit-date"
              label="Data"
              type="date" 
              required
              value={txFormData.date}
              onChange={e => setTxFormData({...txFormData, date: e.target.value})}
            />
          </div>

          <footer className="pt-4 flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsEditTxModalOpen(false)} className="flex-1 py-3">Cancelar</Button>
            <Button type="submit" variant="primary" className="flex-1 py-3">Salvar</Button>
          </footer>
        </form>
      </Modal>
    </section>
  );
};
