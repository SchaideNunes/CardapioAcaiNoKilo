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

const TOTAL_DURATION = 3200; // 3.2s smooth assembly

export default function Preloader({ onFinished }: { onFinished: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const startTime = useRef(Date.now());
  const imagesLoaded = useRef(0);

  useEffect(() => {
    // Start preloading critical images
    PRELOAD_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => { imagesLoaded.current++; };
      img.onerror = () => { imagesLoaded.current++; };
    });

    // Animate progress from 0 to 100
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const timeProgress = Math.min(elapsed / TOTAL_DURATION, 1);
      // Smooth ease-out curve
      const eased = 1 - Math.pow(1 - timeProgress, 2.5);
      const pct = Math.round(eased * 100);
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(onFinished, 600);
        }, 400);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [onFinished]);

  // Stroke offset calculations (100 -> 0)
  const sunProgress = Math.min(Math.max(progress / 35, 0), 1);
  const acaiProgress = Math.min(Math.max((progress - 20) / 40, 0), 1);
  const noProgress = Math.min(Math.max((progress - 45) / 35, 0), 1);
  const kiloProgress = Math.min(Math.max((progress - 60) / 35, 0), 1);
  const fillOpacity = progress > 75 ? (progress - 75) / 25 : 0;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#1F0D1A] flex flex-col items-center justify-center transition-all duration-700 overflow-hidden ${
        fadeOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient Pulsing Glow behind the Logo */}
      <div 
        className="absolute w-80 h-80 md:w-[480px] md:h-[480px] bg-primary/15 rounded-full blur-[100px] transition-all duration-500 pointer-events-none"
        style={{ transform: `scale(${0.8 + (progress / 100) * 0.4})` }}
      />
      <div 
        className="absolute w-64 h-64 bg-[#F58220]/15 rounded-full blur-[90px] transition-all duration-500 pointer-events-none"
        style={{ transform: `scale(${0.6 + (sunProgress) * 0.5}) translate(20%, -20%)` }}
      />

      {/* SVG Animated Logo Assembly */}
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 z-10 flex items-center justify-center">
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full drop-shadow-[0_10px_35px_rgba(0,0,0,0.6)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Defs for Glows and Gradients */}
          <defs>
            <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* ================= 1. SUN & RAYS (Orange #F58220) ================= */}
          <g filter={progress > 60 ? "url(#glow-orange)" : undefined}>
            {/* Top Wavy Ray */}
            <path
              d="M 345 42 Q 332 58 346 72 Q 332 88 344 105"
              stroke="#F58220"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="100"
              strokeDashoffset={100 * (1 - sunProgress)}
            />

            {/* Middle Right Wavy Ray */}
            <path
              d="M 390 168 Q 412 150 432 165 Q 452 148 472 156"
              stroke="#F58220"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="120"
              strokeDashoffset={120 * (1 - sunProgress)}
            />

            {/* Bottom Right Wavy Ray */}
            <path
              d="M 378 262 Q 402 278 418 298 Q 436 288 456 312"
              stroke="#F58220"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="120"
              strokeDashoffset={120 * (1 - sunProgress)}
            />

            {/* Spiral Core of the Sun */}
            <path
              d="M 305 210 C 300 195, 315 185, 330 190 C 350 195, 355 225, 340 245 C 320 270, 275 260, 265 220 C 255 170, 310 120, 365 130 C 415 140, 440 200, 420 255 C 405 295, 360 325, 315 320"
              stroke="#F58220"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="600"
              strokeDashoffset={600 * (1 - sunProgress)}
            />
          </g>

          {/* ================= 2. "AÇAÍ" (Top Word, Cream/Off-White #EFEBE4) ================= */}
          <g stroke="#EFEBE4" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round">
            {/* Letter 'A' (1) */}
            <path
              d="M 95 280 L 115 90 L 140 255"
              strokeDasharray="400"
              strokeDashoffset={400 * (1 - acaiProgress)}
            />
            <path
              d="M 85 215 L 135 210"
              strokeDasharray="100"
              strokeDashoffset={100 * (1 - acaiProgress)}
            />

            {/* Letter 'Ç' with Cedilla */}
            <path
              d="M 205 105 C 155 80, 135 150, 145 220 C 152 260, 185 265, 205 240"
              strokeDasharray="300"
              strokeDashoffset={300 * (1 - acaiProgress)}
            />
            <path
              d="M 175 255 Q 170 275 178 288"
              strokeDasharray="50"
              strokeDashoffset={50 * (1 - acaiProgress)}
            />

            {/* Letter 'A' (2) */}
            <path
              d="M 195 255 L 235 85 L 280 270"
              strokeDasharray="400"
              strokeDashoffset={400 * (1 - acaiProgress)}
            />
            <path
              d="M 190 205 L 270 200"
              strokeDasharray="100"
              strokeDashoffset={100 * (1 - acaiProgress)}
            />

            {/* Letter 'Í' with Accent */}
            <path
              d="M 260 90 L 255 265"
              strokeDasharray="200"
              strokeDashoffset={200 * (1 - acaiProgress)}
            />
            <path
              d="M 270 70 L 285 40"
              strokeDasharray="50"
              strokeDashoffset={50 * (1 - acaiProgress)}
            />
          </g>

          {/* ================= 3. "NO" (Middle Left, Orange #F58220) ================= */}
          <g stroke="#F58220" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round">
            {/* Letter 'N' */}
            <path
              d="M 45 390 L 52 285 L 94 388 L 98 280"
              strokeDasharray="400"
              strokeDashoffset={400 * (1 - noProgress)}
            />

            {/* Letter 'O' */}
            <path
              d="M 108 335 C 108 290, 145 285, 145 335 C 145 385, 108 385, 108 335 Z"
              strokeDasharray="250"
              strokeDashoffset={250 * (1 - noProgress)}
            />
          </g>

          {/* ================= 4. "KILO" (Bottom, Cream/Off-White #EFEBE4) ================= */}
          <g stroke="#EFEBE4" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round">
            {/* Letter 'K' */}
            <path
              d="M 190 290 L 155 480"
              strokeDasharray="200"
              strokeDashoffset={200 * (1 - kiloProgress)}
            />
            <path
              d="M 168 395 L 215 320"
              strokeDasharray="120"
              strokeDashoffset={120 * (1 - kiloProgress)}
            />
            <path
              d="M 172 385 L 230 480"
              strokeDasharray="140"
              strokeDashoffset={140 * (1 - kiloProgress)}
            />

            {/* Letter 'I' */}
            <circle
              cx="205"
              cy="290"
              r="7"
              fill="#EFEBE4"
              opacity={kiloProgress}
            />
            <path
              d="M 200 315 L 195 420"
              strokeDasharray="120"
              strokeDashoffset={120 * (1 - kiloProgress)}
            />

            {/* Letter 'L' */}
            <path
              d="M 230 260 L 235 455 L 290 445"
              strokeDasharray="250"
              strokeDashoffset={250 * (1 - kiloProgress)}
            />

            {/* Letter 'O' (Tall Loop) */}
            <path
              d="M 285 365 C 285 255, 320 255, 320 365 C 320 475, 285 475, 285 365 Z"
              strokeDasharray="350"
              strokeDashoffset={350 * (1 - kiloProgress)}
            />
          </g>

          {/* ================= 5. TRADEMARK (R) ================= */}
          <g opacity={progress > 70 ? (progress - 70) / 30 : 0} stroke="#EFEBE4" strokeWidth="2.5" fill="none">
            <circle cx="345" cy="320" r="10" />
            <text
              x="345"
              y="323.5"
              fill="#EFEBE4"
              fontSize="10"
              fontWeight="bold"
              fontFamily="Arial, sans-serif"
              textAnchor="middle"
              stroke="none"
            >
              R
            </text>
          </g>

          {/* ================= 6. FINAL SHIMMER / SOLID LOGO FADE-IN ================= */}
          <image
            href="/assets/Logo açai.webp"
            x="30"
            y="20"
            width="440"
            height="460"
            className="transition-opacity duration-700 pointer-events-none"
            style={{ opacity: fillOpacity }}
          />
        </svg>
      </div>

      {/* Progress Counter & Brand Status */}
      <div className="flex flex-col items-center gap-2 z-10 mt-4">
        <div className="flex items-baseline gap-1">
          <span className="font-heading text-4xl sm:text-5xl text-primary drop-shadow-[0_2px_15px_rgba(230,214,46,0.5)]">
            {progress}
          </span>
          <span className="font-heading text-xl text-primary/70">%</span>
        </div>

        {/* Status Text */}
        <span className="text-white/60 text-xs sm:text-sm tracking-[0.2em] uppercase font-sans font-medium transition-all duration-300">
          Preparando seu Açaí...
        </span>

        {/* Minimal Progress Line */}
        <div className="w-36 sm:w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-2">
          <div 
            className="h-full bg-gradient-to-r from-[#F58220] via-primary to-white rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
