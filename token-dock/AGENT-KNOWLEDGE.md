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

### Pre-Commit Information Leak Check (Critical)
- Before EVERY commit, scan for references to unreleased/private projects
- Scan commit messages, README, source code, comments for private project names
- **Rule: Only commit what the user explicitly approves for public release**
- **Rule: Never reference private/unreleased projects by name in public code**

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
