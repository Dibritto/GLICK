import { Account, Transaction, Category, Goal } from './types';

export const MOCK_CATEGORIES: Category[] = [
  { id: '1', nome: 'Alimentação', subcategorias: ['Mercado', 'Restaurante'] },
  { id: '2', nome: 'Transporte', subcategorias: ['Combustível', 'Uber', 'Manutenção'] },
  { id: '3', nome: 'Moradia', subcategorias: ['Aluguel', 'Energia', 'Internet'] },
  { id: '4', nome: 'Lazer', subcategorias: ['Cinema', 'Viagem'] },
  { id: '5', nome: 'Saúde', subcategorias: ['Farmácia', 'Consulta'] },
];

export const MOCK_ACCOUNTS: Account[] = [
  { id: 'acc1', nome: 'Nubank', tipo: 'CONTA_DIGITAL', saldoAtual: 2450.00, instituicao: 'Nubank', cor: '#8A05BE' },
  { id: 'acc2', nome: 'Itaú', tipo: 'CONTA_BANCARIA', saldoAtual: 1200.50, instituicao: 'Itaú', cor: '#EC7000' },
  { id: 'card1', nome: 'Inter Black', tipo: 'CARTAO_CREDITO', saldoAtual: 0, instituicao: 'Inter', cor: '#FF7A00', limiteTotal: 5000, limiteUsado: 1250, dataFechamento: 5, dataVencimento: 12 },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', tipo: 'RECEITA', valor: 5000.00, descricao: 'Salário Mensal', data: '2026-03-05', categoria: 'Renda', contaOrigemId: 'acc1', status: 'CONFIRMADO', recorrente: true, periodicidade: 'MENSAL' },
  { id: 't2', tipo: 'DESPESA', valor: 1200.00, descricao: 'Aluguel', data: '2026-03-10', categoria: 'Moradia', contaOrigemId: 'acc1', status: 'CONFIRMADO', recorrente: true, periodicidade: 'MENSAL' },
  { id: 't3', tipo: 'DESPESA', valor: 150.00, descricao: 'Supermercado', data: '2026-03-12', categoria: 'Alimentação', contaOrigemId: 'acc1', status: 'CONFIRMADO', recorrente: false },
  { id: 't4', tipo: 'DESPESA', valor: 85.50, descricao: 'Posto Shell', data: '2026-03-14', categoria: 'Transporte', contaOrigemId: 'acc2', status: 'PENDENTE', recorrente: false },
];

export const MOCK_GOALS: Goal[] = [
  { id: 'g1', nome: 'Reserva de Emergência', valorObjetivo: 15000, valorAtual: 4500, prazo: '2026-12-31' },
  { id: 'g2', nome: 'Viagem Japão', valorObjetivo: 20000, valorAtual: 2000, prazo: '2027-06-01' },
];
