import Link from "next/link";
import AuthForm from "@/components/auth-form";

type AuthPageProps = {
  mode: "login" | "signup";
};

export default function AuthPage({ mode }: AuthPageProps) {
  return (
    <main className="auth-page">
      <section className="auth-layout">
        <div className="auth-art" role="img" aria-label="Bawat Pieza modular kinetic energy tile">
          <p className="auth-art-label">ENERGY FROM EVERY STEP</p>
          <div className="auth-art-caption">
            <span>Movement in.</span>
            <span>Energy out.</span>
          </div>
          <Link href="/shop" className="auth-art-link">
            Find your everyday piece <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="auth-panel">
          <AuthForm mode={mode} />
        </div>
      </section>
    </main>
  );
}
