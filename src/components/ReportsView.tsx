import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  PieChart,
  Activity,
  Zap,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatPercent } from '../utils/formatters';

const ReportsView: React.FC = () => {
  const { derivedData, isLoading } = useFinance();
  const { 
    chartData: monthlyData, 
    spendingByCategory: categoryData,
    monthlyIncome: totalIncome,
    monthlyExpenses: totalExpense,
    moneyVelocity,
    retentionRate
  } = derivedData;

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Cabeçalho */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tighter text-white uppercase italic font-serif">
            Inteligência & Relatórios
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
            Análise profunda de performance financeira e tendências
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-brand-gray-deep/50 border border-brand-lead/30 rounded-xl text-xs font-bold text-gray-400">
            <Calendar size={14} />
            Últimos 6 Meses
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-brand-graphite rounded-xl hover:bg-brand-blue/80 transition-all text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(44,199,255,0.2)]">
            <Download size={14} />
            Gerar PDF
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="py-40 flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-brand-blue animate-spin" />
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Processando Telemetria...</p>
        </div>
      ) : (
        <>
          {/* KPIs de Performance */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Receita Total', val: formatCurrency(totalIncome), change: '+12%', icon: TrendingUp, color: 'text-brand-green' },
              { label: 'Despesa Total', val: formatCurrency(totalExpense), change: '+5%', icon: TrendingDown, color: 'text-brand-red' },
              { label: 'Velocidade do Dinheiro', val: moneyVelocity, change: 'Fluxo de Saída', icon: Zap, color: 'text-brand-blue' },
              { label: 'Taxa de Retenção', val: formatPercent(retentionRate), change: 'Capital Preservado', icon: Activity, color: 'text-brand-orange' },
            ].map((kpi, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={i} 
                className="glass-panel technical-border p-5 rounded-2xl"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">{kpi.label}</p>
                  <kpi.icon size={16} className={kpi.color} />
                </div>
                <p className="text-2xl font-mono font-bold text-white tracking-tighter">{kpi.val}</p>
                <p className={`text-[10px] font-bold mt-2 ${kpi.color}`}>{kpi.change} vs período anterior</p>
              </motion.div>
            ))}
          </section>

          {/* Gráficos Principais */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Comparativo Receitas x Despesas */}
            <section className="glass-panel technical-border p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="text-brand-blue" size={20} />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Receitas vs Despesas</h3>
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3C3C45" vertical={false} />
                    <XAxis dataKey="month" stroke="#8E9299" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#8E9299" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v, false)} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#1A1A1D', border: '1px solid #3C3C45', fontSize: '12px' }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Bar dataKey="receitas" fill="#00FF9F" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesas" fill="#FF4B4B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Composição de Gastos */}
            <section className="glass-panel technical-border p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PieChart className="text-brand-orange" size={20} />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Composição de Gastos</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[300px] items-center">
                <div className="h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={categoryData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 max-h-full overflow-y-auto pr-2">
                  {categoryData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-gray-400">{item.name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-white">R$ {Number(item.value).toLocaleString('pt-BR')}</span>
                    </div>
                  ))}
                  {categoryData.length === 0 && (
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest text-center py-10">Sem dados de gastos</p>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Tendência de Patrimônio */}
          <section className="glass-panel technical-border p-8 rounded-2xl space-y-6">
            <div className="flex items-center gap-3">
              <Activity className="text-brand-blue" size={20} />
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Evolução Patrimonial</h3>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3C3C45" vertical={false} />
                  <XAxis dataKey="month" stroke="#8E9299" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8E9299" fontSize={10} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1A1A1D', border: '1px solid #3C3C45', fontSize: '12px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={(d) => d.receitas - d.despesas} 
                    name="Lucro Mensal"
                    stroke="#2CC7FF" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#2CC7FF', strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default ReportsView;
