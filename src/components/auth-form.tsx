"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "login" | "signup";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email")).trim();
    const password = String(formData.get("password"));
    const name = String(formData.get("name") ?? "").trim();

    if (isSignup && !name) {
      setValidationError("Please enter your name.");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters.");
      return;
    }

    setValidationError("");
    setSubmitting(true);
    const supabase = getSupabaseBrowserClient();

    try {
      if (isSignup) {
        const nameParts = name.split(/\s+/).filter(Boolean);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              firstname: nameParts[0] ?? "",
              lastname: nameParts.slice(1).join(" "),
            },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage("Account created. Check your email to confirm your account, then sign in.");
          return;
        }
        router.push("/shop");
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/shop");
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "";
      setMessage(
        errorMessage.toLowerCase().includes("invalid login credentials")
          ? "The email or password is incorrect. Use the password saved in Supabase Auth; user_accounts stores profile details only."
          : errorMessage || "Authentication failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <p className="eyebrow">{isSignup ? "A LITTLE SOMETHING JUST FOR YOU" : "WELCOME BACK"}</p>
      <h2>{isSignup ? "Create your account." : "Good to see you again."}</h2>
      <p className="auth-description">
        {isSignup
          ? "Create an account to stay close to new tiles, components, and product updates."
          : "Sign in to pick up where you left off."}
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {isSignup && (
          <label>
            Your name
            <input
              autoComplete="name"
              name="name"
              placeholder="Your name"
              required
            />
          </label>
        )}
        <label>
          Email address
          <input
            autoComplete="email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </label>
        <label>
          Password
          <span className="password-field">
            <input
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={8}
              name="password"
              placeholder="At least 8 characters"
              required
              type={showPassword ? "text" : "password"}
              aria-invalid={Boolean(validationError)}
            />
            <button
              className="password-toggle"
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </span>
        </label>
        {isSignup && (
          <p className="auth-password-note">
            Use at least 8 characters for your password.
          </p>
        )}
        <button className="button button-dark auth-submit" type="submit">
          {submitting ? "Please wait…" : isSignup ? "Create account" : "Sign in"}{" "}
          <span aria-hidden="true">→</span>
        </button>
        {validationError && (
          <p className="auth-validation-error" role="alert">
            {validationError}
          </p>
        )}
        {message && (
          <p className="auth-status" role="status">
            {message}
          </p>
        )}
      </form>

      <p className="auth-switch">
        {isSignup ? "Already have an account?" : "New to Bawat Pieza?"}{" "}
        <Link href={isSignup ? "/login" : "/signup"}>
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
