import React, { useState } from 'react';
import Modal from './Modal';
import { Button } from './ui/Button';
import { useFinance } from '../context/FinanceContext';
import { toast } from 'sonner';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DebtModal: React.FC<DebtModalProps> = ({ isOpen, onClose }) => {
  const { createDebt } = useFinance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    principal: '',
    monthly_rate: '',
    total_months: '',
    payment_method: 'SAC',
    start_date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createDebt({
        name: formData.name,
        principal: Number(formData.principal),
        monthly_rate: Number(formData.monthly_rate) / 100, // Convert % to decimal
        total_months: Number(formData.total_months),
        payment_method: formData.payment_method,
        start_date: formData.start_date
      });
      toast.success('Dívida registrada com sucesso!');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao registrar dívida');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Dívida / Financiamento">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nome da Dívida</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-brand-graphite border border-brand-lead/50 rounded-lg p-3 text-white focus:border-brand-blue outline-none"
            placeholder="Ex: Financiamento Carro"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Valor Principal (R$)</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.principal}
              onChange={e => setFormData({ ...formData, principal: e.target.value })}
              className="w-full bg-brand-graphite border border-brand-lead/50 rounded-lg p-3 text-white focus:border-brand-blue outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Taxa Mensal (%)</label>
            <input
              type="number"
              step="0.0001"
              required
              value={formData.monthly_rate}
              onChange={e => setFormData({ ...formData, monthly_rate: e.target.value })}
              className="w-full bg-brand-graphite border border-brand-lead/50 rounded-lg p-3 text-white focus:border-brand-blue outline-none"
              placeholder="Ex: 1.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Prazo (Meses)</label>
            <input
              type="number"
              required
              value={formData.total_months}
              onChange={e => setFormData({ ...formData, total_months: e.target.value })}
              className="w-full bg-brand-graphite border border-brand-lead/50 rounded-lg p-3 text-white focus:border-brand-blue outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Sistema</label>
            <select
              value={formData.payment_method}
              onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full bg-brand-graphite border border-brand-lead/50 rounded-lg p-3 text-white focus:border-brand-blue outline-none"
            >
              <option value="SAC">SAC (Amortização Constante)</option>
              <option value="Price">Price (Parcela Fixa)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Data de Início</label>
          <input
            type="date"
            required
            value={formData.start_date}
            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full bg-brand-graphite border border-brand-lead/50 rounded-lg p-3 text-white focus:border-brand-blue outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-brand-lead/30">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Registrando...' : 'Registrar Dívida'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DebtModal;
