import type { Metadata } from "next";
import { OrderSuccessView } from "@/components/checkout/OrderSuccessView";

export const metadata: Metadata = {
  title: "Order Confirmed — DANSHOP",
  description: "Your DANSHOP order confirmation.",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return <OrderSuccessView />;
}
