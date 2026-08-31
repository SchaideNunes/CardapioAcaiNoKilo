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
              d="M 345 35 Q 332 55 346 72 Q 332 90 344 108"
              stroke="#F58220"
              strokeWidth="11"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="100"
              strokeDashoffset={100 * (1 - sunProgress)}
            />

            {/* Middle Right Wavy Ray */}
            <path
              d="M 390 168 Q 412 150 435 165 Q 455 148 475 156"
              stroke="#F58220"
              strokeWidth="11"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="120"
              strokeDashoffset={120 * (1 - sunProgress)}
            />

            {/* Bottom Right Wavy Ray */}
            <path
              d="M 378 262 Q 402 278 418 298 Q 436 288 456 312"
              stroke="#F58220"
              strokeWidth="11"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="120"
              strokeDashoffset={120 * (1 - sunProgress)}
            />

            {/* Spiral Core of the Sun */}
            <path
              d="M 305 210 C 300 195, 315 185, 330 190 C 350 195, 355 225, 340 245 C 320 270, 275 260, 265 220 C 255 170, 310 120, 365 130 C 415 140, 440 200, 420 255 C 405 295, 360 325, 315 320"
              stroke="#F58220"
              strokeWidth="13"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="600"
              strokeDashoffset={600 * (1 - sunProgress)}
            />
          </g>

          {/* ================= 2. "AÇAÍ" (Top Word, Cream/Off-White #EFEBE4) ================= */}
          <g stroke="#EFEBE4" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
            {/* Letter 'A' (1) */}
            <path
              d="M 60 280 L 95 90 L 122 260"
              strokeDasharray="400"
              strokeDashoffset={400 * (1 - acaiProgress)}
            />
            <path
              d="M 75 205 L 115 200"
              strokeDasharray="100"
              strokeDashoffset={100 * (1 - acaiProgress)}
            />

            {/* Letter 'Ç' with Cedilla */}
            <path
              d="M 195 110 C 145 90, 132 155, 142 220 C 150 255, 178 258, 195 235"
              strokeDasharray="300"
              strokeDashoffset={300 * (1 - acaiProgress)}
            />
            <path
              d="M 165 242 Q 162 260 170 270"
              strokeDasharray="50"
              strokeDashoffset={50 * (1 - acaiProgress)}
            />

            {/* Letter 'A' (2) */}
            <path
              d="M 210 260 L 242 85 L 275 270"
              strokeDasharray="400"
              strokeDashoffset={400 * (1 - acaiProgress)}
            />
            <path
              d="M 220 205 L 265 200"
              strokeDasharray="100"
              strokeDashoffset={100 * (1 - acaiProgress)}
            />

            {/* Letter 'Í' with Accent */}
            <path
              d="M 288 90 L 286 270"
              strokeDasharray="200"
              strokeDashoffset={200 * (1 - acaiProgress)}
            />
            <path
              d="M 292 75 L 305 35"
              strokeDasharray="50"
              strokeDashoffset={50 * (1 - acaiProgress)}
            />
          </g>

          {/* ================= 3. "NO" (Middle Left, Orange #F58220) ================= */}
          <g stroke="#F58220" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
            {/* Letter 'N' */}
            <path
              d="M 38 390 L 42 298 L 76 385 L 80 285"
              strokeDasharray="400"
              strokeDashoffset={400 * (1 - noProgress)}
            />

            {/* Letter 'O' */}
            <path
              d="M 110 285 C 88 285, 88 385, 110 385 C 135 385, 135 285, 110 285 Z"
              strokeDasharray="250"
              strokeDashoffset={250 * (1 - noProgress)}
            />
          </g>

          {/* ================= 4. "KILO" (Bottom, Cream/Off-White #EFEBE4) ================= */}
          <g stroke="#EFEBE4" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
            {/* Letter 'K' */}
            <path
              d="M 180 265 L 145 480"
              strokeDasharray="250"
              strokeDashoffset={250 * (1 - kiloProgress)}
            />
            <path
              d="M 160 385 L 210 315"
              strokeDasharray="120"
              strokeDashoffset={120 * (1 - kiloProgress)}
            />
            <path
              d="M 165 380 L 215 480"
              strokeDasharray="140"
              strokeDashoffset={140 * (1 - kiloProgress)}
            />

            {/* Letter 'I' */}
            <circle
              cx="230"
              cy="285"
              r="5"
              fill="#EFEBE4"
              opacity={kiloProgress}
            />
            <path
              d="M 230 310 L 230 440"
              strokeDasharray="150"
              strokeDashoffset={150 * (1 - kiloProgress)}
            />

            {/* Letter 'L' */}
            <path
              d="M 265 255 L 258 455 L 305 445"
              strokeDasharray="250"
              strokeDashoffset={250 * (1 - kiloProgress)}
            />

            {/* Letter 'O' (Tall Loop) */}
            <path
              d="M 335 250 C 308 250, 308 430, 335 430 C 365 430, 365 250, 335 250 Z"
              strokeDasharray="350"
              strokeDashoffset={350 * (1 - kiloProgress)}
            />
          </g>

          {/* ================= 5. TRADEMARK (R) ================= */}
          <g opacity={progress > 70 ? (progress - 70) / 30 : 0} stroke="#EFEBE4" strokeWidth="2" fill="none">
            <circle cx="375" cy="320" r="9" />
            <text
              x="375"
              y="323"
              fill="#EFEBE4"
              fontSize="9"
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
