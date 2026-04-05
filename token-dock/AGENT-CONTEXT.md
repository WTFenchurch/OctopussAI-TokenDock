# Token Dock — Full Agent Context

## What This App Is
An Electron desktop dock that monitors AI token usage across free and paid providers. Floats on screen, minimizes to a draggable bubble, has themes, effects, donation system, and settings.

## Tech Stack
- Electron (frameless, `transparent: true` BrowserWindow)
- Vanilla JS (no framework)
- Single HTML file with inline CSS + JS (`src/index.html`)
- Main process: `src/main.js`
- Preload bridge: `src/preload.js`

## CRITICAL: Electron Transparent Window on Windows
**This is the #1 source of bugs.** On Windows with `transparent: true`:
- `onclick` inline handlers DO NOT FIRE
- `mouseup` event listeners sometimes don't fire on `<button>` elements
- `pointer-events: none` permanently kills elements — NEVER USE IT
- CSS `opacity` changes can break mouse hit testing — AVOID
- `-webkit-app-region: drag` eats events from children even with `no-drag`

### The Solution In Place
All interactive elements use `data-action="actionName"` attributes. Three event listeners (`mousedown`, `mouseup`, `click`) on `document` catch all actions via delegation. A `WeakMap` debounce prevents double-firing. This is in the `wireAll()` function.

**NEVER add inline onclick/onchange/oninput handlers. NEVER use pointer-events:none. NEVER use slider/range inputs or checkbox inputs — they freeze.**

Button controls use `<button>` elements with `data-action`. Toggles are buttons that say ON/OFF. Adjustments are +/− button pairs with a value display.

## File Locations
```
C:/Users/joshu/Documents/free-inference-stack/
  token-dock/
    src/
      index.html    — ALL UI, CSS, and JS (~1700 lines)
      main.js       — Electron main process (~460 lines)
      preload.js    — IPC bridge (~28 lines)
    qa-test.js      — 20-test QA suite
    qa-donate-test.js — 17-test donate/premium QA suite
  packages/         — GitHub-ready copies
  .env              — Real API keys (NEVER commit)
  .env.example      — Placeholder keys
```

## Features (All Implemented)

### Core Dashboard
- Summary cards: Tokens Today, Requests, Monthly Paid ($189/mo), Free Savings
- Task Budget meters: simple/medium/complex/code with progress bars
- Free Providers list: Groq, Gemini, OpenRouter, HuggingFace, Mistral, Ollama
- Paid Subscriptions: Claude Max ($100), ChatGPT+ ($20), Copilot ($19), Grok ($30), Gemini ($20)
- Sections are collapsible (click header) and drag-to-reorder

### Themes (13 total)
**Free (7):** Midnight, Cobalt, Slate, Amethyst, Carbon, Galaxy, Claude Code
**Premium (6):** Hearts, Catppuccin, Dracula, Tokyo Night, Rosé Pine, Synthwave

- Galaxy theme has animated canvas with spinning spiral galaxies + twinkling stars
- Claude Code theme has no border-radius, flush left-border — designed to dock next to terminal
- All premium themes have animated CSS backgrounds
- Theme selector is a `<select>` dropdown (not dots — dots don't work in transparent Electron)

### Theme Rain (Premium)
Each premium theme has a background particle rain that can be toggled:
- Hearts: ❤️💕💖 in 20 shades of red/pink
- Galaxy: 🌌⭐🪐☄️ cosmic
- Catppuccin: 🐱🐾✨💜 cozy pastels
- Dracula: 🦇🧛🕯️💀 vampire
- Tokyo Night: 🏯🌸⛩️🎐 city lights
- Rosé Pine: 🌹🌿🌸🍃 garden petals
- Synthwave: 🎹🎸📼🕹️ retro arcade

Rain intensity: 80 burst + 8-20 every 60ms. Controlled via Rain ON/OFF + speed +/−.

### Card Flip Animation
Settings button (gear icon) flips the entire dock like a 3D card. During flip:
- Energy shards burst along the edge
- Glow line runs down center
- Emoji particles flutter (12 effects: 7 free + 5 premium)
- Colored mist matching the selected effect
- Effect selector in footer with Energy/Hearts/Shamrocks/Stars/Fire/Snow/Sparkle + premium Confetti/Lightning/Sakura/Matrix/Diamonds

### Donate System
- Coffee cup ☕ in titlebar opens donate panel
- Entire window fills with stormy heart rain (80+ hearts, 20 shades of red)
- Window turns bright pink (hearts-mode class)
- PayPal donate button opens: https://www.paypal.com/donate/?business=35NCEDPRRGTP6&no_recurring=0&currency_code=USD
- Premium unlock: must click donate AND wait 25s (hidden timer) before LOCKED button becomes clickable
- Honor system toggle: LOCKED → UNLOCKED button

### Appearance Controls (🎨 button in footer)
- Opacity: +/− buttons with block scale ████▒▒▒▒ (20%-100%)
- Shimmer: ON/OFF toggle (premium) — diagonal light sweep across dock
- Shimmer Intensity: +/− (1-15)
- Shimmer Speed: +/− (0.5s-5s)
- Rain: ON/OFF toggle (premium) — theme-specific particle rain
- Rain Speed: +/− (Fast/Med/Slow)

### Bubble Minimize
- Circle button in titlebar minimizes dock to a separate 64x64 BrowserWindow
- Bubble is NON-transparent (transparent windows can't receive clicks on Windows)
- Bubble body is `-webkit-app-region: drag` for native dragging
- Inner `.hit` div is `no-drag` with mouseup → `window.close()`
- `bubbleWindow.on('closed')` triggers `restoreFromBubble()` in main process
- Dock restores near where bubble was positioned
- Tray icon click also restores

### Dock to Claude Code
- ⬞ button in titlebar snaps dock to right edge of screen, full height, 300px wide
- Auto-switches to Claude Code theme (flush, no border-radius)
- Sets always-on-top

### Auto-Hide Timer
- Dropdown in titlebar: Stay / 5s / 10s / 15s
- After timeout, dock auto-minimizes to bubble

### Settings (Back of card flip)
- API key management for 6 providers
- Keys hidden with password type, eye icon to reveal
- Add custom LLM provider keys
- Save/Cancel buttons
- First-run wizard auto-opens if no keys configured

### Radial Gauge Tiles (Premium)
- Budget meters can switch between Bars and Radial (circular SVG gauges)
- Column layout: 1/2/4 columns
- Gauges use CSS var colors that update with theme

### Window Behavior
- Frameless, transparent, always-on-top (toggleable)
- Resizable by dragging edges (max 800px wide)
- Close → hides to system tray (not quit)
- Tray icon: click to show, right-click for full menu
- System tray menu: Show, Dock to Claude, Minimize to Bubble, Theme submenu, Auto-Hide submenu, Always on Top, Quit

### 3D Buttons
All buttons have gradient, bottom border depth, inset highlight, drop shadow, press animation.

## IPC Channels (21 total)
All matched between main.js and preload.js:
get-budget, get-env, get-theme, get-auto-hide, set-theme, set-auto-hide, minimize-to-bubble, restore-from-bubble, move-window-by, get-window-pos, hide-window, set-ignore-mouse, get-premium, set-opacity, set-premium, open-external, toggle-always-on-top, get-keys, save-keys, is-first-run, dock-to-claude, take-screenshot

## Known Issues / Patterns
1. NEVER use range inputs or checkboxes — they freeze in transparent Electron on Windows
2. NEVER use `pointer-events: none` — permanently kills elements
3. NEVER use inline event handlers — use data-action delegation
4. The `const` temporal dead zone crash — `HEART_CHARS` was referenced before declaration, killed all JS silently. Always declare constants before use.
5. Buttons inside initially `display:none` panels may not respond to `mouseup` alone — that's why we use mousedown+mouseup+click triple listener
6. `applyTheme()` calls `render()` to update all themed elements

## QA Test Suites
- `qa-test.js`: 20 tests covering rendering, themes, shimmer, opacity, rain, hearts, sections, data-actions, flip
- `qa-donate-test.js`: 17 tests covering full donate/premium unlock flow
- Run: `node_modules/.bin/electron.cmd qa-test.js`
- All 37 tests pass as of last run

## User Preferences (from memory)
- Go big on visual effects — don't hold back
- Full theme commitment — transform ENTIRE UI when effect is active
- Button-based controls only — no sliders/checkboxes
- Premium = more effects + themes, not paywalled core features
- Make incremental changes — never rewrite working systems
- App should be GitHub-ready for other users
- Responsive sizing using em/clamp units
- Cost conscious — maximize free tier usage
