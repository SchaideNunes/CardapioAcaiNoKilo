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
        x: 4,
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
            className="w-20 xs:w-24 sm:w-32 md:w-36 lg:w-40 xl:w-64 2xl:w-72 max-h-[20vh] lg:max-h-[30vh] xl:max-h-[35vh] object-contain animate-float-slow select-none pointer-events-none"
          />
        </div>

        {/* Main Centered Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-8 pb-28 sm:pb-32 lg:pb-8 w-full max-w-md lg:max-w-2xl xl:max-w-3xl mx-auto">
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
              className="group relative rounded-[32px] lg:rounded-[40px] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F0DF58]"
            >

              {/* Inner Card Content */}
              <div className="relative w-full h-full min-h-[160px] md:min-h-[190px] lg:min-h-[220px] p-5 md:p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] bg-[#2f1729] border-2 border-white/10 group-hover:border-white/30 group-active:border-[#F0DF58] transition-colors duration-200 ease-out overflow-hidden flex flex-col justify-end">
                {/* Floating image (Vertically Centered) */}
                <div className="absolute top-1/2 -translate-y-1/2 right-0 sm:right-2 lg:right-6 w-40 h-40 sm:w-48 sm:h-48 lg:w-60 lg:h-60 pointer-events-none flex items-center justify-center">
                  <img
                    src="/assets/Acai_montar.webp"
                    alt="Monte seu açaí"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 ease-out"
                  />
                </div>
                
                <div className="relative z-10 w-[64%] lg:w-[60%]">
                  <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-white uppercase tracking-wide group-hover:text-[#F8EEA6] transition-colors leading-none mb-2">
                    Monte o seu
                  </h2>
                  <p className="text-white/75 text-sm lg:text-base font-sans">
                    Personalize <strong className="text-[#F8EEA6] font-bold">do seu jeito!</strong>
                  </p>
                  <span className="mt-4 lg:mt-6 inline-flex h-11 items-center gap-2 rounded-full border-2 border-[#120714] bg-[#F0DF58] px-5 font-heading text-xl lg:text-2xl uppercase text-[#120714] transition-colors group-hover:bg-[#F8EEA6]">
                    Começar <ArrowRight size={18} strokeWidth={2.5} className="cta-element" />
                  </span>
                </div>
              </div>
            </Link>

            {/* COMPRAR PRONTO */}
            <Link
              to="/prontos"
              className="group relative rounded-[32px] lg:rounded-[40px] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F0DF58]"
            >

              {/* Inner Card Content */}
              <div className="relative w-full h-full min-h-[160px] md:min-h-[190px] lg:min-h-[220px] p-5 md:p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] bg-[#2f1729] border-2 border-white/10 group-hover:border-white/30 group-active:border-[#F0DF58] transition-colors duration-200 ease-out overflow-hidden flex flex-col justify-end">
                {/* Floating image (Vertically Centered) */}
                <div className="absolute top-1/2 -translate-y-1/2 right-1 sm:right-3 lg:right-6 w-36 h-36 sm:w-44 sm:h-44 lg:w-56 lg:h-56 pointer-events-none flex items-center justify-center">
                  <img
                    src="/assets/Acai_fechado.webp"
                    alt="Açaí pronto"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 ease-out"
                  />
                </div>
                
                <div className="relative z-10 w-[64%] lg:w-[60%]">
                  <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-white uppercase tracking-wide group-hover:text-[#F8EEA6] transition-colors leading-none mb-2">
                    Compre Pronto
                  </h2>
                  <p className="text-white/75 text-sm lg:text-base font-sans">
                    <strong className="text-[#F8EEA6] font-bold">Prontos para levar!</strong>
                  </p>
                  <span className="mt-4 lg:mt-6 inline-flex h-11 items-center gap-2 rounded-full border-2 border-[#120714] bg-[#F0DF58] px-5 font-heading text-xl lg:text-2xl uppercase text-[#120714] transition-colors group-hover:bg-[#F8EEA6]">
                    Ver opções <ArrowRight size={18} strokeWidth={2.5} className="cta-element" />
                  </span>
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
            className="w-20 xs:w-24 sm:w-32 lg:w-40 xl:w-80 2xl:w-[380px] max-h-[20vh] lg:max-h-[40vh] xl:max-h-[68vh] object-contain animate-float-slow select-none pointer-events-none translate-x-2 translate-y-1 lg:translate-x-0 lg:translate-y-0"
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
