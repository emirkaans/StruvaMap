import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './styles/fonts.css'
import './styles/struva.css'
import { App } from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initMonitoring } from './lib/monitoring'

void initMonitoring()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
