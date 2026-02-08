'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, Check, Loader2,
  Undo2, Image, FileText, Sparkles, RefreshCw,
  Send, Video, Mail, Copy, CheckCircle
} from 'lucide-react';
import Link from 'next/link';

// 52-Week Calendar Data
const WEEKLY_CALENDAR = [
  { week: 1, topic: "Mental Availability", sources: "Sharp, Romaniuk" },
  { week: 2, topic: "System 1 vs System 2", sources: "Kahneman, Shotton" },
  { week: 3, topic: "Social Proof", sources: "Cialdini, Shotton" },
  { week: 4, topic: "Loss Aversion", sources: "Kahneman, Thaler" },
  { week: 5, topic: "The Long and Short of It", sources: "Binet & Field" },
  { week: 6, topic: "Anchoring Effect", sources: "Kahneman, Ariely" },
  { week: 7, topic: "SOV/SOM Relationship", sources: "Binet & Field, Sharp" },
  { week: 8, topic: "Reciprocity Principle", sources: "Cialdini" },
  { week: 9, topic: "Choice Architecture", sources: "Thaler & Sunstein" },
  { week: 10, topic: "Distinctive Brand Assets", sources: "Romaniuk" },
  { week: 11, topic: "Scarcity Principle", sources: "Cialdini, Shotton" },
  { week: 12, topic: "Mere Exposure Effect", sources: "Zajonc, Sharp" },
  { week: 13, topic: "Q1 Synthesis", sources: "Multiple sources" },
  { week: 14, topic: "Pre-suasion", sources: "Cialdini" },
  { week: 15, topic: "Framing Effects", sources: "Kahneman, Thaler" },
  { week: 16, topic: "The Attention Economy", sources: "Orlando Wood" },
  { week: 17, topic: "Category Entry Points", sources: "Romaniuk" },
  { week: 18, topic: "The Messy Middle", sources: "Google Research" },
  { week: 19, topic: "Neuromarketing Fundamentals", sources: "Barden" },
  { week: 20, topic: "Commitment & Consistency", sources: "Cialdini" },
  { week: 21, topic: "The Fluency Heuristic", sources: "Kahneman, Alter" },
  { week: 22, topic: "Emotional vs Rational Ads", sources: "Binet & Field, Wood" },
  { week: 23, topic: "Authority Principle", sources: "Cialdini" },
  { week: 24, topic: "The Peak-End Rule", sources: "Kahneman" },
  { week: 25, topic: "Habit Formation", sources: "Wood, Duhigg" },
  { week: 26, topic: "Q2 Synthesis", sources: "Multiple sources" },
  { week: 27, topic: "Brand Building ROI", sources: "Binet & Field" },
  { week: 28, topic: "Mental Availability Metrics", sources: "Romaniuk, Sharp" },
  { week: 29, topic: "When Brands Go Dark", sources: "Ehrenberg-Bass" },
  { week: 30, topic: "GEO: Generative Engine Optimization", sources: "GEO research" },
  { week: 31, topic: "Share of Search", sources: "Les Binet" },
  { week: 32, topic: "The Attention Payoff", sources: "Lumen, Wood" },
  { week: 33, topic: "Double Jeopardy Law", sources: "Sharp" },
  { week: 34, topic: "Advertising Elasticity", sources: "Binet & Field" },
  { week: 35, topic: "The 95-5 Rule", sources: "Ehrenberg-Bass" },
  { week: 36, topic: "Reach vs Frequency", sources: "Sharp, Ephron" },
  { week: 37, topic: "Marketing Effectiveness Crisis", sources: "IPA studies" },
  { week: 38, topic: "Attribution Reality", sources: "Various" },
  { week: 39, topic: "Q3 Synthesis", sources: "Multiple sources" },
  { week: 40, topic: "Alchemy: Magic of Irrational", sources: "Rory Sutherland" },
  { week: 41, topic: "Choice Overload", sources: "Schwartz, Iyengar" },
  { week: 42, topic: "Behavioral Biology", sources: "Sapolsky" },
  { week: 43, topic: "AI Disclosure Effects", sources: "Recent research" },
  { week: 44, topic: "Scientific Advertising Redux", sources: "Hopkins" },
  { week: 45, topic: "Unity Principle", sources: "Cialdini" },
  { week: 46, topic: "Behavioral Pricing", sources: "Ariely, Thaler" },
  { week: 47, topic: "The Liking Principle", sources: "Cialdini" },
  { week: 48, topic: "Cognitive Load Theory", sources: "Sweller" },
  { week: 49, topic: "Availability Heuristic", sources: "Kahneman, Tversky" },
  { week: 50, topic: "Status Quo Bias", sources: "Kahneman, Thaler" },
  { week: 51, topic: "The IKEA Effect", sources: "Norton, Ariely" },
  { week: 52, topic: "Annual Synthesis", sources: "All sources" },
];

const STEPS = [
  { id: 'style', label: 'Choose Style', description: 'Pick your article tone & approach' },
  { id: 'images', label: 'Select Images', description: 'Choose charts to include' },
  { id: 'preview', label: 'Preview & Edit', description: 'Review and finalize' },
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
          message: data.message || 'Published to Kit as draft!',
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
        alert(data.error || 'Failed to generate video');
      }
    } catch (e) {
      alert('Video generation failed: ' + e.message);
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
    // Create a short teaser for LinkedIn that drives to newsletter
    const paragraphs = editedContent.split('\n\n').filter(p => p.trim());
    const hook = paragraphs[0]?.replace(/\*\*/g, '') || '';
    const secondPara = paragraphs[1]?.replace(/\*\*/g, '') || '';

    // Build teaser post
    const teaser = `${hook}

${secondPara.length > 200 ? secondPara.substring(0, 200) + '...' : secondPara}

Want the full breakdown with research citations and data?

Read the complete article on my newsletter (link in comments)

#BehavioralScience #Marketing #ConsumerPsychology`;

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

    // Load available charts
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
    setCurrentStep(1); // Move to images step
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

  const weekData = selectedWeek ? WEEKLY_CALENDAR.find(w => w.week === selectedWeek.week) : null;

  // Calculate word count
  const wordCount = editedContent ? editedContent.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Guided Editor</h1>
              <p className="text-sm text-gray-500">Choose style → Select images → Preview</p>
            </div>
          </div>

          {selectedArticle && (
            <button
              onClick={undo}
              disabled={history.length <= 1}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 border rounded-lg"
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
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Select a Week</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {WEEKLY_CALENDAR.map((week) => (
                <button
                  key={week.week}
                  onClick={() => selectWeek(week)}
                  className="p-3 text-left border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-sm font-medium text-gray-900">Week {week.week}</div>
                  <div className="text-xs text-gray-500 truncate">{week.topic}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Topic Header */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Week {selectedWeek.week}</div>
                  <h2 className="text-xl font-semibold text-gray-900">{weekData?.topic}</h2>
                  <div className="text-sm text-gray-500">Sources: {weekData?.sources}</div>
                </div>
                <button
                  onClick={() => setSelectedWeek(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Change week
                </button>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center justify-center gap-4">
                {STEPS.map((step, idx) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                      idx === currentStep
                        ? 'bg-blue-100 text-blue-700'
                        : idx < currentStep
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
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
                      <ArrowRight className="w-4 h-4 mx-2 text-gray-300" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: Choose Style */}
            {currentStep === 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Choose Your Article Style</h3>
                    <p className="text-sm text-gray-500">We'll generate 2 full article options with different approaches</p>
                  </div>
                  <button
                    onClick={generateArticleOptions}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
                      <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                      <p className="text-gray-600">Generating 2 article options...</p>
                      <p className="text-sm text-gray-400 mt-1">This takes about 30 seconds</p>
                    </div>
                  </div>
                )}

                {articleOptions.length > 0 && !isGenerating && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {articleOptions.map((option, idx) => (
                      <div
                        key={idx}
                        className="border-2 rounded-xl p-5 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
                        onClick={() => selectArticleOption(option)}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                            idx === 0 ? 'bg-blue-600' : 'bg-purple-600'
                          }`}>
                            {idx === 0 ? 'A' : 'B'}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{option.styleName}</h4>
                            <p className="text-xs text-gray-500">{option.styleDescription}</p>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-3">
                          <h5 className="font-medium text-gray-900 mb-1">{option.title}</h5>
                          {option.subtitle && (
                            <p className="text-sm text-gray-600 italic">{option.subtitle}</p>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-4 mb-3">
                          {option.content.substring(0, 300)}...
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{option.content.split(/\s+/).length} words</span>
                          <span className="text-blue-600 font-medium">Click to select →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {articleOptions.length === 0 && !isGenerating && (
                  <div className="text-center py-12 text-gray-500">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Click "Generate Options" to create 2 article variations</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Select Images */}
            {currentStep === 1 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Select Charts & Images</h3>
                    <p className="text-sm text-gray-500">Choose which visuals to include in your article</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCurrentStep(0)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-900"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={goToPreview}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Continue to Preview <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {availableCharts.length === 0 ? (
                  <div className="text-center py-12">
                    <Image className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No charts available for this week</p>
                    <button
                      onClick={goToPreview}
                      className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
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
                              ? 'border-blue-500 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <img
                            src={chart.imageUrl}
                            alt={chart.caption}
                            className="w-full h-40 object-contain bg-gray-50"
                          />
                          <div className="p-3 bg-white">
                            <p className="text-xs text-gray-600 line-clamp-2">{chart.caption}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedCharts.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
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
                <div className="col-span-2 bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Preview & Edit</h3>
                      <p className="text-sm text-gray-500">{wordCount} words</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900"
                      >
                        ← Back
                      </button>
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Edit Content
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full h-96 p-4 border rounded-lg font-mono text-sm"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => saveEdit(editedContent)}
                          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => {
                            setEditedContent(history[history.length - 1]);
                            setIsEditing(false);
                          }}
                          className="px-4 py-2 border rounded-lg text-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-lg max-w-none">
                      <h1 className="text-2xl font-bold mb-2">{selectedArticle?.title}</h1>
                      {selectedArticle?.subtitle && (
                        <p className="text-gray-600 italic mb-6">{selectedArticle.subtitle}</p>
                      )}

                      {/* Render content with charts inserted */}
                      {(() => {
                        const paragraphs = editedContent.split('\n\n').filter(p => p.trim());
                        const chartInsertPoints = selectedCharts.length > 0
                          ? selectedCharts.map((_, i) => Math.floor((i + 1) * paragraphs.length / (selectedCharts.length + 1)))
                          : [];

                        return paragraphs.map((para, idx) => (
                          <div key={idx}>
                            <p className="text-gray-800 leading-relaxed mb-4 whitespace-pre-wrap">{para}</p>
                            {chartInsertPoints.includes(idx) && (
                              <div className="my-6">
                                <img
                                  src={selectedCharts[chartInsertPoints.indexOf(idx)]?.imageUrl}
                                  alt={selectedCharts[chartInsertPoints.indexOf(idx)]?.caption}
                                  className="max-w-md mx-auto rounded-lg border shadow-sm"
                                />
                                <p className="text-xs text-gray-500 text-center mt-2 italic">
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
                  {/* Selected Charts */}
                  <div className="bg-white rounded-xl shadow-sm border p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Image className="w-4 h-4" /> Selected Charts
                    </h4>
                    {selectedCharts.length === 0 ? (
                      <p className="text-sm text-gray-500">No charts selected</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedCharts.map((chart, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <img
                              src={chart.imageUrl}
                              alt=""
                              className="w-12 h-12 object-contain rounded"
                            />
                            <p className="text-xs text-gray-600 flex-1 line-clamp-2">{chart.caption}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Article Info */}
                  <div className="bg-white rounded-xl shadow-sm border p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Article Info
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Style:</span>
                        <span className="text-gray-900">{selectedArticle?.styleName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Words:</span>
                        <span className="text-gray-900">{wordCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Charts:</span>
                        <span className="text-gray-900">{selectedCharts.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Final Actions */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Publish & Export</h4>

                    <div className="space-y-3">
                      {/* Step 1: Publish to Newsletter */}
                      <div className="pb-3 border-b border-blue-200">
                        <p className="text-xs text-gray-500 mb-2 font-medium">Step 1: Publish Article</p>
                        <button
                          onClick={publishToKit}
                          disabled={isPublishing}
                          className="w-full py-2.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isPublishing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                          {isPublishing ? 'Publishing...' : 'Send to Kit Newsletter'}
                        </button>
                      </div>

                      {/* Step 2: Copy LinkedIn Teaser */}
                      <div className="pb-3 border-b border-blue-200">
                        <p className="text-xs text-gray-500 mb-2 font-medium">Step 2: Promote on LinkedIn</p>
                        <button
                          onClick={copyLinkedInTeaser}
                          className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                        >
                          {copiedTeaser ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copiedTeaser ? 'Teaser Copied!' : 'Copy LinkedIn Teaser'}
                        </button>
                        <p className="text-xs text-gray-400 mt-1">Short post with link to newsletter</p>
                      </div>

                      {/* Optional: Copy Full Article */}
                      <button
                        onClick={copyFullArticle}
                        className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center justify-center gap-2"
                      >
                        {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied!' : 'Copy Full Article'}
                      </button>

                      {/* Generate Video */}
                      <button
                        onClick={generateVideo}
                        disabled={isGeneratingVideo}
                        className="w-full py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isGeneratingVideo ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Video className="w-4 h-4" />
                        )}
                        {isGeneratingVideo ? 'Generating...' : 'Generate Video'}
                      </button>
                    </div>

                    {/* Status message */}
                    {publishStatus && (
                      <div className={`mt-3 p-3 rounded text-sm ${
                        publishStatus.type === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <p>{publishStatus.message}</p>
                        {publishStatus.dashboardUrl && (
                          <a
                            href={publishStatus.dashboardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-700 underline text-xs mt-1 block"
                          >
                            Open Kit Dashboard →
                          </a>
                        )}
                      </div>
                    )}

                    {/* Video Result */}
                    {videoResult && (
                      <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm font-medium text-purple-800 mb-2">
                          Audio Narration Ready!
                        </p>
                        <audio
                          controls
                          src={videoResult.audioUrl}
                          className="w-full mb-2"
                        />
                        <a
                          href={videoResult.audioUrl}
                          download="narration.mp3"
                          className="text-xs text-purple-600 hover:text-purple-800 underline"
                        >
                          Download MP3
                        </a>
                        <p className="text-xs text-gray-500 mt-2">
                          {videoResult.preview?.sceneCount} scenes, {videoResult.preview?.estimatedDuration}
                        </p>
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
