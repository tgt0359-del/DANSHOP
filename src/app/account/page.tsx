import type { Metadata } from "next";
import { AccountView } from "@/components/account/AccountView";

export const metadata: Metadata = {
  title: "Account — DANSHOP",
  description: "Your DANSHOP account, orders, wishlist, recently viewed items, and settings.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountView />;
}
