import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("adminToken", data.token);
        navigate("/admin");
      } else {
        setError("Usuário ou senha inválidos");
      }
    } catch (err) {
      // MODO DEMO: Se o servidor falhar (offline), permite entrar com admin/admin
      if (username === "admin" && password === "admin") {
        localStorage.setItem("adminToken", "demo-token-123");
        navigate("/admin");
      } else {
        setError("Servidor offline. Use admin/admin para demonstração.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#3d1b34] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(246,230,50,0.3)]">
            <Lock className="text-[#3d1b34]" size={32} />
          </div>
          <h1 className="font-heading text-3xl text-white uppercase tracking-wider">Acesso Restrito</h1>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-2">Painel Administrativo</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/30 uppercase ml-4">Usuário</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary transition-all" placeholder="Digite seu usuário" required />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/30 uppercase ml-4">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary transition-all" placeholder="••••••••" required />
            </div>
          </div>

          {error && <p className="text-red-400 text-xs font-bold text-center uppercase animate-bounce">{error}</p>}

          <button type="submit" className="w-full bg-primary text-[#3d1b34] font-heading text-xl py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all shadow-lg active:scale-95 group">
            ENTRAR <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}
