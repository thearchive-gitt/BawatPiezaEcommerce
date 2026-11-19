"use client";

import type { CSSProperties, ReactNode } from "react";

/* CSS-3D building blocks. They emit the same classes your globals.css already styles
   (.t3-cube/.t3-f/.t3-top/.t3-front/.t3-left/.t3-cyl/.t3-cap/.t3-plane and the .m-* materials).
   The scene is viewed through rotateX(70deg) rotateZ(-34deg); that makes the +y face (front)
   and the -x face (left) the visible sides. If you already have these exports in
   "@/components/HeroTileScroll", you can delete this file and import from there instead. */

const px = (n: number) => `${n}px`;

export function Cube({ w, d, h, x = 0, y = 0, z = 0, m }: { w: number; d: number; h: number; x?: number; y?: number; z?: number; m?: string }) {
  return (
    <div className={`t3-cube${m ? ` ${m}` : ""}`} style={{ transform: `translate3d(${px(x)},${px(y)},${px(z)})` }}>
      <i className="t3-f t3-top" style={{ width: w, height: d, transform: `translate3d(${px(-w / 2)},${px(-d / 2)},${px(h)})` }} />
      <i className="t3-f t3-front" style={{ width: w, height: h, transform: `translate3d(${px(-w / 2)},${px(d / 2)},${px(h)}) rotateX(-90deg)` }} />
      <i className="t3-f t3-left" style={{ width: d, height: h, transform: `translate3d(${px(-w / 2)},${px(-d / 2)},${px(h)}) rotateZ(90deg) rotateX(-90deg)` }} />
    </div>
  );
}

/** Prism with n facets. axis "z" stands up (x/y = centre, z = base); axis "x" lies down (x/y/z = centre). */
export function Cyl({ r, h, n = 14, x = 0, y = 0, z = 0, axis = "z", tone, phase = 0 }: {
  r: number; h: number; n?: number; x?: number; y?: number; z?: number; axis?: "x" | "z"; tone: [number, number, number, number]; phase?: number;
}) {
  const [hue, sat, light, spread] = tone;
  const chord = 2 * r * Math.sin(Math.PI / n);
  const col = (l: number) => `hsl(${hue} ${sat}% ${l}%)`;
  const poly = `polygon(${Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `${50 + 50 * Math.cos(a)}% ${50 + 50 * Math.sin(a)}%`;
  }).join(",")})`;
  const body = (
    <>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        const l = light - spread / 2 + spread * (0.5 + 0.5 * Math.cos(a - phase - 0.8));
        return (
          <i
            key={i}
            className="t3-f t3-cyl"
            style={{
              width: chord + 0.5,
              height: h,
              backgroundColor: col(l),
              transform: `translate3d(${px(r * Math.cos(a))},${px(r * Math.sin(a))},${px(h)}) rotateZ(${a * (180 / Math.PI) - 90}deg) translateX(${px(-chord / 2)}) rotateX(-90deg)`,
            }}
          />
        );
      })}
      <i className="t3-f t3-cap" style={{ width: 2 * r, height: 2 * r, backgroundColor: col(light + spread * 0.35), clipPath: poly, transform: `translate3d(${px(-r)},${px(-r)},${px(h)})` }} />
    </>
  );
  const t =
    axis === "x"
      ? `translate3d(${px(x)},${px(y)},${px(z)}) rotateY(90deg) translate3d(0,0,${px(-h / 2)})`
      : `translate3d(${px(x)},${px(y)},${px(z)})`;
  return (
    <div className="t3-cube" style={{ transform: t }}>
      {body}
    </div>
  );
}

/** Upright card that always faces the camera (springs, rods, thread). `hv` = take height from CSS var --h. */
export function Stand({ w, h, x = 0, y = 0, z = 0, bg, hv, round, children }: { w: number; h: number; x?: number; y?: number; z?: number; bg?: string; hv?: boolean; round?: boolean; children?: ReactNode }) {
  const H = hv ? "calc(var(--h) * 1px)" : px(h);
  const style: CSSProperties = {
    width: w,
    height: H,
    background: bg,
    borderRadius: round ? "50%" : undefined,
    boxShadow: round ? "0 2px 3px rgb(0 0 0 / 45%)" : undefined,
    transform: `translate3d(${px(x)},${px(y)},${px(z)}) rotateZ(34deg) rotateX(-70deg) translate(${px(-w / 2)},calc(${H} * -1))`,
  };
  return (
    <div className="t3-plane t3-two" style={style}>
      {children}
    </div>
  );
}

/** Flat square lying in the tile plane, centred on x/y. */
export function Plane({ size, z = 0, className, style, children }: { size: number; z?: number; className?: string; style?: CSSProperties; children?: ReactNode }) {
  return (
    <div className={`t3-plane${className ? ` ${className}` : ""}`} style={{ width: size, height: size, transform: `translate3d(${px(-size / 2)},${px(-size / 2)},${px(z)})`, ...style }}>
      {children}
    </div>
  );
}

/** SVG path of a gear: n teeth, outer radius ro, root radius ri. */
export function gearPath(cx: number, cy: number, n: number, ro: number, ri: number) {
  const step = (Math.PI * 2) / n;
  const p = (a: number, r: number) => `${(cx + Math.cos(a) * r).toFixed(2)} ${(cy + Math.sin(a) * r).toFixed(2)}`;
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = i * step;
    d += `${i ? "L" : "M"}${p(a - step * 0.3, ri)} L${p(a - step * 0.14, ro)} L${p(a + step * 0.14, ro)} L${p(a + step * 0.3, ri)} `;
  }
  return d + "Z";
}