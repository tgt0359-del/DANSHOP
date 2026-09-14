import type { Metadata } from "next";
import { PaymentReturnPlaceholder } from "@/components/payments/PaymentReturnPlaceholder";

export const metadata: Metadata = {
  title: "Payment Failed — DANSHOP",
  description: "Placeholder return route for a future payment provider integration.",
  robots: { index: false, follow: false },
};

export default function PaymentFailedReturnPage() {
  return <PaymentReturnPlaceholder kind="failed" />;
}
