import type { Metadata } from "next";
import { PaymentSelectionView } from "@/components/checkout/PaymentSelectionView";

export const metadata: Metadata = {
  title: "Payment Method — DANSHOP",
  description: "Choose a payment method for your DANSHOP order.",
  robots: { index: false, follow: false },
};

export default function CheckoutPaymentPage() {
  return <PaymentSelectionView />;
}
