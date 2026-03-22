import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Smartphone, 
  Globe,
  ChevronRight,
  LogOut,
  Download,
  Trash2,
  X,
  Check,
  Cpu,
  Webhook,
  Zap,
  CreditCard,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { toast } from 'sonner';
import ConfirmationModal from './ConfirmationModal';

const SettingsView: React.FC = () => {
  const { user, logout, updateUser, token } = useAuth();
  const { refreshData, modules, activateModule, deactivateModule } = useFinance();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isManagingModules, setIsManagingModules] = useState(false);
  const [isManagingWebhooks, setIsManagingWebhooks] = useState(false);
  const [isManagingBanks, setIsManagingBanks] = useState(false);
  const [isManagingNotifications, setIsManagingNotifications] = useState(false);
  const [isManagingLanguage, setIsManagingLanguage] = useState(false);
  const [isManagingDevices, setIsManagingDevices] = useState(false);
  const [isManagingAdvanced, setIsManagingAdvanced] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [editForm, setEditForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [systemHealth, setSystemHealth] = useState<any>(null);

  React.useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setSystemHealth(data);
        }
      } catch (error) {
        console.error('Falha ao buscar telemetria');
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleExport = async () => {
    try {
      const res = await fetch('/api/user/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao exportar dados');
      
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `glick-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Backup exportado com sucesso!');
    } catch (error) {
      toast.error('Falha ao exportar dados');
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/user/reset', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erro ao resetar dados');
      
      await refreshData();
      toast.success('Dados resetados com sucesso!');
    } catch (error) {
      toast.error('Falha ao resetar dados');
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser(editForm);
      setIsEditingProfile(false);
      toast.success('Perfil atualizado!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar perfil');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (res.ok) {
        setIsChangingPassword(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        toast.success('Senha atualizada com sucesso!');
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao atualizar senha');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar senha');
    }
  };

  const handleToggleModule = async (slug: string, currentStatus: string) => {
    try {
      if (currentStatus === 'active' || currentStatus === 'trial') {
        await deactivateModule(slug);
        toast.success('Módulo desativado');
      } else {
        await activateModule(slug, true);
        toast.success('Módulo ativado (Trial)');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar módulo');
    }
  };

  const sections = [
    {
      title: 'Perfil & Conta',
      items: [
        { 
          icon: User, 
          label: 'Informações Pessoais', 
          desc: 'Nome, e-mail e foto de perfil',
          onClick: () => setIsEditingProfile(true)
        },
        { 
          icon: Shield, 
          label: 'Segurança', 
          desc: 'Alterar senha e autenticação em dois fatores',
          onClick: () => setIsChangingPassword(true)
        },
      ]
    },
    {
      title: 'Módulos & Extensões',
      items: [
        { 
          icon: Cpu, 
          label: 'Gestão de Módulos', 
          desc: 'Ativar Cripto, Investimentos e Metas Avançadas',
          onClick: () => setIsManagingModules(true)
        }
      ]
    },
    {
      title: 'Preferências',
      items: [
        { 
          icon: Bell, 
          label: 'Notificações', 
          desc: 'Alertas de gastos e segurança',
          onClick: () => setIsManagingNotifications(true)
        },
        { 
          icon: Globe, 
          label: 'Idioma & Região', 
          desc: 'Moeda e fuso horário',
          onClick: () => setIsManagingLanguage(true)
        },
        { 
          icon: Smartphone, 
          label: 'Dispositivos', 
          desc: 'Gerenciar sessões ativas',
          onClick: () => setIsManagingDevices(true)
        },
      ]
    },
    {
      title: 'Dados & Sistema',
      items: [
        { 
          icon: Database, 
          label: 'Exportar Dados', 
          desc: 'Download de backup em JSON ou CSV',
          onClick: handleExport
        },
        { 
          icon: Trash2, 
          label: 'Resetar Conta', 
          desc: 'Apagar todos os dados financeiros',
          onClick: () => setShowResetConfirm(true),
          danger: true
        },
        { 
          icon: Settings, 
          label: 'Avançado', 
          desc: 'Configurações de API e Telemetria',
          onClick: () => setIsManagingAdvanced(true)
        },
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
      
      {/* Telemetria de Sistema */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Status do Core', value: systemHealth?.status === 'ok' ? 'Operacional' : 'Instável', color: systemHealth?.status === 'ok' ? 'text-emerald-500' : 'text-brand-red' },
          { label: 'Modo Banco', value: systemHealth?.dbMode || 'SQLite (Preview)', color: 'text-brand-blue' },
          { label: 'Último Check', value: systemHealth?.timestamp ? new Date(systemHealth.timestamp).toLocaleTimeString() : 'Aguardando...', color: 'text-gray-400' },
          { label: 'Sessão Expira', value: '6 dias', color: 'text-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="glass-panel technical-border p-3 rounded-xl">
            <p className="text-[8px] uppercase tracking-widest text-gray-500 font-bold mb-1">{stat.label}</p>
            <p className={`text-xs font-mono font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

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
                  onClick={item.onClick}
                  className={`w-full flex items-center justify-between p-4 rounded-xl glass-panel technical-border hover:bg-white/5 transition-all group text-left ${item.danger ? 'hover:border-brand-red/50' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-lg bg-brand-gray-deep transition-colors ${item.danger ? 'text-brand-red' : 'text-gray-400 group-hover:text-brand-blue'}`}>
                      <item.icon size={18} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold transition-colors ${item.danger ? 'text-brand-red' : 'text-white group-hover:text-brand-blue'}`}>{item.label}</p>
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

      {/* Modal de Edição de Perfil */}
      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-panel technical-border rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white uppercase italic font-serif">Editar Perfil</h3>
                <button onClick={() => setIsEditingProfile(false)} className="text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Nome Completo</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-brand-gray-deep border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-blue outline-none transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">E-mail</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-brand-gray-deep border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-blue outline-none transition-colors"
                    required
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-brand-blue text-brand-gray-dark text-sm font-black uppercase tracking-tighter hover:bg-brand-blue-light transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={18} />
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Alteração de Senha */}
      <AnimatePresence>
        {isChangingPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-panel technical-border rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white uppercase italic font-serif">Alterar Senha</h3>
                <button onClick={() => setIsChangingPassword(false)} className="text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Senha Atual</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full bg-brand-gray-deep border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-blue outline-none transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Nova Senha</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full bg-brand-gray-deep border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-blue outline-none transition-colors"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full bg-brand-gray-deep border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-blue outline-none transition-colors"
                    required
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-sm font-bold text-gray-400 hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-brand-blue text-brand-gray-dark text-sm font-black uppercase tracking-tighter hover:bg-brand-blue-light transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={18} />
                    Atualizar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Gestão de Módulos */}
      <AnimatePresence>
        {isManagingModules && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl glass-panel technical-border rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-brand-gray-deep">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase italic font-serif">Módulos & Extensões</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Expanda as capacidades do seu console</p>
                </div>
                <button onClick={() => setIsManagingModules(false)} className="text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
                {modules.map((mod) => (
                  <div key={mod.slug} className="glass-panel technical-border p-4 rounded-xl flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-brand-gray-deep border border-white/5 text-brand-blue`}>
                        <Cpu size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{mod.name}</h4>
                          {mod.status === 'trial' && (
                            <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 text-[8px] font-black uppercase tracking-widest">Trial</span>
                          )}
                          {mod.status === 'active' && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest">Ativo</span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">{mod.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleModule(mod.slug, mod.status)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        mod.status === 'active' || mod.status === 'trial'
                          ? 'bg-brand-red/10 text-brand-red hover:bg-brand-red/20'
                          : 'bg-brand-blue text-brand-gray-dark hover:bg-brand-blue-light'
                      }`}
                    >
                      {mod.status === 'active' || mod.status === 'trial' ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-brand-gray-deep border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setIsManagingModules(false)}
                  className="px-6 py-2 rounded-xl bg-white/5 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Webhooks */}
      <AnimatePresence>
        {isManagingWebhooks && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl glass-panel technical-border rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-brand-gray-deep">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase italic font-serif">Webhooks & API</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Integrações de baixo nível</p>
                </div>
                <button onClick={() => setIsManagingWebhooks(false)} className="text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest">Endpoints Ativos</h4>
                    <button className="text-[10px] text-brand-blue font-bold uppercase tracking-widest hover:underline">+ Novo Webhook</button>
                  </div>
                  <div className="glass-panel technical-border p-4 rounded-xl flex items-center justify-between opacity-50">
                    <div className="flex items-center gap-3">
                      <Webhook size={16} className="text-gray-500" />
                      <div>
                        <p className="text-xs font-mono text-gray-400">https://api.external.com/v1/sync</p>
                        <p className="text-[8px] text-gray-600 uppercase font-bold">Eventos: transaction.created, goal.reached</p>
                      </div>
                    </div>
                    <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Inativo</span>
                  </div>
                  <p className="text-[10px] text-gray-500 italic text-center">Nenhum webhook ativo configurado.</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest">Chaves de API</h4>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      readOnly 
                      value="gl_live_51P8J2K9L0M1N2O3P4Q5R6S7T8U9V0W"
                      className="flex-1 bg-brand-gray-deep border border-white/10 rounded-lg px-3 py-2 text-[10px] font-mono text-gray-400 outline-none"
                    />
                    <button className="px-3 py-2 bg-brand-blue/10 text-brand-blue rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-brand-blue/20 transition-colors">
                      Copiar
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-brand-gray-deep border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setIsManagingWebhooks(false)}
                  className="px-6 py-2 rounded-xl bg-white/5 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Bancos Conectados */}
      <AnimatePresence>
        {isManagingBanks && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl glass-panel technical-border rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-brand-gray-deep">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase italic font-serif">Open Finance</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Gestão de conexões bancárias</p>
                </div>
                <button onClick={() => setIsManagingBanks(false)} className="text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'Nubank', status: 'Sincronizado', lastSync: '10 min atrás', color: '#8A05BE' },
                    { name: 'Itaú', status: 'Erro de Conexão', lastSync: '2 dias atrás', color: '#EC7000', error: true },
                    { name: 'BTG Pactual', status: 'Aguardando Consentimento', lastSync: '-', color: '#001E62' },
                  ].map((bank, i) => (
                    <div key={i} className="glass-panel technical-border p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: bank.color }}>
                            {bank.name[0]}
                          </div>
                          <p className="text-sm font-bold text-white">{bank.name}</p>
                        </div>
                        <button className="text-gray-500 hover:text-white transition-colors">
                          <Settings size={14} />
                        </button>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[8px] uppercase tracking-widest font-bold">
                          <span className="text-gray-500">Status</span>
                          <span className={bank.error ? 'text-brand-red' : 'text-emerald-500'}>{bank.status}</span>
                        </div>
                        <div className="flex items-center justify-between text-[8px] uppercase tracking-widest font-bold">
                          <span className="text-gray-500">Última Sinc.</span>
                          <span className="text-gray-400">{bank.lastSync}</span>
                        </div>
                      </div>
                      <button className="w-full py-2 rounded-lg bg-white/5 text-[9px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors">
                        Sincronizar Agora
                      </button>
                    </div>
                  ))}
                  
                  <button className="glass-panel border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors group">
                    <div className="p-3 rounded-full bg-brand-blue/10 text-brand-blue group-hover:scale-110 transition-transform">
                      <Globe size={20} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Conectar Novo Banco</p>
                  </button>
                </div>
              </div>
              <div className="p-6 bg-brand-gray-deep border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setIsManagingBanks(false)}
                  className="px-6 py-2 rounded-xl bg-white/5 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Notificações */}
      <AnimatePresence>
        {isManagingNotifications && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-panel technical-border rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-brand-gray-deep">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase italic font-serif">Notificações</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Gerencie seus alertas</p>
                </div>
                <button onClick={() => setIsManagingNotifications(false)} className="text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: 'Alertas de Gastos', desc: 'Notificar quando exceder 80% do orçamento', active: true },
                  { label: 'Segurança da Conta', desc: 'Alertas de novos logins e alterações', active: true },
                  { label: 'Relatórios Semanais', desc: 'Resumo de performance financeira', active: false },
                  { label: 'Dicas de Economia', desc: 'Sugestões baseadas no seu perfil', active: true },
                ].map((notif, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <p className="text-xs font-bold text-white">{notif.label}</p>
                      <p className="text-[9px] text-gray-500">{notif.desc}</p>
                    </div>
                    <div className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-colors ${notif.active ? 'bg-brand-blue' : 'bg-gray-700'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${notif.active ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-brand-gray-deep border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setIsManagingNotifications(false)}
                  className="px-6 py-2 rounded-xl bg-white/5 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Idioma & Região */}
      <AnimatePresence>
        {isManagingLanguage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-panel technical-border rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-brand-gray-deep">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase italic font-serif">Idioma & Região</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Localização do sistema</p>
                </div>
                <button onClick={() => setIsManagingLanguage(false)} className="text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Idioma Principal</label>
                  <select className="w-full bg-brand-gray-deep border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-blue outline-none transition-colors">
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Moeda Padrão</label>
                  <select className="w-full bg-brand-gray-deep border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-blue outline-none transition-colors">
                    <option value="BRL">Real (BRL)</option>
                    <option value="USD">Dólar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Fuso Horário</label>
                  <select className="w-full bg-brand-gray-deep border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand-blue outline-none transition-colors">
                    <option value="GMT-3">Brasília (GMT-3)</option>
                    <option value="GMT-0">London (GMT+0)</option>
                    <option value="GMT-5">New York (GMT-5)</option>
                  </select>
                </div>
              </div>
              <div className="p-6 bg-brand-gray-deep border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setIsManagingLanguage(false)}
                  className="px-6 py-2 rounded-xl bg-white/5 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Dispositivos */}
      <AnimatePresence>
        {isManagingDevices && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-panel technical-border rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-brand-gray-deep">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase italic font-serif">Dispositivos</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Sessões ativas</p>
                </div>
                <button onClick={() => setIsManagingDevices(false)} className="text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { name: 'Este MacBook Pro', type: 'Desktop', lastActive: 'Agora', current: true },
                  { name: 'iPhone 15 Pro', type: 'Mobile', lastActive: '2 horas atrás', current: false },
                  { name: 'iPad Air', type: 'Tablet', lastActive: 'Ontem', current: false },
                ].map((device, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-brand-gray-deep text-brand-blue">
                        <Smartphone size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          {device.name}
                          {device.current && <span className="ml-2 text-[8px] text-emerald-500 uppercase">Atual</span>}
                        </p>
                        <p className="text-[9px] text-gray-500">{device.type} • {device.lastActive}</p>
                      </div>
                    </div>
                    {!device.current && (
                      <button className="text-[9px] text-brand-red font-bold uppercase tracking-widest hover:underline">Revogar</button>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-6 bg-brand-gray-deep border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setIsManagingDevices(false)}
                  className="px-6 py-2 rounded-xl bg-white/5 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Avançado */}
      <AnimatePresence>
        {isManagingAdvanced && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-panel technical-border rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-brand-gray-deep">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase italic font-serif">Avançado</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Configurações de baixo nível</p>
                </div>
                <button onClick={() => setIsManagingAdvanced(false)} className="text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <p className="text-xs font-bold text-white">Telemetria Anônima</p>
                    <p className="text-[9px] text-gray-500">Ajude a melhorar o Glick enviando dados de uso</p>
                  </div>
                  <div className="w-10 h-5 rounded-full p-1 bg-brand-blue cursor-pointer">
                    <div className="w-3 h-3 rounded-full bg-white translate-x-5" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <p className="text-xs font-bold text-white">Modo Desenvolvedor</p>
                    <p className="text-[9px] text-gray-500">Habilitar logs estendidos no console</p>
                  </div>
                  <div className="w-10 h-5 rounded-full p-1 bg-gray-700 cursor-pointer">
                    <div className="w-3 h-3 rounded-full bg-white translate-x-0" />
                  </div>
                </div>
                <div className="pt-4 space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Cache do Sistema</p>
                  <button className="w-full py-3 rounded-xl border border-white/10 text-xs font-bold text-white hover:bg-white/5 transition-colors">
                    Limpar Cache Local (12.4 MB)
                  </button>
                </div>
              </div>
              <div className="p-6 bg-brand-gray-deep border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setIsManagingAdvanced(false)}
                  className="px-6 py-2 rounded-xl bg-white/5 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rodapé de Versão */}
      <div className="pt-8 text-center">
        <p className="text-[9px] uppercase tracking-[0.3em] text-gray-700 font-bold">
          Glick OS v2.4.0-stable — Build 2026.03.20
        </p>
      </div>
      {/* Modal de Confirmação de Reset */}
      <ConfirmationModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleReset}
        title="Resetar Todos os Dados?"
        message="Esta ação é irreversível. Todas as suas transações, contas, cartões e metas serão apagados permanentemente. Deseja continuar?"
        confirmText={isResetting ? "Resetando..." : "Sim, Apagar Tudo"}
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default SettingsView;
