"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, ShoppingBag, UserRound } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { useAuth } from "@/components/auth-provider";
import NotificationsBell from "@/components/notifications-bell";

const links = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Our story", href: "/story" },
  { label: "Purchase history", href: "/account/orders" },
  { label: "Contact", href: "/contact" },
];

export default function SiteHeader() {
  const { itemCount } = useCart();
  const { user, account, loading, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const visibleLinks = user
    ? [
        ...links.filter((link) => link.href !== "/"),
        { label: "Account", href: "/account" },
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
                <Link href="/account" onClick={() => setMenuOpen(false)}>
                  Profile &amp; settings
                </Link>
                <Link href="/cart" onClick={() => setMenuOpen(false)}>
                  Your bag ({itemCount})
                </Link>
                <Link href="/account/orders" onClick={() => setMenuOpen(false)}>
                  Purchase history
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
                      href="/cart"
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      <ShoppingBag aria-hidden="true" size={16} />
                      Your bag <span className="account-dropdown-count">{itemCount}</span>
                    </Link>
                    <Link
                      href="/account/orders"
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      <span className="account-dropdown-icon" aria-hidden="true">▤</span>
                      Purchase history
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
          <Link className="bag-link" href="/cart" aria-label={`Shopping bag, ${itemCount} items`}>
            <span className="bag-label">Your bag</span>
            <span className="bag-count">{itemCount}</span>
          </Link>
        </div>
      </header>
    </>
  );
}
