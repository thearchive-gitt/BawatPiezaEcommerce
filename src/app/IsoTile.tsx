"use client";

import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { Cube, Cyl, Stand, Plane, gearPath } from "./IsoPrimitives";
import "./iso-tile.css";

type LayerKey = "walls" | "frame" | "mech" | "piezoB" | "piezoA" | "creamLow" | "eva" | "sintra";

/** Z of every layer: [assembled, exploded]. */
const LAYERS: Record<LayerKey, readonly [number, number]> = {
  walls: [10, 20], frame: [14, 58], mech: [12, 84], piezoB: [44, 196],
  piezoA: [60, 256], creamLow: [68, 312], eva: [72, 340], sintra: [76, 372],
};
/** When each layer lifts, as a slice of the 0 → 1 opening progress (staggered, bottom first). */
const WINDOW: Record<LayerKey, readonly [number, number]> = {
  walls: [0.38, 0.7], frame: [0.3, 0.72], mech: [0.22, 0.78], piezoB: [0.32, 0.88],
  piezoA: [0.36, 0.92], creamLow: [0.4, 0.95], eva: [0.42, 0.97], sintra: [0.45, 1],
};
const MECH_SQUASH: readonly [number, number] = [0.55, 1];
const SPINDLE_FROM = 114;
const SPINDLE_TO = 8;
const OPEN_AT = 0.25; // share of the section's scroll used to open the tile

const clamp = (v: number) => Math.min(Math.max(v, 0), 1);
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const opening = (v: number) => clamp(v / OPEN_AT);
const tLayer = (k: LayerKey, v: number) => smooth(clamp((opening(v) - WINDOW[k][0]) / (WINDOW[k][1] - WINDOW[k][0])));
const zOf = (k: LayerKey, v: number) => lerp(LAYERS[k][0], LAYERS[k][1], tLayer(k, v));
const squash = (v: number) => lerp(MECH_SQUASH[0], MECH_SQUASH[1], tLayer("mech", v));

/** Which reference layers each page step lights up. */
const STEP_MAP: Record<number, (LayerKey | "base")[]> = {
  0: ["base"], 1: ["frame", "walls"], 2: ["mech"], 3: ["piezoA", "piezoB"], 4: ["creamLow", "eva"], 5: ["sintra"],
};

/* ---------- materials & shapes (unique ids, so they never clash with the hero tile's) ---------- */

const ROD_BG = "linear-gradient(90deg, #2a2d33 0%, #aeb5bd 22%, #f3f5f7 38%, #8b929b 62%, #2b2e34 100%)";
const THREAD_BG = `repeating-linear-gradient(172deg, rgba(0,0,0,0.5) 0 2px, rgba(0,0,0,0) 2px 5px), ${ROD_BG}`;
const CORD_BG = "linear-gradient(90deg, #8f8676, #efe7da 40%, #8f8676)";
const STEEL_TONE: [number, number, number, number] = [212, 7, 52, 30];
const MOTOR_TONE: [number, number, number, number] = [214, 9, 33, 24];
const GEAR_D = gearPath(60, 60, 20, 57, 48);

type Disc = [number, number, number];
const MID: Disc[] = Array.from({ length: 6 }, (_, i) => {
  const a = (i / 6) * Math.PI * 2 + 0.3;
  return [150 + Math.cos(a) * 84, 150 + Math.sin(a) * 84, 31] as Disc;
});
const OUTER: Disc[] = Array.from({ length: 6 }, (_, i) => {
  const a = (i / 6) * Math.PI * 2 + 0.3 + Math.PI / 6;
  return [150 + Math.cos(a) * 126, 150 + Math.sin(a) * 126, 21] as Disc;
});
const CLUSTER_A: Disc[] = [[150, 150, 42], ...MID];
const CLUSTER_B: Disc[] = OUTER;

const CORNERS: [number, number][] = [
  [-148, -148],
  [148, -148],
  [-148, 148],
  [148, 148],
];

function InsSpring() {
  return (
    <svg viewBox="0 0 30 64" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="ins-spr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2f4f6" />
          <stop offset="0.5" stopColor="#9aa2ab" />
          <stop offset="1" stopColor="#3a3f46" />
        </linearGradient>
      </defs>
      {Array.from({ length: 9 }, (_, i) => {
        const y = 4 + i * 6.5;
        return (
          <g key={i}>
            <path d={`M3 ${y} L27 ${y + 5}`} stroke="#23262b" strokeWidth="3.4" strokeLinecap="round" fill="none" opacity="0.7" />
            <path d={`M3 ${y + 5} L27 ${y}`} stroke="url(#ins-spr)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          </g>
        );
      })}
    </svg>
  );
}

/** A cluster of copper discs, drawn as three slices so it has a little thickness. */
function Discs({ discs, tag }: { discs: Disc[]; tag: string }) {
  return (
    <>
      {[0, -1.6, -3.2].map((dz, idx) => (
        <Plane key={dz} size={300} z={dz} style={idx ? { filter: `brightness(${1 - idx * 0.32})` } : undefined}>
          <svg viewBox="0 0 300 300" width="100%" height="100%" aria-hidden="true">
            <defs>
              <radialGradient id={`ins-copper-${tag}${idx}`} cx="36%" cy="32%" r="78%">
                <stop offset="0" stopColor="#ffd2ac" />
                <stop offset="0.45" stopColor="#dd8a55" />
                <stop offset="1" stopColor="#74391a" />
              </radialGradient>
            </defs>
            {discs.map(([cx, cy, r], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r} fill={`url(#ins-copper-${tag}${idx})`} stroke="#51250e" strokeWidth="1.5" />
                {idx === 0 && <circle cx={cx} cy={cy} r={r * 0.3} fill="#4a210b" opacity="0.5" />}
                {idx === 0 && (
                  <ellipse cx={cx - r * 0.3} cy={cy - r * 0.35} rx={r * 0.34} ry={r * 0.18} fill="#fff" opacity="0.22" />
                )}
              </g>
            ))}
          </svg>
        </Plane>
      ))}
    </>
  );
}


type Vars = Record<`--${string}`, MotionValue<number> | number>;

function Group({ k, progress, dim, mech, children }: { k: LayerKey; progress: MotionValue<number>; dim: boolean; mech?: boolean; children: ReactNode }) {
  const z = useTransform(progress, (v) => zOf(k, v));
  const sq = useTransform(progress, squash);
  const vars: Vars = mech ? { "--z": z, "--sq": sq } : { "--z": z };
  return (
    <motion.div className={`t3-group iso-g${mech ? " iso-mech" : ""}${dim ? " is-dim" : ""}`} style={vars as never}>
      {children}
    </motion.div>
  );
}

export default function IsoTile({ progress, activeLayers, spin: spinProp, fit = [560, 600], anchor = "center" }: {
  progress: MotionValue<number>;
  activeLayers: number[];
  /** optional gear angle in degrees (defaults to scroll-driven) */
  spin?: MotionValue<number>;
  /** smaller numbers = bigger tile: [width, height] the model is fitted into */
  fit?: [number, number];
  /** "center": the camera follows the growing stack, so the base slides down while opening (hero).
   *  "base": the closed tile sits where the base ends up, so opening only grows upward and nothing slides. */
  anchor?: "center" | "base";
}) {
  const box = useRef<HTMLDivElement>(null);
  const scale = useMotionValue(0.6);
  const [fitW, fitH] = fit;
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      // layout size (clientWidth), not getBoundingClientRect: a parent's scale() must not shrink the model
      if (el.clientWidth) scale.set(Math.min(el.clientWidth / fitW, el.clientHeight / fitH));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scale, fitW, fitH]);

  const lit = new Set(activeLayers.flatMap((n) => STEP_MAP[n] ?? []));
  const dim = (k: LayerKey | "base") => !lit.has(k);

  // keep the exploded stack vertically centred as it grows
  const tyCenter = useTransform([progress, scale], ([p, s]: number[]) => 0.47 * (zOf("sintra", p) + 12) * s);
  const tyBase = useTransform(scale, (s) => 0.47 * (zOf("sintra", OPEN_AT) + 12) * s); // always the fully-open offset
  const ty = anchor === "base" ? tyBase : tyCenter;
  const camVars = { "--s": scale, "--ty": ty } as never;
  const glow = useTransform(progress, (v) => opening(v));
  // closed look (solid dark shell) crossfades into the real layers just as the tile starts to open
  const shellO = useTransform(progress, (v) => 1 - clamp(v / 0.012));
  const realO = useTransform(progress, (v) => clamp(v / 0.012));
  const scrollSpin = useTransform(progress, (v) => v * 1800);
  const spin = spinProp ?? scrollSpin;
  // helical thread stretches between the gear and the upper copper cluster
  const spZ = useTransform(progress, (v) => zOf("mech", v) + SPINDLE_FROM * squash(v));
  const spH = useTransform(progress, (v) => Math.max(6, zOf("piezoA", v) + SPINDLE_TO - (zOf("mech", v) + SPINDLE_FROM * squash(v))));

  const g = (k: LayerKey, children: ReactNode, mech?: boolean) => (
    <Group k={k} progress={progress} dim={dim(k)} mech={mech}>{children}</Group>
  );

  return (
    <div className="iso-scene" ref={box}>
      <motion.div className="iso-cam" style={camVars} role="img" aria-label="Exploded 3D view of the tile: sintra board, EVA rubber, piezo discs, dynamo assembly, aluminum frame with springs, and base plate">
        <div className="iso-world">
          <Plane size={760} z={-2} className="t3-shadow" />
          <motion.div className="iso-glowwrap" style={{ "--o": glow } as never}>
            <Plane size={330} z={10.4} className="t3-glow" />
          </motion.div>

          {/* ---- closed look: dark shell, black lip, grey top board, two chrome glands ---- */}
          <motion.div className="t3-group iso-closed" style={{ "--co": shellO } as never}>
            <Cube w={364} d={364} h={77} m="m-shell" />
            <Cube w={382} d={382} h={11} z={77} m="m-lip" />
            <Cube w={364} d={364} h={10} z={88} m="m-slab" />
            <Plane size={7} z={98.3} style={{ background: "#ff8a2b", borderRadius: "50%" }} />
            {[-62, 51].map((gx) => (
              <Stand key={gx} w={19} h={19} x={gx} y={186} z={33} bg="radial-gradient(circle at 36% 30%, #ffffff 0 8%, #cfd5db 22%, #6b737c 62%, #2b3036 100%)" round />
            ))}
          </motion.div>

          <motion.div className="t3-group iso-real" style={{ "--ro": realO } as never}>
          <div className={`t3-cube iso-base${dim("base") ? " is-dim" : ""}`}>
            <Cube w={380} d={380} h={10} m="m-board" />
          </div>

          {g("walls", <>
            <Cube w={372} d={16} h={52} y={-178} m="m-eva" />
            <Cube w={16} d={340} h={52} x={178} y={8} m="m-eva" />
          </>)}

          {g("frame", <>
            <Cube w={290} d={14} h={8} y={-124} m="m-alu" />
            <Cube w={290} d={14} h={8} y={124} m="m-alu" />
            <Cube w={14} d={234} h={8} x={-124} m="m-alu" />
            <Cube w={14} d={234} h={8} x={124} m="m-alu" />
            <Cube w={280} d={5} h={1.2} y={-124} z={8} m="m-block" />
            <Cube w={280} d={5} h={1.2} y={124} z={8} m="m-block" />
            <Cube w={5} d={224} h={1.2} x={-124} z={8} m="m-block" />
            <Cube w={5} d={224} h={1.2} x={124} z={8} m="m-block" />
          </>)}

          {g("mech", <>
            <Cube w={74} d={46} h={20} m="m-block" />
            <Cyl r={17} h={8} n={16} z={20} tone={STEEL_TONE} />
            <div className="t3-group" style={{ transform: "translate3d(0,0,28px)" }}>
              <Stand w={42} h={64}><InsSpring /></Stand>
            </div>
            <Cyl r={21} h={10} n={16} z={92} tone={STEEL_TONE} />
            <Cyl r={13} h={8} n={14} z={102} tone={STEEL_TONE} />
            <div className="t3-gear t3-gear-under" style={{ transform: "translate3d(-44px,-44px,108.4px)" }} />
            <motion.div className="t3-gear iso-gear" style={{ "--rot": spin } as never}>
              <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden="true">
                <defs>
                  <linearGradient id="ins-gearfill" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#eef1f4" /><stop offset="0.5" stopColor="#8a929c" /><stop offset="1" stopColor="#363b42" />
                  </linearGradient>
                </defs>
                <path d={GEAR_D} fill="url(#ins-gearfill)" stroke="#1f2227" strokeWidth="1.6" strokeLinejoin="round" />
                <circle cx="60" cy="60" r="36" fill="none" stroke="#1f2227" strokeWidth="2" opacity="0.55" />
                <circle cx="60" cy="60" r="22" fill="#2a2e34" />
                <circle cx="60" cy="60" r="9" fill="#c9cfd6" />
              </svg>
            </motion.div>

            <Cyl r={16} h={84} n={14} x={-92} y={0} z={20} axis="x" tone={MOTOR_TONE} phase={2.6} />
            <Cube w={14} d={34} h={26} x={-70} y={0} m="m-block" />
            <Cube w={8} d={40} h={36} x={-136} y={0} m="m-block" />

            <Cube w={54} d={34} h={34} x={92} y={18} m="m-block" />
            <Cyl r={13} h={36} n={14} x={58} y={18} z={9} axis="x" tone={STEEL_TONE} />

            <Cyl r={8} h={30} n={10} x={-190} y={70} z={10} axis="x" tone={STEEL_TONE} />
            <Cyl r={11} h={9} n={6} x={-176} y={70} z={7} axis="x" tone={MOTOR_TONE} />

            {CORNERS.map(([cx, cy]) => (
              <div key={`g${cx}${cy}`} className="t3-cube">
                <Stand w={10} h={130} x={cx} y={cy} z={2} bg={ROD_BG} />
                <Cyl r={13} h={24} n={12} x={cx} y={cy} z={4} tone={STEEL_TONE} />
                <div className="t3-group" style={{ transform: "translate3d(0,0,28px)" }}>
                  <Stand w={30} h={62} x={cx} y={cy}><InsSpring /></Stand>
                </div>
              </div>
            ))}
          </>, true)}

          <motion.div className={`t3-group iso-spindle${dim("mech") ? " is-dim" : ""}`} style={{ "--zs": spZ, "--h": spH } as never}>
            <Stand w={13} h={60} hv bg={THREAD_BG} />
          </motion.div>

          {g("piezoB", <>
            <Discs discs={CLUSTER_B} tag="b" />
            <Cube w={322} d={3.4} h={3.4} y={-158} z={-1.7} m="m-evacream" />
            <Cube w={322} d={3.4} h={3.4} y={158} z={-1.7} m="m-evacream" />
            <Cube w={3.4} d={316} h={3.4} x={-158} z={-1.7} m="m-evacream" />
            <Cube w={3.4} d={316} h={3.4} x={158} z={-1.7} m="m-evacream" />
            <div className="t3-cube">
              <Stand w={4} h={36} x={158} y={-120} z={-34} bg={CORD_BG} />
              <Stand w={4} h={36} x={-158} y={120} z={-34} bg={CORD_BG} />
            </div>
          </>)}
          {g("piezoA", <Discs discs={CLUSTER_A} tag="a" />)}
          {g("creamLow", <Cube w={380} d={380} h={12} m="m-evacream" />)}
          {g("eva", <Cube w={372} d={372} h={20} m="m-eva" />)}
          {g("sintra", <Cube w={380} d={380} h={12} m="m-sintra" />)}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}