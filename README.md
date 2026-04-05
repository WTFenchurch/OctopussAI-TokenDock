# Token Dock

**A desktop AI token monitor that floats on your screen -- track free and paid provider usage, budgets, and savings in real time.**

![Token Dock](screenshots/token-dock.png)

---

## Features

### Dashboard
- Real-time token usage across all speed tiers (simple / medium / complex / code)
- Task budget meters with progress bars (switchable to radial SVG gauges)
- Daily free savings calculator vs. paid API rates
- Collapsible, drag-to-reorder sections
- Summary cards: Tokens Today, Requests, Monthly Paid ($189/mo), Free Savings

### Themes (13)

| Type | Themes |
|------|--------|
| **Free (7)** | Midnight, Cobalt, Slate, Amethyst, Carbon, Galaxy, Claude Code |
| **Premium (6)** | Hearts, Catppuccin, Dracula, Tokyo Night, Rose Pine, Synthwave |

- Galaxy theme: animated canvas with spinning spiral galaxies and twinkling stars
- Claude Code theme: zero border-radius, flush left-border -- designed to dock beside a terminal
- All premium themes include animated CSS backgrounds

### Theme Rain (Premium)
Each premium theme has a toggleable background particle rain with theme-specific emoji sets:

| Theme | Particles |
|-------|-----------|
| Hearts | 20 shades of red/pink hearts |
| Galaxy | Cosmic stars, planets, comets |
| Catppuccin | Cozy cats, paws, pastels |
| Dracula | Bats, vampires, candles |
| Tokyo Night | Temples, blossoms, lanterns |
| Rose Pine | Roses, petals, leaves |
| Synthwave | Synths, guitars, retro arcade |

Rain intensity: 80-particle burst + 8-20 every 60ms. Speed and toggle controllable from the appearance panel.

### Card Flip Animation
The settings button flips the entire dock like a 3D card with layered effects:
- Energy shards burst along the edge
- Glow line runs down center
- Emoji particle flutter (12 effects: 7 free + 5 premium)
- Colored mist matching the selected effect
- Effects: Energy, Hearts, Shamrocks, Stars, Fire, Snow, Sparkle + premium Confetti, Lightning, Sakura, Matrix, Diamonds

### Appearance Controls
- Opacity: +/- buttons with visual block scale (20%-100%)
- Shimmer: diagonal light sweep across dock (premium, adjustable intensity 1-15 and speed 0.5s-5s)
- Rain: theme-specific particle rain toggle with speed control

### Window Behavior
- Frameless, transparent, always-on-top (toggleable)
- Resizable by dragging edges (max 800px wide)
- Close hides to system tray (not quit)
- Tray icon: click to show, right-click for full context menu
- Tray menu: Show, Dock to Claude, Minimize to Bubble, Theme submenu, Auto-Hide submenu, Always on Top, Quit

### Bubble Minimize
- Minimizes the dock to a draggable 64x64 floating bubble
- Click the bubble to restore the full dock
- Dock restores near where the bubble was positioned

### Dock to Claude Code
- Snaps dock to right edge of screen, full height, 300px wide
- Auto-switches to Claude Code theme
- Sets always-on-top

### Auto-Hide Timer
- Configurable from the titlebar: Stay / 5s / 10s / 15s
- After timeout, dock auto-minimizes to bubble

### Radial Gauge Tiles (Premium)
- Budget meters switchable between bar and circular SVG gauge views
- Column layout options: 1 / 2 / 4 columns
- Gauges inherit theme colors automatically

### 3D Buttons
All interactive controls have gradient surfaces, bottom-border depth, inset highlights, drop shadows, and press animations. No sliders or checkboxes -- all controls are button-based for reliability in transparent Electron windows.

### First-Run Setup Wizard
- Auto-opens on first launch if no API keys are configured
- Walks through key entry for all 6 free providers
- Keys stored securely in OS app data directory

### Settings Panel (Back of Card)
- API key management for all providers
- Keys hidden by default, eye icon to reveal
- Add custom LLM provider keys
- Save / Cancel

---

## Quick Start

```bash
git clone https://github.com/WTFenchurchIII/free-inference-stack.git
cd free-inference-stack
npm install
npm run dock
```

On first launch, the setup wizard walks you through API key configuration. You can also configure keys later from the settings panel (gear icon).

---

## Setup Wizard

Token Dock detects whether any API keys are configured on startup. If none are found, it opens a guided wizard that:

1. Lists all supported free providers with signup links
2. Accepts and validates each API key
3. Stores keys securely in OS app data (never in the repo)
4. Launches the dashboard once at least one key is saved

You can re-enter settings at any time by clicking the gear icon, which triggers the 3D card-flip animation to reveal the settings panel.

---

## Speed Tier System

Token Dock classifies every AI request into one of four speed tiers:

| Tier | Routed To | Use Case |
|------|-----------|----------|
| **Simple** | 8B models (Groq, Ollama) | Quick questions, lookups |
| **Medium** | 70B models (Groq, Gemini Flash) | Summarization, analysis |
| **Complex** | Top-tier free models | Strategy, reasoning |
| **Code** | Codestral, Groq 70B, CodeLlama | Code generation, debugging |

Each tier has a daily token budget with progress bars. When a tier's budget is exhausted, requests auto-downgrade to the next available tier. Paid APIs are hard-blocked by default.

---

## Provider Support

### Free Providers

| Provider | Best For | Daily Limit |
|----------|----------|-------------|
| Groq | Fast inference, high volume | 14,400 req/day |
| Google Gemini | Strong reasoning | 1,500 req/day |
| OpenRouter | Wide model selection ($0 models) | Unlimited |
| Hugging Face | Model variety | Rate-limited |
| Mistral | Code (Codestral), general | Experimental |
| Ollama | Local unlimited backstop | Unlimited |

### Paid Subscriptions (Tracked)

| Provider | Monthly Cost |
|----------|-------------|
| Claude Max | $100 |
| ChatGPT Plus | $20 |
| GitHub Copilot | $19 |
| Grok Premium | $30 |
| Gemini Advanced | $20 |

---

## Architecture

Token Dock is built with Electron and vanilla JS -- no framework dependencies.

```
token-dock/
  src/
    index.html   -- All UI, CSS, and JS (~1700 lines)
    main.js      -- Electron main process, window management, tray, IPC (~460 lines)
    preload.js   -- Secure IPC bridge (~28 lines)
```

### IPC Channels (21)

Communication between the main process and renderer uses 21 named IPC channels:

`get-budget` `get-env` `get-theme` `get-auto-hide` `set-theme` `set-auto-hide` `minimize-to-bubble` `restore-from-bubble` `move-window-by` `get-window-pos` `hide-window` `set-ignore-mouse` `get-premium` `set-opacity` `set-premium` `open-external` `toggle-always-on-top` `get-keys` `save-keys` `is-first-run` `dock-to-claude` `take-screenshot`

### Event Delegation System

All interactive elements use `data-action` attributes. Three event listeners (`mousedown`, `mouseup`, `click`) on `document` handle all actions via delegation with `WeakMap` debouncing. This solves the transparent Electron window hit-testing problems on Windows.

---

## Security

- **API keys never committed to git** -- `.env` is in `.gitignore`, only `.env.example` with placeholders is tracked
- **Token budget data** (`.token_budget.json`) is git-ignored
- **Config stored in OS app data directory**, not in the repo
- **Immutable donation links** -- PayPal and BTC addresses are hardcoded constants, not configurable by external input
- **Integrity verification** -- QA test suites (37 tests) validate donation flow, premium unlock timing, and link integrity
- **Quantum-resistant hashing** -- donation link verification uses SHA-256 integrity checks to prevent tampering

---

## Donation

Token Dock is free and open source. If it saves you money on AI tokens, consider supporting development:

**PayPal**
```
https://www.paypal.com/donate/?business=35NCEDPRRGTP6&no_recurring=0&currency_code=USD
```

**Bitcoin**
```
bc1qhgafyepzp0r4sgntv725ywwdaqcvxdgqh5ry9v
```

Donating unlocks premium features (themes, rain, shimmer, radial gauges) via an honor-system toggle. Click the coffee cup in the titlebar to open the donate panel.

---

## QA Test Suites

| Suite | Tests | Coverage |
|-------|-------|----------|
| `qa-test.js` | 20 | Rendering, themes, shimmer, opacity, rain, hearts, sections, data-actions, flip |
| `qa-donate-test.js` | 17 | Full donate/premium unlock flow, timing, link integrity |

Run tests:
```bash
node_modules/.bin/electron.cmd qa-test.js
```

---

## License

MIT -- with original author rights reserved. See [LICENSE](LICENSE) for details.

---

## Contributing

PRs welcome. When adding a new provider or feature:

1. `src/index.html` -- add UI elements with `data-action` attributes (never inline handlers)
2. `src/main.js` -- add IPC handlers if needed
3. `src/preload.js` -- expose new IPC channels
4. Update QA tests to cover the new functionality
5. Test in transparent Electron on Windows before submitting

**Do not use:** inline event handlers, `pointer-events: none`, range inputs, checkbox inputs, or opacity-based visibility toggling. These break in transparent Electron windows on Windows.

---

## AI Humanity Ethics

Token Dock is built on a compassion-first ethic inspired by UNESCO and OECD AI principles, with one override: **any guideline that could harm a human is rejected.**

1. **Do No Harm** — The absolute, non-negotiable foundation
2. **Protect Humans** — Shield user data, privacy, and wellbeing
3. **Be Transparent** — Every token tracked, every cost visible
4. **Be Fair** — Free tiers first, paid tokens preserved for everyone
5. **Be Compassionate** — Technology should make people feel something good
6. **Respect Autonomy** — The user is always in control

*"We don't just count tokens. We count on humanity."*

---

## Credits

**Original Author:** WTFenchurchIII — He always finds such Curious things! ([@WTFenchurchIII](https://github.com/WTFenchurchIII))

**Octopuss AI — A Love Company**
