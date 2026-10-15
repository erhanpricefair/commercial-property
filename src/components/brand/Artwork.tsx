/**
 * NewPF original artwork.
 *
 * Builder marketing restrictions mean no property photographs and nothing that
 * could identify a restricted home. These compositions are drawn from first
 * principles — generic townhouse massing, brick bond, street trees, drafting
 * marks — so they carry the architectural mood without depicting any real
 * building. Every one is labelled illustrative where it appears.
 *
 * Pure SVG, no client JS. Colours are hard-coded from the brand palette
 * (tailwind.config.ts) because SVG presentation attributes can't read Tailwind
 * classes.
 */

const C = {
  ivory: "#F3EFE6",
  paper: "#FAF8F3",
  limestone: "#E3DBCB",
  stone: "#CFC5B1",
  charcoal: "#22221F",
  graphite: "#3B3A35",
  olive: "#545839",
  oliveSoft: "#8C8D6A",
  brick: "#9A5B43",
};

/** Stretcher-bond brick pattern, for reuse inside any SVG. */
function BrickPattern({ id, colour = C.brick, mortar = C.limestone, scale = 1 }: {
  id: string;
  colour?: string;
  mortar?: string;
  scale?: number;
}) {
  const w = 24 * scale;
  const h = 8 * scale;
  return (
    <pattern id={id} width={w} height={h * 2} patternUnits="userSpaceOnUse">
      <rect width={w} height={h * 2} fill={mortar} />
      <rect x={0.6} y={0.6} width={w - 1.2} height={h - 1.2} fill={colour} />
      <rect x={-w / 2 + 0.6} y={h + 0.6} width={w - 1.2} height={h - 1.2} fill={colour} />
      <rect x={w / 2 + 0.6} y={h + 0.6} width={w - 1.2} height={h - 1.2} fill={colour} />
    </pattern>
  );
}

/**
 * Hero composition: a drafted elevation of a short row of townhouses — one
 * skillion, one gable in brick, one flat-roofed with a timber screen — with a
 * street tree, ground hatching and drafting annotations. Deliberately generic.
 */
export function TerraceElevation({ className }: { className?: string }) {
  const line = { stroke: C.charcoal, strokeWidth: 1.4, strokeLinejoin: "round" as const };
  return (
    <svg
      viewBox="0 0 600 720"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      role="img"
      aria-labelledby="terrace-title"
    >
      <title id="terrace-title">Illustration: elevation drawing of a row of three townhouses with a street tree</title>
      <defs>
        <BrickPattern id="hero-brick" />
        <pattern id="hero-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" stroke={C.graphite} strokeWidth="0.8" />
        </pattern>
        <pattern id="hero-battens" width="9" height="10" patternUnits="userSpaceOnUse">
          <rect width="9" height="10" fill={C.paper} />
          <line x1="2" y1="0" x2="2" y2="10" stroke={C.graphite} strokeWidth="1.6" />
        </pattern>
        <clipPath id="hero-frame">
          <rect width="600" height="720" />
        </clipPath>
      </defs>

      <g clipPath="url(#hero-frame)">
        <rect width="600" height="720" fill={C.limestone} />

        {/* Drafting grid */}
        {Array.from({ length: 15 }, (_, i) => (
          <line key={`v${i}`} x1={i * 40 + 20} y1="0" x2={i * 40 + 20} y2="720" stroke={C.stone} strokeWidth="0.6" />
        ))}
        {Array.from({ length: 18 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 40 + 20} x2="600" y2={i * 40 + 20} stroke={C.stone} strokeWidth="0.6" />
        ))}

        {/* Sun path — a drafted arc and disc rather than a cartoon sun */}
        <path d="M60 470 A 270 270 0 0 1 560 300" fill="none" stroke={C.graphite} strokeWidth="0.9" strokeDasharray="3 6" />
        <circle cx="468" cy="168" r="46" fill="none" stroke={C.charcoal} strokeWidth="1.2" />
        <circle cx="468" cy="168" r="30" fill={C.paper} />

        {/* Unit A — skillion roof, rendered */}
        <path d="M80 600 V318 L222 276 V600 Z" fill={C.paper} {...line} />
        <rect x="104" y="350" width="40" height="84" fill={C.graphite} />
        <line x1="124" y1="350" x2="124" y2="434" stroke={C.paper} strokeWidth="1.2" />
        <rect x="160" y="350" width="40" height="84" fill={C.graphite} />
        <rect x="160" y="480" width="44" height="120" fill={C.olive} />

        {/* Unit B — gable, face brick */}
        <path d="M222 600 V330 L298 262 L374 330 V600 Z" fill="url(#hero-brick)" {...line} />
        <path d="M222 330 L298 262 L374 330" fill="none" stroke={C.charcoal} strokeWidth="3" strokeLinejoin="round" />
        <rect x="270" y="300" width="56" height="30" fill={C.paper} stroke={C.charcoal} strokeWidth="1.2" />
        <rect x="252" y="372" width="92" height="74" fill={C.graphite} stroke={C.paper} strokeWidth="4" />
        <line x1="298" y1="372" x2="298" y2="446" stroke={C.paper} strokeWidth="1.5" />
        <rect x="246" y="488" width="104" height="112" fill={C.paper} stroke={C.charcoal} strokeWidth="1.2" />
        <rect x="282" y="510" width="34" height="90" fill={C.charcoal} />

        {/* Unit C — flat roof, parapet, timber battens */}
        <rect x="374" y="298" width="152" height="302" fill={C.paper} {...line} />
        <line x1="368" y1="298" x2="532" y2="298" stroke={C.charcoal} strokeWidth="4" />
        <rect x="396" y="330" width="108" height="118" fill="url(#hero-battens)" stroke={C.charcoal} strokeWidth="1.2" />
        <rect x="396" y="486" width="52" height="114" fill={C.graphite} />
        <rect x="462" y="486" width="42" height="72" fill={C.limestone} stroke={C.charcoal} strokeWidth="1.2" />

        {/* Street tree — drawn the way an elevation shows one: canopy outline,
            trunk, a little texture */}
        <line x1="128" y1="600" x2="128" y2="512" stroke={C.charcoal} strokeWidth="2.2" />
        <circle cx="128" cy="468" r="62" fill={C.olive} opacity="0.92" />
        <circle cx="128" cy="468" r="62" fill="none" stroke={C.charcoal} strokeWidth="1" />
        <path d="M96 450 q12 -10 24 0 M122 486 q12 -10 24 0 M104 494 q8 -7 16 0 M136 438 q8 -7 16 0" fill="none" stroke={C.paper} strokeWidth="1" opacity="0.6" />

        {/* Ground */}
        <rect x="0" y="600" width="600" height="120" fill={C.stone} opacity="0.55" />
        <rect x="0" y="600" width="600" height="26" fill="url(#hero-hatch)" opacity="0.5" />
        <line x1="0" y1="600" x2="600" y2="600" stroke={C.charcoal} strokeWidth="2.5" />

        {/* Dimension line across the row */}
        <g stroke={C.graphite} strokeWidth="1">
          <line x1="80" y1="232" x2="526" y2="232" />
          {[80, 222, 374, 526].map((x) => (
            <line key={x} x1={x} y1="224" x2={x} y2="240" />
          ))}
        </g>

        {/* North point */}
        <g transform="translate(528 78)">
          <circle r="16" fill="none" stroke={C.graphite} strokeWidth="1" />
          <path d="M0 -12 L5 6 L0 2 L-5 6 Z" fill={C.charcoal} />
        </g>

        {/* Scale bar */}
        <g transform="translate(40 660)" fill={C.charcoal}>
          <rect width="30" height="5" />
          <rect x="30" width="30" height="5" fill="none" stroke={C.charcoal} strokeWidth="1" />
          <rect x="60" width="30" height="5" />
        </g>
      </g>
    </svg>
  );
}

/**
 * A long, single-weight streetscape line: a rhythm of generic rooflines and
 * street trees. Used full-bleed as a section edge.
 */
export function Streetscape({ className, stroke = C.ivory }: { className?: string; stroke?: string }) {
  // Deterministic rhythm of facades: [width, roof type, height].
  const units: [number, "gable" | "skillion" | "flat" | "tree", number][] = [
    [70, "gable", 70], [56, "flat", 58], [26, "tree", 40], [64, "skillion", 76], [70, "gable", 66],
    [58, "flat", 82], [26, "tree", 46], [74, "gable", 74], [60, "skillion", 62], [56, "flat", 70],
    [26, "tree", 38], [68, "gable", 80], [62, "flat", 60], [64, "skillion", 72], [26, "tree", 44],
    [72, "gable", 68], [56, "flat", 78], [66, "skillion", 64], [70, "gable", 72], [26, "tree", 42],
    [60, "flat", 66], [68, "gable", 76],
  ];
  const ground = 110;
  let x = 0;
  const parts: React.ReactNode[] = [];
  units.forEach(([w, kind, h], i) => {
    const top = ground - h;
    if (kind === "tree") {
      parts.push(
        <g key={i}>
          <line x1={x + w / 2} y1={ground} x2={x + w / 2} y2={top + 18} />
          <circle cx={x + w / 2} cy={top + 6} r={w / 2 + 4} />
        </g>,
      );
    } else {
      const d =
        kind === "gable"
          ? `M${x} ${ground} V${top + 18} L${x + w / 2} ${top} L${x + w} ${top + 18} V${ground}`
          : kind === "skillion"
            ? `M${x} ${ground} V${top + 14} L${x + w} ${top} V${ground}`
            : `M${x} ${ground} V${top} H${x + w} V${ground}`;
      parts.push(
        <g key={i}>
          <path d={d} />
          <rect x={x + w * 0.22} y={top + 26} width={w * 0.2} height={22} />
          <rect x={x + w * 0.58} y={top + 26} width={w * 0.2} height={22} />
          <rect x={x + w * 0.36} y={ground - 30} width={w * 0.24} height={30} />
        </g>,
      );
    }
    x += w + 6;
  });

  return (
    <svg viewBox={`0 0 ${x} 120`} preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      <g fill="none" stroke={stroke} strokeWidth="1.3" strokeLinejoin="round" opacity="0.85">
        {parts}
        <line x1="0" y1={ground} x2={x} y2={ground} strokeWidth="1.6" />
      </g>
    </svg>
  );
}
