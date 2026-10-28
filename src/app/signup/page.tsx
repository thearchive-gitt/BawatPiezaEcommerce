import type { Metadata } from "next";
import AuthPage from "@/components/auth-page";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a Bawat Pieza account and stay close to the pieces you love.",
};

export default function SignupPage() {
  return <AuthPage mode="signup" />;
}
