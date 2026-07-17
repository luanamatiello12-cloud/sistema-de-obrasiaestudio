import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

// Remove a tela de carregamento inicial assim que o app monta
const boot = document.getElementById('boot');
if (boot) {
  boot.style.opacity = '0';
  setTimeout(() => boot.remove(), 400);
}
