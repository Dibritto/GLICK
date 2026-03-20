import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { Plus, Users, Activity, Lock, Zap, ChevronRight, Home, Car, Gem, TrendingUp, Package } from 'lucide-react';
import { motion } from 'framer-motion';

interface WealthViewProps {
  isInstalled?: boolean;
  onNavigateToMarketplace?: () => void;
}

const WealthView: React.FC<WealthViewProps> = ({ isInstalled = false, onNavigateToMarketplace }) => {
  const { derivedData } = useFinance();
  const { netWorth } = derivedData;

  if (!isInstalled) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 min-h-[600px]">
        <div className="relative">
          <div className="w-24 h-24 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green animate-pulse">
            <Users size={48} />
          </div>
          <div className="absolute -top-2 -right-2 p-2 bg-brand-green text-white rounded-lg shadow-lg">
            <Zap size={16} />
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          <h2 className="text-3xl font-bold text-white uppercase italic font-serif tracking-tighter">Gestão de Patrimônio</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Desbloqueie a visão consolidada de seu patrimônio líquido. Inclua imóveis, veículos, joias e outros ativos físicos para uma análise completa de sua riqueza.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
          {[
            { label: 'Ativos Físicos', desc: 'Imóveis e Veículos' },
            { label: 'Patrimônio Líquido', desc: 'Visão Consolidada' },
            { label: 'Análise de Evolução', desc: 'Crescimento Histórico' },
          ].map((feature, idx) => (
            <div key={idx} className="glass-panel p-4 rounded-lg border border-brand-lead/20 text-left">
              <p className="text-brand-green text-xs font-bold mb-1">{feature.label}</p>
              <p className="text-gray-500 text-[10px]">{feature.desc}</p>
            </div>
          ))}
        </div>

        <button 
          onClick={onNavigateToMarketplace}
          className="group flex items-center gap-3 px-8 py-4 bg-brand-green text-brand-lead font-black rounded-xl hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/20"
        >
          ATIVAR NO MARKETPLACE
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-white">Gestão de Patrimônio</h2>
          <p className="text-sm text-gray-400">Visão consolidada de seus ativos e patrimônio líquido.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-green/10 text-brand-green border border-brand-green/20 rounded-lg text-xs font-bold hover:bg-brand-green/20 transition-colors">
          <Plus size={14} /> Adicionar Ativo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel technical-border p-6 rounded-xl">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Patrimônio Líquido</p>
          <p className="text-3xl font-mono font-bold text-white">{formatCurrency(netWorth)}</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-brand-green">
            <TrendingUp size={12} />
            <span>Consolidado de todas as contas e ativos</span>
          </div>
        </div>

        <div className="glass-panel technical-border p-6 rounded-xl">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Ativos Físicos</p>
          <p className="text-3xl font-mono font-bold text-white">{formatCurrency(0)}</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500">
            <Home size={12} />
            <span>Imóveis, Veículos, etc.</span>
          </div>
        </div>

        <div className="glass-panel technical-border p-6 rounded-xl">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Liquidez Imediata</p>
          <p className="text-3xl font-mono font-bold text-white">{formatCurrency(netWorth)}</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500">
            <Activity size={12} />
            <span>Disponível em contas correntes</span>
          </div>
        </div>
      </div>

      <div className="glass-panel technical-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-brand-lead/10 flex items-center justify-between bg-white/5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Meus Ativos</h3>
        </div>
        <div className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-brand-lead/10 rounded-full flex items-center justify-center text-gray-500 mx-auto">
            <Package size={32} />
          </div>
          <p className="text-sm text-gray-500">Nenhum ativo físico cadastrado ainda.</p>
          <button className="px-6 py-2 bg-brand-green text-brand-lead font-bold rounded-lg text-xs">
            Cadastrar Primeiro Ativo
          </button>
        </div>
      </div>
    </div>
  );
};

export default WealthView;
