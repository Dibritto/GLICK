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
  Loader2,
  Search
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
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { derivedData, isLoading } = useFinance();
  const { 
    chartData: monthlyData, 
    spendingByCategory: categoryData,
    monthlyIncome: totalIncome,
    monthlyExpenses: totalExpense,
    moneyVelocity,
    retentionRate,
    incomeChange,
    expenseChange,
    pendingTransactions,
    financialAutonomy,
    incomeByCategory,
    goalsWithDynamicAmount,
    categoriesWithSpent
  } = derivedData;

  const getInsight = () => {
    if (totalExpense > totalIncome && totalIncome > 0) {
      return {
        title: "Atenção ao Fluxo",
        text: "Suas despesas superaram suas receitas este mês. Revise seus gastos variáveis.",
        type: "warning"
      };
    }
    if (retentionRate > 30) {
      return {
        title: "Excelente Retenção",
        text: "Você está poupando mais de 30% da sua renda. Ótimo trabalho!",
        type: "success"
      };
    }
    if (pendingTransactions.length > 0) {
      return {
        title: "Transações Pendentes",
        text: `Você possui ${pendingTransactions.length} transações aguardando confirmação.`,
        type: "info"
      };
    }
    const lowBudget = categoriesWithSpent.filter(c => c.type === 'expense' && c.budget > 0 && c.spent > c.budget * 0.9);
    if (lowBudget.length > 0) {
      return {
        title: "Orçamento Crítico",
        text: `Você consumiu mais de 90% do orçamento em: ${lowBudget.map(c => c.name).join(', ')}.`,
        type: "warning"
      };
    }
    return {
      title: "Estabilidade",
      text: "Seu fluxo financeiro está equilibrado. Continue monitorando seus aportes.",
      type: "info"
    };
  };

  const insight = getInsight();

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Cabeçalho Técnico */}
      <header className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tighter text-white uppercase italic font-serif">
          Inteligência & Relatórios
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
          Análise profunda de performance financeira e tendências
        </p>
      </header>

      {/* Barra de Ferramentas - Linha 1: Busca e Ações */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder="Pesquisar em relatórios..."
            className="w-full bg-brand-gray-deep/50 border border-brand-lead/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-brand-blue/50 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-blue text-brand-graphite rounded-xl hover:bg-brand-blue/80 transition-all text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(44,199,255,0.4)]">
            <Download size={14} />
            Gerar PDF
          </button>
        </div>
      </div>

      {/* Barra de Ferramentas - Linha 2: Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="min-w-[150px]">
          <select
            className="w-full bg-brand-gray-deep/50 border border-brand-lead/30 rounded-xl py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 focus:border-brand-blue/50 focus:outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="6">Últimos 6 Meses</option>
            <option value="12">Último Ano</option>
            <option value="all">Todo o Período</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-40 flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-brand-blue animate-spin" />
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Processando Telemetria...</p>
        </div>
      ) : (
        <>
          {/* Insights de Inteligência */}
          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel technical-border p-6 rounded-2xl flex items-center gap-6"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              insight.type === 'warning' ? 'bg-brand-red/20 text-brand-red' : 
              insight.type === 'success' ? 'bg-brand-green/20 text-brand-green' : 
              'bg-brand-blue/20 text-brand-blue'
            }`}>
              <Zap size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white">{insight.title}</h4>
              <p className="text-sm text-gray-400">{insight.text}</p>
            </div>
          </motion.section>

          {/* KPIs de Performance */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { 
                label: 'Receita Total', 
                val: formatCurrency(totalIncome), 
                change: `${incomeChange >= 0 ? '+' : ''}${incomeChange.toFixed(1)}%`, 
                icon: TrendingUp, 
                color: incomeChange >= 0 ? 'text-brand-green' : 'text-brand-red' 
              },
              { 
                label: 'Despesa Total', 
                val: formatCurrency(totalExpense), 
                change: `${expenseChange >= 0 ? '+' : ''}${expenseChange.toFixed(1)}%`, 
                icon: TrendingDown, 
                color: expenseChange <= 0 ? 'text-brand-green' : 'text-brand-red' 
              },
              { label: 'Autonomia Financeira', val: `${financialAutonomy} dias`, change: 'Sobrevivência', icon: Zap, color: 'text-brand-blue' },
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
                {isMounted && (
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
                )}
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
                  {isMounted && (
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
                  )}
                </div>
                <div className="space-y-3 max-h-full overflow-y-auto pr-2">
                  {categoryData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-gray-400">{item.name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-white">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                  {categoryData.length === 0 && (
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest text-center py-10">Sem dados de gastos</p>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Distribuição de Receitas */}
            <section className="glass-panel technical-border p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PieChart className="text-brand-green" size={20} />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Distribuição de Receitas</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[200px] items-center">
                <div className="h-full">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={incomeByCategory}
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {incomeByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="space-y-2 max-h-full overflow-y-auto pr-2">
                  {incomeByCategory.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-gray-400">{item.name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-white">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Progresso de Metas */}
            <section className="glass-panel technical-border p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-3">
                <Zap className="text-brand-orange" size={20} />
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Progresso de Metas</h3>
              </div>
              <div className="space-y-4">
                {goalsWithDynamicAmount.map((goal, i) => {
                  const progress = Math.min(100, (Number(goal.current_amount) / Number(goal.target_amount)) * 100);
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                        <span className="text-white">{goal.name}</span>
                        <span className="text-gray-400">{formatPercent(progress / 100)}</span>
                      </div>
                      <div className="h-1.5 w-full bg-brand-lead/20 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-brand-orange"
                        />
                      </div>
                    </div>
                  );
                })}
                {goalsWithDynamicAmount.length === 0 && (
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest text-center py-10">Sem metas ativas</p>
                )}
              </div>
            </section>
          </div>

          {/* Orçamento vs Realizado */}
          <section className="glass-panel technical-border p-6 rounded-2xl space-y-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-brand-blue" size={20} />
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Orçamento vs Realizado (Mês Atual)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-brand-lead/20">
                    <th className="pb-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Categoria</th>
                    <th className="pb-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Orçado</th>
                    <th className="pb-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Gasto</th>
                    <th className="pb-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-lead/10">
                  {categoriesWithSpent.filter(c => c.type === 'expense' && c.budget > 0).map((cat, i) => {
                    const percent = (cat.spent / cat.budget) * 100;
                    return (
                      <tr key={i} className="group hover:bg-white/5 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span className="text-xs text-white">{cat.name}</span>
                          </div>
                        </td>
                        <td className="py-4 text-xs font-mono text-gray-400">{formatCurrency(cat.budget)}</td>
                        <td className="py-4 text-xs font-mono text-white">{formatCurrency(cat.spent)}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 max-w-[100px] bg-brand-lead/20 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${percent > 100 ? 'bg-brand-red' : percent > 80 ? 'bg-brand-orange' : 'bg-brand-green'}`}
                                style={{ width: `${Math.min(100, percent)}%` }}
                              />
                            </div>
                            <span className={`text-[10px] font-bold ${percent > 100 ? 'text-brand-red' : 'text-gray-500'}`}>
                              {percent.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Performance Mensal */}
          <section className="glass-panel technical-border p-8 rounded-2xl space-y-6">
            <div className="flex items-center gap-3">
              <Activity className="text-brand-blue" size={20} />
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Performance Mensal (Resultado)</h3>
            </div>
            <div className="h-[250px]">
              {isMounted && (
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
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default ReportsView;
