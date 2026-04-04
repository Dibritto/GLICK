import { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';

export interface Alert {
  id: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
}

export const useAlerts = () => {
  const { accounts, transactions, derivedData } = useFinance();

  const alerts = useMemo(() => {
    const newAlerts: Alert[] = [];

    // 1. Regra: Saldo Negativo
    const totalBalance = accounts.reduce((acc, accnt) => acc + Number(accnt.balance), 0);
    if (totalBalance < 0) {
      newAlerts.push({
        id: 'negative-balance',
        type: 'CRITICAL',
        title: 'Saldo Negativo',
        message: `Seu saldo global está negativo: ${totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      });
    }

    // 2. Regra: Orçamento (exemplo simples: se houver transações pendentes antigas)
    const pendingTransactions = transactions.filter(t => t.status === 'pending');
    if (pendingTransactions.length > 5) {
      newAlerts.push({
        id: 'pending-txs',
        type: 'WARNING',
        title: 'Muitas Transações Pendentes',
        message: `Você tem ${pendingTransactions.length} transações aguardando reconciliação.`
      });
    }

    return newAlerts;
  }, [accounts, transactions]);

  return alerts;
};
