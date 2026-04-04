import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { cryptoPriceService } from '../services/cryptoPriceService';

/**
 * CryptoForm (Versão Ajustada para Mock)
 * 
 * Formulário para adição de criptoativos utilizando o serviço de preços mockado.
 * Inclui auto-preenchimento de nome, preço em USD/BRL e atualização em tempo real.
 */

// Mapa estático para nomes amigáveis das criptomoedas
const COIN_NAMES: Record<string, string> = {
  'BTC': 'Bitcoin',
  'ETH': 'Ethereum',
  'SOL': 'Solana',
  'XRP': 'XRP',
  'ADA': 'Cardano',
  'BNB': 'BNB',
  'DOT': 'Polkadot',
  'LINK': 'Chainlink',
  'MATIC': 'Polygon',
  'DOGE': 'Dogecoin'
};

const USD_TO_BRL = 5.16; // Taxa de câmbio fixa para o mock (3/abr/2026)

export const CryptoForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { derivedData, createCryptoTransaction } = useFinance();
  const { accounts } = derivedData;
  
  const [formData, setFormData] = useState({
    symbol: '',
    quantity: '',
    price_at_time: '',
    date: new Date().toISOString().split('T')[0],
    account_id: accounts[0]?.id?.toString() || ''
  });

  const [priceUSD, setPriceUSD] = useState<number | null>(null);
  const [priceEditedManually, setPriceEditedManually] = useState(false);
  const [currency, setCurrency] = useState<'USD' | 'BRL'>('USD');

  // Efeito para buscar e atualizar o preço automaticamente a cada 10 segundos
  useEffect(() => {
    if (!formData.symbol || formData.symbol.length < 2) {
      setPriceUSD(null);
      return;
    }

    const updateFromMock = () => {
      // Obtém o preço atual do serviço mockado (em memória)
      const currentPrice = cryptoPriceService.getCurrentPrice(formData.symbol);
      setPriceUSD(currentPrice);
      
      // Se o usuário não editou o campo manualmente, atualizamos com o preço de mercado
      if (currentPrice !== null && !priceEditedManually) {
        const displayPrice = currency === 'USD' ? currentPrice : (currentPrice * USD_TO_BRL);
        setFormData(prev => ({ ...prev, price_at_time: displayPrice.toFixed(2) }));
      }
    };

    // Execução imediata
    updateFromMock();

    // Loop de atualização a cada 10 segundos (simulando WebSocket)
    const interval = setInterval(updateFromMock, 10000);
    
    return () => clearInterval(interval);
  }, [formData.symbol, currency, priceEditedManually]);

  const priceBRL = priceUSD ? priceUSD * USD_TO_BRL : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Envia a transação para o FinanceContext
      await createCryptoTransaction({
        ...formData,
        quantity: parseFloat(formData.quantity),
        price_at_time: parseFloat(formData.price_at_time),
        currency: currency, // Registra em qual moeda o preço foi inserido
        type: 'buy'
      });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar transação cripto:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Linha 1: Símbolo e Nome */}
      <div className="grid grid-cols-2 gap-4">
        <Input 
          label="Símbolo (ex: BTC)" 
          placeholder="BTC, ETH..."
          value={formData.symbol} 
          onChange={(e) => {
            setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }));
            setPriceEditedManually(false); // Reseta trava de edição ao mudar o ativo
          }} 
          required 
        />
        <Input 
          label="Nome da Moeda" 
          value={COIN_NAMES[formData.symbol.toUpperCase()] || 'Cripto Ativo'} 
          readOnly 
          disabled 
          className="bg-gray-800/30 text-gray-400 border-dashed"
        />
      </div>
      
      {/* Seletor de Moeda (USD/BRL) */}
      <div className="flex items-center justify-between p-3 bg-brand-graphite/50 rounded-xl border border-gray-800">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Moeda de Entrada</span>
        <div className="flex gap-1 bg-black/40 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setCurrency('USD')}
            className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-all ${currency === 'USD' ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'text-gray-500 hover:text-gray-300'}`}
          >
            USD
          </button>
          <button
            type="button"
            onClick={() => setCurrency('BRL')}
            className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-all ${currency === 'BRL' ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' : 'text-gray-500 hover:text-gray-300'}`}
          >
            BRL
          </button>
        </div>
      </div>
      
      {/* Telemetria de Preço de Mercado (Read-only) */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-brand-blue/5 rounded-xl border border-brand-blue/10">
          <p className="text-[9px] uppercase font-bold text-brand-blue/60 mb-1">Mercado USD</p>
          <p className="text-sm font-mono font-bold text-white">
            {priceUSD ? `$ ${priceUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '---'}
          </p>
        </div>
        <div className="p-3 bg-brand-green/5 rounded-xl border border-brand-green/10">
          <p className="text-[9px] uppercase font-bold text-brand-green/60 mb-1">Mercado BRL</p>
          <p className="text-sm font-mono font-bold text-white">
            {priceBRL ? `R$ ${priceBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '---'}
          </p>
        </div>
      </div>

      {/* Linha 2: Preço Unitário e Quantidade */}
      <div className="grid grid-cols-2 gap-4">
        <Input 
          label={`Preço Pago (${currency})`} 
          type="number" 
          step="any" 
          value={formData.price_at_time} 
          onChange={(e) => {
            setFormData(prev => ({ ...prev, price_at_time: e.target.value }));
            setPriceEditedManually(true); // Trava atualização automática se o usuário digitar
          }} 
          required 
        />
        <Input 
          label="Quantidade" 
          type="number" 
          step="any" 
          placeholder="0.00"
          value={formData.quantity} 
          onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))} 
          required 
        />
      </div>

      {/* Linha 3: Data e Conta */}
      <div className="grid grid-cols-2 gap-4">
        <Input 
          label="Data da Compra" 
          type="date" 
          value={formData.date} 
          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} 
          required 
        />
        <Select 
          label="Conta de Origem" 
          value={formData.account_id} 
          onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
        >
          {accounts.map(a => (
            <option key={a.id} value={a.id.toString()}>{a.name}</option>
          ))}
        </Select>
      </div>

      <Button 
        type="submit" 
        className="w-full py-4 bg-brand-blue hover:bg-brand-blue/80 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-xl shadow-brand-blue/20 mt-2"
      >
        Registrar Ativo Cripto
      </Button>
      
      <p className="text-[9px] text-center text-gray-500 uppercase font-bold tracking-widest">
        * Preços simulados em tempo real (Mock Service)
      </p>
    </form>
  );
};
