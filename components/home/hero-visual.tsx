/**
 * Minimal vector hero decoration — crisp at any DPI (SVG), no external bitmaps.
 */
export function HeroVisual() {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-[18%] -z-0 h-[min(52vw,28rem)] w-[min(92vw,44rem)] -translate-x-1/2 opacity-[0.22] dark:opacity-[0.28] sm:top-[20%]"
      aria-hidden
    >
      <svg
        viewBox="0 0 800 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full text-foreground"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="hv-a" x1="0" y1="0" x2="800" y2="420" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" stopOpacity="0.14" />
            <stop offset="0.45" stopColor="currentColor" stopOpacity="0.06" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hv-b" x1="400" y1="80" x2="400" y2="380" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse cx="400" cy="220" rx="320" ry="160" stroke="url(#hv-a)" strokeWidth="1" />
        <ellipse cx="400" cy="220" rx="240" ry="120" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.75" />
        <path
          d="M120 280 Q400 120 680 280"
          stroke="url(#hv-b)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path
          d="M160 320 Q400 200 640 320"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="0.75"
          strokeLinecap="round"
        />
        <circle cx="400" cy="200" r="3" fill="currentColor" fillOpacity="0.35" />
        <circle cx="260" cy="260" r="2" fill="currentColor" fillOpacity="0.25" />
        <circle cx="540" cy="260" r="2" fill="currentColor" fillOpacity="0.25" />
      </svg>
    </div>
  );
}
