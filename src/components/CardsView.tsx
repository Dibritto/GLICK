import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Calendar, 
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Zap,
  Loader2,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from '../types';

interface CardsViewProps {
  onAddCard?: () => void;
  onEditCard?: (card: Card) => void;
  onOpenCardBills?: (card: Card) => void;
}

const CardsView: React.FC<CardsViewProps> = ({ onAddCard, onEditCard, onOpenCardBills }) => {
  const { isLoading, derivedData } = useFinance();
  const { totalCardLimit, totalCardUsed, cardsWithDynamicBill } = derivedData;
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCards = cardsWithDynamicBill.filter(card => 
    (card.account_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (card.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="p-4 md:p-8 space-y-6" aria-labelledby="cards-view-title">
      {/* Cabeçalho Técnico */}
      <header className="space-y-1">
        <h2 id="cards-view-title" className="text-2xl font-bold tracking-tighter text-white uppercase italic font-serif">
          Controle de Cartões
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
          Gestão de crédito, limites e ciclos de fatura
        </p>
      </header>

      {/* Barra de Ferramentas - Linha 1: Busca e Ações */}
      <div className="flex flex-col md:flex-row gap-4 items-center" role="toolbar" aria-label="Ferramentas de cartões">
        <div className="flex-1 w-full">
          <Input 
            type="text" 
            placeholder="Pesquisar por banco ou nome do cartão..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Pesquisar cartões"
            className="pl-10"
          />
          <Search className="absolute left-3 top-[calc(50%+0.75rem)] md:top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} aria-hidden="true" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button 
            onClick={onAddCard}
            variant="primary"
            size="md"
            className="flex-1 md:flex-none gap-2 text-[10px] font-bold uppercase tracking-[0.2em]"
            aria-label="Adicionar novo cartão"
          >
            <Plus size={14} aria-hidden="true" />
            Adicionar Cartão
          </Button>
        </div>
      </div>

      {/* Grid de Cartões */}
      <div 
        className="grid gap-6" 
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
      >
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4" aria-live="polite">
            <Loader2 size={32} className="text-brand-blue animate-spin" aria-hidden="true" />
            <p className="text-xs text-gray-500 uppercase tracking-widest">Sincronizando Cartões...</p>
          </div>
        ) : (
          <ul className="contents" role="list">
            {filteredCards.map((card, i) => (
              <motion.li 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={card.id}
                role="listitem"
                aria-label={`Cartão ${card.name} do banco ${card.account_name}`}
                className="glass-panel technical-border rounded-2xl overflow-hidden flex flex-col group"
              >
                {/* Visual do Cartão (Topo) */}
                <div 
                  onClick={() => onEditCard?.(card)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Editar detalhes do cartão ${card.name}`}
                  onKeyDown={(e) => e.key === 'Enter' && onEditCard?.(card)}
                  className="w-full h-44 p-6 flex flex-col justify-between relative overflow-hidden cursor-pointer"
                  style={{ 
                    background: `linear-gradient(135deg, ${card.color} 0%, #1A1A1D 100%)`,
                  }}
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl" aria-hidden="true" />
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-white/60 font-bold">{card.account_name}</p>
                      <p className="text-sm font-bold text-white">{card.name}</p>
                    </div>
                    <div className="w-10 h-8 bg-yellow-500/20 rounded-md border border-yellow-500/30 flex items-center justify-center" aria-hidden="true">
                      <div className="w-6 h-4 bg-yellow-500/40 rounded-sm" />
                    </div>
                  </div>

                  <div className="relative z-10">
                    <p className="text-lg font-mono tracking-[0.2em] text-white/90" aria-label="Número do cartão oculto">•••• •••• •••• ••••</p>
                  </div>

                  <div className="flex justify-between items-end relative z-10">
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[8px] uppercase text-white/40">Vencimento</p>
                        <p className="text-xs font-bold text-white">Dia {card.due_day}</p>
                      </div>
                      <div>
                        <p className="text-[8px] uppercase text-white/40">Fechamento</p>
                        <p className="text-xs font-bold text-white">Dia {card.closing_day}</p>
                      </div>
                    </div>
                    <div className="text-white font-bold italic text-xl uppercase tracking-tighter">
                      {card.brand}
                    </div>
                  </div>
                </div>

                {/* Telemetria da Fatura (Base) */}
                <div className="p-4 space-y-3 bg-brand-graphite/50">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-0.5">Fatura Atual</p>
                      <div className="text-lg font-mono font-bold text-white">
                        <span className="text-brand-blue mr-1 text-xs">R$</span>
                        {formatCurrency(card.current_bill || 0, false)}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-0.5">Limite Disponível</p>
                      <div className="text-xs font-mono font-bold text-brand-green flex items-baseline justify-end gap-1">
                        <span className="text-[0.6em] opacity-60">R$</span>
                        {formatCurrency(Number(card.limit) - Number(card.current_bill || 0), false)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div 
                      className="h-1 w-full bg-brand-lead/20 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={Math.round((Number(card.current_bill || 0) / Number(card.limit)) * 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Uso do limite do cartão ${card.name}`}
                    >
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(Number(card.current_bill || 0) / Number(card.limit)) * 100}%` }}
                        className={`h-full ${(Number(card.current_bill || 0) / Number(card.limit)) > 0.8 ? 'bg-brand-red' : 'bg-brand-blue'}`} 
                      />
                    </div>
                    <div className="flex justify-between text-[9px] uppercase font-bold text-gray-600 tracking-widest">
                      <span>Utilização: {Math.round((Number(card.current_bill || 0) / Number(card.limit)) * 100)}%</span>
                      <span>Limite: {formatCurrency(Number(card.limit), false)}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-brand-lead/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[9px] text-brand-orange">
                      <AlertCircle size={10} aria-hidden="true" />
                      <span>Fatura em aberto</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onOpenCardBills?.(card); }}
                        aria-label={`Ver histórico de faturas do cartão ${card.name}`}
                        className="text-[9px] uppercase font-bold text-gray-400 hover:text-white hover:underline flex items-center gap-1"
                      >
                        Histórico
                      </button>
                      <button 
                        onClick={() => onEditCard?.(card)}
                        aria-label={`Ver detalhes da fatura do cartão ${card.name}`}
                        className="text-[9px] uppercase font-bold text-brand-blue hover:underline flex items-center gap-1"
                      >
                        Ver Detalhes <ChevronRight size={10} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      {/* Telemetria de Crédito */}
      <section 
        className="grid gap-6" 
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
        aria-labelledby="credit-telemetry-title"
      >
        <h3 id="credit-telemetry-title" className="sr-only">Telemetria de Crédito</h3>
        <article className="glass-panel technical-border p-6 rounded-2xl flex items-center gap-4 card-container">
          <div className="p-3 rounded-xl bg-brand-blue/10 text-brand-blue" aria-hidden="true">
            <ShieldCheck size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Limite Total</p>
            <div className="fluid-value font-mono font-bold text-white">
              <span className="currency-symbol">R$</span>
              {formatCurrency(totalCardLimit, false)}
            </div>
          </div>
        </article>

        <article className="glass-panel technical-border p-6 rounded-2xl flex items-center gap-4 card-container">
          <div className="p-3 rounded-xl bg-brand-red/10 text-brand-red" aria-hidden="true">
            <CreditCard size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Comprometimento</p>
            <div className="fluid-value font-mono font-bold text-white">
              <span className="currency-symbol">R$</span>
              {formatCurrency(totalCardUsed, false)}
            </div>
          </div>
        </article>

        <article className="glass-panel technical-border p-6 rounded-2xl flex items-center gap-4 card-container">
          <div className="p-3 rounded-xl bg-brand-orange/10 text-brand-orange" aria-hidden="true">
            <Zap size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Melhor Dia de Compra</p>
            <p className="text-xl font-mono font-bold text-white">Dia 08</p>
          </div>
        </article>
      </section>
    </section>
  );
};

export default CardsView;
