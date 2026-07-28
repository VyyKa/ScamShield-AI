'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TrollPersonaId, PersonaDetails, TrollMessage, TrollStats } from '@/types';
import { formatTimestamp } from '@/lib/utils';
import { apiPost } from '@/lib/clientApi';
import { Toast } from '@/components/ui/Toast';

const DEFAULT_PERSONAS: PersonaDetails[] = [
  {
    id: 'Grandma_70',
    name: 'Bà nội 70 tuổi',
    age: '70 tuổi',
    role: 'Hưu trí',
    avatar: '👵',
    description: 'Lãng tai, hỏi lại OTP 10 lần, hay kể chuyện ngày xưa.',
    trollStrategy: 'Gõ chậm, nhầm ngân hàng với kênh TV.',
  },
  {
    id: 'Naive_Student',
    name: 'Sinh viên ngây thơ',
    age: '18 tuổi',
    role: 'Sinh viên',
    avatar: '🎒',
    description: 'Háo hức kiếm tiền, quên mật khẩu, ví 0 đồng.',
    trollStrategy: 'Hỏi nạp bằng thẻ sinh viên / Momo 12k.',
  },
];

const PRESET_SCAMMER = [
  'Alo! Đọc mã OTP 6 số ngay không tài khoản bị khóa!',
  'Chuyển 300k phí cọc đơn Shopee COD 0đ gấp!',
  'Công an Hà Nội yêu cầu chuyển tiền vào TK tạm giữ!',
];

export const AutoTrollTab: React.FC = () => {
  const [selectedPersona, setSelectedPersona] = useState<TrollPersonaId | string>('Grandma_70');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customPersonas, setCustomPersonas] = useState<PersonaDetails[]>([]);
  const [showNewPersona, setShowNewPersona] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('25');
  const [newAvatar, setNewAvatar] = useState('😎');
  const [newDesc, setNewDesc] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<'info' | 'success' | 'danger' | 'warning'>('info');

  const [chatMessages, setChatMessages] = useState<TrollMessage[]>([]);

  const [stats, setStats] = useState<TrollStats>({
    timeWastedMins: 0,
    explanationsForced: 3,
    patienceLevel: 40,
    frustrationLevel: 6,
  });

  const chatBoxRef = useRef<HTMLDivElement>(null);
  const allPersonas = [...DEFAULT_PERSONAS, ...customPersonas];
  const current = allPersonas.find((p) => p.id === selectedPersona) || DEFAULT_PERSONAS[0];

  useEffect(() => {
    if (chatBoxRef.current && chatMessages.length > 0) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [chatMessages, isLoading]);

  const toastMsg = (m: string, variant: 'info' | 'success' | 'danger' | 'warning' = 'info') => {
    setToastVariant(variant);
    setToast(m);
  };

  const handleCreatePersona = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const created: PersonaDetails = {
      id: `custom_${Date.now()}` as TrollPersonaId,
      name: newName.trim(),
      age: `${newAge} tuổi`,
      role: 'Custom',
      avatar: newAvatar || '🤖',
      description: newDesc.trim() || 'Persona tùy chỉnh',
      trollStrategy: 'Câu giờ thông minh',
    };
    setCustomPersonas((p) => [...p, created]);
    setSelectedPersona(created.id);
    setShowNewPersona(false);
    setNewName('');
    setNewDesc('');
    toastMsg('Đã tạo persona mới');
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: TrollMessage = {
      id: `s-${Date.now()}`,
      sender: 'scammer',
      text,
      timestamp: formatTimestamp(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const personaMeta = allPersonas.find((p) => p.id === selectedPersona);
      const personaDetails = personaMeta
        ? `${personaMeta.name} (${personaMeta.age}, ${personaMeta.role}): ${personaMeta.description}. Strategy: ${personaMeta.trollStrategy}`
        : '';

      const data = await apiPost<{
        success: boolean;
        result?: { botReply: string; timeWastedIncrement?: number; scammerFrustrationLevel?: number };
        isFallback?: boolean;
        error?: string;
      }>('/api/troll', {
        history: chatMessages,
        lastScammerMessage: text,
        persona: selectedPersona,
        personaDetails,
      });

      if (data.success && data.result) {
        const botMsg: TrollMessage = {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: data.result.botReply,
          timestamp: formatTimestamp(),
        };
        setChatMessages((prev) => [...prev, botMsg]);
        setStats((prev) => ({
          timeWastedMins: prev.timeWastedMins + (data.result!.timeWastedIncrement || 2),
          explanationsForced: prev.explanationsForced + 1,
          frustrationLevel: Math.min(10, data.result!.scammerFrustrationLevel || prev.frustrationLevel + 1),
          patienceLevel: Math.max(0, 100 - (data.result!.scammerFrustrationLevel || 7) * 10),
        }));
        if (data.isFallback) toastMsg('Đang dùng fallback (chưa có / lỗi Gemini key)', 'warning');
      } else {
        toastMsg(data.error || 'Lỗi troll API', 'danger');
      }
    } catch (err: any) {
      toastMsg(err.message || 'Không kết nối được máy chủ', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrap space-y-5">
      <Toast message={toast} variant={toastVariant} onClose={() => setToast(null)} />

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="section-title">Auto-Troll AI</h1>
          <p className="section-sub">Dán tin scammer — bot trả lời theo persona để câu giờ (Gemini).</p>
        </div>
        <span className="badge-violet w-fit">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          Live agent
        </span>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-12">
        {/* Personas */}
        <aside className="flex flex-col gap-3 lg:col-span-3 lg:h-[min(70vh,640px)] lg:min-h-[420px]">
          <div className="card flex min-h-0 flex-1 flex-col overflow-hidden p-4">
            <h3 className="mb-3 shrink-0 text-sm font-bold">Persona</h3>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-0.5">
              {allPersonas.map((p) => {
                const on = selectedPersona === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPersona(p.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                      on ? 'border-accent/40 bg-accent-soft' : 'border-white/8 hover:border-white/15 light:border-[var(--hairline)]'
                    }`}
                  >
                    <span className="text-2xl">{p.avatar}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{p.name}</p>
                      <p className="text-[11px] text-on-surface-variant line-clamp-2">{p.description}</p>
                    </div>
                  </button>
                );
              })}
              <button type="button" onClick={() => setShowNewPersona(true)} className="btn-secondary w-full text-xs">
                <span className="material-symbols-outlined text-base">add</span>
                Tạo persona
              </button>
            </div>
          </div>

          <div className="card grid shrink-0 grid-cols-2 gap-2 p-4 sm:grid-cols-4 lg:grid-cols-2">
            {[
              { label: 'Phút câu giờ', value: stats.timeWastedMins, color: 'text-accent' },
              { label: 'Lần giải thích', value: stats.explanationsForced, color: 'text-primary' },
              { label: 'Frustration', value: `${stats.frustrationLevel}/10`, color: 'text-danger' },
              { label: 'Kiên nhẫn', value: `${stats.patienceLevel}%`, color: 'text-amber' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-surface p-3 text-center">
                <p className={`font-display text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-on-surface-variant">{s.label}</p>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat — fixed frame, messages scroll inside */}
        <section className="card flex h-[min(70vh,640px)] min-h-[420px] flex-col overflow-hidden lg:col-span-9">
          <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] px-4 py-3 light:border-[var(--hairline)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-soft text-xl">
              {current.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">Bot · {current.name}</p>
              <p className="text-[11px] text-on-surface-variant">Đang giả vờ nghe lời scammer</p>
            </div>
            <span className="badge-violet shrink-0 hidden sm:inline-flex">
              {chatMessages.length} tin
            </span>
          </div>

          <div ref={chatBoxRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
            {chatMessages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'scammer' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[75%] ${m.sender === 'bot' ? 'chat-bubble-ai' : 'chat-bubble-scammer'}`}>
                  <p className="mb-1 text-[10px] font-semibold uppercase opacity-60">
                    {m.sender === 'scammer' ? 'Scammer' : 'AI Bot'} · {m.timestamp}
                  </p>
                  <p className="break-words leading-relaxed">{m.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="chat-bubble-ai">
                  <span className="typing-indicator">
                    <span /><span /><span />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-white/[0.06] bg-surface/40 p-3 sm:p-4 light:border-[var(--hairline)]">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {PRESET_SCAMMER.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSend(p)}
                  className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-on-surface-variant hover:border-accent/30 hover:text-on-surface light:border-[var(--hairline)]"
                >
                  {p.slice(0, 36)}…
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                className="input-field flex-1"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Dán tin nhắn scammer tại đây…"
                disabled={isLoading}
              />
              <button type="submit" className="btn-primary shrink-0 !px-4" disabled={isLoading}>
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
          </div>
        </section>
      </div>

      {showNewPersona && (
        <div className="modal-overlay" onClick={() => setShowNewPersona(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 font-display text-lg font-bold">Tạo persona</h3>
            <form onSubmit={handleCreatePersona} className="space-y-3">
              <input className="input-field" placeholder="Tên" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              <div className="grid grid-cols-2 gap-2">
                <input className="input-field" placeholder="Tuổi" value={newAge} onChange={(e) => setNewAge(e.target.value)} />
                <input className="input-field" placeholder="Emoji" value={newAvatar} onChange={(e) => setNewAvatar(e.target.value)} />
              </div>
              <textarea className="input-field min-h-[72px]" placeholder="Mô tả" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setShowNewPersona(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Tạo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
