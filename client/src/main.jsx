import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AppProviders from './app/providers.jsx'
import './config/axiosConfig.js'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppProviders>
    <App />
  </AppProviders>,
)
