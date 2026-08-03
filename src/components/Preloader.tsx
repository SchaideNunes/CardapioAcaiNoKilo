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

  // Açaí bowl SVG fill level
  const fillHeight = progress;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#3d1b34] flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Ambient glow */}
      <div className="absolute w-72 h-72 bg-primary/15 rounded-full blur-[100px] animate-pulse" />

      {/* Logo */}
      <img
        src="/assets/Logo açai.webp"
        alt="Logo Açaí"
        className="w-24 h-24 md:w-32 md:h-32 object-contain mix-blend-screen mb-6 animate-in fade-in zoom-in-75 duration-700"
      />

      {/* Açaí Bowl with filling animation */}
      <div className="relative w-36 h-36 md:w-44 md:h-44 mb-6">
        <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="bowlClip">
              {/* Bowl shape - a rounded trapezoid */}
              <path d="M30,70 Q30,60 45,58 L155,58 Q170,60 170,70 L160,155 Q155,175 100,178 Q45,175 40,155 Z" />
            </clipPath>
            <linearGradient id="acaiGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5B2D8E" />
              <stop offset="40%" stopColor="#3D1050" />
              <stop offset="100%" stopColor="#2A0A38" />
            </linearGradient>
            <linearGradient id="bowlGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#D8AC4F" />
              <stop offset="100%" stopColor="#A67C2E" />
            </linearGradient>
          </defs>

          {/* Bowl outline */}
          <path
            d="M28,68 Q28,56 46,54 L154,54 Q172,56 172,68 L162,157 Q156,180 100,183 Q44,180 38,157 Z"
            fill="none"
            stroke="url(#bowlGradient)"
            strokeWidth="3.5"
            opacity="0.9"
          />

          {/* Açaí liquid fill - rises from bottom */}
          <g clipPath="url(#bowlClip)">
            <rect
              x="25"
              y={180 - (fillHeight * 1.25)}
              width="150"
              height="130"
              fill="url(#acaiGradient)"
              className="transition-all duration-100"
            />
            {/* Wavy surface on top of the liquid */}
            <path
              d={`M25,${180 - (fillHeight * 1.25)} Q65,${176 - (fillHeight * 1.25)} 100,${180 - (fillHeight * 1.25)} Q135,${184 - (fillHeight * 1.25)} 175,${180 - (fillHeight * 1.25)} L175,${182 - (fillHeight * 1.25)} Q135,${186 - (fillHeight * 1.25)} 100,${182 - (fillHeight * 1.25)} Q65,${178 - (fillHeight * 1.25)} 25,${182 - (fillHeight * 1.25)} Z`}
              fill="#6B3FA0"
              opacity="0.5"
            >
              <animate
                attributeName="d"
                dur="2s"
                repeatCount="indefinite"
                values={`
                  M25,${180 - (fillHeight * 1.25)} Q65,${176 - (fillHeight * 1.25)} 100,${180 - (fillHeight * 1.25)} Q135,${184 - (fillHeight * 1.25)} 175,${180 - (fillHeight * 1.25)} L175,${182 - (fillHeight * 1.25)} Q135,${186 - (fillHeight * 1.25)} 100,${182 - (fillHeight * 1.25)} Q65,${178 - (fillHeight * 1.25)} 25,${182 - (fillHeight * 1.25)} Z;
                  M25,${180 - (fillHeight * 1.25)} Q65,${184 - (fillHeight * 1.25)} 100,${180 - (fillHeight * 1.25)} Q135,${176 - (fillHeight * 1.25)} 175,${180 - (fillHeight * 1.25)} L175,${182 - (fillHeight * 1.25)} Q135,${178 - (fillHeight * 1.25)} 100,${182 - (fillHeight * 1.25)} Q65,${186 - (fillHeight * 1.25)} 25,${182 - (fillHeight * 1.25)} Z;
                  M25,${180 - (fillHeight * 1.25)} Q65,${176 - (fillHeight * 1.25)} 100,${180 - (fillHeight * 1.25)} Q135,${184 - (fillHeight * 1.25)} 175,${180 - (fillHeight * 1.25)} L175,${182 - (fillHeight * 1.25)} Q135,${186 - (fillHeight * 1.25)} 100,${182 - (fillHeight * 1.25)} Q65,${178 - (fillHeight * 1.25)} 25,${182 - (fillHeight * 1.25)} Z
                `}
              />
            </path>
          </g>

          {/* Toppings that appear as bowl fills */}
          {progress > 60 && (
            <g opacity={Math.min((progress - 60) / 20, 1)} className="transition-opacity duration-300">
              {/* Small berry circles on top */}
              <circle cx="80" cy={74 - (fillHeight * 0.08)} r="5" fill="#D94F6B" opacity="0.9" />
              <circle cx="95" cy={70 - (fillHeight * 0.08)} r="4" fill="#E8637A" opacity="0.8" />
              <circle cx="115" cy={72 - (fillHeight * 0.08)} r="5.5" fill="#D94F6B" opacity="0.85" />
              <circle cx="105" cy={78 - (fillHeight * 0.08)} r="3.5" fill="#C4405B" opacity="0.9" />
              {/* Banana slices */}
              <ellipse cx="88" cy={76 - (fillHeight * 0.08)} rx="7" ry="4" fill="#F5D76E" opacity="0.85" transform={`rotate(-15 88 ${76 - (fillHeight * 0.08)})`} />
              <ellipse cx="120" cy={76 - (fillHeight * 0.08)} rx="6" ry="3.5" fill="#F5D76E" opacity="0.8" transform={`rotate(20 120 ${76 - (fillHeight * 0.08)})`} />
            </g>
          )}
        </svg>
      </div>

      {/* Percentage */}
      <div className="flex flex-col items-center gap-2">
        <span className="font-heading text-5xl md:text-6xl text-primary tabular-nums tracking-wider">
          {progress}%
        </span>
        <span className="text-white/40 text-xs font-bold uppercase tracking-[0.3em] font-sans">
          Preparando seu açaí...
        </span>
      </div>

      {/* Small floating açaí berries decoration */}
      <div className="absolute top-[15%] left-[10%] w-3 h-3 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '2.5s' }} />
      <div className="absolute top-[25%] right-[15%] w-2 h-2 bg-secondary/40 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3s' }} />
      <div className="absolute bottom-[20%] left-[20%] w-2.5 h-2.5 bg-primary/20 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.8s' }} />
      <div className="absolute bottom-[30%] right-[10%] w-2 h-2 bg-secondary/30 rounded-full animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '2.2s' }} />
    </div>
  );
}
