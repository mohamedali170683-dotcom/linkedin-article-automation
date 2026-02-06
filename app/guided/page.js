'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, Loader2,
  RotateCcw, Undo2, Redo2, Image, FileText, Sparkles,
  BookOpen, CheckCircle2, Edit3, RefreshCw
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
  { id: 'opening', label: 'Opening', description: 'Hook & introduction' },
  { id: 'research', label: 'Research', description: 'Key findings & data' },
  { id: 'charts', label: 'Charts', description: 'Select visuals' },
  { id: 'body', label: 'Body', description: 'Main arguments' },
  { id: 'conclusion', label: 'Conclusion', description: 'Wrap-up & CTA' },
  { id: 'metadata', label: 'Finalize', description: 'Title & social' },
];

export default function GuidedEditor() {
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState([]);
  const [article, setArticle] = useState({
    opening: '',
    research: '',
    charts: [],
    body: '',
    conclusion: '',
    title: '',
    subtitle: '',
    teaserPost: '',
    twitterPost: '',
    hashtags: [],
    thumbnailConcept: '',
  });
  const [availableCharts, setAvailableCharts] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [editMode, setEditMode] = useState(null);
  const [customText, setCustomText] = useState('');

  // Save to history when article changes
  const saveToHistory = (newArticle) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newArticle)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setArticle(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setArticle(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };

  const selectWeek = async (week) => {
    setSelectedWeek(week);
    setCurrentStep(0);
    setArticle({
      opening: '',
      research: '',
      charts: [],
      body: '',
      conclusion: '',
      title: '',
      subtitle: '',
      teaserPost: '',
      twitterPost: '',
      hashtags: [],
      thumbnailConcept: '',
    });
    setHistory([]);
    setHistoryIndex(-1);
    setOptions([]);

    // Load available charts for this week
    try {
      const res = await fetch(`/api/guided/charts?week=${week.week}`);
      const data = await res.json();
      setAvailableCharts(data.charts || []);
    } catch (e) {
      console.error('Failed to load charts:', e);
    }
  };

  const generateOptions = async () => {
    if (!selectedWeek) return;

    setIsGenerating(true);
    setOptions([]);

    try {
      const stepId = STEPS[currentStep].id;
      const res = await fetch('/api/guided/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week: selectedWeek.week,
          step: stepId,
          article,
          availableCharts,
        }),
      });

      const data = await res.json();
      if (data.options) {
        setOptions(data.options);
      }
    } catch (e) {
      console.error('Generation failed:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectOption = (option) => {
    const stepId = STEPS[currentStep].id;
    const newArticle = { ...article };

    if (stepId === 'charts') {
      newArticle.charts = option.charts || [];
    } else if (stepId === 'metadata') {
      newArticle.title = option.title || '';
      newArticle.subtitle = option.subtitle || '';
      newArticle.teaserPost = option.teaserPost || '';
      newArticle.twitterPost = option.twitterPost || '';
      newArticle.hashtags = option.hashtags || [];
      newArticle.thumbnailConcept = option.thumbnailConcept || '';
    } else {
      newArticle[stepId] = option.content || option;
    }

    setArticle(newArticle);
    saveToHistory(newArticle);
    setOptions([]);
    setEditMode(null);
  };

  const saveCustomEdit = () => {
    const stepId = STEPS[currentStep].id;
    const newArticle = { ...article, [stepId]: customText };
    setArticle(newArticle);
    saveToHistory(newArticle);
    setEditMode(null);
    setCustomText('');
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setOptions([]);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setOptions([]);
    }
  };

  const getFullArticle = () => {
    const parts = [];
    if (article.opening) parts.push(article.opening);
    if (article.research) parts.push(article.research);
    if (article.body) parts.push(article.body);
    if (article.conclusion) parts.push(article.conclusion);
    return parts.join('\n\n');
  };

  const weekData = selectedWeek ? WEEKLY_CALENDAR.find(w => w.week === selectedWeek.week) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Guided Article Editor</h1>
              <p className="text-sm text-gray-500">Collaborate with AI step-by-step</p>
            </div>
          </div>

          {selectedWeek && (
            <div className="flex items-center gap-2">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                title="Undo"
              >
                <Undo2 className="w-5 h-5" />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                title="Redo"
              >
                <Redo2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {!selectedWeek ? (
          /* Week Selection */
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Select a Week to Begin</h2>
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
          <div className="grid grid-cols-3 gap-6">
            {/* Left: Steps & Options */}
            <div className="col-span-2 space-y-6">
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
                <div className="flex items-center justify-between">
                  {STEPS.map((step, idx) => (
                    <div key={step.id} className="flex items-center">
                      <button
                        onClick={() => { setCurrentStep(idx); setOptions([]); }}
                        className={`flex flex-col items-center ${
                          idx === currentStep
                            ? 'text-blue-600'
                            : idx < currentStep && article[step.id]
                              ? 'text-green-600'
                              : 'text-gray-400'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                          idx === currentStep
                            ? 'border-blue-600 bg-blue-50'
                            : idx < currentStep && article[step.id]
                              ? 'border-green-600 bg-green-50'
                              : 'border-gray-300'
                        }`}>
                          {idx < currentStep && article[step.id] ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span className="text-xs mt-1 font-medium">{step.label}</span>
                      </button>
                      {idx < STEPS.length - 1 && (
                        <div className={`w-12 h-0.5 mx-2 ${
                          idx < currentStep ? 'bg-green-400' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Step Content */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {STEPS[currentStep].label}
                    </h3>
                    <p className="text-sm text-gray-500">{STEPS[currentStep].description}</p>
                  </div>
                  <button
                    onClick={generateOptions}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {options.length > 0 ? 'Regenerate' : 'Generate'} Options
                  </button>
                </div>

                {/* Current Selection */}
                {article[STEPS[currentStep].id] && STEPS[currentStep].id !== 'charts' && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800">Current Selection</span>
                      <button
                        onClick={() => {
                          setEditMode('custom');
                          setCustomText(article[STEPS[currentStep].id]);
                        }}
                        className="text-sm text-green-700 hover:text-green-900 flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-4">
                      {article[STEPS[currentStep].id]}
                    </p>
                  </div>
                )}

                {/* Charts Step */}
                {STEPS[currentStep].id === 'charts' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Select which charts to include in your article. These will be placed after relevant paragraphs.
                    </p>

                    {availableCharts.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No charts available for this week.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {availableCharts.map((chart, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              const isSelected = article.charts.some(c => c.imageUrl === chart.imageUrl);
                              const newCharts = isSelected
                                ? article.charts.filter(c => c.imageUrl !== chart.imageUrl)
                                : [...article.charts, chart];
                              const newArticle = { ...article, charts: newCharts };
                              setArticle(newArticle);
                              saveToHistory(newArticle);
                            }}
                            className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                              article.charts.some(c => c.imageUrl === chart.imageUrl)
                                ? 'border-blue-500 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <img
                              src={chart.imageUrl}
                              alt={chart.caption}
                              className="w-full h-32 object-contain bg-gray-50"
                            />
                            <div className="p-2 bg-white">
                              <p className="text-xs text-gray-600 line-clamp-2">{chart.caption}</p>
                              {article.charts.some(c => c.imageUrl === chart.imageUrl) && (
                                <div className="flex items-center gap-1 mt-1 text-blue-600">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span className="text-xs font-medium">Selected</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Edit Mode */}
                {editMode === 'custom' && (
                  <div className="space-y-3">
                    <textarea
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      className="w-full h-48 p-3 border rounded-lg text-sm"
                      placeholder="Write your own content..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveCustomEdit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditMode(null); setCustomText(''); }}
                        className="px-4 py-2 border rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Generated Options */}
                {options.length > 0 && !editMode && STEPS[currentStep].id !== 'charts' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 font-medium">Choose an option:</p>
                    {options.map((option, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectOption(option)}
                        className="p-4 border rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            {STEPS[currentStep].id === 'metadata' ? (
                              <div className="space-y-2">
                                <p className="font-semibold text-gray-900">{option.title}</p>
                                <p className="text-sm text-gray-600">{option.subtitle}</p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {option.content || option}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        setEditMode('custom');
                        setCustomText('');
                      }}
                      className="w-full p-3 border-2 border-dashed rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400"
                    >
                      Write my own instead
                    </button>
                  </div>
                )}

                {/* Loading State */}
                {isGenerating && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">Generating options...</p>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <button
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                  >
                    <ArrowLeft className="w-4 h-4" /> Previous
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={currentStep === STEPS.length - 1}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-30"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Preview */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border p-4 sticky top-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Article Preview
                </h3>

                {article.title && (
                  <h4 className="font-bold text-lg text-gray-900 mb-1">{article.title}</h4>
                )}
                {article.subtitle && (
                  <p className="text-sm text-gray-600 mb-3 italic">{article.subtitle}</p>
                )}

                <div className="prose prose-sm max-w-none">
                  {article.opening && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 uppercase mb-1">Opening</p>
                      <p className="text-gray-700 whitespace-pre-wrap line-clamp-6">{article.opening}</p>
                    </div>
                  )}

                  {article.research && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 uppercase mb-1">Research</p>
                      <p className="text-gray-700 whitespace-pre-wrap line-clamp-6">{article.research}</p>
                    </div>
                  )}

                  {article.charts.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 uppercase mb-1">Charts ({article.charts.length})</p>
                      <div className="flex gap-2">
                        {article.charts.map((chart, idx) => (
                          <img
                            key={idx}
                            src={chart.imageUrl}
                            alt={chart.caption}
                            className="w-16 h-16 object-contain border rounded"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {article.body && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 uppercase mb-1">Body</p>
                      <p className="text-gray-700 whitespace-pre-wrap line-clamp-6">{article.body}</p>
                    </div>
                  )}

                  {article.conclusion && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 uppercase mb-1">Conclusion</p>
                      <p className="text-gray-700 whitespace-pre-wrap line-clamp-6">{article.conclusion}</p>
                    </div>
                  )}
                </div>

                {/* Word Count */}
                <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                  ~{getFullArticle().split(/\s+/).filter(Boolean).length} words
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
