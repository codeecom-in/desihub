import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'

console.log('Frontend env variables:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID,
  VITE_RAZORPAY_KEY_ID_LOADED: Boolean(import.meta.env.VITE_RAZORPAY_KEY_ID)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
