import Link from "next/link";
import Image from "next/image";
import AuthForm from "@/components/auth-form";

type AuthPageProps = {
  mode: "login" | "signup";
};

export default function AuthPage({ mode }: AuthPageProps) {
  return (
    <main className="auth-page">
      <nav className="auth-navigation" aria-label="Main navigation">
        <Link className="auth-navigation-brand" href="/">
          <Image src="/LOGO4.png" alt="Bawat Pieza" width={34} height={34} priority />
          <span>bawat pieza</span>
        </Link>
        <div className="auth-navigation-links">
          <Link href="/">Home</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/story">Our story</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <Link className="auth-navigation-back" href="/">
          <span aria-hidden="true">←</span> Back to home
        </Link>
      </nav>
      <section className="auth-layout">
        <div className="auth-art" role="img" aria-label="Bawat Pieza modular kinetic energy tile">
          <div className="auth-art-brand">
            <Image src="/bawat-pieza-logo.png" alt="Bawat Pieza" width={40} height={40} priority />
            <span>BAWAT PIEZA</span>
          </div>
          <div className="auth-art-center">
            <div className="auth-art-orbit auth-art-orbit-one" />
            <div className="auth-art-orbit auth-art-orbit-two" />
            <Image src="/bawat-pieza-logo.png" alt="" width={270} height={270} priority />
          </div>
          <div className="auth-art-copy">
            <p className="auth-art-label">ENERGY FROM EVERY STEP</p>
            <p className="auth-art-caption">
              Powering better spaces, together.
            </p>
            <Link href="/shop" className="auth-art-link">
              Find your everyday piece <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <div className="auth-panel">
          <AuthForm mode={mode} />
        </div>
      </section>
    </main>
  );
}
