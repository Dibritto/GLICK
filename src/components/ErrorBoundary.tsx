import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public props: Props;
  public state: State = {
    hasError: false,
    error: null
  };

  constructor(props: Props) {
    super(props);
    this.props = props;
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
        <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 bg-brand-graphite border border-brand-red/20 rounded-xl m-4">
          <div className="p-4 bg-brand-red/10 rounded-full">
            <AlertTriangle className="text-brand-red" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tighter">Ops! Algo deu errado no console.</h2>
          <p className="text-gray-400 text-sm max-w-md leading-relaxed">
            Houve um erro técnico ao processar este módulo. Isso geralmente acontece quando o banco de dados ainda não está totalmente configurado.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-2 bg-brand-blue text-brand-graphite font-bold rounded-lg hover:bg-brand-blue/80 transition-all uppercase text-xs tracking-widest"
          >
            <RefreshCcw size={14} />
            Recarregar Sistema
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 p-4 bg-black/40 text-brand-red text-[10px] font-mono rounded overflow-auto max-w-full text-left">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
