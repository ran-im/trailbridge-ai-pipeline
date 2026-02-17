# TrailBridge AI Pipeline

A single-page web app that runs a live 3-agent AI pipeline in the browser. Built with vanilla HTML/CSS/JS (no frameworks, no build step).

## Quick Start

1. Open `index.html` in your browser (or serve via local server)
2. Enter your Anthropic API key in the input field
3. Click "Run Pipeline"

## API Key Setup

1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Enter it in the API key input field
3. Click "Save Key"

Your API key is stored in `sessionStorage` only — it never leaves your browser and is not saved to any server.

## How It Works

**Three AI Agents:**

1. **Scout** (Researcher) — Analyzes visitor session data, produces 3 personas + 5 funnel exit points
2. **Compass** (Designer) — Designs personalisation strategies per persona (on-site + off-site)
3. **Trailhead** (Communicator) — Writes 9 pieces of campaign content (email, push, homepage copy per persona)

Plus a 4th **Evaluator** agent that scores confidence in the results.

## Deployment to GitHub Pages

1. Create a new repository on GitHub
2. Push this folder's contents:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/trailbridge-ai-pipeline.git
   git push -u origin main
   ```
3. Go to repository Settings → Pages
4. Set Source to "Deploy from a branch"
5. Select `main` branch and `/ (root)` folder
6. Click Save

Your app will be live at: `https://YOUR_USERNAME.github.io/trailbridge-ai-pipeline/`

## File Structure

```
trailbridge-ai-pipeline/
├── index.html         # Main app shell + CSS
├── js/
│   ├── data.js        # Synthetic session data generator
│   ├── agents.js      # Agent prompts + prompt builders
│   ├── pipeline.js    # Orchestration + API calls
│   └── ui.js          # DOM rendering
└── README.md
```

## Features

- Dark theme with teal + orange accent colors
- Live progress bar across all 4 API calls
- Tabbed results view (Overview, Personas, Strategies, Campaigns, Confidence)
- Revenue recovery calculator with slider
- Export to PDF via browser print
- 100% client-side — no backend required

## Browser Support

Requires a modern browser with ES6 modules support. Tested on Chrome, Firefox, Safari, Edge.

## Security Notes

- API key is entered at runtime and stored only in sessionStorage
- No data is sent to any server except the Anthropic API
- Safe for public deployment — no secrets are hardcoded
