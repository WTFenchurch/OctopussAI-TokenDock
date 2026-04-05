/**
 * Token Dock — Uninstaller
 * Removes Start Menu and Desktop shortcuts
 * Run: node uninstall.js
 */
const path = require('path');
const fs = require('fs');

const APP_NAME = 'Token Dock';

function remove(dir) {
  const shortcut = path.join(dir, `${APP_NAME}.lnk`);
  if (fs.existsSync(shortcut)) {
    fs.unlinkSync(shortcut);
    console.log(`  Removed: ${shortcut}`);
    return true;
  }
  return false;
}

if (process.platform === 'win32') {
  console.log('Removing Token Dock shortcuts...');
  const startMenu = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs');
  const desktop = path.join(process.env.USERPROFILE, 'Desktop');
  const a = remove(startMenu);
  const b = remove(desktop);
  if (!a && !b) console.log('  No shortcuts found.');
  else console.log('✅ Shortcuts removed.');
}
