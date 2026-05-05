"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.data);
    } catch (e) {
      toast.error("Foydalanuvchilarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/admin/users/${id}/status`, { status: newStatus });
      toast.success("Status o'zgartirildi");
      fetchUsers();
    } catch (e) {
      toast.error("Xatolik");
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role: newRole });
      toast.success("Rol o'zgartirildi");
      fetchUsers();
    } catch (e) {
      toast.error("Xatolik");
    }
  };

  if (loading) return <div>Yuklanmoqda...</div>;

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold mb-6">Foydalanuvchilarni boshqarish</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-semibold text-gray-600">ID / Username</th>
              <th className="p-4 font-semibold text-gray-600">Ism & Email</th>
              <th className="p-4 font-semibold text-gray-600">Status</th>
              <th className="p-4 font-semibold text-gray-600">Rol</th>
              <th className="p-4 font-semibold text-gray-600">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="p-4">
                  <div className="font-mono text-xs text-gray-500">{u.id.slice(0, 8)}...</div>
                  <div className="font-bold text-blue-600">@{u.username}</div>
                  <div className={`w-2 h-2 rounded-full mt-1 ${u.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </td>
                <td className="p-4">
                  <div className="font-bold">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </td>
                <td className="p-4">
                  <select 
                    value={u.status} 
                    onChange={e => handleStatusChange(u.id, e.target.value)}
                    className="border rounded p-1 text-sm bg-white"
                  >
                    <option value="ACTIVE">Faol</option>
                    <option value="FROZEN">Muzlatilgan</option>
                    <option value="BLOCKED">Bloklangan</option>
                  </select>
                </td>
                <td className="p-4">
                  <select 
                    value={u.role} 
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    className="border rounded p-1 text-sm bg-white"
                  >
                    <option value="USER">Foydalanuvchi</option>
                    <option value="PROVIDER">Provayder</option>
                    <option value="SUPER_ADMIN">Admin</option>
                  </select>
                </td>
                <td className="p-4 text-xs">
                  {new Date(u.createdAt).toLocaleDateString('uz-UZ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
