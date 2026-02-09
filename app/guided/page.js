'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, Check, Loader2,
  Undo2, Image, FileText, Sparkles, RefreshCw,
  Send, Video, Mail, Copy, CheckCircle, Sun
} from 'lucide-react';
import Link from 'next/link';

// Catchlight Calendar - AI Visibility + Attention Science
const CATCHLIGHT_CALENDAR = [
  { week: 1, light: "The Visibility-Attention Gap", hook: "Your brand appears in ChatGPT. Nobody clicks. Why?" },
  { week: 2, light: "The 11 Million Bit Filter", hook: "AI processes everything. Humans process almost nothing." },
  { week: 3, light: "Social Proof in the Algorithm", hook: "AI is counting your reviews. Here's what it sees." },
  { week: 4, light: "First Mention Wins", hook: "The first brand ChatGPT names sets the anchor. Is it you?" },
  { week: 5, light: "The Long Game in Instant Answers", hook: "Zero-click search rewards brands built over years." },
  { week: 6, light: "Category Entry Points Go Digital", hook: "AI doesn't search categories. It answers situations." },
  { week: 7, light: "The Authority Signal", hook: "AI quotes experts. It ignores brands that talk like brands." },
  { week: 8, light: "The Novelty Paradox", hook: "AI loves familiar sources. Humans love surprises." },
  { week: 9, light: "Fluency in the Machine", hook: "Simple language ranks higher. In AI and in brains." },
  { week: 10, light: "The Distinctive Asset Test", hook: "Would ChatGPT recognize your brand without your name?" },
  { week: 11, light: "Scarcity Doesn't Scale", hook: "AI makes everything available. Scarcity tactics are dying." },
  { week: 12, light: "Repetition Without Annoyance", hook: "AI surfaces your brand repeatedly. Are you building or burning?" },
  { week: 13, light: "Q1 Synthesis: The New Visibility Stack", hook: "Three months of signals. One framework." },
  { week: 14, light: "Pre-suasion in Pre-Search", hook: "Users form preferences before they type." },
  { week: 15, light: "Framing the AI Answer", hook: "Same facts, different frame, different brand wins." },
  { week: 16, light: "Right Brain, Left Brain, No Brain", hook: "AI has no hemispheres. Emotional content still wins." },
  { week: 17, light: "The Messy Middle Gets Messier", hook: "Google's messy middle now includes AI loops." },
  { week: 18, light: "Attention is the New Reach", hook: "AI reach is infinite. Attention is still scarce." },
  { week: 19, light: "The Context Collapse", hook: "AI strips context. Your brand appears next to anyone." },
  { week: 20, light: "Commitment in a Zero-Click World", hook: "Users get answers without visiting. How build commitment?" },
  { week: 21, light: "The Trust Transfer", hook: "Users trust ChatGPT. Does that trust transfer to you?" },
  { week: 22, light: "Emotional Salience in Rational Answers", hook: "AI gives logical answers. Winners add emotional texture." },
  { week: 23, light: "The Expertise Paradox", hook: "AI democratizes expertise. Real experts stand out more." },
  { week: 24, light: "Peak-End in AI Conversations", hook: "Users remember the last answer. Make sure it's you." },
  { week: 25, light: "Habit Loops for AI Search", hook: "Users build AI habits. Brands must fit inside them." },
  { week: 26, light: "Q2 Synthesis: The Attention Architecture", hook: "Building sustained visibility and attention." },
  { week: 27, light: "Share of Model", hook: "SOV becomes SOM. Share of Voice becomes Share of Model." },
  { week: 28, light: "The Data Moat", hook: "Proprietary data gets cited. Scraped content gets ignored." },
  { week: 29, light: "When Brands Go Dark in AI", hook: "Stop appearing. See what happens. The data is brutal." },
  { week: 30, light: "The GEO Playbook", hook: "SEO had 25 years. GEO has maybe 2. Here's the playbook." },
  { week: 31, light: "Citations as Currency", hook: "In AI search, being cited beats being ranked." },
  { week: 32, light: "The 3-Second Scan", hook: "AI answers get skimmed. Here's what eyes actually see." },
  { week: 33, light: "Double Jeopardy Goes Digital", hook: "Small brands suffer twice in AI recommendations." },
  { week: 34, light: "The Elasticity Question", hook: "What's the ROI of AI visibility? Here's what we know." },
  { week: 35, light: "The 95-5 Rule in AI", hook: "95% aren't buying today. AI reaches all of them." },
  { week: 36, light: "Reach vs. Frequency in Infinite Reach", hook: "AI provides infinite reach. Frequency still matters." },
  { week: 37, light: "The Attribution Illusion", hook: "You can't track what AI drove. But it drove something." },
  { week: 38, light: "The Recency Trap", hook: "AI favors recent content. Evergreen still builds brands." },
  { week: 39, light: "Q3 Synthesis: Measurement in the Age of AI", hook: "What we can measure and what we can't." },
  { week: 40, light: "The Alchemy of AI Optimization", hook: "Some things that shouldn't work in AI, work." },
  { week: 41, light: "Choice Overload in Infinite Options", hook: "AI can recommend everything. Users want three options." },
  { week: 42, light: "The Biology of Brand Recall", hook: "Your brand lives in neurons. AI can't replicate that." },
  { week: 43, light: "When AI Says 'Made with AI'", hook: "Disclosure changes trust. Here's how much." },
  { week: 44, light: "Scientific Advertising, Again", hook: "Hopkins wrote the playbook in 1923. AI is rewriting it." },
  { week: 45, light: "The Unity Effect", hook: "Shared identity beats shared interest. In AI and in life." },
  { week: 46, light: "Price in the AI Answer", hook: "When AI shows prices, behavioral pricing still works." },
  { week: 47, light: "Liking the Machine", hook: "Users like ChatGPT. That liking transfers to brands." },
  { week: 48, light: "Cognitive Load in the AI Interface", hook: "AI reduces load. Brands that add load lose." },
  { week: 49, light: "Availability in the Age of AI", hook: "What's easy to recall beats what's easy to find." },
  { week: 50, light: "Status Quo in a Disrupted World", hook: "Users default to familiar brands. Even when AI suggests new." },
  { week: 51, light: "The IKEA Effect in Content", hook: "Content users participate in gets remembered." },
  { week: 52, light: "Annual Synthesis: The Year in Lights", hook: "52 Lights. One coherent view." },
];

const STEPS = [
  { id: 'style', label: 'Choose Voice', description: 'Pick your Light\'s tone' },
  { id: 'images', label: 'Add Visuals', description: 'Select supporting charts' },
  { id: 'preview', label: 'Review & Publish', description: 'Edit and send' },
];

export default function GuidedEditor() {
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [articleOptions, setArticleOptions] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedCharts, setSelectedCharts] = useState([]);
  const [availableCharts, setAvailableCharts] = useState([]);
  const [history, setHistory] = useState([]);
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [copied, setCopied] = useState(false);

  const publishToKit = async () => {
    if (!selectedArticle || !editedContent) return;

    setIsPublishing(true);
    setPublishStatus(null);

    try {
      const res = await fetch('/api/publish/kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedArticle.title,
          subtitle: selectedArticle.subtitle,
          content: editedContent,
          charts: selectedCharts,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPublishStatus({
          type: 'success',
          message: data.message || 'Light saved as draft!',
          dashboardUrl: data.dashboardUrl
        });
      } else {
        let errorMsg = data.error || 'Failed to publish';
        if (data.hint) errorMsg += ` (${data.hint})`;
        if (data.details) {
          console.error('Kit API details:', data.details);
        }
        setPublishStatus({ type: 'error', message: errorMsg });
      }
    } catch (e) {
      setPublishStatus({ type: 'error', message: e.message });
    } finally {
      setIsPublishing(false);
    }
  };

  const [videoResult, setVideoResult] = useState(null);

  const generateVideo = async () => {
    if (!selectedArticle || !editedContent) return;

    setIsGeneratingVideo(true);
    setVideoResult(null);

    try {
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedArticle.title,
          content: editedContent,
          charts: selectedCharts,
        }),
      });

      const data = await res.json();

      if (data.success && data.audioUrl) {
        setVideoResult({
          audioUrl: data.audioUrl,
          script: data.script,
          preview: data.videoPreview,
        });
      } else {
        alert(data.error || 'Failed to generate audio');
      }
    } catch (e) {
      alert('Audio generation failed: ' + e.message);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const [copiedTeaser, setCopiedTeaser] = useState(false);

  const copyFullArticle = () => {
    const fullContent = `${selectedArticle?.title}\n\n${selectedArticle?.subtitle ? selectedArticle.subtitle + '\n\n' : ''}${editedContent}`;
    navigator.clipboard.writeText(fullContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLinkedInTeaser = () => {
    const paragraphs = editedContent.split('\n\n').filter(p => p.trim());
    const hook = paragraphs[0]?.replace(/\*\*/g, '') || '';
    const secondPara = paragraphs[1]?.replace(/\*\*/g, '') || '';

    const teaser = `${hook}

${secondPara.length > 200 ? secondPara.substring(0, 200) + '...' : secondPara}

This week's Light explores where AI visibility meets attention science.

Read the full Light on Catchlight (link in comments)

#AIVisibility #BehavioralScience #Marketing`;

    navigator.clipboard.writeText(teaser);
    setCopiedTeaser(true);
    setTimeout(() => setCopiedTeaser(false), 2000);
  };

  const selectWeek = async (week) => {
    setSelectedWeek(week);
    setCurrentStep(0);
    setArticleOptions([]);
    setSelectedArticle(null);
    setSelectedCharts([]);
    setHistory([]);
    setEditedContent('');
    setPublishStatus(null);
    setVideoResult(null);

    // Load available charts for this week
    try {
      const res = await fetch(`/api/guided/charts?week=${week.week}`);
      const data = await res.json();
      setAvailableCharts(data.charts || []);
    } catch (e) {
      console.error('Failed to load charts:', e);
    }
  };

  const generateArticleOptions = async () => {
    if (!selectedWeek) return;
    setIsGenerating(true);
    setArticleOptions([]);

    try {
      const res = await fetch('/api/guided/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week: selectedWeek.week }),
      });

      const data = await res.json();
      if (data.options) {
        setArticleOptions(data.options);
      }
    } catch (e) {
      console.error('Generation failed:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectArticleOption = (option) => {
    setSelectedArticle(option);
    setEditedContent(option.content);
    setHistory([option.content]);
    setCurrentStep(1);
  };

  const toggleChart = (chart) => {
    const isSelected = selectedCharts.some(c => c.imageUrl === chart.imageUrl);
    if (isSelected) {
      setSelectedCharts(selectedCharts.filter(c => c.imageUrl !== chart.imageUrl));
    } else {
      setSelectedCharts([...selectedCharts, chart]);
    }
  };

  const undo = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setEditedContent(newHistory[newHistory.length - 1]);
    }
  };

  const saveEdit = (newContent) => {
    setEditedContent(newContent);
    setHistory([...history, newContent]);
    setIsEditing(false);
  };

  const goToPreview = () => {
    setCurrentStep(2);
  };

  const weekData = selectedWeek ? CATCHLIGHT_CALENDAR.find(w => w.week === selectedWeek.week) : null;
  const wordCount = editedContent ? editedContent.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur border-b border-slate-700 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-400" />
                <h1 className="text-xl font-semibold text-white">Catchlight</h1>
              </div>
              <p className="text-sm text-slate-400">Create your next Light</p>
            </div>
          </div>

          {selectedArticle && (
            <button
              onClick={undo}
              disabled={history.length <= 1}
              className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white disabled:opacity-30 border border-slate-600 rounded-lg"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" /> Undo
            </button>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        {!selectedWeek ? (
          /* Week Selection */
          <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Choose a Light</h2>
            <p className="text-slate-400 text-sm mb-6">Each Light bridges AI visibility with attention science</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {CATCHLIGHT_CALENDAR.map((week) => (
                <button
                  key={week.week}
                  onClick={() => selectWeek(week)}
                  className="p-4 text-left bg-slate-800 border border-slate-700 rounded-lg hover:border-amber-500/50 hover:bg-slate-700/50 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-amber-400 font-medium">Light #{week.week}</span>
                  </div>
                  <div className="text-sm font-medium text-white group-hover:text-amber-50">{week.light}</div>
                  <div className="text-xs text-slate-500 mt-1 line-clamp-1">{week.hook}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Light Header */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-400 text-sm font-medium">Light #{selectedWeek.week}</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white">{weekData?.light}</h2>
                  <p className="text-slate-400 text-sm mt-1">{weekData?.hook}</p>
                </div>
                <button
                  onClick={() => setSelectedWeek(null)}
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Change Light
                </button>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-4">
              <div className="flex items-center justify-center gap-4">
                {STEPS.map((step, idx) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                      idx === currentStep
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : idx < currentStep
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-slate-700/50 text-slate-500'
                    }`}>
                      {idx < currentStep ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-current bg-opacity-20 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                      )}
                      <span className="text-sm font-medium">{step.label}</span>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <ArrowRight className="w-4 h-4 mx-2 text-slate-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: Choose Style */}
            {currentStep === 0 && (
              <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Choose Your Voice</h3>
                    <p className="text-sm text-slate-400">Two approaches, same insight</p>
                  </div>
                  <button
                    onClick={generateArticleOptions}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-400 font-medium disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : articleOptions.length > 0 ? (
                      <RefreshCw className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {articleOptions.length > 0 ? 'Regenerate' : 'Generate Options'}
                  </button>
                </div>

                {isGenerating && (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <Loader2 className="w-10 h-10 animate-spin text-amber-400 mx-auto mb-4" />
                      <p className="text-slate-300">Crafting your Light...</p>
                      <p className="text-sm text-slate-500 mt-1">~15 seconds</p>
                    </div>
                  </div>
                )}

                {articleOptions.length > 0 && !isGenerating && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {articleOptions.map((option, idx) => (
                      <div
                        key={idx}
                        className="border border-slate-600 rounded-xl p-5 cursor-pointer hover:border-amber-500/50 hover:bg-slate-700/30 transition-all"
                        onClick={() => selectArticleOption(option)}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-slate-900 font-bold ${
                            idx === 0 ? 'bg-amber-400' : 'bg-slate-400'
                          }`}>
                            {idx === 0 ? 'A' : 'B'}
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">{option.styleName}</h4>
                            <p className="text-xs text-slate-400">{option.styleDescription}</p>
                          </div>
                        </div>

                        <p className="text-sm text-slate-300 line-clamp-4 mb-3">
                          {option.content.substring(0, 250)}...
                        </p>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{option.content.split(/\s+/).length} words</span>
                          <span className="text-amber-400 font-medium">Select →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {articleOptions.length === 0 && !isGenerating && (
                  <div className="text-center py-12 text-slate-500">
                    <Sun className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <p>Click "Generate Options" to create your Light</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Select Images */}
            {currentStep === 1 && (
              <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Add Visual Evidence</h3>
                    <p className="text-sm text-slate-400">Charts make insights stick</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCurrentStep(0)}
                      className="px-4 py-2 text-slate-400 hover:text-white"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={goToPreview}
                      className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-400 font-medium"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {availableCharts.length === 0 ? (
                  <div className="text-center py-12">
                    <Image className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400">No charts available for this Light</p>
                    <button
                      onClick={goToPreview}
                      className="mt-4 text-amber-400 hover:text-amber-300 font-medium"
                    >
                      Skip to preview →
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {availableCharts.map((chart, idx) => {
                      const isSelected = selectedCharts.some(c => c.imageUrl === chart.imageUrl);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleChart(chart)}
                          className={`relative border-2 rounded-xl overflow-hidden cursor-pointer transition-all ${
                            isSelected
                              ? 'border-amber-500 ring-2 ring-amber-500/30'
                              : 'border-slate-600 hover:border-slate-500'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-slate-900" />
                            </div>
                          )}
                          <img
                            src={chart.imageUrl}
                            alt={chart.caption}
                            className="w-full h-40 object-contain bg-white"
                          />
                          <div className="p-3 bg-slate-800">
                            <p className="text-xs text-slate-400 line-clamp-2">{chart.caption}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedCharts.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-sm text-amber-400">
                      <strong>{selectedCharts.length}</strong> chart{selectedCharts.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Preview & Edit */}
            {currentStep === 2 && (
              <div className="grid grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="col-span-2 bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Review Your Light</h3>
                      <p className="text-sm text-slate-400">{wordCount} words</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="px-4 py-2 text-slate-400 hover:text-white"
                      >
                        ← Back
                      </button>
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full h-96 p-4 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 font-mono text-sm"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => saveEdit(editedContent)}
                          className="px-5 py-2 bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-400 font-medium"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => {
                            setEditedContent(history[history.length - 1]);
                            setIsEditing(false);
                          }}
                          className="px-4 py-2 border border-slate-600 rounded-lg text-slate-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-lg max-w-none">
                      <h1 className="text-2xl font-bold text-white mb-2">{selectedArticle?.title}</h1>
                      {selectedArticle?.subtitle && (
                        <p className="text-slate-400 italic mb-6">{selectedArticle.subtitle}</p>
                      )}

                      {(() => {
                        const paragraphs = editedContent.split('\n\n').filter(p => p.trim());
                        const chartInsertPoints = selectedCharts.length > 0
                          ? selectedCharts.map((_, i) => Math.floor((i + 1) * paragraphs.length / (selectedCharts.length + 1)))
                          : [];

                        return paragraphs.map((para, idx) => (
                          <div key={idx}>
                            <p className="text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">{para}</p>
                            {chartInsertPoints.includes(idx) && (
                              <div className="my-6">
                                <img
                                  src={selectedCharts[chartInsertPoints.indexOf(idx)]?.imageUrl}
                                  alt={selectedCharts[chartInsertPoints.indexOf(idx)]?.caption}
                                  className="max-w-md mx-auto rounded-lg border border-slate-600"
                                />
                                <p className="text-xs text-slate-500 text-center mt-2 italic">
                                  {selectedCharts[chartInsertPoints.indexOf(idx)]?.caption}
                                </p>
                              </div>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  {/* Light Info */}
                  <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-400" /> This Light
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Style:</span>
                        <span className="text-slate-300">{selectedArticle?.styleName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Words:</span>
                        <span className="text-slate-300">{wordCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Charts:</span>
                        <span className="text-slate-300">{selectedCharts.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Publish Actions */}
                  <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/30 p-4">
                    <h4 className="font-semibold text-white mb-3">Send This Light</h4>

                    <div className="space-y-3">
                      {/* Step 1: Publish to Newsletter */}
                      <div className="pb-3 border-b border-amber-500/20">
                        <p className="text-xs text-slate-400 mb-2 font-medium">Step 1: Send to Light Catchers</p>
                        <button
                          onClick={publishToKit}
                          disabled={isPublishing}
                          className="w-full py-2.5 bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-400 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isPublishing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                          {isPublishing ? 'Sending...' : 'Send to Kit'}
                        </button>
                      </div>

                      {/* Step 2: Copy LinkedIn Teaser */}
                      <div className="pb-3 border-b border-amber-500/20">
                        <p className="text-xs text-slate-400 mb-2 font-medium">Step 2: Share on LinkedIn</p>
                        <button
                          onClick={copyLinkedInTeaser}
                          className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-medium flex items-center justify-center gap-2"
                        >
                          {copiedTeaser ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copiedTeaser ? 'Copied!' : 'Copy Teaser'}
                        </button>
                      </div>

                      {/* Generate Audio */}
                      <button
                        onClick={generateVideo}
                        disabled={isGeneratingVideo}
                        className="w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isGeneratingVideo ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Video className="w-4 h-4" />
                        )}
                        {isGeneratingVideo ? 'Generating...' : 'Generate Audio'}
                      </button>

                      {/* Copy Full */}
                      <button
                        onClick={copyFullArticle}
                        className="w-full py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 text-sm flex items-center justify-center gap-2"
                      >
                        {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied!' : 'Copy Full Light'}
                      </button>
                    </div>

                    {/* Status */}
                    {publishStatus && (
                      <div className={`mt-3 p-3 rounded text-sm ${
                        publishStatus.type === 'success'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        <p>{publishStatus.message}</p>
                        {publishStatus.dashboardUrl && (
                          <a
                            href={publishStatus.dashboardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-xs mt-1 block"
                          >
                            Open Kit Dashboard →
                          </a>
                        )}
                      </div>
                    )}

                    {/* Audio Result */}
                    {videoResult && (
                      <div className="mt-3 p-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
                        <p className="text-sm font-medium text-purple-300 mb-2">
                          Audio Ready!
                        </p>
                        <audio
                          controls
                          src={videoResult.audioUrl}
                          className="w-full mb-2"
                        />
                        <a
                          href={videoResult.audioUrl}
                          download="light-narration.mp3"
                          className="text-xs text-purple-400 hover:text-purple-300 underline"
                        >
                          Download MP3
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
