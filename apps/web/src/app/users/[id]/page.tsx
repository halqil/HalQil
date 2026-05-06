"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../lib/api";
import { CheckCircle, XCircle, BarChart2, Calendar, User, Wallet, Star } from "lucide-react";
import toast from "react-hot-toast";

export default function UserProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [user, setUser] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get(`/user/${id}`)
      .then(res => {
        if (res.data.success) setUser(res.data.data);
        else toast.error("Foydalanuvchi topilmadi");
      })
      .catch(() => {
        toast.error("Foydalanuvchi topilmadi");
        router.push("/");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  if (!user) return null;

  const total = user.successfulOrders + user.cancelledOrders;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-bl-full -z-10"></div>

        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0 border-4 border-white shadow-md">
            {user.avatar ? (
              <img src={`http://localhost:5000${user.avatar}`} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-gray-400">{user.name?.charAt(0)}</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <span
                className={`w-3 h-3 rounded-full ${user.isOnline ? "bg-green-500" : "bg-gray-300"}`}
                title={user.isOnline ? "Online" : "Offline"}
              ></span>
            </div>
            {user.username && (
              <div className="text-blue-600 font-medium text-sm mb-1">@{user.username}</div>
            )}
            {user.walletId && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Wallet size={12} />
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{user.walletId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Online status text */}
        <div className="mt-4 text-xs text-gray-400">
          {user.isOnline ? (
            <span className="text-green-600 font-medium">● Hozir online</span>
          ) : user.lastSeenAt ? (
            <span>Oxirgi faollik: {new Date(user.lastSeenAt).toLocaleString("uz-UZ")}</span>
          ) : (
            <span>Offline</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart2 size={20} className="text-blue-600" />
          Statistika
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Reliability */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
            <Star className="text-blue-500 mx-auto mb-1" size={22} />
            <div className="text-2xl font-extrabold text-blue-700">{Math.round(user.reliability || 100)}%</div>
            <div className="text-xs text-blue-500 font-medium mt-1">Ishonchlilik</div>
          </div>

          {/* Successful */}
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
            <CheckCircle className="text-green-500 mx-auto mb-1" size={22} />
            <div className="text-2xl font-extrabold text-green-700">{user.successfulOrders ?? 0}</div>
            <div className="text-xs text-green-500 font-medium mt-1">Muvaffaqiyatli</div>
          </div>

          {/* Cancelled */}
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
            <XCircle className="text-red-400 mx-auto mb-1" size={22} />
            <div className="text-2xl font-extrabold text-red-600">{user.cancelledOrders ?? 0}</div>
            <div className="text-xs text-red-400 font-medium mt-1">Bekor qilingan</div>
          </div>
        </div>

        {total > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Umumiy buyurtmalar: {total} ta</span>
              <span>{Math.round(user.reliability || 100)}% ishonchlilik</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.round(user.reliability || 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Member since */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center gap-3 text-sm text-gray-600">
        <Calendar size={18} className="text-gray-400" />
        <span>
          A'zo bo'lgan: <strong className="text-gray-900">
            {new Date(user.createdAt).toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" })}
          </strong>
        </span>
      </div>
    </div>
  );
}
