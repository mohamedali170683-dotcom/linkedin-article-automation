# Catchlight

**Where AI Visibility Meets the Science of Attention**

A newsletter automation platform that generates weekly "Lights" - short, research-backed insights bridging AI visibility (how brands appear in ChatGPT, Perplexity, Gemini) with behavioral science (how human attention actually works).

---

## What is Catchlight?

Catchlight is an automated content creation system designed for marketing professionals who need to understand the emerging intersection of:

- **AI Visibility**: How brands are surfaced, cited, and recommended by Large Language Models
- **Attention Science**: Behavioral economics, cognitive psychology, and how humans actually process information

Each weekly issue is called a **Light**. Subscribers are **Light Catchers**.

---

## Features

### Guided Light Editor
A 3-step workflow to create publication-ready newsletter content:

1. **Choose Voice** - Generate two AI-written options with different tones:
   - *Sharp & Provocative*: Contrarian, challenges conventional wisdom
   - *Thoughtful & Nuanced*: Balanced, acknowledges complexity

2. **Add Visuals** - Select from extracted research charts and data visualizations

3. **Review & Publish** - Edit, preview with inline charts, then:
   - Send to Kit (ConvertKit) as newsletter draft
   - Copy LinkedIn teaser with hashtags
   - Generate AI voice narration (ElevenLabs)

### 52-Week Content Calendar
Pre-mapped topics covering the full AI visibility + attention science landscape:

| Quarter | Theme | Example Lights |
|---------|-------|----------------|
| Q1 | Foundations | "The Visibility-Attention Gap", "The 11 Million Bit Filter", "First Mention Wins" |
| Q2 | Applied Science | "Pre-suasion in Pre-Search", "The Messy Middle Gets Messier", "Emotional Salience in Rational Answers" |
| Q3 | Measurement | "Share of Model", "The GEO Playbook", "Citations as Currency" |
| Q4 | Advanced | "The Alchemy of AI Optimization", "Cognitive Load in the AI Interface", "Status Quo in a Disrupted World" |

### Multi-Channel Publishing
- **Newsletter-First**: Full Light goes to Kit (ConvertKit) subscribers
- **LinkedIn Teaser**: Auto-generated hook + call-to-action
- **Audio Narration**: ElevenLabs voice generation for podcast/video repurposing

---

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CATCHLIGHT SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│   │   Content    │    │     AI       │    │  Publishing  │    │
│   │   Calendar   │───▶│  Generation  │───▶│   Channels   │    │
│   │              │    │              │    │              │    │
│   │ 52 weeks of  │    │ Claude API   │    │ • Kit (email)│    │
│   │ AI + Attn    │    │ generates    │    │ • LinkedIn   │    │
│   │ topics       │    │ 2 voice      │    │ • Audio/Video│    │
│   │              │    │ options      │    │              │    │
│   └──────────────┘    └──────────────┘    └──────────────┘    │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │                    GUIDED EDITOR                          │ │
│   │                                                           │ │
│   │  Step 1: Voice    Step 2: Visuals    Step 3: Publish     │ │
│   │  ┌─────────┐      ┌─────────┐        ┌─────────┐         │ │
│   │  │ Sharp   │      │ Select  │        │ Kit     │         │ │
│   │  │   vs    │  ──▶ │ Charts  │   ──▶  │ LinkedIn│         │ │
│   │  │Nuanced  │      │         │        │ Audio   │         │ │
│   │  └─────────┘      └─────────┘        └─────────┘         │ │
│   └──────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Content Generation Flow

1. **User selects a Light** from the 52-week calendar
2. **Claude API generates** two versions with different voices
3. **User selects preferred version** and optionally adds charts
4. **Content is optimized** for 450-600 words (optimal newsletter length)
5. **User publishes** to newsletter, copies LinkedIn teaser, or generates audio

### Light Structure

Each Light follows a proven 5-part structure:

```
1. HOOK (1 line)
   - Pattern interrupt or provocative question

2. AI REALITY (100-150 words)
   - What's actually happening in LLMs
   - Real examples from ChatGPT/Perplexity/Gemini

3. BRAIN SCIENCE (100-150 words)
   - The psychology/behavioral science behind it
   - Academic research translated for practitioners

4. THE BRIDGE (100-150 words)
   - Where AI visibility and attention science connect
   - The non-obvious insight

5. TAKEAWAY (50 words)
   - One actionable principle
   - Written for skeptical marketing directors
```

---

## Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **Dark theme** with amber accents (Catchlight brand)

### Backend APIs
- **Claude API (Anthropic)** - Content generation with claude-3-5-sonnet
- **Kit (ConvertKit) API** - Newsletter draft creation
- **ElevenLabs API** - Voice synthesis for audio content
- **Vercel Blob** - Audio file storage

### Infrastructure
- **Vercel** - Hosting and serverless functions
- **Vercel Cron** - Scheduled automation (optional)
- **GitHub** - Version control

---

## Project Structure

```
linkedin-article-automation/
├── app/
│   ├── api/
│   │   ├── guided/
│   │   │   ├── articles/route.js    # Light generation (Claude API)
│   │   │   └── charts/route.js      # Chart retrieval
│   │   ├── publish/
│   │   │   ├── kit/route.js         # Kit newsletter publishing
│   │   │   └── beehiiv/route.js     # Legacy Beehiiv integration
│   │   ├── video/
│   │   │   └── generate/route.js    # ElevenLabs audio generation
│   │   ├── generate/route.js        # Legacy article generation
│   │   └── cron/route.js            # Scheduled automation
│   ├── guided/
│   │   └── page.js                  # Guided editor UI (main interface)
│   ├── lib/
│   │   ├── catchlight-calendar.json # 52-week content calendar
│   │   └── calendar.js              # Legacy calendar
│   ├── page.js                      # Home/dashboard
│   └── layout.js                    # Root layout
├── public/
│   └── charts/                      # Extracted research charts
├── package.json
└── README.md
```

---

## Setup Guide

### Prerequisites
- Node.js 18+
- Anthropic API key (Claude)
- Kit (ConvertKit) account + API secret
- ElevenLabs API key (optional, for audio)

### Step 1: Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/linkedin-article-automation.git
cd linkedin-article-automation
npm install
```

### Step 2: Environment Variables

Create `.env.local`:

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Newsletter (Kit/ConvertKit)
KIT_API_SECRET=...

# Audio Generation (Optional)
ELEVENLABS_API_KEY=...

# Vercel (auto-set in production)
BLOB_READ_WRITE_TOKEN=...
```

### Step 3: Get API Keys

**Anthropic (Claude)**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create API key
3. Add to `ANTHROPIC_API_KEY`

**Kit (ConvertKit)**
1. Go to [app.kit.com](https://app.kit.com)
2. Settings → Developer → API Secret
3. Add to `KIT_API_SECRET`

**ElevenLabs (Optional)**
1. Go to [elevenlabs.io](https://elevenlabs.io)
2. Profile → API Keys
3. Add to `ELEVENLABS_API_KEY`

### Step 4: Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000/guided` for the Catchlight editor.

### Step 5: Deploy to Vercel

```bash
vercel deploy
```

Or connect your GitHub repo to Vercel for automatic deployments.

---

## API Reference

### POST `/api/guided/articles`
Generate two Light options for a given week.

**Request:**
```json
{
  "week": 1
}
```

**Response:**
```json
{
  "options": [
    {
      "title": "The Visibility-Attention Gap",
      "subtitle": "Your brand appears in ChatGPT. Nobody clicks. Why?",
      "content": "...",
      "styleName": "Sharp & Provocative",
      "styleDescription": "Contrarian, challenges conventional wisdom"
    },
    {
      "title": "The Visibility-Attention Gap",
      "subtitle": "Your brand appears in ChatGPT. Nobody clicks. Why?",
      "content": "...",
      "styleName": "Thoughtful & Nuanced",
      "styleDescription": "Balanced, acknowledges complexity"
    }
  ]
}
```

### POST `/api/publish/kit`
Create a draft broadcast in Kit (ConvertKit).

**Request:**
```json
{
  "title": "Light title",
  "subtitle": "Optional subtitle",
  "content": "Light content in markdown",
  "charts": [{ "imageUrl": "...", "caption": "..." }]
}
```

### POST `/api/video/generate`
Generate AI voice narration using ElevenLabs.

**Request:**
```json
{
  "title": "Light title",
  "content": "Light content",
  "charts": []
}
```

**Response:**
```json
{
  "success": true,
  "audioUrl": "https://...",
  "script": "Condensed narration script"
}
```

---

## Content Calendar Preview

### Q1: Foundations (Weeks 1-13)
| Week | Light | Hook |
|------|-------|------|
| 1 | The Visibility-Attention Gap | Your brand appears in ChatGPT. Nobody clicks. Why? |
| 2 | The 11 Million Bit Filter | AI processes everything. Humans process almost nothing. |
| 3 | Social Proof in the Algorithm | AI is counting your reviews. Here's what it sees. |
| 4 | First Mention Wins | The first brand ChatGPT names sets the anchor. Is it you? |
| ... | ... | ... |

### Q2: Applied Science (Weeks 14-26)
| Week | Light | Hook |
|------|-------|------|
| 14 | Pre-suasion in Pre-Search | Users form preferences before they type. |
| 15 | Framing the AI Answer | Same facts, different frame, different brand wins. |
| 18 | Attention is the New Reach | AI reach is infinite. Attention is still scarce. |
| ... | ... | ... |

### Q3: Measurement (Weeks 27-39)
| Week | Light | Hook |
|------|-------|------|
| 27 | Share of Model | SOV becomes SOM. Share of Voice becomes Share of Model. |
| 30 | The GEO Playbook | SEO had 25 years. GEO has maybe 2. Here's the playbook. |
| 31 | Citations as Currency | In AI search, being cited beats being ranked. |
| ... | ... | ... |

### Q4: Advanced Applications (Weeks 40-52)
| Week | Light | Hook |
|------|-------|------|
| 40 | The Alchemy of AI Optimization | Some things that shouldn't work in AI, work. |
| 48 | Cognitive Load in the AI Interface | AI reduces load. Brands that add load lose. |
| 52 | Annual Synthesis: The Year in Lights | 52 Lights. One coherent view. |

---

## Brand Guidelines

### Terminology
- **Light**: A single newsletter issue (not "article" or "post")
- **Light Catchers**: Subscribers
- **Catchlight**: The newsletter brand

### Voice Characteristics
- Sharp, confident, data-driven
- Speaks to skeptical marketing directors
- Challenges conventional wisdom with evidence
- Never uses em-dashes
- Short paragraphs (2-3 sentences max)
- 450-600 words per Light

### Visual Identity
- **Primary**: Amber/gold (#F59E0B)
- **Background**: Dark slate (#0F172A, #1E293B)
- **Icon**: Sun (lucide-react)

---

## Roadmap

- [x] Core Light generation with Claude
- [x] Kit (ConvertKit) integration
- [x] ElevenLabs audio generation
- [x] 52-week AI + Attention calendar
- [x] Dark theme Catchlight UI
- [ ] Full video rendering with Remotion
- [ ] Automated weekly publishing (Vercel Cron)
- [ ] LinkedIn API integration (when available)
- [ ] Analytics dashboard

---

## License

MIT License - See LICENSE file

---

## Credits

Built by Mohamed Hamdy | WPP Media Germany

**Research Sources:**
- Ehrenberg-Bass Institute
- Daniel Kahneman (Thinking, Fast and Slow)
- Byron Sharp (How Brands Grow)
- Rory Sutherland (Alchemy)
- Robert Cialdini (Influence, Pre-Suasion)
- Les Binet & Peter Field (The Long and Short of It)

---

*Catchlight: Where AI visibility meets the science of attention.*
