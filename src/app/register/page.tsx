import type { Metadata } from "next";
import { RegisterView } from "@/components/auth/RegisterView";

export const metadata: Metadata = {
  title: "Create Account — DANSHOP",
  description: "Create a DANSHOP account.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return <RegisterView />;
}
