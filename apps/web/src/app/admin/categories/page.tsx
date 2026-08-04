'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog';
import { SkeletonRow } from '@/components/admin/shared/SkeletonRow';
import { EmptyState } from '@/components/admin/shared/EmptyState';
import { PageHeader } from '@/components/admin/shared/PageHeader';
import { StatusBadge } from '@/components/admin/shared/StatusBadge';
import type { Category, Skill, ServiceType } from '@/components/admin/types';
import {
  Plus, ChevronRight, ChevronDown, Edit2, Trash2, ToggleLeft, ToggleRight,
  FolderOpen, Loader2, Search, X, Zap, Activity
} from 'lucide-react';

// ─── Modal ───────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-modal fade-in relative w-full md:max-w-lg mx-auto my-4 md:my-0 p-4 md:p-6 max-h-[90vh] overflow-y-auto rounded-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 btn-ghost p-1.5 rounded-lg">
          <X size={18} />
        </button>
        <h3 className="text-lg font-semibold mb-4 pr-8" style={{ color: 'var(--text)' }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  // ─── State ─────────────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Category modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: '', description: '', icon: '' });
  const [catSaving, setCatSaving] = useState(false);

  // Skill modal
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [skillCategoryId, setSkillCategoryId] = useState('');
  const [skillForm, setSkillForm] = useState({ name: '', description: '' });
  const [skillSaving, setSkillSaving] = useState(false);

  // ServiceType modal
  const [stModalOpen, setStModalOpen] = useState(false);
  const [editingSt, setEditingSt] = useState<ServiceType | null>(null);
  const [stSkillId, setStSkillId] = useState('');
  const [stForm, setStForm] = useState({ name: '', description: '', pricingType: 'FIXED', fixedFee: 0, providerTimeoutMinutes: 30 });
  const [stSaving, setStSaving] = useState(false);

  // Toggle/Delete
  const [toggleTarget, setToggleTarget] = useState<{ type: 'category' | 'skill' | 'serviceType'; id: string; name: string; isActive: boolean } | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'skill' | 'serviceType'; id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // ─── Debounce ──────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ─── Fetch ─────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/categories', {
        params: {
          status: statusFilter,
          search: search || undefined,
        },
      });
      const data = res.data.data ?? res.data ?? [];
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Kategoriyalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ─── Toggle expand ─────────────────────────────────────────────
  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Category CRUD ─────────────────────────────────────────────
  const openAddCategory = () => {
    setEditingCat(null);
    setCatForm({ name: '', description: '', icon: '' });
    setCatModalOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name, description: cat.description || '', icon: cat.icon || '' });
    setCatModalOpen(true);
  };

  const handleCatSave = async () => {
    if (!catForm.name.trim()) { toast.error('Nomi kiritilishi shart'); return; }
    setCatSaving(true);
    try {
      const body = { name: catForm.name.trim(), description: catForm.description.trim() || null, icon: catForm.icon.trim() || null };
      if (editingCat) {
        await api.patch(`/admin/categories/${editingCat.id}`, body);
        toast.success('Kategoriya yangilandi');
      } else {
        await api.post('/admin/categories', body);
        toast.success("Kategoriya qo'shildi");
      }
      setCatModalOpen(false);
      fetchCategories();
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setCatSaving(false);
    }
  };

  // ─── Skill CRUD ────────────────────────────────────────────────
  const openAddSkill = (categoryId: string) => {
    setEditingSkill(null);
    setSkillCategoryId(categoryId);
    setSkillForm({ name: '', description: '' });
    setSkillModalOpen(true);
  };

  const openEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setSkillCategoryId(skill.categoryId);
    setSkillForm({ name: skill.name, description: skill.description || '' });
    setSkillModalOpen(true);
  };

  const handleSkillSave = async () => {
    if (!skillForm.name.trim()) { toast.error('Nomi kiritilishi shart'); return; }
    setSkillSaving(true);
    try {
      if (editingSkill) {
        await api.patch(`/admin/skills/${editingSkill.id}`, {
          name: skillForm.name.trim(),
          description: skillForm.description.trim() || null,
        });
        toast.success('Skill yangilandi');
      } else {
        await api.post('/admin/skills', {
          categoryId: skillCategoryId,
          name: skillForm.name.trim(),
          description: skillForm.description.trim() || null,
        });
        toast.success("Skill qo'shildi");
      }
      setSkillModalOpen(false);
      fetchCategories();
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setSkillSaving(false);
    }
  };

  // ─── ServiceType CRUD ──────────────────────────────────────────
  const openAddSt = (skillId: string) => {
    setEditingSt(null);
    setStSkillId(skillId);
    setStForm({ name: '', description: '', pricingType: 'FIXED', fixedFee: 0, providerTimeoutMinutes: 30 });
    setStModalOpen(true);
  };

  const openEditSt = (st: ServiceType) => {
    setEditingSt(st);
    setStSkillId(st.skillId);
    setStForm({ name: st.name, description: st.description || '', pricingType: st.pricingType, fixedFee: st.fixedFee, providerTimeoutMinutes: st.providerTimeoutMinutes });
    setStModalOpen(true);
  };

  const handleStSave = async () => {
    if (!stForm.name.trim()) { toast.error('Nomi kiritilishi shart'); return; }
    setStSaving(true);
    try {
      const body = {
        name: stForm.name.trim(),
        description: stForm.description.trim() || null,
        pricingType: stForm.pricingType,
        fixedFee: Number(stForm.fixedFee),
        providerTimeoutMinutes: Number(stForm.providerTimeoutMinutes)
      };
      if (editingSt) {
        await api.patch(`/admin/service-types/${editingSt.id}`, body);
        toast.success('ServiceType yangilandi');
      } else {
        await api.post('/admin/service-types', { ...body, skillId: stSkillId });
        toast.success("ServiceType qo'shildi");
      }
      setStModalOpen(false);
      fetchCategories();
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setStSaving(false);
    }
  };

  // ─── Toggle ────────────────────────────────────────────────────
  const handleToggle = async () => {
    if (!toggleTarget) return;
    setToggleLoading(true);
    try {
      const endpoint = toggleTarget.type === 'category'
        ? `/admin/categories/${toggleTarget.id}/toggle`
        : toggleTarget.type === 'skill' 
          ? `/admin/skills/${toggleTarget.id}/toggle`
          : `/admin/service-types/${toggleTarget.id}/toggle`;
      await api.patch(endpoint);
      toast.success(toggleTarget.isActive ? 'Nofaol qilindi' : 'Faol qilindi');
      fetchCategories();
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setToggleLoading(false);
      setToggleTarget(null);
    }
  };

  // ─── Delete ────────────────────────────────────────────────────
  const handleDeleteCheck = async (type: 'category' | 'skill' | 'serviceType', id: string, name: string) => {
    try {
      const endpoint = type === 'category'
        ? `/admin/categories/${id}/check-delete`
        : type === 'skill'
          ? `/admin/skills/${id}/check-delete`
          : `/admin/service-types/${id}/check-delete`;
      const res = await api.get(endpoint);
      const data = res.data.data ?? res.data;
      if (!data.canDelete) {
        toast.error(`${data.providersCount} ta provayder bor, o'chirib bo'lmaydi`);
        return;
      }
      setDeleteTarget({ type, id, name });
      setDeleteConfirmName('');
    } catch {
      toast.error('Tekshirishda xatolik');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteConfirmName !== deleteTarget.name) {
      toast.error('Nom mos kelmadi');
      return;
    }
    setDeleteLoading(true);
    try {
      const endpoint = deleteTarget.type === 'category'
        ? `/admin/categories/${deleteTarget.id}`
        : deleteTarget.type === 'skill'
          ? `/admin/skills/${deleteTarget.id}`
          : `/admin/service-types/${deleteTarget.id}`;
      await api.delete(endpoint);
      toast.success("O'chirildi");
      fetchCategories();
    } catch {
      toast.error("O'chirishda xatolik");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Kategoriyalar"
        description="Kategoriya va skilllarni boshqarish"
        action={
          <button onClick={openAddCategory} className="btn-primary px-4 py-2.5 text-sm font-medium flex items-center gap-2">
            <Plus size={16} />
            <span className="hidden sm:inline">Kategoriya qo&apos;shish</span>
          </button>
        }
      />

      {/* ─── Filters ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-1">
          {[
            { value: 'all' as const, label: 'Barchasi' },
            { value: 'active' as const, label: 'Faol' },
            { value: 'inactive' as const, label: 'Nofaol' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                statusFilter === tab.value ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="search-wrapper flex-1 min-w-[200px] sm:max-w-sm">
          <input
            className="glass-input"
            placeholder="Qidirish..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <span className="search-icon">
            <Search size={15} />
          </span>
        </div>
      </div>

      {/* ─── Category Tree ─── */}
      {loading ? (
        <SkeletonRow cols={5} rows={5} />
      ) : categories.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Kategoriyalar topilmadi" action={{ label: "Kategoriya qo'shish", onClick: openAddCategory }} />
      ) : (
        <div className="space-y-4">
          {/* Desktop Tree View */}
          <div className="hidden md:block space-y-3">
            {categories.map((cat) => (
              <div key={cat.id} className="glass-card rounded-2xl overflow-hidden">
                {/* Category Row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                  onClick={() => toggleExpand(cat.id)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <button className="btn-ghost p-1 rounded-lg flex-shrink-0">
                    {expanded.has(cat.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>

                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--sidebar-active)' }}>
                    <FolderOpen size={16} style={{ color: 'var(--text-secondary)' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{cat.name}</p>
                    {cat.description && <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{cat.description}</p>}
                  </div>

                  <span className="glass-badge text-xs px-2 py-1 rounded-lg whitespace-nowrap">
                    {cat.skills?.length ?? 0} ta skill
                  </span>
                  <span className="text-xs whitespace-nowrap" style={{ color: 'var(--muted)' }}>
                    {cat.providersCount ?? 0} provayder
                  </span>

                  <StatusBadge status={cat.isActive ? 'ACTIVE' : 'FROZEN'} type="user" />

                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEditCategory(cat)} className="btn-ghost p-1.5 rounded-lg" title="Tahrirlash">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => openAddSkill(cat.id)} className="btn-ghost p-1.5 rounded-lg" title="Skill qo'shish">
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => setToggleTarget({ type: 'category', id: cat.id, name: cat.name, isActive: cat.isActive })}
                      className="btn-ghost p-1.5 rounded-lg"
                      title={cat.isActive ? 'Nofaol qilish' : 'Faol qilish'}
                    >
                      {cat.isActive ? <ToggleRight size={14} style={{ color: '#22c55e' }} /> : <ToggleLeft size={14} />}
                    </button>
                    <button
                      onClick={() => handleDeleteCheck('category', cat.id, cat.name)}
                      className="btn-ghost p-1.5 rounded-lg"
                      title="O'chirish"
                    >
                      <Trash2 size={14} style={{ color: '#ef4444' }} />
                    </button>
                  </div>
                </div>

                {/* Skills */}
                {expanded.has(cat.id) && cat.skills && cat.skills.length > 0 && (
                  <div className="border-t" style={{ borderColor: 'var(--border)' }}>
                    {cat.skills.map((skill) => (
                      <div key={skill.id}>
                        <div
                          className="flex items-center gap-3 pl-14 pr-4 py-2.5 transition-colors cursor-pointer"
                          style={{ borderBottom: '1px solid var(--border)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          onClick={() => toggleExpand(skill.id)}
                        >
                          <button className="btn-ghost p-1 rounded-lg flex-shrink-0">
                            {expanded.has(skill.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                          <Zap size={14} style={{ color: 'var(--muted)' }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm" style={{ color: 'var(--text)' }}>{skill.name}</p>
                            {skill.description && <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{skill.description}</p>}
                          </div>
                          <span className="text-xs" style={{ color: 'var(--muted)' }}>{skill.providersCount ?? 0} provayder</span>
                          <StatusBadge status={skill.isActive ? 'ACTIVE' : 'FROZEN'} type="user" />
                          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => openEditSkill(skill)} className="btn-ghost p-1.5 rounded-lg" title="Tahrirlash">
                              <Edit2 size={12} />
                            </button>
                            <button onClick={() => openAddSt(skill.id)} className="btn-ghost p-1.5 rounded-lg" title="Xizmat turi qo'shish">
                              <Plus size={12} />
                            </button>
                            <button
                              onClick={() => setToggleTarget({ type: 'skill', id: skill.id, name: skill.name, isActive: skill.isActive })}
                              className="btn-ghost p-1.5 rounded-lg"
                              title={skill.isActive ? 'Nofaol qilish' : 'Faol qilish'}
                            >
                              {skill.isActive ? <ToggleRight size={12} style={{ color: '#22c55e' }} /> : <ToggleLeft size={12} />}
                            </button>
                            <button
                              onClick={() => handleDeleteCheck('skill', skill.id, skill.name)}
                              className="btn-ghost p-1.5 rounded-lg"
                              title="O'chirish"
                            >
                              <Trash2 size={12} style={{ color: '#ef4444' }} />
                            </button>
                          </div>
                        </div>

                        {/* Service Types */}
                        {expanded.has(skill.id) && skill.serviceTypes && skill.serviceTypes.length > 0 && (
                          <div className="border-t bg-gray-50/10" style={{ borderColor: 'var(--border)' }}>
                            {skill.serviceTypes.map((st) => (
                              <div
                                key={st.id}
                                className="flex items-center gap-3 pl-24 pr-4 py-2 transition-colors"
                                style={{ borderBottom: '1px solid var(--border)' }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <Activity size={14} style={{ color: 'var(--muted)' }} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm" style={{ color: 'var(--text)' }}>{st.name}</p>
                                  {st.description && <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{st.description}</p>}
                                </div>
                                <span className="glass-badge text-xs px-2 py-1 rounded-lg whitespace-nowrap">
                                  {st.pricingType === 'FIXED' ? 'Qat\'iy' : st.pricingType === 'NEGOTIABLE' ? 'Kelishilgan' : 'Min/Max'}
                                </span>
                                <span className="text-xs" style={{ color: 'var(--muted)' }}>{st.providersCount ?? 0} provayder</span>
                                <StatusBadge status={st.isActive ? 'ACTIVE' : 'FROZEN'} type="user" />
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button onClick={() => openEditSt(st)} className="btn-ghost p-1.5 rounded-lg" title="Tahrirlash">
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => setToggleTarget({ type: 'serviceType', id: st.id, name: st.name, isActive: st.isActive })}
                                    className="btn-ghost p-1.5 rounded-lg"
                                  >
                                    {st.isActive ? <ToggleRight size={12} style={{ color: '#22c55e' }} /> : <ToggleLeft size={12} />}
                                  </button>
                                  <button onClick={() => handleDeleteCheck('serviceType', st.id, st.name)} className="btn-ghost p-1.5 rounded-lg" style={{ color: '#ef4444' }}>
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {expanded.has(cat.id) && (!cat.skills || cat.skills.length === 0) && (
                  <div className="border-t px-14 py-4" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>Skilllar topilmadi</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden space-y-3">
            {categories.map((cat) => (
              <div key={cat.id} className="glass-card p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleExpand(cat.id)}>
                      {expanded.has(cat.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>{cat.name}</span>
                    <StatusBadge status={cat.isActive ? 'ACTIVE' : 'FROZEN'} type="user" />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs mb-3" style={{ color: 'var(--muted)' }}>
                  <span>{cat.skills?.length ?? 0} skill</span>
                  <span>·</span>
                  <span>{cat.providersCount ?? 0} provayder</span>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => openEditCategory(cat)} className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1 rounded-lg">
                    <Edit2 size={12} /> Tahrirlash
                  </button>
                  <button onClick={() => openAddSkill(cat.id)} className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1 rounded-lg">
                    <Plus size={12} /> Skill
                  </button>
                  <button
                    onClick={() => setToggleTarget({ type: 'category', id: cat.id, name: cat.name, isActive: cat.isActive })}
                    className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1 rounded-lg"
                    style={{ color: cat.isActive ? '#ef4444' : '#22c55e' }}
                  >
                    {cat.isActive ? <ToggleRight size={12} style={{ color: '#22c55e' }} /> : <ToggleLeft size={12} />}
                    {cat.isActive ? 'Nofaol' : 'Faol'}
                  </button>
                  <button onClick={() => handleDeleteCheck('category', cat.id, cat.name)} className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1 rounded-lg" style={{ color: '#ef4444' }}>
                    <Trash2 size={12} /> O'chir
                  </button>
                </div>

                {expanded.has(cat.id) && cat.skills && cat.skills.length > 0 && (
                  <div className="pl-4 mt-2 space-y-1 border-l-2" style={{ borderColor: 'var(--border)' }}>
                    {cat.skills.map((skill) => (
                      <div key={skill.id}>
                        <div className="flex items-center justify-between py-1 cursor-pointer" onClick={() => toggleExpand(skill.id)}>
                          <div className="flex items-center gap-2">
                            {expanded.has(skill.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>{skill.name}</span>
                            <StatusBadge status={skill.isActive ? 'ACTIVE' : 'FROZEN'} type="user" />
                          </div>
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => openEditSkill(skill)} className="btn-ghost p-1 rounded-lg">
                              <Edit2 size={12} />
                            </button>
                            <button onClick={() => openAddSt(skill.id)} className="btn-ghost p-1 rounded-lg">
                              <Plus size={12} />
                            </button>
                            <button
                              onClick={() => setToggleTarget({ type: 'skill', id: skill.id, name: skill.name, isActive: skill.isActive })}
                              className="btn-ghost p-1 rounded-lg"
                            >
                              {skill.isActive ? <ToggleRight size={12} style={{ color: '#22c55e' }} /> : <ToggleLeft size={12} />}
                            </button>
                            <button onClick={() => handleDeleteCheck('skill', skill.id, skill.name)} className="btn-ghost p-1 rounded-lg" style={{ color: '#ef4444' }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Mobile Service Types */}
                        {expanded.has(skill.id) && skill.serviceTypes && skill.serviceTypes.length > 0 && (
                          <div className="pl-4 mt-2 space-y-2 border-l-2" style={{ borderColor: 'var(--border)' }}>
                            {skill.serviceTypes.map((st) => (
                              <div key={st.id} className="flex flex-col gap-1 py-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs" style={{ color: 'var(--text)' }}>{st.name}</span>
                                  <div className="flex gap-1">
                                    <button onClick={() => openEditSt(st)} className="btn-ghost p-1 rounded-lg"><Edit2 size={10} /></button>
                                    <button onClick={() => setToggleTarget({ type: 'serviceType', id: st.id, name: st.name, isActive: st.isActive })} className="btn-ghost p-1 rounded-lg">
                                      {st.isActive ? <ToggleRight size={10} style={{ color: '#22c55e' }} /> : <ToggleLeft size={10} />}
                                    </button>
                                    <button onClick={() => handleDeleteCheck('serviceType', st.id, st.name)} className="btn-ghost p-1 rounded-lg" style={{ color: '#ef4444' }}><Trash2 size={10} /></button>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <span className="glass-badge text-[10px] px-1.5 py-0.5 rounded-md">
                                    {st.pricingType}
                                  </span>
                                  <StatusBadge status={st.isActive ? 'ACTIVE' : 'FROZEN'} type="user" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {expanded.has(cat.id) && (!cat.skills || cat.skills.length === 0) && (
                  <div className="mt-3 pt-3 text-center" style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Skilllar topilmadi</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Category Modal ─── */}
      <Modal open={catModalOpen} onClose={() => setCatModalOpen(false)} title={editingCat ? 'Kategoriyani tahrirlash' : "Kategoriya qo'shish"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nomi *</label>
            <input
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              placeholder="Kategoriya nomi"
              className="glass-input w-full px-4 py-2.5 text-sm"
              style={{ color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tavsif</label>
            <textarea
              value={catForm.description}
              onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
              placeholder="Qisqacha tavsif"
              rows={3}
              className="glass-textarea w-full px-4 py-3 text-sm"
              style={{ color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Ikonka</label>
            <input
              value={catForm.icon}
              onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
              placeholder="masalan: wrench"
              className="glass-input w-full px-4 py-2.5 text-sm"
              style={{ color: 'var(--text)' }}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setCatModalOpen(false)} className="btn-ghost px-4 py-2.5 rounded-xl text-sm font-medium">Bekor qilish</button>
            <button onClick={handleCatSave} disabled={catSaving} className="btn-primary px-5 py-2.5 text-sm font-medium flex items-center gap-2 disabled:opacity-60">
              {catSaving && <Loader2 size={16} className="animate-spin" />}
              Saqlash
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Skill Modal ─── */}
      <Modal open={skillModalOpen} onClose={() => setSkillModalOpen(false)} title={editingSkill ? 'Skillni tahrirlash' : "Skill qo'shish"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nomi *</label>
            <input
              value={skillForm.name}
              onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
              placeholder="Skill nomi"
              className="glass-input w-full px-4 py-2.5 text-sm"
              style={{ color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tavsif</label>
            <textarea
              value={skillForm.description}
              onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
              placeholder="Qisqacha tavsif"
              rows={3}
              className="glass-textarea w-full px-4 py-3 text-sm"
              style={{ color: 'var(--text)' }}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setSkillModalOpen(false)} className="btn-ghost px-4 py-2.5 rounded-xl text-sm font-medium">Bekor qilish</button>
            <button onClick={handleSkillSave} disabled={skillSaving} className="btn-primary px-5 py-2.5 text-sm font-medium flex items-center gap-2 disabled:opacity-60">
              {skillSaving && <Loader2 size={16} className="animate-spin" />}
              Saqlash
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── ServiceType Modal ─── */}
      <Modal open={stModalOpen} onClose={() => setStModalOpen(false)} title={editingSt ? 'Xizmat turini tahrirlash' : "Xizmat turi qo'shish"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nomi *</label>
            <input
              value={stForm.name}
              onChange={(e) => setStForm({ ...stForm, name: e.target.value })}
              placeholder="Masalan: Yevro remont, Kosmetik remont..."
              className="glass-input w-full px-4 py-2.5 text-sm"
              style={{ color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tavsif</label>
            <textarea
              value={stForm.description}
              onChange={(e) => setStForm({ ...stForm, description: e.target.value })}
              placeholder="Xizmat turi haqida ma'lumot"
              rows={2}
              className="glass-textarea w-full px-4 py-3 text-sm"
              style={{ color: 'var(--text)' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Narxlash turi</label>
              <select
                value={stForm.pricingType}
                onChange={(e) => setStForm({ ...stForm, pricingType: e.target.value })}
                className="glass-input w-full px-4 py-2.5 text-sm"
                style={{ color: 'var(--text)' }}
              >
                <option value="FIXED">Qat'iy narx (Fixed)</option>
                <option value="NEGOTIABLE">Kelishilgan (Negotiable)</option>
                <option value="MIN_MAX">Min-Max (Oraliq)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>O'rtacha Narx</label>
              <input
                type="number"
                value={stForm.fixedFee}
                onChange={(e) => setStForm({ ...stForm, fixedFee: Number(e.target.value) })}
                className="glass-input w-full px-4 py-2.5 text-sm"
                style={{ color: 'var(--text)' }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Usta topish vaqti (Minut)</label>
            <input
              type="number"
              value={stForm.providerTimeoutMinutes}
              onChange={(e) => setStForm({ ...stForm, providerTimeoutMinutes: Number(e.target.value) })}
              className="glass-input w-full px-4 py-2.5 text-sm"
              style={{ color: 'var(--text)' }}
            />
            <p className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>Avto rad etish vaqti (Default 30 min)</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setStModalOpen(false)} className="btn-ghost px-4 py-2.5 rounded-xl text-sm font-medium">Bekor qilish</button>
            <button onClick={handleStSave} disabled={stSaving} className="btn-primary px-5 py-2.5 text-sm font-medium flex items-center gap-2 disabled:opacity-60">
              {stSaving && <Loader2 size={16} className="animate-spin" />}
              Saqlash
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Toggle Dialog ─── */}
      <ConfirmDialog
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggle}
        title={toggleTarget?.isActive ? 'Nofaol qilish' : 'Faol qilish'}
        description={`"${toggleTarget?.name}" ni ${toggleTarget?.isActive ? 'nofaol' : 'faol'} qilishni xohlaysizmi?`}
        confirmText={toggleTarget?.isActive ? 'Nofaol qilish' : 'Faol qilish'}
        variant="warning"
        loading={toggleLoading}
      />

      {/* ─── Delete Dialog ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="glass-modal fade-in relative w-full md:max-w-lg mx-auto my-4 md:my-0 p-4 md:p-6 max-h-[90vh] overflow-y-auto rounded-2xl">
            <button onClick={() => setDeleteTarget(null)} className="absolute top-4 right-4 btn-ghost p-1.5 rounded-lg">
              <X size={18} />
            </button>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>O&apos;chirishni tasdiqlash</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              &quot;{deleteTarget.name}&quot; ni o&apos;chirish uchun nomini kiriting:
            </p>
            <input
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder={deleteTarget.name}
              className="glass-input w-full px-4 py-2.5 text-sm mb-4"
              style={{ color: 'var(--text)' }}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-ghost px-4 py-2.5 rounded-xl text-sm font-medium">Bekor qilish</button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading || deleteConfirmName !== deleteTarget.name}
                className="btn-danger px-5 py-2.5 text-sm font-medium flex items-center gap-2 disabled:opacity-60"
              >
                {deleteLoading && <Loader2 size={16} className="animate-spin" />}
                O&apos;chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
