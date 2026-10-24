import { useEffect, useState } from "react";
import { sons } from "@/lib/sons";

/** Petit message « Tu gagnes un paquet ! » qui apparaît en haut de l'écran. */
export function Cadeau() {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    let minuteur = 0;
    const montrer = (e: Event) => {
      setMessage((e as CustomEvent<string>).detail);
      sons.brillant();
      window.clearTimeout(minuteur);
      minuteur = window.setTimeout(() => setMessage(null), 3500);
    };
    window.addEventListener("leonie-cadeau", montrer);
    return () => window.removeEventListener("leonie-cadeau", montrer);
  }, []);
  if (!message) return null;
  return (
    <a
      href="#/cartes"
      className="arrivee fixed inset-x-0 z-40 mx-auto flex w-fit max-w-[92%] items-center gap-3 rounded-full border-2 border-[#e8c98a] bg-[#2a1650] px-4 py-2 shadow-[0_0_30px_rgba(160,110,255,.7)]"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
      role="status"
    >
      <img src="theme/cartes.webp" alt="" className="size-10 rounded-full" />
      <span>
        <span className="block font-display text-lg text-[#f3d48a]">Tu gagnes un paquet !</span>
        <span className="block text-xs">{message}</span>
      </span>
    </a>
  );
}
