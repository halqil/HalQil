"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface MessageBubbleProps {
  message: {
    _temp?: boolean;
    senderId: string;
    content: string;
    type: string;
    createdAt: string;
  };
  isMine: boolean;
}

const MessageBubble = React.memo(function MessageBubble({
  message,
  isMine,
}: MessageBubbleProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const isImage = message.type === "IMAGE";
  const imgSrc = isImage
    ? message.content.startsWith("http")
      ? message.content
      : `${apiBaseUrl}${message.content}`
    : "";

  return (
    <>
      <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[75%] rounded-2xl text-sm ${
            isMine
              ? "bg-blue-600 text-white rounded-tr-sm"
              : "rounded-tl-sm"
          } ${message._temp ? "opacity-60" : ""} ${
            isImage
              ? "p-1 bg-[var(--sidebar-hover)] border border-[var(--border)] overflow-hidden"
              : "px-4 py-2.5"
          }`}
          style={
            !isMine && !isImage
              ? {
                  backgroundColor: "var(--sidebar-hover)",
                  color: "var(--text)",
                }
              : undefined
          }
        >
          {isImage ? (
            <div className="relative group cursor-pointer overflow-hidden rounded-xl">
              <img
                src={imgSrc}
                alt="Chat Image"
                onClick={() => setLightboxOpen(true)}
                className="max-w-full max-h-60 object-cover rounded-xl transition-all duration-200 hover:opacity-90"
              />
              <div
                className={`text-[10px] mt-1.5 px-2 pb-1 flex items-center gap-1 text-[var(--muted)]`}
              >
                {time}
                {message._temp && (
                  <span className="italic text-[10px]">yuborilmoqda...</span>
                )}
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              <div
                className={`text-[10px] mt-1 flex items-center gap-1 ${
                  isMine ? "text-blue-200" : ""
                }`}
                style={!isMine ? { color: "var(--muted)" } : undefined}
              >
                {time}
                {message._temp && (
                  <span className="italic">yuborilmoqda...</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
          <img
            src={imgSrc}
            alt="Chat Image Fullscreen"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-white/10"
          />
        </div>
      )}
    </>
  );
});

MessageBubble.displayName = "MessageBubble";

export default MessageBubble;
