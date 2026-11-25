import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import './styles/tokens.css';
import './styles/global.css';
import App from './App';
import { useBootstrapData } from './hooks';
import { useSessionStore } from './store';

function Root() {
  const status = useSessionStore((state) => state.status);
  const mustChangePassword = useSessionStore((state) => Boolean(state.user?.mustChangePassword));
  const bootstrap = useSessionStore((state) => state.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useBootstrapData(status === 'authenticated' && !mustChangePassword);

  if (status === 'loading') {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-text" role="status" aria-live="polite">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" aria-hidden />
        <span className="sr-only">Cargando sesión</span>
      </div>
    );
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
