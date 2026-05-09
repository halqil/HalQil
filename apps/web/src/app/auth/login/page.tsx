'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Eye, EyeOff, Phone, Mail, User, Zap, Loader2, X, CheckCircle, LifeBuoy, Send } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSupport, setShowSupport] = useState(false);
  const [supportMsg, setSupportMsg] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportSent, setSupportSent] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogin(e.target.value);
    setError('');
  };

  const getLoginType = (): { icon: React.ReactNode; hint: string } => {
    if (!login) return { icon: null, hint: '' };
    const cleaned = login.replace(/\s/g, '');
    if (/^[\+0-9]/.test(cleaned) || /^[0-9]{9}/.test(cleaned)) {
      return { icon: <Phone size={14} />, hint: 'Telefon' };
    }
    if (login.includes('@') && login.includes('.')) {
      return { icon: <Mail size={14} />, hint: 'Email' };
    }
    return { icon: <User size={14} />, hint: 'Username' };
  };

  const loginType = getLoginType();

  const handleSubmit = async () => {
    if (!login.trim() || !password.trim()) { setError('Login va parol kiritish majburiy'); return; }
    setLoading(true); setError('');
    try {
      let loginValue = login.trim();
      const digits = loginValue.replace(/\D/g, '');
      if (digits.length === 9) loginValue = '+998' + digits;

      const res = await api.post('/auth/login', { login: loginValue, password });
      const { accessToken, refreshToken, user } = res.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      const role = user.role;
      if (role === 'SUPER_ADMIN') router.push('/admin');
      else if (role === 'PROVIDER') router.push('/provider/dashboard');
      else router.push('/');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Login yoki parol noto'g'ri");
    } finally { setLoading(false); }
  };

  const handleSupportSubmit = async () => {
    if (!supportMsg.trim()) return;
    setSupportLoading(true);
    try {
      await api.post('/support/contact', { message: supportMsg, phone: supportPhone || undefined, page: 'login' });
      setSupportSent(true);
    } catch { /* silent */ }
    finally { setSupportLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "var(--bg)" }}>
      <div className="glass-modal w-full max-w-md p-8 fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-3">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">HalQil</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Mahalliy xizmatlar platformasi</p>
        </div>

        <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Xush kelibsiz!</h2>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Hisobingizga kiring</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3.5 mb-5 flex items-start gap-2.5">
            <X size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-500 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Login input */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Telefon, username yoki email
          </label>
          <div className="relative">
            <input type="text" value={login} onChange={handleLoginChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="+998901234567 yoki @username" autoComplete="username"
              className={`glass-input py-3.5 pr-28 ${error ? '!border-red-500 bg-red-500/5' : ''}`} />
            {loginType.hint && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs flex items-center gap-1 px-2 py-1 rounded-lg"
                style={{ backgroundColor: "var(--sidebar-hover)", color: "var(--muted)" }}>
                {loginType.icon} {loginType.hint}
              </span>
            )}
          </div>
          <p className="text-xs mt-1.5 pl-1" style={{ color: "var(--muted)" }}>
            Misol: +998 90 123-45-67 | abdug_001 | email@mail.com
          </p>
        </div>

        {/* Password input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Parol</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Parolingizni kiriting" autoComplete="current-password"
              className={`glass-input py-3.5 pr-12 ${error ? '!border-red-500 bg-red-500/5' : ''}`} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 transition-colors" style={{ color: "var(--muted)" }}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full py-3.5 text-base rounded-2xl">
          {loading ? <><Loader2 size={20} className="animate-spin" /> Tekshirilmoqda...</> : 'Kirish'}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 glass-divider" />
          <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>yoki</span>
          <div className="flex-1 glass-divider" />
        </div>

        <button onClick={() => { setShowSupport(true); setSupportSent(false); setSupportMsg(''); setSupportPhone(''); }}
          className="btn-ghost w-full py-3 rounded-2xl text-sm">
          <LifeBuoy size={18} /> Yordam kerakmi? Admin bilan bog&apos;laning
        </button>

        <p className="text-center text-sm mt-5" style={{ color: "var(--muted)" }}>
          Hisobingiz yo&apos;qmi?{' '}
          <Link href="/auth/register" className="text-blue-500 font-semibold hover:underline">Ro&apos;yxatdan o&apos;tish</Link>
        </p>
      </div>

      {/* Support Modal */}
      {showSupport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                <p className="font-semibold text-green-600 text-lg">Xabaringiz qabul qilindi!</p>
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Tez orada bog&apos;lanamiz</p>
                <button onClick={() => setShowSupport(false)} className="mt-5 text-blue-500 font-medium text-sm hover:underline">Yopish</button>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Muammoingizni yozing:</label>
                  <textarea value={supportMsg} onChange={(e) => setSupportMsg(e.target.value)}
                    placeholder="Muammoingizni batafsil yozing..." rows={4} className="glass-textarea" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Telefon raqamingiz:</label>
                  <input type="tel" value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)}
                    placeholder="+998 90 123-45-67 (ixtiyoriy)" className="glass-input" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowSupport(false)} className="btn-ghost flex-1 py-2.5 rounded-2xl text-sm">Bekor</button>
                  <button onClick={handleSupportSubmit} disabled={!supportMsg.trim() || supportLoading}
                    className="btn-primary flex-1 py-2.5 rounded-2xl text-sm">
                    {supportLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Yuborish
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
