import type { Metadata } from "next";
import AuthPage from "@/components/auth-page";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Bawat Pieza account.",
};

export default function LoginPage() {
  return <AuthPage mode="login" />;
}
