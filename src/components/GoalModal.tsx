import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { 
  Target, 
  Check, 
  Loader2, 
  Calendar,
  Palette
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

import { Goal } from '../types';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingGoal?: Goal | null;
}

const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, editingGoal }) => {
  const { token } = useAuth();
  const { createGoal, updateGoal, deleteGoal } = useFinance();
  const [name, setName] = useState(editingGoal?.name || '');
  const [targetAmount, setTargetAmount] = useState(editingGoal?.target_amount?.toString() || '');
  const [deadline, setDeadline] = useState(editingGoal?.deadline || '');
  const [color, setColor] = useState(editingGoal?.color || '#00FF9F');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (editingGoal) {
      setName(editingGoal.name);
      setTargetAmount(editingGoal.target_amount?.toString() || '0');
      setDeadline(editingGoal.deadline);
      setColor(editingGoal.color);
    } else {
      setName('');
      setTargetAmount('');
      setDeadline('');
      setColor('#00FF9F');
    }
  }, [editingGoal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const data = {
        name,
        target_amount: Number(targetAmount),
        deadline,
        color
      };

      if (editingGoal) {
        await updateGoal(editingGoal.id, data);
        toast.success('Meta atualizada com sucesso');
      } else {
        await createGoal(data);
        toast.success('Meta estabelecida com sucesso');
      }
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar meta:', error);
      toast.error(error.message || 'Falha ao salvar meta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingGoal) return;
    setIsDeleting(true);
    try {
      await deleteGoal(editingGoal.id);
      toast.success('Meta excluída com sucesso');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir meta');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={editingGoal ? "Editar Objetivo" : "Novo Objetivo Estratégico"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Input 
              label="Nome do Objetivo"
              type="text" 
              required
              placeholder="Ex: Reserva de Emergência, Viagem, Carro..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Prazo Estimado"
                icon={<Calendar size={12} />}
                type="date" 
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                  <Palette size={12} /> Cor da Meta
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

            <Input 
              label="Valor Alvo"
              type="number" 
              step="0.01"
              required
              placeholder="0,00"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              icon={<span className="text-xs font-mono font-bold text-gray-600">R$</span>}
            />
          </div>

          <div className="flex gap-3">
            {editingGoal && (
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
              className={`flex-[2] py-4 rounded-lg flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 ${
                editingGoal ? 'bg-brand-blue text-brand-graphite hover:bg-brand-blue/80' : 'bg-brand-green text-brand-graphite hover:bg-brand-green/80'
              }`}
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {isSubmitting ? 'Processando...' : editingGoal ? 'Salvar Alterações' : 'Confirmar Objetivo'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Excluir Objetivo"
        message="Tem certeza que deseja excluir esta meta? Todo o progresso visual será perdido."
        confirmText="Sim, Excluir"
        cancelText="Manter Foco"
      />
    </>
  );
};

export default GoalModal;
