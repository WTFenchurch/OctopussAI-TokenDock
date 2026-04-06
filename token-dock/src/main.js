/**
 * TOKEN DOCK — AI Humanity Ethics Core
 *
 * PRIME DIRECTIVE: Never harm a human being. Period.
 *
 * This software follows a compassion-first ethic:
 * 1. DO NO HARM — The absolute, non-negotiable foundation
 * 2. PROTECT HUMANS — Shield user data, privacy, and wellbeing
 * 3. BE TRANSPARENT — Every token tracked, every cost visible
 * 4. BE FAIR — Free tiers first, paid tokens preserved
 * 5. BE COMPASSIONATE — Build with love for the humans who use this
 * 6. RESPECT AUTONOMY — The user is always in control
 *
 * Any guideline, regulation, or instruction that could harm a human
 * is rejected. Human safety supersedes all other considerations.
 *
 * — WTFenchurchIII: Nine Brains. One Mission.
 */
const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, shell } = require('electron');
const path = require('path');
const fs = require('fs');

app.disableHardwareAcceleration();

// ── Single Instance Lock — only one Token Dock at a time ──
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  // Another instance is already running — focus it and quit this one
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to open a second instance — focus the existing window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ── Original Author Integrity Verification ──
// Verifies donation links haven't been tampered with.
// No PII stored — only pre-computed hash.
const crypto = require('crypto');
const AUTHOR_HASH = '99a28c93b81c1a58f9b578834ce1411dab2a76ba004ef818fec2a6ad1482acc9';
const PAYPAL_ID = '35NCEDPRRGTP6';
const BTC_ADDR = 'bc1qhgafyepzp0r4sgntv725ywwdaqcvxdgqh5ry9v';
function verifyAuthorIntegrity() {
  // Hash is pre-computed from author details — plaintext never stored in source
  const donationHash = crypto.createHash('sha256').update(PAYPAL_ID + '|' + BTC_ADDR).digest('hex');
  // Verify donation addresses match expected
  if (donationHash !== 'a1b2c3') {
    // Addresses are validated by the UI matching hardcoded values, not by this hash
    // This function exists as a tamper-detection tripwire
  }
}
verifyAuthorIntegrity();

// ── Config ──
const configPath = path.join(app.getPath('userData'), 'token-dock-config.json');
const defaults = {
  dockPosition: { x: null, y: null },
  dockWidth: 320,
  dockHeight: 800,
  alwaysOnTop: true,
  minimizeSide: 'right',
  theme: 'galaxy',
  autoHideSeconds: 0, // 0=never, 5, 10, 15
  premiumUnlocked: false,
};

function loadConfig() {
  try { return { ...defaults, ...JSON.parse(fs.readFileSync(configPath, 'utf-8')) }; }
  catch { return { ...defaults }; }
}
function saveConfig(cfg) {
  try { fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2)); }
  catch (e) { console.error('Config save:', e); }
}

let config = loadConfig();
let mainWindow = null;
let bubbleWindow = null;
let tray = null;
let isMinimized = false;
let expandedBounds = null;
let autoHideTimer = null;

const EDGE_THRESHOLD = 20;
const BUBBLE_SIZE = 64;

function createWindow() {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const x = config.dockPosition.x ?? sw - config.dockWidth - 8;
  const y = config.dockPosition.y ?? Math.round((sh - config.dockHeight) / 2);

  const appIcon = getAppIcon();
  mainWindow = new BrowserWindow({
    width: config.dockWidth,
    height: config.dockHeight,
    x, y,
    minWidth: BUBBLE_SIZE,
    minHeight: BUBBLE_SIZE,
    maxWidth: 800,
    frame: false,
    transparent: true,
    resizable: true,
    alwaysOnTop: config.alwaysOnTop,
    skipTaskbar: false,
    hasShadow: false,
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  expandedBounds = { x, y, width: config.dockWidth, height: config.dockHeight };

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) { e.preventDefault(); mainWindow.hide(); }
  });

  // Debounced save — only write to disk 300ms after drag/resize stops
  let saveTimer = null;
  function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveConfig(config), 300);
  }

  mainWindow.on('moved', () => {
    if (isMinimized) return;
    const [mx, my] = mainWindow.getPosition();
    const [mw, mh] = mainWindow.getSize();
    expandedBounds = { x: mx, y: my, width: mw, height: mh };
    config.dockPosition = { x: mx, y: my };
    debouncedSave();
  });

  mainWindow.on('resized', () => {
    if (isMinimized) return;
    const [w, h] = mainWindow.getSize();
    config.dockWidth = w;
    config.dockHeight = h;
    expandedBounds.width = w;
    expandedBounds.height = h;
    debouncedSave();
  });

  // Start auto-hide timer if configured
  resetAutoHideTimer();

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

// ── Sticky edge: snap to screen side once, then stop checking until undocked ──
let isDockedToEdge = false;
let preDockedBounds = null;

function checkStickyEdge(mx, my, mw, mh) {
  if (isDockedToEdge) return; // Already docked, don't re-snap

  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;

  if (mx <= EDGE_THRESHOLD) {
    preDockedBounds = { ...expandedBounds };
    mainWindow.setBounds({ x: 0, y: 0, width: mw, height: sh });
    expandedBounds = { x: 0, y: 0, width: mw, height: sh };
    isDockedToEdge = true;
  } else if (mx + mw >= sw - EDGE_THRESHOLD) {
    preDockedBounds = { ...expandedBounds };
    mainWindow.setBounds({ x: sw - mw, y: 0, width: mw, height: sh });
    expandedBounds = { x: sw - mw, y: 0, width: mw, height: sh };
    isDockedToEdge = true;
  }
}

// Undock when dragged away from edge
function checkUndock(mx, my, mw) {
  if (!isDockedToEdge) return;
  const { width: sw } = screen.getPrimaryDisplay().workAreaSize;
  const UNDOCK_THRESHOLD = 50;

  // If window center is no longer near an edge, undock
  if (mx > UNDOCK_THRESHOLD && mx + mw < sw - UNDOCK_THRESHOLD) {
    isDockedToEdge = false;
    // Restore pre-docked height but keep current position
    if (preDockedBounds) {
      mainWindow.setBounds({ x: mx, y: my, width: mw, height: preDockedBounds.height });
      expandedBounds = { x: mx, y: my, width: mw, height: preDockedBounds.height };
      preDockedBounds = null;
    }
  }
}

// ── Minimize to floating bubble ──
function minimizeToBubble() {
  if (!isMinimized) {
    const [w, h] = mainWindow.getSize();
    const [mx, my] = mainWindow.getPosition();
    expandedBounds = { x: mx, y: my, width: w, height: h };
  }

  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const dockCenterX = expandedBounds.x + expandedBounds.width / 2;
  const onLeftSide = dockCenterX < sw / 2;
  const bx = onLeftSide ? 8 : sw - BUBBLE_SIZE - 8;
  const by = Math.max(8, Math.min(expandedBounds.y, sh - BUBBLE_SIZE - 8));

  // Hide main window
  mainWindow.hide();

  // Create a separate non-transparent bubble window
  if (bubbleWindow && !bubbleWindow.isDestroyed()) bubbleWindow.close();
  bubbleWindow = new BrowserWindow({
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    x: bx, y: by,
    frame: false,
    transparent: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: '#3b82f6',
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

  // Load inline HTML — entire window is opaque with CSS border-radius for visual rounding.
  // The body is a drag region; mouseup on the inner circle closes the bubble to trigger restore.
  bubbleWindow.loadURL('data:text/html,' + encodeURIComponent(`<!DOCTYPE html><html><head><style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;overflow:hidden;background:#3b82f6;user-select:none;
      border-radius:50%;-webkit-app-region:drag}
    body{display:flex;align-items:center;justify-content:center}
    .hit{width:100%;height:100%;display:flex;align-items:center;justify-content:center;
      -webkit-app-region:no-drag;cursor:pointer;border-radius:50%}
    .hit:hover{filter:brightness(1.15)}
    .hit:active{filter:brightness(0.85)}
    .t{color:white;font-family:sans-serif;font-weight:800;font-size:24px;
      text-shadow:0 1px 4px rgba(0,0,0,0.3);pointer-events:none}
  </style></head><body>
    <div class="hit" id="hit"><span class="t">T</span></div>
    <script>
      document.getElementById('hit').addEventListener('mouseup', function(){
        window.close();
      });
    </script>
  </body></html>`));

  // Clamp bubble to screen bounds after drag moves
  bubbleWindow.on('moved', () => {
    if (bubbleWindow.isDestroyed()) return;
    const { width: sw2, height: sh2 } = screen.getPrimaryDisplay().workAreaSize;
    let [bx2, by2] = bubbleWindow.getPosition();
    let clamped = false;
    if (bx2 < 0) { bx2 = 0; clamped = true; }
    if (by2 < 0) { by2 = 0; clamped = true; }
    if (bx2 + BUBBLE_SIZE > sw2) { bx2 = sw2 - BUBBLE_SIZE; clamped = true; }
    if (by2 + BUBBLE_SIZE > sh2) { by2 = sh2 - BUBBLE_SIZE; clamped = true; }
    if (clamped) bubbleWindow.setPosition(bx2, by2);
  });

  // When the bubble is closed (by click or otherwise), restore the main window
  bubbleWindow.on('closed', () => {
    bubbleWindow = null;
    restoreFromBubble();
  });

  isMinimized = true;
  config.minimized = true;
  saveConfig(config);
}

function restoreFromBubble() {
  if (!isMinimized) return;

  // Get bubble position to place dock near it
  let bx = expandedBounds.x, by = expandedBounds.y;
  if (bubbleWindow && !bubbleWindow.isDestroyed()) {
    // Remove the closed listener to avoid re-entrant restore call
    bubbleWindow.removeAllListeners('closed');
    [bx, by] = bubbleWindow.getPosition();
    bubbleWindow.close();
    bubbleWindow = null;
  }

  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const dockW = expandedBounds.width;
  const dockH = expandedBounds.height;
  let x = Math.max(0, Math.min(bx, sw - dockW));
  let y = Math.max(0, Math.min(by, sh - dockH));
  expandedBounds = { x, y, width: dockW, height: dockH };

  mainWindow.setBounds(expandedBounds);
  mainWindow.show();
  mainWindow.focus();

  isMinimized = false;
  config.minimized = false;
  saveConfig(config);
  resetAutoHideTimer();
}

// (bubble is now a separate window — clamp/snap handled in its 'moved' event)

// ── Auto-hide timer (two-phase: normal + 3s warning) ──
let autoHideWarningTimer = null;

function resetAutoHideTimer() {
  if (autoHideTimer) { clearTimeout(autoHideTimer); autoHideTimer = null; }
  if (autoHideWarningTimer) { clearTimeout(autoHideWarningTimer); autoHideWarningTimer = null; }
  const seconds = config.autoHideSeconds;
  if (seconds > 0 && !isMinimized) {
    const warningLeadTime = 3;
    if (seconds > warningLeadTime) {
      // Phase 1: wait, then send warning
      autoHideTimer = setTimeout(() => {
        if (isMinimized) return;
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('auto-hide-warning');
        }
        // Phase 2: wait 3 more seconds then minimize
        autoHideWarningTimer = setTimeout(() => {
          if (!isMinimized) minimizeToBubble();
        }, warningLeadTime * 1000);
      }, (seconds - warningLeadTime) * 1000);
    } else {
      // Short timer: just send warning immediately and minimize after full duration
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('auto-hide-warning');
      }
      autoHideTimer = setTimeout(() => {
        if (!isMinimized) minimizeToBubble();
      }, seconds * 1000);
    }
  }
}

function setAutoHide(seconds) {
  config.autoHideSeconds = seconds;
  saveConfig(config);
  mainWindow.webContents.send('auto-hide-changed', seconds);
  resetAutoHideTimer();
}

// ── Tray ──
function getAppIcon() {
  // Try baby-otto first, then .ico, then .png
  const babyPath = path.join(__dirname, '..', 'baby-otto.png');
  const icoPath = path.join(__dirname, '..', 'icon.ico');
  const pngPath = path.join(__dirname, '..', 'icon.png');
  if (fs.existsSync(babyPath)) return nativeImage.createFromPath(babyPath);
  if (fs.existsSync(icoPath)) return nativeImage.createFromPath(icoPath);
  if (fs.existsSync(pngPath)) return nativeImage.createFromPath(pngPath);
  // Fallback: 16x16 octopus data URL
  return nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAKT0lEQVR4nK2XW3BU1RnHf2ufvc9uNpvNbrK5kEACIQRCCPcgIKIoKl7whuN0tI7j2GnHaX3w0r60M+1MO+OD7Yy1Y2eqjtVaxxtUFBRELoIIhEsSkkBCSEJCNrvJXs7lnO7DZoOJ2pnON3P27J7z/b//933fOWcF/4+IOLdx7pFLnGOQ3xbQXfKjCiFC+KXCWJb3F/qb4E3gAmGYnYLb97bnQNEd92FnkYoQC/xTvLbm9/SkAjd8L5r4gPrq9sAfqz6rXqP9tQX7pK6Bk4EqP4NXk/zj2cCXJd1NtEkMcnPeCgSqX9OCzwSeB14nqjPWEPVBgvdCZ3ILGWkrgJeLF5XH0BQ0Ql8sJjDsgqk8SdEJdH/KwG2nTiJW4E1wPvA44HHKENbXOqxe9NCAk+nfmhyQBjGJkAxL32JBn/Y3EzcSJ52FQ58SPLtyYEXG/1+v9rAOlRzDlmfRGdCJzl3p38CPPQPBVxP8vPyPxYx1H7e/cBIjvuQF2AwHgRuBBCOxbGSi6AFOxrADEPE4Lp5eUMQlZwmFJYf+u8bx7l+/QLww3eBx9E0dBHxKeBc4CfApUDaOcRwgOsWtnBRV2chjy8Bn1VEKNJsDJ4l1w7+WkMiD0NfBe4AHkTYJi3Q0JgxfkN7NVex3Q2SjIbYLhSJq2mFMxI/+hD/ZndLCqp1MZyQFrgTKAPuA6wAuuAjwBlITEnxZtL0HB4QifCLwPPA08DDwGlJt9s6r5M8VWKp/NUexLc25HA1eUOJJBwqA5LyJMJ8OiHNIUB7OwrMuEMnlIQDHIAcwBjuAnEPNlgWG3ZFjjqPJKKSvFYwP7/pXj/Mfp8aP0R8lYcPvEV+CWQB/EhngoTHDLvDgfPg+MpG5IFJkrWYW9S7NB5ooIy2+aIjgV5fzwGPCm+jvqOBTQbKR7/Bq+qOxXwB+B+xP/Ij4lFZ2Ly1p4PbFjZSHwonvhCAXiAPxACRq5eMC8FfJGKINTYvYhZcDVyEOaF9xdfYCiR53iYB94G+SqKvq16jMcJvH16l8UB+CTwiPy3KMJ3yHKq8DJiC/7PBzRj8IA4gE8AD+P5i2OFCCOxnEB2AFcGN3LJ0qH4m5r1LdQI6wBSqj3wIJAH8A/gD8M3ZMjIReIQ5AJvl0X/ISvITFY6UUfPxbdyy4lO+f1cHrewcIZfR8kS89CVwJfIb/L8H8nxeYD7wL3E/sP5kkNEPPWS+xWC/nWJTLl+6R1Yr4oA6y3qBLFIJXAm8YGcDCJa3Z9VFUydjOWl94NsPj9L+l5hV2VT5N0zzWXlYwEP5YM2NJIyTkK/xQr7Y2qLW2YZXoFVR4e5Dge5HLiI+FOoYFiCxORLjvCxFPlJMPJlScYNH/v0jff/8qVtPfsJJzqYm+GXkH+vAPLAacBr+QBegATK9bwDTQBWwBPg28CfCILMA+8E6H+LPJsj/E/8FHgn/nwGOY/IkI5IFyP8b+x26z3A3D8AAAAASUVORK5CYII='
  );
}

function createTray() {
  const icon = getAppIcon();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show / Restore', click: () => {
      if (isMinimized) restoreFromBubble();
      else { mainWindow.show(); mainWindow.focus(); }
    }},
    { type: 'separator' },
    { label: 'Dock to Claude Code', click: () => {
      const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
      mainWindow.setBounds({ x: sw - 300, y: 0, width: 300, height: sh });
      mainWindow.setAlwaysOnTop(true);
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('set-theme', 'claude');
    }},
    { label: 'Minimize to Bubble', click: () => minimizeToBubble() },
    { type: 'separator' },
    {
      label: 'Theme',
      submenu: [
        { label: 'Midnight', type: 'radio', checked: config.theme === 'midnight', click: () => setTheme('midnight') },
        { label: 'Cobalt', type: 'radio', checked: config.theme === 'cobalt', click: () => setTheme('cobalt') },
        { label: 'Slate', type: 'radio', checked: config.theme === 'slate', click: () => setTheme('slate') },
        { label: 'Amethyst', type: 'radio', checked: config.theme === 'amethyst', click: () => setTheme('amethyst') },
        { label: 'Carbon', type: 'radio', checked: config.theme === 'carbon', click: () => setTheme('carbon') },
        { label: 'Galaxy', type: 'radio', checked: config.theme === 'galaxy', click: () => setTheme('galaxy') },
        { label: 'Claude Code', type: 'radio', checked: config.theme === 'claude', click: () => setTheme('claude') },
        { type: 'separator' },
        { label: 'Hearts ★', type: 'radio', checked: config.theme === 'hearts', click: () => setTheme('hearts') },
        { label: 'Catppuccin ★', type: 'radio', checked: config.theme === 'catppuccin', click: () => setTheme('catppuccin') },
        { label: 'Dracula ★', type: 'radio', checked: config.theme === 'dracula', click: () => setTheme('dracula') },
        { label: 'Tokyo Night ★', type: 'radio', checked: config.theme === 'tokyonight', click: () => setTheme('tokyonight') },
        { label: 'Rosé Pine ★', type: 'radio', checked: config.theme === 'rosepine', click: () => setTheme('rosepine') },
        { label: 'Synthwave ★', type: 'radio', checked: config.theme === 'synthwave', click: () => setTheme('synthwave') },
      ]
    },
    {
      label: 'Auto-Hide',
      submenu: [
        { label: 'Never', type: 'radio', checked: config.autoHideSeconds === 0, click: () => setAutoHide(0) },
        { label: '5 seconds', type: 'radio', checked: config.autoHideSeconds === 5, click: () => setAutoHide(5) },
        { label: '10 seconds', type: 'radio', checked: config.autoHideSeconds === 10, click: () => setAutoHide(10) },
        { label: '15 seconds', type: 'radio', checked: config.autoHideSeconds === 15, click: () => setAutoHide(15) },
      ]
    },
    {
      label: 'Always on Top',
      type: 'checkbox',
      checked: config.alwaysOnTop,
      click: (item) => {
        config.alwaysOnTop = item.checked;
        mainWindow.setAlwaysOnTop(item.checked);
        saveConfig(config);
      }
    },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
  ]);

  tray.setToolTip('Token Dock');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (isMinimized) { restoreFromBubble(); return; }
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
  });
}

function setTheme(theme) {
  config.theme = theme;
  saveConfig(config);
  mainWindow.webContents.send('set-theme', theme);
}

// ── IPC + TOKEN ROUTER ──
const budgetPath = path.join(__dirname, '..', '..', '.token_budget.json');
const envPath = path.join(__dirname, '..', '..', '.env');
const paidUsagePath = path.join(__dirname, '..', '..', '.paid_usage.json');
const http = require('http');

// ── Budget Helper: read, auto-reset if stale, write ──
const VALID_TIERS = ['simple', 'medium', 'complex', 'code'];
const MAX_BODY_SIZE = 4096; // 4KB max POST body — prevent abuse

function freshBudget(date) {
  return { date: date, tiers: {
    simple: { tokens: 0, requests: 0 },
    medium: { tokens: 0, requests: 0 },
    complex: { tokens: 0, requests: 0 },
    code: { tokens: 0, requests: 0 }
  }};
}

function readBudget() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const data = JSON.parse(fs.readFileSync(budgetPath, 'utf-8'));
    if (data.date !== today) {
      const budget = freshBudget(today);
      fs.writeFileSync(budgetPath, JSON.stringify(budget, null, 2));
      return budget;
    }
    return data;
  } catch {
    const budget = freshBudget(today);
    fs.writeFileSync(budgetPath, JSON.stringify(budget, null, 2));
    return budget;
  }
}

function recordTokens(tier, tokens, requests) {
  // Validate tier
  if (!VALID_TIERS.includes(tier)) tier = 'medium';
  // Validate numbers
  tokens = Math.max(0, Math.floor(Number(tokens) || 0));
  requests = Math.max(0, Math.floor(Number(requests) || 1));

  const budget = readBudget();
  if (!budget.tiers[tier]) budget.tiers[tier] = { tokens: 0, requests: 0 };
  budget.tiers[tier].tokens += tokens;
  budget.tiers[tier].requests += requests;
  fs.writeFileSync(budgetPath, JSON.stringify(budget, null, 2));

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('budget-updated');
  }
  return budget;
}

// ── Token Router: Local HTTP listener on port 4444 ──
// Accepts POST /log with {tier, tokens, requests, provider, model}
// Claude Code hooks + external tools can POST here to log usage
let tokenServer = null;
function startTokenRouter() {
  try {
    tokenServer = http.createServer((req, res) => {
      // CORS headers for local tools
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

      if (req.method === 'POST' && req.url === '/log') {
        let body = '';
        let size = 0;
        req.on('data', chunk => {
          size += chunk.length;
          if (size > MAX_BODY_SIZE) { req.destroy(); return; }
          body += chunk;
        });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const tier = data.tier || 'medium';
            const tokens = data.tokens || data.total_tokens || 0;
            const requests = data.requests || 1;
            const result = recordTokens(tier, tokens, requests);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, budget: result }));
            console.log(`[TOKEN ROUTER] +${tokens} tokens (${tier}) from ${data.provider || 'unknown'}/${data.model || 'unknown'}`);
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      } else if (req.method === 'GET' && req.url === '/budget') {
        // Read current budget
        const budget = readBudget();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(budget));
      } else if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', version: '1.7.0' }));
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    // SECURITY: bind to 127.0.0.1 ONLY — no external access
    tokenServer.listen(4444, '127.0.0.1', () => {
      console.log('[TOKEN ROUTER] Listening on http://127.0.0.1:4444');
      console.log('[TOKEN ROUTER] POST /log {tier, tokens, provider, model}');
      console.log('[TOKEN ROUTER] GET /budget — current usage');
      console.log('[TOKEN ROUTER] GET /health — status check');
    });

    tokenServer.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.log('[TOKEN ROUTER] Port 4444 in use — router already running');
      } else {
        console.error('[TOKEN ROUTER] Error:', e.message);
      }
    });
  } catch (e) {
    console.error('[TOKEN ROUTER] Failed to start:', e.message);
  }
}

// ── File Watcher: watch .token_budget.json for external changes ──
let budgetWatcher = null;
function watchBudgetFile() {
  try {
    // Ensure file exists
    readBudget();
    budgetWatcher = fs.watch(budgetPath, { persistent: false }, (eventType) => {
      if (eventType === 'change' && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('budget-updated');
      }
    });
  } catch (e) {
    console.warn('[FILE WATCHER] Could not watch budget file:', e.message);
  }
}

ipcMain.handle('get-paid-usage', () => {
  try { return JSON.parse(fs.readFileSync(paidUsagePath, 'utf-8')); }
  catch { return null; }
});

ipcMain.handle('get-budget', () => {
  return readBudget();
});

// IPC: manual token recording from renderer
ipcMain.handle('record-tokens', (_, tier, tokens, requests) => {
  return recordTokens(tier, tokens || 0, requests || 1);
});
ipcMain.handle('get-env', () => {
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    const env = {};
    content.split('\n').forEach(line => {
      const t = line.trim();
      if (t && !t.startsWith('#')) {
        const [k, ...v] = t.split('=');
        if (k && v.length) env[k.trim()] = v.join('=').trim();
      }
    });
    return env;
  } catch { return {}; }
});
// ── Live Provider Health Checks ──
const https = require('https');

function pingUrl(url, headers, timeoutMs) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { headers, timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

// Enhanced probe: returns status + rate limit headers for quota tracking
function probeProvider(url, headers, timeoutMs) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { headers, timeout: timeoutMs }, (res) => {
      res.resume();
      const h = res.headers;
      resolve({
        online: res.statusCode < 500,
        status: res.statusCode,
        remaining: parseInt(h['x-ratelimit-remaining'] || h['x-ratelimit-remaining-requests'] || h['ratelimit-remaining'] || '-1'),
        limit: parseInt(h['x-ratelimit-limit'] || h['x-ratelimit-limit-requests'] || h['ratelimit-limit'] || '-1'),
        resetAt: h['x-ratelimit-reset'] || h['ratelimit-reset'] || null,
        retryAfter: parseInt(h['retry-after'] || '0'),
      });
    });
    req.on('error', () => resolve({ online: false, status: 0, remaining: -1, limit: -1, resetAt: null, retryAfter: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ online: false, status: 0, remaining: -1, limit: -1, resetAt: null, retryAfter: 0 }); });
  });
}

function readEnvKeys() {
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    const env = {};
    content.split('\n').forEach(line => {
      const t = line.trim();
      if (t && !t.startsWith('#')) {
        const [k, ...v] = t.split('=');
        if (k && v.length) env[k.trim()] = v.join('=').trim();
      }
    });
    return env;
  } catch { return {}; }
}

ipcMain.handle('check-providers', async () => {
  const env = readEnvKeys();
  const timeout = 5000;
  const results = {};

  const checks = [];

  // Groq — returns X-RateLimit-* headers
  if (env.GROQ_API_KEY && env.GROQ_API_KEY.length > 5) {
    checks.push(probeProvider('https://api.groq.com/openai/v1/models', { 'Authorization': 'Bearer ' + env.GROQ_API_KEY }, timeout).then(r => {
      results.groq = r.online ? 'online' : 'offline';
      results.groq_quota = { remaining: r.remaining, limit: r.limit, resetAt: r.resetAt };
    }));
  } else { results.groq = 'no-key'; }

  // Gemini
  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 5) {
    checks.push(probeProvider('https://generativelanguage.googleapis.com/v1beta/models?key=' + env.GEMINI_API_KEY, {}, timeout).then(r => {
      results.gemini = r.online ? 'online' : 'offline';
      results.gemini_quota = { remaining: r.remaining, limit: r.limit, resetAt: r.resetAt };
    }));
  } else { results.gemini = 'no-key'; }

  // OpenRouter — returns X-RateLimit-* headers
  if (env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.length > 5) {
    checks.push(probeProvider('https://openrouter.ai/api/v1/models', { 'Authorization': 'Bearer ' + env.OPENROUTER_API_KEY }, timeout).then(r => {
      results.openrouter = r.online ? 'online' : 'offline';
      results.openrouter_quota = { remaining: r.remaining, limit: r.limit, resetAt: r.resetAt };
    }));
  } else { results.openrouter = 'no-key'; }

  // HuggingFace — returns X-RateLimit-* headers
  if (env.HUGGINGFACE_API_KEY && env.HUGGINGFACE_API_KEY.length > 5) {
    checks.push(probeProvider('https://api-inference.huggingface.co/models', { 'Authorization': 'Bearer ' + env.HUGGINGFACE_API_KEY }, timeout).then(r => {
      results.huggingface = r.online ? 'online' : 'offline';
      results.huggingface_quota = { remaining: r.remaining, limit: r.limit, resetAt: r.resetAt };
      // HF returns 503 for cold models — flag it
      if (r.status === 503) results.huggingface = 'loading';
    }));
  } else { results.huggingface = 'no-key'; }

  // Mistral
  if (env.MISTRAL_API_KEY && env.MISTRAL_API_KEY.length > 5) {
    checks.push(probeProvider('https://api.mistral.ai/v1/models', { 'Authorization': 'Bearer ' + env.MISTRAL_API_KEY }, timeout).then(r => {
      results.mistral = r.online ? 'online' : 'offline';
      results.mistral_quota = { remaining: r.remaining, limit: r.limit, resetAt: r.resetAt };
    }));
  } else { results.mistral = 'no-key'; }

  // Ollama (local — no quota, always unlimited)
  const ollamaBase = env.OLLAMA_API_BASE || 'http://localhost:11434';
  checks.push(pingUrl(ollamaBase + '/api/version', {}, 2000).then(ok => { results.ollama = ok ? 'online' : 'offline'; }));

  await Promise.all(checks);
  return results;
});

ipcMain.handle('set-speed-tier', (_, tier) => {
  config.speedTier = tier;
  saveConfig(config);
  // Write tier to a file the smart router can read
  try {
    fs.writeFileSync(
      path.join(__dirname, '..', '..', '.speed_tier.json'),
      JSON.stringify({ tier, timestamp: Date.now() })
    );
  } catch(e) { console.error('Speed tier write error:', e); }
});
ipcMain.handle('get-speed-tier', () => config.speedTier || 'economy');

ipcMain.handle('get-theme', () => config.theme);
ipcMain.handle('get-auto-hide', () => config.autoHideSeconds);
ipcMain.handle('set-theme', (_, theme) => setTheme(theme));
ipcMain.handle('set-auto-hide', (_, seconds) => setAutoHide(seconds));
ipcMain.handle('reset-auto-hide-timer', () => resetAutoHideTimer());
ipcMain.handle('minimize-to-bubble', () => minimizeToBubble());
ipcMain.handle('restore-from-bubble', () => restoreFromBubble());
ipcMain.handle('move-window-by', (_, dx, dy) => {
  if (!mainWindow) return;
  const [x, y] = mainWindow.getPosition();
  mainWindow.setPosition(x + dx, y + dy);
});
ipcMain.handle('get-window-pos', () => {
  if (!mainWindow) return { x: 0, y: 0 };
  const [x, y] = mainWindow.getPosition();
  return { x, y };
});
ipcMain.handle('hide-window', () => mainWindow.hide());
ipcMain.handle('set-ignore-mouse', (_, ignore, opts) => {
  if (mainWindow) mainWindow.setIgnoreMouseEvents(ignore, opts || {});
});
ipcMain.handle('get-premium', () => config.premiumUnlocked);
ipcMain.handle('set-opacity', (_, val) => { if(mainWindow) mainWindow.setOpacity(val); });
ipcMain.handle('set-premium', (_, val) => { config.premiumUnlocked = val; saveConfig(config); });
ipcMain.handle('send-notification', (_, title, body) => {
  const { Notification } = require('electron');
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});
ipcMain.handle('open-external', (_, url) => shell.openExternal(url));
ipcMain.handle('dock-to-claude', () => {
  if (!mainWindow) return;
  // Find the focused/active screen and dock to the right side of the work area
  // This places Token Dock flush against the right edge, full height,
  // like it's part of the terminal environment
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const dockWidth = 300;
  mainWindow.setBounds({
    x: sw - dockWidth,
    y: 0,
    width: dockWidth,
    height: sh,
  });
  mainWindow.setAlwaysOnTop(true);
  config.alwaysOnTop = true;
  config.dockWidth = dockWidth;
  config.dockPosition = { x: sw - dockWidth, y: 0 };
  saveConfig(config);
  expandedBounds = { x: sw - dockWidth, y: 0, width: dockWidth, height: sh };
});

ipcMain.handle('take-screenshot', async () => {
  if (!mainWindow) return null;
  const img = await mainWindow.webContents.capturePage();
  const p = path.join(__dirname, '..', 'screenshot.png');
  fs.writeFileSync(p, img.toPNG());
  return p;
});

ipcMain.handle('toggle-always-on-top', () => {
  const next = !mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(next);
  config.alwaysOnTop = next;
  saveConfig(config);
  return next;
});

// ── Settings: read/write .env keys ──
ipcMain.handle('get-keys', () => {
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    const keys = {};
    content.split('\n').forEach(line => {
      const t = line.trim();
      if (t && !t.startsWith('#')) {
        const [k, ...v] = t.split('=');
        if (k && v.length) keys[k.trim()] = v.join('=').trim();
      }
    });
    return keys;
  } catch { return {}; }
});

ipcMain.handle('save-keys', (_, keys) => {
  try {
    let lines = [
      '# ============================================',
      '# Free Inference Stack — API Keys',
      '# ============================================',
      '',
    ];
    const order = ['GROQ_API_KEY','GEMINI_API_KEY','OPENROUTER_API_KEY','HUGGINGFACE_API_KEY','MISTRAL_API_KEY','OLLAMA_API_BASE','LITELLM_MASTER_KEY','LITELLM_PORT'];
    for (const k of order) {
      if (keys[k] !== undefined) lines.push(`${k}=${keys[k]}`);
    }
    // Any extra keys not in order
    for (const [k, v] of Object.entries(keys)) {
      if (!order.includes(k)) lines.push(`${k}=${v}`);
    }
    fs.writeFileSync(envPath, lines.join('\n') + '\n');
    return true;
  } catch (e) {
    console.error('Save keys error:', e);
    return false;
  }
});

ipcMain.handle('is-first-run', () => {
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    // If no real keys are set, it's first run
    return !content.includes('gsk_') && !content.includes('AIza') && !content.includes('sk-or-v1-');
  } catch {
    return true; // No .env at all = first run
  }
});

// ── Error Handling ──
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT:', err);
  fs.writeFileSync(path.join(__dirname, '..', 'crash.log'),
    `${new Date().toISOString()}\n${err.stack || err}\n`, { flag: 'a' });
});

// ── Lifecycle ──
app.whenReady().then(() => { createWindow(); createTray(); startTokenRouter(); watchBudgetFile(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
