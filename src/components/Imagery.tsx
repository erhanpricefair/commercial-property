/**
 * Generic, illustrative commercial-property imagery.
 *
 * These are drawn as abstract SVG compositions rather than photographs on
 * purpose: a photograph of a real building risks identifying a development,
 * which is exactly what this platform must never do. They also cost nothing to
 * load, which keeps the site fast on mobile.
 */

type ArtProps = { className?: string };

export function WarehouseArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 400 260" className={className} role="img" aria-label="Illustration of a generic warehouse building">
      <defs>
        <linearGradient id="wh-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EDEAE4" />
          <stop offset="100%" stopColor="#F4F2EE" />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#wh-sky)" />
      <rect x="30" y="96" width="250" height="112" fill="#2C323A" />
      <path d="M30 96 L155 52 L280 96 Z" fill="#414954" />
      <rect x="60" y="132" width="60" height="76" fill="#F4F2EE" />
      <rect x="60" y="132" width="60" height="8" fill="#9C7A46" />
      <g fill="#5C6672">
        <rect x="140" y="130" width="26" height="20" />
        <rect x="176" y="130" width="26" height="20" />
        <rect x="212" y="130" width="26" height="20" />
        <rect x="140" y="164" width="26" height="20" />
        <rect x="176" y="164" width="26" height="20" />
        <rect x="212" y="164" width="26" height="20" />
      </g>
      <rect x="296" y="128" width="74" height="80" fill="#414954" />
      <path d="M296 128 L333 106 L370 128 Z" fill="#5C6672" />
      <rect x="0" y="208" width="400" height="52" fill="#E4E8EC" />
      <rect x="0" y="208" width="400" height="3" fill="#C9D0D8" />
      <g stroke="#C9D0D8" strokeWidth="3" strokeDasharray="14 12">
        <line x1="0" y1="238" x2="400" y2="238" />
      </g>
    </svg>
  );
}

export function IndustrialArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 400 260" className={className} role="img" aria-label="Illustration of a generic industrial estate">
      <rect width="400" height="260" fill="#F4F2EE" />
      <g fill="#414954">
        <rect x="24" y="120" width="104" height="88" />
        <rect x="148" y="96" width="104" height="112" />
        <rect x="272" y="140" width="104" height="68" />
      </g>
      <g fill="#2C323A">
        <path d="M24 120 L76 92 L128 120 Z" />
        <path d="M148 96 L200 66 L252 96 Z" />
        <path d="M272 140 L324 116 L376 140 Z" />
      </g>
      <g fill="#F4F2EE">
        <rect x="46" y="152" width="26" height="56" />
        <rect x="170" y="132" width="30" height="76" />
        <rect x="294" y="166" width="26" height="42" />
      </g>
      <g fill="#9C7A46">
        <rect x="46" y="152" width="26" height="6" />
        <rect x="170" y="132" width="30" height="6" />
        <rect x="294" y="166" width="26" height="6" />
      </g>
      <rect x="0" y="208" width="400" height="52" fill="#E4E8EC" />
    </svg>
  );
}

export function StorageArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 400 260" className={className} role="img" aria-label="Illustration of generic storage units">
      <rect width="400" height="260" fill="#EDEAE4" />
      <rect x="20" y="80" width="360" height="128" fill="#2C323A" />
      <path d="M20 80 L200 44 L380 80 Z" fill="#414954" />
      <g fill="#F1F3F5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={38 + i * 58} width="44" y="112" height="96" />
        ))}
      </g>
      <g stroke="#C9D0D8" strokeWidth="2">
        {[0, 1, 2, 3, 4, 5].map((i) =>
          [0, 1, 2, 3].map((j) => (
            <line key={`${i}-${j}`} x1={38 + i * 58} y1={128 + j * 20} x2={82 + i * 58} y2={128 + j * 20} />
          )),
        )}
      </g>
      <g fill="#9C7A46">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={38 + i * 58} width="44" y="112" height="5" />
        ))}
      </g>
      <rect x="0" y="208" width="400" height="52" fill="#E4E8EC" />
    </svg>
  );
}

export function CommercialArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 400 260" className={className} role="img" aria-label="Illustration of a generic commercial building">
      <rect width="400" height="260" fill="#F4F2EE" />
      <rect x="56" y="48" width="128" height="160" fill="#2C323A" />
      <rect x="200" y="86" width="148" height="122" fill="#414954" />
      <g fill="#EDEAE4">
        {[0, 1, 2, 3, 4].map((row) =>
          [0, 1, 2].map((col) => (
            <rect key={`a${row}${col}`} x={72 + col * 36} y={66 + row * 28} width="24" height="18" />
          )),
        )}
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <rect key={`b${row}${col}`} x={214 + col * 34} y={104 + row * 26} width="24" height="16" />
          )),
        )}
      </g>
      <rect x="56" y="176" width="128" height="32" fill="#9C7A46" opacity="0.9" />
      <rect x="0" y="208" width="400" height="52" fill="#E4E8EC" />
    </svg>
  );
}

export function StreetscapeArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-label="Illustration of a generic commercial streetscape">
      <defs>
        <linearGradient id="st-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F1F3F5" />
          <stop offset="100%" stopColor="#E4E8EC" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#st-sky)" />
      <g fill="#C9D0D8">
        <rect x="0" y="90" width="70" height="150" />
        <rect x="330" y="70" width="70" height="170" />
      </g>
      <g fill="#414954">
        <rect x="76" y="120" width="88" height="120" />
        <rect x="172" y="86" width="72" height="154" />
        <rect x="252" y="132" width="72" height="108" />
      </g>
      <g fill="#EDEAE4" opacity="0.85">
        {[0, 1, 2, 3].map((row) =>
          [0, 1].map((col) => (
            <rect key={`c${row}${col}`} x={92 + col * 40} y={136 + row * 26} width="26" height="16" />
          )),
        )}
        {[0, 1, 2, 3, 4].map((row) => (
          <rect key={`d${row}`} x={186} y={102 + row * 26} width="44" height="16" />
        ))}
        {[0, 1, 2].map((row) =>
          [0, 1].map((col) => (
            <rect key={`e${row}${col}`} x={266 + col * 32} y={150 + row * 26} width="22" height="16" />
          )),
        )}
      </g>
      <rect x="0" y="240" width="400" height="60" fill="#D6DBE1" />
      <rect x="0" y="240" width="400" height="4" fill="#9C7A46" opacity="0.5" />
      <g stroke="#F1F3F5" strokeWidth="4" strokeDasharray="20 16">
        <line x1="0" y1="274" x2="400" y2="274" />
      </g>
    </svg>
  );
}

/** Quiet decorative panel used behind hero and CTA blocks. */
export function BlueprintPattern({ className }: ArtProps) {
  return (
    <svg className={className} aria-hidden="true" focusable="false">
      <defs>
        <pattern id="blueprint-grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M48 0H0V48" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
    </svg>
  );
}

export const CATEGORY_ART = {
  small_commercial: CommercialArt,
  warehouse: WarehouseArt,
  storage: StorageArt,
  income: IndustrialArt,
} as const;
