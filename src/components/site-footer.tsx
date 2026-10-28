import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-glow" aria-hidden="true" />
      <div className="footer-inner">
        <div className="footer-main">
          <div className="footer-brand">
          <Link className="brand brand-footer" href="/">
            Bawat<span>Pieza</span><i aria-hidden="true">✳</i>
          </Link>
          <p>Movement in, energy out.<br />Kinetic systems for everyday spaces.</p>
          </div>
          <div className="footer-links">
            <div>
              <p className="footer-heading">EXPLORE</p>
              <Link href="/shop">Tiles and components <ArrowRight aria-hidden="true" /></Link>
              <Link href="/story">How it works <ArrowRight aria-hidden="true" /></Link>
              <Link href="/orders">Order tracking <ArrowRight aria-hidden="true" /></Link>
              <Link href="/contact">Get in touch <ArrowRight aria-hidden="true" /></Link>
            </div>
            <div>
              <p className="footer-heading">PROJECT ENQUIRIES</p>
              <a href="mailto:energy@bawatpieza.com">energy@bawatpieza.com</a>
              <span>Piezoelectric + dynamo systems</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© Bawat Pieza. Kinetic energy systems.</span>
          <span>Power from everyday movement.</span>
        </div>
      </div>
    </footer>
  );
}
