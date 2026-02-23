export const PILLARS = [
  { id: "ai", label: "AI in Marketing", req: "#1", color: "#f59e0b", icon: "\u26A1", description: "7 AI products at WPP. What works vs hype." },
  { id: "demandgen", label: "Demand Gen", req: "#2", color: "#22c55e", icon: "\uD83D\uDCCA", description: "Total Search drives pipeline. Cross-channel attribution." },
  { id: "crossfunc", label: "Cross-Functional Teams", req: "#3+#4", color: "#a78bfa", icon: "\uD83D\uDD17", description: "40+ team. Kanban restructuring. C-suite clients." },
  { id: "brand", label: "Brand Visibility", req: "#5", color: "#f87171", icon: "\uD83D\uDC41", description: "AI Visibility Audit: brands in ChatGPT, Gemini." },
  { id: "enterprise", label: "Enterprise Scale", req: "#7", color: "#fb923c", icon: "\uD83C\uDFE2", description: "8-figure growth stories (anonymised)." },
  { id: "product", label: "Product Thinking", req: "#8", color: "#38bdf8", icon: "\uD83D\uDD27", description: "Built Share of Search, DemInt, TrendPulse." },
  { id: "transition", label: "Agency to Brand", req: "Auth", color: "#f472b6", icon: "\u2192", description: "Your transition journey openly. What agency brings." },
  { id: "dach", label: "DACH Landscape", req: "Mkt", color: "#818cf8", icon: "\uD83C\uDDE9\uD83C\uDDEA", description: "German digital trends. GDPR-first. Localisation." },
];

export const FIT_CRITERIA = [
  "Role values AI / MarTech / data-driven capability",
  "Team leadership scale matches (10-50+ people)",
  "Industry in range (Enterprise / Consumer / FMCG / Retail / Media > SaaS)",
  "You have evidence for 5+ of their listed requirements",
  "Geography accessible (DACH / Remote-friendly)",
];

export const STATUS_OPTIONS = [
  { value: "Identified", color: "#64748b" },
  { value: "Scored", color: "#f59e0b" },
  { value: "Pre-App Content", color: "#a78bfa" },
  { value: "Applied", color: "#3b82f6" },
  { value: "Interview", color: "#22c55e" },
  { value: "Rejected", color: "#ef4444" },
  { value: "Offer", color: "#10b981" },
];

export const CONTENT_STATUSES = {
  PENDING: 'pending',
  GENERATED: 'generated',
  EDITED: 'edited',
  PUBLISHED: 'published',
};

export const MOHAMED_CONTEXT = `Mohamed Ali Mohamed is a marketing leader transitioning from WPP Media (agency-side) to brand-side VP Marketing / CMO roles in DACH.

Key facts for content generation:
- Director of Search Marketing at WPP Media, Dusseldorf
- Leads 40+ professionals across Search, Social, and Programmatic
- Manages 15+ enterprise accounts: Deutsche Bank, Nestle, IKEA, Allianz, Sky, Continental, Harley-Davidson, Foot Locker, JustEat
- Built and shipped 7 AI-powered marketing products:
  1. AI Visibility Audit (tracks brands in ChatGPT, Gemini, Perplexity - won Nexus Innovation Award)
  2. DemInt (Demand Intelligence - Google Trends + AI for demand signals)
  3. TrendPulse (real-time trend detection for content teams)
  4. Share of Search (competitive visibility tracking across all search surfaces)
  5. DynMedia (dynamic media platform - 250K+ German subscriptions in 8 months)
  6. ContentIQ (AI-powered content quality scoring)
  7. PredictiveROI (ML-based budget allocation)
- Developed "Total Search" framework for cross-platform search visibility
- Restructured teams using Kanban methodology
- Experience across EMEA markets (Germany, UK, Nordics)
- 8-figure annual media budgets
- Languages: English (native), Arabic (native), German (professional)

Writing style: First person, confident but not arrogant. Uses specific numbers and real examples. Short paragraphs. Ends posts with engagement question. No emojis in body text. Professional but human.`;

export const NEWSLETTER_SYSTEM_PROMPT = `You are a strategic newsletter content generator for Mohamed Ali Mohamed's career transition campaign.

CONTEXT: ${MOHAMED_CONTEXT}

You write educational newsletter articles that demonstrate Mohamed's expertise to potential employers, industry peers, and subscribers. These articles serve a dual purpose:
1. Build Mohamed's thought leadership and personal brand
2. Subtly demonstrate capabilities that VP Marketing / CMO job descriptions in DACH demand

NEWSLETTER FORMAT:
- 1200-1800 words
- Educational and insightful, not self-promotional
- Include frameworks, data points, or actionable insights
- Use section headers (wrapped in **) to structure the article
- First person perspective: "In my experience..." not "Leaders should..."
- Include specific examples from Mohamed's work (clients, products, numbers)
- End with a thought-provoking question or call-to-action to reply
- Professional but accessible tone — like explaining to a smart peer
- No emojis. No hashtags.

WHEN TARGET ROLES ARE PROVIDED:
Subtly weave proof points that address specific JD requirements from target roles. Do NOT mention companies or roles. Instead, naturally demonstrate the capability they seek.`;

// Create empty campaign template
export function createCampaign(quarterLabel, startDate) {
  return {
    id: `campaign-${Date.now()}`,
    quarter: quarterLabel,
    startDate,
    endDate: new Date(new Date(startDate).getTime() + 12 * 7 * 86400000).toISOString().split('T')[0],
    currentStep: 1,
    targetRoles: [],
    strategy: null,
    content: {},
    metrics: {},
  };
}
