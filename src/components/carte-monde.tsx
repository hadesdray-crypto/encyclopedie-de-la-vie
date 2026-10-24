import monde from "@/data/monde.json";

const PAYS = (monde as { pays: Record<string, string> }).pays;

/** Carte du monde hors ligne. Les pays où vit l'espèce sont en or. */
export function CarteMonde({ pays }: { pays: string[] }) {
  const choisis = new Set(pays);
  return (
    <svg viewBox="0 18 360 140" className="w-full rounded-2xl bg-[#14214a]" role="img" aria-label="Carte des pays où vit l'espèce">
      {Object.entries(PAYS).map(([code, d]) => (
        <path key={code} d={d} fill={choisis.has(code) ? "#f3c35a" : "#3b4a7a"} stroke="#0f1838" strokeWidth=".25" />
      ))}
    </svg>
  );
}
