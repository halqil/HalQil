'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

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

  // Login inputi o'zgarishi
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    setLogin(value);
    setError('');
  };

  // Login turini aniqlash
  const getLoginType = (): { icon: string; hint: string } => {
    if (!login) return { icon: '', hint: '' };
    const cleaned = login.replace(/\s/g, '');
    if (/^[\+0-9]/.test(cleaned) || /^[0-9]{9}/.test(cleaned)) {
      return { icon: '📱', hint: 'Telefon raqam' };
    }
    if (login.includes('@') && login.includes('.')) {
      return { icon: '📧', hint: 'Email' };
    }
    return { icon: '👤', hint: 'Username' };
  };

  const loginType = getLoginType();

  const handleSubmit = async () => {
    if (!login.trim() || !password.trim()) {
      setError('Login va parol kiritish majburiy');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Telefon raqam normalizatsiyasi
      let loginValue = login.trim();
      const digits = loginValue.replace(/\D/g, '');
      if (digits.length === 9) {
        loginValue = '+998' + digits;
      } else if (digits.length === 12 && loginValue.startsWith('+')) {
        // already formatted
      }

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
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Login yoki parol noto'g'ri"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSupportSubmit = async () => {
    if (!supportMsg.trim()) return;
    setSupportLoading(true);
    try {
      await api.post('/support/contact', {
        message: supportMsg,
        phone: supportPhone || undefined,
        page: 'login',
      });
      setSupportSent(true);
    } catch {
      /* silent */
    } finally {
      setSupportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-fadeIn"
        style={{ boxShadow: '0 25px 50px -12px rgba(59,130,246,0.15), 0 0 0 1px rgba(59,130,246,0.05)' }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-3">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            HalQil
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">Mahalliy xizmatlar platformasi</p>
        </div>

        {/* Sarlavha */}
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Xush kelibsiz! 👋</h2>
        <p className="text-gray-500 text-sm mb-6">Hisobingizga kiring</p>

        {/* Xato xabari */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 mb-5 flex items-start gap-2.5">
            <span className="text-red-500 text-lg">❌</span>
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Login input */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Telefon, username yoki email
          </label>
          <div className="relative">
            <input
              id="login-input"
              type="text"
              value={login}
              onChange={handleLoginChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="+998901234567 yoki @username"
              autoComplete="username"
              className={`w-full px-4 py-3.5 pr-28 rounded-2xl border-2 transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 ${
                error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white'
              }`}
            />
            {loginType.hint && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-100">
                {loginType.icon} {loginType.hint}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1.5 pl-1">
            Misol: +998 90 123-45-67 | abdug_001 | email@mail.com
          </p>
        </div>

        {/* Parol input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Parol</label>
          <div className="relative">
            <input
              id="password-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Parolingizni kiriting"
              autoComplete="current-password"
              className={`w-full px-4 py-3.5 pr-12 rounded-2xl border-2 transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 ${
                error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        {/* Kirish tugmasi */}
        <button
          id="login-btn"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-2xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:shadow-blue-300 active:scale-[0.99]"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Tekshirilmoqda...
            </>
          ) : (
            'Kirish →'
          )}
        </button>

        {/* Separator */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-sm font-medium">yoki</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Yordam tugmasi */}
        <button
          id="support-btn"
          onClick={() => { setShowSupport(true); setSupportSent(false); setSupportMsg(''); setSupportPhone(''); }}
          className="w-full border-2 border-gray-200 text-gray-600 py-3 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium flex items-center justify-center gap-2"
        >
          🛟 Yordam kerakmi? Admin bilan bog&apos;laning
        </button>

        {/* Register havola */}
        <p className="text-center text-sm text-gray-500 mt-5">
          Hisobingiz yo&apos;qmi?{' '}
          <Link href="/auth/register" className="text-blue-600 font-semibold hover:underline">
            Ro&apos;yxatdan o&apos;tish →
          </Link>
        </p>
      </div>

      {/* Yordam modali */}
      {showSupport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-fadeIn"
            style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Qo&apos;llab-quvvatlash 🛟</h3>
              <button
                onClick={() => setShowSupport(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-4">Muammoingizni yozing, tez orada javob beramiz</p>

            {supportSent ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">✅</div>
                <p className="font-semibold text-green-700 text-lg">Xabaringiz qabul qilindi!</p>
                <p className="text-gray-500 text-sm mt-1">Tez orada bog&apos;lanamiz</p>
                <button
                  onClick={() => setShowSupport(false)}
                  className="mt-5 text-blue-600 font-medium text-sm hover:underline"
                >
                  Yopish
                </button>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Muammoingizni yozing:</label>
                  <textarea
                    value={supportMsg}
                    onChange={(e) => setSupportMsg(e.target.value)}
                    placeholder="Muammoingizni batafsil yozing..."
                    rows={4}
                    className="w-full border-2 border-gray-200 rounded-2xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-colors resize-none"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqamingiz:</label>
                  <input
                    type="tel"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    placeholder="+998 90 123-45-67 (ixtiyoriy)"
                    className="w-full border-2 border-gray-200 rounded-2xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSupport(false)}
                    className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-2xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleSupportSubmit}
                    disabled={!supportMsg.trim() || supportLoading}
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-2xl text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {supportLoading ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : null}
                    Yuborish
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
