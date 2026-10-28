import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How the tile works",
  description: "Learn how Bawat Pieza combines piezoelectric technology and a dynamo to harvest energy from footsteps.",
};

export default function StoryPage() {
  return (
    <main className="page-shell story-page">
      <section className="page-intro story-intro">
        <p className="eyebrow">THE IDEA BEHIND BAWAT PIEZA</p>
        <h1>Turn everyday<br />movement into energy.</h1>
        <p>A modular kinetic floor tile, designed as a hands-on energy system.</p>
      </section>
      <section className="story-feature">
        <div className="story-feature-image" role="img" aria-label="Illustration of the Bawat Pieza kinetic energy tile" />
        <div className="story-feature-copy">
          <p className="eyebrow">THE KINETIC FLOOR TILE</p>
          <h2>A step presses.<br />A charge starts.<br />Energy is captured.</h2>
          <p>
            When someone steps on the tile, its piezoelectric elements respond
            to pressure and generate a small electrical charge. A
            dynamo-assisted mechanism also converts repeated movement into
            electrical output. The harvested energy can be routed to a
            low-voltage demonstration or compatible storage controller.
          </p>
        </div>
      </section>
      <section className="story-values">
        <div><span>01</span><h2>Piezoelectric layer</h2><p>Pressure on the tile flexes piezo elements, creating a small electrical output with each step.</p></div>
        <div><span>02</span><h2>Dynamo-assisted motion</h2><p>Repeated movement also drives a compact dynamo module for electromagnetic energy harvesting.</p></div>
        <div><span>03</span><h2>Modular system</h2><p>Connect compatible sensor, rectifier, and controller components for low-voltage experiments.</p></div>
      </section>
      <section className="story-cta">
        <p className="eyebrow">EXPLORE THE SYSTEM</p>
        <h2>Build your kinetic energy setup.</h2>
        <Link className="button button-dark" href="/shop">Shop tiles and components <span aria-hidden="true">↗</span></Link>
      </section>
    </main>
  );
}
