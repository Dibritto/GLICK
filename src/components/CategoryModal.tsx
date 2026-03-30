import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { 
  Tags, 
  Check, 
  Loader2, 
  Palette,
  Type,
  TrendingDown
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import IconRenderer from './IconRenderer';

import { Category } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory?: Category | null;
}

const AVAILABLE_ICONS = [
  'Tag', 'Utensils', 'Car', 'Gamepad2', 'Heart', 'GraduationCap', 'Home', 'Wallet', 'TrendingUp', 'Smile',
  'Briefcase', 'Coffee', 'ShoppingBag', 'Music', 'Book', 'Camera', 'Plane', 'Train', 'Bus', 'Bike',
  'Smartphone', 'Laptop', 'Tv', 'Dumbbell', 'Beer', 'Wine', 'Pizza', 'Sun', 'Moon', 'Cloud', 'Zap',
  'DollarSign', 'CreditCard', 'Building', 'Factory', 'School', 'Hospital', 'Stethoscope', 'Scissors'
];

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, editingCategory }) => {
  const { token } = useAuth();
  const { refreshData, updateCategory, deleteCategory, createCategory } = useFinance();
  const [name, setName] = useState(editingCategory?.name || '');
  const [type, setType] = useState(editingCategory?.type || 'expense');
  const [color, setColor] = useState(editingCategory?.color || '#2CC7FF');
  const [icon, setIcon] = useState(editingCategory?.icon || 'Tag');
  const [budget, setBudget] = useState(editingCategory?.budget || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setType(editingCategory.type);
      setColor(editingCategory.color);
      setIcon(editingCategory.icon || 'Tag');
      setBudget(editingCategory.budget || 0);
    } else {
      setName('');
      setType('expense');
      setColor('#2CC7FF');
      setIcon('Tag');
      setBudget(0);
    }
  }, [editingCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const data = { name, type, color, icon, budget: Number(budget) };

      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
        toast.success('Categoria atualizada com sucesso');
      } else {
        await createCategory(data);
        toast.success('Categoria criada com sucesso');
      }
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      toast.error(error.message || 'Falha ao salvar categoria');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingCategory) return;
    setIsDeleting(true);
    try {
      await deleteCategory(editingCategory.id);
      toast.success('Categoria excluída com sucesso');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir categoria');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={editingCategory ? "Editar Categoria" : "Nova Categoria de Fluxo"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Input 
              label="Nome da Categoria"
              icon={<Type size={12} />}
              type="text" 
              required
              placeholder="Ex: Alimentação, Lazer, Salário..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                  <Tags size={12} /> Tipo de Fluxo
                </label>
                <select 
                  required
                  value={type}
                  onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                  className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-3 px-4 text-sm text-white focus:border-brand-blue/50 focus:outline-none transition-all appearance-none"
                >
                  <option value="income" className="bg-brand-gray-deep">Receita</option>
                  <option value="expense" className="bg-brand-gray-deep">Despesa</option>
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

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                <Tags size={12} /> Ícone
              </label>
              <div className="grid grid-cols-5 gap-2">
                {AVAILABLE_ICONS.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${
                      icon === iconName 
                        ? 'bg-brand-blue/20 border-brand-blue text-brand-blue' 
                        : 'bg-brand-lead/10 border-brand-lead/20 text-gray-400 hover:border-brand-blue/30'
                    }`}
                  >
                    <IconRenderer iconName={iconName} size={18} />
                  </button>
                ))}
              </div>
            </div>

            {type === 'expense' && (
              <div className="space-y-1.5">
                <Input 
                  label="Limite de Gastos (Orçamento)"
                  icon={<TrendingDown size={12} />}
                  type="number" 
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                />
                <p className="text-[9px] text-gray-600 italic">Defina quanto você planeja gastar nesta categoria por mês.</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {editingCategory && (
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
              {isSubmitting ? 'Salvando...' : editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Excluir Categoria"
        message="Tem certeza que deseja excluir esta categoria? Transações vinculadas poderão ficar sem categoria."
        confirmText="Sim, Excluir"
        cancelText="Manter Categoria"
      />
    </>
  );
};

export default CategoryModal;
