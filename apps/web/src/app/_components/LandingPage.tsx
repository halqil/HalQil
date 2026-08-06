"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ArrowRight,
  Layers,
  Clock,
  Smartphone,
  Globe,
  MessageSquareText,
  Mic,
  Camera,
  Send,
  Handshake,
  Star,
  Scissors,
  Car,
  Wrench,
  Zap,
  Home,
  Paintbrush,
  Monitor,
  HardHat,
  ShieldCheck,
  Lock,
  TrendingUp,
  Users,
  Image as ImageIcon,
  BadgeDollarSign,
  Gift,
  MessageCircle,
  Construction,
  MapPin,
  Mail,
  Phone,
  AtSign,
  Send as TelegramIcon,
  Target,
  AlertTriangle,
  CheckCircle,
  Eye,
} from "lucide-react";
import "../landing.css";

export default function LandingPage() {
  /* --- Scroll Reveal ------------------------------------------------ */
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = mainRef.current?.querySelectorAll(".reveal");
    if (!els) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={mainRef} className="landing-page-wrapper">
      {/* ==============================================================
          1. HERO SECTION
          ============================================================== */}
      <section className="landing-hero">
        {/* Animated gradient mesh */}
        <div className="landing-hero__mesh" />

        {/* Floating shapes */}
        <div className="landing-hero__shapes">
          <div className="landing-hero__shape landing-hero__shape--1" />
          <div className="landing-hero__shape landing-hero__shape--2" />
          <div className="landing-hero__shape landing-hero__shape--3" />
        </div>

        {/* Content */}
        <div className="landing-hero__content">
          <div className="landing-hero__badge">
            <ShieldCheck size={16} />
            100% verifikatsiyalangan ustalar
          </div>

          <h1 className="landing-hero__title">
            Har qanday muammoni —{" "}
            <span style={{ background: "none", WebkitTextFillColor: "unset", display: "inline-flex", alignItems: "center", verticalAlign: "middle" }}>
              <Image src="/logo-dark.png" alt="HalQil Logo" width={180} height={54} className="logo-dark-mode" style={{ objectFit: 'contain' }} />
              <Image src="/logo-light.png" alt="HalQil Logo" width={180} height={54} className="logo-light-mode" style={{ objectFit: 'contain' }} />
            </span>
          </h1>

          <p className="landing-hero__subtitle">
            Sun'iy intellektga asoslangan platforma orqali ishonchli mahalliy
            mutaxassislarni toping. Matn, ovoz yoki rasm bilan qidiring.
          </p>

          {/* Search bar */}
          <form
            className="landing-hero__search"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = "/providers";
            }}
          >
            <Search className="landing-hero__search-icon" size={20} />
            <input
              type="text"
              placeholder="Qanday xizmat kerak? (masalan, kran ta'mirlash)"
              className="landing-hero__search-input"
            />
          </form>

          {/* CTA buttons */}
          <div className="landing-hero__ctas">
            <Link href="/providers" className="landing-hero__cta-primary">
              Xizmat qidirish
              <ArrowRight size={18} />
            </Link>
            <Link href="/auth/register" className="landing-hero__cta-secondary">
              <Users size={18} />
              Provayder bo'lish
            </Link>
          </div>
        </div>
      </section>

      {/* ==============================================================
          2. STATS BAR
          ============================================================== */}
      <section className="landing-stats">
        <div className="landing-stats__inner reveal">
          {[
            {
              icon: <Layers size={24} />,
              number: "10+",
              label: "Xizmat kategoriyasi",
              bg: "rgba(59, 130, 246, 0.1)",
              color: "#3b82f6",
            },
            {
              icon: <Clock size={24} />,
              number: "24/7",
              label: "Ishlaydi",
              bg: "rgba(16, 185, 129, 0.1)",
              color: "#10b981",
            },
            {
              icon: <Smartphone size={24} />,
              number: "1",
              label: "Platforma",
              bg: "rgba(139, 92, 246, 0.1)",
              color: "#8b5cf6",
            },
            {
              icon: <Globe size={24} />,
              number: "100%",
              label: "Raqamli jarayon",
              bg: "rgba(6, 182, 212, 0.1)",
              color: "#06b6d4",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`landing-stat-card reveal reveal-delay-${i + 1}`}
            >
              <div
                className="landing-stat-card__icon"
                style={{ background: stat.bg, color: stat.color }}
              >
                {stat.icon}
              </div>
              <div className="landing-stat-card__number">{stat.number}</div>
              <div className="landing-stat-card__label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ==============================================================
          NEGA HALQIL?
          ============================================================== */}
      <section className="landing-section">
        <div className="landing-section__inner">
          <div className="reveal" style={{ textAlign: "center" }}>
            <div className="landing-section__label" style={{ justifyContent: "center" }}>
              <Target size={14} />
              Bizning maqsadimiz
            </div>
            <h2 className="landing-section__title">
              Nega HalQil yaratilgan?
            </h2>
            <p className="landing-section__desc" style={{ margin: "0 auto" }}>
              O'zbekistonda sifatli xizmat topish va ko'rsatish jarayonini tubdan o'zgartirish uchun.
            </p>
          </div>

          {/* Vision statement */}
          <div className="landing-why__vision reveal reveal-delay-1">
            <Eye size={24} />
            <p>
              O'zbekistonda va kelajakda O'rta Osiyo bozorida har qanday maishiy, ofis va professional xizmatlarni tez, xavfsiz va shaffof narxlarda
              <strong> &ldquo;Hal Qiladigan&rdquo; </strong>
              yagona va eng yirik raqamli ekotizimga aylanish.
            </p>
          </div>

          {/* Two-column: Problems & Solutions */}
          <div className="landing-why__grid">
            {/* Mijozlar */}
            <div className="landing-why__card reveal reveal-delay-2">
              <div className="landing-why__card-header">
                <div className="landing-why__card-icon" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
                  <Users size={22} />
                </div>
                <h3 className="landing-why__card-title">Mijozlar muammosi</h3>
              </div>
              <ul className="landing-why__list">
                {[
                  {
                    problem: "Sifatli va ishonchli usta topish qiyinligi",
                    solution: "100% PINFL verifikatsiyalangan usta profillari",
                  },
                  {
                    problem: "Narxlarning sun'iy oshirilishi",
                    solution: "Shaffof narxlar va bozor o'rtachasi ko'rsatkichi",
                  },
                  {
                    problem: "To'lov va xavfsizlik kafolati yo'qligi",
                    solution: "Escrow to'lov tizimi — pul xizmat tugaguncha saqlanadi",
                  },
                  {
                    problem: "Qidirish uzoq va noqulay",
                    solution: "AI multimodal qidiruv — matn, ovoz, rasm bilan toping",
                  },
                ].map((item, i) => (
                  <li key={i} className="landing-why__item">
                    <div className="landing-why__problem">
                      <AlertTriangle size={14} />
                      <span>{item.problem}</span>
                    </div>
                    <div className="landing-why__solution">
                      <CheckCircle size={14} />
                      <span>{item.solution}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Provayderlar */}
            <div className="landing-why__card reveal reveal-delay-3">
              <div className="landing-why__card-header">
                <div className="landing-why__card-icon" style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}>
                  <Wrench size={22} />
                </div>
                <h3 className="landing-why__card-title">Provayderlar muammosi</h3>
              </div>
              <ul className="landing-why__list">
                {[
                  {
                    problem: "Mijozlar oqimining beqarorligi",
                    solution: "Tayyor va uzluksiz mijozlar oqimi platformadan",
                  },
                  {
                    problem: "Raqamli portfolio va reyting yo'qligi",
                    solution: "Galeriya portfolio va ishonchlilik ko'rsatkichi",
                  },
                  {
                    problem: "Nizo yuzaga kelganda himoya yo'q",
                    solution: "Adolatli nizo hal qilish tizimi va mediatsiya",
                  },
                  {
                    problem: "Yangi mijozlarga o'zini tanishtirish qiyin",
                    solution: "AI-tavsiya tizimi profilni avtomatik taqdim etadi",
                  },
                ].map((item, i) => (
                  <li key={i} className="landing-why__item">
                    <div className="landing-why__problem">
                      <AlertTriangle size={14} />
                      <span>{item.problem}</span>
                    </div>
                    <div className="landing-why__solution">
                      <CheckCircle size={14} />
                      <span>{item.solution}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          3. AI SEARCH SHOWCASE
          ============================================================== */}
      <section className="landing-section">
        <div className="landing-section__inner">
          <div className="reveal">
            <div className="landing-section__label">
              <Search size={14} />
              Aqlli qidiruv
            </div>
            <h2 className="landing-section__title">
              AI bilan usta topish — ilgari hech qachon bunchalik oson bo'lmagan
            </h2>
            <p className="landing-section__desc">
              Multimodal sun'iy intellekt texnologiyasi — matn, ovoz va rasm
              orqali ehtiyojingizni aniqlaydi va eng mos ustalarni topadi.
            </p>
          </div>

          <div className="landing-ai__grid">
            {[
              {
                icon: <MessageSquareText size={28} />,
                title: "Matn bilan qidirish",
                desc: "Muammoingizni oddiy so'zlar bilan yozing — AI tushunib, kategoriya va xizmat turini aniqlaydi.",
                example: '"Kran oqyapti, tezda ta\'mirlash kerak"',
                bg: "rgba(59, 130, 246, 0.1)",
                color: "#3b82f6",
              },
              {
                icon: <Mic size={28} />,
                title: "Ovoz bilan qidirish",
                desc: "Ovozli xabar yuboring — Speech-to-Text texnologiyasi so'rovingizni matnga aylantiradi.",
                example: '"Uyga santexnik kerak, hammom kranlari buzildi"',
                bg: "rgba(139, 92, 246, 0.1)",
                color: "#8b5cf6",
              },
              {
                icon: <Camera size={28} />,
                title: "Rasm bilan qidirish",
                desc: "Muammoning rasmini oling — AI tasvirni tahlil qilib, kerakli xizmat turini aniqlaydi.",
                example: "Buzilgan kran rasmini yuborish",
                bg: "rgba(6, 182, 212, 0.1)",
                color: "#06b6d4",
              },
            ].map((card, i) => (
              <div
                key={i}
                className={`landing-ai-card reveal reveal-delay-${i + 1}`}
              >
                <div
                  className="landing-ai-card__icon"
                  style={{ background: card.bg, color: card.color }}
                >
                  {card.icon}
                </div>
                <div className="landing-ai-card__title">{card.title}</div>
                <p className="landing-ai-card__desc">{card.desc}</p>
                <div className="landing-ai-card__example">{card.example}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==============================================================
          4. HOW IT WORKS
          ============================================================== */}
      <section className="landing-section">
        <div className="landing-section__inner">
          <div className="reveal" style={{ textAlign: "center" }}>
            <div className="landing-section__label" style={{ justifyContent: "center" }}>
              <Layers size={14} />
              Qanday ishlaydi
            </div>
            <h2 className="landing-section__title">
              4 oddiy qadam — muammo hal bo'ladi
            </h2>
            <p className="landing-section__desc" style={{ margin: "0 auto" }}>
              AI qidiruvdan tortib xizmat yakunlanishigacha — barchasi shaffof va qulay.
            </p>
          </div>

          <div className="landing-steps__grid">
            {[
              {
                icon: <Search size={24} />,
                title: "Qidiring",
                desc: "AI orqali kerakli xizmatni toping",
                color: "#3b82f6",
              },
              {
                icon: <Send size={24} />,
                title: "So'rov yuboring",
                desc: "Tanlangan ustaga ariza yuboring",
                color: "#8b5cf6",
              },
              {
                icon: <Handshake size={24} />,
                title: "Xizmat oling",
                desc: "Kelishing va sifatli xizmat oling",
                color: "#06b6d4",
              },
              {
                icon: <Star size={24} />,
                title: "Baholang",
                desc: "Xizmatni baholab, fikr qoldiring",
                color: "#10b981",
              },
            ].map((step, i) => (
              <div
                key={i}
                className={`landing-step reveal reveal-delay-${i + 1}`}
              >
                <div className="landing-step__number" style={{ color: step.color }}>
                  {step.icon}
                </div>
                <div className="landing-step__title">{step.title}</div>
                <div className="landing-step__desc">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==============================================================
          5. CATEGORIES
          ============================================================== */}
      <section className="landing-section">
        <div className="landing-section__inner">
          <div className="reveal" style={{ textAlign: "center" }}>
            <div className="landing-section__label" style={{ justifyContent: "center" }}>
              <Layers size={14} />
              Xizmat turlari
            </div>
            <h2 className="landing-section__title">
              Kerakli xizmatni bir joydan toping
            </h2>
            <p className="landing-section__desc" style={{ margin: "0 auto" }}>
              Uy-ro'zg'or ishlaridan professional xizmatlargacha — barcha kategoriyalar bir platformada.
            </p>
          </div>

          <div className="landing-categories__grid">
            {[
              { icon: <Scissors size={28} />, name: "Sartaroshxona", bg: "rgba(236, 72, 153, 0.1)", color: "#ec4899" },
              { icon: <Car size={28} />, name: "Avtoservis", bg: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" },
              { icon: <Wrench size={28} />, name: "Santexnik", bg: "rgba(6, 182, 212, 0.1)", color: "#06b6d4" },
              { icon: <Zap size={28} />, name: "Elektrik", bg: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" },
              { icon: <Home size={28} />, name: "Tozalash", bg: "rgba(16, 185, 129, 0.1)", color: "#10b981" },
              { icon: <HardHat size={28} />, name: "Qurilish", bg: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" },
              { icon: <Paintbrush size={28} />, name: "Ta'mirlash", bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444" },
              { icon: <Monitor size={28} />, name: "IT xizmatlar", bg: "rgba(99, 102, 241, 0.1)", color: "#6366f1" },
            ].map((cat, i) => (
              <div
                key={i}
                className={`landing-category-card reveal reveal-delay-${i > 3 ? i - 3 : i + 1}`}
              >
                <div
                  className="landing-category-card__icon"
                  style={{ background: cat.bg, color: cat.color }}
                >
                  {cat.icon}
                </div>
                <div className="landing-category-card__name">{cat.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==============================================================
          6. TRUST & SAFETY
          ============================================================== */}
      <section className="landing-section">
        <div className="landing-section__inner">
          <div className="reveal" style={{ textAlign: "center" }}>
            <div className="landing-section__label" style={{ justifyContent: "center" }}>
              <ShieldCheck size={14} />
              Ishonch va xavfsizlik
            </div>
            <h2 className="landing-section__title">
              Sizning xavfsizligingiz — bizning ustuvorligimiz
            </h2>
            <p className="landing-section__desc" style={{ margin: "0 auto" }}>
              Davlat ID verifikatsiyasi, xavfsiz to'lov va shaffof reyting tizimi bilan to'liq himoya.
            </p>
          </div>

          <div className="landing-trust__grid">
            {[
              {
                icon: <ShieldCheck size={28} />,
                title: "PINFL Verifikatsiya",
                desc: "Barcha ustalar MyID / OneID orqali PINFL (JSHSHIR) tekshiruvidan o'tadi. Faqat tasdiqlangan mutaxassislar xizmat ko'rsatadi.",
                bg: "rgba(16, 185, 129, 0.1)",
                color: "#10b981",
              },
              {
                icon: <Lock size={28} />,
                title: "Escrow To'lov",
                desc: "Onlayn to'lov xavfsiz Escrow tizimida muzlatiladi. Xizmat yakunlangach pul ustaga o'tkaziladi — ikkala tomon himoyada.",
                bg: "rgba(59, 130, 246, 0.1)",
                color: "#3b82f6",
              },
              {
                icon: <TrendingUp size={28} />,
                title: "Ishonchlilik Reytingi",
                desc: "Har bir ustaning muvaffaqiyatli va muvaffaqiyatsiz xizmatlari asosida ishonchlilik foizi hisoblanadi.",
                bg: "rgba(139, 92, 246, 0.1)",
                color: "#8b5cf6",
              },
            ].map((card, i) => (
              <div
                key={i}
                className={`landing-trust-card reveal reveal-delay-${i + 1}`}
              >
                <div
                  className="landing-trust-card__icon"
                  style={{ background: card.bg, color: card.color }}
                >
                  {card.icon}
                </div>
                <div className="landing-trust-card__title">{card.title}</div>
                <p className="landing-trust-card__desc">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==============================================================
          7. PROVIDER CTA
          ============================================================== */}
      <section className="landing-section">
        <div className="landing-section__inner">
          <div className="landing-provider reveal">
            <div className="landing-provider__glow" />
            <div className="landing-provider__inner">
              {/* Left — benefits */}
              <div>
                <h2 className="landing-provider__title">
                  O'z xizmatingizni taklif qilmoqchimisiz?
                </h2>
                <p className="landing-provider__desc">
                  Platformamizga qo'shiling — har kuni yuzlab mijozlar siz kabi
                  mutaxassislarni qidirmoqda.
                </p>
                <ul className="landing-provider__benefits">
                  {[
                    {
                      icon: <Users size={18} color="#60a5fa" />,
                      title: "Tayyor mijozlar oqimi",
                      desc: "Mijozlar o'zlari sizni topadi",
                    },
                    {
                      icon: <ImageIcon size={18} color="#60a5fa" />,
                      title: "Raqamli portfolio",
                      desc: "Ishlaringizni galereyada ko'rsating",
                    },
                    {
                      icon: <BadgeDollarSign size={18} color="#60a5fa" />,
                      title: "Adolatli komissiya",
                      desc: "Foiz emas, qat'iy belgilangan summa (Fixed Fee)",
                    },
                    {
                      icon: <Gift size={18} color="#60a5fa" />,
                      title: "Welcome bonus",
                      desc: "Yangi provayderlarga boshlang'ich bonus",
                    },
                  ].map((benefit, i) => (
                    <li key={i} className="landing-provider__benefit">
                      <div className="landing-provider__benefit-icon">
                        {benefit.icon}
                      </div>
                      <div className="landing-provider__benefit-text">
                        <span className="landing-provider__benefit-title">
                          {benefit.title}
                        </span>
                        <span className="landing-provider__benefit-desc">
                          {benefit.desc}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right — CTA */}
              <div className="landing-provider__cta-box">
                <div className="landing-provider__cta-heading">
                  Hoziroq boshlang
                </div>
                <p className="landing-provider__cta-sub">
                  Ro'yxatdan o'ting, profilingizni to'ldiring va birinchi mijozingizni
                  kutib oling.
                </p>
                <Link
                  href="/auth/register"
                  className="landing-provider__cta-btn"
                >
                  Provayder bo'lish
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          8. TESTIMONIALS
          ============================================================== */}
      <section className="landing-section">
        <div className="landing-section__inner">
          <div className="reveal" style={{ textAlign: "center" }}>
            <div className="landing-section__label" style={{ justifyContent: "center" }}>
              <MessageCircle size={14} />
              Foydalanuvchilar fikri
            </div>
            <h2 className="landing-section__title">
              Platformamiz haqida nima deyishadi?
            </h2>
          </div>

          <div className="landing-testimonials__empty reveal">
            <div className="landing-testimonials__empty-icon">
              <MessageCircle size={28} />
            </div>
            <p className="landing-testimonials__empty-text">
              Tez orada foydalanuvchilar fikrlari shu yerda paydo bo'ladi.
            </p>
          </div>
        </div>
      </section>

      {/* ==============================================================
          9. FOOTER
          ============================================================== */}
      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <div className="landing-footer__grid reveal">
            {/* Brand */}
            <div>
              <div className="landing-footer__brand-name" style={{ background: "none", WebkitTextFillColor: "unset", display: "flex", alignItems: "center" }}>
                <Image src="/logo-dark.png" alt="HalQil Logo" width={140} height={42} className="logo-dark-mode" style={{ objectFit: 'contain' }} />
                <Image src="/logo-light.png" alt="HalQil Logo" width={140} height={42} className="logo-light-mode" style={{ objectFit: 'contain' }} />
              </div>
              <p className="landing-footer__brand-desc">
                O'zbekiston uchun mo'ljallangan sun'iy intellektga asoslangan
                mahalliy xizmatlar marketpleysi.
              </p>
            </div>

            {/* Xizmatlar */}
            <div>
              <div className="landing-footer__col-title">Xizmatlar</div>
              <ul className="landing-footer__links">
                <li><Link href="/providers" className="landing-footer__link">Usta topish</Link></li>
                <li><Link href="/auth/register" className="landing-footer__link">Provayder bo'lish</Link></li>
                <li><Link href="/providers" className="landing-footer__link">Kategoriyalar</Link></li>
              </ul>
            </div>

            {/* Kompaniya */}
            <div>
              <div className="landing-footer__col-title">Kompaniya</div>
              <ul className="landing-footer__links">
                <li><span className="landing-footer__link">Biz haqimizda</span></li>
                <li><span className="landing-footer__link">Kontakt</span></li>
                <li><span className="landing-footer__link">Yordam</span></li>
              </ul>
            </div>

            {/* Huquqiy */}
            <div>
              <div className="landing-footer__col-title">Huquqiy</div>
              <ul className="landing-footer__links">
                <li><span className="landing-footer__link">Maxfiylik siyosati</span></li>
                <li><span className="landing-footer__link">Foydalanish shartlari</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="landing-footer__bottom reveal">
            <span className="landing-footer__copyright">
              © {new Date().getFullYear()} HalQil. Barcha huquqlar himoyalangan.
            </span>
            <div className="landing-footer__socials">
              <a href="#" className="landing-footer__social" aria-label="Instagram">
                <AtSign size={18} />
              </a>
              <a href="#" className="landing-footer__social" aria-label="Telegram">
                <Send size={18} />
              </a>
              <a href="#" className="landing-footer__social" aria-label="Email">
                <Mail size={18} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
