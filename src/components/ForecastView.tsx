import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  Activity,
  Zap,
  BarChart3,
  ArrowRight,
  Shield,
  Gauge,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { toast } from 'sonner';

const ForecastView: React.FC = () => {
  const { 
    recurringTransactions, 
    forecasts, 
    accounts, 
    categories,
    createRecurringTransaction,
    deleteRecurringTransaction,
    createForecast,
    deleteForecast,
    derivedData
  } = useFinance();

  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [showAddForecast, setShowAddForecast] = useState(false);

  const [newRecurring, setNewRecurring] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: '',
    account_id: accounts[0]?.id || '',
    frequency: 'monthly',
    next_date: new Date().toISOString().split('T')[0]
  });

  const [newForecast, setNewForecast] = useState({
    description: '',
    amount: '',
    type: 'income',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const handleAddRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRecurringTransaction({
        ...newRecurring,
        amount: Number(newRecurring.amount)
      });
      setShowAddRecurring(false);
      toast.success('Transação recorrente agendada');
    } catch (error) {
      toast.error('Erro ao agendar transação');
    }
  };

  const handleAddForecast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createForecast({
        ...newForecast,
        amount: Number(newForecast.amount)
      });
      setShowAddForecast(false);
      toast.success('Previsão adicionada');
    } catch (error) {
      toast.error('Erro ao adicionar previsão');
    }
  };

  // Projection Data (Next 6 months)
  const projectionData = React.useMemo(() => {
    const data = [];
    let currentBalance = derivedData.totalBalance;
    const now = new Date();

    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthLabel = d.toLocaleString('pt-BR', { month: 'short' });

      // Add recurring
      const monthRecurring = recurringTransactions.reduce((acc, curr) => {
        return curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount);
      }, 0);

      // Add forecasts
      const monthForecasts = forecasts
        .filter(f => f.month === m && f.year === y)
        .reduce((acc, curr) => {
          return curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount);
        }, 0);

      currentBalance += monthRecurring + monthForecasts;

      data.push({
        name: monthLabel,
        balance: currentBalance,
        recurring: monthRecurring,
        forecasts: monthForecasts
      });
    }
    return data;
  }, [derivedData.totalBalance, recurringTransactions, forecasts]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Cabeçalho Técnico */}
      <header className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tighter text-white uppercase italic font-serif">
          Projeções & Recorrências
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
          Telemetria de Fluxo Futuro e Agendamentos
        </p>
      </header>

      {/* Barra de Ferramentas - Linha 1: Busca e Ações */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder="Pesquisar em projeções ou recorrências..."
            className="w-full bg-brand-gray-deep/50 border border-brand-lead/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-brand-blue/50 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={() => setShowAddRecurring(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-blue/5 text-brand-blue border border-brand-blue/30 rounded-xl hover:bg-brand-blue/10 transition-all text-[10px] font-bold uppercase tracking-[0.2em]"
          >
            <Plus size={14} />
            Recorrência
          </button>
          <button 
            onClick={() => setShowAddForecast(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-orange/10 text-brand-orange border border-brand-orange/30 rounded-xl hover:bg-brand-orange/20 transition-all text-[10px] font-bold uppercase tracking-[0.2em]"
          >
            <Plus size={14} />
            Projeção
          </button>
        </div>
      </div>

      {/* Barra de Ferramentas - Linha 2: Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="min-w-[150px]">
          <select
            className="w-full bg-brand-gray-deep/50 border border-brand-lead/30 rounded-xl py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 focus:border-brand-blue/50 focus:outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel technical-border p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-brand-blue/10 text-brand-blue rounded-lg">
              <Gauge size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Velocidade Financeira</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-mono font-bold text-white">{formatCurrency(derivedData.dailyAverageSpend)}/dia</p>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Média de queima diária de capital</p>
          </div>
        </div>

        <div className="glass-panel technical-border p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-brand-green/10 text-brand-green rounded-lg">
              <Shield size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Autonomia Financeira</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-mono font-bold text-white">{derivedData.financialAutonomy} Dias</p>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Resistência do capital livre atual</p>
          </div>
        </div>

        <div className="glass-panel technical-border p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-brand-orange/10 text-brand-orange rounded-lg">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Saldo Projetado</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-mono font-bold text-white">{formatCurrency(derivedData.projectedBalance)}</p>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Estimativa para o fim do ciclo atual</p>
          </div>
        </div>
      </div>

      {/* Projection Chart */}
      <section className="glass-panel technical-border p-6 rounded-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-brand-blue" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Fluxo de Caixa Projetado (6 Meses)</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-blue" />
              <span className="text-[10px] text-gray-500 uppercase font-bold">Saldo Projetado</span>
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2CC7FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2CC7FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3C3C45" vertical={false} />
              <XAxis dataKey="name" stroke="#8E9299" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis 
                stroke="#8E9299" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => formatCurrency(value, false)}
              />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#1A1A1D', border: '1px solid #3C3C45', fontSize: '12px' }}
                formatter={(value: any) => formatCurrency(value)}
              />
              <Area 
                type="monotone" 
                dataKey="balance" 
                stroke="#2CC7FF" 
                fillOpacity={1} 
                fill="url(#colorBalance)" 
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recurring Transactions List */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-brand-blue" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Transações Recorrentes</h2>
          </div>
          <div className="space-y-3">
            {recurringTransactions.length > 0 ? (
              recurringTransactions.map((item) => (
                <div key={item.id} className="glass-panel technical-border p-4 rounded-lg flex items-center justify-between group hover:border-brand-blue/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${item.type === 'income' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-red/10 text-brand-red'}`}>
                      {item.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.description}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-bold">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>{item.frequency}</span>
                        <span>•</span>
                        <span className="text-brand-blue">Próximo: {formatDate(item.next_date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`text-sm font-mono font-bold ${item.type === 'income' ? 'text-brand-green' : 'text-brand-red'}`}>
                      {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                    </p>
                    <button 
                      onClick={() => deleteRecurringTransaction(item.id)}
                      className="p-2 text-gray-600 hover:text-brand-red transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center border-2 border-dashed border-brand-lead/20 rounded-xl opacity-50">
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Nenhuma recorrência agendada</p>
              </div>
            )}
          </div>
        </section>

        {/* Forecasts List */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-brand-orange" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Previsões de Fluxo</h2>
          </div>
          <div className="space-y-3">
            {forecasts.length > 0 ? (
              forecasts.map((item) => (
                <div key={item.id} className="glass-panel technical-border p-4 rounded-lg flex items-center justify-between group hover:border-brand-orange/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${item.type === 'income' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-red/10 text-brand-red'}`}>
                      <Activity size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.description}</p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-bold">
                        <span>{item.month}/{item.year}</span>
                        <span>•</span>
                        <span className="text-brand-orange">Estimado</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`text-sm font-mono font-bold ${item.type === 'income' ? 'text-brand-green' : 'text-brand-red'}`}>
                      {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                    </p>
                    <button 
                      onClick={() => deleteForecast(item.id)}
                      className="p-2 text-gray-600 hover:text-brand-red transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center border-2 border-dashed border-brand-lead/20 rounded-xl opacity-50">
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Nenhuma previsão alocada</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Modals */}
      {showAddRecurring && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-brand-graphite border border-brand-lead/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-brand-lead/20 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white uppercase italic font-serif">Nova Recorrência</h3>
              <button onClick={() => setShowAddRecurring(false)} className="text-gray-500 hover:text-white">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleAddRecurring} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Descrição</label>
                <input 
                  type="text" 
                  required
                  value={newRecurring.description}
                  onChange={e => setNewRecurring({...newRecurring, description: e.target.value})}
                  className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-lg px-4 py-2.5 text-sm text-white focus:border-brand-blue outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Valor</label>
                  <input 
                    type="number" 
                    required
                    value={newRecurring.amount}
                    onChange={e => setNewRecurring({...newRecurring, amount: e.target.value})}
                    className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-lg px-4 py-2.5 text-sm text-white focus:border-brand-blue outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Tipo</label>
                  <select 
                    value={newRecurring.type}
                    onChange={e => setNewRecurring({...newRecurring, type: e.target.value})}
                    className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-lg px-4 py-2.5 text-sm text-white focus:border-brand-blue outline-none"
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Frequência</label>
                  <select 
                    value={newRecurring.frequency}
                    onChange={e => setNewRecurring({...newRecurring, frequency: e.target.value})}
                    className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-lg px-4 py-2.5 text-sm text-white focus:border-brand-blue outline-none"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Próxima Data</label>
                  <input 
                    type="date" 
                    required
                    value={newRecurring.next_date}
                    onChange={e => setNewRecurring({...newRecurring, next_date: e.target.value})}
                    className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-lg px-4 py-2.5 text-sm text-white focus:border-brand-blue outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Categoria</label>
                <select 
                  required
                  value={newRecurring.category}
                  onChange={e => setNewRecurring({...newRecurring, category: e.target.value})}
                  className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-lg px-4 py-2.5 text-sm text-white focus:border-brand-blue outline-none"
                >
                  <option value="">Selecionar Categoria</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-brand-blue text-brand-graphite font-black uppercase tracking-widest text-xs rounded-xl mt-4 hover:bg-white transition-colors"
              >
                Agendar Recorrência
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {showAddForecast && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-brand-graphite border border-brand-lead/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-brand-lead/20 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white uppercase italic font-serif">Nova Previsão</h3>
              <button onClick={() => setShowAddForecast(false)} className="text-gray-500 hover:text-white">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleAddForecast} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">Descrição</label>
                <input 
                  type="text" 
                  required
                  value={newForecast.description}
                  onChange={e => setNewForecast({...newForecast, description: e.target.value})}
                  className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-lg px-4 py-2.5 text-sm text-white focus:border-brand-blue outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Valor</label>
                  <input 
                    type="number" 
                    required
                    value={newForecast.amount}
                    onChange={e => setNewForecast({...newForecast, amount: e.target.value})}
                    className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-lg px-4 py-2.5 text-sm text-white focus:border-brand-blue outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Tipo</label>
                  <select 
                    value={newForecast.type}
                    onChange={e => setNewForecast({...newForecast, type: e.target.value})}
                    className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-lg px-4 py-2.5 text-sm text-white focus:border-brand-blue outline-none"
                  >
                    <option value="income">Receita</option>
                    <option value="expense">Despesa</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Mês</label>
                  <input 
                    type="number" 
                    min="1" max="12"
                    required
                    value={newForecast.month}
                    onChange={e => setNewForecast({...newForecast, month: Number(e.target.value)})}
                    className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-lg px-4 py-2.5 text-sm text-white focus:border-brand-blue outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Ano</label>
                  <input 
                    type="number" 
                    required
                    value={newForecast.year}
                    onChange={e => setNewForecast({...newForecast, year: Number(e.target.value)})}
                    className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-lg px-4 py-2.5 text-sm text-white focus:border-brand-blue outline-none"
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-brand-orange text-brand-graphite font-black uppercase tracking-widest text-xs rounded-xl mt-4 hover:bg-white transition-colors"
              >
                Adicionar Previsão
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ForecastView;
