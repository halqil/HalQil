"use client";

import { useEffect, useState, useRef } from "react";
import api from "../../../lib/api";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "../../../lib/store";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";
import { Send, MapPin, Clock, FileText, CheckCircle, XCircle, MessageSquare } from "lucide-react";

export default function OrderDetail() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  
  const [order, setOrder] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Record<string, any>[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    
    fetchOrder();
  }, [id, isAuthenticated, router]);

  useEffect(() => {
    if (order && (order.status === 'CHATTING' || order.status === 'IN_PROGRESS' || order.status === 'ACCEPTED')) {
      const token = localStorage.getItem('accessToken');
      socketRef.current = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
        auth: { token }
      });

      socketRef.current.emit('join_order', { order_id: id });

      socketRef.current.on('new_message', (msg) => {
        setMessages((prev) => [...prev, msg]);
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [order, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.data);
        setMessages(res.data.data.messages || []);
      }
    } catch (error) {
      toast.error("Buyurtma topilmadi");
      router.push("/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (action: string) => {
    try {
      let body = {};
      if (action === 'reject' || action === 'cancel') {
        const reason = prompt("Sababini kiriting:");
        if (!reason) return;
        body = { reason };
      }
      const res = await api.patch(`/orders/${id}/${action}`, body);
      if (res.data.success) {
        toast.success("Holat o'zgartirildi");
        fetchOrder();
      }
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik yuz berdi");
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      order_id: id,
      content: newMessage,
      type: 'TEXT'
    });
    setNewMessage("");
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!order) return null;

  const isProvider = user?.role === 'PROVIDER' && order.provider?.userId === user.id;

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Order Details */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Ma'lumotlar</h2>
            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
              {order.status}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Xizmat turi</div>
              <div className="font-semibold">{order.skill?.name}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1"><FileText size={14}/> Muammo</div>
              <p className="text-sm bg-gray-50 p-3 rounded-lg">{order.description}</p>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1"><MapPin size={14}/> Manzil</div>
              <div className="text-sm font-medium">{order.address}</div>
            </div>

            {order.preferredTime && (
              <div>
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1"><Clock size={14}/> Qulay vaqt</div>
                <div className="text-sm font-medium">{order.preferredTime}</div>
              </div>
            )}
          </div>

          {/* Action buttons based on status & role */}
          <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
            {order.status === 'PENDING' && isProvider && (
              <>
                <button onClick={() => handleStatusChange('accept')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-xl transition-colors">Qabul qilish</button>
                <button onClick={() => handleStatusChange('reject')} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 rounded-xl transition-colors">Rad etish</button>
              </>
            )}
            
            {order.status === 'PENDING' && !isProvider && (
              <button onClick={() => handleStatusChange('cancel')} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 rounded-xl transition-colors">Bekor qilish</button>
            )}

            {order.status === 'ACCEPTED' && isProvider && (
              <button onClick={() => handleStatusChange('chat')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-xl transition-colors">Chatni boshlash</button>
            )}

            {(order.status === 'CHATTING' || order.status === 'IN_PROGRESS') && (
              <button onClick={() => handleStatusChange(isProvider ? 'complete' : 'confirm')} className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-xl transition-colors flex items-center justify-center gap-2">
                <CheckCircle size={18}/> Yakunlash
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[70vh]">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-3xl">
            <h2 className="text-lg font-bold">
              Chat: {isProvider ? order.user?.name : order.provider?.user?.name}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                <MessageSquare size={48} className="opacity-20" />
                <p>Xabarlar yo'q</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm'}`}>
                      <p className="text-sm">{msg.content}</p>
                      <div className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-100">
            {['PENDING', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes(order.status) ? (
              <div className="text-center text-gray-500 text-sm py-2 bg-gray-50 rounded-xl">
                Chat aktiv emas (Holat: {order.status})
              </div>
            ) : (
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Xabar yozing..."
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-colors flex items-center justify-center">
                  <Send size={20} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
