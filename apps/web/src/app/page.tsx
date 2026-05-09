import Link from "next/link";
import { Search, Wrench, ShieldCheck, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col gap-16 pb-16 fade-in">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2070&auto=format&fit=crop')] mix-blend-overlay opacity-20 object-cover" />

        <div className="relative z-10 px-8 py-24 md:py-32 lg:px-16 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Uyingizdagi muammolarni <br className="hidden md:block"/> tez va oson <span className="text-yellow-400">hal qiling</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mb-10 font-light">
            Santexnik, elektrik, farrosh va boshqa ishonchli mahalliy mutaxassislarni bir joydan toping.
          </p>

          <div className="w-full max-w-3xl bg-white/15 backdrop-blur-xl rounded-2xl p-2 flex flex-col md:flex-row gap-2 border border-white/20">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Qanday xizmat kerak? (masalan, kran ta'mirlash)"
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
              />
            </div>
            <Link
              href="/providers"
              className="btn-primary px-8 py-4 rounded-xl font-bold text-base"
            >
              Qidirish
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card p-8 hover:scale-[1.02] transition-transform">
          <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-6">
            <ShieldCheck size={28} />
          </div>
          <h3 className="text-xl font-bold mb-3" style={{ color: "var(--text)" }}>Ishonchli ustalar</h3>
          <p style={{ color: "var(--text-secondary)" }}>Barcha mutaxassislar tekshiruvdan o'tgan va mijozlar tomonidan baholangan.</p>
        </div>

        <div className="glass-card p-8 hover:scale-[1.02] transition-transform">
          <div className="w-14 h-14 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center mb-6">
            <Clock size={28} />
          </div>
          <h3 className="text-xl font-bold mb-3" style={{ color: "var(--text)" }}>Tezkor xizmat</h3>
          <p style={{ color: "var(--text-secondary)" }}>O'zingizga qulay vaqtda, eng yaqin mutaxassisni chaqiring.</p>
        </div>

        <div className="glass-card p-8 hover:scale-[1.02] transition-transform">
          <div className="w-14 h-14 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center mb-6">
            <Wrench size={28} />
          </div>
          <h3 className="text-xl font-bold mb-3" style={{ color: "var(--text)" }}>Keng imkoniyatlar</h3>
          <p style={{ color: "var(--text-secondary)" }}>100 dan ortiq xizmat turlari - uy tozalashdan tortib qurilishgacha.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center text-white shadow-xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">O'z xizmatingizni taklif qilmoqchimisiz?</h2>
        <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
          Bizning platformamizga qo'shiling va yangi mijozlar toping. Har kuni yuzlab odamlar siz kabi mutaxassislarni qidirmoqda.
        </p>
        <Link
          href="/auth/register"
          className="inline-block bg-white text-gray-900 font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
        >
          Provayder bo'lish
        </Link>
      </section>
    </div>
  );
}
