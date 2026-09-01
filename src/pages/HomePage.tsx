import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Preloader from '@/components/Preloader';
import gsap from 'gsap';

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

  useEffect(() => {
    if (showContent) {
      gsap.to('.cta-element', {
        x: 5,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
      });
    }
  }, [showContent]);

  return (
    <>
      {!preloaderDone && <Preloader onFinished={() => setPreloaderDone(true)} />}
      
      <main className="min-h-[100dvh] bg-[#241220] flex flex-col relative text-white overflow-hidden">
        {/* Mascot Eating Açaí (Top-Left Corner) */}
        <div
          className={`absolute top-2 left-2 sm:top-4 sm:left-4 lg:top-6 lg:left-8 2xl:top-10 2xl:left-12 z-20 pointer-events-none flex items-start justify-center transition-all duration-1000 delay-400 ${
            showContent ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-12 scale-95'
          }`}
        >
          <img
            src="/assets/Mascote_comendo.webp"
            alt="Mascote saboreando açaí"
            className="w-20 xs:w-24 sm:w-32 md:w-44 lg:w-56 xl:w-64 2xl:w-72 max-h-[20vh] lg:max-h-[35vh] object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.5)] animate-float-slow select-none pointer-events-none"
          />
        </div>

        {/* Main Centered Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8 w-full max-w-md lg:max-w-2xl xl:max-w-3xl mx-auto">
          {/* Logo */}
          <div className={`transition-all duration-700 mb-6 md:mb-10 lg:mb-12 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6'}`}>
            <img
              src="/assets/Logo açai.webp"
              alt="Logo Açaí"
              className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain mix-blend-screen"
            />
          </div>
          
          {/* Selection Cards */}
          <div className={`w-full flex flex-col gap-4 md:gap-6 lg:gap-8 max-w-md lg:max-w-2xl xl:max-w-3xl mx-auto transition-all duration-700 delay-300 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* CRIAR O SEU */}
            <Link
              to="/montar"
              className="group relative p-[1.5px] rounded-[34px] lg:rounded-[42px] overflow-hidden transition-all duration-500 hover:scale-[1.01] active:scale-[0.98] shadow-2xl shadow-black/40"
            >
              {/* Rotating Conic Pastel Yellow Border Beam */}
              <div 
                className="absolute -inset-[100%] animate-[spin_5s_linear_infinite] opacity-60 group-hover:opacity-100 transition-opacity"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(248, 238, 166, 0.9) 320deg, rgba(255, 246, 189, 1) 335deg, transparent 360deg)'
                }}
              />

              {/* Inner Card Content */}
              <div className="relative w-full h-full min-h-[160px] md:min-h-[190px] lg:min-h-[220px] p-5 md:p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] bg-[#2d1527] border border-white/10 group-hover:bg-[#34192d] transition-all duration-500 overflow-hidden flex flex-col justify-end">
                {/* Floating image (Vertically Centered) */}
                <div className="absolute top-1/2 -translate-y-1/2 right-0 sm:right-2 lg:right-6 w-40 h-40 sm:w-48 sm:h-48 lg:w-60 lg:h-60 pointer-events-none flex items-center justify-center">
                  <img
                    src="/assets/Acai_montar.webp"
                    alt="Monte seu açaí"
                    className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-700 ease-out"
                  />
                </div>
                
                <div className="relative z-10 w-[64%] lg:w-[60%]">
                  <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-white uppercase tracking-wide group-hover:text-[#F8EEA6] transition-colors leading-none mb-2 drop-shadow-lg">
                    Monte o seu
                  </h2>
                  <p className="text-white/60 text-sm lg:text-base font-sans drop-shadow-md">
                    Personalize <strong className="text-[#F8EEA6] font-bold">do seu jeito!</strong>
                  </p>
                  <div className="cta-element mt-4 lg:mt-6 flex items-center gap-2 text-white/40 group-hover:text-[#F8EEA6] transition-colors">
                    <span className="text-[10px] lg:text-xs font-bold uppercase tracking-[0.2em]">Começar</span>
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </Link>

            {/* COMPRAR PRONTO */}
            <Link
              to="/prontos"
              className="group relative p-[1.5px] rounded-[34px] lg:rounded-[42px] overflow-hidden transition-all duration-500 hover:scale-[1.01] active:scale-[0.98] shadow-2xl shadow-black/40"
            >
              {/* Rotating Conic Pastel Yellow Border Beam */}
              <div 
                className="absolute -inset-[100%] animate-[spin_5s_linear_infinite] opacity-60 group-hover:opacity-100 transition-opacity"
                style={{
                  background: 'conic-gradient(from 180deg, transparent 0deg, transparent 270deg, rgba(248, 238, 166, 0.9) 320deg, rgba(255, 246, 189, 1) 335deg, transparent 360deg)'
                }}
              />

              {/* Inner Card Content */}
              <div className="relative w-full h-full min-h-[160px] md:min-h-[190px] lg:min-h-[220px] p-5 md:p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] bg-[#2d1527] border border-white/10 group-hover:bg-[#34192d] transition-all duration-500 overflow-hidden flex flex-col justify-end">
                {/* Floating image (Vertically Centered) */}
                <div className="absolute top-1/2 -translate-y-1/2 right-1 sm:right-3 lg:right-6 w-36 h-36 sm:w-44 sm:h-44 lg:w-56 lg:h-56 pointer-events-none flex items-center justify-center">
                  <img
                    src="/assets/Acai_fechado.webp"
                    alt="Açaí pronto"
                    className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-700 ease-out"
                  />
                </div>
                
                <div className="relative z-10 w-[64%] lg:w-[60%]">
                  <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-white uppercase tracking-wide group-hover:text-[#F8EEA6] transition-colors leading-none mb-2 drop-shadow-lg">
                    Compre Pronto
                  </h2>
                  <p className="text-white/60 text-sm lg:text-base font-sans drop-shadow-md">
                    <strong className="text-[#F8EEA6] font-bold">Prontos para levar!</strong>
                  </p>
                  <div className="cta-element mt-4 lg:mt-6 flex items-center gap-2 text-white/40 group-hover:text-[#F8EEA6] transition-colors">
                    <span className="text-[10px] lg:text-xs font-bold uppercase tracking-[0.2em]">Ver Opções</span>
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Animated Mascot Character (Mobile Corner Peek + Desktop Display) */}
        <div
          className={`absolute bottom-0 right-0 sm:right-2 lg:right-[4%] 2xl:right-[8%] z-20 pointer-events-none flex items-end justify-center transition-all duration-1000 delay-500 ${
            showContent ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
          }`}
        >
          <img
            src="/assets/Mascote.webp"
            alt="Mascote Açaí no Kilo"
            className="w-20 xs:w-24 sm:w-32 lg:w-72 xl:w-80 2xl:w-[380px] max-h-[20vh] lg:max-h-[68vh] object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)] animate-float-slow select-none pointer-events-none translate-x-2 translate-y-1 lg:translate-x-0 lg:translate-y-0"
          />
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
