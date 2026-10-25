import monde from "@/data/monde.json";

const PAYS = (monde as { pays: Record<string, string> }).pays;

// Les îles trop petites pour la carte : un point doré à leur place (latitude, longitude).
const ILES: [string, number, number][] = [
  ["Andaman", 11.7, 92.7],
  ["Galápagos", -0.7, -90.3],
  ["Canaries", 28.3, -15.6],
  ["Bonaire", 12.2, -68.3],
  ["Açores", 38.7, -27.2],
  ["Madère", 32.7, -16.9],
];
export function ilesDe(ou?: string) {
  return ou ? ILES.filter(([nom]) => ou.includes(nom)) : [];
}

/** Carte du monde hors ligne. Les pays où vit l'espèce sont en or ; les petites îles, un point doré. */
export function CarteMonde({ pays, ou }: { pays: string[]; ou?: string }) {
  const choisis = new Set(pays);
  return (
    <svg viewBox="0 18 360 140" className="w-full rounded-2xl bg-[#14214a]" role="img" aria-label="Carte des pays où vit l'espèce">
      {Object.entries(PAYS).map(([code, d]) => (
        <path key={code} d={d} fill={choisis.has(code) ? "#f3c35a" : "#3b4a7a"} stroke="#0f1838" strokeWidth=".25" />
      ))}
      {ilesDe(ou).map(([nom, lat, lon]) => (
        <g key={nom}>
          <circle cx={lon + 180} cy={90 - lat} r="4" fill="none" stroke="#f3c35a" strokeWidth="1" opacity=".7" />
          <circle cx={lon + 180} cy={90 - lat} r="2" fill="#f3c35a" stroke="#0f1838" strokeWidth=".5" />
        </g>
      ))}
    </svg>
  );
}
