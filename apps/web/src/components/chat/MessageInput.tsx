"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { Send, ImagePlus, Loader2, X } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface MessageInputProps {
  onSend: (content: string, type?: string) => void;
  disabled?: boolean;
  disabledReason?: string;
}

export default function MessageInput({
  onSend,
  disabled = false,
  disabledReason,
}: MessageInputProps) {
  const [value, setValue] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (uploading) return;

    if (imageUrl) {
      onSend(imageUrl, "IMAGE");
      setImageUrl(null);
      return;
    }

    const content = value.trim();
    if (!content || disabled) return;
    onSend(content, "TEXT");
    setValue("");
    
    // textarea height reset
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Rasm hajmi 5MBdan oshmasligi kerak");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploading(true);
      // Reset input value so same file can be picked again if deleted
      e.target.value = "";

      const res = await api.post("/chat/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setImageUrl(res.data.data.url);
      } else {
        toast.error("Rasm yuklash muvaffaqiyatsiz bo'ldi");
      }
    } catch (err) {
      console.error("Rasm yuklashda xatolik:", err);
      toast.error("Rasm yuklashda xatolik yuz berdi");
    } finally {
      setUploading(false);
    }
  };

  if (disabled) {
    return (
      <div
        className="p-4 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border-strong)" }}
      >
        <div
          className="text-center text-sm py-2 rounded-xl"
          style={{
            color: "var(--text-secondary)",
            backgroundColor: "var(--sidebar-hover)",
          }}
        >
          Chat aktiv emas{disabledReason ? ` — ${disabledReason}` : ""}
        </div>
      </div>
    );
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  return (
    <div
      className="p-4 flex-shrink-0 bg-[var(--bg)]"
      style={{ borderTop: "1px solid var(--border-strong)" }}
    >
      {/* Uploading Spinner or Image Preview */}
      {(imageUrl || uploading) && (
        <div className="flex items-center gap-3 p-3 bg-[var(--sidebar-hover)] rounded-xl border border-[var(--border)] mb-3 animate-fade-in relative">
          {uploading ? (
            <div className="w-14 h-14 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center border border-[var(--border)]">
              <Loader2 className="animate-spin text-blue-500" size={20} />
            </div>
          ) : imageUrl ? (
            <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-[var(--border)]">
              <img
                src={imageUrl.startsWith("http") ? imageUrl : `${apiBaseUrl}${imageUrl}`}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="absolute top-0.5 right-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow-sm transition-colors cursor-pointer"
              >
                <X size={10} />
              </button>
            </div>
          ) : null}
          <div className="flex-1 min-w-0">
            <span className="text-xs text-[var(--muted)] font-medium block">
              {uploading ? "Rasm yuklanmoqda..." : "Rasm yuborishga tayyor"}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2 items-end">
        {/* File Input (Hidden) */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Image Plus Button */}
        <button
          type="button"
          className="flex-shrink-0 p-2.5 rounded-xl transition-colors hover:bg-blue-500/10 cursor-pointer"
          style={{ color: "var(--muted)" }}
          title="Rasm yuborish"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus size={20} />
        </button>

        <textarea
          ref={textareaRef}
          value={imageUrl ? "Rasm yuborish..." : value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Xabar yozing..."
          rows={1}
          disabled={!!imageUrl}
          className="flex-1 glass-input resize-none"
          style={{ maxHeight: 120, minHeight: 40 }}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={(!value.trim() && !imageUrl) || uploading}
          className="btn-primary p-2.5 rounded-xl flex-shrink-0 disabled:opacity-40 cursor-pointer"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
