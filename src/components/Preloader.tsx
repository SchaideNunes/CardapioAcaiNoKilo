import { useState, useEffect, useRef } from 'react';

// All critical images to preload while the preloader is visible
const PRELOAD_IMAGES = [
  '/assets/Logo açai.webp',
  '/assets/Açai_hero.webp',
  '/assets/items/Açai_350ml.webp',
  '/assets/items/Açai_500ml.webp',
  '/assets/items/Açai_750ml.webp',
  '/assets/items/POTE_LITRO.webp',
  '/assets/500ml_acai_natural.webp',
  '/assets/500ml_acai_banana.webp',
  '/assets/500ml_acai_morango.webp',
  '/assets/500ml_acai_cupuacu.webp',
  '/assets/1l_acai_banana.webp',
  '/assets/1l_acai_morango.webp',
  '/assets/1l_acai_zero.webp',
  '/assets/1l_creme_abacaxi_vinho.webp',
  '/assets/1l_creme_doce_de_leite.webp',
  '/assets/1l_creme_grego_amarena.webp',
  '/assets/1l_creme_moranto_zero.webp',
  '/assets/2l_acai_natural.webp',
  '/assets/2l_acai_banana.webp',
  '/assets/pix.png',
  '/assets/card.png',
  '/assets/Dinheiro.webp',
];

const TOTAL_DURATION = 3800; // slightly under 4s

export default function Preloader({ onFinished }: { onFinished: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const startTime = useRef(Date.now());
  const imagesLoaded = useRef(0);

  useEffect(() => {
    // Start preloading images
    PRELOAD_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => { imagesLoaded.current++; };
      img.onerror = () => { imagesLoaded.current++; };
    });

    // Animate progress from 0 to 100 over TOTAL_DURATION
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const timeProgress = Math.min(elapsed / TOTAL_DURATION, 1);
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - timeProgress, 3);
      const pct = Math.round(eased * 100);
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(onFinished, 600);
        }, 200);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [onFinished]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#3d1b34] flex flex-col items-center justify-center transition-opacity duration-700 overflow-hidden ${fadeOut ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
    >
      {/* Ambient glow */}
      <div className="absolute w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />

      {/* Floating Ingredients Background */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="relative w-full h-full max-w-2xl max-h-2xl">
          <img src="/assets/items/fr_morango.webp" alt="Morango" className="absolute top-[20%] left-[20%] w-16 h-16 object-contain opacity-40 blur-[2px] animate-bounce" style={{ animationDuration: '4s' }} />
          <img src="/assets/items/fr_banana.webp" alt="Banana" className="absolute top-[30%] right-[15%] w-12 h-12 object-contain opacity-30 blur-[1px] animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <img src="/assets/items/a_chocoball.webp" alt="Chocoball" className="absolute bottom-[25%] left-[25%] w-10 h-10 object-contain opacity-50 blur-[3px] animate-pulse" style={{ animationDuration: '3s' }} />
          <img src="/assets/items/fi_leitinho.webp" alt="Leitinho" className="absolute bottom-[20%] right-[25%] w-14 h-14 object-contain opacity-40 blur-[2px] animate-bounce" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        </div>
      </div>

      {/* Açaí Hero Color Fill Animation */}
      <div className="relative w-48 h-48 md:w-64 md:h-64 mb-10 z-10">
        {/* Grayscale base (Empty bowl) */}
        <img
          src="/assets/Pre loader.webp"
          alt="Açaí Bowl Base"
          className="absolute inset-0 w-full h-full object-contain grayscale opacity-20"
        />
        {/* Colorful fill layer (Fills up from bottom to top based on progress) */}
        <img
          src="/assets/Pre loader.webp"
          alt="Açaí Bowl Fill"
          className="absolute inset-0 w-full h-full object-contain transition-all duration-300 ease-out drop-shadow-[0_0_30px_rgba(216,172,79,0.3)]"
          style={{ clipPath: `inset(${100 - progress}% 0 0 0)` }}
        />
        
        {/* Sparkles on the fill line */}
        {progress > 5 && progress < 95 && (
          <div 
            className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/80 to-transparent transition-all duration-300 ease-out blur-[1px]"
            style={{ bottom: `${progress}%` }}
          />
        )}
      </div>

      {/* Logo and Percentage */}
      <div className="flex flex-col items-center gap-3 z-10">
        <img
          src="/assets/Logo açai.webp"
          alt="Logo Açaí"
          className="w-32 h-32 md:w-40 md:h-40 object-contain mix-blend-screen animate-pulse"
        />
        
        <div className="flex items-baseline gap-1 mt-2">
          <span className="font-heading text-5xl md:text-6xl text-primary drop-shadow-lg">{progress}</span>
          <span className="font-heading text-2xl text-primary/70">%</span>
        </div>
        
        <span className="text-white/60 text-sm tracking-[0.2em] uppercase font-bold animate-pulse mt-2">
          Preparando seu Açaí...
        </span>
      </div>
    </div>
  );
}
