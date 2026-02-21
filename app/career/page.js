'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Loader2, Copy, Check, RefreshCw, Plus, Trash2,
  ChevronDown, ChevronUp, ExternalLink, BarChart3, FileText,
  Target, Briefcase, TrendingUp, Users, Mic, Globe, ArrowLeft,
  Sun, CheckCircle, X, Edit3, Save, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { PILLARS, FIT_CRITERIA, WEEK_POSTS, STATUS_OPTIONS, MOHAMED_CONTEXT } from '../lib/career-data';

const CAMPAIGN_START = new Date('2026-02-21');

function getCurrentWeek() {
  const elapsed = Date.now() - CAMPAIGN_START.getTime();
  const week = Math.ceil(elapsed / (7 * 86400000)) + 1;
  return Math.max(1, Math.min(12, week));
}

function PillarTag({ pillarId, small }) {
  const p = PILLARS.find(x => x.id === pillarId);
  if (!p) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${small ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}
      style={{ backgroundColor: p.color + '20', color: p.color, border: `1px solid ${p.color}40` }}
    >
      {p.icon} {p.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const opt = STATUS_OPTIONS.find(s => s.value === status);
  const color = opt?.color || '#64748b';
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: color + '20', color, border: `1px solid ${color}40` }}
    >
      {status}
    </span>
  );
}

function MetricCard({ label, value, target, onUpdate }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400 font-medium">{label}</span>
        <span className="text-xs text-slate-500">{pct}%</span>
      </div>
      <div className="text-2xl font-bold text-white font-mono mb-2">{value}</div>
      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444' }}
        />
      </div>
      <div className="text-xs text-slate-500 mt-1">Target: {target}</div>
    </div>
  );
}

export default function CareerCommandCenter() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const currentWeek = getCurrentWeek();

  // Persisted state
  const [apps, setApps] = useState([]);
  const [metrics, setMetrics] = useState({
    impressions: 0, followers: 0, recruiters: 0, apps: 0,
    interviews: 0, newsletter: 0, community: 0, speaking: 0,
  });
  const [posts, setPosts] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Scanner state
  const [scanQuery, setScanQuery] = useState('VP Marketing Germany');
  const [scanResults, setScanResults] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanEngine, setScanEngine] = useState('google_jobs');
  const [usedEngine, setUsedEngine] = useState('');
  const [scanError, setScanError] = useState('');

  // Content state
  const [selectedContentWeek, setSelectedContentWeek] = useState(currentWeek);
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [generatingFor, setGeneratingFor] = useState(null);
  const [copied, setCopied] = useState(false);
  const [customPillar, setCustomPillar] = useState('ai');
  const [customTitle, setCustomTitle] = useState('');
  const [customAngle, setCustomAngle] = useState('');
  const [alignedTo, setAlignedTo] = useState([]);
  const [lastGeneratedPost, setLastGeneratedPost] = useState(null);

  // Tracker state
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedApp, setExpandedApp] = useState(null);
  const [newApp, setNewApp] = useState({ title: '', company: '', location: '', url: '', requirements: '', fitChecks: [], notes: '' });

  // Metrics editing
  const [editingMetrics, setEditingMetrics] = useState(false);
  const [tempMetrics, setTempMetrics] = useState({});

  // Load persisted data
  useEffect(() => {
    fetch('/api/career/data')
      .then(r => r.json())
      .then(data => {
        if (data.apps) setApps(data.apps);
        if (data.metrics) setMetrics(prev => ({ ...prev, ...data.metrics }));
        if (data.posts) setPosts(data.posts);
        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
  }, []);

  // Persist data on change
  const persistData = useCallback((newApps, newMetrics, newPosts) => {
    const a = newApps ?? apps;
    const m = newMetrics ?? metrics;
    const p = newPosts ?? posts;
    fetch('/api/career/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apps: a, metrics: m, posts: p }),
    }).catch(console.error);
  }, [apps, metrics, posts]);

  // Scanner
  const scanMarket = async () => {
    setIsScanning(true);
    setScanResults([]);
    setUsedEngine('');
    setScanError('');
    try {
      const res = await fetch('/api/career/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: scanQuery, engine: scanEngine }),
      });
      const data = await res.json();
      if (!res.ok) {
        setScanError(data.error || `Scan failed (${res.status})`);
        return;
      }
      setScanResults(data.jobs || []);
      setUsedEngine(data.engine || scanEngine);
    } catch (e) {
      console.error('Scan failed:', e);
      setScanError('Network error — check console for details');
    } finally {
      setIsScanning(false);
    }
  };

  const addToTracker = (job) => {
    const exists = apps.some(a => a.title === job.title && a.company === job.company);
    if (exists) return;
    const newApp = {
      id: Date.now().toString(),
      title: job.title,
      company: job.company,
      location: job.location,
      url: job.url || '',
      requirements: job.requirements || [],
      fitChecks: [],
      fitScore: job.fitScore || 0,
      status: 'Identified',
      notes: '',
    };
    const updated = [...apps, newApp];
    setApps(updated);
    persistData(updated, null, null);
  };

  // Content generation
  const generateDraft = async (post, angle) => {
    setGeneratingFor(post.title);
    setGeneratedDraft('');
    setAlignedTo([]);
    setLastGeneratedPost(post.title);
    try {
      const highFitRoles = apps.filter(a => a.fitScore >= 4);
      const res = await fetch('/api/career/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: post.title,
          pillar: post.pillar,
          requirement: post.req,
          angle: angle || '',
          targetRoles: highFitRoles.map(r => ({
            title: r.title,
            company: r.company,
            requirements: r.requirements,
            fitScore: r.fitScore,
          })),
        }),
      });
      const data = await res.json();
      setGeneratedDraft(data.draft || 'Generation failed');
      setAlignedTo(data.alignedTo || []);
    } catch (e) {
      setGeneratedDraft('Error: ' + e.message);
    } finally {
      setGeneratingFor(null);
    }
  };

  const generateCustom = async () => {
    if (!customTitle.trim()) return;
    const post = { title: customTitle, pillar: customPillar, req: '', format: 'text' };
    await generateDraft(post, customAngle);
  };

  const markPublished = (postTitle) => {
    const updated = { ...posts, [postTitle]: true };
    setPosts(updated);
    persistData(null, null, updated);
  };

  const copyDraft = () => {
    navigator.clipboard.writeText(generatedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tracker
  const addApplication = () => {
    const app = {
      id: Date.now().toString(),
      title: newApp.title,
      company: newApp.company,
      location: newApp.location,
      url: newApp.url,
      requirements: newApp.requirements.split(',').map(r => r.trim()).filter(Boolean),
      fitChecks: newApp.fitChecks,
      fitScore: newApp.fitChecks.length,
      status: 'Identified',
      notes: newApp.notes,
    };
    const updated = [...apps, app];
    setApps(updated);
    persistData(updated, null, null);
    setNewApp({ title: '', company: '', location: '', url: '', requirements: '', fitChecks: [], notes: '' });
    setShowAddForm(false);
  };

  const updateAppStatus = (id, status) => {
    const updated = apps.map(a => a.id === id ? { ...a, status } : a);
    setApps(updated);
    persistData(updated, null, null);
  };

  const updateAppNotes = (id, notes) => {
    const updated = apps.map(a => a.id === id ? { ...a, notes } : a);
    setApps(updated);
    persistData(updated, null, null);
  };

  const removeApp = (id) => {
    const updated = apps.filter(a => a.id !== id);
    setApps(updated);
    persistData(updated, null, null);
  };

  const saveMetrics = () => {
    const updated = { ...metrics, ...tempMetrics };
    setMetrics(updated);
    persistData(null, updated, null);
    setEditingMetrics(false);
  };

  // Derived
  const weekPosts = WEEK_POSTS.filter(p => p.week === selectedContentWeek);
  const thisWeekPosts = WEEK_POSTS.filter(p => p.week === currentWeek);
  const publishedCount = Object.values(posts).filter(Boolean).length;
  const avgFit = apps.length > 0 ? (apps.reduce((s, a) => s + (a.fitScore || 0), 0) / apps.length).toFixed(1) : '0';

  const M3_TARGETS = { impressions: 500, followers: 200, recruiters: 5, apps: 15, interviews: 2, newsletter: 100, community: 20, speaking: 1 };
  const M6_TARGETS = { impressions: 2000, followers: 800, recruiters: 10, apps: 40, interviews: 6, newsletter: 500, community: 50, speaking: 3 };

  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'scanner', label: 'Job Scanner', icon: Search },
    { id: 'content', label: 'Content Engine', icon: FileText },
    { id: 'tracker', label: 'Tracker', icon: Target },
  ];

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-[var(--font-dm-sans)]">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-400" />
                Career Command Center
              </h1>
              <p className="text-sm text-slate-400">VP Marketing / CMO Campaign - DACH</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium border border-amber-500/30">
              Week {currentWeek} of 12
            </span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* ========== DASHBOARD TAB ========== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Status Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Current Week', value: `${currentWeek} / 12`, icon: TrendingUp },
                { label: 'Posts Published', value: publishedCount, icon: FileText },
                { label: 'Total Applications', value: apps.length, icon: Briefcase },
                { label: 'Avg Fit Score', value: avgFit, icon: Target },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-slate-400 font-medium">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* This Week's Content */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">This Week's Content</h3>
              {thisWeekPosts.length === 0 ? (
                <p className="text-slate-400 text-sm">No posts scheduled for this week.</p>
              ) : (
                <div className="space-y-3">
                  {thisWeekPosts.map((post, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        {posts[post.title] ? (
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-600 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm text-white font-medium">{post.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <PillarTag pillarId={post.pillar} small />
                            <span className="text-xs text-slate-500 px-1.5 py-0.5 bg-slate-800 rounded">{post.format}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Success Metrics */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Success Metrics (Month 3 Targets)</h3>
                {editingMetrics ? (
                  <div className="flex gap-2">
                    <button onClick={saveMetrics} className="px-3 py-1.5 bg-amber-500 text-slate-900 rounded-lg text-sm font-medium flex items-center gap-1">
                      <Save className="w-3 h-3" /> Save
                    </button>
                    <button onClick={() => setEditingMetrics(false)} className="px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg text-sm">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => { setTempMetrics({ ...metrics }); setEditingMetrics(true); }} className="px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg text-sm flex items-center gap-1 hover:bg-slate-700">
                    <Edit3 className="w-3 h-3" /> Update Metrics
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(M3_TARGETS).map(([key, target]) => (
                  <div key={key}>
                    {editingMetrics ? (
                      <div className="bg-slate-900 border border-slate-600 rounded-xl p-4">
                        <label className="text-xs text-slate-400 font-medium capitalize block mb-2">{key}</label>
                        <input
                          type="number"
                          value={tempMetrics[key] || 0}
                          onChange={e => setTempMetrics({ ...tempMetrics, [key]: parseInt(e.target.value) || 0 })}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono text-lg"
                        />
                        <div className="text-xs text-slate-500 mt-1">Target: {target}</div>
                      </div>
                    ) : (
                      <MetricCard
                        label={key.charAt(0).toUpperCase() + key.slice(1)}
                        value={metrics[key] || 0}
                        target={target}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Application Pipeline */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Application Pipeline</h3>
              {apps.length === 0 ? (
                <p className="text-slate-400 text-sm">No applications tracked yet. Use the Scanner to find roles.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {STATUS_OPTIONS.map(s => {
                    const count = apps.filter(a => a.status === s.value).length;
                    return (
                      <div key={s.value} className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded-lg border border-slate-700/50">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-sm text-slate-300">{s.value}</span>
                        <span className="text-sm font-bold text-white font-mono">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== SCANNER TAB ========== */}
        {activeTab === 'scanner' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Job Scanner</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={scanQuery}
                  onChange={e => setScanQuery(e.target.value)}
                  placeholder="Search for VP Marketing, CMO, Head of Marketing..."
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-200 placeholder:text-slate-500 text-sm"
                  onKeyDown={e => { if (e.key === 'Enter' && !isScanning) scanMarket(); }}
                />
                <button
                  onClick={scanMarket}
                  disabled={isScanning}
                  className="px-5 py-2.5 bg-amber-500 text-slate-900 rounded-lg font-medium flex items-center gap-2 hover:bg-amber-400 disabled:opacity-50"
                >
                  {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {isScanning ? 'Scanning...' : 'Scan Market'}
                </button>
              </div>

              {/* Engine toggle */}
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs text-slate-500">Source:</span>
                <button
                  onClick={() => setScanEngine('google_jobs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    scanEngine === 'google_jobs'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  <Globe className="w-3 h-3 inline mr-1" />Google Jobs
                </button>
                <button
                  onClick={() => setScanEngine('claude')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    scanEngine === 'claude'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  <Sparkles className="w-3 h-3 inline mr-1" />AI Deep Search
                </button>
              </div>

              {/* Quick filters */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  'VP Marketing',
                  'Marketing Director',
                  'Head of Marketing',
                  'Leiter Marketing',
                  'CMO, Chief Marketing Officer',
                  'Head of Digital Marketing',
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => setScanQuery(q)}
                    className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs hover:bg-slate-600"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Scanning indicator */}
            {isScanning && (
              <div className="flex flex-col items-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-amber-400 mb-4" />
                <p className="text-slate-300">
                  {scanEngine === 'google_jobs' ? 'Searching Google Jobs (LinkedIn, Indeed, StepStone)...' : 'AI deep scanning the web...'}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {scanEngine === 'google_jobs' ? '~3-5 seconds' : '~15-30 seconds'}
                </p>
              </div>
            )}

            {/* Error */}
            {scanError && !isScanning && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 text-center">
                <p className="text-red-400 font-medium">Scan failed</p>
                <p className="text-sm text-red-400/70 mt-1">{scanError}</p>
              </div>
            )}

            {/* Empty state */}
            {!isScanning && !scanError && scanResults.length === 0 && usedEngine && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
                <Search className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No results found</p>
                <p className="text-sm text-slate-500 mt-1">Try a simpler query or switch to AI Deep Search</p>
              </div>
            )}

            {/* Results */}
            {scanResults.length > 0 && !isScanning && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-slate-400">{scanResults.length} results found</h4>
                  {usedEngine && (
                    <span className="text-xs text-slate-500">
                      via {usedEngine === 'google_jobs' ? 'Google Jobs' : 'AI Web Search'}
                    </span>
                  )}
                </div>
                {scanResults.sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0)).map((job, i) => (
                  <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-base font-semibold text-white">{job.title}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            job.fitScore >= 4 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            job.fitScore >= 3 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            'bg-slate-700 text-slate-400 border border-slate-600'
                          }`}>
                            Fit: {job.fitScore}/5
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 mb-1">{job.company}</p>
                        <div className="flex items-center gap-3 mb-3 text-xs text-slate-400">
                          <span>{job.location}</span>
                          {job.source && <span className="px-1.5 py-0.5 bg-slate-700 rounded">{job.source}</span>}
                          {job.postedAt && <span>{job.postedAt}</span>}
                          {job.schedule && <span>{job.schedule}</span>}
                        </div>
                        {job.description && (
                          <p className="text-xs text-slate-500 mb-3 line-clamp-2">{job.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {(job.requirements || []).map((req, j) => (
                            <span key={j} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">{req}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => addToTracker(job)}
                          disabled={apps.some(a => a.title === job.title && a.company === job.company)}
                          className="px-3 py-2 bg-amber-500 text-slate-900 rounded-lg text-xs font-medium hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          {apps.some(a => a.title === job.title && a.company === job.company) ? 'Added' : 'Add to Tracker'}
                        </button>
                        {job.url && (
                          <a href={job.url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 border border-slate-600 text-slate-300 rounded-lg text-xs flex items-center gap-1 hover:bg-slate-700">
                            <ExternalLink className="w-3 h-3" /> Apply
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== CONTENT ENGINE TAB ========== */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Week Selector */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Content Calendar</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(w => {
                  const weekPosts = WEEK_POSTS.filter(p => p.week === w);
                  const allPublished = weekPosts.length > 0 && weekPosts.every(p => posts[p.title]);
                  return (
                    <button
                      key={w}
                      onClick={() => setSelectedContentWeek(w)}
                      className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedContentWeek === w
                          ? 'bg-amber-500 text-slate-900'
                          : w === currentWeek
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      W{w}
                      {allPublished && (
                        <CheckCircle className="w-3 h-3 absolute -top-1 -right-1 text-green-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Week Posts */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-sm font-medium text-slate-400 mb-4">Week {selectedContentWeek} Posts</h3>
              {weekPosts.length === 0 ? (
                <p className="text-slate-500 text-sm">No posts scheduled for week {selectedContentWeek}.</p>
              ) : (
                <div className="space-y-3">
                  {weekPosts.map((post, i) => (
                    <div key={i} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-white font-medium mb-2">{post.title}</p>
                          <div className="flex items-center gap-2">
                            <PillarTag pillarId={post.pillar} small />
                            <span className="text-xs text-slate-500">Req: {post.req}</span>
                            <span className="text-xs text-slate-500 px-1.5 py-0.5 bg-slate-800 rounded">{post.format}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {posts[post.title] ? (
                            <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Published</span>
                          ) : (
                            <button
                              onClick={() => generateDraft(post)}
                              disabled={generatingFor !== null}
                              className="px-3 py-1.5 bg-amber-500 text-slate-900 rounded-lg text-xs font-medium hover:bg-amber-400 disabled:opacity-50 flex items-center gap-1"
                            >
                              {generatingFor === post.title ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                              {generatingFor === post.title ? 'Generating...' : 'Generate Draft'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Generated Draft */}
            {generatedDraft && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-400">Generated Draft</h3>
                    {alignedTo.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Target className="w-3 h-3 text-amber-400" />
                        <span className="text-xs text-amber-400">Aligned to: {alignedTo.join(', ')}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={copyDraft}
                      className="px-3 py-1.5 bg-amber-500 text-slate-900 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-amber-400"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                    <button
                      onClick={() => { if (lastGeneratedPost) markPublished(lastGeneratedPost); }}
                      disabled={!lastGeneratedPost || posts[lastGeneratedPost]}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-green-500 disabled:opacity-40"
                    >
                      <CheckCircle className="w-3 h-3" /> {posts[lastGeneratedPost] ? 'Published' : 'Mark Published'}
                    </button>
                    <button
                      onClick={() => {
                        const post = weekPosts.find(p => p.title === lastGeneratedPost) || { title: lastGeneratedPost, pillar: customPillar, req: '' };
                        generateDraft(post);
                      }}
                      disabled={generatingFor !== null}
                      className="px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg text-xs flex items-center gap-1 hover:bg-slate-700 disabled:opacity-50"
                    >
                      <RefreshCw className="w-3 h-3" /> Regenerate
                    </button>
                    <button
                      onClick={() => { setGeneratedDraft(''); setAlignedTo([]); setLastGeneratedPost(null); }}
                      className="px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg text-xs hover:bg-slate-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="bg-slate-900 rounded-lg p-5 border border-slate-700">
                  <pre className="text-sm text-slate-200 whitespace-pre-wrap font-[var(--font-dm-sans)] leading-relaxed">{generatedDraft}</pre>
                </div>
              </div>
            )}

            {/* Custom Post Generator */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-sm font-medium text-slate-400 mb-4">Custom Post Generator</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <select
                    value={customPillar}
                    onChange={e => setCustomPillar(e.target.value)}
                    className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 text-sm"
                  >
                    {PILLARS.map(p => (
                      <option key={p.id} value={p.id}>{p.icon} {p.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    placeholder="Enter post title..."
                    className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-200 placeholder:text-slate-500 text-sm"
                  />
                  <button
                    onClick={generateCustom}
                    disabled={!customTitle.trim() || generatingFor !== null}
                    className="px-5 py-2.5 bg-amber-500 text-slate-900 rounded-lg font-medium text-sm hover:bg-amber-400 disabled:opacity-50 flex items-center gap-2"
                  >
                    {generatingFor ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={customAngle}
                  onChange={e => setCustomAngle(e.target.value)}
                  placeholder="Optional angle: e.g. 'how we used AI to reduce Deutsche Bank CPA by 40%'"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-200 placeholder:text-slate-500 text-sm"
                />
                {apps.filter(a => a.fitScore >= 4).length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-amber-400" />
                    <span className="text-xs text-amber-400">
                      Will align to: {apps.filter(a => a.fitScore >= 4).map(a => a.company).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========== TRACKER TAB ========== */}
        {activeTab === 'tracker' && (
          <div className="space-y-6">
            {/* Add Role */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Application Tracker</h3>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-4 py-2 bg-amber-500 text-slate-900 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-amber-400"
                >
                  {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {showAddForm ? 'Cancel' : 'Add Role'}
                </button>
              </div>

              {/* Add Form */}
              {showAddForm && (
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-5 mb-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Job Title</label>
                      <input
                        value={newApp.title}
                        onChange={e => setNewApp({ ...newApp, title: e.target.value })}
                        placeholder="VP Marketing"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Company</label>
                      <input
                        value={newApp.company}
                        onChange={e => setNewApp({ ...newApp, company: e.target.value })}
                        placeholder="Company name"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Location</label>
                      <input
                        value={newApp.location}
                        onChange={e => setNewApp({ ...newApp, location: e.target.value })}
                        placeholder="Berlin, Germany"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Listing URL</label>
                      <input
                        value={newApp.url}
                        onChange={e => setNewApp({ ...newApp, url: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Requirements (comma-separated)</label>
                    <input
                      value={newApp.requirements}
                      onChange={e => setNewApp({ ...newApp, requirements: e.target.value })}
                      placeholder="AI/ML experience, team leadership, DACH market knowledge..."
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-2 block">Fit Score Criteria</label>
                    <div className="space-y-2">
                      {FIT_CRITERIA.map((criterion, i) => (
                        <label key={i} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newApp.fitChecks.includes(i)}
                            onChange={e => {
                              const checks = e.target.checked
                                ? [...newApp.fitChecks, i]
                                : newApp.fitChecks.filter(c => c !== i);
                              setNewApp({ ...newApp, fitChecks: checks });
                            }}
                            className="rounded border-slate-600 bg-slate-800 text-amber-500"
                          />
                          {criterion}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Notes</label>
                    <textarea
                      value={newApp.notes}
                      onChange={e => setNewApp({ ...newApp, notes: e.target.value })}
                      placeholder="Any additional notes..."
                      rows={2}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm"
                    />
                  </div>
                  <button
                    onClick={addApplication}
                    disabled={!newApp.title || !newApp.company}
                    className="px-5 py-2.5 bg-amber-500 text-slate-900 rounded-lg font-medium text-sm disabled:opacity-50"
                  >
                    Add Application
                  </button>
                </div>
              )}

              {/* Applications List */}
              {apps.length === 0 ? (
                <p className="text-slate-400 text-sm py-4">No applications tracked yet.</p>
              ) : (
                <div className="space-y-3">
                  {[...apps].sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0)).map(app => (
                    <div key={app.id} className="bg-slate-900/50 border border-slate-700/50 rounded-lg overflow-hidden">
                      {/* Collapsed View */}
                      <button
                        onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                        className="w-full p-4 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            app.fitScore >= 4 ? 'bg-amber-500/20 text-amber-400' :
                            app.fitScore >= 3 ? 'bg-blue-500/20 text-blue-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>
                            {app.fitScore}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{app.title}</p>
                            <p className="text-xs text-slate-400">{app.company} - {app.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <StatusBadge status={app.status} />
                          {expandedApp === app.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </button>

                      {/* Expanded View */}
                      {expandedApp === app.id && (
                        <div className="border-t border-slate-700/50 p-4 space-y-4">
                          {/* Requirements */}
                          <div>
                            <label className="text-xs text-slate-400 mb-2 block">Requirements</label>
                            <div className="flex flex-wrap gap-1.5">
                              {(app.requirements || []).map((req, j) => (
                                <span key={j} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs border border-slate-700">{req}</span>
                              ))}
                            </div>
                          </div>

                          {/* Status Selector */}
                          <div>
                            <label className="text-xs text-slate-400 mb-2 block">Status</label>
                            <div className="flex flex-wrap gap-2">
                              {STATUS_OPTIONS.map(s => (
                                <button
                                  key={s.value}
                                  onClick={() => updateAppStatus(app.id, s.value)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    app.status === s.value
                                      ? 'ring-2 ring-offset-1 ring-offset-slate-900'
                                      : 'opacity-60 hover:opacity-100'
                                  }`}
                                  style={{
                                    backgroundColor: s.color + '20',
                                    color: s.color,
                                    borderColor: s.color + '40',
                                    borderWidth: '1px',
                                    ...(app.status === s.value ? { ringColor: s.color } : {}),
                                  }}
                                >
                                  {s.value}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Notes */}
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Notes</label>
                            <textarea
                              value={app.notes || ''}
                              onChange={e => updateAppNotes(app.id, e.target.value)}
                              rows={2}
                              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm"
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            {app.url && (
                              <a href={app.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg text-xs flex items-center gap-1 hover:bg-slate-700">
                                <ExternalLink className="w-3 h-3" /> View Listing
                              </a>
                            )}
                            <button
                              onClick={() => removeApp(app.id)}
                              className="px-3 py-1.5 border border-red-800 text-red-400 rounded-lg text-xs flex items-center gap-1 hover:bg-red-900/30"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
