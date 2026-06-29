"use client";

import  { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center space-x-3 text-rose-500 border-b border-slate-800 pb-4">
              <AlertCircle size={28} />
              <h2 className="text-xl font-bold tracking-tight">Ocurrió un error en la aplicación</h2>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-300 font-medium">
                Se detectó una falla en la interfaz de usuario. Esto puede ocurrir debido a incompatibilidades de renderizado o restricciones del sandbox:
              </p>

              <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 overflow-auto max-h-48 custom-scrollbar">
                <p className="text-xs font-mono text-rose-400 font-semibold mb-1">
                  {this.state.error?.name}: {this.state.error?.message}
                </p>
                {this.state.error?.stack && (
                  <pre className="text-[10px] font-mono text-slate-500 mt-2 whitespace-pre-wrap leading-relaxed">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <span className="text-[11px] text-slate-500 font-mono">
                Haz clic en reintentar o limpia los datos locales.
              </span>

              <button
                onClick={this.handleReset}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-all shadow-lg shadow-indigo-600/15 cursor-pointer w-full sm:w-auto justify-center"
              >
                <RotateCcw size={14} />
                <span>Reiniciar Aplicación</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
