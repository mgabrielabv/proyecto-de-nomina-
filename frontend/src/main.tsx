import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import './styles/tokens.css';
import './styles/global.css';
import App from './App';
import { useBootstrapData } from './hooks';

function Root() {
  useBootstrapData();
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
