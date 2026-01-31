# CivicPulse

Your voice in policies that impact your community.

CivicPulse helps US residents discover local, state and national bills that they might care about: in one way or another! Right now for the cOmpile hackathon it is hard coded for California State bills only.

## Features

- **Personalized Bill Matching** — Set your positions on 15 policy issues (housing, environment, economy, etc.) and get bills matched to your values
- **AI-Powered Analysis** — Claude analyzes each bill and explains why you'd likely support or oppose it
- **One-Tap Calling** — Find your state Senator and Assembly member, with phone numbers ready to dial
- **Smart Call Scripts** — AI-generated scripts tailored to each bill's current status (committee, floor vote, etc.)
- **Offline Caching** — Bill analyses and scripts are cached locally so repeat visits are instant

## Screenshots

| Onboarding | Bill Cards | Call Your Rep |
|------------|-----------|---------------|
| Set your policy positions | Swipe through matched bills | One tap to call with script |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Anthropic Claude API
- **Data**: Open States API (California bills & legislators)
- **Fonts**: Bebas Neue, Fira Sans, JetBrains Mono

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- API keys for Anthropic and Open States

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Anthropic API key for Claude
# Get one at https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-...

# Open States API key for bill/legislator data
# Get one at https://openstates.org/accounts/register/
OPEN_STATES_API_KEY=...
```

### Installation

```bash
# Clone the repo
git clone https://github.com/emilyyidan/civicpulse.git
cd civicpulse

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## How It Works

1. **Enter your zip code** — Currently limited to San Francisco (94xxx) for the MVP
2. **Set your positions** — Slide through 15 policy issues to indicate your stance
3. **Browse matched bills** — See bills analyzed against your preferences with support/oppose recommendations
4. **Call your rep** — Select a bill, get an AI-generated call script, and dial your representative

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── bills/          # Fetch CA bills from Open States
│   │   ├── representatives/ # Geo-lookup for legislators
│   │   ├── analyze-bills/  # Claude bill analysis
│   │   └── generate-script/ # Claude call script generation
│   ├── page.tsx            # Main app (step-based flow)
│   └── globals.css         # Tailwind + custom styles
├── components/
│   ├── ZipCodeEntry.tsx    # Zip code input
│   ├── IssueCarousel.tsx   # Policy preference sliders
│   ├── IssueSlider.tsx     # Individual issue slider
│   └── BillsList.tsx       # Bill cards with analysis
├── lib/
│   ├── claude.ts           # Anthropic API integration
│   ├── openstates.ts       # Open States API client
│   ├── api-client.ts       # Frontend API helpers
│   └── cache.ts            # LocalStorage caching
├── data/
│   └── issues.ts           # 15 policy issues config
└── types/
    ├── index.ts            # App types
    └── openstates.ts       # API response types
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bills` | GET | Fetch recent California bills |
| `/api/bills/[id]` | GET | Get a specific bill |
| `/api/representatives` | GET | Find legislators by zip code |
| `/api/analyze-bills` | POST | Analyze bills against user preferences |
| `/api/generate-script` | POST | Generate a call script for a bill |

## Deployment

Deploy on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/emilyyidan/civicpulse&env=ANTHROPIC_API_KEY,OPEN_STATES_API_KEY)

Or manually:

```bash
npm run build
npm start
```

## Contributing

This project was built for a hackathon. Contributions welcome!

## License

MIT

---

Built with Claude by Emily Wang
