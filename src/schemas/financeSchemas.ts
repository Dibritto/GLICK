import { z } from 'zod';

export const transactionSchema = z.object({
  account_id: z.number().positive(),
  destination_account_id: z.number().positive().optional(),
  type: z.enum(['income', 'expense', 'transfer', 'installment']),
  category: z.string().min(1),
  amount: z.number().positive('O valor deve ser positivo').optional(), // Opcional para parcelas (usam total_value)
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD)'),
  description: z.string().min(1),
  status: z.enum(['confirmed', 'pending', 'reconciled']).default('confirmed'),
  recurrence: z.enum(['none', 'monthly', 'weekly', 'yearly']).optional().default('none'),
  card_id: z.number().positive().optional().nullable(),
  goal_id: z.number().positive().optional().nullable(),
  total_value: z.number().positive().optional(),
  installments: z.number().int().min(1).max(36).optional()
});

export const accountSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  balance: z.number(),
  initial_balance: z.number().optional().default(0),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida')
});

export const goalSchema = z.object({
  name: z.string().min(1),
  target_amount: z.number().positive(),
  current_amount: z.number().min(0).optional().default(0),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  color: z.string().regex(/^#[0-9A-F]{6}$/i)
});

export const cardSchema = z.object({
  name: z.string().min(1, 'Nome do cartão é obrigatório'),
  account_id: z.number().positive('Selecione uma conta válida'),
  brand: z.string().min(1, 'Bandeira é obrigatória'),
  limit: z.number().min(0, 'O limite deve ser maior ou igual a zero'),
  closing_day: z.number().min(1, 'Dia de fechamento inválido').max(31, 'Dia de fechamento inválido'),
  due_day: z.number().min(1, 'Dia de vencimento inválido').max(31, 'Dia de vencimento inválido'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida'),
  interest_rate: z.number().min(0).max(1).optional().default(0.1200)
});

export const categorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['income', 'expense']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  budget: z.number().min(0).optional().default(0)
});
