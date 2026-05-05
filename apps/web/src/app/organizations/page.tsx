"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";
import Link from "next/link";
import { Star, Users, Shield, Briefcase, Search } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  rating: number;
  reliability: number;
  isActive: boolean;
  skills: { skill: { name: string } }[];
  _count: { members: number };
  adminProvider: { user: { name: string; avatar?: string } };
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/organizations")
      .then(r => setOrgs(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-8 rounded-3xl shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Tashkilotlar</h1>
        <p className="text-indigo-200 mb-6">Ishonchli xizmat ko'rsatuvchi tashkilotlar</p>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tashkilot qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-400">Tashkilotlar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(org => (
            <Link key={org.id} href={`/organizations/${org.id}`}>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                    {org.logo ? <img src={org.logo} alt={org.name} className="w-full h-full object-cover" /> : "🏢"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-900">{org.name}</h3>
                    {org.description && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{org.description}</p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 mt-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{org.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Shield size={14} className="text-green-500" />
                    <span>{org.reliability.toFixed(0)}% ishonchlilik</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Users size={14} className="text-blue-500" />
                    <span>{org._count.members} a'zo</span>
                  </div>
                </div>

                {/* Skills */}
                {org.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {org.skills.slice(0, 4).map((s, i) => (
                      <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                        {s.skill.name}
                      </span>
                    ))}
                    {org.skills.length > 4 && (
                      <span className="text-xs text-gray-400">+{org.skills.length - 4} ta</span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
