import type { Metadata } from "next";
import { PaymentReturnPlaceholder } from "@/components/payments/PaymentReturnPlaceholder";

export const metadata: Metadata = {
  title: "Payment Return — DANSHOP",
  description: "Placeholder return route for a future payment provider integration.",
  robots: { index: false, follow: false },
};

export default function PaymentSuccessReturnPage() {
  return <PaymentReturnPlaceholder kind="success" />;
}
