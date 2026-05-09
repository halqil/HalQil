"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";
import { Search, Star, MapPin, Briefcase } from "lucide-react";
import Link from "next/link";
import Avatar from "../../components/Avatar";

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
      if (res.data.success) setProviders(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProviders(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProviders(districtQuery);
  };

  return (
    <div className="space-y-8 fade-in">
      <div className="glass-card p-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="section-title">Mutaxassislarni izlash</h1>
          <p className="section-desc">Eng yaxshi ustalarni hududingiz bo'yicha toping</p>
        </div>
        <form onSubmit={handleSearch} className="w-full md:w-96 relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: "var(--muted)" }} />
          <input
            type="text"
            value={districtQuery}
            onChange={(e) => setDistrictQuery(e.target.value)}
            placeholder="Hudud (masalan, Chilonzor)"
            className="glass-input pl-10 pr-24"
          />
          <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 btn-primary text-xs py-1.5 px-4">
            Qidirish
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <p className="text-xl mb-4" style={{ color: "var(--muted)" }}>Mutaxassislar topilmadi</p>
          <button onClick={() => fetchProviders("")} className="text-blue-500 font-medium hover:underline">
            Barcha mutaxassislarni ko'rish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((p) => (
            <Link href={`/providers/${p.id}`} key={p.id}
              className="glass-card p-6 hover:scale-[1.02] transition-all group cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <Avatar name={p.name} avatar={p.avatar} size="lg" />
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-blue-500 transition-colors" style={{ color: "var(--text)" }}>{p.name}</h3>
                    <div className="flex items-center gap-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      <span className="font-medium">{p.reliability.toFixed(1)}%</span>
                      <span>ishonchlilik</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <Briefcase size={16} className="mt-0.5 text-blue-500" />
                  <div className="flex flex-wrap gap-1">
                    {p.skills.slice(0, 3).map(s => (
                      <span key={s.id} className="glass-chip text-xs">{s.name}</span>
                    ))}
                    {p.skills.length > 3 && <span className="text-xs" style={{ color: "var(--muted)" }}>+{p.skills.length - 3}</span>}
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <MapPin size={16} className="mt-0.5 text-red-500" />
                  <span className="line-clamp-1">{p.districts.join(", ")}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center text-sm" style={{ borderTop: "1px solid var(--border-strong)" }}>
                <span style={{ color: "var(--muted)" }}>{p.completed_orders} ta buyurtma</span>
                <span className="text-blue-500 font-medium group-hover:underline">Batafsil &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
