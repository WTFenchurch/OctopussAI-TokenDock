# 🐙 Token Dock

**Your AI token command center — a studio-quality desktop companion that monitors every free token, every paid dollar, and every provider in your inference stack.**

Token Dock is an always-on-top Electron dock that sits on your screen while you work. It gives you real-time visibility into your AI usage — which providers are online, how many tokens you've burned, what's left in your daily budget, and exactly how much money you're saving by routing through free tiers first.

Built by developers, for developers running multi-provider free inference stacks.

---

## What Makes Token Dock Special

### 🐙 Otto — Your AI Companion
Otto is a studio-quality animated octopus who lives in Token Dock. He swims through an underwater world, chases and eats token coins, makes funny faces, winks at you, blows bubbles, and gets visited by sea creature friends. The more compute you use, the more active Otto becomes.

- **Real octopus anatomy** — bulbous mantle, side-mounted eyes with horizontal pupils, 8 tentacles from center beak
- **studio-quality rendering** — 5-layer lighting (key, fill, rim, subsurface scattering, ambient occlusion), 3 catchlights per eye
- **12 personality actions** — wink, tongue, raspberry, hearts, curl/unfurl, bubbles, and more
- **Jet propulsion swimming** — body pulses, tentacles trail behind, bubble jets
- **Sea creature visitors** — clownfish, turtle, eel, jellyfish, seahorse, pufferfish swim by every 7 seconds
- **Underwater world** — coral reef, seaweed, sponges, crab, light rays, marine snow, layered seafloor
- **3D spinning coins** — gold (Economy), sapphire (Standard), ember (Turbo) with real depth and shimmer

### 📊 Scientific Metering
- **Weighted savings** — real per-model pricing ($0.05-$0.69/1K) instead of flat estimates
- **Compute-reactive tokens** — coin count scales with actual API usage, hard-capped at 12 DOM elements
- **Tabular-nums everywhere** — numbers don't jitter when they change
- **Timezone-aware resets** — Gemini Pacific Time auto-detected via Intl API, Groq/OpenRouter/Mistral at UTC midnight
- **NaN-safe** — all percentage and formatting functions guard against bad data

### 🎨 Themes
- **7 free themes** — Midnight, Cobalt, Slate, Amethyst, Carbon, Galaxy, Claude Code
- **11 premium themes** — Hearts, Catppuccin, Dracula, Tokyo Night, Rose Pine, Synthwave, Nord, Gruvbox, Solarized, One Dark, Monokai
- Each theme tints the entire app including Otto's underwater world

### ⚡ 3-Speed Tier System
| Tier | Strategy | Otto |
|------|----------|------|
| 🌿 Economy | 100% free tokens — zero paid | Chill blue Otto, 3 coins, calm ocean |
| ⚡ Standard | Best free 70B models | Focused blue Otto, 5 coins, data streams |
| 🚀 Turbo | Free first, paid fallback | Intense orange Otto, 8 coins, warp speed |

---

## Features

- **Always-on-top dock** — pins to the side of your screen
- **Task-aware budgets** — tracks tokens across Simple, Medium, Complex, and Code tiers
- **Provider health monitoring** — live status for Ollama, Groq, Gemini, OpenRouter, Mistral, HuggingFace
- **Daily reset countdowns** — shows time until each provider's quota refreshes
- **Paid subscription tracker** — monthly cost across Claude, ChatGPT, Copilot, Grok, Gemini Advanced
- **Usage pace indicator** — are you on track for your daily budget or burning too fast?
- **Sparkline graph** — 7-day token usage trend
- **Paid token alerts** — native OS notification when paid tokens are used
- **Notification toggle** — silence alerts when you need focus
- **Auto-hide timer** — dock hides after 5/10/15 seconds of inactivity
- **Minimize to bubble** — shrinks to a floating dot, click to restore
- **Snap to edges** — right-click tray for left/right/center positioning
- **Brass 3D settings gear** — because details matter
- **prefers-reduced-motion** — respects accessibility preferences
- **anime.js spring physics** — cartoon squash/stretch on every interaction

## Supported Providers

### Free Tier
| Provider | Models | Daily Limit | Reset |
|----------|--------|-------------|-------|
| Ollama | gpt-oss:20b, CodeLlama, Mistral (local) | Unlimited | N/A |
| Groq | Llama 3.3 70B, 3.1 8B, Mixtral 8x7B, DeepSeek R1 | 14,400 req/day | Midnight UTC |
| Gemini Free | Flash 2.0, Flash Lite, Flash 8B | 1,500 req/day | Midnight PT |
| OpenRouter | Qwen3-Coder, GPT-OSS 120B, Llama 3.3 70B | 1,000 req/day | Midnight UTC |
| Mistral | Small, Codestral, Nemo 12B | ~2,000 req/day | Midnight UTC |
| HuggingFace | Llama 3.1 70B, Qwen 2.5 72B, StarCoder2 | Rolling window | Rolling |

### Paid Subscriptions (tracked)
- Claude Max ($100/mo) — Anthropic
- ChatGPT Plus ($20/mo) — OpenAI
- GitHub Copilot ($19/mo) — Microsoft
- Grok ($30/mo) — xAI
- Gemini Advanced ($20/mo) — Google

---

## Quick Start

```bash
# Clone
git clone https://github.com/WTFenchurch/OctopussAI-TokenDock.git
cd token-dock

# Install dependencies + create shortcuts
npm install

# Launch
npm start

# Dev mode (with DevTools)
npm run dev

# Build icon from SVG
npm run build-icon

# Install Desktop + Start Menu + Taskbar shortcuts
npm run install-shortcuts
```

## Configuration

### API Keys
Set keys in the Settings panel (gear icon) or create a `.env` file in the parent directory:

```env
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
OPENROUTER_API_KEY=sk-or-v1-...
HUGGINGFACE_API_KEY=hf_...
MISTRAL_API_KEY=...
OLLAMA_API_BASE=http://localhost:11434
```

### Token Budget
Token Dock reads `.token_budget.json` (generated by your smart router) to display real-time usage:

```json
{
  "date": "2026-04-05",
  "tiers": {
    "simple": { "tokens": 1200, "requests": 15 },
    "medium": { "tokens": 8500, "requests": 8 },
    "complex": { "tokens": 0, "requests": 0 },
    "code": { "tokens": 3200, "requests": 5 }
  }
}
```

## Tech Stack

- **Electron 33** — cross-platform desktop app
- **Vanilla JS** — zero framework dependencies
- **anime.js v3** — spring physics for cartoon animations (17KB, MIT)
- **SVG + CSS @keyframes + Web Animations API** — hybrid animation architecture
- **CSS custom properties** — fully themeable with OKLCH-ready tokens
- **electron-store** — persists window position and preferences

## Architecture

```
Token Dock
├── src/
│   ├── index.html    — entire UI (CSS + HTML + JS in one file)
│   ├── main.js       — Electron main process, IPC, provider health checks
│   └── preload.js    — secure IPC bridge
├── icon.svg          — vector octopus logo
├── build-icon.js     — SVG → ICO/PNG converter
├── install.js        — Windows shortcut installer
└── package.json
```

## Part of the Free Inference Stack

Token Dock is the monitoring dashboard for the [Free Inference Stack](https://github.com/WTFenchurch) — a complete multi-provider setup that routes AI requests through free tiers first, with smart task classification and automatic fallback.

## License

SEE LICENSE

---

*Built with 🐙 by WTFenchurchIII and the Octopus AI team*
