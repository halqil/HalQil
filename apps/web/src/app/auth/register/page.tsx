'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import {
  Eye, EyeOff, Loader2, CheckCircle, XCircle, LifeBuoy,
  X, Send, Zap, ArrowLeft, ArrowRight
} from 'lucide-react';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score <= 2) return { score, label: 'Zaif', color: 'bg-red-500' };
  if (score <= 3) return { score, label: "O'rta", color: 'bg-yellow-500' };
  return { score, label: 'Kuchli', color: 'bg-green-500' };
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  const local = digits.startsWith('998') ? digits.slice(3) : digits;
  if (local.length === 0) return '';
  if (local.length <= 2) return `+998 ${local}`;
  if (local.length <= 5) return `+998 ${local.slice(0, 2)} ${local.slice(2)}`;
  if (local.length <= 7) return `+998 ${local.slice(0, 2)} ${local.slice(2, 5)}-${local.slice(5)}`;
  return `+998 ${local.slice(0, 2)} ${local.slice(2, 5)}-${local.slice(5, 7)}-${local.slice(7, 9)}`;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [supportMsg, setSupportMsg] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
    setPhoneStatus('idle');
  };

  const handlePhoneBlur = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 12) return;
    const raw = '+998' + (digits.startsWith('998') ? digits.slice(3) : digits);
    setPhoneStatus('checking');
    try {
      const res = await api.get(`/auth/check-phone?phone=${encodeURIComponent(raw)}`);
      setPhoneStatus(res.data.data.available ? 'available' : 'taken');
      if (!res.data.data.available) setErrors((p) => ({ ...p, phone: "Bu telefon raqam allaqachon ro'yxatdan o'tgan" }));
      else setErrors((p) => { const e = { ...p }; delete e.phone; return e; });
    } catch { setPhoneStatus('idle'); }
  };

  useEffect(() => {
    if (username.length < 3) { setUsernameStatus('idle'); return; }
    setUsernameStatus('checking');
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/auth/check-username?username=${username}`);
        setUsernameStatus(res.data.data.available ? 'available' : 'taken');
        if (!res.data.data.available) setErrors((p) => ({ ...p, username: 'Bu username band, boshqa tanlang' }));
        else setErrors((p) => { const e = { ...p }; delete e.username; return e; });
      } catch { setUsernameStatus('idle'); }
    }, 500);
    return () => clearTimeout(t);
  }, [username]);

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (firstName.trim().length < 2) e.firstName = "Ism kamida 2 harf bo'lishi kerak";
    else if (!/^[a-zA-ZЀ-ӿ\s]+$/.test(firstName)) e.firstName = "Ism faqat harflardan iborat bo'lishi kerak";
    if (lastName.trim().length < 2) e.lastName = "Familya kamida 2 harf bo'lishi kerak";
    else if (!/^[a-zA-ZЀ-ӿ\s]+$/.test(lastName)) e.lastName = "Familya faqat harflardan iborat bo'lishi kerak";
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 12) e.phone = "Telefon raqam to'liq kiritilmagan";
    if (phoneStatus === 'taken') e.phone = "Bu telefon raqam allaqachon ro'yxatdan o'tgan";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (username.length < 3) e.username = "Username kamida 3 belgi bo'lishi kerak";
    if (usernameStatus === 'taken') e.username = 'Bu username band';
    if (password.length < 8) e.password = "Parol kamida 8 belgi bo'lishi kerak";
    else if (!/(?=.*[a-z])/.test(password)) e.password = "Kamida 1 ta kichik harf bo'lishi kerak";
    else if (!/(?=.*[A-Z])/.test(password)) e.password = "Kamida 1 ta katta harf bo'lishi kerak";
    else if (!/(?=.*\d)/.test(password)) e.password = "Kamida 1 ta raqam bo'lishi kerak";
    if (password !== confirmPassword) e.confirmPassword = 'Parollar mos emas';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const digits = phone.replace(/\D/g, '');
      const formattedPhone = '+998' + (digits.startsWith('998') ? digits.slice(3) : digits);
      const res = await api.post('/auth/register', {
        firstName: firstName.trim(), lastName: lastName.trim(),
        phone: formattedPhone, username: username.toLowerCase(), password,
      });
      localStorage.setItem('accessToken', res.data.data.accessToken);
      localStorage.setItem('refreshToken', res.data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.data.data.user));
      router.push('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Xatolik yuz berdi';
      setErrors({ general: msg });
    } finally { setLoading(false); }
  };

  const handleSupportSubmit = async () => {
    if (!supportMsg.trim()) return;
    try {
      await api.post('/support/contact', { message: supportMsg, phone: supportPhone, page: 'register' });
      setSupportSent(true);
    } catch { /* silent */ }
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "var(--bg)" }}>
      <div className="glass-modal w-full max-w-md p-8 fade-in">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>
              {step === 1 ? "1-bosqich: Shaxsiy ma'lumotlar" : "2-bosqich: Login ma'lumotlari"}
            </span>
            <span className="text-sm" style={{ color: "var(--muted)" }}>{step}/2</span>
          </div>
          <div className="w-full rounded-full h-2" style={{ backgroundColor: "var(--skeleton)" }}>
            <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: step === 1 ? '50%' : '100%' }} />
          </div>
        </div>

        {step === 1 ? (
          <>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Salom! Tanishamiz</h1>
            <p className="mb-6" style={{ color: "var(--muted)" }}>Ismingiz va telefon raqamingizni kiriting</p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Ismingiz</label>
              <input type="text" value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setErrors((p) => { const x = { ...p }; delete x.firstName; return x; }); }}
                onBlur={() => {
                  if (firstName.trim().length < 2) setErrors((p) => ({ ...p, firstName: "Ism kamida 2 harf bo'lishi kerak" }));
                  else if (!/^[a-zA-ZЀ-ӿ\s]+$/.test(firstName)) setErrors((p) => ({ ...p, firstName: "Ism faqat harflardan iborat bo'lishi kerak" }));
                }}
                placeholder="Masalan: Abdug'afur"
                className={`glass-input py-3 ${errors.firstName ? '!border-red-500 bg-red-500/5' : ''}`} />
              {errors.firstName && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><XCircle size={12} /> {errors.firstName}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Familyangiz</label>
              <input type="text" value={lastName}
                onChange={(e) => { setLastName(e.target.value); setErrors((p) => { const x = { ...p }; delete x.lastName; return x; }); }}
                onBlur={() => {
                  if (lastName.trim().length < 2) setErrors((p) => ({ ...p, lastName: "Familya kamida 2 harf bo'lishi kerak" }));
                  else if (!/^[a-zA-ZЀ-ӿ\s]+$/.test(lastName)) setErrors((p) => ({ ...p, lastName: "Familya faqat harflardan iborat bo'lishi kerak" }));
                }}
                placeholder="Masalan: Toshmatov"
                className={`glass-input py-3 ${errors.lastName ? '!border-red-500 bg-red-500/5' : ''}`} />
              {errors.lastName && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><XCircle size={12} /> {errors.lastName}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Telefon raqam</label>
              <div className="relative">
                <input type="tel" value={phone} onChange={handlePhoneChange} onBlur={handlePhoneBlur}
                  placeholder="+998 90 123-45-67" maxLength={17}
                  className={`glass-input py-3 pr-10 ${errors.phone ? '!border-red-500 bg-red-500/5' : phoneStatus === 'available' ? '!border-green-500' : ''}`} />
                {phoneStatus === 'checking' && <span className="absolute right-3 top-3"><Loader2 size={16} className="animate-spin" style={{ color: "var(--muted)" }} /></span>}
                {phoneStatus === 'available' && <span className="absolute right-3 top-3"><CheckCircle size={16} className="text-green-500" /></span>}
                {phoneStatus === 'taken' && <span className="absolute right-3 top-3"><XCircle size={16} className="text-red-500" /></span>}
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><XCircle size={12} /> {errors.phone}</p>}
            </div>

            <button onClick={() => { if (validateStep1()) setStep(2); }} className="btn-primary w-full py-3 rounded-xl">
              Keyingi <ArrowRight size={16} />
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Deyarli tayyor!</h1>
            <p className="mb-6" style={{ color: "var(--muted)" }}>Username va parol o&apos;rnating</p>

            {errors.general && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                <p className="text-red-500 text-sm flex items-center gap-1"><XCircle size={14} /> {errors.general}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Username</label>
              <div className="relative">
                <span className="absolute left-3 top-3 font-medium" style={{ color: "var(--muted)" }}>@</span>
                <input type="text" value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  placeholder="masalan: abdug_001"
                  className={`glass-input py-3 pl-8 pr-24 ${errors.username || usernameStatus === 'taken' ? '!border-red-500 bg-red-500/5' : usernameStatus === 'available' ? '!border-green-500' : ''}`} />
                {usernameStatus === 'checking' && <span className="absolute right-3 top-3"><Loader2 size={14} className="animate-spin" style={{ color: "var(--muted)" }} /></span>}
                {usernameStatus === 'available' && <span className="absolute right-3 top-3 text-xs text-green-500 flex items-center gap-1"><CheckCircle size={12} /> Bo&apos;sh</span>}
                {usernameStatus === 'taken' && <span className="absolute right-3 top-3 text-xs text-red-500 flex items-center gap-1"><XCircle size={12} /> Band</span>}
              </div>
              {errors.username && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><XCircle size={12} /> {errors.username}</p>}
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Parol</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => { const x = { ...p }; delete x.password; return x; }); }}
                  placeholder="Kamida 8 belgi, katta/kichik harf va raqam"
                  className={`glass-input py-3 pr-10 ${errors.password ? '!border-red-500 bg-red-500/5' : ''}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3" style={{ color: "var(--muted)" }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><XCircle size={12} /> {errors.password}</p>}
            </div>

            {password.length > 0 && (
              <div className="mb-4">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : ''}`}
                      style={{ backgroundColor: i <= strength.score ? undefined : 'var(--skeleton)' }} />
                  ))}
                </div>
                <p className={`text-xs ${strength.score <= 2 ? 'text-red-500' : strength.score <= 3 ? 'text-yellow-600' : 'text-green-500'}`}>{strength.label}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Parolni tasdiqlang</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => { const x = { ...p }; delete x.confirmPassword; return x; }); }}
                  placeholder="Parolni qayta kiriting"
                  className={`glass-input py-3 pr-10 ${errors.confirmPassword ? '!border-red-500 bg-red-500/5' : confirmPassword && password === confirmPassword ? '!border-green-500' : ''}`} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3" style={{ color: "var(--muted)" }}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><XCircle size={12} /> {errors.confirmPassword}</p>}
              {confirmPassword && password === confirmPassword && <p className="text-green-500 text-xs mt-1 flex items-center gap-1"><CheckCircle size={12} /> Parollar mos keldi</p>}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-ghost flex-1 py-3 rounded-xl">
                <ArrowLeft size={16} /> Orqaga
              </button>
              <button onClick={handleSubmit} disabled={loading || usernameStatus === 'taken'}
                className="btn-primary flex-1 py-3 rounded-xl">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'Yuklanmoqda...' : "Ro'yxatdan o'tish"}
              </button>
            </div>
          </>
        )}

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 glass-divider" />
          <span className="text-sm" style={{ color: "var(--muted)" }}>yoki</span>
          <div className="flex-1 glass-divider" />
        </div>

        <button onClick={() => setShowSupport(true)} className="btn-ghost w-full py-2.5 rounded-xl text-sm">
          <LifeBuoy size={18} /> Yordam kerakmi? Admin bilan bog&apos;laning
        </button>

        <p className="text-center text-sm mt-4" style={{ color: "var(--muted)" }}>
          Allaqachon hisobingiz bormi?{' '}
          <Link href="/auth/login" className="text-blue-500 font-medium hover:underline">Kirish</Link>
        </p>
      </div>

      {showSupport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-modal w-full max-w-sm p-6 fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
                <LifeBuoy size={20} className="text-blue-500" /> Qo&apos;llab-quvvatlash
              </h3>
              <button onClick={() => setShowSupport(false)} className="p-1.5 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors" style={{ color: "var(--muted)" }}>
                <X size={20} />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Muammoingizni yozing, tez orada javob beramiz</p>
            {supportSent ? (
              <div className="text-center py-6">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                <p className="font-medium text-green-600">Xabaringiz qabul qilindi!</p>
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Tez orada bog&apos;lanamiz</p>
                <button onClick={() => { setShowSupport(false); setSupportSent(false); setSupportMsg(''); setSupportPhone(''); }}
                  className="mt-4 text-blue-500 text-sm hover:underline">Yopish</button>
              </div>
            ) : (
              <>
                <textarea value={supportMsg} onChange={(e) => setSupportMsg(e.target.value)}
                  placeholder="Muammoingizni batafsil yozing..." rows={4} className="glass-textarea mb-3" />
                <input type="tel" value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="Telefon raqamingiz (ixtiyoriy)" className="glass-input mb-4" />
                <div className="flex gap-2">
                  <button onClick={() => setShowSupport(false)} className="btn-ghost flex-1 py-2 rounded-xl text-sm">Bekor</button>
                  <button onClick={handleSupportSubmit} disabled={!supportMsg.trim()} className="btn-primary flex-1 py-2 rounded-xl text-sm">
                    <Send size={14} /> Yuborish
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
