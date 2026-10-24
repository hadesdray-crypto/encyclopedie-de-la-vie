import { useEffect, useState } from "react";
import photos from "@/data/photos.json";
import { PAR_ID } from "@/data/catalogue";

declare const __PAQUETS__: boolean;

const PRESENTS = new Set(photos as string[]);

export function aUnePhoto(id: string) {
  return PRESENTS.has(id);
}

// Version « lien en ligne » : les photos sont rangées par famille dans des paquets
// (paquets/Felidae.json), parce que l'hébergement limite le nombre de fichiers.
const paquets = new Map<string, Promise<Record<string, string>>>();
function paquet(famille: string) {
  let p = paquets.get(famille);
  if (!p) {
    p = fetch(`paquets/${famille}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
    paquets.set(famille, p);
  }
  return p;
}

/** Photo de l'espèce. S'il n'y en a pas, le dessin de remplacement. */
export function Portrait({ id, src }: { id: string; src?: string }) {
  const parPaquet = __PAQUETS__ && !src && PRESENTS.has(id);
  const [image, setImage] = useState<string | null>(null);
  useEffect(() => {
    if (!parPaquet) return;
    const famille = PAR_ID.get(id)?.famille;
    if (!famille) return;
    let vivant = true;
    paquet(famille).then((p) => vivant && setImage(p[id] ?? "m/absent.webp"));
    return () => {
      vivant = false;
    };
  }, [id, parPaquet]);
  const chemin = src ?? (parPaquet ? image : PRESENTS.has(id) ? `m/${id}.webp` : "m/absent.webp");
  if (!chemin) return <span className="block size-full animate-pulse bg-[#2a1844]" />;
  return (
    <img
      src={chemin}
      alt=""
      loading="lazy"
      decoding="async"
      className="size-full object-cover"
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.src.endsWith("absent.webp")) img.src = "m/absent.webp";
      }}
    />
  );
}
