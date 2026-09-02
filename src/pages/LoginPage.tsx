import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanUser = username.trim().toLowerCase();

    try {
      const res = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("adminToken", data.token);
        navigate("/admin");
        return;
      } else {
        setError(data.error || "E-mail ou senha incorretos");
      }
    } catch (err) {
      // MODO DEMO / OFFLINE FALLBACK
      if (
        (cleanUser === "schaidenunes@gmail.com" || cleanUser === "schaidenunes" || cleanUser === "admin") && 
        (password === "schaide123." || password === "admin")
      ) {
        localStorage.setItem("adminToken", "demo-token-123");
        navigate("/admin");
      } else {
        setError("E-mail ou senha incorretos.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#180a15] flex items-center justify-center p-6 selection:bg-[#F0DF58] selection:text-[#180a15]">
      <div className="w-full max-w-md bg-[#1f0d1b]/90 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        {/* Logo e Cabeçalho */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-white/[0.04] border border-white/10 rounded-3xl flex items-center justify-center p-2.5 mb-4 shadow-xl overflow-hidden">
            <img 
              src="/assets/Logo açai.webp" 
              alt="Logo Açaí no Kilo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="font-heading text-3xl text-white uppercase tracking-wider">Acesso Restrito</h1>
          <p className="text-[#F0DF58] text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
            <ShieldCheck size={14} /> Painel Administrativo
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* E-mail / Usuário */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 uppercase ml-1">E-mail / Usuário</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="w-full bg-white/[0.05] border border-white/15 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm font-sans focus:outline-none focus:border-[#F0DF58]/70 transition-all placeholder:text-white/30" 
                placeholder="schaidenunes@gmail.com" 
                required 
              />
            </div>
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 uppercase ml-1">Senha de Acesso</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-white/[0.05] border border-white/15 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm font-sans focus:outline-none focus:border-[#F0DF58]/70 transition-all placeholder:text-white/30" 
                placeholder="••••••••" 
                required 
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-2xl text-red-300 text-xs font-bold text-center animate-shake">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#F0DF58] to-[#E5CF38] hover:from-[#f6e66b] hover:to-[#ebdb4a] text-[#180a15] font-heading text-xl py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#F0DF58]/10 active:scale-95 group font-black uppercase tracking-wide disabled:opacity-50 mt-2"
          >
            {loading ? "Entrando..." : "Entrar no Painel"} 
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}
