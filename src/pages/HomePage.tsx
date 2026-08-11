import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Preloader from '@/components/Preloader';

export default function HomePage() {
  const alreadyLoaded = sessionStorage.getItem('preloaderDone') === 'true';
  const [preloaderDone, setPreloaderDone] = useState(alreadyLoaded);
  const [showContent, setShowContent] = useState(alreadyLoaded);

  useEffect(() => {
    if (preloaderDone) {
      sessionStorage.setItem('preloaderDone', 'true');
      // Stagger the content animation
      requestAnimationFrame(() => setShowContent(true));
    }
  }, [preloaderDone]);

  return (
    <>
      {!preloaderDone && <Preloader onFinished={() => setPreloaderDone(true)} />}
      
      <main className="min-h-[100dvh] bg-[#3d1b34] flex flex-col relative text-white overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-20%] right-[-30%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-20%] w-[400px] h-[400px] bg-secondary/8 rounded-full blur-[100px]" />
        </div>

        {/* Main Centered Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8 w-full max-w-md mx-auto">
          {/* Logo */}
          <div className={`transition-all duration-700 mb-10 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6'}`}>
            <img
              src="/assets/Logo açai.webp"
              alt="Logo Açaí"
              className="w-32 h-32 md:w-40 md:h-40 object-contain mix-blend-screen"
            />
          </div>
          
          {/* Selection Cards */}
          <div className={`w-full flex flex-col gap-4 transition-all duration-700 delay-300 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] font-sans text-center mb-1">
              Escolha como deseja pedir
            </p>

          <div className="flex flex-col gap-6 max-w-md mx-auto w-full">
            {/* CRIAR O SEU */}
            <Link
              to="/montar"
              className="group relative flex flex-col justify-end min-h-[190px] p-6 rounded-[32px] bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-primary/40 active:scale-[0.98] transition-all duration-500 overflow-hidden shadow-2xl shadow-black/20"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 blur-[60px] rounded-full pointer-events-none" />
              
              {/* Large floating image */}
              <div className="absolute -top-6 -right-6 w-48 h-48 sm:w-56 sm:h-56 pointer-events-none">
                <img
                  src="/assets/Acai_montar.webp"
                  alt="Monte seu açaí"
                  className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-700 ease-out"
                />
              </div>
              
              <div className="relative z-10 w-[70%]">
                <h2 className="font-heading text-4xl sm:text-5xl text-white uppercase tracking-wide group-hover:text-primary transition-colors leading-none mb-2 drop-shadow-lg">
                  Monte o seu
                </h2>
                <p className="text-white/50 text-sm font-sans drop-shadow-md">
                  Personalize do seu jeito!
                </p>
                <div className="mt-4 flex items-center gap-2 text-white/30 group-hover:text-primary transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Começar</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </Link>

            {/* COMPRAR PRONTO */}
            <Link
              to="/prontos"
              className="group relative flex flex-col justify-end min-h-[190px] p-6 rounded-[32px] bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-primary/40 active:scale-[0.98] transition-all duration-500 overflow-hidden shadow-2xl shadow-black/20"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/15 blur-[60px] rounded-full pointer-events-none" />
              
              {/* Large floating image */}
              <div className="absolute -top-2 -right-8 w-44 h-44 sm:w-52 sm:h-52 pointer-events-none">
                <img
                  src="/assets/Acai_fechado.webp"
                  alt="Açaí pronto"
                  className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-700 ease-out"
                />
              </div>
              
              <div className="relative z-10 w-[70%]">
                <h2 className="font-heading text-4xl sm:text-5xl text-white uppercase tracking-wide group-hover:text-primary transition-colors leading-none mb-2 drop-shadow-lg">
                  Compre Pronto
                </h2>
                <p className="text-white/50 text-sm font-sans drop-shadow-md">
                  Prontos para levar!
                </p>
                <div className="mt-4 flex items-center gap-2 text-white/30 group-hover:text-primary transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Ver Opções</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

        {/* Bottom subtle brand */}
        <footer
          className={`relative z-10 pb-6 text-center transition-all duration-700 delay-700 ${showContent ? 'opacity-100' : 'opacity-0'}`}
        >
          <p className="text-white/15 text-[10px] font-sans uppercase tracking-[0.25em]">
            © {new Date().getFullYear()} Açaí no Kilo
          </p>
        </footer>
      </main>
    </>
  );
}
