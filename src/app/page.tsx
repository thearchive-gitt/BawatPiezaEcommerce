"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { animate, useMotionValue } from "framer-motion";
import { ShimmeringText } from "@/components/ui/shimmering-text";
import ProductGrid from "@/components/store/product-grid";
import { products } from "@/data/products";
import "./home.css";

const HeroTile = dynamic(() => import("./HeroTile"), { ssr: false });
const IsoTile = dynamic(() => import("./IsoTile"), { ssr: false });

const ALL_LAYERS = [0, 1, 2, 3, 4, 5];

const OPEN = 0.25; // IsoTile "fully open" progress
const HEADER_FALLBACK = 88; // used until the real .site-header height is measured

/* Scrolling only TRIGGERS the moves below; each one then plays on its own, eased, in real time (and reverses the same way). */
const OPEN_ON = 0.05; // scroll fraction that triggers the tile opening
const OPEN_OFF = 0.015; // scrolling back above this closes it
const DIVE_ON = 0.38; // scroll fraction that triggers the dive into the gear + circle
const DIVE_OFF = 0.28;
const MAX_ZOOM = 4.2; // how far the tile is scaled up while diving
const LOCK_AT = 0.55; // while the circle section has not been reached, scrolling cannot go past this point of the hero runway
const R0 = 5; // circle radius (px) when it first appears on the gear hub
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EASE_IO: [number, number, number, number] = [0.65, 0, 0.35, 1];

const smooth = (t: number) => t * t * (3 - 2 * t);

const SECTIONS = [
  { id: "top", label: "Home" },
  { id: "system", label: "How it works" },
  { id: "business", label: "For business" },
  { id: "shop", label: "Shop" },
  { id: "story", label: "Story" },
  { id: "pilot", label: "Start a pilot" },
];

const STEPS = [
  { title: "A step presses the top plate", text: "The 5mm sintra board and EVA rubber layer take the load and cushion every footstep.", parts: ["5mm sintra board", "EVA rubber"] },
  { title: "Springs guide the travel", text: "Compression springs on 12mm linear guides and LM12UU bearings keep the plate moving straight down, then push it back up.", parts: ["Compression spring", "Linear guide 12mm", "LM12UU bearings"] },
  { title: "Piezo discs flex", text: "The plate presses on a cluster of piezoelectric discs, which produce a charge as they are compressed.", parts: ["Piezoelectric discs"] },
  { title: "A thread spins the dynamo", text: "A helical thread turns the downward push into rotation, passed through a bevel gear and flange coupling to the dynamo.", parts: ["Helical thread", "Bevel gear", "Flange coupling", "Clutch housing", "Pillow block bearing", "Dynamo"] },
  { title: "Framed, protected, modular", text: "An aluminum U profile frame, EPDM rubber matting and cable glands make each tile sturdy and easy to link.", parts: ["Aluminum U profile 5x5", "EPDM rubber matting", "EPDM cord", "Cable gland"] },
];

const MARQUEE = ["Capture movement", "Piezoelectric conversion", "Dynamo-assisted harvesting", "Modular by design"];

const BUSINESS = [
  {
    src: "/products/kinetic-floor-tile-internal.png",
    alt: "Internal piezoelectric mechanism inside a kinetic energy harvesting floor tile",
    title: "Grid-connected energy",
    text: "Deploy modular piezo dynamo tiles in entrances, corridors and transit hubs to capture energy from everyday foot traffic.",
  },
  {
    src: "/products/kinetic-floor-tile-side.png",
    alt: "Side profile of a modular piezoelectric floor tile for commercial installation",
    title: "Foot traffic analytics",
    text: "Pair harvested energy with step data to understand circulation, occupancy patterns and how your busiest spaces perform.",
  },
  {
    src: "/products/hero-piezo-side-view.png",
    alt: "Architectural side view of a Bawat Pieza kinetic energy floor tile",
    title: "Cost savings",
    text: "Build a measurable energy pilot, reduce reliance on conventional power for selected loads, and give sustainability teams auditable data.",
  },
];

const clamp = (v: number) => Math.min(Math.max(v, 0), 1);

export default function Home() {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null); // the sticky, pinned screen
  const copyRef = useRef<HTMLDivElement>(null);
  const asideRef = useRef<HTMLDivElement>(null); // lead + buttons: they swing to the right side while the tile centres
  const slotRef = useRef<HTMLDivElement>(null); // where the tile rests in the hero
  const zoomRef = useRef<HTMLDivElement>(null); // wrapper we scale / move to dive into the gear
  const portalRef = useRef<HTMLDivElement>(null); // the "From footstep to electricity" section, revealed through a circle
  const ringRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [opened, setOpened] = useState(false); // circle is big enough for the section's content to appear
  const progress = useMotionValue(0); // 0 = closed, OPEN = fully open (scroll-driven)
  const spin = useMotionValue(0);
  const closed = useMotionValue(0); // the second section's tile stays closed

  // Scroll only flips two switches (open / dive). Each switch drives a time-based animation, and render() paints from those.
  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const hero = heroRef.current;
    const copy = copyRef.current;
    const aside = asideRef.current;
    const slot = slotRef.current;
    const zoom = zoomRef.current;
    const portal = portalRef.current;
    const ring = ringRef.current;
    if (!root || !track || !hero || !copy || !aside || !slot || !zoom || !portal || !ring) return;

    const header = document.querySelector<HTMLElement>(".site-header");
    const sectionEls = SECTIONS.map((s) => document.getElementById(s.id));

    const o = { v: 0 }; // 0 closed -> 1 open (animated)
    const c = { v: 0 }; // 0 tile on the right -> 1 tile centred (happens BEFORE it opens)
    const d = { v: 0 }; // 0 normal -> 1 circle has swallowed the screen (animated)
    let wantOpen = 0;
    let wantDive = 0;
    let oAnim: { stop: () => void } | null = null;
    let cAnim: { stop: () => void } | null = null;
    let dAnim: { stop: () => void } | null = null;
    let hdr = 0;
    let raf = 0;
    let rr = 0;
    let isOpen = false;
    let gear: Element | null = null;

    const render = () => {
      rr = 0;
      const hh = header?.offsetHeight || HEADER_FALLBACK;
      if (hh !== hdr) {
        hdr = hh;
        root.style.setProperty("--hdr", `${hh}px`);
      }
      const st = hero.getBoundingClientRect();

      // tile opening + gear turning
      progress.set(OPEN * o.v);
      spin.set(o.v * 540 + d.v * 900);

      // the tile centres first; the headline + description fade out while it does (they stay where they are)
      const fade = smooth(clamp(c.v / 0.7));
      hero.style.setProperty("--p", fade.toFixed(3));
      aside.style.opacity = String(clamp(1 - fade * 1.1));
      copy.style.pointerEvents = aside.style.pointerEvents = fade > 0.6 ? "none" : "auto";

      // dive: scale the tile around the gear and bring the gear to the middle of the screen
      if (!gear || !zoom.contains(gear)) gear = zoom.querySelector(".iso-gear");
      const S = 1 + (MAX_ZOOM - 1) * d.v;
      const sl = slot.getBoundingClientRect();
      const wr = zoom.getBoundingClientRect(); // includes last paint's transform
      const cs = wr.width / Math.max(zoom.offsetWidth, 1);
      let gx = sl.width / 2;
      let gy = sl.height / 2;
      if (gear) {
        const gr = gear.getBoundingClientRect();
        gx = (gr.left + gr.width / 2 - wr.left) / cs; // gear centre in the wrapper's own coordinates
        gy = (gr.top + gr.height / 2 - wr.top) / cs;
      }
      const cx = st.left + st.width / 2;
      const nx = sl.left + gx + (cx - (sl.left + sl.width / 2)) * c.v; // the tile slides to the middle of the screen before it opens
      const ny = sl.top + gy;
      const px = nx + (cx - nx) * d.v;
      const py = ny + (st.top + st.height / 2 - ny) * d.v;
      zoom.style.transform = `translate(${(px - sl.left - S * gx).toFixed(2)}px, ${(py - sl.top - S * gy).toFixed(2)}px) scale(${S.toFixed(4)})`;

      // circle: a dot on the gear hub that swells until it fills the screen
      const ox = px - st.left;
      const oy = py - st.top;
      // the circle also swallows the top nav, so it must be big enough to reach the header's top corners too
      const hr = header?.getBoundingClientRect();
      const up = hr ? py - hr.top : oy; // distance from the circle centre up to the header's top edge
      const rMax = Math.hypot(Math.max(ox, st.width - ox), Math.max(up, st.height - oy)) + 2;
      const bud = smooth(clamp(d.v / 0.06));
      const e = smooth(clamp((d.v - 0.08) / 0.92));
      const R = bud <= 0 ? 0 : Math.min(rMax, R0 * bud * Math.pow(rMax / R0, e));
      const full = R >= rMax - 1;

      portal.style.visibility = R < 0.5 ? "hidden" : "visible";
      portal.style.clipPath = full ? "none" : `circle(${R.toFixed(1)}px at ${ox.toFixed(1)}px ${oy.toFixed(1)}px)`;
      ring.style.opacity = R < 0.5 || full ? "0" : String(1 - clamp((R / rMax - 0.55) / 0.35));
      ring.style.width = ring.style.height = `${(2 * R).toFixed(1)}px`;
      ring.style.transform = `translate3d(${(ox - R).toFixed(1)}px, ${(oy - R).toFixed(1)}px, 0)`;
      zoom.style.visibility = full ? "hidden" : "visible"; // stop painting the 3D tile once it is covered

      // the same circle, drawn over the header (see .site-header::before): the nav is swallowed with the hero
      if (header && hr) {
        header.style.setProperty("--hc-x", `${(px - hr.left).toFixed(1)}px`);
        header.style.setProperty("--hc-y", `${(py - hr.top).toFixed(1)}px`);
        header.style.setProperty("--hc-r", `${R.toFixed(1)}px`);
        header.style.setProperty("--hc-o", full ? "0" : "1"); // once everything is white, the overlay fades away and the white nav shows
      }

      // header turns white (dark text) once the white section has swallowed the screen
      const headerTheme = full ? "light" : "red";
      if (hero.dataset.headerTheme !== headerTheme) {
        hero.dataset.headerTheme = headerTheme;
        window.dispatchEvent(new Event("bp-header-theme"));
      }

      const nowOpen = R / rMax > 0.4;
      if (nowOpen !== isOpen) {
        isOpen = nowOpen;
        setOpened(nowOpen);
      }
    };
    const queueRender = () => {
      if (!rr) rr = requestAnimationFrame(render);
    };

    const setOpenTarget = (v: number) => {
      if (v === wantOpen) return;
      wantOpen = v;
      cAnim?.stop();
      oAnim?.stop();
      // opening: centre first, then open. closing: close first, then slide back to the right.
      cAnim = animate(c.v, v, {
        duration: 1.1,
        delay: v ? 0 : o.v > 0.05 ? 1.0 : 0,
        ease: EASE_IO,
        onUpdate: (x) => { c.v = x; queueRender(); },
      });
      oAnim = animate(o.v, v, {
        duration: v ? 2.1 : 1.3,
        delay: v && c.v < 0.9 ? 0.9 : 0,
        ease: EASE_OUT,
        onUpdate: (x) => { o.v = x; queueRender(); },
      });
    };
    const setDiveTarget = (v: number) => {
      if (v === wantDive) return;
      wantDive = v;
      if (v) setOpenTarget(1); // the circle always grows out of an open tile
      dAnim?.stop();
      dAnim = animate(d.v, v, {
        duration: v ? 2.6 : 1.5,
        delay: v && o.v < 0.9 ? 2.3 : 0, // let the tile centre and finish opening first
        ease: EASE_IO,
        onUpdate: (x) => { d.v = x; queueRender(); },
      });
    };

    // ---- scroll lock: the page cannot move past the hero until the circle has fully opened ----
    const locked = () => d.v < 0.999;
    const limitY = () => {
      const t = track.getBoundingClientRect();
      const range = Math.max(t.height - hero.offsetHeight, 1);
      return t.top + window.scrollY - (header?.offsetHeight || HEADER_FALLBACK) + LOCK_AT * range;
    };
    const holdBack = () => {
      if (!locked()) return;
      const lim = limitY();
      if (window.scrollY > lim + 0.5) window.scrollTo({ top: lim, left: 0, behavior: "instant" as ScrollBehavior });
    };
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0 && locked() && window.scrollY >= limitY() - 1) e.preventDefault();
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0]?.clientY ?? 0; };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0;
      if (y < touchY && locked() && window.scrollY >= limitY() - 1) e.cancelable && e.preventDefault(); // finger up = scroll down
      touchY = y;
    };

    const onScroll = () => {
      holdBack();
      if (!raf) raf = requestAnimationFrame(update);
    };
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const t = track.getBoundingClientRect();
      const h = hero.getBoundingClientRect();
      const hh = header?.offsetHeight || HEADER_FALLBACK;
      const s = clamp((hh - t.top) / Math.max(t.height - h.height, 1));

      if (s > DIVE_ON) setDiveTarget(1);
      else if (s < DIVE_OFF) setDiveTarget(0);
      if (s > OPEN_ON) setOpenTarget(1);
      else if (s < OPEN_OFF && wantDive === 0) setOpenTarget(0);

      const max = document.documentElement.scrollHeight - vh;
      root.style.setProperty("--page", clamp(window.scrollY / Math.max(max, 1)).toString());
      let current = 0;
      sectionEls.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= vh * 0.45) current = i;
      });
      setActive(current);
      queueRender();
    };

    holdBack();
    render();
    update();
    const late = window.setTimeout(render, 400); // the tile mounts a moment later (dynamic import): find the gear
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.clearTimeout(late);
      ["--hc-x", "--hc-y", "--hc-r", "--hc-o"].forEach((k) => header?.style.removeProperty(k)); // leave the shared header clean
      oAnim?.stop();
      cAnim?.stop();
      dAnim?.stop();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      if (raf) cancelAnimationFrame(raf);
      if (rr) cancelAnimationFrame(rr);
    };
  }, [progress, spin]);

  // 3D fan-out entrance for the business cards (runs once).
  useEffect(() => {
    const el = document.querySelector(".bp-fan");
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onHeroPointer = useCallback((ev: React.PointerEvent<HTMLElement>) => {
    const r = ev.currentTarget.getBoundingClientRect();
    ev.currentTarget.style.setProperty("--mx", ((ev.clientX - r.left) / r.width - 0.5).toFixed(3));
    ev.currentTarget.style.setProperty("--my", ((ev.clientY - r.top) / r.height - 0.5).toFixed(3));
  }, []);

  return (
    <main className="bp" ref={rootRef}>
      <div className="bp-progress" aria-hidden="true" />

      <nav className="bp-rail" aria-label="Page sections">
        {SECTIONS.map((s, i) => (
          <a key={s.id} href={`#${s.id}`} aria-current={active === i ? "true" : undefined}>
            <span>{s.label}</span>
            <i aria-hidden="true" />
          </a>
        ))}
      </nav>

      {/* 1 + 2 — HERO and "FROM FOOTSTEP TO ELECTRICITY", one pinned scroll runway.
          The tile plays its intro once, then scrolling opens it, dives into the gear, and a circle grows out of the gear
          to reveal the next section inside it. */}
      <section id="top" className="bp-hero-track" ref={trackRef}>
        <div className="bp-hero bp-red" data-header-theme="red" ref={heroRef} onPointerMove={onHeroPointer}>
          <video className="bp-hero-video" autoPlay loop muted playsInline aria-hidden="true">
            <source src="/Rotating_360_degrees_on_axis_25d5540c_f99d43a5.mp4" type="video/mp4" />
          </video>
          <div className="bp-hero-copy" ref={copyRef}>
            <p className="bp-kicker">Kinetic energy, built into every step</p>
            <h1 className="hero-title bp-title" aria-label="Every step creates power.">
              <span className="bp-title-line"><ShimmeringText duration={4000} text="Every step" /></span>
              <span className="bp-title-line"><ShimmeringText duration={4000} text="creates power." /></span>
            </h1>
          </div>
          <div className="bp-hero-aside" ref={asideRef}>
            <p className="bp-lead">
              Meet the modular floor tile that captures footsteps with piezoelectric technology and a dynamo-assisted system.
            </p>
            <div className="bp-actions">
              <Link className="bp-btn bp-btn-primary" href="/shop">Shop the tile <span aria-hidden="true">↗</span></Link>
              <Link className="bp-btn bp-btn-ghost" href="/story">How it works</Link>
            </div>
          </div>

          <div className="bp-hero-tile" ref={slotRef} aria-hidden="true">
            <div className="bp-hero-zoom" ref={zoomRef}>
              <HeroTile progress={progress} spin={spin} />
            </div>
          </div>

          {/* the section that lives inside the circle */}
          <div className={`bp-portal bp-white${opened ? " is-open" : ""}`} ref={portalRef}>
            <div className="bp-stage-glow" aria-hidden="true" />
            <div className="bp-portal-tile">
              <IsoTile progress={closed} activeLayers={ALL_LAYERS} fit={[560, 600]} />
            </div>
            <div className="bp-portal-copy">
              <div className="bp-portal-head">
                <p className="bp-kicker">From footstep to electricity</p>
                <h2>Movement in.<br />Energy out.</h2>
              </div>
              <ol className="bp-steps">
                {STEPS.map((s, i) => (
                  <li key={s.title} style={{ ["--i" as string]: i }}>
                    <span className="bp-step-n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{s.title}</strong>
                      <p>{s.text}</p>
                      <em className="bp-parts">{s.parts.map((x) => <b key={x}>{x}</b>)}</em>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="bp-portal-ring" ref={ringRef} aria-hidden="true" />
        </div>
        {/* nav anchor: lands where the circle has fully opened */}
        <div id="system" className="bp-system-anchor" aria-hidden="true" />
      </section>

      {/* 2b — AD BAND: white, 40% of the viewport, text slides forever; it slides up over the docked tile */}
      <section className="bp-ad bp-white" data-header-theme="light" aria-label="How the tile works">
        <div className="bp-ad-track">
          {[0, 1].map((n) => (
            <div className="bp-ad-set" key={n} aria-hidden={n === 1 ? "true" : undefined}>
              {MARQUEE.map((m) => (
                <span key={m + n}>{m}<b aria-hidden="true">✳</b></span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* 3 — BUSINESS VALUE */}
      <section id="business" className="bp-screen bp-business bp-white" data-header-theme="light" aria-labelledby="bp-business-h">
        <div className="bp-head">
          <p className="bp-kicker">Engineered for high-traffic spaces</p>
          <h2 id="bp-business-h">Turn movement into measurable infrastructure value.</h2>
        </div>
        <div className="bp-fan">
          {BUSINESS.map((b, i) => (
            <article className="bp-card" key={b.title} style={{ ["--i" as string]: i }}>
              <div className="bp-card-img">
                <Image src={b.src} alt={b.alt} width={800} height={800} />
              </div>
              <h3>{b.title}</h3>
              <p>{b.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 4 — SHOP */}
      <section id="shop" className="bp-screen bp-shop bp-white" data-header-theme="light">
        <div className="bp-head bp-head-row">
          <div>
            <p className="bp-kicker">The Bawat Pieza system</p>
            <h2>Start with a step.</h2>
          </div>
          <Link className="bp-btn bp-btn-ghost" href="/shop">Shop all components <span aria-hidden="true">→</span></Link>
        </div>
        <ProductGrid products={products.slice(0, 3)} />
      </section>

      {/* 5 — STORY */}
      <section id="story" className="bp-screen bp-story bp-red" data-header-theme="red">
        <div className="bp-story-art">
          <Image src="/HERO IMG.png" alt="Bawat Pieza piezoelectric tile mechanism, exploded view" width={1365} height={768} />
        </div>
        <div className="bp-story-copy">
          <p className="bp-kicker">Small-scale energy harvesting</p>
          <h2>One footstep<br />at a time.</h2>
          <p>
            Each press flexes piezoelectric elements to produce a charge. A dynamo-assisted mechanism adds another way to
            harvest repeated movement, ready for low-voltage experiments and demonstrations.
          </p>
          <Link className="bp-btn bp-btn-primary" href="/story">See how it works <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      {/* 6 — PILOT CTA */}
      <section id="pilot" className="bp-screen bp-pilot bp-white" data-header-theme="light" aria-labelledby="bp-pilot-h">
        <div className="bp-stage-glow" aria-hidden="true" />
        <p className="bp-pilot-big" aria-hidden="true"><span>Small steps.</span><span>Massive impact.</span></p>
        <div className="bp-pilot-copy">
          <p className="bp-kicker bp-kicker-light">Plan your pilot</p>
          <h2 id="bp-pilot-h">A smarter floor starts with a measurable brief.</h2>
          <p>
            Tell us about your site, expected foot traffic and target loads. We will help your facilities or development
            team scope a practical kinetic energy harvesting pilot.
          </p>
          <Link className="bp-btn bp-btn-primary" href="/contact">Talk to the Bawat Pieza team <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    </main>
  );
} 