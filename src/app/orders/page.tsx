import type { Metadata } from "next";
import { OrderHistoryView } from "@/components/orders/OrderHistoryView";

export const metadata: Metadata = {
  title: "Order History — DANSHOP",
  description: "View your past DANSHOP orders.",
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return <OrderHistoryView />;
}
