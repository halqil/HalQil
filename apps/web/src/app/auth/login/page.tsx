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

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (/^[0-9]/.test(value) && !value.startsWith('+') && value.length === 9) {
      value = '+998' + value;
    }
    setLogin(value);
    setError('');
  };

  const getLoginHint = () => {
    if (!login) return '';
    if (/^[\+0-9]/.test(login)) return '📱 Telefon raqam';
    if (login.includes('@')) return '📧 Email';
    return '👤 Username';
  };

  const handleSubmit = async () => {
    if (!login.trim() || !password.trim()) {
      setError('Login va parol kiritish majburiy');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { login: login.trim(), password });
      localStorage.setItem('accessToken', res.data.data.accessToken);
      localStorage.setItem('refreshToken', res.data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.data.data.user));
      const role = res.data.data.user.role;
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
    try {
      await api.post('/support/contact', { message: supportMsg, phone: supportPhone, page: 'login' });
      setSupportSent(true);
    } catch { /* silent */ }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">HalQil</h1>
          <p className="text-gray-400 text-sm">Mahalliy xizmatlar platformasi</p>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-1">Xush kelibsiz! 👋</h2>
        <p className="text-gray-500 mb-6">Hisobingizga kiring</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-red-600 text-sm">❌ {error}</p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefon, username yoki email
          </label>
          <div className="relative">
            <input
              type="text"
              value={login}
              onChange={handleLoginChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="+998901234567 yoki @username"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {login && (
              <span className="absolute right-3 top-3 text-xs text-gray-400">
                {getLoginHint()}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Misol: +998 90 123-45-67 | abdug_001 | email@mail.com
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Parol</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Parolingizni kiriting"
              className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400"
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <span className="animate-spin">⏳</span> : null}
          {loading ? 'Yuklanmoqda...' : 'Kirish'}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-sm">yoki</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          onClick={() => setShowSupport(true)}
          className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-xl hover:bg-gray-50 transition text-sm flex items-center justify-center gap-2"
        >
          🛟 Yordam kerakmi? Admin bilan bog&apos;laning
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Hisobingiz yo&apos;qmi?{' '}
          <Link href="/auth/register" className="text-blue-600 font-medium hover:underline">
            Ro&apos;yxatdan o&apos;tish →
          </Link>
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
                <button
                  onClick={() => { setShowSupport(false); setSupportSent(false); setSupportMsg(''); }}
                  className="mt-4 text-blue-600 text-sm"
                >
                  Yopish
                </button>
              </div>
            ) : (
              <>
                <textarea
                  value={supportMsg}
                  onChange={(e) => setSupportMsg(e.target.value)}
                  placeholder="Muammoingizni batafsil yozing..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                />
                <input
                  type="tel"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="Telefon raqamingiz (ixtiyoriy)"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSupport(false)}
                    className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-xl text-sm hover:bg-gray-50"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleSupportSubmit}
                    disabled={!supportMsg.trim()}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm disabled:opacity-50"
                  >
                    Yuborish
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
