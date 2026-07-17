import React from 'react';

interface State {
  error: Error | null;
}

/** Captura erros de renderização e mostra uma tela amigável em vez da página em branco. */
export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#0a0b0d] text-white flex items-center justify-center p-6">
          <div className="bg-[#14161a] p-10 rounded-[2.5rem] max-w-md w-full text-center border border-white/5">
            <h1 className="text-3xl font-black italic mb-2">
              GP<span className="text-[#ffb7c5]">:OBRA</span>
            </h1>
            <p className="text-sm text-gray-400 mb-8">
              Algo inesperado aconteceu. Recarregue a página para continuar.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#ffb7c5] text-black font-black uppercase p-4 rounded-2xl text-xs hover:scale-[1.02] transition-all"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
