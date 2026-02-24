'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Loader2, Copy, Check, RefreshCw, Plus, Trash2,
  ChevronDown, ChevronUp, ExternalLink, BarChart3, FileText,
  Target, Briefcase, TrendingUp, Globe, ArrowLeft, ArrowRight,
  CheckCircle, X, Edit3, Save, Sparkles, Star, Send, Eye,
  Calendar, Mail, Zap
} from 'lucide-react';
import Link from 'next/link';
import { PILLARS, FIT_CRITERIA, STATUS_OPTIONS, CONTENT_STATUSES, createCampaign } from '../lib/career-data';
import { KNOWLEDGE_DOMAINS } from '../lib/knowledge-base';

// ============ HELPERS ============

function DomainTag({ domainId, small }) {
  // Support both new `domain` and old `pillar` keys
  const p = KNOWLEDGE_DOMAINS.find(x => x.id === domainId) || PILLARS.find(x => x.id === domainId);
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

function StepIndicator({ steps, current, onStepClick }) {
  return (
    <div className="flex items-center gap-1 w-full">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1">
          <button
            onClick={() => onStepClick(i + 1)}
            disabled={step.locked}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all w-full ${
              current === i + 1
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : step.done
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : step.locked
                    ? 'bg-slate-800/50 text-slate-600 border border-slate-700/30 cursor-not-allowed'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              current === i + 1 ? 'bg-amber-500 text-slate-900' :
              step.done ? 'bg-emerald-500 text-white' :
              'bg-slate-700 text-slate-400'
            }`}>
              {step.done ? <Check className="w-3 h-3" /> : i + 1}
            </span>
            <div className="text-left min-w-0">
              <div className="truncate">{step.label}</div>
              <div className="text-xs opacity-60 truncate">{step.desc}</div>
            </div>
          </button>
          {i < steps.length - 1 && <div className="w-2 h-px bg-slate-700 flex-shrink-0 mx-1" />}
        </div>
      ))}
    </div>
  );
}

function getCampaignWeek(startDate) {
  if (!startDate) return 1;
  const elapsed = Date.now() - new Date(startDate).getTime();
  const week = Math.ceil(elapsed / (7 * 86400000));
  return Math.max(1, Math.min(12, week));
}

// ============ MAIN COMPONENT ============

export default function CareerCommandCenter() {
  // Core state
  const [isLoaded, setIsLoaded] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [apps, setApps] = useState([]); // tracked roles (shared across campaigns)

  // Step 1: Target
  const [scanQuery, setScanQuery] = useState('VP Marketing');
  const [scanResults, setScanResults] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanEngine, setScanEngine] = useState('google_jobs');
  const [usedEngine, setUsedEngine] = useState('');
  const [scanError, setScanError] = useState('');
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);

  // Step 2: Create
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [generatingFor, setGeneratingFor] = useState(null);
  const [editingDraft, setEditingDraft] = useState(null);
  const [editText, setEditText] = useState('');

  // Step 3: Publish
  const [copied, setCopied] = useState(false);
  const [publishingTo, setPublishingTo] = useState(null);
  const [publishStatus, setPublishStatus] = useState(null);

  // Step 4: Track
  const [editingMetrics, setEditingMetrics] = useState(false);
  const [tempMetrics, setTempMetrics] = useState({});
  const [kitStats, setKitStats] = useState(null);

  // Load data
  useEffect(() => {
    fetch('/api/career/data')
      .then(r => r.json())
      .then(data => {
        if (data.apps) setApps(data.apps);
        if (data.campaign) setCampaign(data.campaign);
        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
  }, []);

  // Persist
  const persist = useCallback((newApps, newCampaign) => {
    const a = newApps ?? apps;
    const c = newCampaign ?? campaign;
    fetch('/api/career/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apps: a, campaign: c }),
    }).catch(console.error);
  }, [apps, campaign]);

  // Derived
  const currentStep = campaign?.currentStep || 1;
  const campaignWeek = campaign ? getCampaignWeek(campaign.startDate) : 1;
  const starredRoles = apps.filter(a => a.starred);
  const strategy = campaign?.strategy;

  const setStep = (step) => {
    if (!campaign) return;
    const updated = { ...campaign, currentStep: step };
    setCampaign(updated);
    persist(null, updated);
  };

  // ============ STEP 1: SCANNER ============

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
      if (!res.ok) { setScanError(data.error || `Scan failed (${res.status})`); return; }
      setScanResults(data.jobs || []);
      setUsedEngine(data.engine || scanEngine);
    } catch (e) {
      setScanError('Network error');
    } finally {
      setIsScanning(false);
    }
  };

  const addToTracker = (job) => {
    if (apps.some(a => a.title === job.title && a.company === job.company)) return;
    const app = {
      id: Date.now().toString(), title: job.title, company: job.company,
      location: job.location, url: job.url || '', requirements: job.requirements || [],
      fitScore: job.fitScore || 0, status: 'Identified', notes: '',
      starred: false, contentCount: 0,
    };
    const updated = [...apps, app];
    setApps(updated);
    persist(updated, null);
  };

  const toggleStar = (id) => {
    const updated = apps.map(a => a.id === id ? { ...a, starred: !a.starred } : a);
    setApps(updated);
    persist(updated, null);
  };

  const removeApp = (id) => {
    const updated = apps.filter(a => a.id !== id);
    setApps(updated);
    persist(updated, null);
  };

  // Generate strategy from starred roles
  const generateStrategy = async () => {
    if (starredRoles.length === 0) return;
    setIsGeneratingStrategy(true);
    try {
      const res = await fetch('/api/career/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRoles: starredRoles }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Strategy generation failed');

      const now = new Date();
      const quarterLabel = `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`;
      const newCampaign = createCampaign(quarterLabel, now.toISOString().split('T')[0]);
      newCampaign.targetRoles = starredRoles;
      newCampaign.strategy = data.strategy;
      newCampaign.currentStep = 2;

      setCampaign(newCampaign);
      persist(null, newCampaign);
    } catch (e) {
      alert('Strategy generation failed: ' + e.message);
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  // ============ STEP 2: CREATE ============

  const weekData = strategy?.weeks?.find(w => w.week === selectedWeek);

  const generateContent = async (contentKey, title, domain, type, angle, insightId, insightIds) => {
    setGeneratingFor(contentKey);
    try {
      const res = await fetch('/api/career/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, domain, type,
          angle: angle || '',
          insightId: insightId || null,
          insightIds: insightIds || null,
          targetRoles: (campaign?.targetRoles || []).map(r => ({
            title: r.title, company: r.company,
            requirements: r.requirements, fitScore: r.fitScore,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const updatedCampaign = { ...campaign };
      updatedCampaign.content = {
        ...updatedCampaign.content,
        [contentKey]: {
          type,
          draft: data.draft,
          status: CONTENT_STATUSES.GENERATED,
          generatedAt: new Date().toISOString(),
          publishedAt: null,
          kitBroadcastId: null,
        },
      };
      setCampaign(updatedCampaign);
      persist(null, updatedCampaign);
      setGeneratedDraft(data.draft);
    } catch (e) {
      alert('Generation failed: ' + e.message);
    } finally {
      setGeneratingFor(null);
    }
  };

  const saveEdit = (contentKey) => {
    const updatedCampaign = { ...campaign };
    updatedCampaign.content = {
      ...updatedCampaign.content,
      [contentKey]: {
        ...updatedCampaign.content[contentKey],
        draft: editText,
        status: CONTENT_STATUSES.EDITED,
      },
    };
    setCampaign(updatedCampaign);
    persist(null, updatedCampaign);
    setEditingDraft(null);
  };

  // ============ STEP 3: PUBLISH ============

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const publishToKit = async (contentKey) => {
    const content = campaign?.content?.[contentKey];
    if (!content) return;
    setPublishingTo(contentKey);
    setPublishStatus(null);
    try {
      const res = await fetch('/api/publish/kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: contentKey.replace(/-/g, ' '),
          subtitle: `Career Campaign - ${campaign.quarter}`,
          content: content.draft,
          charts: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const updatedCampaign = { ...campaign };
      updatedCampaign.content[contentKey] = {
        ...updatedCampaign.content[contentKey],
        kitBroadcastId: data.broadcastId,
        status: CONTENT_STATUSES.PUBLISHED,
        publishedAt: new Date().toISOString(),
      };
      setCampaign(updatedCampaign);
      persist(null, updatedCampaign);
      setPublishStatus({ success: true, url: data.dashboardUrl });
    } catch (e) {
      setPublishStatus({ success: false, error: e.message });
    } finally {
      setPublishingTo(null);
    }
  };

  const markPublished = (contentKey) => {
    const updatedCampaign = { ...campaign };
    updatedCampaign.content[contentKey] = {
      ...updatedCampaign.content[contentKey],
      status: CONTENT_STATUSES.PUBLISHED,
      publishedAt: new Date().toISOString(),
    };
    setCampaign(updatedCampaign);
    persist(null, updatedCampaign);
  };

  // ============ STEP 4: TRACK ============

  const saveWeekMetrics = (week) => {
    const updatedCampaign = { ...campaign };
    updatedCampaign.metrics = {
      ...updatedCampaign.metrics,
      [`week${week}`]: tempMetrics,
    };
    setCampaign(updatedCampaign);
    persist(null, updatedCampaign);
    setEditingMetrics(false);
  };

  const fetchKitStats = async () => {
    try {
      const res = await fetch('/api/career/kit-stats');
      const data = await res.json();
      if (res.ok) setKitStats(data);
    } catch {}
  };

  const startNewQuarter = () => {
    setCampaign(null);
    persist(null, null);
  };

  // ============ STEP CONFIG ============

  const steps = [
    { label: 'Target', desc: 'Scan & select roles', done: !!strategy, locked: false },
    { label: 'Create', desc: 'Generate content', done: false, locked: !strategy },
    { label: 'Publish', desc: 'Review & send', done: false, locked: !strategy },
    { label: 'Track', desc: 'Measure results', done: false, locked: !strategy },
  ];

  // ============ RENDER ============

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
            <Link href="/" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-400" />Career Command Center
              </h1>
              <p className="text-sm text-slate-400">
                {campaign ? `${campaign.quarter} Campaign - Week ${campaignWeek} of 12` : 'Start a new quarterly campaign'}
              </p>
            </div>
          </div>
          {campaign && (
            <button onClick={startNewQuarter} className="text-xs text-slate-500 hover:text-red-400 border border-slate-700 px-3 py-1.5 rounded-lg">
              New Quarter
            </button>
          )}
        </div>
      </header>

      {/* Step Indicator */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <StepIndicator steps={steps} current={currentStep} onStepClick={setStep} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">

        {/* ========== STEP 1: TARGET ========== */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Scanner */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-1">Scan the Market</h3>
              <p className="text-sm text-slate-400 mb-4">Find VP Marketing / CMO roles in DACH. Star the ones you want to target this quarter.</p>
              <div className="flex gap-3">
                <input type="text" value={scanQuery} onChange={e => setScanQuery(e.target.value)}
                  placeholder="Search for VP Marketing, Leiter Marketing..."
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-200 placeholder:text-slate-500 text-sm"
                  onKeyDown={e => { if (e.key === 'Enter' && !isScanning) scanMarket(); }} />
                <button onClick={scanMarket} disabled={isScanning}
                  className="px-5 py-2.5 bg-amber-500 text-slate-900 rounded-lg font-medium flex items-center gap-2 hover:bg-amber-400 disabled:opacity-50">
                  {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {isScanning ? 'Scanning...' : 'Scan'}
                </button>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs text-slate-500">Source:</span>
                <button onClick={() => setScanEngine('google_jobs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${scanEngine === 'google_jobs' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                  <Globe className="w-3 h-3 inline mr-1" />Google Jobs
                </button>
                <button onClick={() => setScanEngine('claude')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${scanEngine === 'claude' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                  <Sparkles className="w-3 h-3 inline mr-1" />AI Deep Search
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {['VP Marketing', 'Leiter Marketing', 'Marketing Leitung', 'Marketingleiter', 'Leiter Digital Marketing', 'Leiter Online Marketing'].map(q => (
                  <button key={q} onClick={() => { setScanQuery(q); }} className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs hover:bg-slate-600">{q}</button>
                ))}
              </div>
            </div>

            {/* Scanning/Error/Empty */}
            {isScanning && (
              <div className="flex flex-col items-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-amber-400 mb-4" />
                <p className="text-slate-300">{scanEngine === 'google_jobs' ? 'Searching Google Jobs...' : 'AI deep scanning...'}</p>
              </div>
            )}
            {scanError && !isScanning && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 text-center">
                <p className="text-red-400 font-medium">Scan failed</p>
                <p className="text-sm text-red-400/70 mt-1">{scanError}</p>
              </div>
            )}

            {/* Scan Results */}
            {scanResults.length > 0 && !isScanning && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-400">{scanResults.length} results {usedEngine && `via ${usedEngine === 'google_jobs' ? 'Google Jobs' : 'AI Search'}`}</h4>
                {scanResults.sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0)).map((job, i) => (
                  <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-white truncate">{job.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${
                          job.fitScore >= 4 ? 'bg-amber-500/20 text-amber-400' : job.fitScore >= 3 ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'
                        }`}>{job.fitScore}/5</span>
                      </div>
                      <p className="text-xs text-slate-400">{job.company} - {job.location}</p>
                      {job.requirements?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.requirements.slice(0, 3).map((r, j) => (
                            <span key={j} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">{r}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => addToTracker(job)}
                      disabled={apps.some(a => a.title === job.title && a.company === job.company)}
                      className="px-3 py-2 bg-amber-500 text-slate-900 rounded-lg text-xs font-medium hover:bg-amber-400 disabled:opacity-30 flex items-center gap-1 flex-shrink-0">
                      <Plus className="w-3 h-3" />{apps.some(a => a.title === job.title && a.company === job.company) ? 'Added' : 'Track'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Tracked Roles */}
            {apps.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Tracked Roles ({apps.length}) — Star your targets for this quarter</h3>
                <div className="space-y-2">
                  {[...apps].sort((a, b) => {
                    if (a.starred && !b.starred) return -1;
                    if (!a.starred && b.starred) return 1;
                    return (b.fitScore || 0) - (a.fitScore || 0);
                  }).map(app => (
                    <div key={app.id} className={`flex items-center gap-3 p-3 rounded-lg ${app.starred ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-slate-900/50 border border-slate-700/50'}`}>
                      <button onClick={() => toggleStar(app.id)}>
                        <Star className={`w-4 h-4 ${app.starred ? 'text-amber-400 fill-amber-400' : 'text-slate-600 hover:text-slate-400'}`} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{app.title}</p>
                        <p className="text-xs text-slate-400">{app.company} - {app.location}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        app.fitScore >= 4 ? 'bg-amber-500/20 text-amber-400' : app.fitScore >= 3 ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'
                      }`}>{app.fitScore}/5</span>
                      <button onClick={() => removeApp(app.id)} className="text-slate-600 hover:text-red-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Generate Strategy CTA */}
                {starredRoles.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <button onClick={generateStrategy} disabled={isGeneratingStrategy}
                      className="w-full px-5 py-3 bg-amber-500 text-slate-900 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-amber-400 disabled:opacity-50 text-sm">
                      {isGeneratingStrategy ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />Generating 12-week strategy from {starredRoles.length} target roles...</>
                      ) : (
                        <><Zap className="w-4 h-4" />Generate Quarterly Strategy ({starredRoles.length} starred role{starredRoles.length !== 1 ? 's' : ''})</>
                      )}
                    </button>
                    <p className="text-xs text-slate-500 mt-2 text-center">AI will create a 12-week content calendar with LinkedIn posts + newsletter articles aligned to these roles</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========== STEP 2: CREATE ========== */}
        {currentStep === 2 && strategy && (
          <div className="space-y-6">
            {/* Week Selector */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-3">Content Calendar — {campaign.quarter}</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(w => {
                  const wd = strategy.weeks?.find(x => x.week === w);
                  const allContent = [
                    ...(wd?.linkedin || []).map((_, j) => `w${w}-linkedin-${j}`),
                    wd?.newsletter ? `w${w}-newsletter` : null,
                  ].filter(Boolean);
                  const allDone = allContent.length > 0 && allContent.every(k => campaign.content?.[k]?.status === CONTENT_STATUSES.PUBLISHED);
                  const hasDrafts = allContent.some(k => campaign.content?.[k]);
                  return (
                    <button key={w} onClick={() => setSelectedWeek(w)}
                      className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedWeek === w ? 'bg-amber-500 text-slate-900' :
                        w === campaignWeek ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        hasDrafts ? 'bg-slate-700 text-slate-200' :
                        'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                      }`}>
                      W{w}
                      {allDone && <CheckCircle className="w-3 h-3 absolute -top-1 -right-1 text-green-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Week Content */}
            {weekData && (
              <div className="space-y-4">
                {/* LinkedIn Posts */}
                {(weekData.linkedin || []).map((post, i) => {
                  const key = `w${selectedWeek}-linkedin-${i}`;
                  const existing = campaign.content?.[key];
                  const postDomain = post.domain || post.pillar;
                  return (
                    <div key={key} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">LinkedIn</span>
                            <DomainTag domainId={postDomain} small />
                            {existing?.status === CONTENT_STATUSES.PUBLISHED && (
                              <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Published</span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-white">{post.title}</h4>
                          {post.source && <p className="text-xs text-slate-500 mt-1">Source: {post.source}</p>}
                          {post.angle && <p className="text-xs text-slate-400 mt-1">Angle: {post.angle}</p>}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {existing ? (
                            <>
                              <button onClick={() => { setEditingDraft(key); setEditText(existing.draft); }}
                                className="px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg text-xs flex items-center gap-1 hover:bg-slate-700">
                                <Edit3 className="w-3 h-3" />Edit
                              </button>
                              <button onClick={() => { setGeneratedDraft(existing.draft); }}
                                className="px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg text-xs flex items-center gap-1 hover:bg-slate-700">
                                <Eye className="w-3 h-3" />View
                              </button>
                            </>
                          ) : (
                            <button onClick={() => generateContent(key, post.title, postDomain, 'linkedin', post.angle, post.insightId)}
                              disabled={generatingFor !== null}
                              className="px-3 py-1.5 bg-amber-500 text-slate-900 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-amber-400 disabled:opacity-50">
                              {generatingFor === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                              {generatingFor === key ? 'Generating...' : 'Generate'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Newsletter */}
                {weekData.newsletter && (() => {
                  const key = `w${selectedWeek}-newsletter`;
                  const existing = campaign.content?.[key];
                  const nl = weekData.newsletter;
                  const nlDomain = nl.domain || nl.pillar;
                  return (
                    <div className="bg-slate-800 border border-amber-500/20 rounded-xl p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                              <Mail className="w-3 h-3" />Newsletter
                            </span>
                            <DomainTag domainId={nlDomain} small />
                            {existing?.status === CONTENT_STATUSES.PUBLISHED && (
                              <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Sent</span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-white">{nl.title}</h4>
                          {nl.source && <p className="text-xs text-slate-500 mt-1">Sources: {nl.source}</p>}
                          {nl.angle && <p className="text-xs text-slate-400 mt-1">Angle: {nl.angle}</p>}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {existing ? (
                            <>
                              <button onClick={() => { setEditingDraft(key); setEditText(existing.draft); }}
                                className="px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg text-xs flex items-center gap-1 hover:bg-slate-700">
                                <Edit3 className="w-3 h-3" />Edit
                              </button>
                              <button onClick={() => { setGeneratedDraft(existing.draft); }}
                                className="px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg text-xs flex items-center gap-1 hover:bg-slate-700">
                                <Eye className="w-3 h-3" />View
                              </button>
                            </>
                          ) : (
                            <button onClick={() => generateContent(key, nl.title, nlDomain, 'newsletter', nl.angle, null, nl.insightIds)}
                              disabled={generatingFor !== null}
                              className="px-3 py-1.5 bg-amber-500 text-slate-900 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-amber-400 disabled:opacity-50">
                              {generatingFor === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                              {generatingFor === key ? 'Generating...' : 'Generate Article'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Edit Modal */}
            {editingDraft && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-slate-400">Editing: {editingDraft}</h4>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(editingDraft)} className="px-3 py-1.5 bg-amber-500 text-slate-900 rounded-lg text-xs font-medium flex items-center gap-1">
                      <Save className="w-3 h-3" />Save
                    </button>
                    <button onClick={() => setEditingDraft(null)} className="px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg text-xs">Cancel</button>
                  </div>
                </div>
                <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={16}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 text-sm leading-relaxed font-[var(--font-dm-sans)]" />
              </div>
            )}

            {/* Preview */}
            {generatedDraft && !editingDraft && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-slate-400">Preview</h4>
                  <div className="flex gap-2">
                    <button onClick={() => copyToClipboard(generatedDraft)}
                      className="px-3 py-1.5 bg-amber-500 text-slate-900 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-amber-400">
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={() => setGeneratedDraft('')} className="px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg text-xs">Close</button>
                  </div>
                </div>
                <div className="bg-slate-900 rounded-lg p-5 border border-slate-700">
                  <pre className="text-sm text-slate-200 whitespace-pre-wrap font-[var(--font-dm-sans)] leading-relaxed">{generatedDraft}</pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== STEP 3: PUBLISH ========== */}
        {currentStep === 3 && strategy && (
          <div className="space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-1">Review & Publish</h3>
              <p className="text-sm text-slate-400 mb-4">Review generated content, then publish. LinkedIn = copy to clipboard. Newsletter = send to Kit as draft.</p>
            </div>

            {/* Content Queue */}
            {strategy.weeks?.map(w => {
              const allKeys = [
                ...(w.linkedin || []).map((_, j) => ({ key: `w${w.week}-linkedin-${j}`, type: 'linkedin', title: w.linkedin[j]?.title })),
                w.newsletter ? { key: `w${w.week}-newsletter`, type: 'newsletter', title: w.newsletter.title } : null,
              ].filter(Boolean).filter(item => campaign.content?.[item.key]);

              if (allKeys.length === 0) return null;

              return (
                <div key={w.week} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <h4 className="text-xs font-medium text-slate-500 mb-3">Week {w.week}</h4>
                  <div className="space-y-3">
                    {allKeys.map(({ key, type, title }) => {
                      const content = campaign.content[key];
                      const isPublished = content.status === CONTENT_STATUSES.PUBLISHED;
                      return (
                        <div key={key} className={`flex items-center justify-between p-3 rounded-lg border ${isPublished ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900/50 border-slate-700/50'}`}>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {isPublished ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-600 flex-shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-sm text-white truncate">{title}</p>
                              <span className={`text-xs ${type === 'newsletter' ? 'text-amber-400' : 'text-blue-400'}`}>{type === 'newsletter' ? 'Newsletter' : 'LinkedIn'}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {!isPublished && type === 'linkedin' && (
                              <>
                                <button onClick={() => copyToClipboard(content.draft)}
                                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-blue-400">
                                  <Copy className="w-3 h-3" />Copy for LinkedIn
                                </button>
                                <button onClick={() => markPublished(key)}
                                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-emerald-500">
                                  <Check className="w-3 h-3" />Mark Posted
                                </button>
                              </>
                            )}
                            {!isPublished && type === 'newsletter' && (
                              <button onClick={() => publishToKit(key)} disabled={publishingTo === key}
                                className="px-3 py-1.5 bg-amber-500 text-slate-900 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-amber-400 disabled:opacity-50">
                                {publishingTo === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                {publishingTo === key ? 'Sending...' : 'Send to Kit'}
                              </button>
                            )}
                            {isPublished && <span className="text-xs text-green-400">Done</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {publishStatus && (
              <div className={`p-4 rounded-xl border ${publishStatus.success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                {publishStatus.success ? (
                  <p className="text-sm text-emerald-400">Sent to Kit as draft. <a href={publishStatus.url} target="_blank" rel="noopener noreferrer" className="underline">Open Kit dashboard</a></p>
                ) : (
                  <p className="text-sm text-red-400">Failed: {publishStatus.error}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========== STEP 4: TRACK ========== */}
        {currentStep === 4 && strategy && (
          <div className="space-y-6">
            {/* Campaign Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Week', value: `${campaignWeek} / 12`, icon: Calendar },
                { label: 'Content Created', value: Object.keys(campaign.content || {}).length, icon: FileText },
                { label: 'Published', value: Object.values(campaign.content || {}).filter(c => c.status === CONTENT_STATUSES.PUBLISHED).length, icon: CheckCircle },
                { label: 'Target Roles', value: campaign.targetRoles?.length || 0, icon: Target },
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

            {/* Weekly Metrics Input */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Week {campaignWeek} Metrics</h3>
                {editingMetrics ? (
                  <div className="flex gap-2">
                    <button onClick={() => saveWeekMetrics(campaignWeek)} className="px-3 py-1.5 bg-amber-500 text-slate-900 rounded-lg text-sm font-medium flex items-center gap-1">
                      <Save className="w-3 h-3" />Save
                    </button>
                    <button onClick={() => setEditingMetrics(false)} className="px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg text-sm">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => {
                    setTempMetrics(campaign.metrics?.[`week${campaignWeek}`] || { impressions: 0, profileViews: 0, connections: 0, companyEngagements: '' });
                    setEditingMetrics(true);
                  }} className="px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg text-sm flex items-center gap-1 hover:bg-slate-700">
                    <Edit3 className="w-3 h-3" />Update
                  </button>
                )}
              </div>
              {editingMetrics ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: 'impressions', label: 'LinkedIn Impressions' },
                      { key: 'profileViews', label: 'Profile Views' },
                      { key: 'connections', label: 'New Connections' },
                    ].map(m => (
                      <div key={m.key}>
                        <label className="text-xs text-slate-400 mb-1 block">{m.label}</label>
                        <input type="number" value={tempMetrics[m.key] || 0}
                          onChange={e => setTempMetrics({ ...tempMetrics, [m.key]: parseInt(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Company Engagement Notes</label>
                    <textarea value={tempMetrics.companyEngagements || ''}
                      onChange={e => setTempMetrics({ ...tempMetrics, companyEngagements: e.target.value })}
                      placeholder="e.g. Recruiter from Matrix42 viewed profile, VP at EcoVadis liked AI post..."
                      rows={3} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(() => {
                    const wm = campaign.metrics?.[`week${campaignWeek}`] || {};
                    return [
                      { label: 'LinkedIn Impressions', value: wm.impressions || 0 },
                      { label: 'Profile Views', value: wm.profileViews || 0 },
                      { label: 'New Connections', value: wm.connections || 0 },
                    ].map((m, i) => (
                      <div key={i} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3">
                        <span className="text-xs text-slate-400">{m.label}</span>
                        <div className="text-xl font-bold text-white font-mono mt-1">{m.value}</div>
                      </div>
                    ));
                  })()}
                </div>
              )}
              {!editingMetrics && campaign.metrics?.[`week${campaignWeek}`]?.companyEngagements && (
                <div className="mt-4 p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg">
                  <span className="text-xs text-slate-400 block mb-1">Company Engagement Notes</span>
                  <p className="text-sm text-slate-200">{campaign.metrics[`week${campaignWeek}`].companyEngagements}</p>
                </div>
              )}
            </div>

            {/* Kit Stats */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400" />Kit Newsletter Stats
                </h3>
                <button onClick={fetchKitStats} className="px-3 py-1.5 border border-slate-600 text-slate-300 rounded-lg text-xs flex items-center gap-1 hover:bg-slate-700">
                  <RefreshCw className="w-3 h-3" />Refresh
                </button>
              </div>
              {kitStats ? (
                <div className="space-y-3">
                  <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3">
                    <span className="text-xs text-slate-400">Total Subscribers</span>
                    <div className="text-xl font-bold text-white font-mono mt-1">{kitStats.subscriberCount}</div>
                  </div>
                  {kitStats.broadcasts?.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs text-slate-400">Recent Broadcasts</span>
                      {kitStats.broadcasts.slice(0, 5).map(b => (
                        <div key={b.id} className="flex items-center justify-between p-2 bg-slate-900/30 rounded-lg text-xs">
                          <span className="text-slate-300 truncate flex-1">{b.subject}</span>
                          {b.stats && (
                            <span className="text-slate-400 flex-shrink-0 ml-2">
                              {b.stats.open_rate ? `${(b.stats.open_rate * 100).toFixed(0)}% opens` : 'No stats'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Click Refresh to load Kit stats</p>
              )}
            </div>

            {/* Metrics History */}
            {Object.keys(campaign.metrics || {}).length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Weekly Trend</h3>
                <div className="space-y-2">
                  {Object.entries(campaign.metrics).sort().map(([weekKey, data]) => (
                    <div key={weekKey} className="flex items-center gap-4 text-xs">
                      <span className="text-slate-400 w-16">{weekKey.replace('week', 'Week ')}</span>
                      <div className="flex-1 flex items-center gap-4">
                        <span className="text-slate-300">{data.impressions || 0} imp</span>
                        <span className="text-slate-300">{data.profileViews || 0} views</span>
                        <span className="text-slate-300">{data.connections || 0} conn</span>
                        {data.companyEngagements && (
                          <span className="text-amber-400 truncate">{data.companyEngagements}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No campaign yet and not on step 1 */}
        {!strategy && currentStep !== 1 && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
            <Target className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No active campaign</p>
            <p className="text-sm text-slate-500 mt-1">Start by scanning jobs and generating a quarterly strategy in Step 1</p>
            <button onClick={() => setStep(1)} className="mt-4 px-4 py-2 bg-amber-500 text-slate-900 rounded-lg text-sm font-medium hover:bg-amber-400">
              Go to Step 1: Target
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
