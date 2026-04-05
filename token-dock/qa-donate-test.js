const { app, BrowserWindow } = require('electron');
const path = require('path');

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 320, height: 600, show: false,
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
    }
  });
  await win.loadFile(path.join(__dirname, 'src', 'index.html'));
  const r = [];
  function log(t,p,d){r.push({t,p,d});console.log(`${p?'PASS':'FAIL'}: ${t} — ${d}`);}

  // Test 1: Premium starts locked
  const startLocked = await win.webContents.executeJavaScript('premiumUnlocked');
  log('Premium starts locked', startLocked===false, `premiumUnlocked: ${startLocked}`);

  // Test 2: Premium toggle button exists and says LOCKED
  const btnText = await win.webContents.executeJavaScript('document.getElementById("premium-toggle")?.textContent');
  log('Button says LOCKED', btnText==='LOCKED', `text: "${btnText}"`);

  // Test 3: Button is visually dimmed (uses .dimmed class, not inline opacity)
  const btnDimmed = await win.webContents.executeJavaScript('document.getElementById("premium-toggle")?.classList.contains("dimmed")');
  log('Button dimmed initially', btnDimmed===true, `has .dimmed: ${btnDimmed}`);

  // Test 4: Try to unlock WITHOUT clicking donate — should be blocked
  await win.webContents.executeJavaScript('togglePremium()');
  const stillLocked1 = await win.webContents.executeJavaScript('premiumUnlocked');
  log('Blocked without donate click', stillLocked1===false, `premiumUnlocked: ${stillLocked1}`);

  // Test 5: Click donate (sets donateClicked=true)
  await win.webContents.executeJavaScript('donateClicked=true; donateOpenTime=Date.now()');
  const clicked = await win.webContents.executeJavaScript('donateClicked');
  log('donateClicked set', clicked===true, `donateClicked: ${clicked}`);

  // Test 6: Try to unlock immediately — should be blocked (25s timer)
  await win.webContents.executeJavaScript('togglePremium()');
  const stillLocked2 = await win.webContents.executeJavaScript('premiumUnlocked');
  log('Blocked before 25s', stillLocked2===false, `premiumUnlocked: ${stillLocked2}`);

  // Test 7: Simulate 25s elapsed
  await win.webContents.executeJavaScript('donateOpenTime = Date.now() - 26000');
  
  // Test 8: Now unlock should work
  await win.webContents.executeJavaScript('togglePremium()');
  const unlocked = await win.webContents.executeJavaScript('premiumUnlocked');
  log('Unlocks after 25s+donate', unlocked===true, `premiumUnlocked: ${unlocked}`);

  // Test 9: Button should say UNLOCKED
  const btnTextAfter = await win.webContents.executeJavaScript('document.getElementById("premium-toggle")?.textContent');
  log('Button says UNLOCKED', btnTextAfter==='UNLOCKED', `text: "${btnTextAfter}"`);

  // Test 10: Button should have .on class
  const hasOn = await win.webContents.executeJavaScript('document.getElementById("premium-toggle")?.classList.contains("on")');
  log('Button has .on class', hasOn===true, `has on: ${hasOn}`);

  // Test 11: Premium themes now selectable in dropdown
  const disabledCount = await win.webContents.executeJavaScript(`
    var sel=document.getElementById('theme-select');
    if(!sel)0;
    else Array.from(sel.options).filter(o=>o.disabled).length;
  `);
  log('Premium themes enabled', disabledCount===0, `${disabledCount} still disabled`);

  // Test 12: Can switch to a premium theme
  await win.webContents.executeJavaScript('selectTheme("dracula")');
  const curT = await win.webContents.executeJavaScript('curTheme');
  log('Can select Dracula', curT==='dracula', `curTheme: ${curT}`);

  // Test 13: Can select hearts theme
  await win.webContents.executeJavaScript('selectTheme("hearts")');
  const curT2 = await win.webContents.executeJavaScript('curTheme');
  log('Can select Hearts', curT2==='hearts', `curTheme: ${curT2}`);

  // Test 14: Premium effect selectable
  await win.webContents.executeJavaScript('selectEffect("confetti")');
  const curE = await win.webContents.executeJavaScript('currentEffect');
  log('Can select confetti effect', curE==='confetti', `currentEffect: ${curE}`);

  // Test 15: Appearance panel accessible (premium gated)
  await win.webContents.executeJavaScript('toggleAppControls()');
  const ctrlDisplay = await win.webContents.executeJavaScript('document.getElementById("app-controls").style.display');
  log('Appearance panel opens', ctrlDisplay==='flex', `display: ${ctrlDisplay}`);

  // Test 16: Toggle premium OFF
  await win.webContents.executeJavaScript('togglePremium()');
  const reLocked = await win.webContents.executeJavaScript('premiumUnlocked');
  log('Can re-lock premium', reLocked===false, `premiumUnlocked: ${reLocked}`);

  // Test 17: Premium themes locked again
  await win.webContents.executeJavaScript('renderTP()');
  const disabledAfter = await win.webContents.executeJavaScript(`
    var sel=document.getElementById('theme-select');
    if(!sel)0;
    else Array.from(sel.options).filter(o=>o.disabled).length;
  `);
  log('Premium themes re-locked', disabledAfter>0, `${disabledAfter} disabled`);

  // Test 18: Premium effect blocked when locked
  await win.webContents.executeJavaScript('selectEffect("sakura")');
  const blockedEffect = await win.webContents.executeJavaScript('currentEffect');
  log('Premium effect blocked when locked', blockedEffect!=='sakura', `currentEffect: ${blockedEffect}`);

  // Summary
  const passed = r.filter(x=>x.p).length;
  const failed = r.filter(x=>!x.p).length;
  console.log(`\n${'='.repeat(50)}`);
  console.log(`DONATE/PREMIUM QA: ${passed} passed, ${failed} failed out of ${r.length}`);
  console.log(`${'='.repeat(50)}`);
  if(failed>0){console.log('\nFAILED:');r.filter(x=>!x.p).forEach(x=>console.log(`  ✗ ${x.t}: ${x.d}`));}

  app.quit();
});
