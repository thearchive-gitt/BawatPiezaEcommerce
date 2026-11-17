"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import NotificationsBell from "@/components/notifications-bell";

const links = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Our story", href: "/story" },
  { label: "Contact", href: "/contact" },
];

export default function SiteHeader() {
  const { user, account, loading, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const visibleLinks = user
    ? [
        ...links.filter((link) => link.href !== "/"),
        { label: "Account", href: "/account" },
        { label: "Site assessments", href: "/account/assessments" },
        { label: "Payments", href: "/account/payments" },
      ]
    : links;
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
        <span>PROJECT QUOTATIONS AFTER SITE ASSESSMENT</span>
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
                <Link href="/account" onClick={() => setMenuOpen(false)}>
                  Profile &amp; settings
                </Link>
                <Link href="/account/assessments" onClick={() => setMenuOpen(false)}>
                  Site assessments
                </Link>
                <Link href="/account/payments" onClick={() => setMenuOpen(false)}>
                  Payments
                </Link>
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
              <NotificationsBell />
              <div className="account-menu">
                <button
                  className="account-menu-trigger"
                  type="button"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Open account menu"
                  onClick={() => setAccountMenuOpen((open) => !open)}
                >
                  <UserRound aria-hidden="true" size={17} />
                  <span className="header-account">Hi, {accountName}</span>
                  <span className="account-menu-chevron" aria-hidden="true">⌄</span>
                </button>
                {accountMenuOpen && (
                  <div className="account-dropdown" role="menu">
                    <div className="account-dropdown-heading">
                      <span className="account-avatar" aria-hidden="true">
                        {accountName.slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <strong>{accountName}</strong>
                        <span>{user.email}</span>
                      </div>
                    </div>
                    <Link
                      href="/account"
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      <Settings aria-hidden="true" size={16} />
                      Profile &amp; settings
                    </Link>
                    <Link
                      href="/account/assessments"
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      Site assessments
                    </Link>
                    <Link
                      href="/account/payments"
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      Payments
                    </Link>
                    <button
                      className="account-dropdown-signout"
                      type="button"
                      role="menuitem"
                      onClick={() => void handleSignOut()}
                    >
                      <LogOut aria-hidden="true" size={16} />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link className="header-signin" href="/login">Sign in</Link>
              <Link className="header-signup" href="/signup">Sign up</Link>
            </>
          ))}
        </div>
      </header>
    </>
  );
}
