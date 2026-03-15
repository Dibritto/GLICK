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
  Loader2,
  ArrowRightLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Account {
  id: number;
  name: string;
  balance: number;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'income' | 'expense' | 'transfer';
}

const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  type: initialType = 'expense' 
}) => {
  const { token } = useAuth();
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      fetch('/api/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setAccounts(data))
        .catch(err => console.error('Erro ao buscar contas:', err));
    }
  }, [isOpen, token]);

  useEffect(() => {
    setType(initialType);
    if (initialType === 'transfer') {
      setCategory('Transferência');
    }
  }, [initialType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          account_id: Number(accountId),
          destination_account_id: type === 'transfer' ? Number(destinationAccountId) : undefined,
          type,
          category: type === 'transfer' ? 'Transferência' : category,
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
        setDestinationAccountId('');
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
      title={
        type === 'income' ? 'Registrar Receita' : 
        type === 'expense' ? 'Registrar Despesa' : 
        'Transferência entre Contas'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seletor de Tipo */}
        <div className="flex p-1 bg-brand-lead/20 rounded-lg">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
              type === 'expense' 
                ? 'bg-brand-red text-white shadow-lg' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <ArrowDownCircle size={14} />
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
              type === 'income' 
                ? 'bg-brand-green text-brand-graphite shadow-lg' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <ArrowUpCircle size={14} />
            Receita
          </button>
          <button
            type="button"
            onClick={() => {
              setType('transfer');
              setCategory('Transferência');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
              type === 'transfer' 
                ? 'bg-brand-blue text-brand-graphite shadow-lg' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <ArrowRightLeft size={14} />
            Transf.
          </button>
        </div>

        {/* Valor de Grande Impacto */}
        <div className="space-y-2 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Valor da Operação</p>
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
              placeholder={type === 'transfer' ? 'Ex: Transferência para reserva...' : 'Ex: Aluguel, Salário, Mercado...'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-3 px-4 text-sm text-white focus:border-brand-blue/50 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {type !== 'transfer' ? (
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
                  <option value="Alimentação" className="bg-brand-gray-deep">Alimentação</option>
                  <option value="Transporte" className="bg-brand-gray-deep">Transporte</option>
                  <option value="Moradia" className="bg-brand-gray-deep">Moradia</option>
                  <option value="Lazer" className="bg-brand-gray-deep">Lazer</option>
                  <option value="Renda" className="bg-brand-gray-deep">Renda</option>
                  <option value="Outros" className="bg-brand-gray-deep">Outros</option>
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                  <Wallet size={12} /> Conta Destino
                </label>
                <select 
                  required
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                  className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-3 px-4 text-sm text-white focus:border-brand-blue/50 focus:outline-none transition-all appearance-none"
                >
                  <option value="" disabled className="bg-brand-gray-deep">Selecionar...</option>
                  {accounts.filter(acc => acc.id.toString() !== accountId).map(acc => (
                    <option key={acc.id} value={acc.id} className="bg-brand-gray-deep">
                      {acc.name} (R$ {Number(acc.balance).toLocaleString('pt-BR')})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                <Wallet size={12} /> {type === 'transfer' ? 'Conta Origem' : 'Conta'}
              </label>
              <select 
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-3 px-4 text-sm text-white focus:border-brand-blue/50 focus:outline-none transition-all appearance-none"
              >
                <option value="" disabled className="bg-brand-gray-deep">Selecionar...</option>
                {accounts.filter(acc => acc.id.toString() !== destinationAccountId).map(acc => (
                  <option key={acc.id} value={acc.id} className="bg-brand-gray-deep">
                    {acc.name} (R$ {Number(acc.balance).toLocaleString('pt-BR')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
              <Calendar size={12} /> Data da Operação
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
          className={`w-full py-4 rounded-lg flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
            type === 'income' 
              ? 'bg-brand-green text-brand-graphite hover:bg-brand-green/80 shadow-brand-green/20' 
              : type === 'transfer'
              ? 'bg-brand-blue text-brand-graphite hover:bg-brand-blue/80 shadow-brand-blue/20'
              : 'bg-brand-red text-white hover:bg-brand-red/80 shadow-brand-red/20'
          }`}
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
          {isSubmitting ? 'Processando...' : 'Confirmar Operação'}
        </button>
      </form>
    </Modal>
  );
};

export default TransactionModal;
