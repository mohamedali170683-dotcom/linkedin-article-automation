# Catchlight + Career Command Center

AI-powered thought leadership engine and career campaign system. Generates research-backed marketing content from a curated knowledge library of 54 insights, publishes to newsletters and LinkedIn, and manages quarterly career campaigns.

Built with Next.js 14, Claude (Anthropic), and deployed on Vercel.

**Live**: [linkedin-article-automation.vercel.app](https://linkedin-article-automation.vercel.app)

---

## Two Systems, One Platform

### 1. Career Command Center (`/career`)

A 4-step quarterly campaign wizard for building marketing authority:

| Step | What Happens |
|------|-------------|
| **Target** | Scan Google Jobs (SerpAPI) or AI deep search for VP Marketing / CMO roles in DACH. Star the ones you want to target this quarter. |
| **Create** | AI generates a 12-week content calendar across 6 knowledge domains, then writes LinkedIn posts and newsletter articles grounded in specific research. |
| **Publish** | Copy LinkedIn posts to clipboard or send newsletters to Kit (ConvertKit) as drafts. |
| **Track** | Log weekly metrics (impressions, profile views, connections) and monitor Kit broadcast stats. |

**Knowledge-first content** -- every piece of content is grounded in named research (Kahneman, Sharp, Cialdini, Shotton, Binet & Field, Sutherland, etc.) rather than personal achievements. The system draws from a curated library of 54 insights across 6 domains:

- **Behavioral Science** -- System 1/2, anchoring, pratfall effect, nudge theory, loss aversion
- **Brand Effectiveness** -- Mental availability, double jeopardy, 60/40 rule, ESOV, CEPs
- **Consumer Psychology** -- Messy middle, 95% unconscious mind, status games, attention economy
- **Leadership & Strategy** -- Kotter's 8 steps, transient advantage, learning organizations, value chains
- **Marketing Innovation** -- AI visibility, GEO, innovation adoption, agile marketing, omnichannel
- **Persuasion & Influence** -- Cialdini's 6 principles, pre-suasion, frame control, social proof

### 2. Catchlight Newsletter Engine (`/guided`)

A 52-week newsletter system focused on AI visibility and attention science:

- Choose from 52 pre-planned weekly topics ("Lights")
- Generate 2 article styles: "Sharp & Provocative" vs "Thoughtful & Nuanced"
- Embed research charts from the book library
- Publish to Kit as a draft broadcast or copy a LinkedIn teaser
- Generate audio narration via ElevenLabs

### 3. Automated Weekly Publishing

A Vercel Cron job (Mondays at 9 AM) can automatically:

1. Generate a full article from research briefs (Claude)
2. Create a DALL-E 3 header image
3. Save to Vercel Blob storage
4. Publish teaser posts to LinkedIn/Twitter via Late.dev

---

## How Content Generation Works

### Strategy Phase

The strategy endpoint receives starred target roles and generates a 12-week plan:

- 2 LinkedIn posts per week, rotating across knowledge domains
- 1 newsletter every 2 weeks, weaving multiple insights together
- Each content piece references a specific curated insight (e.g. `bs-003` = Shotton's Pratfall Effect)
- Target role requirements are used for subtle capability alignment, never explicit mention

### Generation Phase

When you click "Generate" on a content piece:

1. The system looks up the curated insight by ID from `knowledge-base.js`
2. Injects the researcher, framework, and key finding into the prompt
3. Claude writes research-first content with a practitioner interpretation
4. Target roles inform the tone subtly -- the content never names employers, clients, or products

### Example Output

A LinkedIn post generated from insight `bs-003` (Pratfall Effect):

> *The brands that admit their flaws outperform the ones that claim perfection.*
>
> *This isn't marketing wisdom. It's cognitive science.*
>
> *Richard Shotton documents this in "The Choice Factory" through the pratfall effect...*

---

## Project Structure

```
app/
  page.js                          # Home -- links to /guided and /career
  career/page.js                   # Career Command Center (4-step wizard)
  guided/page.js                   # Catchlight newsletter engine

  api/
    career/
      scan/route.js                # Job search (SerpAPI + Claude fallback)
      strategy/route.js            # 12-week content calendar generation
      generate/route.js            # LinkedIn post & newsletter generation
      data/route.js                # Campaign persistence (Vercel Blob)
      kit-stats/route.js           # Kit broadcast metrics
    guided/
      articles/route.js            # Generate 2 article styles per week
      charts/route.js              # Fetch available charts for a week
    publish/
      route.js                     # Late.dev social scheduling
      kit/route.js                 # ConvertKit draft broadcast
      beehiiv/route.js             # Beehiiv draft post
    generate/route.js              # Weekly article generator from research briefs
    articles/route.js              # Blob storage for articles
    video/generate/route.js        # ElevenLabs audio narration
    cron/route.js                  # Weekly automated publishing

  lib/
    knowledge-base.js              # 6 domains, 54 curated research insights
    career-data.js                 # Author voice, newsletter prompt, constants
    calendar.js                    # Article scheduling logic
    catchlight-calendar.json       # 52-week topic calendar
    research-briefs.json           # Structured research content for articles
    book-pages-urls.json           # Chart/figure URLs keyed by week
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Vercel account (for Blob storage and deployment)
- Anthropic API key (Claude)

### Install

```bash
git clone https://github.com/mohamedali170683-dotcom/linkedin-article-automation.git
cd linkedin-article-automation
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
# Required
ANTHROPIC_API_KEY=               # Claude API key
BLOB_READ_WRITE_TOKEN=           # Vercel Blob storage token
CRON_SECRET=                     # Authentication for cron endpoint

# Newsletter
KIT_API_SECRET=                  # ConvertKit API key

# Job scanning (optional -- falls back to Claude search)
SERPAPI_KEY=                     # SerpAPI for Google Jobs

# Social publishing (optional)
LATE_API_KEY=                    # Late.dev scheduling
LATE_LINKEDIN_ACCOUNT_ID=       # LinkedIn account ID
LATE_TWITTER_ACCOUNT_ID=        # Twitter account ID

# Image & audio (optional)
OPENAI_API_KEY=                  # DALL-E 3 header images
ELEVENLABS_API_KEY=              # Audio narration

# Alternate newsletter platform (optional)
BEEHIIV_API_KEY=                 # Beehiiv publishing
BEEHIIV_PUBLICATION_ID=          # Beehiiv publication ID

NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API Endpoints

### Career Command Center

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/career/scan` | POST | Scan job market (SerpAPI or Claude fallback) |
| `/api/career/strategy` | POST | Generate 12-week content calendar by knowledge domain |
| `/api/career/generate` | POST | Generate LinkedIn post or newsletter article from curated insight |
| `/api/career/data` | GET/POST | Load/save campaign data (Vercel Blob) |
| `/api/career/kit-stats` | GET | Fetch Kit broadcast metrics and subscriber count |

### Catchlight Newsletter

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/guided/articles` | POST | Generate 2 article styles for a given week |
| `/api/guided/charts` | GET | Get available research charts for a week |

### Publishing

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/publish` | POST | Schedule posts to LinkedIn/Twitter via Late.dev |
| `/api/publish/kit` | POST | Create Kit (ConvertKit) draft broadcast |
| `/api/publish/beehiiv` | POST | Create Beehiiv draft post |

### Content & Media

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/generate` | POST | Full article generation from research briefs |
| `/api/articles` | GET/POST | List/save articles in Vercel Blob |
| `/api/video/generate` | POST | Generate ElevenLabs audio narration |
| `/api/cron` | GET | Weekly automated generation + publishing |

---

## Tech Stack

- **Framework**: Next.js 14.0.4 (App Router)
- **AI**: Claude claude-sonnet-4-20250514 (Anthropic SDK)
- **Storage**: Vercel Blob
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Newsletter**: Kit (ConvertKit) API
- **Job Search**: SerpAPI (Google Jobs)
- **Social**: Late.dev scheduling API
- **Images**: DALL-E 3 (OpenAI)
- **Audio**: ElevenLabs text-to-speech
- **Deployment**: Vercel with GitHub auto-deploy

---

## Knowledge Base

The content engine is powered by `knowledge-base.js`, a curated library of 54 research insights extracted from marketing science, behavioral economics, and strategy literature. Key sources:

| Author | Work | Domain |
|--------|------|--------|
| Daniel Kahneman | Thinking, Fast and Slow | Behavioral Science |
| Richard Shotton | The Choice Factory, The Illusion of Choice | Behavioral Science |
| Dan Ariely | Predictably Irrational | Behavioral Science |
| Thaler & Sunstein | Nudge | Behavioral Science |
| Rory Sutherland | Alchemy | Behavioral Science / Persuasion |
| Byron Sharp | How Brands Grow | Brand Effectiveness |
| Les Binet & Peter Field | The Long and the Short of It | Brand Effectiveness |
| Jenni Romaniuk | Building Distinctive Brand Assets | Brand Effectiveness |
| Robert Cialdini | Influence, Pre-Suasion | Persuasion & Influence |
| Google Research | Decoding Decisions (Messy Middle) | Consumer Psychology |
| Will Storr | The Status Game, The Science of Storytelling | Consumer Psychology |
| John Kotter | Leading Change | Leadership & Strategy |
| Michael Porter | Competitive Strategy | Leadership & Strategy |
| Peter Senge | The Fifth Discipline | Leadership & Strategy |
| Carnegie Mellon | GEO: Generative Engine Optimization | Marketing Innovation |

Each insight includes the framework name, key finding, content hooks, and suggested angles for both LinkedIn and newsletter formats.

---

## Deployment

Push to `main` triggers automatic Vercel deployment.

```bash
npm run build    # Verify build passes locally
git push         # Deploy to Vercel
```

Make sure all required environment variables are set in your Vercel project settings.

---

## License

Private project.

---

## Research Sources

- Ehrenberg-Bass Institute
- IPA / WARC Effectiveness Database
- Google Messy Middle Research
- Carnegie Mellon GEO Research
- LinkedIn B2B Institute / ESOV Research
