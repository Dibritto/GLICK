import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Calendar, 
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Zap,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { Card } from '../types';

interface CardsViewProps {
  onAddCard?: () => void;
  onEditCard?: (card: Card) => void;
}

const CardsView: React.FC<CardsViewProps> = ({ onAddCard, onEditCard }) => {
  const { cards, isLoading, derivedData } = useFinance();
  const { totalCardLimit, totalCardUsed } = derivedData;

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Cabeçalho */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tighter text-white uppercase italic font-serif">
            Controle de Cartões
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
            Gestão de crédito, limites e ciclos de fatura
          </p>
        </div>

        <button 
          onClick={onAddCard}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-blue text-brand-graphite rounded-lg hover:bg-brand-blue/80 transition-all text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(44,199,255,0.2)]"
        >
          <Plus size={16} />
          Adicionar Cartão
        </button>
      </header>

      {/* Grid de Cartões */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
            <Loader2 size={32} className="text-brand-blue animate-spin" />
            <p className="text-xs text-gray-500 uppercase tracking-widest">Sincronizando Cartões...</p>
          </div>
        ) : (
          <>
            {cards.map((card, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={card.id}
                className="flex flex-col md:flex-row gap-6"
              >
                {/* Representação Visual do Cartão */}
                <div 
                  onClick={() => onEditCard?.(card)}
                  className="w-full md:w-80 h-48 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl group cursor-pointer"
                  style={{ 
                    background: `linear-gradient(135deg, ${card.color} 0%, #1A1A1D 100%)`,
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl" />
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-white/60 font-bold">{card.account_name}</p>
                      <p className="text-sm font-bold text-white">{card.name}</p>
                    </div>
                    <div className="w-10 h-8 bg-yellow-500/20 rounded-md border border-yellow-500/30 flex items-center justify-center">
                      <div className="w-6 h-4 bg-yellow-500/40 rounded-sm" />
                    </div>
                  </div>

                  <div className="relative z-10">
                    <p className="text-lg font-mono tracking-[0.2em] text-white/90">•••• •••• •••• ****</p>
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

                {/* Informações de Limite e Fatura */}
                <div className="flex-1 space-y-4">
                  <div className="glass-panel technical-border p-5 rounded-lg space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Fatura Atual</p>
                        <p className="text-xl font-mono font-bold text-white">{formatCurrency(card.current_bill || 0)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Limite Disponível</p>
                        <p className="text-sm font-mono font-bold text-brand-blue">{formatCurrency(Number(card.limit) - Number(card.current_bill || 0))}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="h-2 w-full bg-brand-lead/20 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(Number(card.current_bill || 0) / Number(card.limit)) * 100}%` }}
                          className={`h-full ${(Number(card.current_bill || 0) / Number(card.limit)) > 0.8 ? 'bg-brand-red' : 'bg-brand-blue'}`} 
                        />
                      </div>
                      <div className="flex justify-between text-[9px] uppercase font-bold text-gray-600 tracking-widest">
                        <span>0%</span>
                        <span>Utilização: {Math.round((Number(card.current_bill || 0) / Number(card.limit)) * 100)}%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-brand-lead/10 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] text-brand-orange">
                        <AlertCircle size={12} />
                        <span>Fatura em aberto</span>
                      </div>
                      <button 
                        onClick={() => onEditCard?.(card)}
                        className="text-[10px] uppercase font-bold text-brand-blue hover:underline flex items-center gap-1"
                      >
                        Ver Detalhes <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Telemetria de Crédito */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel technical-border p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand-blue/10 text-brand-blue">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Limite Total</p>
            <p className="text-xl font-mono font-bold text-white">{formatCurrency(totalCardLimit)}</p>
          </div>
        </div>

        <div className="glass-panel technical-border p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand-red/10 text-brand-red">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Comprometimento</p>
            <p className="text-xl font-mono font-bold text-white">{formatCurrency(totalCardUsed)}</p>
          </div>
        </div>

        <div className="glass-panel technical-border p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand-orange/10 text-brand-orange">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Melhor Dia de Compra</p>
            <p className="text-xl font-mono font-bold text-white">Dia 08</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CardsView;
