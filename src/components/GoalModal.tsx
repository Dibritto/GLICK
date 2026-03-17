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

import { Goal } from '../types';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingGoal?: Goal | null;
}

const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, editingGoal }) => {
  const { token } = useAuth();
  const { refreshData, updateGoal, deleteGoal } = useFinance();
  const [name, setName] = useState(editingGoal?.name || '');
  const [targetAmount, setTargetAmount] = useState(editingGoal?.target_amount.toString() || '');
  const [currentAmount, setCurrentAmount] = useState(editingGoal?.current_amount.toString() || '');
  const [deadline, setDeadline] = useState(editingGoal?.deadline || '');
  const [color, setColor] = useState(editingGoal?.color || '#00FF9F');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (editingGoal) {
      setName(editingGoal.name);
      setTargetAmount(editingGoal.target_amount.toString());
      setCurrentAmount(editingGoal.current_amount.toString());
      setDeadline(editingGoal.deadline);
      setColor(editingGoal.color);
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
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
        current_amount: Number(currentAmount) || 0,
        deadline,
        color
      };

      if (editingGoal) {
        await updateGoal(editingGoal.id, data);
        toast.success('Meta atualizada com sucesso');
      } else {
        const res = await fetch('/api/goals', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          await refreshData();
          toast.success('Meta estabelecida com sucesso');
        } else {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Erro ao criar meta');
        }
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
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Nome do Objetivo</label>
              <input 
                type="text" 
                required
                placeholder="Ex: Reserva de Emergência, Viagem, Carro..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-3 px-4 text-sm text-white focus:border-brand-blue/50 focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                  <Calendar size={12} /> Prazo Estimado
                </label>
                <input 
                  type="date" 
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-3 px-4 text-sm text-white focus:border-brand-blue/50 focus:outline-none transition-all"
                />
              </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Valor Alvo</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-gray-600">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-3 pl-10 pr-4 text-sm font-mono font-bold text-white focus:border-brand-blue/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Valor Já Acumulado</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-gray-600">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-3 pl-10 pr-4 text-sm font-mono font-bold text-white focus:border-brand-blue/50 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {editingGoal && (
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
              className={`flex-[2] py-4 rounded-lg flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 ${
                editingGoal ? 'bg-brand-blue text-brand-graphite hover:bg-brand-blue/80' : 'bg-brand-green text-brand-graphite hover:bg-brand-green/80'
              }`}
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {isSubmitting ? 'Processando...' : editingGoal ? 'Salvar Alterações' : 'Confirmar Objetivo'}
            </button>
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
