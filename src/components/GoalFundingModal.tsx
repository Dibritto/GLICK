import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/formatters';
import { ArrowUpCircle, ArrowDownCircle, Wallet, Calendar, FileText, Loader2 } from 'lucide-react';
import { Goal } from '../types';

interface GoalFundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  type: 'add' | 'withdraw';
}

const GoalFundingModal: React.FC<GoalFundingModalProps> = ({ isOpen, onClose, goal, type }) => {
  const { token } = useAuth();
  const { accounts, createTransaction } = useFinance();
  
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && goal) {
      setAmount('');
      setAccountId('');
      setDescription(type === 'add' ? `Aporte: ${goal.name}` : `Resgate: ${goal.name}`);
      
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
    }
  }, [isOpen, goal, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !goal) return;

    if (!accountId) {
      toast.error('Selecione uma conta');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    setIsSubmitting(true);

    try {
      const transactionData = {
        account_id: Number(accountId),
        type: type === 'add' ? 'expense' : 'income',
        category: type === 'add' ? 'Aporte em Meta' : 'Resgate de Meta',
        amount: Number(amount),
        date,
        description,
        status: 'confirmed',
        goal_id: goal.id
      };

      await createTransaction(transactionData);
      toast.success(type === 'add' ? 'Aporte realizado com sucesso!' : 'Resgate realizado com sucesso!');
      onClose();
    } catch (error: any) {
      console.error('Erro ao processar transação da meta:', error);
      toast.error(error.message || 'Erro ao processar a operação');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!goal) return null;

  const isAdd = type === 'add';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isAdd ? 'Aportar Capital' : 'Resgatar Capital'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Meta Selecionada</p>
            <p className="text-white font-bold">{goal.name}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Saldo Atual</p>
            <p className="text-brand-blue font-mono font-bold">{formatCurrency(goal.current_amount)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
              Valor do {isAdd ? 'Aporte' : 'Resgate'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 font-mono">R$</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white font-mono focus:outline-none focus:border-brand-blue transition-colors"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
              {isAdd ? 'Retirar da Conta' : 'Depositar na Conta'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Wallet size={16} className="text-gray-500" />
              </div>
              <select
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-brand-gray-deep border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white appearance-none focus:outline-none focus:border-brand-blue transition-colors"
              >
                <option value="" disabled>Selecione uma conta...</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.balance)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Data</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Calendar size={16} className="text-gray-500" />
                </div>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Descrição</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FileText size={16} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-blue transition-colors"
                  placeholder="Descrição..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2 ${
              isAdd 
                ? 'bg-brand-blue hover:bg-brand-blue/90' 
                : 'bg-brand-red hover:bg-brand-red/90'
            } disabled:opacity-50`}
          >
            {isSubmitting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : isAdd ? (
              <>
                <ArrowUpCircle size={20} /> Confirmar Aporte
              </>
            ) : (
              <>
                <ArrowDownCircle size={20} /> Confirmar Resgate
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GoalFundingModal;
