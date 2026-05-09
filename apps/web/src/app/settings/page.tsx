'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import Avatar from '@/components/Avatar';
import {
  Eye, EyeOff, Copy, Check, X, Plus, ChevronDown,
  User, Palette, Bell, Wrench, Sun, Moon, Monitor,
  Camera, Save, Lock, Mail, Phone, Wallet, Globe,
  Type, MapPin, Clock, Calendar, Loader2, CheckCircle, XCircle, MessageSquare
} from 'lucide-react';

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

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-blue-500' : ''}`}
      style={{ backgroundColor: checked ? undefined : 'var(--toggle-bg)' }}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function SettingsPage() {
  const { user, isAuthenticated, updateUser, setTheme, setFontSize, setLanguage } = useAuthStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Profile tab
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

  const [walletCopied, setWalletCopied] = useState(false);

  // Password - 2 step
  const [pwdStep, setPwdStep] = useState<1 | 2>(1);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Interface tab
  const [theme, setThemeLocal] = useState('system');
  const [fontSize, setFontSizeLocal] = useState('medium');
  const [language, setLanguageLocal] = useState('uz');
  const [interfaceLoading, setInterfaceLoading] = useState(false);

  // Notifications tab
  const [notifyNewOrder, setNotifyNewOrder] = useState(true);
  const [notifyChat, setNotifyChat] = useState(true);
  const [notifySystem, setNotifySystem] = useState(true);
  const [notifyApplication, setNotifyApplication] = useState(true);
  const [notifySaving, setNotifySaving] = useState(false);

  // Provider tab
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

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
  }, [isAuthenticated, router]);

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

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/user/me').then(res => {
      if (res.data.success) {
        const u = res.data.data;
        setFirstName(u.firstName || ''); setLastName(u.lastName || '');
        setUsername(u.username || ''); setEmail(u.email || '');
        setThemeLocal(u.theme || 'system'); setFontSizeLocal(u.fontSize || 'medium');
        setLanguageLocal(u.language || 'uz');
        setNotifyNewOrder(u.notifyNewOrder ?? true); setNotifyChat(u.notifyChat ?? true);
        setNotifySystem(u.notifySystem ?? true); setNotifyApplication(u.notifyApplication ?? true);
        updateUser(u);
      }
    }).catch(() => {});

    if (user?.role === 'PROVIDER') {
      api.get('/provider/profile').then(res => {
        if (res.data.success) {
          const p = res.data.data;
          setBio(p.bio || ''); setAvailability(p.availabilityStatus || 'AVAILABLE');
          setDistricts(p.districts?.map((d: any) => d.districtName) || []);
          setDailyLimit(p.dailyLimit || 10);
          if (p.schedules?.length) {
            const map: Record<number, ScheduleDay> = {};
            p.schedules.forEach((s: any) => { map[s.dayOfWeek] = s; });
            setSchedule(Array.from({ length: 7 }, (_, i) => ({
              dayOfWeek: i, isActive: map[i]?.isActive ?? (i >= 1 && i <= 5),
              openTime: map[i]?.openTime ?? '09:00', closeTime: map[i]?.closeTime ?? '18:00',
            })));
          }
        }
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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

  // Avatar handlers
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
    setAvatarLoading(true); setAvatarProgress(0);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      const res = await api.post('/user/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => { if (e.total) setAvatarProgress(Math.round((e.loaded / e.total) * 100)); },
      });
      if (res.data.success) {
        const newAvatarUrl = res.data.data.avatar;
        updateUser({ avatar: newAvatarUrl });
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const fullAvatarUrl = newAvatarUrl.startsWith('http') ? newAvatarUrl : `${apiBase}${newAvatarUrl}`;
        setAvatarPreview(fullAvatarUrl);
        setAvatarFile(null);
        const stored = localStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          u.avatar = newAvatarUrl;
          localStorage.setItem('user', JSON.stringify(u));
        }
        toast.success('Rasm yangilandi');
      }
    } catch { toast.error('Rasm yuklanmadi'); }
    finally { setAvatarLoading(false); setAvatarProgress(0); }
  };

  // Profile save
  const handleProfileSave = async () => {
    if (usernameStatus === 'taken') { toast.error('Username band'); return; }
    setProfileLoading(true);
    try {
      const res = await api.patch('/user/me/profile', {
        firstName: firstName.trim(), lastName: lastName.trim(), username: username.trim().toLowerCase(),
      });
      if (res.data.success) { updateUser(res.data.data); toast.success("Profil saqlandi"); }
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Xatolik yuz berdi'); }
    finally { setProfileLoading(false); }
  };

  const handleEmailSave = async () => {
    if (!email.trim()) return;
    setProfileLoading(true);
    try {
      const res = await api.patch('/user/me/profile', { email: email.trim() });
      if (res.data.success) { updateUser({ email: res.data.data.email }); toast.success('Email saqlandi'); }
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Xatolik yuz berdi'); }
    finally { setProfileLoading(false); }
  };

  // 2-step password change
  const handleVerifyPassword = async () => {
    if (!currentPwd) { toast.error("Hozirgi parolni kiriting"); return; }
    setVerifyLoading(true);
    try {
      const res = await api.post('/user/me/verify-password', { password: currentPwd });
      if (res.data.success) {
        setPwdStep(2);
        toast.success("Parol tasdiqlandi");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Parol noto'g'ri");
    } finally { setVerifyLoading(false); }
  };

  const handlePasswordChange = async () => {
    if (!newPwd || !confirmPwd) { toast.error('Barcha maydonlarni to\'ldiring'); return; }
    if (newPwd !== confirmPwd) { toast.error('Yangi parollar mos emas'); return; }
    setPwdLoading(true);
    try {
      await api.patch('/user/me/change-password', { currentPassword: currentPwd, newPassword: newPwd });
      toast.success("Parol o'zgartirildi");
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); setPwdStep(1);
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Xatolik yuz berdi'); }
    finally { setPwdLoading(false); }
  };

  // Interface save
  const handleInterfaceSave = async () => {
    setInterfaceLoading(true);
    setTheme(theme); setFontSize(fontSize); setLanguage(language);
    try {
      await api.patch('/user/me/settings', { theme, fontSize, language });
      updateUser({ theme, fontSize, language });
      toast.success('Interfeys sozlamalari saqlandi');
    } catch { toast.error('Xatolik yuz berdi'); }
    finally { setInterfaceLoading(false); }
  };

  // Notification toggle
  const handleNotifyToggle = async (field: string, value: boolean) => {
    setNotifySaving(true);
    try {
      await api.patch('/user/me/settings', { [field]: value });
      updateUser({ [field]: value } as any);
    } catch { toast.error('Xatolik yuz berdi'); }
    finally { setNotifySaving(false); }
  };

  // Provider handlers
  const handleBioSave = async () => {
    setBioLoading(true);
    try { await api.patch('/provider/bio', { bio }); toast.success('Bio saqlandi'); }
    catch (err: any) { toast.error(err?.response?.data?.error || 'Xatolik yuz berdi'); }
    finally { setBioLoading(false); }
  };

  const handleAvailability = async (status: string) => {
    setAvailLoading(true);
    try {
      await api.patch('/provider/availability', { status });
      setAvailability(status);
      toast.success(`Holat: ${status === 'AVAILABLE' ? 'Bo\'sh' : 'Band'}`);
    } catch { toast.error('Xatolik yuz berdi'); }
    finally { setAvailLoading(false); }
  };

  const handleProviderSettingsSave = async () => {
    setProviderSettingsLoading(true);
    try { await api.patch('/provider/settings', { districts, dailyLimit }); toast.success('Provayder sozlamalari saqlandi'); }
    catch (err: any) { toast.error(err?.response?.data?.error || 'Xatolik yuz berdi'); }
    finally { setProviderSettingsLoading(false); }
  };

  const handleScheduleSave = async () => {
    setScheduleLoading(true);
    try { await api.post('/provider/schedule', { schedules: schedule }); toast.success('Jadval saqlandi'); }
    catch { toast.error('Xatolik yuz berdi'); }
    finally { setScheduleLoading(false); }
  };

  const copyWalletId = () => {
    if (user?.walletId) { navigator.clipboard.writeText(user.walletId); setWalletCopied(true); setTimeout(() => setWalletCopied(false), 2000); }
  };

  const pwdStrength = getPasswordStrength(newPwd);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const currentAvatar = avatarPreview || (user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${apiBase}${user.avatar}`) : null);
  const filteredDistricts = UZ_DISTRICTS.filter(d => d.toLowerCase().includes(districtInput.toLowerCase()) && !districts.includes(d));

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profil', icon: <User size={18} /> },
    { key: 'interface', label: 'Interfeys', icon: <Palette size={18} /> },
    { key: 'notifications', label: 'Bildirishnomalar', icon: <Bell size={18} /> },
    ...(user?.role === 'PROVIDER' ? [{ key: 'provider' as Tab, label: 'Provayder', icon: <Wrench size={18} /> }] : []),
  ];

  return (
    <div className="max-w-5xl mx-auto fade-in">
      <h1 className="section-title flex items-center gap-2 mb-6">
        <Lock size={24} className="text-blue-500" /> Sozlamalar
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-56 flex-shrink-0">
          <div className="glass-card p-3 space-y-1 md:sticky md:top-20">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`sidebar-item ${activeTab === tab.key ? 'active' : ''}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <>
              {/* Avatar card */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <Camera size={18} className="text-blue-500" /> Profil rasmi
                </h2>
                <div className="flex items-center gap-5">
                  <div className="relative">
                    {currentAvatar ? (
                      <img src={currentAvatar} alt="avatar" className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-500/20" />
                    ) : (
                      <Avatar name={user?.name} size="xl" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleAvatarSelect} />
                    <button onClick={() => fileInputRef.current?.click()} className="btn-ghost text-sm mb-2">
                      <Camera size={16} /> Rasm o'zgartirish
                    </button>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>jpg, png, webp — max 5MB</p>
                    {avatarFile && (
                      <div className="mt-2">
                        {avatarProgress > 0 && avatarProgress < 100 && (
                          <div className="w-full rounded-full h-1.5 mb-2" style={{ backgroundColor: "var(--skeleton)" }}>
                            <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${avatarProgress}%` }} />
                          </div>
                        )}
                        <button onClick={handleAvatarUpload} disabled={avatarLoading} className="btn-success text-sm">
                          {avatarLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Saqlash
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal info */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <User size={18} className="text-blue-500" /> Shaxsiy ma'lumotlar
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Ism</label>
                      <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="glass-input" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Familya</label>
                      <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="glass-input" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm" style={{ color: "var(--muted)" }}>@</span>
                      <input type="text" value={username}
                        onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                        className={`glass-input pl-7 pr-20 ${
                          usernameStatus === 'taken' ? '!border-red-500 bg-red-500/5' :
                          usernameStatus === 'available' ? '!border-green-500' : ''
                        }`} />
                      {usernameStatus === 'checking' && <span className="absolute right-3 top-2.5"><Loader2 size={14} className="animate-spin" style={{ color: "var(--muted)" }} /></span>}
                      {usernameStatus === 'available' && <span className="absolute right-3 top-2.5 text-xs text-green-500 flex items-center gap-1"><CheckCircle size={12} /> Bo'sh</span>}
                      {usernameStatus === 'taken' && <span className="absolute right-3 top-2.5 text-xs text-red-500 flex items-center gap-1"><XCircle size={12} /> Band</span>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                      <Phone size={14} /> Telefon
                    </label>
                    <input type="text" value={user?.phone || ''} disabled className="glass-input !opacity-50" />
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Telefon raqam o'zgartirilmaydi</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                      <Wallet size={14} /> Hamyon ID
                    </label>
                    <div className="flex gap-2">
                      <input type="text" value={user?.walletId || ''} disabled className="glass-input flex-1 !opacity-50" />
                      <button onClick={copyWalletId} className="btn-ghost px-3">
                        {walletCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  <button onClick={handleProfileSave} disabled={profileLoading || usernameStatus === 'taken'}
                    className="btn-primary w-full py-2.5">
                    {profileLoading && <Loader2 size={16} className="animate-spin" />} Saqlash
                  </button>
                </div>
              </div>

              {/* Email */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <Mail size={18} className="text-blue-500" /> Email
                </h2>
                <div className="space-y-3">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@misol.com" className="glass-input" />
                  <button onClick={handleEmailSave} disabled={profileLoading} className="btn-primary w-full py-2.5">Email saqlash</button>
                </div>
              </div>

              {/* Password - 2 step */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <Lock size={18} className="text-orange-500" /> Parolni o'zgartirish
                </h2>

                {pwdStep === 1 ? (
                  <div className="space-y-3">
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      Avval hozirgi parolingizni tasdiqlang
                    </p>
                    <div className="relative">
                      <input type={showCurrentPwd ? 'text' : 'password'} value={currentPwd}
                        onChange={e => setCurrentPwd(e.target.value)} placeholder="Hozirgi parol"
                        className="glass-input pr-10" />
                      <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                        className="absolute right-3 top-2.5" style={{ color: "var(--muted)" }}>
                        {showCurrentPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                    <button onClick={handleVerifyPassword} disabled={verifyLoading || !currentPwd}
                      className="btn-primary w-full py-2.5">
                      {verifyLoading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                      Parolni tasdiqlash
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 fade-in">
                    <div className="bg-green-500/10 text-green-600 p-3 rounded-xl text-sm font-medium flex items-center gap-2 border border-green-500/20">
                      <CheckCircle size={16} /> Parol tasdiqlandi. Yangi parolni kiriting.
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Yangi parol</label>
                      <div className="relative">
                        <input type={showNewPwd ? 'text' : 'password'} value={newPwd}
                          onChange={e => setNewPwd(e.target.value)} className="glass-input pr-10" />
                        <button type="button" onClick={() => setShowNewPwd(!showNewPwd)}
                          className="absolute right-3 top-2.5" style={{ color: "var(--muted)" }}>
                          {showNewPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                      </div>
                      {newPwd.length > 0 && (
                        <div className="mt-1.5">
                          <div className="flex gap-1 mb-0.5">
                            {[1,2,3,4,5].map(i => (
                              <div key={i} className={`h-1 flex-1 rounded-full ${i <= pwdStrength.score ? pwdStrength.color : ''}`}
                                style={{ backgroundColor: i <= pwdStrength.score ? undefined : 'var(--skeleton)' }} />
                            ))}
                          </div>
                          <p className={`text-xs ${pwdStrength.score <= 2 ? 'text-red-500' : pwdStrength.score <= 3 ? 'text-yellow-600' : 'text-green-500'}`}>{pwdStrength.label}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Parolni tasdiqlang</label>
                      <div className="relative">
                        <input type={showConfirmPwd ? 'text' : 'password'} value={confirmPwd}
                          onChange={e => setConfirmPwd(e.target.value)}
                          className={`glass-input pr-10 ${
                            confirmPwd && newPwd !== confirmPwd ? '!border-red-500' :
                            confirmPwd && newPwd === confirmPwd ? '!border-green-500' : ''
                          }`} />
                        <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                          className="absolute right-3 top-2.5" style={{ color: "var(--muted)" }}>
                          {showConfirmPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                      </div>
                      {confirmPwd && newPwd === confirmPwd && <p className="text-xs text-green-500 mt-0.5 flex items-center gap-1"><CheckCircle size={12} /> Mos keldi</p>}
                      {confirmPwd && newPwd !== confirmPwd && <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1"><XCircle size={12} /> Mos emas</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setPwdStep(1); setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); }}
                        className="btn-ghost flex-1 py-2.5">Bekor qilish</button>
                      <button onClick={handlePasswordChange} disabled={pwdLoading}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-2.5 px-5 rounded-xl transition-all hover:shadow-lg disabled:opacity-50 flex-1 flex items-center justify-center gap-2">
                        {pwdLoading && <Loader2 size={16} className="animate-spin" />} O'zgartirish
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* INTERFACE TAB */}
          {activeTab === 'interface' && (
            <>
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <Sun size={18} className="text-yellow-500" /> Mavzu (Theme)
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'light', label: "Yorug'", icon: <Sun size={24} /> },
                    { key: 'dark', label: "Qorong'u", icon: <Moon size={24} /> },
                    { key: 'system', label: 'Tizim', icon: <Monitor size={24} /> },
                  ].map(t => (
                    <button key={t.key} onClick={() => { setThemeLocal(t.key); setTheme(t.key); }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        theme === t.key ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'hover:bg-[var(--sidebar-hover)]'
                      }`}
                      style={{ borderColor: theme === t.key ? undefined : 'var(--border-strong)', color: theme === t.key ? undefined : 'var(--text-secondary)' }}>
                      {t.icon}
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <Type size={18} className="text-blue-500" /> Shrift o'lchami
                </h2>
                <div className="flex gap-3">
                  {[
                    { key: 'small', label: 'Kichik', style: 'text-sm' },
                    { key: 'medium', label: "O'rta", style: 'text-base' },
                    { key: 'large', label: 'Katta', style: 'text-lg' },
                  ].map(f => (
                    <button key={f.key} onClick={() => { setFontSizeLocal(f.key); setFontSize(f.key); }}
                      className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                        fontSize === f.key ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'hover:bg-[var(--sidebar-hover)]'
                      }`}
                      style={{ borderColor: fontSize === f.key ? undefined : 'var(--border-strong)', color: fontSize === f.key ? undefined : 'var(--text-secondary)' }}>
                      <span className={`font-bold ${f.style}`}>A</span>
                      <span className="text-xs">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <Globe size={18} className="text-blue-500" /> Til
                </h2>
                <div className="space-y-2">
                  {[
                    { key: 'uz', label: "O'zbek", flag: '🇺🇿', active: true },
                    { key: 'ru', label: 'Русский', flag: '🇷🇺', active: false },
                    { key: 'en', label: 'English', flag: '🇬🇧', active: false },
                  ].map(l => (
                    <button key={l.key} onClick={() => l.active && setLanguageLocal(l.key)} disabled={!l.active}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                        language === l.key && l.active ? 'border-blue-500 bg-blue-500/10' :
                        !l.active ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--sidebar-hover)]'
                      }`}
                      style={{ borderColor: language === l.key && l.active ? undefined : 'var(--border-strong)' }}>
                      <span className="flex items-center gap-3">
                        <span className="text-xl">{l.flag}</span>
                        <span className="font-medium text-sm" style={{ color: "var(--text)" }}>{l.label}</span>
                      </span>
                      {!l.active && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--sidebar-hover)", color: "var(--muted)" }}>Tez orada</span>}
                      {language === l.key && l.active && <Check size={16} className="text-blue-500" />}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleInterfaceSave} disabled={interfaceLoading} className="btn-primary w-full py-3">
                {interfaceLoading && <Loader2 size={16} className="animate-spin" />} Saqlash
              </button>
            </>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="glass-card p-6 space-y-5">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--text)" }}>
                <Bell size={18} className="text-blue-500" /> Bildirishnomalar
                {notifySaving && <span className="text-xs font-normal ml-2" style={{ color: "var(--muted)" }}>Saqlanmoqda...</span>}
              </h2>

              {[
                { field: 'notifyNewOrder', icon: <Bell size={20} className="text-orange-500" />, label: 'Yangi buyurtma bildirishnomalari', desc: 'Yangi buyurtma kelganda xabar olish', value: notifyNewOrder, setter: setNotifyNewOrder },
                { field: 'notifyChat', icon: <MessageSquare size={20} className="text-blue-500" />, label: 'Chat xabarlari', desc: 'Yangi chat xabari kelganda xabar olish', value: notifyChat, setter: setNotifyChat },
                { field: 'notifyApplication', icon: <CheckCircle size={20} className="text-green-500" />, label: 'Ariza holati', desc: 'Ariza holati o\'zgarganda xabar olish', value: notifyApplication, setter: setNotifyApplication },
                { field: 'notifySystem', icon: <Lock size={20} className="text-purple-500" />, label: 'Tizim xabarlari', desc: 'Muhim tizim xabarlari', value: notifySystem, setter: setNotifySystem },
              ].map((item, idx) => (
                <div key={item.field}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <div>
                        <p className="font-medium text-sm" style={{ color: "var(--text)" }}>{item.label}</p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>{item.desc}</p>
                      </div>
                    </div>
                    <Toggle checked={item.value} onChange={(v) => { item.setter(v); handleNotifyToggle(item.field, v); }} />
                  </div>
                  {idx < 3 && <div className="glass-divider" />}
                </div>
              ))}
            </div>
          )}

          {/* PROVIDER TAB */}
          {activeTab === 'provider' && user?.role === 'PROVIDER' && (
            <>
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <User size={18} className="text-emerald-500" /> Bio
                </h2>
                <textarea value={bio} onChange={e => { if (e.target.value.length <= 500) setBio(e.target.value); }}
                  rows={5} maxLength={500} placeholder="O'zingiz haqida yozing..."
                  className="glass-textarea" />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{bio.length}/500</span>
                  <button onClick={handleBioSave} disabled={bioLoading} className="btn-primary text-sm">
                    {bioLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Saqlash
                  </button>
                </div>
              </div>

              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <Clock size={18} className="text-blue-500" /> Holat
                </h2>
                <div className="flex gap-3">
                  <button onClick={() => handleAvailability('AVAILABLE')} disabled={availLoading}
                    className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                      availability === 'AVAILABLE' ? 'border-green-500 bg-green-500/10 text-green-600' : ''
                    }`}
                    style={{ borderColor: availability === 'AVAILABLE' ? undefined : 'var(--border-strong)', color: availability === 'AVAILABLE' ? undefined : 'var(--text-secondary)' }}>
                    <CheckCircle size={16} /> Bo'sh
                  </button>
                  <button onClick={() => handleAvailability('BUSY')} disabled={availLoading}
                    className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                      availability === 'BUSY' ? 'border-yellow-500 bg-yellow-500/10 text-yellow-600' : ''
                    }`}
                    style={{ borderColor: availability === 'BUSY' ? undefined : 'var(--border-strong)', color: availability === 'BUSY' ? undefined : 'var(--text-secondary)' }}>
                    <Clock size={16} /> Band
                  </button>
                </div>
              </div>

              <div className="glass-card p-6 space-y-5">
                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text)" }}>
                    <MapPin size={18} className="text-red-500" /> Xizmat hududlari
                  </h2>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {districts.map(d => (
                      <span key={d} className="glass-chip">
                        {d}
                        <button onClick={() => setDistricts(prev => prev.filter(x => x !== d))} className="hover:text-red-500">
                          <X size={14}/>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="relative">
                    <input type="text" value={districtInput}
                      onChange={e => { setDistrictInput(e.target.value); setShowDistrictDropdown(true); }}
                      onFocus={() => setShowDistrictDropdown(true)}
                      placeholder="Hudud qo'shish..." className="glass-input" />
                    {showDistrictDropdown && filteredDistricts.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 glass-dropdown z-10 max-h-48 overflow-y-auto">
                        {filteredDistricts.slice(0, 10).map(d => (
                          <button key={d} onClick={() => { setDistricts(prev => [...prev, d]); setDistrictInput(''); setShowDistrictDropdown(false); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--sidebar-hover)] transition flex items-center gap-2"
                            style={{ color: "var(--text-secondary)" }}>
                            <Plus size={14} style={{ color: "var(--muted)" }} />{d}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2" style={{ color: "var(--text)" }}>Kunlik buyurtma limiti</h3>
                  <div className="flex items-center gap-3">
                    <input type="number" min={1} max={50} value={dailyLimit}
                      onChange={e => setDailyLimit(Math.min(50, Math.max(1, Number(e.target.value))))}
                      className="glass-input w-24 text-center" />
                    <span className="text-sm" style={{ color: "var(--muted)" }}>ta (1 dan 50 gacha)</span>
                  </div>
                </div>

                <button onClick={handleProviderSettingsSave} disabled={providerSettingsLoading} className="btn-primary w-full py-2.5">
                  {providerSettingsLoading && <Loader2 size={16} className="animate-spin" />} Saqlash
                </button>
              </div>

              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <Calendar size={18} className="text-indigo-500" /> Haftalik jadval
                </h2>
                <div className="space-y-3">
                  {schedule.map((day, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input type="checkbox" checked={day.isActive}
                        onChange={e => setSchedule(prev => prev.map((d, idx) => idx === i ? { ...d, isActive: e.target.checked } : d))}
                        className="w-4 h-4 accent-blue-500 rounded" />
                      <span className={`w-24 text-sm font-medium`}
                        style={{ color: day.isActive ? "var(--text)" : "var(--muted)" }}>{DAY_NAMES[day.dayOfWeek]}</span>
                      <input type="time" value={day.openTime} disabled={!day.isActive}
                        onChange={e => setSchedule(prev => prev.map((d, idx) => idx === i ? { ...d, openTime: e.target.value } : d))}
                        className="glass-input w-auto" />
                      <span style={{ color: "var(--muted)" }}>-</span>
                      <input type="time" value={day.closeTime} disabled={!day.isActive}
                        onChange={e => setSchedule(prev => prev.map((d, idx) => idx === i ? { ...d, closeTime: e.target.value } : d))}
                        className="glass-input w-auto" />
                    </div>
                  ))}
                </div>
                <button onClick={handleScheduleSave} disabled={scheduleLoading} className="btn-primary w-full mt-5 py-2.5">
                  {scheduleLoading && <Loader2 size={16} className="animate-spin" />} Jadvalni saqlash
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
