"use client"
import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { useAuthStore } from "@/lib/store"
import { Loader2 } from "lucide-react"
import toast from "react-hot-toast"

export default function OrderRedirectPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) return

    const checkOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`)
        if (res.data.success) {
          const order = res.data.data
          const isProvider = user.role === "PROVIDER" && order.provider?.userId === user.id

          if (isProvider) {
            router.replace(`/orders/received/${id}`)
          } else {
            router.replace(`/orders/requested/${id}`)
          }
        }
      } catch {
        toast.error("Buyurtma topilmadi")
        router.replace("/orders")
      }
    }

    checkOrder()
  }, [id, user, router])

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 size={32} className="animate-spin text-blue-500" />
    </div>
  )
}
