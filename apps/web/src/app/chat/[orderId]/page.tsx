"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import ChatThread from "@/components/chat/ChatThread";
import { Loader2 } from "lucide-react";

export default function OrderChatPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!orderId) return;

    async function fetchOrder() {
      try {
        setLoading(true);
        const res = await api.get(`/orders/${orderId}`);
        if (res.data.success) {
          setOrder(res.data.data);
        } else {
          toast.error("Buyurtma topilmadi yoki ruxsat yo'q");
          router.push("/chat");
        }
      } catch (err) {
        toast.error("Suhbatni yuklashda xatolik yuz berdi");
        router.push("/chat");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[var(--bg-secondary)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <span className="text-xs text-[var(--muted)] font-medium">
            Suhbat yuklanmoqda...
          </span>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return <ChatThread order={order} />;
}
