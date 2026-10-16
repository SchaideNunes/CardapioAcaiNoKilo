import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { DEMO_TOKEN, isDemoCredentials, isDemoModeEnabled } from "@/lib/demo";
import { apiUrl } from "@/lib/api";

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

    try {
      const res = await fetch(apiUrl("/api/login"), {
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
    } catch {
      // MODO DEMO / OFFLINE FALLBACK — só com as credenciais públicas de demonstração
      if (!isDemoModeEnabled()) {
        setError("Servidor indisponível. Tente novamente em instantes.");
      } else if (isDemoCredentials(username, password)) {
        localStorage.setItem("adminToken", DEMO_TOKEN);
        navigate("/admin");
      } else {
        setError("E-mail ou senha incorretos.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#241220] p-4 text-white selection:bg-[#F0DF58] selection:text-[#120714] sm:p-6">
      <div className="w-full max-w-md rounded-[32px] border-2 border-white/10 bg-[#2f1729] p-6 animate-in fade-in duration-300 sm:p-8">
        {/* Logo e cabeçalho */}
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/assets/Logo açai.webp" alt="Logo Açaí no Kilo" className="mb-4 h-24 w-auto object-contain" />
          <h1 className="font-heading text-[44px] leading-[0.9]">Acesso Restrito</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-[#F0DF58]">
            <ShieldCheck size={16} aria-hidden /> Painel administrativo
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-username" className="text-sm font-bold text-white/80">E-mail / Usuário</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} aria-hidden />
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 w-full rounded-2xl border-2 border-white/10 bg-[#241220] pl-11 pr-4 text-[16px] text-white placeholder:text-white/35 caret-[#F0DF58] transition-colors focus:border-[#F0DF58] focus:outline-none"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-password" className="text-sm font-bold text-white/80">Senha de Acesso</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} aria-hidden />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-2xl border-2 border-white/10 bg-[#241220] pl-11 pr-4 text-[16px] text-white placeholder:text-white/35 caret-[#F0DF58] transition-colors focus:border-[#F0DF58] focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-2xl border-2 border-[#F58220]/40 bg-[#F58220]/10 px-4 py-3 text-center text-sm font-bold text-[#F58220]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-[#120714] bg-[#F0DF58] font-heading text-[26px] text-[#120714] transition-colors hover:bg-[#F8EEA6] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F0DF58]"
          >
            {loading ? "Entrando..." : "Entrar no Painel"}
            <ArrowRight size={22} strokeWidth={2.5} aria-hidden />
          </button>
        </form>
      </div>
    </main>
  );
}
