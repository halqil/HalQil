"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Settings, Shield, Bell, DollarSign, Loader2, Save, Power } from "lucide-react";

export default function ProviderSettingsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  
  // Status (Availability)
  const [status, setStatus] = useState("AVAILABLE");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Daily Limit
  const [dailyLimit, setDailyLimit] = useState(5);
  const [savingLimit, setSavingLimit] = useState(false);

  // Notifications
  const [notifyNewOrder, setNotifyNewOrder] = useState(true);
  const [notifyChat, setNotifyChat] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/provider/profile");
      if (res.data.success) {
        setStatus(res.data.data.availabilityStatus || "AVAILABLE");
        // Simulated: setDailyLimit(res.data.data.dailyLimit || 5);
      }
    } catch (error) {
      toast.error("Sozlamalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await api.patch("/provider/availability", { status: newStatus });
      if (res.data.success) {
        setStatus(newStatus);
        toast.success("Status yangilandi");
      }
    } catch (err) {
      toast.error("Xatolik");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveSettings = () => {
    // This would ideally hit an endpoint to save limits/notifications.
    // Simulating save for now.
    setSavingLimit(true);
    setTimeout(() => {
      setSavingLimit(false);
      toast.success("Sozlamalar saqlandi");
    }, 800);
  };

  const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-primary-500' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin w-8 h-8 text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="text-primary-500" />
          Usta sozlamalari
        </h1>
        <p className="text-gray-500 mt-1">Ish tartibi va profilingizni boshqaring.</p>
      </div>

      {/* Availability Status */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Power size={20} className={status === "AVAILABLE" ? "text-green-500" : "text-gray-400"} />
            Holat: {status === "AVAILABLE" ? "Faol" : "Band"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Yangi buyurtmalarni qabul qilishga tayyormisiz?
          </p>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
          <button
            onClick={() => handleUpdateStatus("AVAILABLE")}
            disabled={updatingStatus}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              status === "AVAILABLE"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Faol (Band Emas)
          </button>
          <button
            onClick={() => handleUpdateStatus("BUSY")}
            disabled={updatingStatus}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              status === "BUSY"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Band (Buyurtma olmayman)
          </button>
        </div>
      </section>

      {/* Work Preferences */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <DollarSign size={20} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Ish parametrlari</h2>
        </div>

        <div className="space-y-6 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kunlik buyurtmalar limiti</label>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                value={dailyLimit}
                onChange={e => setDailyLimit(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                min="1"
                max="20"
              />
              <span className="text-gray-500 text-sm">ta</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Bir kunda eng ko'pi bilan nechta buyurtma olmoqchisiz?</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
          <button 
            onClick={handleSaveSettings}
            disabled={savingLimit}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            {savingLimit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Saqlash
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Bell size={20} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Bildirishnomalar</h2>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Yangi buyurtmalar</p>
              <p className="text-sm text-gray-500">Menga mos tushadigan yangi buyurtmalar haqida xabar berish</p>
            </div>
            <Toggle checked={notifyNewOrder} onChange={setNotifyNewOrder} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Yangi xabarlar</p>
              <p className="text-sm text-gray-500">Mijozlardan kelgan yangi xabarlar</p>
            </div>
            <Toggle checked={notifyChat} onChange={setNotifyChat} />
          </div>
        </div>
      </section>
    </div>
  );
}
