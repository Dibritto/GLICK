import React from 'react';
import { 
  TrendingUp, 
  Plus, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  Globe,
  Lock,
  Zap,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

const InvestmentsView: React.FC = () => {
  // Simulação de estado de módulo não instalado
  const isInstalled = false;

  if (!isInstalled) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 min-h-[600px]">
        <div className="relative">
          <div className="w-24 h-24 bg-brand-orange/10 rounded-full flex items-center justify-center text-brand-orange animate-pulse">
            <Lock size={48} />
          </div>
          <div className="absolute -top-2 -right-2 p-2 bg-brand-orange text-white rounded-lg shadow-lg">
            <Zap size={16} />
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          <h2 className="text-3xl font-bold text-white uppercase italic font-serif tracking-tighter">Módulo de Investimentos</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Desbloqueie o console de custódia avançada. Acompanhe sua carteira de ações, FIIs, Cripto e Renda Fixa com telemetria em tempo real e análise de risco.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
          {[
            { label: 'Cotações Real-time', desc: 'B3 e Mercado Global' },
            { label: 'Análise de Risco', desc: 'VaR e Volatilidade' },
            { label: 'IR Automático', desc: 'Relatórios de custódia' },
          ].map((feat, i) => (
            <div key={i} className="glass-panel technical-border p-4 rounded-xl text-left space-y-1">
              <p className="text-[10px] font-bold text-brand-orange uppercase tracking-widest">{feat.label}</p>
              <p className="text-[10px] text-gray-500">{feat.desc}</p>
            </div>
          ))}
        </div>

        <button className="px-8 py-3 bg-brand-orange text-white font-bold rounded-xl hover:bg-brand-orange/80 transition-all uppercase text-xs tracking-[0.2em] shadow-[0_0_30px_rgba(242,125,38,0.3)] flex items-center gap-3">
          Ativar Módulo no Marketplace
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Cabeçalho */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tighter text-white uppercase italic font-serif">
            Custódia de Ativos
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
            Gestão de portfólio multi-mercado e análise de performance
          </p>
        </div>

        <button className="flex items-center gap-2 px-6 py-2.5 bg-brand-orange text-white rounded-xl hover:bg-brand-orange/80 transition-all text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(242,125,38,0.2)]">
          <Plus size={16} />
          Novo Ativo
        </button>
      </header>

      {/* Resumo da Carteira */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel technical-border p-6 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Patrimônio Investido</p>
          <p className="text-3xl font-mono font-bold text-white tracking-tighter">R$ 45.200,00</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-brand-green">
            <ArrowUpRight size={12} />
            <span>+R$ 1.250,50 (Este mês)</span>
          </div>
        </div>

        <div className="glass-panel technical-border p-6 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Rentabilidade Total</p>
          <p className="text-3xl font-mono font-bold text-brand-green tracking-tighter">+12,45%</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500">
            <Globe size={12} />
            <span>Benchmark: CDI (10,5%)</span>
          </div>
        </div>

        <div className="glass-panel technical-border p-6 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Proventos Recebidos</p>
          <p className="text-3xl font-mono font-bold text-brand-blue tracking-tighter">R$ 320,00</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-brand-blue">
            <Zap size={12} />
            <span>Dividend Yield: 0,8%</span>
          </div>
        </div>
      </section>

      {/* Lista de Ativos */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Principais Posições</h3>
          <button className="text-[10px] uppercase font-bold text-brand-orange hover:underline">Ver Carteira Completa</button>
        </div>

        <div className="glass-panel technical-border rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-lead/10 border-b border-brand-lead/20">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Ativo</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Preço Médio</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Cotação</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-lead/10">
              {[
                { ticker: 'IVVB11', name: 'S&P 500 ETF', avg: 'R$ 245,00', price: 'R$ 289,50', res: '+18,1%', type: 'in' },
                { ticker: 'HGLG11', name: 'FII Logística', avg: 'R$ 158,00', price: 'R$ 162,20', res: '+2,6%', type: 'in' },
                { ticker: 'BTC', name: 'Bitcoin', avg: 'R$ 210k', price: 'R$ 340k', res: '+61,9%', type: 'in' },
                { ticker: 'VALE3', name: 'Vale S.A.', avg: 'R$ 72,00', price: 'R$ 68,40', res: '-5,0%', type: 'out' },
              ].map((asset, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-gray-deep flex items-center justify-center text-[10px] font-bold text-white border border-white/5">
                        {asset.ticker.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{asset.ticker}</p>
                        <p className="text-[9px] text-gray-500 uppercase">{asset.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-400">{asset.avg}</td>
                  <td className="px-6 py-4 text-xs font-mono text-white">{asset.price}</td>
                  <td className={`px-6 py-4 text-xs font-mono font-bold text-right ${asset.type === 'in' ? 'text-brand-green' : 'text-brand-red'}`}>
                    {asset.res}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default InvestmentsView;
