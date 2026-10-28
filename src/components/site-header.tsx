"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/store/cart-provider";
import { useAuth } from "@/components/auth-provider";

const links = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Our story", href: "/story" },
  { label: "Orders", href: "/orders" },
  { label: "Contact", href: "/contact" },
];

export default function SiteHeader() {
  const { itemCount } = useCart();
  const { user, account, loading, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const visibleLinks = user ? links.filter((link) => link.href !== "/") : links;
  const accountName = account?.firstname || user?.email?.split("@")[0] || "Account";

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <div className="announcement">
        <span>ENERGY FROM EVERY STEP</span>
        <span className="announcement-separator" aria-hidden="true">✳</span>
        <span>FREE DELIVERY ON ORDERS OVER ₱5,000</span>
      </div>
      <header className="site-header">
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span /><span />
        </button>
        <Link className="brand" href="/" onClick={() => setMenuOpen(false)}>
          <Image src="/LOGO4.png" alt="Bawat Pieza" width={42} height={42} />
          <span>bawat pieza</span>
        </Link>
        <nav className={`main-nav${menuOpen ? " is-open" : ""}`} aria-label="Main navigation">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mobile-account-links">
            {loading ? null : user ? (
              <>
                <span>Hi, {accountName}</span>
                <button type="button" onClick={() => void handleSignOut()}>Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)}>Sign in</Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)}>Create an account</Link>
              </>
            )}
          </div>
        </nav>
        <div className="header-actions">
          {!loading && (user ? (
            <>
              <span className="header-account">Hi, {accountName}</span>
              <button className="header-signin" type="button" onClick={() => void handleSignOut()}>Sign out</button>
            </>
          ) : (
            <>
              <Link className="header-signin" href="/login">Sign in</Link>
              <Link className="header-signup" href="/signup">Sign up</Link>
            </>
          ))}
          <Link className="bag-link" href="/cart" aria-label={`Shopping bag, ${itemCount} items`}>
            <span className="bag-label">Your bag</span>
            <span className="bag-count">{itemCount}</span>
          </Link>
        </div>
      </header>
    </>
  );
}
