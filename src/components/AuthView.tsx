import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, Loader2, Mail, Lock, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthViewProps {
  onSuccess?: () => void;
}

const AuthView: React.FC<AuthViewProps> = () => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
      } else {
        setError(data.error || 'Ocorreu um erro. Tente novamente.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-graphite flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-blue/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-blue/5 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 relative z-10"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-brand-blue/10 rounded-lg text-brand-blue mb-4">
            <Zap size={32} className="fill-current" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic font-serif">
            GLICK <span className="text-brand-blue">CONSOLE</span>
          </h1>
          <p className="text-gray-500 text-xs uppercase tracking-[0.3em] font-bold">
            Telemetria Financeira Avançada
          </p>
        </div>

        <div className="glass-panel technical-border rounded-xl p-8 space-y-6">
          <div className="flex p-1 bg-brand-lead/20 rounded-lg">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                isLogin ? 'bg-brand-blue text-brand-graphite shadow-lg' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                !isLogin ? 'bg-brand-blue text-brand-graphite shadow-lg' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Cadastro
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                  <UserIcon size={12} /> Nome Completo
                </label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-lg py-3 px-4 text-sm text-white focus:border-brand-blue/50 focus:outline-none transition-all"
                  placeholder="Seu nome"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                <Mail size={12} /> Email
              </label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-3 px-4 text-sm text-white focus:border-brand-blue/50 focus:outline-none transition-all"
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                <Lock size={12} /> Senha
              </label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-lead/10 border border-brand-lead/20 rounded-xl py-3 px-4 text-sm text-white focus:border-brand-blue/50 focus:outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-brand-red text-[10px] font-bold uppercase tracking-widest text-center"
              >
                {error}
              </motion.p>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-brand-blue text-brand-graphite rounded-lg text-xs font-black uppercase tracking-[0.2em] hover:bg-brand-blue/80 transition-all shadow-xl shadow-brand-blue/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} className="fill-current" />}
              {isLogin ? 'Acessar Console' : 'Criar Conta Técnica'}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-gray-600 uppercase tracking-widest font-bold">
          Sistema de Decisão Financeira © 2026
        </p>
      </motion.div>
    </div>
  );
};

export default AuthView;
