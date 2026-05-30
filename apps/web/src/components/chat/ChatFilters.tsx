"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Search } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface ChatFiltersProps {
  onCategoryChange: (categoryId: string) => void;
  onSearchChange: (search: string) => void;
}

export function ChatFilters({ onCategoryChange, onSearchChange }: ChatFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await api.get("/chats/categories");
        if (res.data.success) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error("Kategoriyalarni yuklashda xato:", err);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearchChange(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, onSearchChange]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    onCategoryChange(categoryId);
  };

  return (
    <div className="p-4 space-y-3 border-b border-[var(--border)] bg-[var(--bg)]">
      {/* Search Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--muted)]">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Ism yoki mavzu bo'yicha qidirish..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-[var(--sidebar-hover)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-[var(--text)] transition-all duration-200"
        />
      </div>

      {/* Category Selection */}
      <div className="flex items-center gap-2">
        <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--muted)] flex-shrink-0">
          Kategoriya:
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => handleCategorySelect(e.target.value)}
          className="flex-1 bg-[var(--sidebar-hover)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200 cursor-pointer"
        >
          <option value="">Barchasi</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
