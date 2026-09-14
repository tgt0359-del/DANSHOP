import type { Metadata } from "next";
import { OrderDetailView } from "@/components/orders/OrderDetailView";

export const metadata: Metadata = {
  title: "Order Details — DANSHOP",
  description: "View the details of a past DANSHOP order.",
  robots: { index: false, follow: false },
};

export default async function OrderDetailPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return <OrderDetailView reference={reference} />;
}
