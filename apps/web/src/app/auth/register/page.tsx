'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

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
      if (!res.data.data.available) {
        setErrors((p) => ({ ...p, phone: "Bu telefon raqam allaqachon ro'yxatdan o'tgan" }));
      } else {
        setErrors((p) => { const e = { ...p }; delete e.phone; return e; });
      }
    } catch { setPhoneStatus('idle'); }
  };

  useEffect(() => {
    if (username.length < 3) { setUsernameStatus('idle'); return; }
    setUsernameStatus('checking');
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/auth/check-username?username=${username}`);
        setUsernameStatus(res.data.data.available ? 'available' : 'taken');
        if (!res.data.data.available) {
          setErrors((p) => ({ ...p, username: 'Bu username band, boshqa tanlang' }));
        } else {
          setErrors((p) => { const e = { ...p }; delete e.username; return e; });
        }
      } catch { setUsernameStatus('idle'); }
    }, 500);
    return () => clearTimeout(t);
  }, [username]);

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (firstName.trim().length < 2) e.firstName = "Ism kamida 2 harf bo'lishi kerak";
    else if (!/^[a-zA-ZА-Яа-яЎўҚқҒғҲҳ\s]+$/.test(firstName)) e.firstName = "Ism faqat harflardan iborat bo'lishi kerak";
    if (lastName.trim().length < 2) e.lastName = "Familya kamida 2 harf bo'lishi kerak";
    else if (!/^[a-zA-ZА-Яа-яЎўҚқҒғҲҳ\s]+$/.test(lastName)) e.lastName = "Familya faqat harflardan iborat bo'lishi kerak";
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
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: formattedPhone,
        username: username.toLowerCase(),
        password,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">
              {step === 1 ? "1-bosqich: Shaxsiy ma'lumotlar" : "2-bosqich: Login ma'lumotlari"}
            </span>
            <span className="text-sm text-gray-400">{step}/2</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: step === 1 ? '50%' : '100%' }} />
          </div>
        </div>

        {step === 1 ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Salom! Tanishamiz 👋</h1>
            <p className="text-gray-500 mb-6">Ismingiz va telefon raqamingizni kiriting</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ismingiz</label>
              <input
                type="text" value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setErrors((p) => { const x = { ...p }; delete x.firstName; return x; }); }}
                onBlur={() => {
                  if (firstName.trim().length < 2) setErrors((p) => ({ ...p, firstName: "Ism kamida 2 harf bo'lishi kerak" }));
                  else if (!/^[a-zA-ZА-Яа-яЎўҚқҒғҲҳ\s]+$/.test(firstName)) setErrors((p) => ({ ...p, firstName: "Ism faqat harflardan iborat bo'lishi kerak" }));
                }}
                placeholder="Masalan: Abdug'afur"
                className={`w-full px-4 py-3 rounded-xl border ${errors.firstName ? 'border-red-400 bg-red-50' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">❌ {errors.firstName}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Familyangiz</label>
              <input
                type="text" value={lastName}
                onChange={(e) => { setLastName(e.target.value); setErrors((p) => { const x = { ...p }; delete x.lastName; return x; }); }}
                onBlur={() => {
                  if (lastName.trim().length < 2) setErrors((p) => ({ ...p, lastName: "Familya kamida 2 harf bo'lishi kerak" }));
                  else if (!/^[a-zA-ZА-Яа-яЎўҚқҒғҲҳ\s]+$/.test(lastName)) setErrors((p) => ({ ...p, lastName: "Familya faqat harflardan iborat bo'lishi kerak" }));
                }}
                placeholder="Masalan: Toshmatov"
                className={`w-full px-4 py-3 rounded-xl border ${errors.lastName ? 'border-red-400 bg-red-50' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">❌ {errors.lastName}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqam</label>
              <div className="relative">
                <input
                  type="tel" value={phone}
                  onChange={handlePhoneChange} onBlur={handlePhoneBlur}
                  placeholder="+998 90 123-45-67" maxLength={17}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.phone ? 'border-red-400 bg-red-50' : phoneStatus === 'available' ? 'border-green-400' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                />
                {phoneStatus === 'checking' && <span className="absolute right-3 top-3 text-gray-400 text-sm">🔄</span>}
                {phoneStatus === 'available' && <span className="absolute right-3 top-3 text-green-500">✅</span>}
                {phoneStatus === 'taken' && <span className="absolute right-3 top-3 text-red-500">❌</span>}
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">❌ {errors.phone}</p>}
            </div>

            <button onClick={() => { if (validateStep1()) setStep(2); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition">
              Keyingi →
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Deyarli tayyor! 🎉</h1>
            <p className="text-gray-500 mb-6">Username va parol o&apos;rnating</p>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-red-600 text-sm">❌ {errors.general}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-400 font-medium">@</span>
                <input
                  type="text" value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  placeholder="masalan: abdug_001"
                  className={`w-full pl-8 pr-24 py-3 rounded-xl border ${errors.username || usernameStatus === 'taken' ? 'border-red-400 bg-red-50' : usernameStatus === 'available' ? 'border-green-400' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                />
                {usernameStatus === 'checking' && <span className="absolute right-3 top-3 text-gray-400 text-sm">🔄</span>}
                {usernameStatus === 'available' && <span className="absolute right-3 top-3 text-green-500 text-sm">✅ Bo&apos;sh</span>}
                {usernameStatus === 'taken' && <span className="absolute right-3 top-3 text-red-500 text-sm">❌ Band</span>}
              </div>
              {errors.username && <p className="text-red-500 text-xs mt-1">❌ {errors.username}</p>}
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Parol</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => { const x = { ...p }; delete x.password; return x; }); }}
                  placeholder="Kamida 8 belgi, katta/kichik harf va raqam"
                  className={`w-full px-4 py-3 pr-10 rounded-xl border ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400">
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">❌ {errors.password}</p>}
            </div>

            {password.length > 0 && (
              <div className="mb-4">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-gray-200'} transition-all`} />
                  ))}
                </div>
                <p className={`text-xs ${strength.score <= 2 ? 'text-red-500' : strength.score <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>{strength.label}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Parolni tasdiqlang</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => { const x = { ...p }; delete x.confirmPassword; return x; }); }}
                  placeholder="Parolni qayta kiriting"
                  className={`w-full px-4 py-3 pr-10 rounded-xl border ${errors.confirmPassword ? 'border-red-400 bg-red-50' : confirmPassword && password === confirmPassword ? 'border-green-400' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-3 text-gray-400">
                  {showConfirm ? '🙈' : '👁'}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">❌ {errors.confirmPassword}</p>}
              {confirmPassword && password === confirmPassword && <p className="text-green-500 text-xs mt-1">✅ Parollar mos keldi</p>}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">← Orqaga</button>
              <button onClick={handleSubmit} disabled={loading || usernameStatus === 'taken'}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? <span className="animate-spin">⏳</span> : null}
                {loading ? 'Yuklanmoqda...' : "Ro'yxatdan o'tish"}
              </button>
            </div>
          </>
        )}

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-sm">yoki</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button onClick={() => setShowSupport(true)} className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-xl hover:bg-gray-50 transition text-sm flex items-center justify-center gap-2">
          🛟 Yordam kerakmi? Admin bilan bog&apos;laning
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Allaqachon hisobingiz bormi?{' '}
          <Link href="/auth/login" className="text-blue-600 font-medium hover:underline">Kirish →</Link>
        </p>
      </div>

      {showSupport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold mb-1">Qo&apos;llab-quvvatlash 🛟</h3>
            <p className="text-gray-500 text-sm mb-4">Muammoingizni yozing, tez orada javob beramiz</p>
            {supportSent ? (
              <div className="text-center py-6">
                <p className="text-2xl mb-2">✅</p>
                <p className="font-medium text-green-700">Xabaringiz qabul qilindi!</p>
                <p className="text-gray-500 text-sm mt-1">Tez orada bog&apos;lanamiz</p>
                <button onClick={() => { setShowSupport(false); setSupportSent(false); setSupportMsg(''); setSupportPhone(''); }} className="mt-4 text-blue-600 text-sm">Yopish</button>
              </div>
            ) : (
              <>
                <textarea value={supportMsg} onChange={(e) => setSupportMsg(e.target.value)} placeholder="Muammoingizni batafsil yozing..." rows={4} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3" />
                <input type="tel" value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} placeholder="Telefon raqamingiz (ixtiyoriy)" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
                <div className="flex gap-2">
                  <button onClick={() => setShowSupport(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50">Bekor qilish</button>
                  <button onClick={handleSupportSubmit} disabled={!supportMsg.trim()} className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm disabled:opacity-50">Yuborish</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
