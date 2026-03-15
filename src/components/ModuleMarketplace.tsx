import React, { useState, useEffect } from 'react';
import { Package, CheckCircle2, Clock, CreditCard, Play } from 'lucide-react';
import { motion } from 'motion/react';

interface Module {
  id: number;
  slug: string;
  name: string;
  description: string;
  price: number;
  trial_days: number;
}

const ModuleMarketplace: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/modules')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setModules(data);
        } else {
          console.warn('API de módulos não retornou um array:', data);
          setModules([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao buscar módulos:', err);
        setLoading(false);
      });
  }, []);

  const handleInstall = async (moduleId: number) => {
    const response = await fetch('/api/user/modules/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module_id: moduleId })
    });
    
    if (response.ok) {
      alert('Módulo instalado com sucesso! Reiniciando telemetria...');
      window.location.reload();
    }
  };

  if (loading) return <div className="p-8 text-gray-400 font-mono">Carregando catálogo...</div>;

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tighter text-white flex items-center gap-3">
          <Package className="text-brand-blue" />
          Marketplace de Módulos
        </h2>
        <p className="text-gray-400 text-sm mt-1">Expanda as capacidades do seu cockpit financeiro.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => (
          <motion.div 
            key={mod.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand-gray-deep border border-brand-lead/30 rounded-xl overflow-hidden flex flex-col"
          >
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-brand-blue/10 rounded-lg">
                  <Package size={24} className="text-brand-blue" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-brand-blue/20 text-brand-blue">
                  Premium
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2">{mod.name}</h3>
              <p className="text-gray-400 text-xs leading-relaxed mb-6">
                {mod.description}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-bold">
                  <Clock size={12} />
                  <span>{mod.trial_days} dias de teste grátis</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-bold">
                  <CreditCard size={12} />
                  <span>R$ {mod.price.toFixed(2)} / mês após o teste</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-black/20 border-t border-brand-lead/20">
              <button 
                onClick={() => handleInstall(mod.id)}
                className="w-full py-2 bg-brand-blue hover:bg-brand-blue/80 text-brand-graphite font-bold text-xs uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Play size={14} fill="currentColor" />
                Iniciar Teste Grátis
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="text-brand-blue shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Como funciona o licenciamento?</h4>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Você pode ativar qualquer módulo premium para teste. Durante o período de degustação, todas as funcionalidades estarão liberadas. 
              Após o término, você poderá optar por assinar o módulo por um valor justo ou ele será desativado automaticamente, sem cobranças surpresa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleMarketplace;
