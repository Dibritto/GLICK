import React, { useState } from 'react';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { 
  Wallet, 
  Check, 
  Loader2, 
  Type,
  Palette
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

import { Account } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccount?: Account | null;
}

const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, editingAccount }) => {
  const { token } = useAuth();
  const { createAccount, updateAccount, deleteAccount, recalculateAccountBalance } = useFinance();
  const [name, setName] = useState(editingAccount?.name || '');
  const [type, setType] = useState(editingAccount?.type || 'checking');
  const [balance, setBalance] = useState(editingAccount?.balance.toString() || '');
  const [initialBalance, setInitialBalance] = useState(editingAccount?.initial_balance?.toString() || '0');
  const [color, setColor] = useState(editingAccount?.color || '#2CC7FF');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  React.useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setType(editingAccount.type);
      setBalance(editingAccount.balance.toString());
      setInitialBalance(editingAccount.initial_balance?.toString() || '0');
      setColor(editingAccount.color);
    } else {
      setName('');
      setType('checking');
      setBalance('0');
      setInitialBalance('0');
      setColor('#2CC7FF');
    }
  }, [editingAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const data = {
        name,
        type,
        balance: Number(balance),
        initial_balance: Number(initialBalance),
        color
      };

      if (editingAccount) {
        await updateAccount(editingAccount.id, data);
        toast.success('Conta atualizada com sucesso');
      } else {
        await createAccount(data);
        toast.success('Conta criada com sucesso');
      }
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar conta:', error);
      toast.error(error.message || 'Falha ao salvar conta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingAccount) return;
    setIsDeleting(true);
    try {
      await deleteAccount(editingAccount.id);
      toast.success('Conta excluída com sucesso');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir conta');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={editingAccount ? "Editar Conta" : "Nova Conta / Carteira"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                <Type size={12} /> Nome da Instituição
              </label>
              <input 
                type="text" 
                required
                placeholder="Ex: Nubank, Itaú, Carteira..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-3 px-4 text-sm text-white focus:border-brand-blue/50 focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                  <Wallet size={12} /> Tipo de Conta
                </label>
                <select 
                  required
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-3 px-4 text-sm text-white focus:border-brand-blue/50 focus:outline-none transition-all appearance-none"
                >
                  <option value="checking" className="bg-brand-gray-deep">Corrente</option>
                  <option value="savings" className="bg-brand-gray-deep">Poupança</option>
                  <option value="investment" className="bg-brand-gray-deep">Investimento</option>
                  <option value="cash" className="bg-brand-gray-deep">Dinheiro</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                  <Palette size={12} /> Cor Identificadora
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 bg-transparent border-none cursor-pointer rounded overflow-hidden"
                  />
                  <input 
                    type="text" 
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-2 px-3 text-[10px] font-mono text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Saldo Inicial</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-gray-600">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-2 pl-8 pr-3 text-xs font-mono font-bold text-white focus:border-brand-blue/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center justify-between">
                  Saldo Atual
                  {editingAccount && (
                    <button 
                      type="button"
                      onClick={async () => {
                        setIsRecalculating(true);
                        try {
                          await recalculateAccountBalance(editingAccount.id);
                          toast.success('Saldo recalculado com sucesso');
                        } catch (err) {
                          toast.error('Erro ao recalcular saldo');
                        } finally {
                          setIsRecalculating(false);
                        }
                      }}
                      className="text-brand-blue hover:underline flex items-center gap-1"
                    >
                      {isRecalculating ? <Loader2 size={10} className="animate-spin" /> : 'Recalcular'}
                    </button>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-gray-600">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-2 pl-8 pr-3 text-xs font-mono font-bold text-white focus:border-brand-blue/50 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {editingAccount && (
              <button 
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting || isSubmitting}
                className="flex-1 py-4 bg-brand-red/20 text-brand-red border border-brand-red/30 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-brand-red/30 transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            )}
            <button 
              type="submit"
              disabled={isSubmitting || isDeleting}
              className="flex-[2] py-4 bg-brand-blue text-brand-graphite rounded-lg flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-[0.2em] hover:bg-brand-blue/80 transition-all shadow-xl disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {isSubmitting ? 'Salvando...' : editingAccount ? 'Salvar Alterações' : 'Criar Conta'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Excluir Instituição"
        message={`Tem certeza que deseja excluir a conta "${name}"? Esta ação não pode ser desfeita e só é permitida se não houver transações ou cartões vinculados.`}
        confirmText="Sim, Excluir"
        cancelText="Manter Conta"
      />
    </>
  );
};

export default AccountModal;
