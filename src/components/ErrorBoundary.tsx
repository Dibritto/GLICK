import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-graphite flex items-center justify-center p-6">
          <div className="glass-panel technical-border p-8 rounded-2xl max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-brand-red/10 flex items-center justify-center">
                <AlertTriangle size={32} className="text-brand-red" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white uppercase tracking-tighter italic font-serif">
                Falha Crítica na Telemetria
              </h2>
              <p className="text-xs text-gray-500 uppercase tracking-widest leading-relaxed">
                Ocorreu um erro inesperado no processamento de dados. A integridade do sistema foi preservada.
              </p>
            </div>
            {this.state.error && (
              <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                <p className="text-[10px] font-mono text-brand-red break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue text-brand-graphite rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-brand-blue/80 transition-all"
            >
              <RefreshCw size={14} />
              Reiniciar Console
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
