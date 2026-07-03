import './styles/main.scss'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRoot } from './shell'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>
)
