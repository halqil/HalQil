"use client";

import { useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Send, Bell, Megaphone } from "lucide-react";

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
    <div className="glass-card p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: "var(--text)" }}><Megaphone className="w-5 h-5" /> Xabarnoma yuborish (Broadcast)</h2>
      <form onSubmit={handleBroadcast} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Kimlarga yuborilsin?</label>
          <select value={targetRole} onChange={e => setTargetRole(e.target.value)} className="glass-input">
            <option value="ALL">Barchaga</option>
            <option value="USER">Faqat Mijozlarga</option>
            <option value="PROVIDER">Faqat Provayderlarga</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Xabar turi</label>
          <select value={type} onChange={e => setType(e.target.value)} className="glass-input">
            <option value="SYSTEM">Tizim xabari (System)</option>
            <option value="ANNOUNCEMENT">E'lon (Announcement)</option>
            <option value="WARNING">Ogohlantirish (Warning)</option>
            <option value="NEWS">Yangiliklar (News)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Sarlavha</label>
          <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="glass-input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Xabar matni</label>
          <textarea required value={message} onChange={e => setMessage(e.target.value)} rows={4} className="glass-textarea"></textarea>
        </div>
        <button disabled={loading} className="btn-primary w-full py-3">
          {loading ? "Yuborilmoqda..." : <><Send className="w-4 h-4 inline mr-2" />Yuborish</>}
        </button>
      </form>
    </div>
  );
}
