'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Loader2, Copy, Check, RefreshCw,
  ArrowLeft, ExternalLink, ChevronDown, ChevronUp,
} from 'lucide-react';
import Link from 'next/link';

// ============ HELPERS ============

function getCurrentISOWeek() {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + 1;
  const weekNum = Math.ceil((dayOfYear + jan4.getDay() - 1) / 7);
  return { year: now.getFullYear(), weekNum, label: `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}` };
}

const TOPICS = [
  'AI Visibility / GEO',
  'Search Marketing / SEO',
  'Marketing Leadership',
];

const STEP_LABELS = [
  'Scraping LinkedIn posts...',
  'Scoring relevance with Claude...',
  'Saving results...',
];

const STATUS_OPTIONS = ['Pending', 'Commented', 'Skipped'];

// ============ COMPONENTS ============

function TopicChip({ label, active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        active
          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
          : 'bg-slate-800 text-slate-500 border border-slate-700 hover:border-slate-600'
      }`}
    >
      {label}
    </button>
  );
}

function ScoreBadge({ score }) {
  const bg = score >= 8 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${bg}`}>
      {score}/10
    </span>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <button
      onClick={handleCopy}
      className="px-2.5 py-1 border border-slate-600 text-slate-300 rounded text-xs flex items-center gap-1 hover:bg-slate-700"
    >
      {copied ? <><Check className="w-3 h-3 text-emerald-400" />Copied ✓</> : <><Copy className="w-3 h-3" />Copy</>}
    </button>
  );
}

function CommentBlock({ type, label, text }) {
  if (!text) return null;
  return (
    <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium block mb-1.5">{label}</span>
      <p className="text-sm text-slate-200 leading-relaxed mb-2">{text}</p>
      <CopyButton text={text} />
    </div>
  );
}

function PostCard({ post, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      {/* Header — always visible */}
      <div
        className="p-4 cursor-pointer hover:bg-slate-750"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <ScoreBadge score={post.score} />
            <span className="text-sm font-semibold text-white">{post.author}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={post.status || 'Pending'}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onStatusChange(post.url, e.target.value)}
              className="bg-slate-900 border border-slate-600 text-slate-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-amber-500"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-2">{post.reason}</p>
        <p className="text-xs text-slate-500 italic leading-relaxed">{post.preview?.substring(0, 180)}...</p>

        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-amber-400 mt-2 hover:text-amber-300"
          >
            <ExternalLink className="w-3 h-3" /> view post
          </a>
        )}
      </div>

      {/* Expandable — comment options */}
      {expanded && post.comments && (
        <div className="px-4 pb-4 space-y-2 border-t border-slate-700 pt-3">
          <CommentBlock type="insight" label="Data / Insight" text={post.comments.insight} />
          <CommentBlock type="pov" label="POV / Experience" text={post.comments.pov} />
          <CommentBlock type="question" label="Challenge / Question" text={post.comments.question} />
        </div>
      )}
    </div>
  );
}

// ============ MAIN COMPONENT ============

export default function EngagementPage() {
  const [currentWeek] = useState(() => getCurrentISOWeek());
  const [selectedTopics, setSelectedTopics] = useState([...TOPICS]);
  const [posts, setPosts] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runStep, setRunStep] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved data on mount
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/engagement/data?week=${currentWeek.label}`);
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (e) {
      console.error('Failed to load engagement data:', e);
    }
    setIsLoading(false);
  }, [currentWeek.label]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleTopic = (topic) => {
    setSelectedTopics(prev => {
      if (prev.includes(topic) && prev.length === 1) return prev; // At least one
      return prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic];
    });
  };

  const runRadar = async () => {
    setIsRunning(true);
    setError(null);
    setRunStep(0);

    try {
      // Step 1: Scraping
      setRunStep(0);

      const res = await fetch('/api/engagement/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics: selectedTopics, week: currentWeek.label }),
      });

      // Step 2: Scoring (we show this once request is in flight)
      setRunStep(1);

      const data = await res.json();

      if (data.error === 'scrape_failed') {
        setError('scrape_failed');
        setIsRunning(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Run failed');
      }

      // Step 3: Saving
      setRunStep(2);
      setPosts(data.posts || []);
    } catch (e) {
      setError(e.message);
    }

    setIsRunning(false);
  };

  const updatePostStatus = async (postUrl, newStatus) => {
    const updatedPosts = posts.map(p =>
      p.url === postUrl ? { ...p, status: newStatus } : p
    );
    setPosts(updatedPosts);

    try {
      await fetch('/api/engagement/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week: currentWeek.label, posts: updatedPosts }),
      });
    } catch (e) {
      console.error('Failed to save status:', e);
    }
  };

  const sortedPosts = posts ? [...posts].sort((a, b) => b.score - a.score) : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-slate-500 hover:text-slate-300">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Comments Engagement</h1>
                <p className="text-xs text-slate-400">Weekly LinkedIn post radar — find relevant voices, draft comments, build visibility</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-slate-300">Week {currentWeek.weekNum}</span>
            <span className="text-xs text-slate-500 block">{currentWeek.year}</span>
          </div>
        </div>

        {/* Topic Toggles */}
        <div className="flex flex-wrap gap-2 mb-4">
          {TOPICS.map(topic => (
            <TopicChip
              key={topic}
              label={topic}
              active={selectedTopics.includes(topic)}
              onToggle={() => toggleTopic(topic)}
            />
          ))}
        </div>

        {/* Run Button */}
        <button
          onClick={runRadar}
          disabled={isRunning}
          className="w-full px-4 py-3 bg-amber-500 text-slate-900 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed mb-6 text-sm"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {STEP_LABELS[runStep] || 'Processing...'}
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Run This Week&apos;s Radar
            </>
          )}
        </button>

        {/* Error State */}
        {error === 'scrape_failed' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-red-400">
              LinkedIn scraping failed. Check your Apify key in Vercel environment variables, or try again in a few minutes.
            </p>
          </div>
        )}

        {error && error !== 'scrape_failed' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !posts && !error && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
            <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              No posts yet for this week. Hit <span className="text-amber-400 font-medium">Run This Week&apos;s Radar</span> to fetch and score the latest LinkedIn posts.
            </p>
          </div>
        )}

        {/* Results */}
        {!isLoading && posts && posts.length === 0 && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
            <p className="text-sm text-slate-400">
              No posts scored 6 or above this week. Try adjusting your topics or running again later.
            </p>
          </div>
        )}

        {!isLoading && sortedPosts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">{sortedPosts.length} relevant post{sortedPosts.length !== 1 ? 's' : ''} found</span>
              <span className="text-xs text-slate-500">
                {sortedPosts.filter(p => p.status === 'Commented').length} commented
              </span>
            </div>
            {sortedPosts.map((post) => (
              <PostCard
                key={post.url}
                post={post}
                onStatusChange={updatePostStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
