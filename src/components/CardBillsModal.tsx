import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface CardBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: any;
}

const CardBillsModal: React.FC<CardBillsModalProps> = ({ isOpen, onClose, card }) => {
  const { apiAction } = useFinance();
  const [bills, setBills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && card) {
      fetchBills();
    }
  }, [isOpen, card]);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const data = await apiAction(`/api/cards/${card.id}/bills`, 'GET');
      setBills(data);
    } catch (error) {
      console.error('Erro ao buscar faturas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Faturas - ${card?.name}`}>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
        {isLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 size={24} className="text-brand-blue animate-spin" />
          </div>
        ) : bills.length > 0 ? (
          <div className="space-y-3">
            {bills.map((bill) => (
              <div key={bill.id} className="glass-panel technical-border p-4 rounded-lg flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-widest">{bill.month_year}</p>
                    <p className="text-[10px] text-gray-500">Fechamento: {formatCurrency(bill.closing_amount)}</p>
                  </div>
                  <Badge variant={bill.status === 'paid' ? 'success' : bill.status === 'partial' ? 'warning' : 'danger'}>
                    {bill.status === 'paid' ? 'Paga' : bill.status === 'partial' ? 'Parcial' : 'Aberta'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-brand-lead/20">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">Valor Pago</p>
                    <p className="text-sm font-mono font-bold text-brand-green">{formatCurrency(bill.paid_amount)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">Saldo Restante</p>
                    <p className="text-sm font-mono font-bold text-brand-red">{formatCurrency(bill.remaining_balance)}</p>
                  </div>
                </div>
                
                {Number(bill.interest_accrued) > 0 && (
                  <div className="flex items-center gap-2 text-[10px] text-brand-red bg-brand-red/10 p-2 rounded">
                    <AlertCircle size={12} />
                    <span>Juros acumulados: {formatCurrency(bill.interest_accrued)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center glass-panel technical-border rounded-lg">
            <div className="flex flex-col items-center gap-2 opacity-50">
              <Clock size={24} className="text-gray-600" />
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Nenhuma fatura registrada</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-end pt-4 border-t border-brand-lead/30 mt-4">
        <Button variant="ghost" onClick={onClose}>Fechar</Button>
      </div>
    </Modal>
  );
};

export default CardBillsModal;
