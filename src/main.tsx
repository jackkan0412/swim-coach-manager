import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SwimCoachProvider } from './context/SwimCoachContext'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SwimCoachProvider>
        <App />
      </SwimCoachProvider>
    </BrowserRouter>
  </StrictMode>,
)