"use client";

import { motion, type MotionValue } from "framer-motion";
import IsoTile from "./IsoTile";

const ALL_LAYERS = [0, 1, 2, 3, 4, 5];

/**
 * Hero tile: it simply sits in the hero (a short fade-in, no falling).
 * Centering, opening, gear spin and the dive are driven by page.tsx, which passes in `progress` and `spin`.
 */
export default function HeroTile({ progress, spin }: { progress: MotionValue<number>; spin: MotionValue<number> }) {
  return (
    <motion.div className="bp-hero-tile-in" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
      <IsoTile progress={progress} spin={spin} fit={[500, 540]} activeLayers={ALL_LAYERS} />
    </motion.div>
  );
}