import React from 'react';
import { Calendar, Bell, Target, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

const RightPanel: React.FC = () => {
  return (
    <aside className="w-80 flex-shrink-0 border-l border-brand-lead/30 flex flex-col bg-brand-graphite overflow-y-auto no-scrollbar">
      {/* Alertas */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Alertas Críticos</h3>
          <span className="px-1.5 py-0.5 rounded bg-brand-red/20 text-brand-red text-[10px] font-bold">02</span>
        </div>

        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-brand-red/5 border border-brand-red/20 flex gap-3">
            <AlertTriangle size={16} className="text-brand-red flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-brand-red">Fatura Vencendo</p>
              <p className="text-[10px] text-gray-400 mt-1">Cartão Inter Black vence em 2 dias.</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-brand-orange/5 border border-brand-orange/20 flex gap-3">
            <AlertTriangle size={16} className="text-brand-orange flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-brand-orange">Saldo Baixo</p>
              <p className="text-[10px] text-gray-400 mt-1">Conta Itaú abaixo do limite de segurança.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[1px] w-full bg-brand-lead/20" />

      {/* Próximos Vencimentos */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Próximos Compromissos</h3>
          <Calendar size={14} className="text-gray-500" />
        </div>

        <div className="space-y-3">
          {[
            { label: 'Aluguel', date: '10 Mar', value: 'R$ 1.200,00', color: 'brand-blue' },
            { label: 'Internet', date: '15 Mar', value: 'R$ 99,90', color: 'brand-orange' },
            { label: 'Energia', date: '18 Mar', value: 'R$ 245,00', color: 'brand-red' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`w-1 h-8 rounded-full bg-${item.color}`} />
                <div>
                  <p className="text-xs font-bold text-gray-200">{item.label}</p>
                  <p className="text-[10px] text-gray-500">{item.date}</p>
                </div>
              </div>
              <p className="text-xs font-mono font-bold text-gray-300">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[1px] w-full bg-brand-lead/20" />

      {/* Metas */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Metas Ativas</h3>
          <Target size={14} className="text-gray-500" />
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-[10px] mb-1.5">
              <span className="text-gray-300 font-bold">Reserva de Emergência</span>
              <span className="text-brand-green">30%</span>
            </div>
            <div className="h-1.5 w-full bg-brand-lead/30 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '30%' }}
                className="h-full bg-brand-green" 
              />
            </div>
            <p className="text-[9px] text-gray-500 mt-1">R$ 4.500 / R$ 15.000</p>
          </div>

          <div>
            <div className="flex justify-between text-[10px] mb-1.5">
              <span className="text-gray-300 font-bold">Viagem Japão</span>
              <span className="text-brand-blue">10%</span>
            </div>
            <div className="h-1.5 w-full bg-brand-lead/30 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '10%' }}
                className="h-full bg-brand-blue" 
              />
            </div>
            <p className="text-[9px] text-gray-500 mt-1">R$ 2.000 / R$ 20.000</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightPanel;
