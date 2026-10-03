import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Clear any stuck body overflow lock from previous reloads/HMR
document.body.classList.remove('modal-open');
document.body.style.overflow = '';
document.body.style.removeProperty('overflow');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
