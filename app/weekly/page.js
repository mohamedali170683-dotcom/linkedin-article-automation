'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sun, Calendar, Loader2, Copy, Check, RefreshCw, FileText,
  ArrowLeft, Send, Mail, Sparkles, Eye, Edit3, Save,
  ChevronDown, Video, BarChart3, MessageSquare, Zap, X,
  ImagePlus, Trash2, Pencil, Bot, User
} from 'lucide-react';
import Link from 'next/link';
import catchlightCalendar from '../lib/catchlight-calendar.json';

// ============ CONSTANTS ============

const STATUSES = {
  NOT_STARTED: 'not_started',
  GENERATED: 'generated',
  EDITED: 'edited',
  SENT_TO_KIT: 'sent_to_kit',
  COPIED: 'copied',
};

const IMAGE_POSITIONS = [
  { value: 'header', label: 'Header Image' },
  { value: 'after-hook', label: 'After The Hook' },
  { value: 'after-research', label: 'After The Research' },
  { value: 'after-framework', label: 'After The Framework' },
  { value: 'after-bridge', label: 'After The Bridge' },
  { value: 'after-implication', label: 'After The Implication' },
];

// ============ HELPER COMPONENTS ============

function StatusBadge({ status }) {
  const config = {
    [STATUSES.NOT_STARTED]: { label: 'Not Started', bg: 'bg-slate-700', text: 'text-slate-400' },
    [STATUSES.GENERATED]: { label: 'Generated', bg: 'bg-amber-500/20', text: 'text-amber-400' },
    [STATUSES.EDITED]: { label: 'Edited', bg: 'bg-blue-500/20', text: 'text-blue-400' },
    [STATUSES.SENT_TO_KIT]: { label: 'Sent to Kit', bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    [STATUSES.COPIED]: { label: 'Copied', bg: 'bg-blue-500/20', text: 'text-blue-400' },
  };
  const c = config[status] || config[STATUSES.NOT_STARTED];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function CopyButton({ text, label = 'Copy for Taplio', small }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      disabled={!text}
      className={`flex items-center gap-1.5 font-medium rounded-lg transition-all disabled:opacity-30 ${
        small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'
      } ${copied ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-900 hover:bg-amber-400'}`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

function wordCount(text) {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function charCount(text) {
  if (!text) return 0;
  return text.length;
}

// ============ IMAGE UPLOAD COMPONENT ============

function ImageUploadPanel({ images = [], weekNumber, onImagesChange }) {
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const fileInputRefs = [useRef(null), useRef(null), useRef(null)];

  const getImageForSlot = (slot) => images.find(img => img.slot === slot);

  const handleUpload = async (file, slot) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPEG, PNG, WebP, and GIF images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB.');
      return;
    }

    setUploadingSlot(slot);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('weekNumber', weekNumber.toString());
      formData.append('slot', slot.toString());

      const res = await fetch('/api/weekly/image', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const newImage = {
        ...data.image,
        position: 'header',
        caption: '',
      };

      const updated = [...images.filter(img => img.slot !== slot), newImage];
      onImagesChange(updated);
    } catch (e) {
      alert('Upload failed: ' + e.message);
    }
    setUploadingSlot(null);
  };

  const handleRemove = async (slot) => {
    try {
      await fetch('/api/weekly/image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekNumber, slot }),
      });
      onImagesChange(images.filter(img => img.slot !== slot));
    } catch (e) {
      console.error('Remove failed:', e);
    }
  };

  const handlePositionChange = (slot, position) => {
    const updated = images.map(img =>
      img.slot === slot ? { ...img, position } : img
    );
    onImagesChange(updated);
  };

  const handleCaptionChange = (slot, caption) => {
    const updated = images.map(img =>
      img.slot === slot ? { ...img, caption } : img
    );
    onImagesChange(updated);
  };

  return (
    <div className="border border-slate-700/50 rounded-lg p-4 bg-slate-900/30">
      <h4 className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-2">
        <ImagePlus className="w-3.5 h-3.5 text-amber-400" />
        Article Images ({images.length}/3)
      </h4>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(slot => {
          const img = getImageForSlot(slot);
          const isUploading = uploadingSlot === slot;

          return (
            <div key={slot} className="space-y-2">
              {img ? (
                <div className="relative group">
                  <img
                    src={img.url}
                    alt={img.caption || `Image ${slot + 1}`}
                    className="w-full h-20 object-cover rounded-lg border border-slate-600"
                  />
                  <button
                    onClick={() => handleRemove(slot)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                  <p className="text-[10px] text-slate-500 truncate mt-1">{img.originalName}</p>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRefs[slot].current?.click()}
                  disabled={isUploading}
                  className="w-full h-20 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-amber-500/50 hover:bg-slate-800/50 transition-all disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="w-4 h-4 text-slate-500" />
                      <span className="text-[10px] text-slate-500">Upload</span>
                    </>
                  )}
                </button>
              )}

              <input
                ref={fileInputRefs[slot]}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleUpload(e.target.files[0], slot);
                  e.target.value = '';
                }}
              />

              {img && (
                <>
                  <select
                    value={img.position}
                    onChange={(e) => handlePositionChange(slot, e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded text-[10px] text-slate-300 px-1.5 py-1"
                  >
                    {IMAGE_POSITIONS.map(pos => (
                      <option key={pos.value} value={pos.value}>{pos.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={img.caption}
                    onChange={(e) => handleCaptionChange(slot, e.target.value)}
                    placeholder="Caption (optional)"
                    className="w-full bg-slate-800 border border-slate-600 rounded text-[10px] text-slate-300 px-1.5 py-1 placeholder:text-slate-600"
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ CHAT SIDEBAR COMPONENT ============

function ChatSidebar({ weekNumber, articleContent, onApplyEdit, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const SEPARATOR = '---REVISED_ARTICLE---';

  const parseResponse = (text) => {
    const sepIdx = text.indexOf(SEPARATOR);
    if (sepIdx === -1) {
      return { explanation: text.trim(), revisedArticle: null };
    }
    return {
      explanation: text.substring(0, sepIdx).trim(),
      revisedArticle: text.substring(sepIdx + SEPARATOR.length).trim(),
    };
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMsg = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsStreaming(true);
    setStreamingText('');

    try {
      const res = await fetch('/api/weekly/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekNumber,
          articleContent,
          instruction: trimmed,
          chatHistory: updatedMessages.slice(-10).map(m => ({
            role: m.role,
            content: m.revisedArticle ? `${m.content}\n\n[Applied edit to article]` : m.content,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Request failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setStreamingText(fullText);
      }

      const { explanation, revisedArticle } = parseResponse(fullText);
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: explanation,
        revisedArticle,
      }]);
    } catch (e) {
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: `Error: ${e.message}. Please try again.`,
        revisedArticle: null,
      }]);
    }

    setIsStreaming(false);
    setStreamingText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleApply = (revisedArticle) => {
    onApplyEdit(revisedArticle);
    // Mark in message that it was applied
    setMessages(prev => prev.map(m =>
      m.revisedArticle === revisedArticle ? { ...m, applied: true } : m
    ));
  };

  return (
    <aside className="w-96 border-l border-slate-700 bg-slate-900 flex flex-col h-[calc(100vh-73px)] sticky top-[73px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
        <span className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />Edit with Opus
        </span>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Intro tip */}
      {messages.length === 0 && (
        <div className="px-4 py-3 bg-amber-500/5 border-b border-amber-500/10">
          <p className="text-xs text-amber-400/80">
            Tell Opus how to improve the article. It uses your knowledge library (54 research insights) for context.
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {['Sharpen the hook', 'Add more research', 'Tighten language', 'Strengthen the CTA'].map(s => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="px-2 py-0.5 text-[10px] bg-slate-800 border border-slate-700 rounded text-slate-400 hover:text-amber-400 hover:border-amber-500/30"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
              msg.role === 'user'
                ? 'bg-amber-500/20 text-amber-100'
                : 'bg-slate-800 text-slate-200 border border-slate-700'
            }`}>
              <div className="flex items-center gap-1.5 mb-1">
                {msg.role === 'user'
                  ? <User className="w-3 h-3 text-amber-400" />
                  : <Bot className="w-3 h-3 text-slate-400" />
                }
                <span className="text-[10px] text-slate-500 font-medium">
                  {msg.role === 'user' ? 'You' : 'Claude Opus'}
                </span>
              </div>
              <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              {msg.revisedArticle && !msg.applied && (
                <div className="mt-2 pt-2 border-t border-slate-600/50 flex gap-2">
                  <button
                    onClick={() => handleApply(msg.revisedArticle)}
                    className="px-2.5 py-1 bg-amber-500 text-slate-900 rounded text-[10px] font-semibold hover:bg-amber-400 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />Apply Edit
                  </button>
                  <span className="text-[10px] text-slate-500 self-center">
                    {wordCount(msg.revisedArticle)} words
                  </span>
                </div>
              )}
              {msg.applied && (
                <div className="mt-2 pt-2 border-t border-slate-600/50">
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" />Applied
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-xl px-3 py-2 bg-slate-800 text-slate-200 border border-slate-700">
              <div className="flex items-center gap-1.5 mb-1">
                <Bot className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] text-slate-500 font-medium">Claude Opus</span>
                <Loader2 className="w-2.5 h-2.5 text-amber-400 animate-spin" />
              </div>
              <p className="text-xs leading-relaxed whitespace-pre-wrap">
                {streamingText ? streamingText.split(SEPARATOR)[0] : 'Thinking...'}
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-700 flex-shrink-0">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="e.g. Make the hook more provocative..."
            rows={2}
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 resize-none disabled:opacity-50 focus:border-amber-500/50 focus:outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={isStreaming || !input.trim()}
            className="px-3 bg-amber-500 text-slate-900 rounded-lg font-medium text-xs hover:bg-amber-400 disabled:opacity-30 self-end py-2"
          >
            {isStreaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </aside>
  );
}

// ============ MAIN COMPONENT ============

export default function WeeklyEngine() {
  // Week & data state
  const [weekNumber, setWeekNumber] = useState(null);
  const [lightData, setLightData] = useState(null);
  const [weekState, setWeekState] = useState(null);
  const [isLoadingState, setIsLoadingState] = useState(false);

  // Generation loading states
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
  const [isGeneratingPromo, setIsGeneratingPromo] = useState(false);
  const [isGeneratingPills, setIsGeneratingPills] = useState(false);
  const [generatingPillIndex, setGeneratingPillIndex] = useState(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  // Publishing
  const [isPublishingKit, setIsPublishingKit] = useState(false);
  const [publishStatus, setPublishStatus] = useState(null);

  // Editing
  const [isEditingArticle, setIsEditingArticle] = useState(false);
  const [editedArticleContent, setEditedArticleContent] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Preview
  const [expandedCard, setExpandedCard] = useState(null);

  // ============ DATA LOADING ============

  const loadWeekState = useCallback(async (week) => {
    setIsLoadingState(true);
    setPublishStatus(null);
    try {
      const res = await fetch(`/api/weekly/data?week=${week}`);
      const data = await res.json();
      if (data.exists) {
        setWeekState(data.data);
        setEditedArticleContent(data.data.article?.content || '');
      } else {
        setWeekState(null);
        setEditedArticleContent('');
      }
    } catch (e) {
      console.error('Failed to load week state:', e);
      setWeekState(null);
    }
    setIsLoadingState(false);
  }, []);

  const selectWeek = (week) => {
    const num = parseInt(week, 10);
    if (!num) return;
    setWeekNumber(num);
    const light = catchlightCalendar.weeks.find(w => w.week === num);
    setLightData(light || null);
    setExpandedCard(null);
    setIsEditingArticle(false);
    setIsChatOpen(false);
    loadWeekState(num);
  };

  const saveWeekState = async (partialUpdate) => {
    if (!weekNumber) return;
    try {
      await fetch('/api/weekly/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekNumber, lightTitle: lightData?.light || '', ...partialUpdate }),
      });
    } catch (e) {
      console.error('Failed to save week state:', e);
    }
  };

  // ============ GENERATION ============

  const generateArticle = async () => {
    setIsGeneratingArticle(true);
    try {
      const res = await fetch('/api/weekly/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.article) {
        const updatedArticle = { ...data.article, images: weekState?.article?.images || [] };
        const updated = { ...weekState, article: updatedArticle, weekNumber, lightTitle: lightData?.light };
        setWeekState(updated);
        setEditedArticleContent(data.article.content);
        await saveWeekState({ article: updatedArticle });
      }
    } catch (e) {
      alert('Article generation failed: ' + e.message);
    }
    setIsGeneratingArticle(false);
  };

  const generatePromo = async () => {
    const article = weekState?.article;
    if (!article?.content) return;
    setIsGeneratingPromo(true);
    try {
      const res = await fetch('/api/weekly/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekNumber,
          articleTitle: article.title,
          articleContent: article.content,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.promoPost) {
        const updated = { ...weekState, promoPost: data.promoPost };
        setWeekState(updated);
        await saveWeekState({ promoPost: data.promoPost });
      }
    } catch (e) {
      alert('Promo generation failed: ' + e.message);
    }
    setIsGeneratingPromo(false);
  };

  const generatePills = async () => {
    const article = weekState?.article;
    if (!article?.content) return;
    setIsGeneratingPills(true);
    try {
      const res = await fetch('/api/weekly/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekNumber,
          articleTitle: article.title,
          articleContent: article.content,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.pills) {
        const updated = { ...weekState, pills: data.pills };
        setWeekState(updated);
        await saveWeekState({ pills: data.pills });
      }
    } catch (e) {
      alert('Pill extraction failed: ' + e.message);
    }
    setIsGeneratingPills(false);
  };

  const generateSinglePill = async (pillIndex) => {
    const article = weekState?.article;
    if (!article?.content) return;
    setGeneratingPillIndex(pillIndex);
    try {
      const res = await fetch('/api/weekly/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekNumber,
          articleTitle: article.title,
          articleContent: article.content,
          pillIndex,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.pill) {
        const updatedPills = [...(weekState.pills || [null, null, null])];
        updatedPills[pillIndex] = data.pill;
        const updated = { ...weekState, pills: updatedPills };
        setWeekState(updated);
        await saveWeekState({ pills: updatedPills });
      }
    } catch (e) {
      alert('Pill generation failed: ' + e.message);
    }
    setGeneratingPillIndex(null);
  };

  const generateAllContent = async () => {
    setIsGeneratingAll(true);
    await generatePromo();
    await generatePills();
    setIsGeneratingAll(false);
  };

  // ============ PUBLISHING ============

  const publishToKit = async () => {
    const article = weekState?.article;
    if (!article?.content) return;
    setIsPublishingKit(true);
    setPublishStatus(null);
    try {
      const res = await fetch('/api/publish/kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          subtitle: article.subtitle || '',
          content: editedArticleContent || article.content,
          charts: [],
          images: article.images || [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const updatedArticle = { ...article, status: STATUSES.SENT_TO_KIT };
      const updated = { ...weekState, article: updatedArticle };
      setWeekState(updated);
      await saveWeekState({ article: updatedArticle });
      setPublishStatus({ success: true, url: data.dashboardUrl });
    } catch (e) {
      setPublishStatus({ success: false, error: e.message });
    }
    setIsPublishingKit(false);
  };

  const saveArticleEdit = async () => {
    const updatedArticle = { ...weekState.article, content: editedArticleContent, status: STATUSES.EDITED };
    const updated = { ...weekState, article: updatedArticle };
    setWeekState(updated);
    await saveWeekState({ article: updatedArticle });
    setIsEditingArticle(false);
  };

  // ============ IMAGE HANDLING ============

  const handleImagesChange = async (newImages) => {
    const updatedArticle = { ...weekState.article, images: newImages };
    const updated = { ...weekState, article: updatedArticle };
    setWeekState(updated);
    await saveWeekState({ article: updatedArticle });
  };

  // ============ CHAT SIDEBAR ============

  const handleApplyEdit = async (revisedArticle) => {
    setEditedArticleContent(revisedArticle);
    const updatedArticle = { ...weekState.article, content: revisedArticle, status: STATUSES.EDITED };
    const updated = { ...weekState, article: updatedArticle };
    setWeekState(updated);
    await saveWeekState({ article: updatedArticle });
  };

  // ============ DERIVED ============

  const hasArticle = !!weekState?.article?.content;
  const hasPromo = !!weekState?.promoPost?.content;
  const hasPills = weekState?.pills?.length === 3 && weekState.pills.every(p => p?.postContent);
  const article = weekState?.article;
  const promo = weekState?.promoPost;
  const pills = weekState?.pills || [];

  // ============ RENDER ============

  return (
    <div className="min-h-screen bg-slate-950 font-[var(--font-dm-sans)]">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur border-b border-slate-700 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-400" />Catchlight Weekly Engine
              </h1>
              <p className="text-sm text-slate-400">
                {lightData ? `Light #${weekNumber}: ${lightData.light}` : 'Select a week to start'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex justify-center">
        {/* Main content */}
        <div className={`p-6 space-y-6 transition-all duration-300 ${isChatOpen ? 'max-w-2xl flex-1' : 'max-w-4xl w-full'}`}>

          {/* ========== WEEK SELECTOR ========== */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />Select Week
            </h3>
            <select
              value={weekNumber || ''}
              onChange={(e) => selectWeek(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-200 text-sm"
            >
              <option value="">Choose a Light (1-52)...</option>
              {catchlightCalendar.weeks.map(w => (
                <option key={w.week} value={w.week}>Light #{w.week}: {w.light}</option>
              ))}
            </select>

            {lightData && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3">
                  <span className="text-xs text-amber-400 font-medium">Hook</span>
                  <p className="text-sm text-slate-200 mt-1">{lightData.hook}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3">
                  <span className="text-xs text-blue-400 font-medium">AI Visibility</span>
                  <p className="text-sm text-slate-300 mt-1">{lightData.aiVisibility}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3">
                  <span className="text-xs text-purple-400 font-medium">Attention Science</span>
                  <p className="text-sm text-slate-300 mt-1">{lightData.attentionScience}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3">
                  <span className="text-xs text-slate-500 font-medium">Sources</span>
                  <p className="text-sm text-slate-400 mt-1">{lightData.sources?.join(', ')}</p>
                </div>
              </div>
            )}
          </div>

          {isLoadingState && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            </div>
          )}

          {weekNumber && !isLoadingState && (
            <>
              {/* ========== CARD 1: SUNDAY ARTICLE ========== */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Sunday: Newsletter Article</h3>
                      <p className="text-xs text-slate-500">2500-3500 word research deep dive</p>
                    </div>
                  </div>
                  <StatusBadge status={article?.status || STATUSES.NOT_STARTED} />
                </div>

                {!hasArticle ? (
                  <button
                    onClick={generateArticle}
                    disabled={isGeneratingArticle}
                    className="w-full px-5 py-3 bg-amber-500 text-slate-900 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-amber-400 disabled:opacity-50 text-sm"
                  >
                    {isGeneratingArticle ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Generating article (this takes ~60s)...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" />Generate Article</>
                    )}
                  </button>
                ) : (
                  <div className="space-y-4">
                    {/* Article header */}
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
                      <h4 className="text-base font-semibold text-white">{article.title}</h4>
                      {article.subtitle && <p className="text-sm text-slate-400 mt-1">{article.subtitle}</p>}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-slate-500">{wordCount(editedArticleContent || article.content)} words</span>
                        {article.researchers?.length > 0 && (
                          <span className="text-xs text-slate-500">Sources: {article.researchers.join(', ')}</span>
                        )}
                      </div>
                    </div>

                    {/* Article content preview */}
                    {isEditingArticle ? (
                      <div>
                        <textarea
                          value={editedArticleContent}
                          onChange={e => setEditedArticleContent(e.target.value)}
                          rows={20}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 text-sm leading-relaxed font-[var(--font-dm-sans)]"
                        />
                        <div className="flex gap-2 mt-2">
                          <button onClick={saveArticleEdit} className="px-3 py-1.5 bg-amber-500 text-slate-900 rounded-lg text-xs font-medium flex items-center gap-1">
                            <Save className="w-3 h-3" />Save
                          </button>
                          <button onClick={() => { setIsEditingArticle(false); setEditedArticleContent(article.content); }} className="px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg text-xs">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="bg-slate-900 rounded-lg p-4 border border-slate-700 max-h-96 overflow-y-auto cursor-pointer"
                        onClick={() => setExpandedCard(expandedCard === 'article' ? null : 'article')}
                      >
                        <pre className="text-sm text-slate-200 whitespace-pre-wrap font-[var(--font-dm-sans)] leading-relaxed">
                          {expandedCard === 'article'
                            ? (editedArticleContent || article.content)
                            : (editedArticleContent || article.content).substring(0, 800) + '...'}
                        </pre>
                      </div>
                    )}

                    {/* Image upload */}
                    <ImageUploadPanel
                      images={article.images || []}
                      weekNumber={weekNumber}
                      onImagesChange={handleImagesChange}
                    />

                    {/* Article actions */}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => { setIsChatOpen(true); }}
                        className="px-3 py-1.5 bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-slate-600 border border-slate-600">
                        <Sparkles className="w-3 h-3 text-amber-400" />Edit with Opus
                      </button>
                      <button onClick={() => { setIsEditingArticle(true); setEditedArticleContent(editedArticleContent || article.content); }}
                        className="px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg text-xs flex items-center gap-1 hover:bg-slate-700">
                        <Pencil className="w-3 h-3" />Quick Edit
                      </button>
                      <button onClick={publishToKit} disabled={isPublishingKit}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-emerald-500 disabled:opacity-50">
                        {isPublishingKit ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                        {isPublishingKit ? 'Sending...' : 'Send to Kit'}
                      </button>
                      <CopyButton text={editedArticleContent || article.content} label="Copy Article" small />
                      <button onClick={generateArticle} disabled={isGeneratingArticle}
                        className="px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg text-xs flex items-center gap-1 hover:bg-slate-700 disabled:opacity-50">
                        {isGeneratingArticle ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Regenerate
                      </button>
                    </div>

                    {publishStatus && (
                      <div className={`p-3 rounded-lg border ${publishStatus.success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                        {publishStatus.success ? (
                          <p className="text-sm text-emerald-400">Sent to Kit as draft. <a href={publishStatus.url} target="_blank" rel="noopener noreferrer" className="underline">Open Kit dashboard</a></p>
                        ) : (
                          <p className="text-sm text-red-400">Failed: {publishStatus.error}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ========== BATCH GENERATE ========== */}
              {hasArticle && (!hasPromo || !hasPills) && (
                <button
                  onClick={generateAllContent}
                  disabled={isGeneratingAll || isGeneratingPromo || isGeneratingPills}
                  className="w-full px-5 py-3 bg-slate-800 border border-amber-500/30 text-amber-400 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-700 disabled:opacity-50 text-sm"
                >
                  {isGeneratingAll ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Generating promo + 3 pills (this takes ~90s)...</>
                  ) : (
                    <><Zap className="w-4 h-4" />Generate All Remaining Content</>
                  )}
                </button>
              )}

              {/* ========== CARD 2: SUNDAY PROMO ========== */}
              <div className={`bg-slate-800 border rounded-xl p-5 ${hasArticle ? 'border-slate-700' : 'border-slate-800 opacity-40'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Send className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Sunday: LinkedIn Promo Post</h3>
                      <p className="text-xs text-slate-500">Tease the article, drive subscribers</p>
                    </div>
                  </div>
                  <StatusBadge status={promo?.status || STATUSES.NOT_STARTED} />
                </div>

                {!hasArticle ? (
                  <p className="text-xs text-slate-500">Generate the article first</p>
                ) : !hasPromo ? (
                  <button
                    onClick={generatePromo}
                    disabled={isGeneratingPromo}
                    className="w-full px-4 py-2.5 bg-amber-500 text-slate-900 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-amber-400 disabled:opacity-50 text-sm"
                  >
                    {isGeneratingPromo ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4" />Generate Promo Post</>}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                      <pre className="text-sm text-slate-200 whitespace-pre-wrap font-[var(--font-dm-sans)] leading-relaxed">{promo.content}</pre>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{charCount(promo.content)} characters</span>
                      <div className="flex gap-2">
                        <button onClick={generatePromo} disabled={isGeneratingPromo}
                          className="px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg text-xs flex items-center gap-1 hover:bg-slate-700 disabled:opacity-50">
                          <RefreshCw className="w-3 h-3" />Regenerate
                        </button>
                        <CopyButton text={promo.content} small />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ========== CARDS 3-5: INSIGHT PILLS ========== */}
              {[
                { idx: 0, day: 'Tuesday', format: 'Infographic', icon: BarChart3, color: 'text-green-400', bgColor: 'bg-green-500/20', desc: 'Data-driven post with infographic companion' },
                { idx: 1, day: 'Wednesday', format: 'Video', icon: Video, color: 'text-purple-400', bgColor: 'bg-purple-500/20', desc: 'Video script + LinkedIn post' },
                { idx: 2, day: 'Thursday', format: 'Text', icon: MessageSquare, color: 'text-orange-400', bgColor: 'bg-orange-500/20', desc: 'Narrative storytelling post' },
              ].map(({ idx, day, format, icon: Icon, color, bgColor, desc }) => {
                const pill = pills[idx];
                const isPillGenerated = !!pill?.postContent;
                const isThisPillGenerating = generatingPillIndex === idx;

                return (
                  <div key={day} className={`bg-slate-800 border rounded-xl p-5 ${hasArticle ? 'border-slate-700' : 'border-slate-800 opacity-40'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${bgColor} rounded-lg flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white">{day}: {format} Pill</h3>
                          <p className="text-xs text-slate-500">{desc}</p>
                        </div>
                      </div>
                      <StatusBadge status={pill?.status || STATUSES.NOT_STARTED} />
                    </div>

                    {!hasArticle ? (
                      <p className="text-xs text-slate-500">Generate the article first</p>
                    ) : !isPillGenerated ? (
                      <button
                        onClick={() => generateSinglePill(idx)}
                        disabled={isThisPillGenerating || isGeneratingPills}
                        className="w-full px-4 py-2.5 bg-amber-500 text-slate-900 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-amber-400 disabled:opacity-50 text-sm"
                      >
                        {(isThisPillGenerating || isGeneratingPills) ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4" />Generate {day} Pill</>}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                          <pre className="text-sm text-slate-200 whitespace-pre-wrap font-[var(--font-dm-sans)] leading-relaxed">{pill.postContent}</pre>
                        </div>

                        {pill.infographicBrief && (
                          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                            <span className="text-xs text-green-400 font-medium block mb-1">Infographic Brief</span>
                            <p className="text-xs text-slate-300">{pill.infographicBrief}</p>
                            {pill.dataPoints?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {pill.dataPoints.map((dp, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-xs">{dp}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {pill.videoScript && (
                          <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-purple-400 font-medium">Video Script</span>
                              {pill.duration && <span className="text-xs text-purple-400/60">{pill.duration}s</span>}
                            </div>
                            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-[var(--font-dm-sans)]">{pill.videoScript}</pre>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{charCount(pill.postContent)} characters</span>
                          <div className="flex gap-2">
                            <button onClick={() => generateSinglePill(idx)} disabled={isThisPillGenerating}
                              className="px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg text-xs flex items-center gap-1 hover:bg-slate-700 disabled:opacity-50">
                              <RefreshCw className="w-3 h-3" />Regenerate
                            </button>
                            <CopyButton text={pill.postContent} small />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ========== PIPELINE SUMMARY ========== */}
              {hasArticle && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                  <h4 className="text-xs font-medium text-slate-500 mb-3">Weekly Pipeline Status</h4>
                  <div className="space-y-2">
                    {[
                      { label: 'Sunday Article', done: hasArticle, status: article?.status },
                      { label: 'Sunday Promo', done: hasPromo, status: promo?.status },
                      { label: 'Tuesday Pill', done: !!pills[0]?.postContent, status: pills[0]?.status },
                      { label: 'Wednesday Pill', done: !!pills[1]?.postContent, status: pills[1]?.status },
                      { label: 'Thursday Pill', done: !!pills[2]?.postContent, status: pills[2]?.status },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.done ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                        <span className={`text-xs flex-1 ${item.done ? 'text-slate-300' : 'text-slate-600'}`}>{item.label}</span>
                        {item.done && <StatusBadge status={item.status} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!weekNumber && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
              <Sun className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Select a week to start your content pipeline</p>
              <p className="text-sm text-slate-500 mt-1">Each week generates 1 article + 4 LinkedIn posts</p>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        {isChatOpen && hasArticle && (
          <ChatSidebar
            weekNumber={weekNumber}
            articleContent={editedArticleContent || article.content}
            onApplyEdit={handleApplyEdit}
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
