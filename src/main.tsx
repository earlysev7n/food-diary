import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './features/auth/AuthContext'
import { SpaceProvider } from './features/spaces/SpaceContext'
import 'maplibre-gl/dist/maplibre-gl.css'
import { registerSW } from 'virtual:pwa-register'

registerSW({
  immediate: true,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SpaceProvider>
        <App />
      </SpaceProvider>
    </AuthProvider>
  </StrictMode>,
)
