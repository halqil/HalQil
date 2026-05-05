"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";
import { Search, Star, MapPin, Briefcase } from "lucide-react";
import Link from "next/link";

interface Provider {
  id: string;
  name: string;
  avatar: string | null;
  reliability: number;
  service_type: string;
  districts: string[];
  completed_orders: number;
  skills: { id: string; name: string }[];
}

export default function Providers() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [districtQuery, setDistrictQuery] = useState("");

  const fetchProviders = async (district: string = "") => {
    setLoading(true);
    try {
      const res = await api.get(`/providers${district ? `?district=${district}` : ''}`);
      if (res.data.success) {
        setProviders(res.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProviders(districtQuery);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mutaxassislarni izlash</h1>
          <p className="text-gray-500">Eng yaxshi ustalarni hududingiz bo'yicha toping</p>
        </div>
        <form onSubmit={handleSearch} className="w-full md:w-96 relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={districtQuery}
            onChange={(e) => setDistrictQuery(e.target.value)}
            placeholder="Hudud (masalan, Chilonzor)"
            className="w-full pl-11 pr-24 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            Qidirish
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
          <p className="text-xl text-gray-500 mb-4">Mutaxassislar topilmadi</p>
          <button onClick={() => fetchProviders("")} className="text-blue-600 font-medium hover:underline">
            Barcha mutaxassislarni ko'rish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((p) => (
            <Link href={`/providers/${p.id}`} key={p.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {p.avatar ? (
                      <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-gray-500">{p.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-blue-600 transition-colors">{p.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      <span className="font-medium text-gray-700">{p.reliability.toFixed(1)}%</span>
                      <span>ishonchlilik</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <Briefcase size={16} className="mt-0.5 text-blue-500" />
                  <div className="flex flex-wrap gap-1">
                    {p.skills.slice(0, 3).map(s => (
                      <span key={s.id} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-xs font-medium">
                        {s.name}
                      </span>
                    ))}
                    {p.skills.length > 3 && <span className="text-xs text-gray-400">+{p.skills.length - 3}</span>}
                  </div>
                </div>
                
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin size={16} className="mt-0.5 text-red-500" />
                  <span className="line-clamp-1">{p.districts.join(", ")}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                <span className="text-gray-500">{p.completed_orders} ta buyurtma</span>
                <span className="text-blue-600 font-medium group-hover:underline">Batafsil &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
