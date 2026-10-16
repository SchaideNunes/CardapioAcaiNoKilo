import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import './index.css'

// Cada rota vira um arquivo separado: quem abre a home não baixa o painel admin.
const loadOrderPage = () => import('./pages/OrderPage')
const loadReadyMadePage = () => import('./pages/ReadyMadePage')
const OrderPage = lazy(loadOrderPage)
const ReadyMadePage = lazy(loadReadyMadePage)
const LoginPage = lazy(() => import('./pages/LoginPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

// Depois de um deploy, os arquivos antigos das rotas somem: quem estava com o site aberto recarrega uma vez
// para pegar a versão nova (a marca na sessão evita recarregar em laço se o erro for outro).
window.addEventListener('vite:preloadError', (event) => {
  try {
    if (sessionStorage.getItem('chunkReloaded')) return
    sessionStorage.setItem('chunkReloaded', '1')
  } catch {
    return
  }
  event.preventDefault()
  window.location.reload()
})

// As telas de pedido são o próximo passo de quase todo cliente: baixa em segundo plano quando o navegador folgar.
const preloadOrderFlows = () => { loadOrderPage(); loadReadyMadePage() }
const isStaffRoute = /^\/(admin|login)/.test(window.location.pathname)
if (!isStaffRoute) {
  if ('requestIdleCallback' in window) window.requestIdleCallback(preloadOrderFlows, { timeout: 4000 })
  else setTimeout(preloadOrderFlows, 2000)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-[100dvh] bg-[#241220]" />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/montar" element={<OrderPage />} />
          <Route path="/prontos" element={<ReadyMadePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>,
)
