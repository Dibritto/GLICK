import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { Plus, Users, Activity, Lock, Zap, ChevronRight, Home, Car, Gem, TrendingUp, Package } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './ui/Button';

interface WealthViewProps {
  isInstalled?: boolean;
  onNavigateToMarketplace?: () => void;
}

const WealthView: React.FC<WealthViewProps> = ({ isInstalled = false, onNavigateToMarketplace }) => {
  const { derivedData } = useFinance();
  const { netWorth } = derivedData;

  if (!isInstalled) {
    return (
      <section 
        className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 min-h-[600px]"
        aria-labelledby="wealth-promo-title"
      >
        <div className="relative" aria-hidden="true">
          <div className="w-24 h-24 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green animate-pulse">
            <Users size={48} />
          </div>
          <div className="absolute -top-2 -right-2 p-2 bg-brand-green text-white rounded-lg shadow-lg">
            <Zap size={16} />
          </div>
        </div>

        <header className="space-y-4 max-w-md">
          <h2 id="wealth-promo-title" className="text-3xl font-bold text-white uppercase italic font-serif tracking-tighter">
            Gestão de Patrimônio
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Desbloqueie a visão consolidada de seu patrimônio líquido. Inclua imóveis, veículos, joias e outros ativos físicos para uma análise completa de sua riqueza.
          </p>
        </header>

        <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl" role="list">
          {[
            { label: 'Ativos Físicos', desc: 'Imóveis e Veículos' },
            { label: 'Patrimônio Líquido', desc: 'Visão Consolidada' },
            { label: 'Análise de Evolução', desc: 'Crescimento Histórico' },
          ].map((feature, idx) => (
            <li key={idx} className="glass-panel p-4 rounded-lg border border-brand-lead/20 text-left" role="listitem">
              <p className="text-brand-green text-xs font-bold mb-1">{feature.label}</p>
              <p className="text-gray-500 text-[10px]">{feature.desc}</p>
            </li>
          ))}
        </ul>

        <Button 
          variant="primary"
          size="lg"
          onClick={onNavigateToMarketplace}
          className="group gap-3 bg-brand-green text-brand-lead font-black rounded-xl shadow-lg shadow-brand-green/20"
          aria-label="Ativar Gestão de Patrimônio no Marketplace"
        >
          ATIVAR NO MARKETPLACE
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-8" aria-labelledby="wealth-title">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 id="wealth-title" className="text-xl font-bold text-white">Gestão de Patrimônio</h2>
          <p className="text-sm text-gray-400">Visão consolidada de seus ativos e patrimônio líquido.</p>
        </div>
      </header>

      <ul className="grid grid-cols-1 md:grid-cols-3 gap-6" role="list">
        <li className="glass-panel technical-border p-6 rounded-xl" role="listitem">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Patrimônio Líquido</p>
          <div className="fluid-value font-mono font-bold text-white" aria-label={`Patrimônio Líquido: ${formatCurrency(netWorth)}`}>
            <span className="currency-symbol" aria-hidden="true">R$</span>
            {formatCurrency(netWorth, false)}
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-brand-green">
            <TrendingUp size={12} aria-hidden="true" />
            <span>Consolidado de todas as contas e ativos</span>
          </div>
        </li>

        <li className="glass-panel technical-border p-6 rounded-xl" role="listitem">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Ativos Físicos</p>
          <div className="fluid-value font-mono font-bold text-white" aria-label={`Ativos Físicos: ${formatCurrency(0)}`}>
            <span className="currency-symbol" aria-hidden="true">R$</span>
            {formatCurrency(0, false)}
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500">
            <Home size={12} aria-hidden="true" />
            <span>Imóveis, Veículos, etc.</span>
          </div>
        </li>

        <li className="glass-panel technical-border p-6 rounded-xl" role="listitem">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Liquidez Imediata</p>
          <div className="fluid-value font-mono font-bold text-white" aria-label={`Liquidez Imediata: ${formatCurrency(netWorth)}`}>
            <span className="currency-symbol" aria-hidden="true">R$</span>
            {formatCurrency(netWorth, false)}
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500">
            <Activity size={12} aria-hidden="true" />
            <span>Disponível em contas correntes</span>
          </div>
        </li>
      </ul>

      <article className="glass-panel technical-border rounded-xl overflow-hidden" aria-labelledby="assets-list-title">
        <header className="p-4 border-b border-brand-lead/10 flex items-center justify-between bg-white/5">
          <h3 id="assets-list-title" className="text-xs font-bold uppercase tracking-widest text-gray-400">Meus Ativos</h3>
        </header>
        <div className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-brand-lead/10 rounded-full flex items-center justify-center text-gray-500 mx-auto" aria-hidden="true">
            <Package size={32} />
          </div>
          <p className="text-sm text-gray-500">Nenhum ativo físico cadastrado ainda.</p>
          <Button 
            variant="primary"
            size="md"
            className="px-6 py-2 bg-brand-green text-brand-lead font-bold rounded-lg text-xs"
            aria-label="Cadastrar primeiro ativo físico"
          >
            Cadastrar Primeiro Ativo
          </Button>
        </div>
      </article>
    </section>
  );
};

export default WealthView;
