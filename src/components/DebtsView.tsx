import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Landmark, Calculator, Loader2, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import Modal from './Modal';

const DebtsView: React.FC = () => {
  const { debts, simulatePayoff, isLoading } = useFinance();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [extraMonthly, setExtraMonthly] = useState<string>('0');
  const [strategy, setStrategy] = useState<'snowball' | 'avalanche'>('snowball');

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const result = await simulatePayoff(Number(extraMonthly), strategy);
      setSimulationResult(result);
    } catch (error) {
      console.error('Erro na simulação:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark size={24} className="text-brand-red" />
          <h1 className="text-xl font-bold text-white uppercase tracking-widest">Gestão de Dívidas</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Suas Dívidas</h2>
          <div className="grid gap-4">
            {isLoading ? (
              <div className="py-10 text-center">
                <Loader2 size={24} className="text-brand-red animate-spin mx-auto" />
              </div>
            ) : debts && debts.length > 0 ? (
              debts.map((debt: any) => (
                <article key={debt.id} className="glass-panel technical-border p-5 rounded-lg flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-bold text-white">{debt.name}</h3>
                      <Badge variant="neutral">{debt.payment_method}</Badge>
                      <Badge variant={debt.status === 'active' ? 'danger' : 'success'}>{debt.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">Início: {formatDate(debt.start_date)} • Prazo: {debt.total_months} meses</p>
                    <p className="text-xs text-gray-500">Taxa: {(debt.monthly_rate * 100).toFixed(2)}% a.m.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Principal</p>
                    <p className="text-lg font-mono font-bold text-brand-red">{formatCurrency(debt.principal)}</p>
                  </div>
                </article>
              ))
            ) : (
              <div className="py-12 text-center glass-panel technical-border rounded-lg">
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Nenhuma dívida encontrada</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Simulador de Quitação</h2>
          <div className="glass-panel technical-border p-6 rounded-lg space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Aporte Extra Mensal (R$)</label>
              <input
                type="number"
                value={extraMonthly}
                onChange={(e) => setExtraMonthly(e.target.value)}
                className="w-full bg-brand-graphite border border-brand-lead/50 rounded-lg p-3 text-white focus:border-brand-blue outline-none"
                placeholder="Ex: 500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Estratégia</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as 'snowball' | 'avalanche')}
                className="w-full bg-brand-graphite border border-brand-lead/50 rounded-lg p-3 text-white focus:border-brand-blue outline-none"
              >
                <option value="snowball">Bola de Neve (Menor Saldo Primeiro)</option>
                <option value="avalanche">Avalanche (Maior Taxa Primeiro)</option>
              </select>
            </div>
            <Button 
              onClick={handleSimulate} 
              disabled={isSimulating || !debts || debts.length === 0}
              className="w-full"
            >
              {isSimulating ? <Loader2 size={16} className="animate-spin mr-2" /> : <Calculator size={16} className="mr-2" />}
              Simular Cenário
            </Button>

            {simulationResult && (
              <div className="mt-6 pt-6 border-t border-brand-lead/30 space-y-4">
                <h3 className="text-xs font-bold text-brand-blue uppercase tracking-widest">Resultado da Simulação</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Meses até Quitação</p>
                    <p className="text-lg font-mono font-bold text-white">{simulationResult.totalMonthsToPayoff}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Juros Totais</p>
                    <p className="text-lg font-mono font-bold text-brand-red">{formatCurrency(simulationResult.totalInterestPaid)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Ordem de Pagamento</p>
                  {simulationResult.payoffOrder.map((debt: any, index: number) => (
                    <div key={debt.id} className="flex items-center gap-2 text-xs text-gray-300">
                      <span className="text-brand-blue">{index + 1}.</span>
                      <span>{debt.name}</span>
                      <ArrowRight size={12} className="text-gray-600" />
                      <span className="font-mono">{debt.monthsToPayoff} meses</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebtsView;
