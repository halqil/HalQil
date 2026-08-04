"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Wallet, ArrowUpRight, ArrowDownRight, Clock, Plus, Landmark, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function ProviderWalletPage() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(amount);
  };

  // In the future, transactions will come from the backend.
  // For now, it's an empty list placeholder.
  const transactions: any[] = [];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/provider/profile");
        if (res.data.success) {
          // Fallback to 0 if balance is not provided by backend yet
          setBalance(res.data.data.balance || 0);
        }
      } catch (error) {
        toast.error("Profil ma'lumotlarini yuklashda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mening hamyonim</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg md:col-span-2 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Wallet size={120} />
          </div>
          
          <div>
            <p className="text-primary-100 font-medium mb-1">Joriy balans</p>
            <h2 className="text-4xl sm:text-5xl font-bold">{formatCurrency(balance)}</h2>
            {balance < 0 && balance >= -50000 && (
              <div className="mt-2 text-sm bg-yellow-500/20 text-yellow-100 p-2 rounded-lg flex items-center gap-2">
                <AlertTriangle size={16} /> 
                Diqqat: Balansingiz minusda. Hamyon limitgacha (-50,000 UZS) ishlashi mumkin.
              </div>
            )}
            {balance < -50000 && (
              <div className="mt-2 text-sm bg-red-500/30 text-white p-2 rounded-lg flex items-center gap-2 border border-red-500/50">
                <AlertTriangle size={16} /> 
                Profil muzlatilgan! Balansingiz -50,000 UZS dan o'tib ketgan. To'ldiring.
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-8">
            <button className="flex-1 bg-white text-primary-600 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-50 transition-colors">
              <Plus size={20} />
              To'ldirish
            </button>
            <button className="flex-1 bg-primary-700/50 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-primary-500/30">
              <Landmark size={20} />
              Yechib olish
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
          <h3 className="text-gray-500 font-medium mb-4">Oylik statistika</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <ArrowDownRight size={16} />
                </div>
                <span className="text-gray-700 font-medium">Kirim</span>
              </div>
              <span className="font-bold text-gray-900">{formatCurrency(0)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <ArrowUpRight size={16} />
                </div>
                <span className="text-gray-700 font-medium">Chiqim</span>
              </div>
              <span className="font-bold text-gray-900">{formatCurrency(0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions History */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Tranzaksiyalar tarixi</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Tranzaksiyalar yo'q</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Sizda hozircha hech qanday to'lov amaliyotlari mavjud emas.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Map over transactions when API is ready */}
          </div>
        )}
      </div>
    </div>
  );
}
