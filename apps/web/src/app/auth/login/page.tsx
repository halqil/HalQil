'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Eye, EyeOff, Loader2, HelpCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Support modal state
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Auto format if it looks like a phone number starting with digits
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length > 0 && cleaned.length <= 12 && !val.includes('@') && !/[a-zA-Z]/.test(val)) {
      if (cleaned.startsWith('998') && cleaned.length > 3) {
        val = '+998 ' + cleaned.substring(3, 5) + (cleaned.length > 5 ? ' ' + cleaned.substring(5, 8) : '') + (cleaned.length > 8 ? '-' + cleaned.substring(8, 10) : '') + (cleaned.length > 10 ? '-' + cleaned.substring(10, 12) : '');
      } else if (cleaned.length > 0 && cleaned.length <= 9) {
        // Just started typing
        val = cleaned;
      }
    } else if (val.startsWith('@')) {
      val = val.toLowerCase();
    } else if (!val.includes('@') && /[a-zA-Z]/.test(val)) {
      // Username is typically lowercase
      val = val.toLowerCase();
    }

    setLoginField(val);
    setErrorMsg('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginField || !password) return;

    try {
      setIsLoading(true);
      setErrorMsg('');

      // Clean up the login field for backend
      let formattedLogin = loginField.trim();
      const cleanedPhone = loginField.replace(/\D/g, '');
      if (cleanedPhone.length === 9 && !loginField.includes('@') && !/[a-zA-Z]/.test(loginField)) {
        formattedLogin = '+998' + cleanedPhone;
      } else if (cleanedPhone.length === 12 && cleanedPhone.startsWith('998') && !loginField.includes('@')) {
        formattedLogin = '+' + cleanedPhone;
      } else if (formattedLogin.startsWith('@')) {
        formattedLogin = formattedLogin.substring(1);
      }

      const res = await api.post('/auth/login', {
        login: formattedLogin,
        password
      });

      if (res.data.success) {
        toast.success("Tizimga muvaffaqiyatli kirdingiz!");
        localStorage.setItem('accessToken', res.data.data.accessToken);
        localStorage.setItem('refreshToken', res.data.data.refreshToken);
        router.push('/');
      }
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupportSubmit = async () => {
    if (!supportMessage) return;
    try {
      setSupportLoading(true);
      await api.post('/support/contact', {
        message: supportMessage,
        phone: supportPhone,
        page: 'login'
      });
      toast.success('Xabaringiz qabul qilindi. Tez orada bog\'lanamiz! ✅');
      setIsSupportOpen(false);
      setSupportMessage('');
      setSupportPhone('');
    } catch (error) {
      toast.error('Xatolik yuz berdi');
    } finally {
      setSupportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">HalQil</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          
          <div className="mb-6 text-center">
            <h3 className="text-xl font-bold text-gray-900">Xush kelibsiz! 👋</h3>
            <p className="text-sm text-gray-500 mt-1">Hisobingizga kiring</p>
          </div>

          {errorMsg && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{errorMsg}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="login" className="block text-sm font-medium text-gray-700">
                Telefon, username yoki email
              </label>
              <div className="mt-1">
                <input
                  id="login"
                  name="login"
                  type="text"
                  required
                  value={loginField}
                  onChange={handleLoginChange}
                  placeholder="+998901234567 yoki @username"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-400">Misol: +998 90 123-45-67 | abdug_001 | email@mail.com</p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Parol
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !loginField || !password}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kirish'}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">yoki</span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <button
                onClick={() => setIsSupportOpen(true)}
                className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <HelpCircle className="w-4 h-4 mr-2 text-gray-500" />
                Yordam kerakmi? Admin bilan bog'laning
              </button>
              
              <div className="text-center text-sm">
                <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
                  Hisobingiz yo'qmi? Ro'yxatdan o'tish →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Modal */}
      {isSupportOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsSupportOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                  <HelpCircle className="h-6 w-6 text-blue-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Qo'llab-quvvatlash
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Muammoingizni yozing, adminlarimiz tez orada sizga yordam beradi.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Muammoingizni yozing *</label>
                  <textarea
                    rows={4}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2"
                    placeholder="Qanday muammoga duch keldingiz?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqamingiz (ixtiyoriy)</label>
                  <input
                    type="text"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md border px-3 py-2"
                    placeholder="+998..."
                  />
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    disabled={!supportMessage || supportLoading}
                    onClick={handleSupportSubmit}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:bg-blue-300"
                  >
                    {supportLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yuborish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSupportOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Bekor qilish
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
