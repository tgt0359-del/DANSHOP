import type { Metadata } from "next";
import { CartPageView } from "@/components/cart/CartPageView";

export const metadata: Metadata = {
  title: "Cart — DANSHOP",
  description: "Review the items in your DANSHOP cart before checkout.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <CartPageView />;
}
