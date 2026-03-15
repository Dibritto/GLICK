import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calendar, 
  Tag, 
  Wallet, 
  FileText,
  Check,
  Loader2
} from 'lucide-react';

interface Account {
  id: number;
  name: string;
  balance: number;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'income' | 'expense';
}

const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  type: initialType = 'expense' 
}) => {
  const [type, setType] = useState<'income' | 'expense'>(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/accounts')
        .then(res => res.json())
        .then(data => setAccounts(data))
        .catch(err => console.error('Erro ao buscar contas:', err));
    }
  }, [isOpen]);

  useEffect(() => {
    setType(initialType);
  }, [initialType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: Number(accountId),
          type,
          category,
          amount: Number(amount),
          date,
          description,
          status: 'confirmed'
        })
      });

      if (res.ok) {
        onClose();
        // Reset form
        setAmount('');
        setDescription('');
        setCategory('');
        setAccountId('');
      }
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={type === 'income' ? 'Registrar Receita' : 'Registrar Despesa'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seletor de Tipo */}
        <div className="flex p-1 bg-brand-lead/20 rounded-2xl">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              type === 'expense' 
                ? 'bg-brand-red text-white shadow-lg' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <ArrowDownCircle size={16} />
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              type === 'income' 
                ? 'bg-brand-green text-brand-graphite shadow-lg' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <ArrowUpCircle size={16} />
            Receita
          </button>
        </div>

        {/* Valor de Grande Impacto */}
        <div className="space-y-2 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Valor da Transação</p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-mono font-bold text-gray-600">R$</span>
            <input 
              type="number" 
              step="0.01"
              required
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent border-b-2 border-brand-lead/30 focus:border-brand-blue py-4 pl-16 text-4xl font-mono font-bold text-white focus:outline-none transition-all placeholder:text-gray-800"
            />
          </div>
        </div>

        {/* Campos de Formulário */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
              <FileText size={12} /> Descrição
            </label>
            <input 
              type="text" 
              required
              placeholder="Ex: Aluguel, Salário, Mercado..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-3 px-4 text-sm text-white focus:border-brand-blue/50 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                <Tag size={12} /> Categoria
              </label>
              <select 
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-3 px-4 text-sm text-white focus:border-brand-blue/50 focus:outline-none transition-all appearance-none"
              >
                <option value="" disabled className="bg-brand-gray-deep">Selecionar...</option>
                <option value="alimentacao" className="bg-brand-gray-deep">Alimentação</option>
                <option value="transporte" className="bg-brand-gray-deep">Transporte</option>
                <option value="moradia" className="bg-brand-gray-deep">Moradia</option>
                <option value="lazer" className="bg-brand-gray-deep">Lazer</option>
                <option value="renda" className="bg-brand-gray-deep">Renda</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                <Wallet size={12} /> Conta
              </label>
              <select 
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-3 px-4 text-sm text-white focus:border-brand-blue/50 focus:outline-none transition-all appearance-none"
              >
                <option value="" disabled className="bg-brand-gray-deep">Selecionar...</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id} className="bg-brand-gray-deep">
                    {acc.name} (R$ {Number(acc.balance).toLocaleString('pt-BR')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
              <Calendar size={12} /> Data da Transação
            </label>
            <input 
              type="date" 
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-3 px-4 text-sm text-white focus:border-brand-blue/50 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Botão de Ação */}
        <button 
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
            type === 'income' 
              ? 'bg-brand-green text-brand-graphite hover:bg-brand-green/80 shadow-brand-green/20' 
              : 'bg-brand-blue text-brand-graphite hover:bg-brand-blue/80 shadow-brand-blue/20'
          }`}
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
          {isSubmitting ? 'Processando...' : 'Confirmar Lançamento'}
        </button>
      </form>
    </Modal>
  );
};

export default TransactionModal;
