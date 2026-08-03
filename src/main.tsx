import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import OrderPage from './pages/OrderPage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import HomePage from './pages/HomePage'
import ReadyMadePage from './pages/ReadyMadePage'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/montar" element={<OrderPage />} />
        <Route path="/prontos" element={<ReadyMadePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
