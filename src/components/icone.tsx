import {
  LuBaby, LuBone, LuBookOpen, LuBug, LuCrown, LuDroplet, LuEgg, LuFeather, LuFish, LuFlame, LuFlower2,
  LuFootprints, LuHeart, LuLayers, LuLeaf, LuMicroscope, LuOrbit, LuPawPrint, LuShell, LuSnail, LuSparkles,
  LuSprout, LuStar, LuSun, LuTreePine, LuTurtle, LuWaves, LuWorm,
} from "react-icons/lu";
import type { IconType } from "react-icons";

const ICONES: Record<string, IconType> = {
  Baby: LuBaby, Bone: LuBone, BookOpen: LuBookOpen, Bug: LuBug, Crown: LuCrown, Droplet: LuDroplet, Egg: LuEgg,
  Feather: LuFeather, Fish: LuFish, Flame: LuFlame, Flower2: LuFlower2, Footprints: LuFootprints, Heart: LuHeart,
  Layers: LuLayers, Leaf: LuLeaf, Microscope: LuMicroscope, Orbit: LuOrbit, PawPrint: LuPawPrint, Shell: LuShell,
  Snail: LuSnail, Sparkles: LuSparkles, Sprout: LuSprout, Star: LuStar, Sun: LuSun, TreePine: LuTreePine,
  Turtle: LuTurtle, Waves: LuWaves, Worm: LuWorm,
};

/** Une image dessinée si elle existe, sinon une icône sur fond de nuit. */
export function Vignette({ image, icone, className = "" }: { image?: string; icone?: string; className?: string }) {
  if (image) return <img src={image} alt="" className={`size-full object-cover ${className}`} />;
  const Icone = ICONES[icone ?? "Sparkles"] ?? LuSparkles;
  return (
    <span className={`grid size-full place-items-center bg-[radial-gradient(circle_at_35%_30%,#4a2d78,#1a1030_75%)] text-[#f3d48a] ${className}`}>
      <Icone className="size-[48%]" aria-hidden="true" />
    </span>
  );
}
