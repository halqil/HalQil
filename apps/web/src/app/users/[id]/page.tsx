"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import api from "@/lib/api"
import Avatar from "@/components/Avatar"
import toast from "react-hot-toast"
import {
  ChevronLeft, CheckCircle, XCircle, Calendar,
  Shield, Briefcase, ChevronRight
} from "lucide-react"

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.get(`/user/${id}`)
      .then(res => {
        if (res.data.success) setUser(res.data.data)
        else toast.error("Foydalanuvchi topilmadi")
      })
      .catch(() => {
        toast.error("Foydalanuvchi topilmadi")
        router.back()
      })
      .finally(() => setLoading(false))
  }, [id, router])

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>
  )
  if (!user) return null

  const total = (user.successfulOrders ?? 0) + (user.cancelledOrders ?? 0)
  const isProvider = user.role === "PROVIDER" &&
    user.providerProfile?.status === "APPROVED"

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 fade-in">

      {/* Orqaga */}
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-sm w-fit hover:text-blue-500 transition-colors"
        style={{ color: "var(--text-secondary)" }}>
        <ChevronLeft size={18} /> Orqaga
      </button>

      {/* Asosiy blok */}
      <div className="glass-card p-6 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} avatar={user.avatar} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
                {user.name}
              </h1>
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                user.isOnline ? "bg-green-500" : "bg-gray-400"
              }`} />
            </div>
            {user.username && (
              <div className="text-sm text-blue-500 mt-0.5">@{user.username}</div>
            )}
            <div className="flex items-center gap-1.5 text-xs mt-1"
              style={{ color: "var(--muted)" }}>
              <Calendar size={12} />
              {new Date(user.createdAt).toLocaleDateString("uz-UZ", {
                year: "numeric", month: "long", day: "numeric"
              })} dan beri a'zo
            </div>
          </div>
        </div>

        {/* Online holat */}
        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {user.isOnline ? (
            <span className="text-green-500 font-medium">Hozir online</span>
          ) : user.lastSeenAt ? (
            <span>Oxirgi faollik: {new Date(user.lastSeenAt).toLocaleString("uz-UZ", {
              dateStyle: "short", timeStyle: "short"
            })}</span>
          ) : (
            <span>Offline</span>
          )}
        </div>
      </div>

      {/* Statistika */}
      <div className="glass-card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide"
          style={{ color: "var(--muted)" }}>
          Mijoz statistikasi
        </h2>

        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-3 text-center">
            <Shield size={18} className="mx-auto mb-1 text-blue-500" />
            <div className="text-xl font-bold" style={{ color: "var(--text)" }}>
              {Math.round(user.reliability ?? 100)}%
            </div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              Ishonchlilik
            </div>
          </div>

          <div className="glass-card p-3 text-center">
            <CheckCircle size={18} className="mx-auto mb-1 text-emerald-500" />
            <div className="text-xl font-bold" style={{ color: "var(--text)" }}>
              {user.successfulOrders ?? 0}
            </div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              Muvaffaqiyatli
            </div>
          </div>

          <div className="glass-card p-3 text-center">
            <XCircle size={18} className="mx-auto mb-1 text-red-400" />
            <div className="text-xl font-bold" style={{ color: "var(--text)" }}>
              {user.cancelledOrders ?? 0}
            </div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              Bekor qilingan
            </div>
          </div>
        </div>

        {total > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-1.5"
              style={{ color: "var(--text-secondary)" }}>
              <span>Jami {total} ta buyurtma</span>
              <span>{Math.round(user.reliability ?? 100)}%</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--sidebar-hover)" }}>
              <div className="h-2 rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.round(user.reliability ?? 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Provayder bo'lsa link */}
      {isProvider && (
        <Link
          href={`/providers/${user.providerProfile.id}`}
          className="glass-card p-4 flex items-center gap-3 hover:scale-[1.01] transition-transform group">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
            <Briefcase size={20} className="text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm group-hover:text-indigo-500 transition-colors"
              style={{ color: "var(--text)" }}>
              Provayder profilini ko'rish
            </div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              Xizmatlar, sharhlar va narxlar
            </div>
          </div>
          <ChevronRight size={18} style={{ color: "var(--muted)" }} />
        </Link>
      )}

    </div>
  )
}
