
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component to catch rendering errors in the component tree.
 */
// Use Component with explicit Props and State interfaces to ensure correct type inheritance for this.props and this.state.
class ErrorBoundary extends Component<Props, State> {
  // Explicitly declaring the state property ensures it's recognized by the TypeScript compiler on 'this'.
  public state: State = {
    hasError: false,
    error: null
  };

  // Explicitly declaring the props property helps resolve inheritance issues in some TypeScript environments.
  public props: Props;

  constructor(props: Props) {
    super(props);
    // Initialize props to ensure it is assigned correctly within the class context.
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging or external reporting.
    console.error("Uncaught error:", error, errorInfo);
  }

  // The render method handles the error UI or returns children.
  public render(): ReactNode {
    // Accessing 'this.state' which is now correctly recognized via inheritance from Component.
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-slate-900 border border-red-500/20 p-10 rounded-[40px] max-w-lg shadow-2xl">
            <div className="text-5xl mb-6">🤕</div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Algo salió mal</h1>
            <p className="text-slate-400 text-xs font-medium mb-8">
              La aplicación encontró un error inesperado. Esto suele pasar por caché antiguo o interrupciones de red.
            </p>
            <div className="bg-black/30 p-4 rounded-xl mb-8 text-left overflow-auto max-h-32 border border-white/5">
                <code className="text-[10px] text-red-400 font-mono">
                    {this.state.error?.message || "Error desconocido"}
                </code>
            </div>
            <button
              onClick={() => {
                  // Clear local session cache and refresh the app to attempt recovery.
                  localStorage.removeItem('profesoria_teacher_session');
                  window.location.reload();
              }}
              className="px-8 py-4 bg-cyan-500 text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-cyan-400 transition-all shadow-lg"
            >
              Reiniciar Aplicación
            </button>
          </div>
        </div>
      );
    }

    // Accessing 'this.props' which is now correctly recognized via inheritance from Component.
    return this.props.children;
  }
}

export default ErrorBoundary;
