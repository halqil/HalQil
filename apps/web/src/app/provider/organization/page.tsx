"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Building, Users, Clock, Send, ShieldAlert, Plus, Loader2 } from "lucide-react";

export default function ProviderOrganizationPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Forms
  const [joinOrgId, setJoinOrgId] = useState("");
  const [joinMessage, setJoinMessage] = useState("");
  const [applyingJoin, setApplyingJoin] = useState(false);

  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [applyingCreate, setApplyingCreate] = useState(false);

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
        setProfile(res.data.data);
      }
    } catch (error) {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinOrgId) return;
    setApplyingJoin(true);
    try {
      const res = await api.post("/provider/organization/apply-join", {
        organization_id: joinOrgId,
        message: joinMessage
      });
      if (res.data.success) {
        toast.success("Ariza muvaffaqiyatli yuborildi");
        setJoinOrgId("");
        setJoinMessage("");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setApplyingJoin(false);
    }
  };

  const handleApplyCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName) return;
    setApplyingCreate(true);
    try {
      const res = await api.post("/provider/organization/apply-create", {
        name: createName,
        description: createDescription
      });
      if (res.data.success) {
        toast.success("Tashkilot yaratish uchun ariza yuborildi");
        setCreateName("");
        setCreateDescription("");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setApplyingCreate(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin w-8 h-8 text-primary-500" />
      </div>
    );
  }

  // Check if provider is in an organization
  // Since we don't have the exact data structure mapped yet, we assume `profile.organizationMemberships` might exist
  const memberships = profile?.organizationMemberships || [];
  const activeMembership = memberships.find((m: any) => m.status === 'ACTIVE');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building className="text-primary-500" />
          Tashkilot
        </h1>
        <p className="text-gray-500 mt-1">Siz ishlaydigan tashkilot yoki yangi tashkilot yaratish arizasi.</p>
      </div>

      {activeMembership ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 font-bold text-xl">
              {activeMembership.organization?.name?.charAt(0) || "T"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{activeMembership.organization?.name}</h2>
              <p className="text-gray-500">{activeMembership.role === "ADMIN" ? "Administrator" : "A'zo"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 text-gray-700 font-medium mb-1">
                <Users size={18} /> A'zolar
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {activeMembership.organization?.members?.length || 1} ta
              </p>
            </div>
            
            {activeMembership.role === "ADMIN" && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 text-gray-700 font-medium mb-1">
                  <Clock size={18} /> Yangi arizalar
                </div>
                <p className="text-2xl font-bold text-gray-900">0 ta</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Join Organization */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
              <Send size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Tashkilotga qo'shilish</h2>
            <p className="text-sm text-gray-500 mb-6">Mavjud tashkilotga ID orqali qo'shilish arizasini yuborish.</p>
            
            <form onSubmit={handleApplyJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tashkilot ID (Masalan: clj...)</label>
                <input 
                  type="text" 
                  value={joinOrgId}
                  onChange={e => setJoinOrgId(e.target.value)}
                  placeholder="Tashkilot ID si"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xabar (Ixtiyoriy)</label>
                <textarea 
                  value={joinMessage}
                  onChange={e => setJoinMessage(e.target.value)}
                  placeholder="Nima sababdan qo'shilmoqchisiz..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none h-20"
                />
              </div>
              <button 
                type="submit" 
                disabled={applyingJoin}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {applyingJoin ? <Loader2 className="w-5 h-5 animate-spin" /> : "Ariza yuborish"}
              </button>
            </form>
          </div>

          {/* Create Organization */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-4">
              <Plus size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Yangi tashkilot yaratish</h2>
            <p className="text-sm text-gray-500 mb-6">O'z tashkilotingizni oching va boshqa ustalarni jalb qiling.</p>
            
            <form onSubmit={handleApplyCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tashkilot nomi</label>
                <input 
                  type="text" 
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  placeholder="Masalan: Toza Uy MChJ"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tavsif (Ixtiyoriy)</label>
                <textarea 
                  value={createDescription}
                  onChange={e => setCreateDescription(e.target.value)}
                  placeholder="Tashkilot faoliyati haqida..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none h-20"
                />
              </div>
              <button 
                type="submit" 
                disabled={applyingCreate}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {applyingCreate ? <Loader2 className="w-5 h-5 animate-spin" /> : "Ariza yuborish"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
