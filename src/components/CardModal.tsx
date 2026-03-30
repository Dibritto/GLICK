import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { 
  CreditCard, 
  Check, 
  Loader2, 
  Calendar,
  Palette,
  Shield
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

import { Card } from '../types';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCard?: Card | null;
}

const CardModal: React.FC<CardModalProps> = ({ isOpen, onClose, editingCard }) => {
  const { token } = useAuth();
  const { refreshData, accounts, updateCard, deleteCard, createCard } = useFinance();
  const [name, setName] = useState(editingCard?.name || '');
  const [accountId, setAccountId] = useState(editingCard?.account_id?.toString() || '');
  const [brand, setBrand] = useState(editingCard?.brand || 'Visa');
  const [limit, setLimit] = useState(editingCard?.limit?.toString() || '');
  const [closingDay, setClosingDay] = useState(editingCard?.closing_day?.toString() || '5');
  const [dueDay, setDueDay] = useState(editingCard?.due_day?.toString() || '12');
  const [color, setColor] = useState(editingCard?.color || '#FF4B4B');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (editingCard) {
      setName(editingCard.name);
      setAccountId(editingCard.account_id?.toString() || '');
      setBrand(editingCard.brand);
      setLimit(editingCard.limit?.toString() || '');
      setClosingDay(editingCard.closing_day?.toString() || '5');
      setDueDay(editingCard.due_day?.toString() || '12');
      setColor(editingCard.color);
    } else {
      setName('');
      setAccountId('');
      setBrand('Visa');
      setLimit('');
      setClosingDay('5');
      setDueDay('12');
      setColor('#FF4B4B');
    }
  }, [editingCard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      toast.error('Selecione uma conta vinculada');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const data = {
        name,
        account_id: Number(accountId),
        brand,
        limit: Number(limit),
        closing_day: Number(closingDay),
        due_day: Number(dueDay),
        color
      };

      if (editingCard) {
        await updateCard(editingCard.id, data);
        toast.success('Cartão atualizado com sucesso');
      } else {
        await createCard(data);
        toast.success('Cartão adicionado com sucesso');
      }
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar cartão:', error);
      toast.error(error.message || 'Falha ao salvar cartão');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingCard) return;
    setIsDeleting(true);
    try {
      await deleteCard(editingCard.id);
      toast.success('Cartão excluído com sucesso');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir cartão');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={editingCard ? "Editar Cartão" : "Novo Cartão de Crédito"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Nome no App"
                icon={<CreditCard size={12} />}
                type="text" 
                required
                placeholder="Ex: Black, Platinum..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                  <Shield size={12} /> Bandeira
                </label>
                <select 
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-3 px-4 text-sm text-white focus:border-brand-blue/50 focus:outline-none transition-all appearance-none"
                >
                  <option value="Visa" className="bg-brand-gray-deep">Visa</option>
                  <option value="Mastercard" className="bg-brand-gray-deep">Mastercard</option>
                  <option value="Elo" className="bg-brand-gray-deep">Elo</option>
                  <option value="Amex" className="bg-brand-gray-deep">Amex</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Conta Vinculada</label>
              <select 
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-3 px-4 text-sm text-white focus:border-brand-blue/50 focus:outline-none transition-all appearance-none"
              >
                <option value="" className="bg-brand-gray-deep">Selecione a conta...</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id} className="bg-brand-gray-deep">{acc.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Fechamento (Dia)"
                icon={<Calendar size={12} />}
                type="number" 
                min="1"
                max="31"
                required
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
              />

              <Input 
                label="Vencimento (Dia)"
                icon={<Calendar size={12} />}
                type="number" 
                min="1"
                max="31"
                required
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Limite Total"
                type="number" 
                step="0.01"
                required
                placeholder="0,00"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                icon={<span className="text-xs font-mono font-bold text-gray-600">R$</span>}
              />

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                  <Palette size={12} /> Cor do Cartão
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
          </div>

          <div className="flex gap-3">
            {editingCard && (
              <Button 
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting || isSubmitting}
                variant="danger"
                className="flex-1 py-4 bg-brand-red/20 text-brand-red border border-brand-red/30 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-brand-red/30 transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </Button>
            )}
            <Button 
              type="submit"
              disabled={isSubmitting || isDeleting}
              variant="primary"
              className="flex-[2] py-4 bg-brand-blue text-brand-graphite rounded-lg flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-[0.2em] hover:bg-brand-blue/80 transition-all shadow-xl disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {isSubmitting ? 'Salvando...' : editingCard ? 'Salvar Alterações' : 'Adicionar Cartão'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Excluir Cartão"
        message="Tem certeza que deseja excluir este cartão? Todas as faturas vinculadas serão removidas."
        confirmText="Sim, Excluir"
        cancelText="Manter Cartão"
      />
    </>
  );
};

export default CardModal;
