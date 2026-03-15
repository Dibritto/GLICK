export type TransactionType = 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA';
export type TransactionStatus = 'PENDENTE' | 'CONFIRMADO' | 'RECONCILIADO';
export type AccountType = 'CONTA_BANCARIA' | 'CONTA_DIGITAL' | 'CARTEIRA' | 'CARTAO_CREDITO' | 'INVESTIMENTO';
export type Periodicity = 'MENSAL' | 'SEMANAL' | 'ANUAL' | 'UNICA';

export interface Category {
  id: string;
  nome: string;
  subcategorias?: string[];
  icon?: string;
}

export interface Account {
  id: string;
  nome: string;
  tipo: AccountType;
  saldoAtual: number;
  instituicao: string;
  cor: string;
  limiteTotal?: number; // Para cartões
  limiteUsado?: number; // Para cartões
  dataFechamento?: number; // Dia do mês
  dataVencimento?: number; // Dia do mês
}

export interface Transaction {
  id: string;
  tipo: TransactionType;
  valor: number;
  descricao: string;
  data: string; // ISO Date
  categoria: string;
  contaOrigemId: string;
  contaDestinoId?: string; // Para transferências
  status: TransactionStatus;
  recorrente: boolean;
  periodicidade?: Periodicity;
}

export interface Goal {
  id: string;
  nome: string;
  valorObjetivo: number;
  valorAtual: number;
  prazo: string;
  contaAssociadaId?: string;
}

export interface FinancialSummary {
  saldoTotal: number;
  receitasMes: number;
  despesasMes: number;
  saldoProjetado: number;
  dinheiroLivre: number;
  dinheiroComprometido: number;
  dinheiroReservado: number;
  gastoMedioDiario: number;
  autonomiaDias: number;
}
