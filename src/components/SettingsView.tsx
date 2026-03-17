import React from 'react';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Smartphone, 
  Globe,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

const SettingsView: React.FC = () => {
  const { user, logout } = useAuth();

  const sections = [
    {
      title: 'Perfil & Conta',
      items: [
        { icon: User, label: 'Informações Pessoais', desc: 'Nome, e-mail e foto de perfil' },
        { icon: Shield, label: 'Segurança', desc: 'Alterar senha e autenticação em dois fatores' },
      ]
    },
    {
      title: 'Preferências',
      items: [
        { icon: Bell, label: 'Notificações', desc: 'Alertas de gastos e lembretes de faturas' },
        { icon: Globe, label: 'Idioma & Região', desc: 'Português (Brasil), BRL (R$)' },
        { icon: Smartphone, label: 'Dispositivos', desc: 'Sessões ativas e dispositivos conectados' },
      ]
    },
    {
      title: 'Dados & Sistema',
      items: [
        { icon: Database, label: 'Exportar Dados', desc: 'Download de backup em JSON ou CSV' },
        { icon: Settings, label: 'Avançado', desc: 'Configurações de API e Webhooks' },
      ]
    }
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-4xl">
      {/* Cabeçalho */}
      <header className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tighter text-white uppercase italic font-serif">
          Configurações do Sistema
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">
          Personalização do cockpit e gestão de segurança
        </p>
      </header>

      {/* Card de Usuário */}
      <div className="glass-panel technical-border p-6 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-blue/20 flex items-center justify-center text-brand-blue text-xl font-bold border border-brand-blue/30">
            {user?.name?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{user?.name}</h3>
            <p className="text-xs text-gray-500">{user?.email}</p>
            <div className="mt-2 inline-flex items-center gap-2 px-2 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[9px] font-bold uppercase tracking-widest">
              Plano Pro Ativo
            </div>
          </div>
        </div>
        <button 
          onClick={logout}
          className="p-3 rounded-xl bg-brand-red/10 text-brand-red hover:bg-brand-red/20 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Seções de Configuração */}
      <div className="space-y-8">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black italic font-serif opacity-70 px-2">
              — {section.title}
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {section.items.map((item, i) => (
                <motion.button
                  whileHover={{ x: 4 }}
                  key={i}
                  className="w-full flex items-center justify-between p-4 rounded-xl glass-panel technical-border hover:bg-white/5 transition-all group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-brand-gray-deep text-gray-400 group-hover:text-brand-blue transition-colors">
                      <item.icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-brand-blue transition-colors">{item.label}</p>
                      <p className="text-[10px] text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé de Versão */}
      <div className="pt-8 text-center">
        <p className="text-[9px] uppercase tracking-[0.3em] text-gray-700 font-bold">
          Glick OS v2.4.0-stable — Build 2026.03.17
        </p>
      </div>
    </div>
  );
};

export default SettingsView;
