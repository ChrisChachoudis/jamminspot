import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

// Uploaded files can vanish (e.g. records created before files moved to
// persistent storage). Hide a failed <img> so the surrounding placeholder
// box shows instead of a broken-image icon. Error events don't bubble, so
// this listens in the capture phase.
document.addEventListener(
  'error',
  (e) => {
    if (e.target instanceof HTMLImageElement) e.target.style.visibility = 'hidden'
  },
  true,
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
