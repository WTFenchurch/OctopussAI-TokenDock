# Agent Knowledge Repository

Shared knowledge base that all agents read and contribute to. Updated after every bug fix, pattern discovery, or architectural decision.

## Electron Transparent Window Patterns (Windows)

### What NEVER works:
- `onclick` inline handlers
- `<input type="range">` (slider) — freezes permanently
- `<input type="checkbox">` — freezes permanently
- `pointer-events: none` — permanently kills elements, OS hit-testing doesn't recover
- `opacity` changes via inline `style` on buttons — breaks hit-testing
- `opacity` via CSS class on buttons — also breaks hit-testing (use `filter:brightness()` instead)
- `transition: all` on buttons — includes opacity transitions, which can break hit-testing
- `mouseup` alone on buttons inside `display:none` panels

### What ALWAYS works:
- `data-action` attributes + document-level event delegation
- Triple event listener: `mousedown` + `mouseup` + `click` with WeakMap debounce
- `<button>` elements with text content (ON/OFF, LOCKED/UNLOCKED, +, −)
- `<select>` dropdowns with `change` event listener on document
- `-webkit-app-region: no-drag` on ALL interactive elements AND their CSS class
- `z-index: -1` on ALL overlay/decoration layers (shimmer, rain, galaxy, theme::before)

### Patterns that work sometimes:
- `mouseup` alone — works on most buttons but fails on some in hidden panels
- CSS `transition` on opacity — works for decoration, breaks hit-testing on buttons

## CSS Architecture

### z-index Stack (mandatory):
```
-1: overlays (shimmer, rain, galaxy canvas, theme ::before backgrounds)
 0: default content (cards, meters, text)
 1: titlebar, content area, footer, settings header/body
10: appearance panel (#app-controls)
```

### Spacing Scale:
- Card padding: 0.4em vertical, 0.6em horizontal (standardized)
- Section gap: 0.3em
- Content gap: 0.4em
- Titlebar/footer: 0.4em 0.6em / 0.3em 0.6em

### Transition Speeds:
- Fast (interactions): 120ms
- Medium (layout): 200ms
- Slow (decorative): 300ms+

## IPC Architecture
- 21 channels, all matched between main.js ↔ preload.js ↔ index.html
- New channels MUST be added to all three files
- Use `ipcMain.handle` + `ipcRenderer.invoke` for request/response
- Use `mainWindow.webContents.send` + `ipcRenderer.on` for push notifications

## Event Delegation Pattern
```javascript
// The ONE handler pattern — all buttons route through here
document.addEventListener('mousedown', handleAction);
document.addEventListener('mouseup', handleAction);
document.addEventListener('click', handleAction);

function handleAction(e) {
  var el = e.target.closest('[data-action]');
  if (!el) return;
  // WeakMap debounce prevents triple-fire
  var actions = { 'actionName': function() { ... } };
  if (actions[el.dataset.action]) actions[el.dataset.action]();
}
```

## Bug Fix History

### HEART_CHARS Temporal Dead Zone (Critical)
- `const HEART_CHARS` was referenced in `THEME_RAIN_CONFIG` before its declaration
- `const` has a temporal dead zone — you CANNOT use it before the declaration line
- This killed ALL JavaScript silently — no error in console, just blank app
- **Rule: Always declare constants BEFORE any object that references them**

### Overlay z-index Eating Clicks (Critical)
- Shimmer overlay, theme rain, galaxy canvas, and theme `::before` backgrounds at `z-index:0` sat on top of interactive buttons
- Even with `pointer-events:none`, Windows transparent Electron didn't pass clicks through
- **Fix: All overlays MUST be `z-index:-1`**

### Cooldown Class Breaking Buttons (Critical)
- Adding `pointer-events:none` via a `.cooldown` CSS class permanently killed buttons
- The OS-level hit testing didn't recover even after removing the class
- **Fix: NEVER use `pointer-events:none` on interactive elements. Use WeakMap debounce instead.**

### Inline Opacity on Buttons Breaks Hit-Testing (Critical)
- `updatePremiumLocks()` set `style.opacity='0.5'` on shimmer and rain toggle buttons
- `updateDonateCountdown()` set `style.opacity` on the premium unlock button
- Inline opacity changes on buttons KILL OS-level hit-testing in transparent Electron windows on Windows
- Buttons become invisible to the mouse — clicks fall through to the desktop
- **Fix: NEVER set `style.opacity` on interactive elements. Use CSS classes that change `color`/`border-color` instead, or `filter:brightness()` for progressive dimming.**
- Added `.dimmed` CSS class for locked-state visual feedback without opacity
- Also replaced `transition:all` on all button classes with explicit property lists to prevent accidental opacity transitions

### Coffee Button Opacity Broke Clicks (Critical)
- `.coffee-btn` used `opacity:0.7` and `transition:opacity .15s`
- Any CSS opacity on interactive elements is risky in transparent Electron
- **Fix: Use `filter:brightness(0.7)` and `transition:filter .15s` instead**

### transition:all Is Dangerous on Buttons (Critical)
- `transition:all` on `.tbtn`, `.ctrl-toggle`, `.ctrl-btn`, `.donate-btn`, `.settings-btn` includes transitioning `opacity`
- If anything causes an opacity change (even inherited, pseudo-class, or dev tools), the transition event can interfere with OS hit-testing
- **Fix: Always list explicit transition properties: `background, color, border-color, box-shadow, transform, filter`**
- **Rule: NEVER use `transition:all` on interactive elements in transparent Electron windows**

### Bubble Window Must Be Separate (Critical)
- Resizing the main transparent window to 64x64 for the bubble doesn't work
- Transparent pixels don't receive mouse events on Windows
- **Fix: Create a separate `BrowserWindow` with `transparent:false` for the bubble**

### Speed Tier Switching — Graceful Transition (Design Decision)
- When user switches speed tier, DO NOT abort running operations
- Complete all in-progress tasks at the current tier
- New tasks after the switch use the newly selected tier
- The UI shows which tier is "pending" vs "active" during transition
- Animation transitions smoothly — old scene fades out, new scene fades in
- **Rule: Never interrupt running work. Finish current, start new.**

### filter:brightness on Buttons Kills Sibling Hit-Testing (Critical)
- `updateDonateCountdown()` set `style.filter='brightness(X)'` on the premium toggle button
- Even though `filter:brightness` is safer than `opacity`, inline `style.filter` on buttons in transparent Electron windows still causes cascading hit-test failures for SIBLING buttons in the same container
- The appearance panel buttons (opacity +/-, shimmer, rain, animBg) stopped responding whenever the donate countdown was running
- **Fix: NEVER set inline `style.filter` on buttons. Use CSS classes (`.dimmed`) that only change `color` and `border-color`**
- **Rule: The ONLY safe visual changes for buttons in transparent Electron are: `color`, `border-color`, `background`, `transform`, `box-shadow`**

### Pre-Commit Information Leak Check (Critical)
- Before EVERY commit, scan for references to unreleased/private projects
- Scan commit messages, README, source code, comments for private project names
- **Rule: Only commit what the user explicitly approves for public release**
- **Rule: Never reference private/unreleased projects by name in public code**

## Provider Intelligence (Last verified: 2026-04-05)

All tentacles MUST read this before making routing decisions. This is the single source of truth for what's free, what's paid, how limits work, and when they reset.

### FREE PROVIDERS — Zero cost, route here first

#### Groq (groq.com)
- **Type:** Free API tier (hard block at limit, HTTP 429)
- **Models:** Llama 3.3 70B, Llama 3.1 8B, Llama 3.2 1B/3B/11B/90B, Mixtral 8x7B, Gemma2 9B, DeepSeek R1 70B, Whisper v3
- **Limits vary per model:**
  - 8B models: ~30 RPM, up to 14,400 RPD, ~15K TPM
  - 70B models: ~30 RPM, lower RPD (~1,000-6,000), ~6K TPM
  - Larger/newer models have stricter caps
- **Daily reset:** Midnight UTC (00:00 UTC)
- **At limit:** Hard block, 429 with `retry-after` header. Not throttled — rejected outright.
- **Best for:** Fast inference on small-medium models. Groq's LPU hardware is fastest-in-class for latency.
- **Watch out:** Limits tighten over time. Check console.groq.com/settings/limits for your actual current caps.

#### Google AI Studio / Gemini Free (ai.google.dev)
- **Type:** Free API tier (separate from Gemini Advanced subscription)
- **Models & limits:**
  - Gemini 2.0 Flash: 15 RPM, 1,500 RPD, 1M TPM, 1M context
  - Gemini 2.0 Flash-Lite: 30 RPM, 1,500 RPD, 1M TPM, 1M context
  - Gemini 1.5 Flash: 15 RPM, 1,500 RPD, 1M TPM, 1M context
  - Gemini 1.5 Flash-8B: 15 RPM, 1,500 RPD, 1M TPM, 1M context
  - Gemini 1.5 Pro: 2 RPM, 50 RPD, 32K TPM, 2M context (barely usable free)
  - Gemini 2.5 Pro (preview): ~5 RPM, 25-50 RPD (heavily restricted free)
- **Daily reset:** Midnight Pacific Time (00:00 PT). PDT=UTC-7, PST=UTC-8.
- **At limit:** 429 error, requests rejected
- **CRITICAL DISTINCTION:** Free API tier (AI Studio) ≠ Gemini Advanced ($20/mo subscription). The subscription is a CONSUMER chatbot at gemini.google.com. It does NOT give higher API limits. These are completely different products.
- **Best for:** Flash 2.0 is the workhorse — 1M context, 1,500 RPD, fast. Use Flash-Lite for highest throughput.

#### OpenRouter Free Models (openrouter.ai)
- **Type:** $0 inference on curated model list (28+ models as of Apr 2026)
- **Key free models:**
  - Qwen3-Coder (262K ctx, best free coding model)
  - GPT-OSS 120B/20B (OpenAI's open-weight, 131K ctx)
  - Llama 3.3 70B (65K ctx, GPT-4 class general)
  - Nemotron 3 Super 120B (262K ctx, agentic)
  - Qwen 3.6 Plus (1M ctx, vision+tools)
  - Hermes 3 405B (131K ctx, largest free model)
  - `openrouter/free` auto-router (picks best available, 200K ctx)
- **Limits:**
  - Without credits: 20 RPM, **50 RPD** (reduced from 200 in 2026)
  - With $10+ ever purchased: 20 RPM, **1,000 RPD** (permanent unlock)
- **Daily reset:** Midnight UTC
- **At limit:** 429 error. Failed requests STILL count toward quota.
- **CRITICAL:** The $10 one-time purchase is a 20x multiplier on daily limits. Extremely high ROI.
- **Best for:** Access to cutting-edge models for $0. Qwen3-Coder for code, Llama 3.3 70B for general.

#### HuggingFace Inference API (huggingface.co)
- **Type:** Free serverless inference (queue-based, best-effort)
- **Models:** Llama 3.x (8B-70B), Mistral 7B, Mixtral 8x7B, Qwen 2.5, Gemma 2, DeepSeek Coder, StarCoder2, Phi-3, Whisper, Stable Diffusion
- **Limits:**
  - Anonymous: ~5-10 RPM (may be disabled for popular models)
  - Free account: ~30 RPM, ~1,000-2,000 RPD soft limit
  - Pro ($9/mo): Higher priority, larger bursts
- **Output cap:** 1,024-4,096 tokens per request (varies by model, 70B models often 512-1024)
- **Queue system:** Cold models return 503 with `estimated_time`. Use `wait_for_model=true` for non-urgent requests.
- **Reset:** Rolling window (RPM resets continuously). Check `X-RateLimit-Reset` header.
- **Best for:** Fallback provider. Not reliable for latency-sensitive work due to cold starts and queuing.

#### Mistral La Plateforme (mistral.ai)
- **Type:** Free experimental tier (separate from paid API)
- **Models:**
  - Mistral Small: 32K context, general purpose
  - Mistral Nemo (12B): 128K context, open-weight
  - Codestral: 32K context, code-specialized (separate endpoint: codestral.mistral.ai, separate API key)
- **Limits:** ~30 RPM, ~500K TPM, ~2,000 RPD (varies by model)
- **Daily reset:** Midnight UTC (RPD). RPM is rolling window.
- **Codestral free conditions:** MNPL license — free for personal dev, IDE integrations, research. NOT for commercial SaaS.
- **At limit:** 429 with `Retry-After` header
- **Watch out:** Mistral is tightening free tier over time. Codestral free access may end for new signups.
- **Best for:** Codestral for code completion in IDEs. Mistral Small as a capable general model.

#### Ollama Local (localhost:11434)
- **Type:** Unlimited, zero cost, runs on your hardware
- **Models:** Whatever you download — gpt-oss:20b (current), Llama 3.x, Mistral, CodeLlama, Phi-3, etc.
- **Limits:** None. Limited only by your GPU VRAM and patience.
- **Reset:** N/A
- **ALWAYS ROUTE HERE FIRST on Economy tier. Zero cost, zero risk, zero limits.**
- **Best for:** Everything that fits in local VRAM. Privacy-sensitive tasks. Unlimited iteration.

### PAID SUBSCRIPTIONS — Protected, never auto-routed

#### Claude Max ($100/mo) — Anthropic
- **Limit type:** MESSAGE-BASED with hidden token weighting (not pure token budget)
- **Models:** Opus 4, Sonnet 4, Haiku 3.5
- **Mechanics:** Rolling ~5hr window. Longer messages cost more of your allocation. ~5x Pro usage.
- **At limit:** Cooldown message, can use lighter models while waiting
- **Reset:** Rolling window, NOT monthly. No hard monthly token cap — it's throughput-gated.
- **Token Dock display:** Show as message-based pacing, not raw token count. Approximate 5M tokens/month equivalent for UI purposes.

#### ChatGPT Plus ($20/mo) — OpenAI
- **Limit type:** MESSAGE COUNT per rolling time window, varies per model
- **Models & limits:**
  - GPT-4o: ~80 messages / 3hr window
  - GPT-4o mini: essentially unlimited
  - o1: ~50 messages / week
  - o1-mini: comparable to GPT-4o limits
- **At limit:** Falls back to GPT-4o mini automatically
- **Reset:** 3hr rolling (GPT-4o), weekly rolling (o1)
- **Token Dock display:** Message count is more meaningful than token count here. Approximate 1M tokens/month equivalent.

#### GitHub Copilot ($19/mo Individual)
- **Limit type:** PREMIUM REQUEST COUNT (monthly)
- **Models:** Copilot (base), Copilot Chat, premium models (Claude Sonnet, GPT-4o via Copilot)
- **Limits:** 500 premium requests/month (Individual), 50/month (Free tier)
- **Standard completions & chat:** Effectively unlimited with base model
- **At limit:** Falls back to base model, premium selector grays out
- **Reset:** Monthly on billing date
- **Token Dock display:** Track premium requests as the scarce resource, not total completions.

#### Grok / SuperGrok ($30/mo) — xAI
- **Limit type:** MESSAGE COUNT per rolling window
- **Models:** Grok-2, Grok-3, Grok-3 mini
- **Limits:** ~30 Grok-3 queries / 2hr window. DeepSearch and Think modes have tighter caps.
- **At limit:** Cooldown timer, falls back to lower model
- **Reset:** ~2hr rolling windows
- **Token Dock display:** Approximate 2M tokens/month equivalent. Least transparent provider on limits.

#### Gemini Advanced ($20/mo) — Google
- **Limit type:** MESSAGE-BASED (generous, rarely hit in normal use)
- **Models:** Gemini Ultra, Gemini Pro 1.5 (with 1M context), Workspace AI features
- **This is a CONSUMER product** (gemini.google.com), NOT API access
- **Includes:** 2TB Google One storage, NotebookLM Plus, Workspace AI
- **At limit:** Throttled to shorter context or wait message
- **Reset:** Daily rolling
- **Token Dock display:** Approximate 1.5M tokens/month equivalent.

### ROUTING RULES (enforced by guardPaidRoute)

1. **Economy tier:** Ollama → Groq → HuggingFace ONLY. All others blocked.
2. **Standard tier:** Groq → Gemini Free API → OpenRouter → Mistral. Paid blocked.
3. **Turbo tier:** Free first (all providers), paid ONLY when all free exhausted. Every paid call logged with reason.
4. **NEVER auto-route to paid.** Turbo tier allows paid as fallback, but logs every instance.
5. **The $10 OpenRouter purchase** should be flagged as a recommendation — 20x daily limit for a one-time cost.

### WHAT TOKEN DOCK IS MISSING (gaps identified in this audit)

1. **Message-based vs token-based pacing:** Claude, ChatGPT, Grok, Gemini Advanced all use message counts, not token budgets. Token Dock shows `tokensPerMonth` which is an approximation. Should display the actual limit mechanic (messages/window) alongside the token estimate.
2. **Rolling vs daily vs monthly resets:** Mixed mechanics across providers. Token Dock assumes monthly resets for all subs, but Claude/ChatGPT/Grok use rolling windows (2-5hr). Pacing bars should reflect the actual reset window.
3. **Per-model limits within a subscription:** ChatGPT has different limits for GPT-4o vs o1. Copilot has different limits for base vs premium. Token Dock treats each sub as one bucket.
4. **OpenRouter $10 permanent unlock:** Critical cost optimization not surfaced in UI.
5. **Provider health beyond ping:** Token Dock pings endpoints for up/down, but doesn't check remaining quota. Should parse rate limit headers (`X-RateLimit-Remaining`) from actual API calls.
6. **Gemini free API reset is Pacific Time**, not UTC. Token Dock has it as UTC-8 which is PST, but during PDT (summer) it's UTC-7. Should auto-detect daylight saving.
7. **Cold start handling for HuggingFace:** No UX for "model loading, please wait" — requests just fail silently.

## Modern CSS & Design Standards (Stylist + Documenter training — 2026-04-05)

**Reference:** Full guide in project design docs

### CSS Features to USE in Token Dock (Electron 33+ / Chromium 130+)

| Feature | Why | Priority |
|---------|-----|----------|
| **Container queries** (`@container`) | Panels reflow by container size, not viewport. Widget cards adapt when dock is resized. | HIGH |
| **Native CSS nesting** | Clean selectors without preprocessor. Already doing `.mr { .mr-fill {...} }` style work. | HIGH |
| **`:has()` selector** | Parent-aware styling. `.sr:has(.pace-danger)` to highlight cards with pacing issues. | MEDIUM |
| **`interpolate-size`** | Animate `height: auto` natively. Collapsible sections without JS max-height hack. | HIGH |
| **`@starting-style`** | Entry animations without JS. Alert banners, new cards. Replace `@keyframes alertSlide`. | MEDIUM |
| **`light-dark()`** | Single declaration for both themes: `color: light-dark(#1a1a1a, #e5e5e5)`. | LOW (we use data-theme) |
| **`color-mix()` + oklch** | Perceptually uniform colors. `color-mix(in oklch, var(--accent), black 20%)` for hover states. | HIGH |
| **`text-wrap: balance`** | Balanced line breaks on headings. Apply to `.sl`, `.sh`, `.sr-name`. | LOW |
| **Anchor positioning** | Tooltips, popovers attached to elements without JS positioning. | MEDIUM |
| **`content-visibility: auto`** | Skip rendering off-screen sections. Apply to collapsed `.cb` panels. | HIGH (perf) |

### CSS Features to USE on Landing Page

| Feature | Why |
|---------|-----|
| **Scroll-driven animations** | Otto parallax, section reveals without IntersectionObserver |
| **View Transitions API** | Smooth page-feel transitions between sections |
| **Subgrid** | Feature grid alignment without hack spacing |
| **Container queries** | Responsive cards without media queries |

### Design Principles (Anti-template)

1. **Editorial over template** — Asymmetric layouts, varied rhythm. No 3-card grids.
2. **Data density over decoration** — Information-rich, not illustration-heavy. Every pixel earns its space.
3. **Quiet confidence** — Subtle motion (150-300ms), muted palette with one accent. No glow blobs.
4. **Typography-driven hierarchy** — Size, weight, and spacing create hierarchy, not borders and backgrounds.
5. **Dark mode done right** — Not inverted. OKLCH-based: reduce lightness, preserve hue, slightly desaturate. Elevated surfaces are LIGHTER in dark mode.

### Color System (OKLCH tokens)

```css
/* Modern token approach — perceptually uniform */
--accent: oklch(0.65 0.25 250);           /* vibrant blue */
--accent-hover: oklch(0.58 0.25 250);     /* darker, same chroma */
--accent-subtle: oklch(0.65 0.08 250);    /* same hue, low chroma */
--surface-elevated: oklch(0.22 0.01 250); /* dark mode: lighter = elevated */
--text-primary: oklch(0.93 0.01 250);     /* near-white, slight hue tint */
--text-muted: oklch(0.65 0.02 250);       /* medium gray, tinted */
```

### Motion Rules

| Context | Duration | Easing |
|---------|----------|--------|
| Hover state | 120-150ms | `ease-out` |
| Panel open/close | 200-300ms | `ease-in-out` |
| Page transition | 300-500ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Data update (numbers) | 400-600ms | `ease-out` |
| Attention/alert | 150ms in, 300ms out | `ease-in` then `ease-out` |

**Rule:** Never animate `opacity` on interactive elements in transparent Electron (see Bug Fix History).

### Fluid Typography

```css
/* Heading: 20px at 320w → 32px at 1200w */
font-size: clamp(1.25rem, 0.9rem + 1.5vw, 2rem);

/* Body: fixed 14px — don't fluid-scale body text */
font-size: 0.875rem;
```

### Performance Defaults

```css
/* Apply to collapsed/offscreen sections */
.cb[style*="max-height:0"] {
  content-visibility: auto;
  contain-intrinsic-size: 0 200px;
}

/* Containment for cards that re-render frequently */
.sc, .mr, .pr, .sr {
  contain: layout style;
}
```

## Performance Notes
- `render()` replaces `innerHTML` every 30 seconds — acceptable for this refresh rate
- Galaxy canvas animation uses `requestAnimationFrame` — must be stopped when theme changes
- Heart rain spawns 80+ DOM elements — older machines may lag. Consider reducing for low-spec detection.
- Theme rain interval is 60ms — high frequency. Could be reduced to 100ms without visible difference.

## Testing
- qa-test.js: 20+ tests covering rendering, themes, shimmer, opacity, rain, hearts, sections, flip
- qa-donate-test.js: 17 tests covering full donate/premium unlock flow
- Run: `node_modules/.bin/electron.cmd qa-test.js`
- All tests use `executeJavaScript` to directly call functions and check state
- Tests that need premium: set `premiumUnlocked=true` directly

## File Size Targets
- index.html: ~1800 lines (CSS + HTML + JS in one file)
- main.js: ~470 lines
- preload.js: ~30 lines
- Total: ~2300 lines for the entire app
