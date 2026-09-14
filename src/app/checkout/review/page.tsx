import type { Metadata } from "next";
import { OrderReviewView } from "@/components/checkout/OrderReviewView";

export const metadata: Metadata = {
  title: "Review Order — DANSHOP",
  description: "Review your DANSHOP order before placing it.",
  robots: { index: false, follow: false },
};

export default function CheckoutReviewPage() {
  return <OrderReviewView />;
}
