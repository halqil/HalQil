"use client";

import { useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("SYSTEM");
  const [targetRole, setTargetRole] = useState("ALL");
  const [loading, setLoading] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/admin/notifications/broadcast", {
        title, message, type, targetRole: targetRole === "ALL" ? undefined : targetRole
      });
      if (res.data.success) {
        toast.success(res.data.data.message);
        setTitle("");
        setMessage("");
      }
    } catch (e) {
      toast.error("Xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-6">Xabarnoma yuborish (Broadcast)</h2>
      <form onSubmit={handleBroadcast} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Kimlarga yuborilsin?</label>
          <select value={targetRole} onChange={e => setTargetRole(e.target.value)} className="w-full border rounded-xl p-3 bg-gray-50">
            <option value="ALL">Barchaga</option>
            <option value="USER">Faqat Mijozlarga</option>
            <option value="PROVIDER">Faqat Provayderlarga</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Xabar turi</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full border rounded-xl p-3 bg-gray-50">
            <option value="SYSTEM">Tizim xabari (System)</option>
            <option value="ANNOUNCEMENT">E'lon (Announcement)</option>
            <option value="WARNING">Ogohlantirish (Warning)</option>
            <option value="NEWS">Yangiliklar (News)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sarlavha</label>
          <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded-xl p-3 bg-gray-50" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Xabar matni</label>
          <textarea required value={message} onChange={e => setMessage(e.target.value)} rows={4} className="w-full border rounded-xl p-3 bg-gray-50"></textarea>
        </div>
        <button disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50">
          {loading ? "Yuborilmoqda..." : "Yuborish"}
        </button>
      </form>
    </div>
  );
}
