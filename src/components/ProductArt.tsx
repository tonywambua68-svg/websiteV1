import type { ArtKind } from "../data/products";

/**
 * Imara's product imagery system.
 *
 * Real studio photography is used wherever available (KIND_PHOTO below). Each
 * shot is a transparent PNG, so it floats on the same tinted studio gradient
 * the brand uses everywhere — light or dark — keeping the catalogue cohesive.
 *
 * Any product type WITHOUT a photo falls back to the in-house flat-vector
 * illustration, so nothing ever renders empty.
 *
 * TO USE YOUR OWN PHOTOS: save each shot to public/products/<kind>.png and
 * change the matching value below to "/products/<kind>.png".
 */

/** Real photography, keyed by product type. */
const KIND_PHOTO: Partial<Record<ArtKind, string>> = {
  laptop: "https://image.qwenlm.ai/generated-images/7b9aa60d-45d7-49a3-b759-157870bcaff0/_result.png",
  headphones: "https://image.qwenlm.ai/generated-images/9e468c35-cd6b-4b5b-b3ad-26b20ec5556e/_result.png",
  phone: "https://image.qwenlm.ai/generated-images/4f368810-1673-40ec-b27c-a54cef33f04f/_result.png",
  monitor: "https://image.qwenlm.ai/generated-images/f2f9a723-7cec-4a91-ba98-8bc4108791f0/_result.png",
  keyboard: "https://image.qwenlm.ai/generated-images/ff23bda5-d9e3-4f59-8a0d-941f464a6333/_result.png",
  speaker: "https://image.qwenlm.ai/generated-images/9aede0ed-66e4-42c9-8f32-bc830f69020c/_result.png",
  router: "https://image.qwenlm.ai/generated-images/fd036293-2b2d-4145-b494-cc686a2550ce/_result.png",
  earbuds: "https://image.qwenlm.ai/generated-images/6de62aa5-ac00-4b96-bccc-46afd1d9b5dd/_result.png",
  mouse: "https://image.qwenlm.ai/generated-images/6bde7622-93a0-4d41-bc9b-0ac8e9390187/_result.png",
  watch: "https://image.qwenlm.ai/generated-images/c742e17e-5f3b-425c-9e83-ef469f8483e1/_result.png",
};

const INK = "#0a1f1c";
const PINE = "#10312c";
const SCREEN = "#0e2b27";
const AMBER = "#f5a31a";

interface Props {
  kind: ArtKind;
  accent?: string;
  className?: string;
}

export default function ProductArt({ kind, accent = "#0b7a63", className = "" }: Props) {
  const photo = KIND_PHOTO[kind];
  if (photo) {
    return (
      <span className={`block aspect-[4/3] overflow-hidden ${className}`} aria-hidden="true">
        <img
          src={photo}
          alt=""
          loading="lazy"
          draggable={false}
          className="h-full w-full select-none object-contain drop-shadow-[0_16px_22px_rgba(10,31,28,0.22)]"
        />
      </span>
    );
  }
  return (
    <svg viewBox="0 0 240 180" className={className} role="img" aria-hidden="true">
      <ellipse cx="120" cy="160" rx="66" ry="8" fill="rgba(10,31,28,0.10)" />
      {art(kind, accent)}
    </svg>
  );
}

function art(kind: ArtKind, a: string) {
  switch (kind) {
    case "laptop":
      return (
        <g>
          <rect x="58" y="26" width="124" height="84" rx="7" fill={INK} />
          <rect x="64" y="32" width="112" height="68" rx="3" fill={SCREEN} />
          <rect x="72" y="42" width="42" height="6" rx="3" fill={a} />
          <rect x="72" y="54" width="28" height="4" rx="2" fill="#3d5f58" />
          <rect x="72" y="62" width="34" height="4" rx="2" fill="#3d5f58" />
          <g>
            <rect x="128" y="62" width="8" height="26" rx="2" fill={a} opacity="0.55" />
            <rect x="140" y="50" width="8" height="38" rx="2" fill={a} />
            <rect x="152" y="70" width="8" height="18" rx="2" fill={AMBER} />
            <rect x="164" y="56" width="8" height="32" rx="2" fill={a} opacity="0.75" />
          </g>
          <path d="M46 110h148l10 17a5 5 0 0 1-5 5H41a5 5 0 0 1-5-5Z" fill={PINE} />
          <rect x="98" y="116" width="44" height="7" rx="3.5" fill={INK} />
          <rect x="58" y="26" width="124" height="10" rx="7" fill="rgba(255,255,255,0.05)" />
        </g>
      );
    case "phone":
      return (
        <g>
          <rect x="88" y="20" width="64" height="132" rx="14" fill={INK} />
          <rect x="93" y="27" width="54" height="118" rx="9" fill={SCREEN} />
          <circle cx="120" cy="35" r="2.5" fill={INK} />
          <circle cx="108" cy="55" r="9" fill={a} />
          <rect x="122" y="49" width="20" height="5" rx="2.5" fill={a} opacity="0.8" />
          <rect x="122" y="58" width="14" height="4" rx="2" fill="#3d5f58" />
          <rect x="100" y="74" width="40" height="26" rx="5" fill={a} opacity="0.25" />
          <rect x="100" y="74" width="40" height="6" rx="3" fill={a} opacity="0.6" />
          <rect x="104" y="128" width="32" height="5" rx="2.5" fill={AMBER} />
          <rect x="152" y="50" width="3" height="20" rx="1.5" fill={PINE} />
        </g>
      );
    case "tablet":
      return (
        <g>
          <rect x="50" y="32" width="140" height="104" rx="11" fill={INK} />
          <rect x="57" y="39" width="126" height="90" rx="5" fill={SCREEN} />
          <circle cx="186.5" cy="84" r="2.5" fill={PINE} />
          <rect x="66" y="50" width="50" height="8" rx="4" fill={a} />
          <rect x="66" y="64" width="36" height="5" rx="2.5" fill="#3d5f58" />
          <g>
            <rect x="66" y="80" width="26" height="36" rx="4" fill={a} opacity="0.3" />
            <rect x="98" y="80" width="26" height="36" rx="4" fill={a} opacity="0.55" />
            <rect x="130" y="80" width="26" height="36" rx="4" fill={AMBER} opacity="0.8" />
          </g>
        </g>
      );
    case "monitor":
      return (
        <g>
          <rect x="50" y="24" width="140" height="88" rx="7" fill={INK} />
          <rect x="56" y="30" width="128" height="76" rx="3" fill={SCREEN} />
          <path d="M66 88 84 70l14 10 18-22 16 12 18-16 14 10" fill="none" stroke={a} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="168" cy="44" r="6" fill={AMBER} />
          <path d="M108 112h24l7 24h-38Z" fill={PINE} />
          <rect x="86" y="136" width="68" height="8" rx="4" fill={INK} />
        </g>
      );
    case "tv":
      return (
        <g>
          <rect x="36" y="28" width="168" height="96" rx="7" fill={INK} />
          <rect x="43" y="35" width="154" height="82" rx="3" fill={SCREEN} />
          <circle cx="120" cy="76" r="17" fill="rgba(255,255,255,0.08)" />
          <path d="m115 67 15 9-15 9Z" fill={AMBER} />
          <rect x="43" y="106" width="154" height="11" rx="2" fill="rgba(255,255,255,0.06)" />
          <circle cx="52" cy="111.5" r="2.5" fill={a} />
          <path d="M66 124l-8 18h12l4-18Z" fill={PINE} />
          <path d="M174 124l8 18h-12l-4-18Z" fill={PINE} />
        </g>
      );
    case "keyboard":
      return (
        <g>
          <path d="M50 72h140l13 44a7 7 0 0 1-7 7H44a7 7 0 0 1-7-7Z" fill={INK} />
          <g fill={PINE}>
            <rect x="58" y="80" width="12" height="9" rx="2" /><rect x="74" y="80" width="12" height="9" rx="2" />
            <rect x="90" y="80" width="12" height="9" rx="2" /><rect x="106" y="80" width="12" height="9" rx="2" />
            <rect x="122" y="80" width="12" height="9" rx="2" /><rect x="138" y="80" width="12" height="9" rx="2" />
            <rect x="154" y="80" width="12" height="9" rx="2" /><rect x="170" y="80" width="12" height="9" rx="2" />
            <rect x="55" y="94" width="12" height="9" rx="2" /><rect x="71" y="94" width="12" height="9" rx="2" />
            <rect x="87" y="94" width="12" height="9" rx="2" /><rect x="103" y="94" width="12" height="9" rx="2" />
            <rect x="119" y="94" width="12" height="9" rx="2" /><rect x="135" y="94" width="12" height="9" rx="2" />
            <rect x="151" y="94" width="12" height="9" rx="2" /><rect x="167" y="94" width="12" height="9" rx="2" />
            <rect x="60" y="108" width="12" height="9" rx="2" /><rect x="76" y="108" width="12" height="9" rx="2" />
            <rect x="150" y="108" width="12" height="9" rx="2" /><rect x="166" y="108" width="12" height="9" rx="2" />
          </g>
          <rect x="92" y="108" width="54" height="9" rx="3" fill={PINE} />
          <rect x="134" y="80" width="12" height="9" rx="2" fill={AMBER} />
        </g>
      );
    case "mouse":
      return (
        <g>
          <path d="M120 36c27 0 42 24 42 55s-17 55-42 55-42-24-42-55 15-55 42-55Z" fill={INK} />
          <path d="M120 36v40" stroke={PINE} strokeWidth="3" />
          <rect x="115" y="56" width="10" height="22" rx="5" fill={AMBER} />
          <path d="M84 95a36 36 0 0 0 10 24" stroke={a} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        </g>
      );
    case "headphones":
      return (
        <g>
          <path d="M60 104a60 60 0 0 1 120 0" fill="none" stroke={INK} strokeWidth="13" strokeLinecap="round" />
          <rect x="46" y="94" width="28" height="50" rx="14" fill={INK} />
          <rect x="166" y="94" width="28" height="50" rx="14" fill={INK} />
          <rect x="53" y="101" width="14" height="36" rx="7" fill={a} />
          <rect x="173" y="101" width="14" height="36" rx="7" fill={a} />
          <circle cx="178" cy="96" r="3.5" fill={AMBER} />
        </g>
      );
    case "earbuds":
      return (
        <g>
          <rect x="74" y="86" width="92" height="58" rx="19" fill={INK} />
          <path d="M74 105h92" stroke={PINE} strokeWidth="3" />
          <circle cx="120" cy="124" r="3.5" fill={AMBER} />
          <g>
            <circle cx="99" cy="56" r="15" fill={INK} />
            <rect x="94" y="60" width="10" height="22" rx="5" fill={INK} />
            <circle cx="99" cy="54" r="5.5" fill={a} />
          </g>
          <g>
            <circle cx="143" cy="52" r="15" fill={INK} />
            <rect x="138" y="56" width="10" height="22" rx="5" fill={INK} />
            <circle cx="143" cy="50" r="5.5" fill={a} />
          </g>
        </g>
      );
    case "speaker":
      return (
        <g>
          <rect x="82" y="30" width="76" height="112" rx="22" fill={INK} />
          <circle cx="120" cy="72" r="22" fill="none" stroke={PINE} strokeWidth="4" />
          <circle cx="120" cy="72" r="12" fill="none" stroke={a} strokeWidth="4" />
          <circle cx="120" cy="116" r="10" fill="none" stroke={PINE} strokeWidth="4" />
          <rect x="104" y="38" width="32" height="5" rx="2.5" fill={AMBER} />
        </g>
      );
    case "powerbank":
      return (
        <g>
          <rect x="56" y="62" width="128" height="58" rx="15" fill={INK} />
          <rect x="66" y="72" width="34" height="16" rx="4" fill={SCREEN} />
          <rect x="70" y="77" width="18" height="6" rx="2" fill={a} />
          <path d="M132 74 122 92h8l-4 14 14-20h-8Z" fill={AMBER} />
          <g fill={a}>
            <circle cx="156" cy="104" r="3" /><circle cx="166" cy="104" r="3" /><circle cx="176" cy="104" r="3" opacity="0.35" />
          </g>
          <rect x="56" y="62" width="128" height="12" rx="12" fill="rgba(255,255,255,0.05)" />
        </g>
      );
    case "charger":
      return (
        <g>
          <rect x="98" y="34" width="9" height="16" rx="3" fill={PINE} />
          <rect x="133" y="34" width="9" height="16" rx="3" fill={PINE} />
          <rect x="84" y="48" width="72" height="72" rx="16" fill={INK} />
          <path d="M124 62 112 84h10l-5 17 17-24h-10Z" fill={AMBER} />
          <rect x="102" y="104" width="36" height="8" rx="4" fill={a} />
        </g>
      );
    case "watch":
      return (
        <g>
          <rect x="104" y="18" width="32" height="30" rx="9" fill={PINE} />
          <rect x="104" y="132" width="32" height="30" rx="9" fill={PINE} />
          <rect x="90" y="44" width="60" height="70" rx="18" fill={INK} />
          <rect x="96" y="50" width="48" height="58" rx="13" fill={SCREEN} />
          <rect x="104" y="60" width="24" height="8" rx="3" fill={a} />
          <rect x="104" y="73" width="32" height="5" rx="2.5" fill="#3d5f58" />
          <rect x="104" y="82" width="20" height="5" rx="2.5" fill="#3d5f58" />
          <circle cx="132" cy="95" r="6" fill="none" stroke={AMBER} strokeWidth="3" />
          <rect x="150" y="62" width="6" height="16" rx="3" fill={a} />
        </g>
      );
    case "camera":
      return (
        <g>
          <rect x="94" y="42" width="52" height="18" rx="6" fill={INK} />
          <rect x="54" y="54" width="132" height="78" rx="13" fill={INK} />
          <circle cx="120" cy="93" r="27" fill={PINE} />
          <circle cx="120" cy="93" r="18" fill={SCREEN} />
          <circle cx="120" cy="93" r="18" fill="none" stroke={a} strokeWidth="3" />
          <circle cx="113" cy="86" r="4" fill="rgba(255,255,255,0.35)" />
          <circle cx="166" cy="68" r="4.5" fill={AMBER} />
          <rect x="64" y="64" width="16" height="7" rx="3.5" fill={PINE} />
        </g>
      );
    case "router":
      return (
        <g>
          <path d="M84 92V52" stroke={INK} strokeWidth="7" strokeLinecap="round" />
          <path d="M156 92V52" stroke={INK} strokeWidth="7" strokeLinecap="round" />
          <circle cx="84" cy="48" r="5" fill={AMBER} />
          <circle cx="156" cy="48" r="5" fill={AMBER} />
          <rect x="60" y="92" width="120" height="38" rx="11" fill={INK} />
          <path d="M96 111a34 34 0 0 1 48 0" fill="none" stroke={a} strokeWidth="3.5" strokeLinecap="round" opacity="0.8" />
          <g fill={a}>
            <circle cx="74" cy="111" r="3.5" /><circle cx="86" cy="111" r="3.5" opacity="0.5" /><circle cx="166" cy="111" r="3.5" fill={AMBER} />
          </g>
        </g>
      );
    case "ssd":
      return (
        <g>
          <rect x="56" y="60" width="128" height="60" rx="11" fill={INK} />
          <rect x="66" y="70" width="74" height="20" rx="5" fill={a} />
          <rect x="72" y="76" width="40" height="8" rx="3" fill="rgba(255,255,255,0.85)" />
          <g fill={PINE}>
            <rect x="66" y="98" width="10" height="12" rx="2" /><rect x="80" y="98" width="10" height="12" rx="2" />
            <rect x="94" y="98" width="10" height="12" rx="2" /><rect x="108" y="98" width="10" height="12" rx="2" />
          </g>
          <circle cx="166" cy="90" r="10" fill="none" stroke={AMBER} strokeWidth="3.5" />
          <path d="m173 97 6 6" stroke={AMBER} strokeWidth="3.5" strokeLinecap="round" />
        </g>
      );
    case "webcam":
      return (
        <g>
          <circle cx="120" cy="72" r="32" fill={INK} />
          <circle cx="120" cy="72" r="19" fill={SCREEN} />
          <circle cx="120" cy="72" r="19" fill="none" stroke={a} strokeWidth="3.5" />
          <circle cx="113" cy="65" r="4.5" fill="rgba(255,255,255,0.3)" />
          <circle cx="143" cy="52" r="3" fill={AMBER} />
          <path d="M112 104h16v18h-16z" fill={PINE} />
          <rect x="96" y="122" width="48" height="9" rx="4.5" fill={INK} />
        </g>
      );
    case "printer":
      return (
        <g>
          <rect x="74" y="46" width="92" height="26" rx="6" fill={PINE} />
          <rect x="52" y="66" width="136" height="56" rx="11" fill={INK} />
          <rect x="62" y="76" width="30" height="10" rx="3" fill={SCREEN} />
          <circle cx="170" cy="81" r="4" fill={AMBER} />
          <circle cx="158" cy="81" r="4" fill={a} />
          <rect x="82" y="104" width="76" height="34" rx="3" fill="#fcfdfd" stroke="#d9e4e0" />
          <rect x="90" y="112" width="48" height="4" rx="2" fill="#b9cbc5" />
          <rect x="90" y="120" width="60" height="4" rx="2" fill="#d9e4e0" />
          <rect x="90" y="128" width="36" height="4" rx="2" fill="#d9e4e0" />
        </g>
      );
    case "tower":
      return (
        <g>
          <rect x="84" y="22" width="72" height="124" rx="9" fill={INK} />
          <rect x="92" y="32" width="44" height="92" rx="5" fill={SCREEN} />
          <circle cx="114" cy="58" r="13" fill="none" stroke={a} strokeWidth="3.5" />
          <circle cx="114" cy="58" r="4" fill={a} />
          <circle cx="114" cy="96" r="13" fill="none" stroke={AMBER} strokeWidth="3.5" opacity="0.85" />
          <circle cx="114" cy="96" r="4" fill={AMBER} />
          <g stroke={PINE} strokeWidth="3" strokeLinecap="round">
            <path d="M144 40h6M144 50h6M144 60h6M144 70h6M144 80h6" />
          </g>
          <circle cx="147" cy="132" r="4.5" fill={a} />
        </g>
      );
    default:
      return <rect x="70" y="50" width="100" height="80" rx="12" fill={INK} />;
  }
}
