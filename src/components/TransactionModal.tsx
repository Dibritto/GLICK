import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calendar, 
  Tag, 
  Wallet, 
  FileText,
  Check,
  Loader2,
  ArrowRightLeft,
  Clock,
  CreditCard
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/formatters';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'income' | 'expense' | 'transfer';
  lockType?: boolean;
  editingTransaction?: any | null;
  prefilledGoal?: any | null;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  type: initialType = 'expense',
  lockType = false,
  editingTransaction,
  prefilledGoal
}) => {
  const { token } = useAuth();
  const { accounts, cards, goals, categories, refreshData, createTransaction, updateTransaction, deleteTransaction } = useFinance();
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [cardId, setCardId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'confirmed' | 'pending' | 'reconciled'>('confirmed');
  const [recurrence, setRecurrence] = useState<'none' | 'monthly' | 'weekly' | 'yearly'>('none');
  const [installments, setInstallments] = useState('1');
  const [installmentType, setInstallmentType] = useState<'total' | 'installment'>('total');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  useEffect(() => {
    if (editingTransaction) {
      // Só reseta se for uma transação diferente ou se não tivermos uma transação sendo editada
      if (editingTransactionId !== editingTransaction.id) {
        setEditingTransactionId(editingTransaction.id);
        setType(editingTransaction.type);
        setAmount(editingTransaction.amount?.toString() || '0');
        setDescription(editingTransaction.description || '');
        setCategory(editingTransaction.category || '');
        setAccountId(editingTransaction.account_id?.toString() || '');
        setDestinationAccountId(editingTransaction.destination_account_id?.toString() || '');
        setCardId(editingTransaction.card_id?.toString() || '');
        setGoalId(editingTransaction.goal_id?.toString() || '');
        setStatus(editingTransaction.status as 'confirmed' | 'pending' | 'reconciled' || 'confirmed');
        // Evitar problemas de fuso horário ao carregar a data para o input
        const transactionDate = editingTransaction.date;
        if (transactionDate && typeof transactionDate === 'string' && transactionDate.includes('T')) {
          const dateObj = new Date(transactionDate);
          if (!isNaN(dateObj.getTime())) {
            setDate(dateObj.toISOString().split('T')[0]);
          } else {
            console.error('Data de transação inválida:', transactionDate);
            setDate(new Date().toISOString().split('T')[0]);
          }
        } else if (transactionDate) {
          setDate(transactionDate);
        } else {
          // Fallback para a data atual se a transação não tiver data
          const now = new Date();
          setDate(now.toISOString().split('T')[0]);
        }
        setRecurrence(editingTransaction.recurrence || 'none');
        setInstallments(editingTransaction.installments?.toString() || '1');
      }
    } else {
      setEditingTransactionId(null);
      setType(initialType);
      setAmount('');
      setDescription('');
      setCategory(initialType === 'transfer' ? 'Transferência' : '');
      setAccountId('');
      setDestinationAccountId('');
      setCardId('');
      setGoalId(prefilledGoal ? prefilledGoal.id?.toString() || '' : '');
      if (prefilledGoal) {
        setCategory(initialType === 'income' ? 'Resgate de Meta' : 'Aporte em Meta');
        setDescription(initialType === 'income' ? `Resgate: ${prefilledGoal.name}` : `Aporte: ${prefilledGoal.name}`);
      }
      // Garantir que a data inicial seja a data local correta (YYYY-MM-DD)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
      setStatus('confirmed');
      setRecurrence('none');
      setInstallments('1');
    }
  }, [editingTransaction, initialType, prefilledGoal, editingTransactionId]);

  // Efeito para auto-definir status baseado na data
  useEffect(() => {
    if (date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [year, month, day] = date.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day); // Usar construtor seguro
      
      if (!isNaN(selectedDate.getTime())) {
        if (selectedDate > today) {
          setStatus('pending');
        } else if (!editingTransaction) {
          setStatus('confirmed');
        }
      }
    }
  }, [date, editingTransaction]);

  const handleDelete = async () => {
    if (!editingTransaction) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(editingTransaction.id);
      toast.success('Transação excluída com sucesso');
      onClose();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir transação');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações de Blind Spot
    if (Number(amount) <= 0) {
      return toast.error('O valor deve ser maior que zero');
    }

    if (type === 'transfer' && accountId === destinationAccountId) {
      return toast.error('A conta de origem e destino devem ser diferentes');
    }

    if (!accountId) {
      return toast.error('Selecione uma conta');
    }

    if (type === 'transfer' && !destinationAccountId) {
      return toast.error('Selecione a conta de destino');
    }

    setIsSubmitting(true);
    
    try {
      const data = {
        account_id: Number(accountId),
        destination_account_id: type === 'transfer' ? Number(destinationAccountId) : undefined,
        type,
        category: type === 'transfer' ? 'Transferência' : category,
        amount: type === 'expense' && cardId && installments !== '1' && installmentType === 'installment' 
                ? Number(amount) * Number(installments) 
                : Number(amount),
        date,
        description,
        status,
        recurrence,
        card_id: type === 'expense' && cardId ? Number(cardId) : null,
        goal_id: (type === 'expense' || type === 'income') && goalId ? Number(goalId) : null,
        installments: type === 'expense' && cardId ? Number(installments) : 1
      };

      if (editingTransaction && !String(editingTransaction.id).startsWith('projected-')) {
        await updateTransaction(editingTransaction.id, data);
        toast.success('Transação atualizada com sucesso');
      } else {
        await createTransaction(data);
        toast.success(
          type === 'income' ? 'Receita registrada com sucesso' : 
          type === 'expense' ? 'Despesa registrada com sucesso' : 
          'Transferência concluída'
        );
      }

      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar transação:', error);
      toast.error(error.message || 'Falha na comunicação com o servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={
          editingTransaction ? 'Editar Transação' :
          type === 'income' ? 'Registrar Receita' : 
          type === 'expense' ? 'Registrar Despesa' : 
          'Transferência entre Contas'
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seletor de Tipo (Desabilitado na edição ou quando travado para manter contexto) */}
          {!editingTransaction && !lockType && (
            <div className="flex p-1 bg-brand-lead/20 rounded-lg">
              <Button
                type="button"
                onClick={() => setType('expense')}
                variant={type === 'expense' ? "primary" : "ghost"}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
                  type === 'expense' 
                    ? 'bg-brand-red text-white shadow-lg' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <ArrowDownCircle size={14} />
                Despesa
              </Button>
              <Button
                type="button"
                onClick={() => setType('income')}
                variant={type === 'income' ? "primary" : "ghost"}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
                  type === 'income' 
                    ? 'bg-brand-green text-brand-graphite shadow-lg' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <ArrowUpCircle size={14} />
                Receita
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setType('transfer');
                  setCategory('Transferência');
                }}
                variant={type === 'transfer' ? "primary" : "ghost"}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
                  type === 'transfer' 
                    ? 'bg-brand-blue text-brand-graphite shadow-lg' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <ArrowRightLeft size={14} />
                Transf.
              </Button>
            </div>
          )}

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

          {type === 'expense' && cardId && (
            <div className="p-4 bg-brand-blue/5 border border-brand-blue/20 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white uppercase tracking-wider">Condição de Pagamento</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => !editingTransaction && setInstallments('1')}
                    variant={installments === '1' ? "primary" : "outline"}
                    disabled={!!editingTransaction}
                    className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                      installments === '1' ? 'bg-brand-blue text-brand-graphite' : 'text-gray-500'
                    } ${!!editingTransaction ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    À Vista
                  </Button>
                  <Button
                    type="button"
                    onClick={() => !editingTransaction && setInstallments('2')}
                    variant={installments !== '1' ? "primary" : "outline"}
                    disabled={!!editingTransaction}
                    className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                      installments !== '1' ? 'bg-brand-blue text-brand-graphite' : 'text-gray-500'
                    } ${!!editingTransaction ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Parcelado
                  </Button>
                </div>
              </div>

              {installments !== '1' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input 
                        label="Número de Parcelas"
                        type="number"
                        min="2"
                        max="72"
                        value={installments}
                        disabled={!!editingTransaction}
                        onChange={(e) => setInstallments(e.target.value)}
                        className="text-center font-mono font-bold"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] uppercase text-gray-500 font-bold mb-2">O valor informado é:</p>
                      <div className="flex gap-1 bg-brand-lead/20 p-1 rounded-md">
                        <button
                          type="button"
                          onClick={() => setInstallmentType('total')}
                          className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded transition-all ${
                            installmentType === 'total' ? 'bg-brand-blue text-brand-graphite' : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          Total
                        </button>
                        <button
                          type="button"
                          onClick={() => setInstallmentType('installment')}
                          className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded transition-all ${
                            installmentType === 'installment' ? 'bg-brand-blue text-brand-graphite' : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          Parcela
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-brand-lead/30 rounded-md border border-brand-lead/50">
                    <div className="text-left">
                      <p className="text-[9px] uppercase text-gray-500 font-bold mb-1">Valor Total</p>
                      <p className="text-sm font-mono font-bold text-white">
                        {formatCurrency(installmentType === 'total' ? Number(amount) : Number(amount) * (Number(installments) || 1))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase text-gray-500 font-bold mb-1">Valor da Parcela</p>
                      <p className="text-sm font-mono font-bold text-brand-blue">
                        {formatCurrency(installmentType === 'installment' ? Number(amount) : Number(amount) / (Number(installments) || 1))}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status (Apenas se não for cartão) */}
          {!cardId && status !== 'reconciled' && (
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white uppercase tracking-wider">Status da Transação</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                  {status === 'confirmed' ? 'Confirmada (Afeta o saldo atual)' : 'Pendente (Projeção futura)'}
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setStatus(status === 'confirmed' ? 'pending' : 'confirmed')}
                variant="outline"
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                  status === 'confirmed' 
                    ? 'bg-brand-green/20 text-brand-green border border-brand-green/30' 
                    : 'bg-brand-orange/20 text-brand-orange border border-brand-orange/30'
                }`}
              >
                {status === 'confirmed' ? 'Confirmada' : 'Pendente'}
              </Button>
            </div>
          )}
          {!cardId && status === 'reconciled' && (
            <div className="flex items-center justify-between p-4 bg-brand-green/10 border border-brand-green/30 rounded-lg">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-brand-green uppercase tracking-wider">Status da Transação</p>
                <p className="text-[10px] text-brand-green/70 uppercase tracking-widest flex items-center gap-1">
                  <Check size={12} /> Conciliada (Auditada)
                </p>
              </div>
            </div>
          )}

          {/* Campos de Formulário */}
          <div className="space-y-4">
            <Input 
              label="Descrição"
              icon={<FileText size={12} />}
              type="text" 
              required
              placeholder={type === 'transfer' ? 'Ex: Transferência para reserva...' : 'Ex: Aluguel, Salário, Mercado...'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              {type !== 'transfer' ? (
                <Select 
                  label="Categoria"
                  icon={<Tag size={12} />}
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="" disabled className="bg-brand-gray-deep">Selecionar...</option>
                  {categories.filter(c => c.type === type).map(c => (
                    <option key={c.id} value={c.name} className="bg-brand-gray-deep">{c.name}</option>
                  ))}
                  {category && !categories.some(c => c.name === category) && category !== 'Aporte em Meta' && category !== 'Resgate de Meta' && (
                    <option value={category} className="bg-brand-gray-deep">{category} (Excluída)</option>
                  )}
                  {(prefilledGoal || category === 'Aporte em Meta') && type === 'expense' && <option value="Aporte em Meta" className="bg-brand-gray-deep">Aporte em Meta</option>}
                  {(prefilledGoal || category === 'Resgate de Meta') && type === 'income' && <option value="Resgate de Meta" className="bg-brand-gray-deep">Resgate de Meta</option>}
                  {cardId && type === 'expense' && <option value="Pagamento de Fatura" className="bg-brand-gray-deep">Pagamento de Fatura</option>}
                </Select>
              ) : (
                <Select 
                  label="Conta Destino"
                  icon={<Wallet size={12} />}
                  required
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                >
                  <option value="" disabled className="bg-brand-gray-deep">Selecionar...</option>
                  {accounts.filter(acc => acc.id?.toString() !== accountId).map(acc => (
                    <option key={acc.id} value={acc.id} className="bg-brand-gray-deep">
                      {acc.name} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
                </Select>
              )}

              <Select 
                label={type === 'transfer' ? 'Conta Origem' : 'Conta'}
                icon={<Wallet size={12} />}
                required={!cardId}
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                <option value="" disabled className="bg-brand-gray-deep">Selecionar...</option>
                {accounts.filter(acc => acc.id?.toString() !== destinationAccountId).map(acc => (
                  <option key={acc.id} value={acc.id} className="bg-brand-gray-deep">
                    {acc.name} ({formatCurrency(acc.balance)})
                  </option>
                ))}
              </Select>
            </div>

            {type === 'expense' && (
              <Select 
                label="Cartão de Crédito (Opcional)"
                icon={<CreditCard size={12} />}
                value={cardId}
                onChange={(e) => {
                  setCardId(e.target.value);
                  if (e.target.value) {
                    const card = cards.find(c => c.id?.toString() === e.target.value);
                    if (card) setAccountId(card.account_id?.toString() || '');
                  }
                }}
              >
                <option value="" className="bg-brand-gray-deep">Nenhum (Débito na Conta)</option>
                {cards.map(card => (
                  <option key={card.id} value={card.id} className="bg-brand-gray-deep">
                    {card.name} ({card.brand})
                  </option>
                ))}
              </Select>
            )}

            {(type === 'expense' || type === 'income') && (
              <Select 
                label="Meta (Opcional)"
                icon={<Tag size={12} />}
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
              >
                <option value="" className="bg-brand-gray-deep">Nenhuma</option>
                {goals.map(goal => (
                  <option key={goal.id} value={goal.id} className="bg-brand-gray-deep">
                    {goal.name}
                  </option>
                ))}
              </Select>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Data da Operação"
                icon={<Calendar size={12} />}
                type="date" 
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />

              <Select 
                label="Recorrência"
                icon={<Clock size={12} />}
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as any)}
              >
                <option value="none" className="bg-brand-gray-deep">Nenhuma</option>
                <option value="weekly" className="bg-brand-gray-deep">Semanal</option>
                <option value="monthly" className="bg-brand-gray-deep">Mensal</option>
                <option value="yearly" className="bg-brand-gray-deep">Anual</option>
              </Select>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3">
            {editingTransaction && !String(editingTransaction.id).startsWith('projected-') && (
              <Button 
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                variant="danger"
                className="flex-1 py-4 rounded-lg flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-widest bg-brand-red/10 text-brand-red border border-brand-red/30 hover:bg-brand-red/20 transition-all"
              >
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : 'Excluir'}
              </Button>
            )}
            <Button 
              type="submit"
              disabled={isSubmitting}
              variant={type === 'income' ? 'primary' : type === 'transfer' ? 'primary' : 'danger'}
              className={`flex-[2] py-4 rounded-lg flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                type === 'income' 
                  ? 'bg-brand-green text-brand-graphite hover:bg-brand-green/80 shadow-brand-green/20' 
                  : type === 'transfer'
                  ? 'bg-brand-blue text-brand-graphite hover:bg-brand-blue/80 shadow-brand-blue/20'
                  : 'bg-brand-red text-white hover:bg-brand-red/80 shadow-brand-red/20'
              }`}
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {isSubmitting ? 'Processando...' : editingTransaction ? 'Salvar Alterações' : 'Confirmar Operação'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Excluir Transação"
        message="Tem certeza que deseja excluir esta transação? O saldo da conta será revertido automaticamente."
        confirmText="Sim, Excluir"
        cancelText="Manter Registro"
      />
    </>
  );
};

export default TransactionModal;
