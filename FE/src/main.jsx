import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import DailyRecap from './daily.jsx'
import Yield from './yield.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/daily" element={<DailyRecap />} />
        <Route path="/yield" element={<Yield />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
