// QA Test — runs inside Electron main process after app loads
// Tests the appearance controls by simulating IPC calls

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const results = [];
function log(test, pass, detail) {
  results.push({ test, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${test} — ${detail}`);
}

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const mainPath = path.join(__dirname, 'src', 'main.js');

  // Test 1: main.js loads without errors
  try {
    require(mainPath);
    log('main.js require', false, 'Should not get here — main.js calls app.whenReady which already fired');
  } catch(e) {
    // Expected — main.js tries to create window again
  }

  // Test 2: Create a test window and load index.html
  const win = new BrowserWindow({
    width: 320, height: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    }
  });

  await win.loadFile(path.join(__dirname, 'src', 'index.html'));
  log('index.html loads', true, 'Page loaded without crash');

  // Test 3: Check if render() produced content (not stuck on Loading)
  const content = await win.webContents.executeJavaScript(`document.getElementById('content').innerHTML`);
  const hasLoading = content.includes('>Loading...<');
  const hasSummary = content.includes('Tokens Today');
  log('Dashboard renders', hasSummary && !hasLoading, hasLoading ? 'STUCK ON LOADING' : 'Dashboard rendered');

  // Test 4: Check theme selector exists
  const themeSelect = await win.webContents.executeJavaScript(`document.getElementById('theme-select') !== null`);
  log('Theme selector exists', themeSelect, themeSelect ? 'Found' : 'Missing');

  // Test 5: Check theme selector has options
  const themeCount = await win.webContents.executeJavaScript(`document.getElementById('theme-select') ? document.getElementById('theme-select').options.length : 0`);
  log('Theme options count', themeCount >= 10, `${themeCount} themes`);

  // Test 6: Switch theme and verify CSS var changes
  const beforeAccent = await win.webContents.executeJavaScript(`getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()`);
  await win.webContents.executeJavaScript(`document.documentElement.setAttribute('data-theme','dracula')`);
  const afterAccent = await win.webContents.executeJavaScript(`getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()`);
  log('Theme switch changes CSS', beforeAccent !== afterAccent, `Before: ${beforeAccent}, After: ${afterAccent}`);
  // Reset
  await win.webContents.executeJavaScript(`document.documentElement.setAttribute('data-theme','midnight')`);

  // Test 7: Appearance panel toggle
  const appCtrlsBefore = await win.webContents.executeJavaScript(`document.getElementById('app-controls').style.display`);
  log('Appearance panel hidden initially', appCtrlsBefore === 'none' || appCtrlsBefore === '', `display: "${appCtrlsBefore}"`);

  // Test 8: Check shimmer overlay exists
  const shimmerExists = await win.webContents.executeJavaScript(`document.getElementById('shimmer-front') !== null`);
  log('Shimmer overlay exists', shimmerExists, shimmerExists ? 'Found' : 'Missing');

  // Test 9: Toggle shimmer via JS
  await win.webContents.executeJavaScript(`toggleShimmerBtn()`);
  const shimmerOn = await win.webContents.executeJavaScript(`shimmerOn`);
  log('Shimmer toggles on', shimmerOn === true, `shimmerOn: ${shimmerOn}`);
  const shimmerActive = await win.webContents.executeJavaScript(`document.getElementById('shimmer-front').classList.contains('active')`);
  log('Shimmer overlay active', shimmerActive, `active class: ${shimmerActive}`);
  // Toggle off
  await win.webContents.executeJavaScript(`toggleShimmerBtn()`);
  const shimmerOff = await win.webContents.executeJavaScript(`shimmerOn`);
  log('Shimmer toggles off', shimmerOff === false, `shimmerOn: ${shimmerOff}`);

  // Test 10: Opacity adjustment
  const opBefore = await win.webContents.executeJavaScript(`appOpacity`);
  await win.webContents.executeJavaScript(`adjustOpacity(-10)`);
  const opAfter = await win.webContents.executeJavaScript(`appOpacity`);
  log('Opacity decreases', opAfter < opBefore, `Before: ${opBefore}, After: ${opAfter}`);
  await win.webContents.executeJavaScript(`adjustOpacity(10)`); // reset

  // Test 11: Check rain toggle
  await win.webContents.executeJavaScript(`
    document.documentElement.setAttribute('data-theme','catppuccin');
    curTheme='catppuccin';
    premiumUnlocked=true;
  `);
  const rainConfigExists = await win.webContents.executeJavaScript(`!!THEME_RAIN_CONFIG['catppuccin']`);
  log('Rain config exists for catppuccin', rainConfigExists, `exists: ${rainConfigExists}`);

  // Test 12: Start theme rain
  await win.webContents.executeJavaScript(`startThemeRain()`);
  const rainOn = await win.webContents.executeJavaScript(`themeRainOn`);
  log('Theme rain starts', rainOn === true, `themeRainOn: ${rainOn}`);
  const rainActive = await win.webContents.executeJavaScript(`document.getElementById('theme-rain').classList.contains('active')`);
  log('Rain overlay active', rainActive, `active class: ${rainActive}`);
  // Stop
  await win.webContents.executeJavaScript(`stopThemeRain()`);

  // Test 13: Hearts donate
  await win.webContents.executeJavaScript(`toggleDonate()`);
  const heartsMode = await win.webContents.executeJavaScript(`document.body.classList.contains('hearts-mode')`);
  log('Hearts mode on donate', heartsMode, `hearts-mode: ${heartsMode}`);
  await win.webContents.executeJavaScript(`toggleDonate()`); // close

  // Test 14: Section collapse
  const sections = await win.webContents.executeJavaScript(`document.querySelectorAll('[data-action="togSection"]').length`);
  log('Section headers exist', sections >= 3, `${sections} sections`);

  // Test 15: Data-action count
  const actionCount = await win.webContents.executeJavaScript(`document.querySelectorAll('[data-action]').length`);
  log('Data-action elements', actionCount >= 20, `${actionCount} actionable elements`);

  // Test 16: No inline onclick handlers
  const inlineHandlers = await win.webContents.executeJavaScript(`document.querySelectorAll('[onclick],[onchange],[oninput]').length`);
  log('Zero inline handlers', inlineHandlers === 0, `${inlineHandlers} inline handlers found`);

  // Test 17: Effect select exists
  const effectSelect = await win.webContents.executeJavaScript(`document.getElementById('effect-select') !== null`);
  log('Effect selector exists', effectSelect, effectSelect ? 'Found' : 'Missing');

  // Test 18: Flip animation
  await win.webContents.executeJavaScript(`toggleSettings()`);
  const flipped = await win.webContents.executeJavaScript(`settingsOpen`);
  log('Settings flip opens', flipped === true, `settingsOpen: ${flipped}`);
  await win.webContents.executeJavaScript(`toggleSettings()`); // close

  // ── Budget Gauge Tests ──

  // Test 19: Set fake budget data and verify bar widths
  const barWidths = await win.webContents.executeJavaScript(`
    TB.simple.used = 30000; TB.simple.req = 12;
    TB.medium.used = 70000; TB.medium.req = 25;
    TB.complex.used = 180000; TB.complex.req = 8;
    TB.code.used = 150000; TB.code.req = 40;
    budgetConnOk = true; budgetLastUpdated = Date.now();
    render();
    Array.from(document.querySelectorAll('.mr-fill')).map(el => parseInt(el.style.width));
  `);
  // simple=60%, medium=70%, complex=90%, code=100%
  const expectedWidths = [60, 70, 90, 100];
  const widthsMatch = barWidths.length === 4 && barWidths.every((w, i) => w === expectedWidths[i]);
  log('Budget bar widths correct', widthsMatch, `Expected [${expectedWidths}], got [${barWidths}]`);

  // Test 20: Verify bar color classes
  const barClasses = await win.webContents.executeJavaScript(`
    Array.from(document.querySelectorAll('.mr-fill')).map(el => {
      if (el.classList.contains('fill-red')) return 'red';
      if (el.classList.contains('fill-yellow')) return 'yellow';
      if (el.classList.contains('fill-green')) return 'green';
      return 'none';
    });
  `);
  // simple 60% -> yellow(60-85), medium 70% -> yellow, complex 90% -> red, code 100% -> red
  const expectedColors = ['yellow', 'yellow', 'red', 'red'];
  const colorsMatch = barClasses.length === 4 && barClasses.every((c, i) => c === expectedColors[i]);
  log('Budget bar colors correct', colorsMatch, `Expected [${expectedColors}], got [${barClasses}]`);

  // Test 21: Verify pulse animation classes (active for non-zero)
  const pulseClasses = await win.webContents.executeJavaScript(`
    Array.from(document.querySelectorAll('.mr-fill')).map(el => el.classList.contains('active'));
  `);
  const allActive = pulseClasses.every(c => c === true);
  log('Budget bars pulse when active', allActive, `Active states: [${pulseClasses}]`);

  // Test 22: Verify idle state for zero usage
  const idleCheck = await win.webContents.executeJavaScript(`
    TB.simple.used = 0; TB.simple.req = 0;
    render();
    document.querySelector('.mr-fill').classList.contains('idle');
  `);
  log('Budget bar idle when zero', idleCheck, `idle class: ${idleCheck}`);

  // Test 23: Request count badges shown
  const reqBadges = await win.webContents.executeJavaScript(`
    TB.simple.used = 5000; TB.simple.req = 5;
    render();
    Array.from(document.querySelectorAll('.mr-req')).map(el => el.textContent);
  `);
  const hasReqBadges = reqBadges.length >= 1 && reqBadges.some(b => b.includes('req'));
  log('Request count badges shown', hasReqBadges, `Badges: ${JSON.stringify(reqBadges)}`);

  // Test 24: Connection status dot exists (set budgetConnOk first since no IPC in test)
  const connDot = await win.webContents.executeJavaScript(`
    budgetConnOk = true; render();
    var dot = document.querySelector('.li-dot') || document.querySelector('.budget-dot');
    dot !== null && (dot.classList.contains('connected') || dot.classList.contains('ok'));
  `);
  log('Connection status dot shown', connDot, `dot connected: ${connDot}`);

  // Test 25: Budget timestamp exists
  const tsExists = await win.webContents.executeJavaScript(`
    const el = document.getElementById('budget-ts');
    el !== null && el.textContent !== '--';
  `);
  log('Budget timestamp shown', tsExists, `timestamp exists: ${tsExists}`);

  // Test 26: Radial gauge dashoffset calculation (premium mode)
  const radialCheck = await win.webContents.executeJavaScript(`
    premiumUnlocked = true;
    meterStyle = 'radial';
    TB.simple.used = 25000; TB.simple.cap = 50000; // 50%
    TB.medium.used = 85000; TB.medium.cap = 100000; // 85%
    render();
    const fills = Array.from(document.querySelectorAll('.gauge-fill'));
    if (fills.length === 0) { 'no-gauges'; }
    else {
      const r = 22;
      const circ = 2 * Math.PI * r;
      // First gauge: simple 50% -> offset = circ * 0.5
      const expectedOffset = circ * (1 - 50/100);
      const actualOffset = parseFloat(fills[0].getAttribute('stroke-dashoffset'));
      Math.abs(actualOffset - expectedOffset) < 0.1 ? 'match' : 'off:' + actualOffset + ' vs ' + expectedOffset;
    }
  `);
  log('Radial gauge dashoffset correct', radialCheck === 'match', `Result: ${radialCheck}`);

  // Test 27: Radial gauge color classes
  const radialColors = await win.webContents.executeJavaScript(`
    const fills = Array.from(document.querySelectorAll('.gauge-fill'));
    fills.map(el => {
      if (el.classList.contains('g-red')) return 'red';
      if (el.classList.contains('g-yellow')) return 'yellow';
      if (el.classList.contains('g-green')) return 'green';
      return 'none';
    });
  `);
  // simple 50% -> green, medium 85% -> red (>85 is red, 85 exactly is yellow boundary: p<85 yellow -> 85 is red)
  const radialGreen = radialColors.length >= 1 && radialColors[0] === 'green';
  log('Radial gauge colors correct', radialGreen, `First gauge (50%): ${radialColors[0]}, all: [${radialColors}]`);

  // Reset meter style
  await win.webContents.executeJavaScript(`meterStyle='bar'; premiumUnlocked=false; render();`);

  // Summary
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n${'='.repeat(50)}`);
  console.log(`QA RESULTS: ${passed} passed, ${failed} failed out of ${results.length}`);
  console.log(`${'='.repeat(50)}`);

  if (failed > 0) {
    console.log('\nFAILED TESTS:');
    results.filter(r => !r.pass).forEach(r => console.log(`  ✗ ${r.test}: ${r.detail}`));
  }

  // Write results to file
  fs.writeFileSync(path.join(__dirname, 'qa-results.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(__dirname, 'qa-results.txt'),
    results.map(r => `${r.pass ? 'PASS' : 'FAIL'}: ${r.test} — ${r.detail}`).join('\n') +
    `\n\n${passed} passed, ${failed} failed out of ${results.length}`
  );

  app.quit();
});
