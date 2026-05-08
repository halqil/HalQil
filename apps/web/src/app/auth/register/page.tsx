'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Check, AlertCircle, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  
  // Step
  const [step, setStep] = useState<1 | 2>(1);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validation state
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneValid, setPhoneValid] = useState(false);
  
  const [usernameError, setUsernameError] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameValid, setUsernameValid] = useState(false);
  
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // Support state
  const [supportMessage, setSupportMessage] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);

  // Formatting phone number
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;

    if (cleaned.startsWith('998')) {
      // It's a full number starting with 998
      formatted = '+998 ';
      if (cleaned.length > 3) formatted += cleaned.substring(3, 5) + ' ';
      if (cleaned.length > 5) formatted += cleaned.substring(5, 8) + '-';
      if (cleaned.length > 8) formatted += cleaned.substring(8, 10) + '-';
      if (cleaned.length > 10) formatted += cleaned.substring(10, 12);
    } else if (cleaned.length > 0) {
      // Start typing from network code
      formatted = '+998 ' + cleaned.substring(0, 2);
      if (cleaned.length > 2) formatted += ' ' + cleaned.substring(2, 5);
      if (cleaned.length > 5) formatted += '-' + cleaned.substring(5, 7);
      if (cleaned.length > 7) formatted += '-' + cleaned.substring(7, 9);
    }
    
    return formatted.trim();
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // only allow digits, +, -, space
    if (/[^0-9\+\-\s]/.test(val)) return;
    
    // Auto format
    const formatted = formatPhoneNumber(val);
    setPhone(formatted);
    setPhoneValid(false);
    setPhoneError('');
  };

  const validatePhone = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 12 || !cleaned.startsWith('998')) {
      setPhoneError('Telefon raqam noto\'g\'ri formatda');
      setPhoneValid(false);
      return false;
    }
    
    try {
      const res = await api.get(`/auth/check-phone?phone=%2B${cleaned}`);
      if (!res.data.data.available) {
        setPhoneError('Bu telefon raqam allaqachon ro\'yxatdan o\'tgan');
        setPhoneValid(false);
        return false;
      }
      setPhoneError('');
      setPhoneValid(true);
      return true;
    } catch (error) {
      setPhoneError('Xatolik yuz berdi');
      return false;
    }
  };

  const validateFirstName = () => {
    if (firstName.length < 2) {
      setFirstNameError('Ism kamida 2 harf bo\'lishi kerak');
      return false;
    }
    if (!/^[a-zA-ZА-Яа-яЎўҚқҒғҲҳ\s]+$/.test(firstName)) {
      setFirstNameError('Ism faqat harflardan iborat bo\'lishi kerak');
      return false;
    }
    setFirstNameError('');
    return true;
  };

  const validateLastName = () => {
    if (lastName.length < 2) {
      setLastNameError('Familya kamida 2 harf bo\'lishi kerak');
      return false;
    }
    if (!/^[a-zA-ZА-Яа-яЎўҚқҒғҲҳ\s]+$/.test(lastName)) {
      setLastNameError('Familya faqat harflardan iborat bo\'lishi kerak');
      return false;
    }
    setLastNameError('');
    return true;
  };

  const isStep1Valid = firstName && lastName && phone && !firstNameError && !lastNameError && phoneValid;

  const handleNextStep = async () => {
    const isFValid = validateFirstName();
    const isLValid = validateLastName();
    const isPValid = await validatePhone();

    if (isFValid && isLValid && isPValid) {
      setStep(2);
    }
  };

  // Username validation with debounce
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toLowerCase();
    setUsername(val);
    setUsernameValid(false);
    setUsernameError('');
    
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (val.length < 3) {
      setUsernameError('Username kamida 3 belgi');
      return;
    }
    if (!/^[a-z0-9][a-z0-9_.]*[a-z0-9]$/.test(val)) {
      setUsernameError('Faqat a-z, 0-9, _ va . ishlatish mumkin. Harf/raqam bilan boshlanib tugashi kerak');
      return;
    }

    setUsernameChecking(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await api.get(`/auth/check-username?username=${val}`);
        if (!res.data.data.available) {
          setUsernameError(`${val} — band`);
          setUsernameValid(false);
        } else {
          setUsernameError('');
          setUsernameValid(true);
        }
      } catch (err) {
        setUsernameError('Xatolik yuz berdi');
      } finally {
        setUsernameChecking(false);
      }
    }, 500);
  };

  const getPasswordStrength = () => {
    if (!password) return { label: '', color: 'bg-gray-200', width: '0%' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    
    if (strength === 1) return { label: 'Zaif', color: 'bg-red-500', width: '33%' };
    if (strength === 2) return { label: 'O\'rta', color: 'bg-yellow-500', width: '66%' };
    if (strength === 3) return { label: 'Kuchli', color: 'bg-green-500', width: '100%' };
    return { label: 'Juda zaif', color: 'bg-red-500', width: '20%' };
  };

  const validatePassword = () => {
    if (password.length < 8) {
      setPasswordError('Parol kamida 8 belgi');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setPasswordError('Kamida 1 ta katta harf kerak');
      return false;
    }
    if (!/\d/.test(password)) {
      setPasswordError('Kamida 1 ta raqam kerak');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = () => {
    if (password !== confirmPassword) {
      setConfirmPasswordError('Parollar mos emas');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameValid || !validatePassword() || !validateConfirmPassword()) return;

    try {
      setIsLoading(true);
      const cleanedPhone = '+' + phone.replace(/\D/g, '');
      const res = await api.post('/auth/register', {
        firstName,
        lastName,
        phone: cleanedPhone,
        username,
        password
      });

      if (res.data.success) {
        toast.success("Ro'yxatdan o'tdingiz!");
        localStorage.setItem('accessToken', res.data.data.accessToken);
        localStorage.setItem('refreshToken', res.data.data.refreshToken);
        router.push('/');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Xatolik yuz berdi");
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
        page: 'register'
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
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          HalQil
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative">
        {/* Progress Bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gray-200 rounded-t-lg overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-out" 
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 pt-10 border border-gray-100">
          
          {step === 1 ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-6 text-center">
                <h3 className="text-xl font-bold text-gray-900">Salom! Tanishamiz 👋</h3>
                <p className="text-sm text-gray-500 mt-1">Ismingiz va telefon raqamingizni kiriting</p>
                <p className="text-xs text-blue-600 font-medium mt-2">1/2 Bosqich</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ismingiz</label>
                  <div className="mt-1 relative">
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => { setFirstName(e.target.value); setFirstNameError(''); }}
                      onBlur={validateFirstName}
                      placeholder="Masalan: Abdug'afur"
                      className={`appearance-none block w-full px-3 py-2 border ${firstNameError ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    />
                    {firstName && !firstNameError && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  {firstNameError && <p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/> {firstNameError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Familyangiz</label>
                  <div className="mt-1 relative">
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => { setLastName(e.target.value); setLastNameError(''); }}
                      onBlur={validateLastName}
                      placeholder="Masalan: Toshmatov"
                      className={`appearance-none block w-full px-3 py-2 border ${lastNameError ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    />
                    {lastName && !lastNameError && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  {lastNameError && <p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/> {lastNameError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefon raqam</label>
                  <div className="mt-1 relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      onBlur={validatePhone}
                      placeholder="+998 90 123-45-67"
                      className={`appearance-none block w-full px-3 py-2 border ${phoneError ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    />
                    {phoneValid && !phoneError && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Check className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  {phoneError && <p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/> {phoneError}</p>}
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleNextStep}
                    disabled={!isStep1Valid}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Keyingi <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-6 text-center relative">
                <button 
                  onClick={() => setStep(1)} 
                  className="absolute left-0 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold text-gray-900">Deyarli tayyor! 🎉</h3>
                <p className="text-sm text-gray-500 mt-1">Username va parol o'rnating</p>
                <p className="text-xs text-blue-600 font-medium mt-2">2/2 Bosqich</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={handleUsernameChange}
                      placeholder="masalan: abdug_001"
                      className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border ${usernameError && !usernameError.includes('band') && !usernameError.includes('bo\'sh') ? 'border-red-300' : 'border-gray-300'} focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    />
                  </div>
                  {usernameChecking && <p className="mt-2 text-sm text-blue-600 flex items-center"><Loader2 className="w-4 h-4 mr-1 animate-spin"/> Tekshirilmoqda...</p>}
                  {!usernameChecking && usernameValid && <p className="mt-2 text-sm text-green-600 flex items-center"><Check className="w-4 h-4 mr-1"/> {username} — bo'sh</p>}
                  {!usernameChecking && usernameError && <p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/> {usernameError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Parol</label>
                  <div className="mt-1 relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                      onBlur={validatePassword}
                      className={`appearance-none block w-full px-3 py-2 border ${passwordError ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10`}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500">Parol kuchi:</span>
                        <span className={`text-xs font-medium ${getPasswordStrength().color.replace('bg-', 'text-')}`}>
                          {getPasswordStrength().label}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className={`${getPasswordStrength().color} h-1.5 rounded-full transition-all duration-300`} style={{ width: getPasswordStrength().width }}></div>
                      </div>
                    </div>
                  )}
                  {passwordError && <p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/> {passwordError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Parolni tasdiqlang</label>
                  <div className="mt-1 relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => { 
                        setConfirmPassword(e.target.value); 
                        if (e.target.value && password === e.target.value) setConfirmPasswordError(''); 
                      }}
                      onBlur={validateConfirmPassword}
                      className={`appearance-none block w-full px-3 py-2 border ${confirmPasswordError ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10`}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                  {confirmPassword && password === confirmPassword && (
                    <p className="mt-2 text-sm text-green-600 flex items-center"><Check className="w-4 h-4 mr-1"/> Parollar mos keldi</p>
                  )}
                  {confirmPasswordError && <p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/> {confirmPasswordError}</p>}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || !usernameValid || !password || password !== confirmPassword}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Ro'yxatdan o'tish"}
                  </button>
                </div>
              </form>
            </div>
          )}

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
                <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Allaqachon hisobingiz bormi? Kirish →
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
