import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import POS from './pages/POS.jsx'
import "./index.css";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <POS />
  </React.StrictMode>,
)