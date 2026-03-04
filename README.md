# Catchlight — AI-Powered Thought Leadership Engine

A complete content production system for marketing thought leadership. Generates research-backed articles, LinkedIn posts, infographics, and videos from a curated knowledge library of 54 insights — then publishes across newsletters and social.

Built with Next.js 14, Claude (Anthropic), Vercel Blob, and deployed on Vercel.

**Live**: [linkedin-article-automation.vercel.app](https://linkedin-article-automation.vercel.app)

---

## Three Engines

### 1. Weekly Engine (`/weekly`) — Primary Workflow

A Sunday-to-Thursday content pipeline that turns one research article into a full week of LinkedIn content:

| Day | Content | Format |
|-----|---------|--------|
| **Sunday** | Deep research article (~3,000 words) | Newsletter + LinkedIn article |
| **Sunday** | Promotional teaser post | LinkedIn post |
| **Tuesday** | Infographic pill | LinkedIn post + visual infographic |
| **Wednesday** | Video pill | LinkedIn post + video |
| **Thursday** | Text pill | LinkedIn narrative post |

**How it works:**
1. Select a week (1-52) from the Catchlight calendar
2. Generate the Sunday article from structured research briefs (Claude)
3. Generate a promotional teaser for the article
4. Extract 3 insight pills — each takes a different angle from the article:
   - **Tuesday**: Data-driven with infographic brief + key data points
   - **Wednesday**: Forward-looking with 45-60s video narration script
   - **Thursday**: Narrative storytelling post
5. Create infographic/video in NotebookLM using the semi-auto workflow
6. Publish article to Kit (ConvertKit) as a draft broadcast

**Semi-Auto Media Workflow (Tuesday & Wednesday):**
- Click **"Copy Brief & Open NotebookLM"** — copies the AI-generated brief/script to clipboard and opens Google NotebookLM
- Create the infographic or video in NotebookLM (~30 seconds)
- Download and upload back to the app
- Media is stored permanently in Vercel Blob

**Additional features:**
- Claude Opus chat sidebar for article editing (AI-assisted rewrites)
- Image upload panel (3 slots for article images with position control)
- One-click copy for all LinkedIn posts (Taplio-ready)
- Per-piece status tracking (Not Started → Generated → Edited → Sent to Kit)

### 2. Catchlight Calendar (`/guided`)

A 52-week newsletter system focused on AI visibility and attention science:

- Choose from 52 pre-planned weekly topics ("Lights")
- Generate 2 article styles: "Sharp & Provocative" vs "Thoughtful & Nuanced"
- Embed research charts from the book library
- Publish to Kit as a draft broadcast or copy a LinkedIn teaser
- Generate audio narration via ElevenLabs

### 3. Career Command Center (`/career`)

A quarterly campaign wizard for building marketing authority:

- Scan for VP Marketing / CMO roles in DACH
- AI generates a 12-week content calendar across 6 knowledge domains
- Content grounded in named research (Kahneman, Sharp, Cialdini, Shotton, etc.)
- Track weekly metrics (impressions, profile views, connections)

---

## Project Structure

```
app/
  page.js                            # Home — links to /weekly, /guided, /career
  weekly/page.js                     # Weekly Engine (Sun-Thu pipeline)
  guided/page.js                     # Catchlight 52-week calendar
  career/page.js                     # Career Command Center

  api/
    weekly/
      article/route.js               # Generate Sunday article (Claude)
      extract/route.js               # Extract 3 insight pills from article
      promo/route.js                 # Generate promotional teaser post
      edit/route.js                  # AI-assisted article editing (Claude Opus)
      data/route.js                  # Week data persistence (Vercel Blob)
      image/route.js                 # Image & video upload (Vercel Blob)
    career/
      scan/route.js                  # Job market scanning
      strategy/route.js              # 12-week content calendar generation
      generate/route.js              # LinkedIn post & newsletter generation
      data/route.js                  # Campaign persistence
      kit-stats/route.js             # Kit broadcast metrics
    guided/
      articles/route.js              # Generate 2 article styles per week
      charts/route.js                # Research charts for a week
      generate/route.js              # Guided article generation
    publish/
      kit/route.js                   # Kit (ConvertKit) draft broadcast
      beehiiv/route.js               # Beehiiv draft post
    generate/route.js                # Full article from research briefs
    articles/route.js                # Article blob storage
    video/generate/route.js          # ElevenLabs audio narration

  lib/
    knowledge-base.js                # 6 domains, 54 curated research insights
    insight-matcher.js               # Match articles to knowledge base insights
    career-data.js                   # Author voice, newsletter prompt, constants
    catchlight-calendar.json         # 52-week topic calendar
    research-briefs.json             # Structured research content for articles
    book-pages-urls.json             # Chart/figure URLs keyed by week
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

# Newsletter publishing
KIT_API_SECRET=                  # ConvertKit API key

# Social publishing (optional)
LATE_API_KEY=                    # Late.dev scheduling
LATE_LINKEDIN_ACCOUNT_ID=       # LinkedIn account ID
LATE_TWITTER_ACCOUNT_ID=        # Twitter account ID

# Image generation (optional)
OPENAI_API_KEY=                  # DALL-E 3 header images

# Audio narration (optional)
ELEVENLABS_API_KEY=              # ElevenLabs text-to-speech

# Vercel Cron (optional)
CRON_SECRET=                     # Auth for cron endpoint

NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API Endpoints

### Weekly Engine

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/weekly/article` | POST | Generate Sunday research article |
| `/api/weekly/extract` | POST | Extract 3 insight pills from article |
| `/api/weekly/promo` | POST | Generate promotional teaser post |
| `/api/weekly/edit` | POST | AI-assisted article editing (Claude Opus) |
| `/api/weekly/data` | GET/POST | Load/save week data (Vercel Blob) |
| `/api/weekly/image` | POST/DELETE | Upload/delete images & videos |

### Career Command Center

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/career/scan` | POST | Scan job market |
| `/api/career/strategy` | POST | Generate 12-week content calendar |
| `/api/career/generate` | POST | Generate LinkedIn post or newsletter article |
| `/api/career/data` | GET/POST | Load/save campaign data |
| `/api/career/kit-stats` | GET | Fetch Kit broadcast metrics |

### Publishing

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/publish/kit` | POST | Create Kit (ConvertKit) draft broadcast |
| `/api/publish/beehiiv` | POST | Create Beehiiv draft post |

### Content & Media

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/generate` | POST | Full article from research briefs + DALL-E image |
| `/api/articles` | GET/POST | List/save articles in Vercel Blob |
| `/api/video/generate` | POST | ElevenLabs audio narration |

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **AI**: Claude Sonnet 4 + Claude Opus (Anthropic SDK)
- **Storage**: Vercel Blob
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Newsletter**: Kit (ConvertKit) API
- **Images**: DALL-E 3 (OpenAI)
- **Audio**: ElevenLabs text-to-speech
- **Infographics & Video**: Google NotebookLM (semi-auto workflow)
- **Deployment**: Vercel with GitHub auto-deploy

---

## Knowledge Base

The content engine is powered by a curated library of 54 research insights across 6 domains:

| Domain | Key Sources |
|--------|------------|
| **Behavioral Science** | Kahneman (System 1/2), Shotton (Choice Factory), Ariely, Thaler & Sunstein (Nudge) |
| **Brand Effectiveness** | Byron Sharp (How Brands Grow), Binet & Field (Long and Short), Romaniuk |
| **Consumer Psychology** | Google (Messy Middle), Will Storr (Status Game), Attention Economy |
| **Leadership & Strategy** | Kotter, Porter, Senge (Fifth Discipline) |
| **Marketing Innovation** | Carnegie Mellon (GEO), AI Visibility, Innovation Adoption |
| **Persuasion & Influence** | Cialdini (6 Principles + Pre-Suasion), Sutherland (Alchemy) |

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
