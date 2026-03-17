import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { 
  Tags, 
  Check, 
  Loader2, 
  Palette,
  Type
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

import { Category } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory?: Category | null;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, editingCategory }) => {
  const { token } = useAuth();
  const { refreshData, updateCategory, deleteCategory } = useFinance();
  const [name, setName] = useState(editingCategory?.name || '');
  const [type, setType] = useState(editingCategory?.type || 'expense');
  const [color, setColor] = useState(editingCategory?.color || '#2CC7FF');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setType(editingCategory.type);
      setColor(editingCategory.color);
    } else {
      setName('');
      setType('expense');
      setColor('#2CC7FF');
    }
  }, [editingCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const data = { name, type, color };

      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
        toast.success('Categoria atualizada com sucesso');
      } else {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          await refreshData();
          toast.success('Categoria criada com sucesso');
        } else {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Erro ao criar categoria');
        }
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
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                <Type size={12} /> Nome da Categoria
              </label>
              <input 
                type="text" 
                required
                placeholder="Ex: Alimentação, Lazer, Salário..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-3 px-4 text-sm text-white focus:border-brand-blue/50 focus:outline-none transition-all"
              />
            </div>

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
          </div>

          <div className="flex gap-3">
            {editingCategory && (
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
              {isSubmitting ? 'Salvando...' : editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
            </button>
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
