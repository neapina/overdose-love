import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './vibe.css'
import './pixel.css'
import App from './App.tsx'
import { preparePixels } from './os/pixel'

void preparePixels()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
