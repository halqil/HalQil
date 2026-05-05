"use client";

import Link from "next/link";
import { useAuthStore } from "../lib/store";
import { useRouter } from "next/navigation";
import { LogOut, User, LayoutDashboard, Search, Package, Briefcase, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../lib/api";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      api.get("/notifications").then(res => {
        if (res.data.success) {
          setUnreadCount(res.data.unreadCount || 0);
        }
      }).catch(console.error);
    }
  }, [isAuthenticated]);

  return (
    <nav className="sticky top-0 z-50 glass w-full px-6 py-4 flex items-center justify-between transition-all">
      <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        HalQil
      </Link>

      <div className="flex items-center gap-6">
        <Link href="/providers" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
          <Search size={20} />
          <span className="hidden md:inline font-medium">Qidiruv</span>
        </Link>
        
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <Link href="/notifications" className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            <Link href="/orders" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
              <Package size={20} />
              <span className="hidden md:inline font-medium">Buyurtmalar</span>
            </Link>

            {user?.role === "PROVIDER" && (
              <Link href="/provider/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
                <Briefcase size={20} />
                <span className="hidden md:inline font-medium">Provayder</span>
              </Link>
            )}

            {user?.role === "SUPER_ADMIN" && (
              <Link href="/admin" className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors">
                <LayoutDashboard size={20} />
                <span className="hidden md:inline font-medium">Admin Panel</span>
              </Link>
            )}
            
            <Link href="/profile" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
              <User size={20} />
              <span className="font-medium">{user?.name}</span>
            </Link>

            <button 
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
              title="Chiqish"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">
              Kirish
            </Link>
            <Link href="/register" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all">
              Ro'yxatdan o'tish
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
