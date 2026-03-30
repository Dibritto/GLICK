import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Zap, TrendingUp, Users, Lock, CheckCircle, Clock, LayoutDashboard, Gem } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/formatters';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

const ModuleMarketplace: React.FC = () => {
  const { modules, activateModule } = useFinance();
  const [activating, setActivating] = useState<string | null>(null);

  const handleActivate = async (slug: string) => {
    setActivating(slug);
    try {
      await activateModule(slug, true); // Ativa trial por padrão
      toast.success('Módulo ativado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao ativar módulo');
    } finally {
      setActivating(null);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'TrendingUp': return <TrendingUp size={24} />;
      case 'Zap': return <Zap size={24} />;
      case 'Users': return <Users size={24} />;
      case 'LayoutDashboard': return <LayoutDashboard size={24} />;
      case 'Gem': return <Gem size={24} />;
      default: return <Zap size={24} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-white">Marketplace de Módulos</h2>
        <p className="text-sm text-gray-400">Potencialize seu cockpit financeiro com extensões especializadas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.filter(m => m.slug !== 'core').map((module) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel technical-border p-6 rounded-xl flex flex-col h-full ${
              module.status === 'locked' ? 'opacity-90' : 'border-brand-blue/30'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${
                module.status === 'active' ? 'bg-brand-green/10 text-brand-green' :
                module.status === 'trial' ? 'bg-brand-orange/10 text-brand-orange' :
                'bg-brand-blue/10 text-brand-blue'
              }`}>
                {getIcon(module.icon)}
              </div>
              {module.status === 'active' && (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle size={12} /> Ativo
                </Badge>
              )}
              {module.status === 'trial' && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <Clock size={12} /> Trial
                </Badge>
              )}
              {module.status === 'locked' && (
                <Badge variant="neutral" className="flex items-center gap-1">
                  <Lock size={12} /> Disponível
                </Badge>
              )}
            </div>

            <h3 className="text-lg font-bold text-white mb-2">{module.name}</h3>
            <p className="text-sm text-gray-400 mb-6 flex-grow">{module.description}</p>

            <div className="space-y-4 mt-auto">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Preço Mensal</span>
                <span className="font-mono text-white">
                  {Number(module.price) === 0 ? 'Grátis' : formatCurrency(module.price)}
                </span>
              </div>

              {module.status === 'locked' ? (
                <Button
                  onClick={() => handleActivate(module.slug)}
                  disabled={activating === module.slug}
                  variant="primary"
                  className="w-full py-3 bg-brand-blue text-brand-lead font-bold rounded-lg hover:bg-brand-blue/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {activating === module.slug ? 'Ativando...' : Number(module.price) === 0 ? 'Ativar Módulo' : `Ativar Teste (${module.trial_days} dias)`}
                </Button>
              ) : module.status === 'trial' ? (
                <Button
                  disabled
                  variant="outline"
                  className="w-full py-3 bg-brand-orange/20 text-brand-orange font-bold rounded-lg cursor-not-allowed"
                >
                  Em Período de Teste
                </Button>
              ) : (
                <Button
                  disabled
                  variant="ghost"
                  className="w-full py-3 bg-gray-800 text-gray-500 font-bold rounded-lg cursor-not-allowed"
                >
                  Módulo Instalado
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ModuleMarketplace;
