import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
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

          <div className="flex flex-col gap-4 max-w-md mx-auto w-full">
            {/* CRIAR O SEU */}
            <Link
              to="/montar"
              className="group relative flex items-center gap-5 p-5 md:p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-primary/40 active:scale-[0.98] transition-all duration-300 backdrop-blur-sm"
            >
              {/* Thumbnail with açaí bowl */}
              <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
                <img
                  src="/assets/items/Açai_500ml.webp"
                  alt="Monte seu açaí"
                  className="w-[85%] h-[85%] object-contain drop-shadow-lg"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h2 className="font-heading text-2xl md:text-3xl text-white uppercase tracking-wide group-hover:text-primary transition-colors">
                  Criar o Seu
                </h2>
                <p className="text-white/40 text-xs font-sans mt-0.5 line-clamp-1">
                  Monte do seu jeito, escolha os acompanhamentos
                </p>
              </div>

              <ChevronRight
                size={22}
                className="text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0"
              />
            </Link>

            {/* COMPRAR PRONTO */}
            <Link
              to="/prontos"
              className="group relative flex items-center gap-5 p-5 md:p-6 rounded-2xl bg-gradient-to-r from-secondary/[0.08] to-secondary/[0.02] border border-secondary/20 hover:border-secondary/50 hover:from-secondary/[0.14] hover:to-secondary/[0.06] active:scale-[0.98] transition-all duration-300 backdrop-blur-sm shadow-lg shadow-secondary/5"
            >
              {/* Thumbnail with ready product */}
              <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-secondary/30 to-secondary/5 border border-secondary/25 flex items-center justify-center shadow-lg shadow-secondary/10">
                <img
                  src="/assets/500ml_acai_morango.webp"
                  alt="Açaí pronto"
                  className="w-full h-full object-cover rounded-lg"
                />
                {/* Badge */}
                <div className="absolute -top-1 -right-1 bg-secondary text-[#3d1b34] text-[8px] font-bold font-sans px-1.5 py-0.5 rounded-full uppercase shadow-md">
                  Pronto
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h2 className="font-heading text-2xl md:text-3xl text-white uppercase tracking-wide group-hover:text-secondary transition-colors">
                  Comprar Pronto
                </h2>
                <p className="text-white/40 text-xs font-sans mt-0.5 line-clamp-1">
                  Açaís e cremes já montados, prontos para levar
                </p>
              </div>

              <ChevronRight
                size={22}
                className="text-secondary/40 group-hover:text-secondary group-hover:translate-x-1 transition-all flex-shrink-0"
              />
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
