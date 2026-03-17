import { Account, Transaction, Category, Goal } from './types';

export const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'Alimentação', type: 'expense', budget: 1200, spent: 450, color: '#FF4B4B', icon: '🍔' },
  { id: 2, name: 'Transporte', type: 'expense', budget: 400, spent: 120, color: '#2CC7FF', icon: '🚗' },
  { id: 3, name: 'Moradia', type: 'expense', budget: 2500, spent: 2500, color: '#F27D26', icon: '🏠' },
  { id: 4, name: 'Lazer', type: 'expense', budget: 500, spent: 200, color: '#00FF9F', icon: '🎬' },
  { id: 5, name: 'Renda', type: 'income', budget: 0, spent: 0, color: '#2ECC71', icon: '💰' },
];

export const MOCK_ACCOUNTS: Account[] = [
  { id: 1, name: 'Nubank', type: 'checking', balance: 2500.50, color: '#8A05BE' },
  { id: 2, name: 'Itaú', type: 'checking', balance: 12000.00, color: '#EC7000' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'income', amount: 5000.00, description: 'Salário Mensal', date: '2026-03-05', category: 'Renda', account_id: 1, status: 'confirmed', recurrence: 'monthly' },
  { id: 't2', type: 'expense', amount: 1200.00, description: 'Aluguel', date: '2026-03-10', category: 'Moradia', account_id: 1, status: 'confirmed', recurrence: 'monthly' },
  { id: 't3', type: 'expense', amount: 150.00, description: 'Supermercado', date: '2026-03-12', category: 'Alimentação', account_id: 1, status: 'confirmed', recurrence: 'none' },
  { id: 't4', type: 'expense', amount: 85.50, description: 'Posto Shell', date: '2026-03-14', category: 'Transporte', account_id: 2, status: 'pending', recurrence: 'none' },
];

export const MOCK_GOALS: Goal[] = [
  { id: 1, name: 'Reserva de Emergência', target_amount: 15000, current_amount: 4500, deadline: '2026-12-31', color: '#00FF9F' },
  { id: 2, name: 'Viagem Japão', target_amount: 20000, current_amount: 2000, deadline: '2027-06-01', color: '#2CC7FF' },
];
