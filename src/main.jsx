import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// --- SENTRY IMPORTS ---
import * as Sentry from "@sentry/react";

// --- INICIALIZAÇÃO DO SENTRY ---
Sentry.init({
  dsn: "https://e005606cda88700fa26ec8568f2c5080@o4510514066489344.ingest.us.sentry.io/4510514069045248", // <--- COLE SUA DSN AQUI
  debug: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Captura 100% das transações para teste (em produção, baixe para 0.1 ou 0.2)
  // Session Replay
  replaysSessionSampleRate: 0.1, // Grava 10% das sessões sem erro
  replaysOnErrorSampleRate: 1.0, // Grava 100% das sessões QUE TIVERAM ERRO (Isso é ouro!)
});

registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div className="p-10 text-white bg-slate-900 h-screen">Opa! O cigaRats engasgou. Já fomos avisados! 🐀</div>}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
