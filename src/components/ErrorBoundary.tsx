import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-8">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">System Malfunction</h1>
            <div className="bg-[#111] border border-[#222] p-4 text-left overflow-auto max-h-[300px]">
              <p className="text-red-500 font-mono text-xs break-words">
                {this.state.error?.message || 'Unknown runtime error'}
              </p>
              <p className="text-[#555] font-mono text-[10px] mt-2 uppercase">
                Trace logged to console.
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-white text-black py-4 font-black uppercase tracking-widest hover:bg-[#DDD] transition-all italic text-sm"
            >
              Attempt System Reboot
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
