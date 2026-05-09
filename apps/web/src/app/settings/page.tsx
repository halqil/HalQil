'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import Avatar from '@/components/Avatar';
import { Eye, EyeOff, Copy, Check, X, Plus, ChevronDown } from 'lucide-react';

type Tab = 'profile' | 'interface' | 'notifications' | 'provider';

interface ScheduleDay {
  dayOfWeek: number;
  isActive: boolean;
  openTime: string;
  closeTime: string;
}

const DAY_NAMES = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

const UZ_DISTRICTS = [
  'Yunusabad', "Mirzo Ulug'bek", 'Chilonzor', 'Bektemir', 'Hamza',
  'Mirobod', 'Sergeli', 'Shayxontohur', 'Olmazar', 'Uchtepa', 'Yakkasaroy', 'Yangihayot',
  'Andijob', 'Namangan', 'Samarqand', 'Buxoro', 'Farg\'ona', 'Qo\'qon',
  'Nukus', 'Urganch', 'Termiz', 'Qarshi', 'Navoiy', 'Jizzax', 'Guliston',
];

function getPasswordStrength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[a-z]/.test(p)) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^a-zA-Z0-9]/.test(p)) s++;
  if (s <= 2) return { score: s, label: 'Zaif', color: 'bg-red-500' };
  if (s <= 3) return { score: s, label: "O'rta", color: 'bg-yellow-500' };
  return { score: s, label: 'Kuchli', color: 'bg-green-500' };
}

// Toggle switch komponenti
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function SettingsPage() {
  const { user, isAuthenticated, updateUser, setTheme, setFontSize, setLanguage } = useAuthStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // ── Profile tab ─────────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);

  // WalletId copy
  const [walletCopied, setWalletCopied] = useState(false);

  // Parol
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // ── Interface tab ────────────────────────────────────────────────────────────
  const [theme, setThemeLocal] = useState('system');
  const [fontSize, setFontSizeLocal] = useState('medium');
  const [language, setLanguageLocal] = useState('uz');
  const [interfaceLoading, setInterfaceLoading] = useState(false);

  // ── Notifications tab ────────────────────────────────────────────────────────
  const [notifyNewOrder, setNotifyNewOrder] = useState(true);
  const [notifyChat, setNotifyChat] = useState(true);
  const [notifySystem, setNotifySystem] = useState(true);
  const [notifyApplication, setNotifyApplication] = useState(true);
  const [notifySaving, setNotifySaving] = useState(false);

  // ── Provider tab ─────────────────────────────────────────────────────────────
  const [bio, setBio] = useState('');
  const [bioLoading, setBioLoading] = useState(false);
  const [availability, setAvailability] = useState('AVAILABLE');
  const [availLoading, setAvailLoading] = useState(false);
  const [districts, setDistricts] = useState<string[]>([]);
  const [districtInput, setDistrictInput] = useState('');
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [providerSettingsLoading, setProviderSettingsLoading] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleDay[]>(
    Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, isActive: i >= 1 && i <= 5, openTime: '09:00', closeTime: '18:00' }))
  );
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // ── Auth guard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
  }, [isAuthenticated, router]);

  // ── Ma'lumotlarni yuklash ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setUsername(user.username || '');
    setEmail(user.email || '');
    setThemeLocal(user.theme || 'system');
    setFontSizeLocal(user.fontSize || 'medium');
    setLanguageLocal(user.language || 'uz');
    setNotifyNewOrder(user.notifyNewOrder ?? true);
    setNotifyChat(user.notifyChat ?? true);
    setNotifySystem(user.notifySystem ?? true);
    setNotifyApplication(user.notifyApplication ?? true);
  }, [user]);

  // API dan so'nggi ma'lumotlarni olish
  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/user/me').then(res => {
      if (res.data.success) {
        const u = res.data.data;
        setFirstName(u.firstName || '');
        setLastName(u.lastName || '');
        setUsername(u.username || '');
        setEmail(u.email || '');
        setThemeLocal(u.theme || 'system');
        setFontSizeLocal(u.fontSize || 'medium');
        setLanguageLocal(u.language || 'uz');
        setNotifyNewOrder(u.notifyNewOrder ?? true);
        setNotifyChat(u.notifyChat ?? true);
        setNotifySystem(u.notifySystem ?? true);
        setNotifyApplication(u.notifyApplication ?? true);
        updateUser(u);
      }
    }).catch(() => {});

    if (user?.role === 'PROVIDER') {
      api.get('/provider/profile').then(res => {
        if (res.data.success) {
          const p = res.data.data;
          setBio(p.bio || '');
          setAvailability(p.availabilityStatus || 'AVAILABLE');
          setDistricts(p.districts?.map((d: any) => d.districtName) || []);
          setDailyLimit(p.dailyLimit || 10);
          if (p.schedules?.length) {
            const map: Record<number, ScheduleDay> = {};
            p.schedules.forEach((s: any) => { map[s.dayOfWeek] = s; });
            setSchedule(Array.from({ length: 7 }, (_, i) => ({
              dayOfWeek: i,
              isActive: map[i]?.isActive ?? (i >= 1 && i <= 5),
              openTime: map[i]?.openTime ?? '09:00',
              closeTime: map[i]?.closeTime ?? '18:00',
            })));
          }
        }
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Username debounce check
  useEffect(() => {
    if (!username || username === user?.username) { setUsernameStatus('idle'); return; }
    if (username.length < 3) { setUsernameStatus('idle'); return; }
    setUsernameStatus('checking');
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/auth/check-username?username=${encodeURIComponent(username)}`);
        setUsernameStatus(res.data.data.available ? 'available' : 'taken');
      } catch { setUsernameStatus('idle'); }
    }, 500);
    return () => clearTimeout(t);
  }, [username, user?.username]);

  // ── Avatar handlers ──────────────────────────────────────────────────────────
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Fayl hajmi 5MB dan oshmasin'); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setAvatarLoading(true);
    setAvatarProgress(0);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      const res = await api.post('/user/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setAvatarProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      if (res.data.success) {
        updateUser({ avatar: res.data.data.avatar });
        setAvatarPreview(null);
        setAvatarFile(null);
        toast.success('Rasm yangilandi ✅');
      }
    } catch {
      toast.error('Rasm yuklanmadi');
    } finally {
      setAvatarLoading(false);
      setAvatarProgress(0);
    }
  };

  // ── Profile save ─────────────────────────────────────────────────────────────
  const handleProfileSave = async () => {
    if (usernameStatus === 'taken') { toast.error('Username band'); return; }
    setProfileLoading(true);
    try {
      const res = await api.patch('/user/me/profile', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim().toLowerCase(),
      });
      if (res.data.success) {
        updateUser(res.data.data);
        toast.success("Profil saqlandi ✅");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xatolik yuz berdi');
    } finally { setProfileLoading(false); }
  };

  // ── Email save ───────────────────────────────────────────────────────────────
  const handleEmailSave = async () => {
    if (!email.trim()) return;
    setProfileLoading(true);
    try {
      const res = await api.patch('/user/me/profile', { email: email.trim() });
      if (res.data.success) {
        updateUser({ email: res.data.data.email });
        toast.success('Email saqlandi ✅');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xatolik yuz berdi');
    } finally { setProfileLoading(false); }
  };

  // ── Password change ──────────────────────────────────────────────────────────
  const handlePasswordChange = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) { toast.error('Barcha maydonlarni to\'ldiring'); return; }
    if (newPwd !== confirmPwd) { toast.error('Yangi parollar mos emas'); return; }
    setPwdLoading(true);
    try {
      await api.patch('/user/me/change-password', { currentPassword: currentPwd, newPassword: newPwd });
      toast.success("Parol o'zgartirildi ✅");
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xatolik yuz berdi');
    } finally { setPwdLoading(false); }
  };

  // ── Interface save ───────────────────────────────────────────────────────────
  const handleInterfaceSave = async () => {
    setInterfaceLoading(true);
    setTheme(theme); setFontSize(fontSize); setLanguage(language);
    try {
      await api.patch('/user/me/settings', { theme, fontSize, language });
      updateUser({ theme, fontSize, language });
      toast.success('Interfeys sozlamalari saqlandi ✅');
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally { setInterfaceLoading(false); }
  };

  // ── Notification toggle ──────────────────────────────────────────────────────
  const handleNotifyToggle = async (field: string, value: boolean) => {
    setNotifySaving(true);
    try {
      await api.patch('/user/me/settings', { [field]: value });
      updateUser({ [field]: value } as any);
    } catch { toast.error('Xatolik yuz berdi'); }
    finally { setNotifySaving(false); }
  };

  // ── Provider: bio save ───────────────────────────────────────────────────────
  const handleBioSave = async () => {
    setBioLoading(true);
    try {
      await api.patch('/provider/bio', { bio });
      toast.success('Bio saqlandi ✅');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xatolik yuz berdi');
    } finally { setBioLoading(false); }
  };

  // ── Provider: availability toggle ────────────────────────────────────────────
  const handleAvailability = async (status: string) => {
    setAvailLoading(true);
    try {
      await api.patch('/provider/availability', { status });
      setAvailability(status);
      toast.success(`Holat: ${status === 'AVAILABLE' ? '🟢 Bo\'sh' : '🟡 Band'}`);
    } catch { toast.error('Xatolik yuz berdi'); }
    finally { setAvailLoading(false); }
  };

  // ── Provider: settings save ──────────────────────────────────────────────────
  const handleProviderSettingsSave = async () => {
    setProviderSettingsLoading(true);
    try {
      await api.patch('/provider/settings', { districts, dailyLimit });
      toast.success('Provayder sozlamalari saqlandi ✅');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Xatolik yuz berdi');
    } finally { setProviderSettingsLoading(false); }
  };

  // ── Provider: schedule save ──────────────────────────────────────────────────
  const handleScheduleSave = async () => {
    setScheduleLoading(true);
    try {
      await api.post('/provider/schedule', { schedules: schedule });
      toast.success('Jadval saqlandi ✅');
    } catch { toast.error('Xatolik yuz berdi'); }
    finally { setScheduleLoading(false); }
  };

  // ── WalletId copy ────────────────────────────────────────────────────────────
  const copyWalletId = () => {
    if (user?.walletId) {
      navigator.clipboard.writeText(user.walletId);
      setWalletCopied(true);
      setTimeout(() => setWalletCopied(false), 2000);
    }
  };

  const pwdStrength = getPasswordStrength(newPwd);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const currentAvatar = avatarPreview || (user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${apiBase}${user.avatar}`) : null);

  const filteredDistricts = UZ_DISTRICTS.filter(
    d => d.toLowerCase().includes(districtInput.toLowerCase()) && !districts.includes(d)
  );

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'profile', label: 'Profil', icon: '👤' },
    { key: 'interface', label: 'Interfeys', icon: '🎨' },
    { key: 'notifications', label: 'Bildirishnomalar', icon: '🔔' },
    ...(user?.role === 'PROVIDER' ? [{ key: 'provider' as Tab, label: 'Provayder', icon: '🛠️' }] : []),
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sozlamalar ⚙️</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab 1: Profil ──────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="space-y-6">

          {/* Avatar card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profil rasmi</h2>
            <div className="flex items-center gap-5">
              <div className="relative">
                {currentAvatar ? (
                  <img src={currentAvatar} alt="avatar" className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-100" />
                ) : (
                  <Avatar name={user?.name} size="xl" />
                )}
              </div>
              <div className="flex-1">
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleAvatarSelect} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition mb-2"
                >
                  Rasm o'zgartirish 📷
                </button>
                <p className="text-xs text-gray-400">jpg, png, webp — max 5MB</p>
                {avatarFile && (
                  <div className="mt-2">
                    {avatarProgress > 0 && avatarProgress < 100 && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                        <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${avatarProgress}%` }} />
                      </div>
                    )}
                    <button
                      onClick={handleAvatarUpload}
                      disabled={avatarLoading}
                      className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {avatarLoading ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                      ) : '💾'}
                      Saqlash
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Shaxsiy ma'lumotlar */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shaxsiy ma'lumotlar</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ism</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Familya</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 text-sm">@</span>
                  <input type="text" value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                    className={`w-full pl-7 pr-20 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      usernameStatus === 'taken' ? 'border-red-300 bg-red-50' :
                      usernameStatus === 'available' ? 'border-green-300' : 'border-gray-200'
                    }`} />
                  {usernameStatus === 'checking' && <span className="absolute right-3 top-2.5 text-xs text-gray-400">🔄</span>}
                  {usernameStatus === 'available' && <span className="absolute right-3 top-2.5 text-xs text-green-600">✅ Bo'sh</span>}
                  {usernameStatus === 'taken' && <span className="absolute right-3 top-2.5 text-xs text-red-500">❌ Band</span>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input type="text" value={user?.phone || ''} disabled
                  className="w-full px-3 py-2.5 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-0.5">Telefon raqam o'zgartirilmaydi</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hamyon ID</label>
                <div className="flex gap-2">
                  <input type="text" value={user?.walletId || ''} disabled
                    className="flex-1 px-3 py-2.5 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                  <button onClick={copyWalletId}
                    className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition text-sm flex items-center gap-1">
                    {walletCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-500" />}
                  </button>
                </div>
              </div>

              <button onClick={handleProfileSave} disabled={profileLoading || usernameStatus === 'taken'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                {profileLoading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                Saqlash
              </button>
            </div>
          </div>

          {/* Email */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Email</h2>
            <div className="space-y-3">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="email@misol.com"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={handleEmailSave} disabled={profileLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition disabled:opacity-50">
                Email saqlash
              </button>
            </div>
          </div>

          {/* Parol o'zgartirish */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Parolni o'zgartirish 🔐</h2>
            <div className="space-y-3">
              {/* Hozirgi parol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hozirgi parol</label>
                <div className="relative">
                  <input type={showCurrentPwd ? 'text' : 'password'} value={currentPwd}
                    onChange={e => setCurrentPwd(e.target.value)}
                    className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                    className="absolute right-3 top-2.5 text-gray-400">{showCurrentPwd ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                </div>
              </div>
              {/* Yangi parol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yangi parol</label>
                <div className="relative">
                  <input type={showNewPwd ? 'text' : 'password'} value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-2.5 text-gray-400">{showNewPwd ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                </div>
                {newPwd.length > 0 && (
                  <div className="mt-1.5">
                    <div className="flex gap-1 mb-0.5">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${i <= pwdStrength.score ? pwdStrength.color : 'bg-gray-200'}`}/>
                      ))}
                    </div>
                    <p className={`text-xs ${pwdStrength.score <= 2 ? 'text-red-500' : pwdStrength.score <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>{pwdStrength.label}</p>
                  </div>
                )}
              </div>
              {/* Tasdiq */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parolni tasdiqlang</label>
                <div className="relative">
                  <input type={showConfirmPwd ? 'text' : 'password'} value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                    className={`w-full px-3 py-2.5 pr-10 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      confirmPwd && newPwd !== confirmPwd ? 'border-red-300' : confirmPwd && newPwd === confirmPwd ? 'border-green-300' : 'border-gray-200'
                    }`} />
                  <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    className="absolute right-3 top-2.5 text-gray-400">{showConfirmPwd ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                </div>
                {confirmPwd && newPwd === confirmPwd && <p className="text-xs text-green-600 mt-0.5">✅ Parollar mos keldi</p>}
                {confirmPwd && newPwd !== confirmPwd && <p className="text-xs text-red-500 mt-0.5">❌ Parollar mos emas</p>}
              </div>
              <button onClick={handlePasswordChange} disabled={pwdLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                {pwdLoading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                Parolni o'zgartirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Interfeys ─────────────────────────────────────────────────── */}
      {activeTab === 'interface' && (
        <div className="space-y-6">

          {/* Mavzu */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mavzu (Theme)</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'light', label: 'Yorug\'', icon: '☀️' },
                { key: 'dark', label: 'Qorong\'u', icon: '🌙' },
                { key: 'system', label: 'Tizimga qarab', icon: '🖥️' },
              ].map(t => (
                <button key={t.key} onClick={() => {
                  setThemeLocal(t.key);
                  setTheme(t.key);
                }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    theme === t.key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <span className="text-2xl">{t.icon}</span>
                  <span className="text-xs font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Shrift o'lchami */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shrift o'lchami</h2>
            <div className="flex gap-3">
              {[
                { key: 'small', label: 'Kichik', style: 'text-sm' },
                { key: 'medium', label: "O'rta", style: 'text-base' },
                { key: 'large', label: 'Katta', style: 'text-lg' },
              ].map(f => (
                <button key={f.key} onClick={() => {
                  setFontSizeLocal(f.key);
                  setFontSize(f.key);
                }}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                    fontSize === f.key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <span className={`font-bold ${f.style}`}>A</span>
                  <span className="text-xs">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Til */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Til</h2>
            <div className="space-y-2">
              {[
                { key: 'uz', label: "O'zbek", flag: '🇺🇿', active: true },
                { key: 'ru', label: 'Русский', flag: '🇷🇺', active: false },
                { key: 'en', label: 'English', flag: '🇬🇧', active: false },
              ].map(l => (
                <button key={l.key}
                  onClick={() => l.active && setLanguageLocal(l.key)}
                  disabled={!l.active}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                    language === l.key && l.active ? 'border-blue-500 bg-blue-50' :
                    !l.active ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' :
                    'border-gray-200 hover:border-gray-300'
                  }`}>
                  <span className="flex items-center gap-3"><span className="text-xl">{l.flag}</span><span className="font-medium text-sm">{l.label}</span></span>
                  {!l.active && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Tez orada</span>}
                  {language === l.key && l.active && <Check size={16} className="text-blue-500" />}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleInterfaceSave} disabled={interfaceLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
            {interfaceLoading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
            Saqlash
          </button>
        </div>
      )}

      {/* ── Tab 3: Bildirishnomalar ───────────────────────────────────────────── */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Bildirishnomalar {notifySaving && <span className="text-xs text-gray-400 font-normal ml-2">Saqlanmoqda...</span>}</h2>

          {[
            { field: 'notifyNewOrder', icon: '🔔', label: 'Yangi buyurtma bildirishnomalari', desc: 'Yangi buyurtma kelganda xabar olish', value: notifyNewOrder, setter: setNotifyNewOrder },
            { field: 'notifyChat', icon: '💬', label: 'Chat xabarlari', desc: 'Yangi chat xabari kelganda xabar olish', value: notifyChat, setter: setNotifyChat },
            { field: 'notifyApplication', icon: '📋', label: 'Ariza holati', desc: 'Ariza holati o\'zgarganda xabar olish', value: notifyApplication, setter: setNotifyApplication },
            { field: 'notifySystem', icon: '🔔', label: 'Tizim xabarlari', desc: 'Muhim tizim xabarlari', value: notifySystem, setter: setNotifySystem },
          ].map(item => (
            <div key={item.field} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </div>
              <Toggle
                checked={item.value}
                onChange={(v) => {
                  item.setter(v);
                  handleNotifyToggle(item.field, v);
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Tab 4: Provayder (faqat PROVIDER ko'radi) ───────────────────────── */}
      {activeTab === 'provider' && user?.role === 'PROVIDER' && (
        <div className="space-y-6">

          {/* Bio */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bio</h2>
            <textarea
              value={bio} onChange={e => { if (e.target.value.length <= 500) setBio(e.target.value); }}
              rows={5} maxLength={500}
              placeholder="O'zingiz haqida yozing — tajriba, xizmatlar, ustuvorliklar..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">{bio.length}/500</span>
              <button onClick={handleBioSave} disabled={bioLoading}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
                {bioLoading && <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                Saqlash
              </button>
            </div>
          </div>

          {/* Holat */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Holat</h2>
            <div className="flex gap-3">
              <button
                onClick={() => handleAvailability('AVAILABLE')}
                disabled={availLoading}
                className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${availability === 'AVAILABLE' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'}`}>
                🟢 Bo'sh
              </button>
              <button
                onClick={() => handleAvailability('BUSY')}
                disabled={availLoading}
                className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${availability === 'BUSY' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-200 hover:border-gray-300'}`}>
                🟡 Band
              </button>
            </div>
          </div>

          {/* Xizmat hududlari + Kunlik limit */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Xizmat hududlari</h2>
              {/* Chips */}
              <div className="flex flex-wrap gap-2 mb-3">
                {districts.map(d => (
                  <span key={d} className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {d}
                    <button onClick={() => setDistricts(prev => prev.filter(x => x !== d))} className="hover:text-red-500">
                      <X size={14}/>
                    </button>
                  </span>
                ))}
              </div>
              {/* District qidirish */}
              <div className="relative">
                <input
                  type="text"
                  value={districtInput}
                  onChange={e => { setDistrictInput(e.target.value); setShowDistrictDropdown(true); }}
                  onFocus={() => setShowDistrictDropdown(true)}
                  placeholder="Hudud qo'shish..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showDistrictDropdown && filteredDistricts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                    {filteredDistricts.slice(0, 10).map(d => (
                      <button key={d} onClick={() => {
                        setDistricts(prev => [...prev, d]);
                        setDistrictInput('');
                        setShowDistrictDropdown(false);
                      }} className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition">
                        <Plus size={14} className="inline mr-2 text-gray-400" />{d}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Kunlik limit */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Kunlik buyurtma limiti</h3>
              <div className="flex items-center gap-3">
                <input type="number" min={1} max={50} value={dailyLimit}
                  onChange={e => setDailyLimit(Math.min(50, Math.max(1, Number(e.target.value))))}
                  className="w-24 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center" />
                <span className="text-sm text-gray-500">ta (1 dan 50 gacha)</span>
              </div>
            </div>

            <button onClick={handleProviderSettingsSave} disabled={providerSettingsLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
              {providerSettingsLoading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              Saqlash
            </button>
          </div>

          {/* Haftalik jadval */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Haftalik jadval 📅</h2>
            <div className="space-y-3">
              {schedule.map((day, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input type="checkbox" checked={day.isActive}
                    onChange={e => setSchedule(prev => prev.map((d, idx) => idx === i ? { ...d, isActive: e.target.checked } : d))}
                    className="w-4 h-4 accent-blue-500" />
                  <span className={`w-24 text-sm font-medium ${day.isActive ? 'text-gray-900' : 'text-gray-400'}`}>{DAY_NAMES[day.dayOfWeek]}</span>
                  <input type="time" value={day.openTime} disabled={!day.isActive}
                    onChange={e => setSchedule(prev => prev.map((d, idx) => idx === i ? { ...d, openTime: e.target.value } : d))}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <span className="text-gray-400 text-sm">—</span>
                  <input type="time" value={day.closeTime} disabled={!day.isActive}
                    onChange={e => setSchedule(prev => prev.map((d, idx) => idx === i ? { ...d, closeTime: e.target.value } : d))}
                    className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50 disabled:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
            </div>
            <button onClick={handleScheduleSave} disabled={scheduleLoading}
              className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
              {scheduleLoading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              Jadvalni saqlash
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
