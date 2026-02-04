# LinkedIn Article Agent 🚀

Automated evidence-based content system for the "Human Psychology & Marketing" newsletter.

## What It Does

- **Every Monday 9 AM**: Automatically generates the week's article from your behavioral science library
- **Auto-publishes teaser posts** to LinkedIn and Twitter via Buffer
- **Dashboard** to preview, edit, and manually trigger content
- **52-week calendar** with all topics pre-mapped to library sources

## Quick Setup (5 minutes)

### Step 1: Set Up Buffer

1. Go to [buffer.com](https://buffer.com) and create an account (free tier works)
2. Connect your LinkedIn profile
3. Connect your Twitter/X account
4. Get your API token:
   - Go to https://buffer.com/developers/apps
   - Create a new app called "LinkedIn Article Agent"
   - Copy the **Access Token**

### Step 2: Deploy to Vercel

1. Push this code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add environment variables:
   - `ANTHROPIC_API_KEY`: Your Claude API key
   - `BUFFER_ACCESS_TOKEN`: From Buffer (Step 1)
   - `CRON_SECRET`: Generate a random string (e.g., `openssl rand -hex 32`)
4. Deploy!

### Step 3: You're Done!

- **Dashboard**: Visit your Vercel URL to manually generate/preview articles
- **Automation**: Every Monday at 9 AM, teaser posts publish automatically
- **Your only task**: Copy-paste the full article to LinkedIn (~60 seconds/week)

## Weekly Workflow

1. **Monday 9 AM**: System auto-generates content and publishes teaser posts
2. **When convenient**: Open dashboard, copy full article, paste to LinkedIn
3. **That's it!**

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key for article generation |
| `BUFFER_ACCESS_TOKEN` | Buffer API token for social publishing |
| `CRON_SECRET` | Protects the cron endpoint from unauthorized access |
| `NEXT_PUBLIC_BASE_URL` | Set automatically by Vercel |

## 52-Week Calendar

The system includes a full year of topics:

- **Q1**: Behavioral Science Foundations (Mental Availability, System 1/2, Social Proof, etc.)
- **Q2**: Applied Behavioral Marketing (Pre-suasion, Framing, Attention Economy, etc.)
- **Q3**: Effectiveness & Measurement (Brand ROI, GEO, Share of Search, etc.)
- **Q4**: Advanced Applications (Alchemy, Choice Overload, Behavioral Pricing, etc.)

## Local Development

```bash
npm install
cp .env.example .env.local
# Fill in your API keys
npm run dev
```

## Architecture

```
/app
  /api
    /generate    - Claude API for article generation
    /publish     - Buffer API for social posting
    /cron        - Weekly automation endpoint
  /lib
    /calendar.js - 52-week content calendar
  page.js        - Dashboard UI
```

## Built With

- Next.js 14
- Tailwind CSS
- Claude API (Anthropic)
- Buffer API
- Vercel Cron Jobs

---

Created for Mohamed Hamdy | WPP Media Germany
