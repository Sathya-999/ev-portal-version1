import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { MessageSquare, Loader2, Send } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const API = import.meta.env.VITE_API_URL || '';

const getUserName = (): string => {
  try {
    const profile = localStorage.getItem('user_profile');
    if (profile) {
      const p = JSON.parse(profile);
      return p.firstName || p.name || 'there';
    }
  } catch {}
  return 'there';
};

export const ChatbotModule: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const userName = getUserName();

  useEffect(() => {
    setMessages([
      {
        id: '1',
        text: `Hi ${userName}! I'm your AI-powered EV Assistant. Ask me anything about chargers, slots, pricing, or battery tips!`,
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
  }, [userName]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: trimmed,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('token');
      // Send message + recent history to Gemini backend
      const history = [...messages, userMsg]
        .filter((m) => m.id !== '1') // exclude welcome msg
        .slice(-20)
        .map((m) => ({ text: m.text, sender: m.sender }));

      const res = await fetch(`${API}/api/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: trimmed, history }),
      });

      const data = await res.json();
      const reply = res.ok ? data.reply : data.error || 'Something went wrong. Please try again.';

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: reply,
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: 'Network error — please check your connection and try again.',
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Card className="fixed bottom-24 right-6 w-96 h-[500px] shadow-2xl flex flex-col border-0 overflow-hidden z-50 animate-in slide-in-from-bottom duration-500">
      <CardHeader className="bg-gradient-to-r from-[#5F259F] to-indigo-700 text-white p-4 flex flex-row items-center gap-3">
        <MessageSquare className="w-5 h-5" />
        <CardTitle className="text-lg font-bold">EV Assistant</CardTitle>
        <span className="ml-auto text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">Gemini AI</span>
      </CardHeader>
      <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-[#5F259F] text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700 rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="text-slate-400 text-xs italic ml-2 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Gemini is thinking...
          </div>
        )}
      </CardContent>
      <form onSubmit={handleSend} className="p-4 border-t bg-white dark:bg-slate-800 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about chargers, slots, pricing..."
          className="flex-1 rounded-full bg-slate-50 border-none px-4"
        />
        <Button type="submit" size="icon" disabled={isTyping} className="rounded-full bg-[#5F259F] hover:bg-[#4A1D7A] shadow-md disabled:opacity-50">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </Card>
  );
};
