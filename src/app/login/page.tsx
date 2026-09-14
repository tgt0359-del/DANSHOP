import type { Metadata } from "next";
import { LoginView } from "@/components/auth/LoginView";

export const metadata: Metadata = {
  title: "Sign In — DANSHOP",
  description: "Sign in to your DANSHOP account.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginView />;
}
