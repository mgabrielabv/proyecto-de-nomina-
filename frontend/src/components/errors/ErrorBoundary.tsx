import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Al cambiar (por ejemplo, la ruta) se limpia el error y se reintenta. */
  resetKey?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Red de seguridad del contenido de las rutas. Sin ella, una excepción de
 * render desmonta el árbol completo y deja la aplicación en blanco sin pistas.
 * El layout (header y sidebar) vive fuera de este límite, así que la navegación
 * sigue disponible aunque una pantalla falle.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Solo el mensaje y la pila de componentes: nunca props ni datos de sesión.
    console.error('[ErrorBoundary] Falló el render de una ruta:', error.message, info.componentStack);
  }

  componentDidUpdate(previous: ErrorBoundaryProps) {
    if (previous.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  private reiniciar = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div role="alert" className="rounded-2xl border border-error/30 bg-error/10 p-8 text-center sm:p-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-error" aria-hidden />
        <h2 className="mt-4 text-xl font-bold text-text">No se pudo mostrar esta pantalla</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-text-secondary">
          Ocurrió un error inesperado al renderizar el contenido. El resto de la aplicación sigue
          funcionando; puedes reintentar o volver a otra sección desde el menú.
        </p>
        <p className="mx-auto mt-3 max-w-lg break-words rounded-lg bg-surface px-3 py-2 text-xs text-text-muted">
          {this.state.error.message}
        </p>
        <button
          type="button"
          onClick={this.reiniciar}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-button border border-border bg-surface px-5 text-sm font-medium text-text transition-colors duration-200 hover:border-border-strong"
        >
          <RotateCw className="mr-1.5 h-4 w-4" aria-hidden />
          Reintentar
        </button>
      </div>
    );
  }
}
