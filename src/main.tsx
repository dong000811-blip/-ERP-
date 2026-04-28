import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  window.onerror = function(message, source, lineno, colno, error) {
    console.error('GLOBAL ERROR DETECTED:', {
      message,
      source,
      lineno,
      colno,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : 'No error object'
    });
    return false; // Let browser handle it as well
  };

  window.addEventListener('unhandledrejection', function(event) {
    console.error('UNHANDLED PROMISE REJECTION:', {
      reason: event.reason,
      promise: event.promise
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
