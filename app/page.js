'use client';

import { useState, useEffect } from 'react';
import { Calendar, FileText, Copy, Check, ChevronDown, ChevronRight, Loader2, Sparkles, Hash, Image, BookOpen, Send, Twitter, Linkedin, Clock, CheckCircle2, AlertCircle, Download } from 'lucide-react';

// 52-Week Calendar Data (imported inline for client component)
const WEEKLY_CALENDAR = [
  { week: 1, topic: "Mental Availability", sources: "Sharp, Romaniuk", quarter: 1 },
  { week: 2, topic: "System 1 vs System 2", sources: "Kahneman, Shotton", quarter: 1 },
  { week: 3, topic: "Social Proof", sources: "Cialdini, Shotton", quarter: 1 },
  { week: 4, topic: "Loss Aversion", sources: "Kahneman, Thaler", quarter: 1 },
  { week: 5, topic: "The Long and Short of It", sources: "Binet & Field", quarter: 1 },
  { week: 6, topic: "Anchoring Effect", sources: "Kahneman, Ariely", quarter: 1 },
  { week: 7, topic: "SOV/SOM Relationship", sources: "Binet & Field, Sharp", quarter: 1 },
  { week: 8, topic: "Reciprocity Principle", sources: "Cialdini", quarter: 1 },
  { week: 9, topic: "Choice Architecture", sources: "Thaler & Sunstein", quarter: 1 },
  { week: 10, topic: "Distinctive Brand Assets", sources: "Romaniuk", quarter: 1 },
  { week: 11, topic: "Scarcity Principle", sources: "Cialdini, Shotton", quarter: 1 },
  { week: 12, topic: "Mere Exposure Effect", sources: "Zajonc, Sharp", quarter: 1 },
  { week: 13, topic: "Q1 Synthesis", sources: "Multiple sources", quarter: 1 },
  { week: 14, topic: "Pre-suasion", sources: "Cialdini", quarter: 2 },
  { week: 15, topic: "Framing Effects", sources: "Kahneman, Thaler", quarter: 2 },
  { week: 16, topic: "The Attention Economy", sources: "Orlando Wood", quarter: 2 },
  { week: 17, topic: "Category Entry Points", sources: "Romaniuk", quarter: 2 },
  { week: 18, topic: "The Messy Middle", sources: "Google Research", quarter: 2 },
  { week: 19, topic: "Neuromarketing Fundamentals", sources: "Barden", quarter: 2 },
  { week: 20, topic: "Commitment & Consistency", sources: "Cialdini", quarter: 2 },
  { week: 21, topic: "The Fluency Heuristic", sources: "Kahneman, Alter", quarter: 2 },
  { week: 22, topic: "Emotional vs Rational Ads", sources: "Binet & Field, Wood", quarter: 2 },
  { week: 23, topic: "Authority Principle", sources: "Cialdini", quarter: 2 },
  { week: 24, topic: "The Peak-End Rule", sources: "Kahneman", quarter: 2 },
  { week: 25, topic: "Habit Formation", sources: "Wood, Duhigg", quarter: 2 },
  { week: 26, topic: "Q2 Synthesis", sources: "Multiple sources", quarter: 2 },
  { week: 27, topic: "Brand Building ROI", sources: "Binet & Field", quarter: 3 },
  { week: 28, topic: "Mental Availability Metrics", sources: "Romaniuk, Sharp", quarter: 3 },
  { week: 29, topic: "When Brands Go Dark", sources: "Ehrenberg-Bass", quarter: 3 },
  { week: 30, topic: "GEO: Generative Engine Optimization", sources: "GEO research", quarter: 3 },
  { week: 31, topic: "Share of Search", sources: "Les Binet", quarter: 3 },
  { week: 32, topic: "The Attention Payoff", sources: "Lumen, Wood", quarter: 3 },
  { week: 33, topic: "Double Jeopardy Law", sources: "Sharp", quarter: 3 },
  { week: 34, topic: "Advertising Elasticity", sources: "Binet & Field", quarter: 3 },
  { week: 35, topic: "The 95-5 Rule", sources: "Ehrenberg-Bass", quarter: 3 },
  { week: 36, topic: "Reach vs Frequency", sources: "Sharp, Ephron", quarter: 3 },
  { week: 37, topic: "Marketing Effectiveness Crisis", sources: "IPA studies", quarter: 3 },
  { week: 38, topic: "Attribution Reality", sources: "Various", quarter: 3 },
  { week: 39, topic: "Q3 Synthesis", sources: "Multiple sources", quarter: 3 },
  { week: 40, topic: "Alchemy: Magic of Irrational", sources: "Rory Sutherland", quarter: 4 },
  { week: 41, topic: "Choice Overload", sources: "Schwartz, Iyengar", quarter: 4 },
  { week: 42, topic: "Behavioral Biology", sources: "Sapolsky", quarter: 4 },
  { week: 43, topic: "AI Disclosure Effects", sources: "Recent research", quarter: 4 },
  { week: 44, topic: "Scientific Advertising Redux", sources: "Hopkins", quarter: 4 },
  { week: 45, topic: "Unity Principle", sources: "Cialdini", quarter: 4 },
  { week: 46, topic: "Behavioral Pricing", sources: "Ariely, Thaler", quarter: 4 },
  { week: 47, topic: "The Liking Principle", sources: "Cialdini", quarter: 4 },
  { week: 48, topic: "Cognitive Load Theory", sources: "Sweller", quarter: 4 },
  { week: 49, topic: "Availability Heuristic", sources: "Kahneman, Tversky", quarter: 4 },
  { week: 50, topic: "Status Quo Bias", sources: "Kahneman, Thaler", quarter: 4 },
  { week: 51, topic: "The IKEA Effect", sources: "Norton, Ariely", quarter: 4 },
  { week: 52, topic: "Annual Synthesis", sources: "All sources", quarter: 4 },
];

function getCurrentWeek() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

export default function Dashboard() {
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [expandedQuarter, setExpandedQuarter] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [activeTab, setActiveTab] = useState('article');
  const [publishStatus, setPublishStatus] = useState(null);
  const [savedWeeks, setSavedWeeks] = useState(new Set());
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const currentWeek = getCurrentWeek();

  useEffect(() => {
    loadSavedArticles();
  }, []);

  const loadSavedArticles = async () => {
    try {
      const response = await fetch('/api/articles');
      const data = await response.json();
      if (data.articles) {
        const weeks = new Set(data.articles.map(a => Number(a.week)).filter(Boolean));
        setSavedWeeks(weeks);
      }
    } catch {
      // Blob storage may not be configured yet
    }
  };

  const quarters = [
    { q: 1, name: "Q1: Behavioral Science Foundations", weeks: WEEKLY_CALENDAR.filter(w => w.quarter === 1) },
    { q: 2, name: "Q2: Applied Behavioral Marketing", weeks: WEEKLY_CALENDAR.filter(w => w.quarter === 2) },
    { q: 3, name: "Q3: Effectiveness & Measurement", weeks: WEEKLY_CALENDAR.filter(w => w.quarter === 3) },
    { q: 4, name: "Q4: Advanced Applications", weeks: WEEKLY_CALENDAR.filter(w => w.quarter === 4) },
  ];

  const generateArticle = async (week) => {
    setIsGenerating(true);
    setSelectedWeek(week);
    setGeneratedContent(null);
    setPublishStatus(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week: week.week })
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedContent(data.content);
        setSavedWeeks(prev => new Set([...prev, week.week]));
      } else {
        console.error('Generation failed:', data.error);
        alert('Failed to generate article. Check console for details.');
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Error generating article');
    }

    setIsGenerating(false);
  };

  const loadSavedArticle = async (week) => {
    setIsLoadingSaved(true);
    setSelectedWeek(week);
    setGeneratedContent(null);
    setPublishStatus(null);

    try {
      const response = await fetch(`/api/articles?week=${week.week}`);
      const data = await response.json();

      if (data.found) {
        setGeneratedContent(data.article.content);
      } else {
        alert('No saved article found for this week.');
      }
    } catch (error) {
      console.error('Load error:', error);
      alert('Error loading saved article');
    }

    setIsLoadingSaved(false);
  };

  const publishTeasers = async () => {
    if (!generatedContent) return;

    setIsPublishing(true);

    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkedinPost: generatedContent.teaserPost,
          twitterPost: generatedContent.twitterPost,
          hashtags: generatedContent.hashtags
        })
      });

      const data = await response.json();

      if (data.success) {
        setPublishStatus({ success: true, message: 'Posts scheduled via Late.dev!' });
      } else {
        setPublishStatus({ success: false, message: data.error || 'Failed to publish' });
      }
    } catch (error) {
      setPublishStatus({ success: false, message: error.message });
    }

    setIsPublishing(false);
  };

  const copyToClipboard = async (text, field) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatArticleForLinkedIn = () => {
    if (!generatedContent) return '';
    return `${generatedContent.title}\n\n${generatedContent.subtitle}\n\n${generatedContent.article}\n\n---\n\nSources:\n${generatedContent.citations?.join('\n') || ''}\n\n${generatedContent.hashtags?.join(' ') || ''}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">LinkedIn Article Agent</h1>
                <p className="text-gray-500">Human Psychology & Marketing - 52-Week System</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Current: Week {currentWeek}</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Auto-runs Mondays 9AM
              </span>
              {savedWeeks.size > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {savedWeeks.size} saved
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-4">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-900">52-Week Calendar</h2>
              </div>

              <div className="space-y-2">
                {quarters.map((quarter) => (
                  <div key={quarter.q} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedQuarter(expandedQuarter === quarter.q ? null : quarter.q)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="font-medium text-sm text-gray-700">{quarter.name}</span>
                      {expandedQuarter === quarter.q ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>

                    {expandedQuarter === quarter.q && (
                      <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
                        {quarter.weeks.map((week) => (
                          <div
                            key={week.week}
                            className={`w-full text-left p-2.5 rounded-lg text-sm transition-all ${
                              selectedWeek?.week === week.week
                                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                : week.week === currentWeek
                                ? 'bg-green-50 border border-green-200'
                                : 'border border-transparent'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">Week {week.week}</span>
                              <div className="flex items-center gap-1">
                                {savedWeeks.has(week.week) && (
                                  <span className="text-xs bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">SAVED</span>
                                )}
                                {week.week === currentWeek && (
                                  <span className="text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded">NOW</span>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mb-1.5">{week.topic}</div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => generateArticle(week)}
                                disabled={isGenerating || isLoadingSaved}
                                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                              >
                                Generate
                              </button>
                              {savedWeeks.has(week.week) && (
                                <button
                                  onClick={() => loadSavedArticle(week)}
                                  disabled={isGenerating || isLoadingSaved}
                                  className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                                >
                                  Load Saved
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
              {isGenerating || isLoadingSaved ? (
                <div className="flex flex-col items-center justify-center h-96">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                  <p className="text-gray-600 font-medium">
                    {isLoadingSaved ? 'Loading' : 'Generating'} Week {selectedWeek?.week} Article...
                  </p>
                  <p className="text-gray-500 text-sm mt-2">Topic: {selectedWeek?.topic}</p>
                  {isGenerating && (
                    <p className="text-gray-400 text-xs mt-4">Grounding in research library sources</p>
                  )}
                </div>
              ) : generatedContent ? (
                <div>
                  {/* Header with Actions */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b">
                    <div>
                      <div className="text-sm text-blue-600 font-medium mb-1">Week {selectedWeek?.week}</div>
                      <h2 className="text-xl font-bold text-gray-900">{generatedContent.title}</h2>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={publishTeasers}
                        disabled={isPublishing}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {isPublishing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Schedule Teasers
                      </button>
                    </div>
                  </div>

                  {/* Publish Status */}
                  {publishStatus && (
                    <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                      publishStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {publishStatus.success ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                      {publishStatus.message}
                    </div>
                  )}

                  {/* Tabs */}
                  <div className="flex border-b mb-4 overflow-x-auto">
                    {[
                      { id: 'article', label: 'Full Article', icon: FileText },
                      { id: 'linkedin', label: 'LinkedIn Post', icon: Linkedin },
                      { id: 'twitter', label: 'Twitter/X', icon: Twitter },
                      { id: 'citations', label: 'Citations', icon: BookOpen },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="min-h-[400px]">
                    {activeTab === 'article' && (
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <p className="text-gray-600 italic">{generatedContent.subtitle}</p>
                          <button
                            onClick={() => copyToClipboard(formatArticleForLinkedIn(), 'article')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                          >
                            {copiedField === 'article' ? (
                              <><Check className="w-4 h-4" /> Copied!</>
                            ) : (
                              <><Copy className="w-4 h-4" /> Copy Full Article</>
                            )}
                          </button>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                          <div className="prose max-w-none whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                            {generatedContent.article}
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {generatedContent.hashtags?.map((tag, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'linkedin' && (
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            <Linkedin className="w-5 h-5 text-blue-700" />
                            <h3 className="font-semibold text-gray-900">LinkedIn Teaser Post</h3>
                          </div>
                          <button
                            onClick={() => copyToClipboard(generatedContent.teaserPost + '\n\n' + generatedContent.hashtags?.join(' '), 'teaser')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            {copiedField === 'teaser' ? (
                              <><Check className="w-4 h-4" /> Copied!</>
                            ) : (
                              <><Copy className="w-4 h-4" /> Copy Post</>
                            )}
                          </button>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                          {generatedContent.teaserPost}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          This post will be scheduled via Late.dev when you click &quot;Schedule Teasers&quot;
                        </p>
                      </div>
                    )}

                    {activeTab === 'twitter' && (
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            <Twitter className="w-5 h-5 text-gray-800" />
                            <h3 className="font-semibold text-gray-900">Twitter/X Post</h3>
                          </div>
                          <button
                            onClick={() => copyToClipboard(generatedContent.twitterPost, 'twitter')}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                          >
                            {copiedField === 'twitter' ? (
                              <><Check className="w-4 h-4" /> Copied!</>
                            ) : (
                              <><Copy className="w-4 h-4" /> Copy Tweet</>
                            )}
                          </button>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-700">{generatedContent.twitterPost}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {generatedContent.twitterPost?.length || 0}/280 characters
                          </p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'citations' && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-gray-600" />
                          Sources & Citations
                        </h3>
                        <div className="space-y-2">
                          {generatedContent.citations?.map((citation, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                              <span className="text-xs font-medium text-gray-400 mt-0.5">{i + 1}.</span>
                              <span className="text-sm text-gray-700">{citation}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Select a Week to Generate</h3>
                  <p className="text-gray-500 text-sm max-w-md mb-4">
                    Choose a topic from the 52-week calendar to generate your complete article package,
                    grounded in your research library.
                  </p>
                  <button
                    onClick={() => {
                      const thisWeek = WEEKLY_CALENDAR.find(w => w.week === currentWeek);
                      if (thisWeek) generateArticle(thisWeek);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Generate This Week (Week {currentWeek})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-blue-900">Automation Status</h3>
              <p className="text-sm text-blue-700">Teaser posts auto-schedule to LinkedIn + Twitter via Late.dev</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">Late.dev Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Next run: Monday 9:00 AM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
