"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth-provider";
import { ShimmeringText } from "@/components/ui/shimmering-text";
import ProductGrid from "@/components/store/product-grid";
import TilePackages from "@/components/store/tile-packages";
import { products } from "@/data/products";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const heroRef = useRef<HTMLElement>(null);
  const heroImageTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      router.replace("/shop");
    }
  }, [router, user]);

  useEffect(() => {
    const hero = heroRef.current;
    const imageTrack = heroImageTrackRef.current;
    if (!hero || !imageTrack) return;

    const updateHeroProgress = () => {
      const heroSettings = window.getComputedStyle(hero);
      const imageOnlyVh =
        Number.parseFloat(heroSettings.getPropertyValue("--hero-image-only-vh")) || 100;
      const textDurationVh =
        Number.parseFloat(heroSettings.getPropertyValue("--hero-text-duration-vh")) || 100;
      const progress = Math.min(Math.max(window.scrollY / 320, 0), 1);
      const trackTop = imageTrack.getBoundingClientRect().top + window.scrollY;
      const trackScroll = Math.max(window.scrollY - trackTop, 0);
      const viewportHeight = window.innerHeight;
      const imageOnlyDuration = (imageOnlyVh / 100) * viewportHeight;
      const textDuration = (textDurationVh / 100) * viewportHeight;
      const overlayProgress = Math.min(
        Math.max((trackScroll - imageOnlyDuration) / textDuration, 0),
        1,
      );
      hero.style.setProperty("--hero-scroll-progress", progress.toString());
      hero.style.setProperty("--hero-overlay-progress", overlayProgress.toString());
    };
    updateHeroProgress();
    window.addEventListener("scroll", updateHeroProgress, { passive: true });
    window.addEventListener("resize", updateHeroProgress);
    return () => {
      window.removeEventListener("scroll", updateHeroProgress);
      window.removeEventListener("resize", updateHeroProgress);
    };
  }, []);

  if (user) {
    return null;
  }

  return (
    <main>
      <section className="hero" ref={heroRef}>
        <video
          className="hero-background-video"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        >
          <source
            src="/Rotating_360_degrees_on_axis_25d5540c_f99d43a5.mp4"
            type="video/mp4"
          />
        </video>
        <div className="hero-copy">
          <p className="eyebrow">KINETIC ENERGY, BUILT INTO EVERY STEP</p>
          <h1 className="hero-title" aria-label="Every step creates power.">
            <span className="hero-title-line hero-title-line-one">
              <ShimmeringText duration={4000} text="Every step" />
            </span>
            <span className="hero-title-line hero-title-line-two">
              <ShimmeringText duration={4000} text="creates power." />
            </span>
          </h1>
          <p className="hero-description">
            Meet the modular floor tile that captures footsteps with
            piezoelectric technology and a dynamo-assisted system.
          </p>
          <div className="hero-actions">
            <Link className="button button-dark" href="/shop">Explore the tile <span aria-hidden="true">↗</span></Link>
            <Link className="text-link" href="/story">How it works <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="hero-image-track" ref={heroImageTrackRef}>
          <div className="hero-image-stage" role="img" aria-label="Exploded view of the Bawat Pieza piezoelectric kinetic floor tile mechanism">
            <Image
              src="/HERO IMG.png"
              alt="Bawat Pieza piezoelectric tile mechanism, exploded view"
              width={1365}
              height={768}
              priority
            />
            <div className="hero-overlay-copy" aria-hidden="true">
              <span>Small steps.</span>
              <span>Massive impact.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="values-strip" aria-label="How the tile works">
        <span>CAPTURE MOVEMENT</span><i aria-hidden="true">✳</i>
        <span>PIEZOELECTRIC CONVERSION</span><i aria-hidden="true">✳</i>
        <span>DYNAMO-ASSISTED HARVESTING</span><i aria-hidden="true">✳</i>
        <span>MODULAR BY DESIGN</span>
      </section>

      <section className="section" aria-labelledby="b2b-energy-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ENGINEERED FOR HIGH-TRAFFIC SPACES</p>
            <h2 id="b2b-energy-heading">Turn movement into measurable infrastructure value.</h2>
          </div>
        </div>
        <div className="product-grid">
          <article className="product-card">
            <Image
              src="/products/kinetic-floor-tile-internal.png"
              alt="Internal piezoelectric mechanism inside a kinetic energy harvesting floor tile"
              width={800}
              height={800}
            />
            <h3>Grid-connected energy</h3>
            <p>
              Deploy modular piezo dynamo tiles in entrances, corridors, and transit
              hubs to capture distributed energy from everyday foot traffic.
            </p>
          </article>
          <article className="product-card">
            <Image
              src="/products/kinetic-floor-tile-side.png"
              alt="Side profile of a modular piezoelectric floor tile for commercial installation"
              width={800}
              height={800}
            />
            <h3>Foot traffic analytics</h3>
            <p>
              Pair harvested energy with step data to understand circulation,
              occupancy patterns, and the performance of high-value spaces.
            </p>
          </article>
          <article className="product-card">
            <Image
              src="/products/hero-piezo-side-view.png"
              alt="Architectural side view of a Bawat Pieza kinetic energy floor tile"
              width={800}
              height={800}
            />
            <h3>Cost savings</h3>
            <p>
              Build a measurable energy pilot, reduce reliance on conventional
              power for selected loads, and give sustainability teams auditable
              operational data.
            </p>
          </article>
        </div>
      </section>

      <TilePackages />

      <section className="section section-featured">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE BAWAT PIEZA SYSTEM</p>
            <h2>Start with a step.</h2>
          </div>
          <Link className="text-link" href="/shop">Shop all components <span aria-hidden="true">→</span></Link>
        </div>
        <ProductGrid products={products.slice(0, 3)} />
      </section>

      <section className="home-story">
        <div className="story-image" role="img" aria-label="Illustrated modular kinetic energy floor tile" />
        <div className="home-story-copy">
          <p className="eyebrow">FROM FOOTSTEP TO ELECTRICITY</p>
          <h2>Movement in.<br />Energy out.</h2>
          <p>
            Each press flexes piezoelectric elements to produce a charge. A
            dynamo-assisted mechanism adds another way to harvest repeated
            movement, ready for low-voltage experiments and demonstrations.
          </p>
          <Link className="button button-outline" href="/story">See how it works <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <section className="closing-note">
        <span className="closing-sparkle" aria-hidden="true">✳</span>
        <p>Small-scale energy harvesting.<br />One footstep at a time.</p>
        <Link className="text-link" href="/shop">Explore the system <span aria-hidden="true">→</span></Link>
      </section>

      <section className="section" aria-labelledby="commercial-cta-heading">
        <p className="eyebrow">PLAN YOUR PILOT</p>
        <h2 id="commercial-cta-heading">A smarter floor starts with a measurable brief.</h2>
        <p>
          Tell us about your site, expected foot traffic, and target loads. We
          will help your facilities or development team scope a practical
          kinetic energy harvesting pilot.
        </p>
        <Link className="button button-dark" href="/contact">Talk to the Bawat Pieza team <span aria-hidden="true">↗</span></Link>
      </section>
    </main>
  );
}
